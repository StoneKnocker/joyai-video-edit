import { AwsClient } from "aws4fetch";
import { getMimeType } from "@/lib/mime";
import { serverEnv } from "~/lib/env.server";
import { buildR2Url } from "./r2.shared";

const R2_BUCKET_NAME = serverEnv.R2_BUCKET_NAME;
const R2_ACCOUNT_ID = serverEnv.R2_ACCOUNT_ID;

let r2Client: AwsClient | null = null;

function requireEnv(name: "R2_ACCESS_KEY_ID" | "R2_SECRET_ACCESS_KEY") {
  const value = serverEnv[name];

  if (!value) {
    throw new Error(`${name} is required for R2 client initialization.`);
  }

  return value;
}

function normalizeR2Key(filePath: string): string {
  return filePath.replace(/^\/+/, "");
}

function getR2ObjectEndpoint(filePath: string): string {
  const key = normalizeR2Key(filePath)
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
}

export function getServerR2Url(pathOrUrl: string): string {
  return buildR2Url(pathOrUrl, serverEnv.R2_DOMAIN);
}

/**
 * Get R2 S3 client for presigned URL operations.
 * Uses R2 API token for authentication.
 */
function getR2Client(): AwsClient {
  if (!r2Client) {
    r2Client = new AwsClient({
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      service: "s3",
      region: "auto",
    });
  }
  return r2Client;
}

/**
 * Generate a pre-signed URL for direct upload to R2.
 *
 * @param filePath - The target path in R2 bucket (e.g., "uploads/user-id/image.jpg")
 * @param contentType - The MIME type of the file (e.g., "image/jpeg")
 * @param expiresIn - URL validity in seconds (default: 3600 = 1 hour)
 * @returns Pre-signed upload URL
 */
export async function getUploadPreSignedUrl(
  filePath: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getR2Client();
  const endpoint = getR2ObjectEndpoint(filePath);

  const request = new Request(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
  });

  // sign returns a signed request, we can extract the URL from it
  // Note: aws4fetch uses 'expiration' for presigned URL expiry but types may not include it
  const signed = await client.sign(request, {
    aws: {
      signQuery: true,
      // @ts-expect-error - expiration is supported at runtime
      expiration: expiresIn,
    },
  });

  return signed.url;
}

export const downloadAndUpload = async (
  url: string,
  filePath: string,
): Promise<boolean> => {
  const response = await fetch(url);
  if (response.status !== 200) {
    console.error("fetch image error, url: ", url);
    console.error(
      "fetch image error, status: ",
      response.status,
      response.statusText,
    );
    return false;
  }

  const arrayBuffer = await response.arrayBuffer();
  return uploadToR2(
    arrayBuffer,
    filePath,
    response.headers.get("Content-Type"),
  );
};

export const uploadToR2 = async (
  body: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob,
  filePath: string,
  contentType?: string | null,
): Promise<boolean> => {
  const normalizedFilePath = normalizeR2Key(filePath);
  const ext = normalizedFilePath.split(".").pop()?.toLowerCase();
  const mimeType = contentType || getMimeType(ext || "");

  try {
    const response = await getR2Client().fetch(
      getR2ObjectEndpoint(normalizedFilePath),
      {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
        },
        body: body as BodyInit | null,
      },
    );

    if (!response.ok) {
      console.error("Error uploading to R2:", {
        filePath: normalizedFilePath,
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    console.debug("Upload to R2 success:", normalizedFilePath);
    return true;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return false;
  }
};

/**
 * Delete a file from R2.
 */
export const deleteFromR2 = async (filePath: string): Promise<boolean> => {
  const normalizedFilePath = normalizeR2Key(filePath);

  try {
    const response = await getR2Client().fetch(
      getR2ObjectEndpoint(normalizedFilePath),
      {
        method: "DELETE",
      },
    );

    if (!response.ok && response.status !== 404) {
      console.error("Error deleting from R2:", {
        filePath: normalizedFilePath,
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting from R2:", error);
    return false;
  }
};
