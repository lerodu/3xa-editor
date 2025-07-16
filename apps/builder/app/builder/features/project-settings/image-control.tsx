import type { ReactElement } from "react";
import { FloatingPanel } from "@webstudio-is/design-system";
import { TabbedImageManager } from "~/builder/shared/image-manager";

// @todo should be moved to shared as its being reused in another feature
export const ImageControl = (props: {
  onAssetIdChange: (assetId: string) => void;
  children: ReactElement;
}) => {
  return (
    <FloatingPanel
      title="Images"
      content={
        <TabbedImageManager
          onChange={(assetId) => {
            props.onAssetIdChange(assetId);
          }}
        />
      }
    >
      {props.children}
    </FloatingPanel>
  );
};
