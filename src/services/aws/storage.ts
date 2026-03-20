import { apiRequest } from './api';
import { SignedUploadResponse } from '../../types/aws';

export const storageService = {
  async getSignedUploadUrl(fileName: string, contentType: string) {
    return apiRequest<SignedUploadResponse>('/media/signed-url', 'POST', {
      fileName,
      contentType,
    });
  },

  async uploadToS3(uploadUrl: string, fileUri: string, contentType: string) {
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });

    if (!response.ok) {
      throw new Error('S3 upload failed');
    }

    return true;
  },
};
