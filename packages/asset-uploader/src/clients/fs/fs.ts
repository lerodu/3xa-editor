import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import type { AssetClient } from "../../client";
import { uploadToFs } from "./upload";

type FsClientOptions = {
  maxUploadSize: number;
  fileDirectory: string;
};

export const createFsClient = (options: FsClientOptions): AssetClient => {
  const uploadFile: AssetClient["uploadFile"] = async (
    name,
    type,
    data,
    _assetInfoFallback
  ) => {
    return uploadToFs({
      name,
      type,
      data,
      maxSize: options.maxUploadSize,
      fileDirectory: options.fileDirectory,
    });
  };

  const deleteFile: AssetClient["deleteFile"] = async (name) => {
    const filepath = resolve(options.fileDirectory, name);
    try {
      await unlink(filepath);
    } catch (error) {
      // File might not exist, which is fine for deletion
      console.warn(`Could not delete file ${filepath}:`, error);
    }
  };

  return {
    uploadFile,
    deleteFile,
  };
};
