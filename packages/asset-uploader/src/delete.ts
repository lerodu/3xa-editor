import {
  authorizeProject,
  type AppContext,
  AuthorizationError,
} from "@webstudio-is/trpc-interface/index.server";
import type { Asset } from "@webstudio-is/sdk";
import { createAssetClient } from "./clients";

export const deleteAssets = async (
  props: {
    ids: Array<Asset["id"]>;
    projectId: string;
  },
  context: AppContext
): Promise<void> => {
  const canDelete = await authorizeProject.hasProjectPermit(
    { projectId: props.projectId, permit: "edit" },
    context
  );

  if (canDelete === false) {
    throw new AuthorizationError(
      "You don't have access to delete this project assets"
    );
  }

  const assets = await context.postgrest.client
    .from("Asset")
    .select(
      `
        id,
        projectId,
        name,
        file:File!inner (*)
      `
    )
    .in("id", props.ids)
    .eq("projectId", props.projectId);

  if ((assets.data ?? []).length === 0) {
    throw new Error("Assets not found");
  }

  await context.postgrest.client
    .from("Project")
    .update({ previewImageAssetId: null })
    .eq("id", props.projectId)
    .in("previewImageAssetId", props.ids);

  await context.postgrest.client
    .from("Asset")
    .delete()
    .in("id", props.ids)
    .eq("projectId", props.projectId);

  // find unused files
  const unusedFileNames = new Set(assets.data?.map((asset) => asset.name));
  const assetsByStillUsedFileName = await context.postgrest.client
    .from("Asset")
    .select("name")
    .in("name", Array.from(unusedFileNames));
  for (const asset of assetsByStillUsedFileName.data ?? []) {
    unusedFileNames.delete(asset.name);
  }

  // delete unused files from storage (S3 or local filesystem)
  const assetClient = createAssetClient();
  if (assetClient.deleteFile) {
    for (const fileName of unusedFileNames) {
      try {
        await assetClient.deleteFile(fileName);
      } catch (error) {
        console.error(`Failed to delete file ${fileName} from storage:`, error);
      }
    }
  }

  // delete unused files from database
  await context.postgrest.client
    .from("File")
    .update({ isDeleted: true })
    .in("name", Array.from(unusedFileNames));
};
