// =============================================================
//  LMS MongoDB Schema
//  Phiên bản: 2.0  |  Kiến trúc: Hybrid (Postgres + MongoDB)
//
//  Chạy file này với:  mongosh lms_db mongo_schema.js
//
//  Quy ước:
//    - Mỗi document có _id (ObjectId, tự sinh)
//    - pg_id lưu ID tương ứng bên Postgres (để cross-reference)
//    - Timestamps dùng Date object (ISODate)
//    - Validator dùng $jsonSchema để ép kiểu tối thiểu
// =============================================================

const db = db.getSiblingDB("lms_db");


// =============================================================
// 1. QUESTION CONTENT
//    Nội dung câu hỏi — trỏ từ question.mongo_id (Postgres)
//
//    Hỗ trợ nhiều dạng câu hỏi:
//      multiple_choice  → options[], correct_index
//      multiple_select  → options[], correct_indices[]
//      true_false       → correct_answer: true/false
//      short_answer     → sample_answer, keywords[]
//      essay            → rubric[], sample_answer
//      fill_blank       → blanks[{ position, answer, alternatives[] }]
// =============================================================

db.createCollection("question_content", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["pg_question_id", "question_type", "text", "created_at"],
            properties: {
                pg_question_id: {
                    bsonType: "int",
                    description: "FK → question.question_id (Postgres)"
                },
                question_type: {
                    enum: ["multiple_choice","multiple_select",
                           "true_false","short_answer","essay","fill_blank"],
                    description: "Phải khớp với question.question_type"
                },
                text: {
                    bsonType: "string",
                    description: "Nội dung câu hỏi (markdown hoặc HTML)"
                },
                // ---- multiple_choice / multiple_select ----
                options: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["label","text"],
                        properties: {
                            label:       { bsonType: "string" },  // "A","B","C"...
                            text:        { bsonType: "string" },
                            is_correct:  { bsonType: "bool" },
                            explanation: { bsonType: "string" }   // giải thích tại sao đúng/sai
                        }
                    }
                },
                // ---- true_false ----
                correct_answer: { bsonType: "bool" },
                // ---- short_answer / fill_blank ----
                sample_answer: { bsonType: "string" },
                keywords:      { bsonType: "array", items: { bsonType: "string" } },
                // ---- fill_blank ----
                blanks: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["position","answer"],
                        properties: {
                            position:     { bsonType: "int" },
                            answer:       { bsonType: "string" },
                            alternatives: { bsonType: "array",
                                            items: { bsonType: "string" } },
                            case_sensitive: { bsonType: "bool" }
                        }
                    }
                },
                // ---- essay ----
                rubric: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["criterion","max_points"],
                        properties: {
                            criterion:   { bsonType: "string" },
                            max_points:  { bsonType: "double" },
                            description: { bsonType: "string" }
                        }
                    }
                },
                // ---- media (dùng chung mọi loại) ----
                media: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["type","url"],
                        properties: {
                            type:    { enum: ["image","audio","video","latex"] },
                            url:     { bsonType: "string" },
                            caption: { bsonType: "string" },
                            position: { enum: ["question","option_A","option_B",
                                               "option_C","option_D","explanation"] }
                        }
                    }
                },
                // ---- auto-grading config ----
                auto_grade:     { bsonType: "bool" },
                grading_script: { bsonType: "string" }, // code snippet cho custom grading
                explanation:    { bsonType: "string" },  // giải thích tổng sau khi nộp
                tags:           { bsonType: "array", items: { bsonType: "string" } },
                created_at:     { bsonType: "date" },
                updated_at:     { bsonType: "date" }
            }
        }
    }
});

// Indexes
db.question_content.createIndex({ pg_question_id: 1 }, { unique: true });
db.question_content.createIndex({ tags: 1 });


// =============================================================
// 2. SUBMISSION CONTENT
//    Bài làm chi tiết của sinh viên
//    Trỏ từ submission.mongo_id (Postgres)
// =============================================================

