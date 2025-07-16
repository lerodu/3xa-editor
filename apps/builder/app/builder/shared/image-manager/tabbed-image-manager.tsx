import { useState } from "react";
import {
  PanelTabs,
  PanelTabsList,
  PanelTabsTrigger,
  PanelTabsContent,
  toast,
} from "@webstudio-is/design-system";
import type { ImageAsset } from "@webstudio-is/sdk";
import { ImageManager } from "./image-manager";
import { PexelsTab } from "./pexels-tab";

type TabbedImageManagerProps = {
  onChange?: (assetId: ImageAsset["id"]) => void;
  /** acceptable file types in the `<input accept>` attribute format */
  accept?: string;
};

export const TabbedImageManager = ({
  accept,
  onChange,
}: TabbedImageManagerProps) => {
  const [activeTab, setActiveTab] = useState("uploads");

  const handlePexelsUpload = (assetId: string) => {
    // Show toast notification
    toast.success("Image uploaded to your asset library!");

    // Switch to uploads tab after a brief delay
    setTimeout(() => {
      setActiveTab("uploads");
    }, 100);

    // Call the original onChange handler
    onChange?.(assetId);
  };

  return (
    <PanelTabs
      value={activeTab}
      onValueChange={setActiveTab}
      css={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0, // Allow shrinking in flex containers
        maxHeight: "70vh", // Reasonable max height for floating panels
      }}
    >
      <PanelTabsList>
        <PanelTabsTrigger value="uploads">Uploads</PanelTabsTrigger>
        <PanelTabsTrigger value="pexels">Pexels</PanelTabsTrigger>
      </PanelTabsList>

      <PanelTabsContent
        value="uploads"
        css={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0, // Allow shrinking in flex containers
        }}
      >
        <ImageManager accept={accept} onChange={onChange} />
      </PanelTabsContent>

      <PanelTabsContent
        value="pexels"
        css={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0, // Allow shrinking in flex containers
        }}
      >
        <PexelsTab onChange={handlePexelsUpload} />
      </PanelTabsContent>
    </PanelTabs>
  );
};
