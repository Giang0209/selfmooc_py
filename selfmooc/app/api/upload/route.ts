import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToGridFS } from '@/modules/shared/services/file.service';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'Không có file' },
                { status: 400 }
            );
        }

        // 🎯 lấy loại upload: course | class
        const type = formData.get('type') as string;

        let bucketName = 'course_files'; // default

        if (type === 'class') {
            bucketName = 'class_files';
        }

        // convert file → buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // upload
        const fileId = await uploadFileToGridFS(
            buffer,
            file.name,
            file.type,
            bucketName
        );

        return NextResponse.json({
            success: true,
            fileId
        });

    } catch (error: any) {
        console.error('Upload error:', error);

        return NextResponse.json(
            { success: false, message: 'Upload thất bại' },
            { status: 500 }
        );
    }
}