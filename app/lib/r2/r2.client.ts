import { buildR2Url } from "./r2.shared";

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

export type UploadOptions = {
  filePath: string;
  contentType: string;
  file: File;
  uploadUrl: string;
  onProgress?: (progress: UploadProgress) => void;
};

export async function uploadToR2(options: UploadOptions): Promise<string> {
  const { filePath, contentType, file, uploadUrl, onProgress } = options;

  // Upload to R2
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });

  return getClientR2Url(filePath);
}

export function getClientR2Url(pathOrUrl: string): string {
  return buildR2Url(pathOrUrl, window.ENV?.R2_DOMAIN);
}

export function generateUploadFilePath(
  userId: string,
  fileName: string,
): string {
  const timestamp = Date.now();
  const uniqueId = crypto.randomUUID();
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  return `uploads/${userId}/${timestamp}-${uniqueId}.${ext}`;
}
