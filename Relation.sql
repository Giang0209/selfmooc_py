-- =============================================================
--  LMS PostgreSQL Schema
--  Phiên bản: 2.0  |  Kiến trúc: Hybrid (Postgres + MongoDB)
--
--  Nguyên tắc phân tách:
--    Postgres  →  identity, relationships, grades, scheduling
--    MongoDB   →  flexible content (question body, submissions,
--                 documents, notifications, activity logs)
--
--  Quy ước mongo_id:
--    Mỗi bảng có nội dung linh hoạt giữ một cột mongo_id TEXT
--    để trỏ sang ObjectId tương ứng trong MongoDB.
--    Không dùng FK — integrity do application layer đảm bảo.
-- =============================================================


-- -------------------------------------------------------------
-- Extensions
-- -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram search cho name


-- =============================================================
-- 1. IDENTITY & AUTH
-- =============================================================

CREATE TABLE teacher (
    teacher_id   SERIAL PRIMARY KEY,
    email        VARCHAR(128) UNIQUE NOT NULL,
    phone        VARCHAR(20),
    name         VARCHAR(128) NOT NULL,
    password_hash TEXT NOT NULL,
    dob          DATE,
    avatar_url   TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student (
    student_id   SERIAL PRIMARY KEY,
    name         VARCHAR(128) NOT NULL,
    password_hash TEXT NOT NULL,
    dob          DATE,
    avatar_url   TEXT,
    student_code VARCHAR(32) UNIQUE,           -- mã số sinh viên
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parent (
    parent_id    SERIAL PRIMARY KEY,
    email        VARCHAR(128) UNIQUE NOT NULL,
    phone        VARCHAR(20),
    name         VARCHAR(128) NOT NULL,
    password_hash TEXT NOT NULL,
    dob          DATE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quan hệ phụ huynh ↔ học sinh (nhiều-nhiều)
CREATE TABLE parent_student (
    parent_id    INTEGER NOT NULL REFERENCES parent(parent_id)   ON DELETE CASCADE,
    student_id   INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    relationship VARCHAR(32),                  -- 'mother', 'father', 'guardian'
    PRIMARY KEY (parent_id, student_id)
);


-- =============================================================
-- 2. COURSE & CLASS
-- =============================================================

CREATE TABLE course (
    course_id    SERIAL PRIMARY KEY,
    name         VARCHAR(128) NOT NULL,
    code         VARCHAR(32) UNIQUE,           -- mã môn học
    description  TEXT,
    created_by   INTEGER REFERENCES teacher(teacher_id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lớp học là một instance của Course
-- schedule tách ra bảng riêng (class_schedule)
-- document_bank và question_bank KHÔNG còn ở đây nữa
--   → xem bảng document và question bên dưới
CREATE TABLE class (
    class_id     SERIAL PRIMARY KEY,
    course_id    INTEGER NOT NULL REFERENCES course(course_id)   ON DELETE CASCADE,
    teacher_id   INTEGER          REFERENCES teacher(teacher_id) ON DELETE SET NULL,
    name         VARCHAR(128) NOT NULL,
    academic_year VARCHAR(16),                 -- e.g. '2024-2025'
    semester     SMALLINT CHECK (semester IN (1,2,3)),
    start_date   DATE,
    end_date     DATE,
    max_students SMALLINT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lịch học theo slot (thay cho schedule JSONB)
CREATE TABLE class_schedule (
    schedule_id  SERIAL PRIMARY KEY,
    class_id     INTEGER NOT NULL REFERENCES class(class_id) ON DELETE CASCADE,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),  -- 1=Mon
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    room         VARCHAR(64),
    UNIQUE (class_id, day_of_week, start_time)
);

-- Sinh viên tham gia lớp
CREATE TABLE enrollment (
    student_id   INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    class_id     INTEGER NOT NULL REFERENCES class(class_id)     ON DELETE CASCADE,
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status       VARCHAR(16) NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','dropped','completed')),
    -- Điểm tổng kết (do giảng viên nhập hoặc tính tự động)
    midterm_grade  DECIMAL(4,2) CHECK (midterm_grade  BETWEEN 0 AND 10),
    final_grade    DECIMAL(4,2) CHECK (final_grade    BETWEEN 0 AND 10),
    overall_grade  DECIMAL(4,2) CHECK (overall_grade  BETWEEN 0 AND 10),
    grade_status   VARCHAR(16) DEFAULT 'pending'
                     CHECK (grade_status IN ('pending','published')),
    PRIMARY KEY (student_id, class_id)
);


-- =============================================================
-- 3. QUESTION BANK
-- =============================================================

-- Metadata câu hỏi — nội dung thực (text, options, answer, media)
-- nằm trong MongoDB collection "question_content" (trỏ qua mongo_id)
CREATE TABLE question (
    question_id  SERIAL PRIMARY KEY,
    course_id    INTEGER NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    created_by   INTEGER REFERENCES teacher(teacher_id) ON DELETE SET NULL,

    -- phân loại
    question_type  VARCHAR(32) NOT NULL
                       CHECK (question_type IN (
                           'multiple_choice','multiple_select',
                           'true_false','short_answer','essay','fill_blank'
                       )),
    chapter      VARCHAR(128),
    topic        VARCHAR(128),
    difficulty   SMALLINT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),

    -- trỏ sang MongoDB để lấy nội dung (đề, đáp án, giải thích, ảnh…)
    mongo_id     TEXT NOT NULL,

    -- thống kê (cập nhật async)
    times_used   INTEGER NOT NULL DEFAULT 0,
    avg_score    DECIMAL(4,3),                 -- tỉ lệ trả lời đúng [0,1]

    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cho phép lớp "bổ sung" câu hỏi riêng ngoài ngân hàng chung của Course
-- (thay vì question_bank JSONB trong class)
CREATE TABLE class_question (
    class_id     INTEGER NOT NULL REFERENCES class(class_id)       ON DELETE CASCADE,
    question_id  INTEGER NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
    added_by     INTEGER REFERENCES teacher(teacher_id) ON DELETE SET NULL,
    added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (class_id, question_id)
);


-- =============================================================
-- 4. DOCUMENT BANK
-- =============================================================

-- Metadata tài liệu — nội dung file nằm trong MongoDB "document_content"
CREATE TABLE document (
    document_id  SERIAL PRIMARY KEY,
    class_id     INTEGER          REFERENCES class(class_id)       ON DELETE CASCADE,
    course_id    INTEGER          REFERENCES course(course_id)     ON DELETE CASCADE,
    uploaded_by  INTEGER REFERENCES teacher(teacher_id) ON DELETE SET NULL,

    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    doc_type     VARCHAR(32) NOT NULL
                     CHECK (doc_type IN ('lecture','exercise','reference','video','other')),
    chapter      VARCHAR(128),
    file_ext     VARCHAR(16),                  -- 'pdf','docx','mp4'...
    file_size_kb INTEGER,
    --mongo_id     TEXT NOT NULL,   
    file_url        TEXT NOT NULL,
    cloudinary_id   TEXT NOT NULL,             -- → MongoDB document_content

    is_visible   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- class_id hoặc course_id phải có ít nhất một
    CONSTRAINT doc_scope_check CHECK (
        class_id IS NOT NULL OR course_id IS NOT NULL
    )
);


-- =============================================================
-- 5. ASSIGNMENT & GRADING
-- =============================================================

CREATE TABLE assignment (
    assignment_id  SERIAL PRIMARY KEY,
    class_id       INTEGER NOT NULL REFERENCES class(class_id) ON DELETE CASCADE,
    created_by     INTEGER REFERENCES teacher(teacher_id) ON DELETE SET NULL,

    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    chapter        VARCHAR(128),
    assignment_type VARCHAR(32) NOT NULL DEFAULT 'homework'
                       CHECK (assignment_type IN ('homework','quiz','midterm','final','practice')),

    -- cấu hình điểm
    total_points   DECIMAL(6,2) NOT NULL DEFAULT 100,
    pass_points    DECIMAL(6,2),               -- điểm đạt tối thiểu
    weight         DECIMAL(4,3),               -- trọng số trong điểm tổng kết [0,1]

    -- thời gian
    available_from TIMESTAMPTZ,
    due_date       TIMESTAMPTZ,
    time_limit_min SMALLINT,                   -- NULL = không giới hạn

    -- cấu hình thi
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    max_attempts      SMALLINT NOT NULL DEFAULT 1,
    show_answer_after BOOLEAN NOT NULL DEFAULT FALSE,

    is_published   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Danh sách câu hỏi trong một đề (thay cho selected_questions JSONB)
CREATE TABLE assignment_question (
    assignment_id  INTEGER NOT NULL REFERENCES assignment(assignment_id) ON DELETE CASCADE,
    question_id    INTEGER NOT NULL REFERENCES question(question_id)     ON DELETE RESTRICT,
    display_order  SMALLINT NOT NULL DEFAULT 0,
    points         DECIMAL(6,2) NOT NULL DEFAULT 1,   -- điểm câu này trong đề
    PRIMARY KEY (assignment_id, question_id)
);

-- Bài nộp của sinh viên
-- Nội dung chi tiết (answers[], files[]) nằm trong MongoDB "submission_content"
CREATE TABLE submission (
    submission_id  SERIAL PRIMARY KEY,
    assignment_id  INTEGER NOT NULL REFERENCES assignment(assignment_id) ON DELETE CASCADE,
    student_id     INTEGER NOT NULL REFERENCES student(student_id)       ON DELETE CASCADE,
    attempt_number SMALLINT NOT NULL DEFAULT 1,

    -- trỏ sang MongoDB để lấy nội dung bài làm
    mongo_id       TEXT,

    -- kết quả chấm điểm
    score          DECIMAL(6,2),
    max_score      DECIMAL(6,2),
    grade          DECIMAL(4,2) CHECK (grade is NULL OR( grade BETWEEN 0 AND 10)),
    graded_by      INTEGER REFERENCES teacher(teacher_id) ON DELETE SET NULL,
    graded_at      TIMESTAMPTZ,
    feedback       TEXT,                       -- nhận xét tổng (chi tiết per-question ở Mongo)

    -- trạng thái
    status         VARCHAR(16) NOT NULL DEFAULT 'submitted'
                       CHECK (status IN ('draft','submitted','grading','graded','returned')),

    submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (assignment_id, student_id, attempt_number)
);


-- =============================================================
-- 6. ATTENDANCE (tùy chọn — hỗ trợ theo dõi tiến độ)
-- =============================================================

CREATE TABLE attendance (
    attendance_id  SERIAL PRIMARY KEY,
    class_id       INTEGER NOT NULL REFERENCES class(class_id)     ON DELETE CASCADE,
    student_id     INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    schedule_id    INTEGER REFERENCES class_schedule(schedule_id)  ON DELETE SET NULL,
    session_date   DATE NOT NULL,
    status         VARCHAR(16) NOT NULL DEFAULT 'present'
                       CHECK (status IN ('present','absent','late','excused')),
    note           TEXT,
    recorded_by    INTEGER REFERENCES teacher(teacher_id) ON DELETE SET NULL,
    recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (class_id, student_id, session_date)
);


-- =============================================================
-- 7. INDEXES
-- =============================================================

-- Auth lookups
CREATE INDEX idx_student_code ON student(student_code);
CREATE INDEX idx_teacher_email  ON teacher(email);

-- Class queries
CREATE INDEX idx_class_course   ON class(course_id);
CREATE INDEX idx_class_teacher  ON class(teacher_id);
CREATE INDEX idx_enrollment_class   ON enrollment(class_id);
CREATE INDEX idx_enrollment_student ON enrollment(student_id);

-- Question bank
CREATE INDEX idx_question_course    ON question(course_id);
CREATE INDEX idx_question_chapter   ON question(chapter);
CREATE INDEX idx_question_difficulty ON question(difficulty);
CREATE INDEX idx_question_type      ON question(question_type);

-- Document lookup
CREATE INDEX idx_document_class     ON document(class_id);
CREATE INDEX idx_document_course    ON document(course_id);

-- Assignment & submission (hot path)
CREATE INDEX idx_assignment_class   ON assignment(class_id);
CREATE INDEX idx_assignment_due     ON assignment(due_date) WHERE is_published = TRUE;
CREATE INDEX idx_submission_assignment ON submission(assignment_id);
CREATE INDEX idx_submission_student    ON submission(student_id);
CREATE INDEX idx_submission_status     ON submission(status);

-- Attendance
CREATE INDEX idx_attendance_class_date ON attendance(class_id, session_date);
CREATE INDEX idx_attendance_student    ON attendance(student_id);

-- Full-text name search 
CREATE INDEX idx_student_name_trgm ON student USING gin(name gin_trgm_ops);
CREATE INDEX idx_teacher_name_trgm ON teacher USING gin(name gin_trgm_ops);


-- =============================================================
-- 8. UPDATED_AT TRIGGER (áp dụng cho mọi bảng có updated_at)
-- =============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_teacher_updated_at
    BEFORE UPDATE ON teacher
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_student_updated_at
    BEFORE UPDATE ON student
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_course_updated_at
    BEFORE UPDATE ON course
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_class_updated_at
    BEFORE UPDATE ON class
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_question_updated_at
    BEFORE UPDATE ON question
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_assignment_updated_at
    BEFORE UPDATE ON assignment
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_submission_updated_at
    BEFORE UPDATE ON submission
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Chạy lệnh ALTER TABLE này trong Postgres của bạn
ALTER TABLE course 
ADD COLUMN thumbnail_url TEXT,               -- Hình ảnh bìa (VD: con hổ, tên lửa, quả táo)
ADD COLUMN theme_color VARCHAR(16),          -- Mã màu nền cho thẻ khóa học (VD: '#FFB6C1', '#87CEEB')
ADD COLUMN is_published BOOLEAN DEFAULT FALSE; -- Ẩn/hiện khóa học (Giáo viên soạn xong mới bật lên)