import { api } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";

const mediaBucket = new Bucket("media", { public: true });

export interface UploadUrlRequest {
  filename: string;
  contentType: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

// Generates a signed URL for uploading media files directly from the client.
export const uploadUrl = api<UploadUrlRequest, UploadUrlResponse>(
  { auth: true, expose: true, method: "POST", path: "/media/upload-url" },
  async (req) => {
    const objectName = `${crypto.randomUUID()}-${req.filename}`;
    const { url } = await mediaBucket.signedUploadUrl(objectName, {
      ttl: 3600,
    });
    
    return {
      uploadUrl: url,
      publicUrl: mediaBucket.publicUrl(objectName),
    };
  }
);
