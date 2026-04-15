import drive from '../config/googleDrive.js';
import { Readable } from 'stream';

export const uploadToGoogleDrive = async (fileBuffer, fileName) => {
    try {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        // 1. Create the Readable stream from buffer
        const bufferStream = new Readable();
        bufferStream.push(fileBuffer);
        bufferStream.push(null);

        // 2. Upload to Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: `${Date.now()}_${fileName}`,
                parents: folderId ? [folderId] : [],
            },
            supportsAllDrives: true,
            media: {
                mimeType: 'application/octet-stream',
                body: bufferStream,
            },
            fields: 'id, webViewLink',
        });

        const fileId = response.data.id;

        // 3. Set public permission (anyone with link can read)
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            supportsAllDrives: true,
        });

        // 4. Get the public link (WebViewLink or WebContentLink for direct download)
        // WebContentLink is often better for direct viewing/downloading if supported
        const fileInfo = await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink, webContentLink',
            supportsAllDrives: true,
        });

        return {
            url: fileInfo.data.webViewLink,
            publicId: fileId,
            originalName: fileName,
        };
    } catch (error) {
        console.error('[GOOGLE DRIVE] Upload Error:', error);
        throw error;
    }
};
