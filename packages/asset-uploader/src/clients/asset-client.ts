import { createFsClient } from "./fs/fs";
import { createS3Client } from "./s3/s3";

export const createAssetClient = () => {
  // Check if S3 is configured
  if (
    process.env.S3_ENDPOINT !== undefined &&
    process.env.S3_REGION !== undefined &&
    process.env.S3_ACCESS_KEY_ID !== undefined &&
    process.env.S3_SECRET_ACCESS_KEY !== undefined &&
    process.env.S3_BUCKET !== undefined
  ) {
    return createS3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
      acl: process.env.S3_ACL,
      maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || "10485760"), // 10MB default
    });
  } else {
    return createFsClient({
      maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || "10485760"), // 10MB default
      fileDirectory: process.env.FILE_DIRECTORY || "public/cgi/asset",
    });
  }
};
