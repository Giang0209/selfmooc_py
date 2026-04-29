import { uploadFileToGridFS } from './file.service'

export async function uploadDocumentFile(file: File, bucket: string) {
    const buffer = Buffer.from(await file.arrayBuffer());

    const fileId = await uploadFileToGridFS(
        buffer,
        file.name,
        file.type,
        bucket
    );

    return fileId;
}