import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Box, styled, Text, Button } from "@webstudio-is/design-system";
import { theme } from "@webstudio-is/design-system";
import { PlusIcon } from "@webstudio-is/icons";
import type { PexelsPhoto } from "./pexels-service";
import { downloadAndUploadPexelsImage } from "./pexels-service";

const StyledPexelsImage = styled("img", {
  position: "absolute",
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

const AddButton = styled(Button, {
  position: "absolute",
  top: theme.spacing[2],
  right: theme.spacing[2],
  zIndex: 1,
  opacity: 0,
  transition: "opacity 0.2s ease",
});

const ThumbnailContainer = styled(Box, {
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  borderRadius: theme.borderRadius[4],
  outline: "none",
  gap: theme.spacing[3],
  overflow: "hidden",
  padding: 2,
  backgroundColor: theme.colors.backgroundPanel,
  "&:hover": {
    backgroundColor: theme.colors.backgroundAssetcardHover,
    [`& ${AddButton}`]: {
      opacity: 1,
    },
  },
  variants: {
    state: {
      selected: {
        outline: `1px solid ${theme.colors.borderFocus}`,
        outlineOffset: -1,
        backgroundColor: theme.colors.backgroundAssetcardHover,
      },
      uploading: {
        opacity: 0.7,
      },
    },
  },
});

const Thumbnail = styled(Box, {
  width: "100%",
  height: theme.spacing[21], // Increased from 19 (64px) to 21 (96px) for consistency
  flexShrink: 0,
  position: "relative",
  cursor: "pointer",
});

const PhotographerCredit = styled(Text, {
  color: theme.colors.foregroundMoreSubtle,
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  width: "100%",
});

const ProgressOverlay = styled(Box, {
  position: "absolute",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontSize: "14px",
  fontWeight: "bold",
});

type PexelsThumbnailProps = {
  photo: PexelsPhoto;
  onSelect?: (photo: PexelsPhoto) => void;
  onUpload?: (assetId: string) => void;
  state?: "selected" | "uploading";
};

export const PexelsThumbnail = ({
  photo,
  onSelect,
  onUpload,
  state,
}: PexelsThumbnailProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.MouseEvent) => {
    event.stopPropagation();

    if (isUploading) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const assetId = await downloadAndUploadPexelsImage(
        photo,
        setUploadProgress
      );
      onUpload?.(assetId);
    } catch (error) {
      console.error("Failed to upload Pexels image:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ThumbnailContainer
      title={photo.alt || `Photo by ${photo.photographer}`}
      tabIndex={0}
      state={isUploading ? "uploading" : state}
      onFocus={() => {
        onSelect?.(photo);
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.code === "Enter") {
          handleUpload(event as unknown as React.MouseEvent);
        }
      }}
    >
      <Thumbnail
        onClick={() => {
          onSelect?.(photo);
        }}
      >
        <StyledPexelsImage
          src={photo.src.small}
          alt={photo.alt || `Photo by ${photo.photographer}`}
          loading="lazy"
        />
        <AddButton
          color="neutral"
          onClick={handleUpload}
          disabled={isUploading}
        >
          <PlusIcon />
        </AddButton>

        {isUploading && <ProgressOverlay>{uploadProgress}%</ProgressOverlay>}
      </Thumbnail>

      <PhotographerCredit variant="tiny">
        by {photo.photographer}
      </PhotographerCredit>
    </ThumbnailContainer>
  );
};
