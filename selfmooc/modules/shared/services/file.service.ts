import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';
import { Readable } from 'stream';

export async function uploadFileToGridFS(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    bucketName: string
) {
    const db = await getMongoDb();
    const bucket = new GridFSBucket(db, { bucketName });

    return new Promise<string>((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(fileName, {
            metadata: { contentType: mimeType }
        });

        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);

        readableStream
            .pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => resolve(uploadStream.id.toString()));
    });
}