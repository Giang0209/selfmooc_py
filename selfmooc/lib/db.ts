// src/lib/db.ts
import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';

// ==========================================
// 1. CẤU HÌNH KẾT NỐI POSTGRESQL (NEON)
// ==========================================
const pgConnectionString = process.env.DATABASE_URL;

if (!pgConnectionString) {
  throw new Error('Thiếu DATABASE_URL trong file .env.local');
}

// Khai báo global object để giữ lại connection pool khi Next.js hot-reload
const globalForPg = globalThis as unknown as { pgPool: Pool };

export const pgPool =
  globalForPg.pgPool ||
  new Pool({
    connectionString: pgConnectionString,
    // Neon Serverless Pooler xử lý connection rất tốt, 
    // giữ max 10-20 là an toàn cho môi trường dev/free tier
    max: 15,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pgPool;
}


// ==========================================
// 2. CẤU HÌNH KẾT NỐI MONGODB (ATLAS)
// ==========================================
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('Thiếu MONGODB_URI trong file .env.local');
}

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise: Promise<MongoClient>
};

let mongoClientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // Trong môi trường dev, sử dụng global variable để giữ connection
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(mongoUri);
    globalForMongo._mongoClientPromise = client.connect();
  }
  mongoClientPromise = globalForMongo._mongoClientPromise;
} else {
  // Trong môi trường production, khởi tạo connection mới (Serverless sẽ tự quản lý)
  const client = new MongoClient(mongoUri);
  mongoClientPromise = client.connect();
}

/**
 * Hàm tiện ích để lấy trực tiếp database instance của MongoDB.
 * Cách dùng ở file khác: const db = await getMongoDb();
 */
export async function getMongoDb(): Promise<Db> {
  const client = await mongoClientPromise;
  // Thay 'lms_db' bằng tên database thực tế của bạn trên Atlas nếu khác
  return client.db('lms_db');
}