db.createCollection("submission_content", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["pg_submission_id","pg_assignment_id","pg_student_id",
                       "answers","submitted_at"],
            properties: {
                pg_submission_id: { bsonType: "int" },
                pg_assignment_id: { bsonType: "int" },
                pg_student_id:    { bsonType: "int" },
                attempt_number:   { bsonType: "int" },

                // Mảng câu trả lời, index khớp với assignment_question.display_order
                answers: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["pg_question_id"],
                        properties: {
                            pg_question_id: { bsonType: "int" },
                            question_type:  { bsonType: "string" },
                            // Câu trả lời thực tế (chỉ 1 trong các field dưới có giá trị)
                            selected_index:   { bsonType: "int" },        // multiple_choice
                            selected_indices: { bsonType: "array",
                                               items: { bsonType: "int" } }, // multiple_select
                            bool_answer:      { bsonType: "bool" },        // true_false
                            text_answer:      { bsonType: "string" },      // short_answer/essay
                            blank_answers:    { bsonType: "array",         // fill_blank
                                               items: { bsonType: "string" } },
                            file_urls:        { bsonType: "array",         // essay với file đính kèm
                                               items: { bsonType: "string" } },
                            // Kết quả chấm từng câu
                            is_correct:     { bsonType: "bool" },
                            points_earned:  { bsonType: "double" },
                            points_max:     { bsonType: "double" },
                            auto_graded:    { bsonType: "bool" },
                            teacher_comment: { bsonType: "string" },
                            // Thời gian làm từng câu (giây)
                            time_spent_sec: { bsonType: "int" }
                        }
                    }
                },

                // File đính kèm toàn bài (essay, project)
                attachments: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["url","filename"],
                        properties: {
                            url:        { bsonType: "string" },
                            filename:   { bsonType: "string" },
                            file_type:  { bsonType: "string" },
                            size_kb:    { bsonType: "int" }
                        }
                    }
                },

                // Meta làm bài
                started_at:       { bsonType: "date" },
                submitted_at:     { bsonType: "date" },
                total_time_sec:   { bsonType: "int" },
                ip_address:       { bsonType: "string" },
                user_agent:       { bsonType: "string" },

                // Nhận xét của giáo viên (rich text)
                teacher_feedback: { bsonType: "string" }
            }
        }
    }
});

db.submission_content.createIndex({ pg_submission_id: 1 }, { unique: true });
db.submission_content.createIndex({ pg_assignment_id: 1, pg_student_id: 1 });


// =============================================================
// 3. DOCUMENT CONTENT
//    Nội dung tài liệu học
//    Trỏ từ document.mongo_id (Postgres)
// =============================================================

db.createCollection("document_content", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["pg_document_id","title","storage_url","created_at"],
            properties: {
                pg_document_id: { bsonType: "int" },
                title:          { bsonType: "string" },
                storage_url:    { bsonType: "string" },  // S3/GCS URL
                cdn_url:        { bsonType: "string" },  // CDN URL cho preview

                // Trang (dùng cho PDF/slide đã được xử lý)
                pages: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["page_number","thumbnail_url"],
                        properties: {
                            page_number:   { bsonType: "int" },
                            thumbnail_url: { bsonType: "string" },
                            text_content:  { bsonType: "string" },  // OCR text để search
                        }
                    }
                },

                // Video metadata
                video_meta: {
                    bsonType: "object",
                    properties: {
                        duration_sec:  { bsonType: "int" },
                        resolution:    { bsonType: "string" },
                        subtitles_url: { bsonType: "string" },
                        chapters: {
                            bsonType: "array",
                            items: {
                                bsonType: "object",
                                properties: {
                                    title:      { bsonType: "string" },
                                    start_sec:  { bsonType: "int" }
                                }
                            }
                        }
                    }
                },

                // Full-text content (cho search engine)
                searchable_text: { bsonType: "string" },

                processing_status: {
                    enum: ["pending","processing","done","failed"]
                },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});

db.document_content.createIndex({ pg_document_id: 1 }, { unique: true });
db.document_content.createIndex({ searchable_text: "text", title: "text" });


// =============================================================
// 4. NOTIFICATION
//    Thông báo cho teacher / student / parent
//    Không có bảng tương ứng ở Postgres
// =============================================================

db.createCollection("notification", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["recipient_id","recipient_type","type","title","created_at"],
            properties: {
                recipient_id: {
                    bsonType: "int",
                    description: "pg_id của teacher/student/parent"
                },
                recipient_type: {
                    enum: ["student","teacher","parent"]
                },
                type: {
                    enum: [
                        "assignment_published",   // đề mới được publish
                        "assignment_due_soon",    // sắp đến hạn (24h/1h)
                        "submission_graded",      // bài được chấm
                        "grade_published",        // điểm tổng kết được công bố
                        "class_announcement",     // thông báo từ giảng viên
                        "attendance_warning",     // vắng quá nhiều buổi
                        "system"                  // thông báo hệ thống
                    ]
                },
                title:   { bsonType: "string" },
                body:    { bsonType: "string" },

                // Data payload linh hoạt theo type
                // VD: { assignment_id: 42, class_name: "Toán A1" }
                payload: { bsonType: "object" },

                // Trạng thái gửi
                channels: {
                    bsonType: "object",
                    properties: {
                        in_app:  {
                            bsonType: "object",
                            properties: {
                                sent:    { bsonType: "bool" },
                                read_at: { bsonType: "date" }
                            }
                        },
                        email: {
                            bsonType: "object",
                            properties: {
                                sent:    { bsonType: "bool" },
                                sent_at: { bsonType: "date" },
                                error:   { bsonType: "string" }
                            }
                        },
                        sms: {
                            bsonType: "object",
                            properties: {
                                sent:    { bsonType: "bool" },
                                sent_at: { bsonType: "date" }
                            }
                        }
                    }
                },

                is_read:    { bsonType: "bool" },  // shortcut cho in_app.read_at IS NOT NULL
                created_at: { bsonType: "date" },
                expires_at: { bsonType: "date" }   // TTL field
            }
        }
    }
});

