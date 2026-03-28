import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db'; 
import { ObjectId, GridFSBucket } from 'mongodb';

export async function GET(request: NextRequest, context: any) {
  try {
    // 1. Lấy ID an toàn (Hỗ trợ cả Next 14 và 15)
    const params = await context.params; 
    const fileIdString = params?.fileId;

    console.log("👉 Đang yêu cầu file ID:", fileIdString); // In ra terminal để debug

    if (!fileIdString || fileIdString === 'undefined') {
        return new NextResponse('ID File không hợp lệ', { status: 400 });
    }

    const db = await getMongoDb();
    const bucket = new GridFSBucket(db, { bucketName: 'course_files' });
    const fileId = new ObjectId(fileIdString);

    // 2. Tìm file trong GridFS
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (!files.length) {
        console.log("❌ KHÔNG TÌM THẤY: File này không có trong collection course_files.files");
        return new NextResponse('Không tìm thấy file', { status: 404 });
    }

    const file = files[0];
    const contentType = file.metadata?.contentType || 'application/octet-stream';
    console.log("✅ TÌM THẤY FILE:", file.filename, "| Loại:", contentType);

    // 3. Logic Tải / Xem
    const isDownload = request.nextUrl.searchParams.get('download') === '1';
    
    // Mã hóa tên file để không bị lỗi ByteString
    const encodedFilename = encodeURIComponent(file.filename);
    
    // Dùng cú pháp filename*=UTF-8'' chuẩn RFC 5987 của HTTP
    const disposition = isDownload 
      ? `attachment; filename="document"; filename*=UTF-8''${encodedFilename}` 
      : `inline; filename="document"; filename*=UTF-8''${encodedFilename}`;
    // 4. Bơm Stream
    const downloadStream = bucket.openDownloadStream(fileId);
    const stream = new ReadableStream({
      start(controller) {
        downloadStream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
        downloadStream.on('end', () => controller.close());
        downloadStream.on('error', (error) => controller.error(error));
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Content-Length': file.length.toString(),
      }
    });
  } catch (error) {
    console.error("🔥 Lỗi API stream file:", error);
    return new NextResponse('Lỗi server', { status: 500 });
  }
}