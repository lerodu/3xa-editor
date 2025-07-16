import { useState } from "react";
import {
  PanelTabs,
  PanelTabsList,
  PanelTabsTrigger,
  PanelTabsContent,
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

  return (
    <PanelTabs
      value={activeTab}
      onValueChange={setActiveTab}
      css={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
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
        }}
      >
        <PexelsTab onChange={onChange} />
      </PanelTabsContent>
    </PanelTabs>
  );
};
