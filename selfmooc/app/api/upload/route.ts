import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

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

        const type = formData.get('type') as string;

        const buffer = Buffer.from(await file.arrayBuffer());

        const result: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: type === 'class' ? 'classes' : 'courses',
                    resource_type: 'auto', // hỗ trợ pdf, pptx, mp4
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            uploadStream.end(buffer);
        });

        return NextResponse.json({
            success: true,
            fileUrl: result.secure_url,
            cloudinaryId: result.public_id,
        });

    } catch (error: any) {
        console.error('Upload error:', error);

        return NextResponse.json(
            { success: false, message: 'Upload thất bại' },
            { status: 500 }
        );
    }
}