db.notification.createIndex({ recipient_id: 1, recipient_type: 1, created_at: -1 });
db.notification.createIndex({ recipient_id: 1, is_read: 1 });
db.notification.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete


// =============================================================
// 5. ACTIVITY LOG
//    Theo dõi hành vi học tập của sinh viên
//    Dùng để tính "learning progress" và cảnh báo phụ huynh
// =============================================================

db.createCollection("activity_log", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["pg_student_id","event_type","created_at"],
            properties: {
                pg_student_id: { bsonType: "int" },
                pg_class_id:   { bsonType: "int" },
                event_type: {
                    enum: [
                        "document_viewed",        // xem tài liệu
                        "document_completed",     // xem xong (>80% video / cuộn hết PDF)
                        "assignment_started",     // mở đề bài
                        "assignment_submitted",   // nộp bài
                        "submission_reviewed",    // xem lại kết quả
                        "class_joined",           // vào lớp online
                        "class_left",             // thoát lớp online
                        "login",                  // đăng nhập
                        "quiz_attempted"          // làm quiz luyện tập
                    ]
                },
                // Đối tượng liên quan
                resource_type: { enum: ["document","assignment","submission","class",null] },
                resource_id:   { bsonType: "int" },  // pg_id tương ứng

                // Metadata hành vi
                duration_sec:  { bsonType: "int" },   // thời gian thực hiện
                progress_pct:  { bsonType: "double" }, // % hoàn thành [0,100]
                score:         { bsonType: "double" }, // điểm (nếu là quiz)
                device_type:   { enum: ["desktop","mobile","tablet",null] },

                session_id:    { bsonType: "string" }, // group events by session
                ip_address:    { bsonType: "string" },
                created_at:    { bsonType: "date" }
            }
        }
    }
});

// Write-heavy → insert-optimized indexes, tránh over-index
db.activity_log.createIndex({ pg_student_id: 1, created_at: -1 });
db.activity_log.createIndex({ pg_class_id: 1, event_type: 1, created_at: -1 });
db.activity_log.createIndex({ created_at: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 365 }  // giữ 1 năm
);


// =============================================================
// 6. CLASS ANNOUNCEMENT
//    Bảng tin / thông báo nội bộ trong lớp (giảng viên đăng)
//    Phụ huynh và sinh viên đều đọc được
// =============================================================

db.createCollection("class_announcement", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["pg_class_id","pg_teacher_id","title","body","created_at"],
            properties: {
                pg_class_id:   { bsonType: "int" },
                pg_teacher_id: { bsonType: "int" },
                title:         { bsonType: "string" },
                body:          { bsonType: "string" },    // markdown/HTML
                attachments: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["url","filename"],
                        properties: {
                            url:      { bsonType: "string" },
                            filename: { bsonType: "string" }
                        }
                    }
                },
                is_pinned:     { bsonType: "bool" },
                // Danh sách pg_student_id đã đọc
                read_by:       { bsonType: "array", items: { bsonType: "int" } },
                created_at:    { bsonType: "date" },
                updated_at:    { bsonType: "date" }
            }
        }
    }
});

db.class_announcement.createIndex({ pg_class_id: 1, created_at: -1 });
db.class_announcement.createIndex({ pg_class_id: 1, is_pinned: -1, created_at: -1 });

// Tạo collection quản lý cuộc hội thoại
db.createCollection("parent_teacher_conversations", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["pg_teacher_id", "pg_parent_id", "pg_student_id", "updated_at"],
            properties: {
                pg_teacher_id: { bsonType: "int" },
                pg_parent_id:  { bsonType: "int" },
                pg_student_id: { bsonType: "int" }, // Chat về sinh viên nào
                last_message:  { bsonType: "string" },
                updated_at:    { bsonType: "date" }
            }
        }
    }
});

// Tạo collection lưu trữ tin nhắn
db.createCollection("parent_teacher_messages", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["conversation_id", "sender_id", "sender_role", "content", "created_at"],
            properties: {
                conversation_id: { bsonType: "objectId" },
                sender_id:       { bsonType: "int" },
                sender_role:     { enum: ["teacher", "parent"] },
                content:         { bsonType: "string" },
                created_at:      { bsonType: "date" }
            }
        }
    }
});

// Tạo Index để tìm kiếm nhanh
db.parent_teacher_conversations.createIndex({ pg_teacher_id: 1, pg_parent_id: 1, pg_student_id: 1 });
db.parent_teacher_messages.createIndex({ conversation_id: 1, created_at: 1 });