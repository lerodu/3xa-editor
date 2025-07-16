import { uploadAssets } from "../assets/use-assets";

export type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
};

export type PexelsSearchResponse = {
  photos: PexelsPhoto[];
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
  prev_page?: string;
};

export const searchPexelsImages = async ({
  query,
  apiKey,
  page = 1,
  perPage = 20,
}: {
  query: string;
  apiKey: string;
  page?: number;
  perPage?: number;
}): Promise<PexelsSearchResponse> => {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("per_page", perPage.toString());

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Pexels API error: ${response.status} ${response.statusText}`
    );
  }

  const result: PexelsSearchResponse = await response.json();
  return result;
};

export const downloadAndUploadPexelsImage = async (
  photo: PexelsPhoto,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    onProgress?.(0);

    // Use the large size for better quality
    const imageUrl = photo.src.large;

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    onProgress?.(50);

    // Convert to blob
    const blob = await response.blob();

    // Create a File object with proper name and type
    const fileName = `pexels-${photo.id}.jpg`;
    const file = new File([blob], fileName, {
      type: blob.type || "image/jpeg",
    });

    onProgress?.(75);

    // Upload using existing assets system
    const results = await uploadAssets("image", [file]);

    onProgress?.(100);

    // Return the asset ID from the map
    const assetId = results.get(file);
    if (assetId) {
      return assetId;
    }

    throw new Error("Failed to upload image");
  } catch (error) {
    console.error("Error downloading and uploading Pexels image:", error);
    throw error;
  }
};
