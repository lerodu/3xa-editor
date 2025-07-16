import { useState, useEffect, useRef, useCallback } from "react";
import {
  Grid,
  findNextListItemIndex,
  theme,
  useSearchFieldKeys,
  SearchField,
  Text,
  Flex,
} from "@webstudio-is/design-system";
import { PexelsThumbnail } from "./pexels-thumbnail";
import type { PexelsPhoto, PexelsSearchResponse } from "./pexels-service";
import { csrfToken } from "~/shared/csrf.client";

const useLogic = ({ onChange }: { onChange?: (assetId: string) => void }) => {
  const [searchResults, setSearchResults] = useState<PexelsPhoto[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const searchProps = useSearchFieldKeys({
    onMove({ direction }) {
      if (direction === "current") {
        setSelectedIndex(selectedIndex);
        return;
      }
      const nextIndex = findNextListItemIndex(
        selectedIndex,
        searchResults.length,
        direction
      );
      setSelectedIndex(nextIndex);
    },
  });

  const searchPexels = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      setTotalResults(0);
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      const response = await fetch("/rest/pexels/search", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: query.trim(),
          page,
          perPage: 15, // Balanced amount for infinite scroll
        }),
      });

      if (!response.ok) {
        let errorMessage = `Search failed: ${response.status}`;
        try {
          const errorData = await response.json();
          if (
            errorData &&
            typeof errorData === "object" &&
            "error" in errorData
          ) {
            errorMessage = String(errorData.error);
          }
        } catch {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }

      const data: PexelsSearchResponse = await response.json();

      if (page === 1) {
        setSearchResults(data.photos);
      } else {
        setSearchResults((prev) => [...prev, ...data.photos]);
      }

      setTotalResults(data.total_results);
      setHasMore(data.next_page !== undefined);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      console.error("Pexels search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && searchProps.value.trim()) {
      searchPexels(searchProps.value, currentPage + 1);
    }
  }, [hasMore, isLoading, searchProps.value, currentPage]);

  // Set up infinite scroll with intersection observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  // Reset observer when search changes
  useEffect(() => {
    if (observerRef.current && loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }
  }, [searchResults]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchProps.value.trim()) {
        searchPexels(searchProps.value, 1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchProps.value]);

  const handleSelect = (photo?: PexelsPhoto) => {
    const selectedIndex = searchResults.findIndex(
      (item) => item.id === photo?.id
    );
    setSelectedIndex(selectedIndex);
  };

  const handleUpload = (assetId: string) => {
    onChange?.(assetId);
  };

  return {
    searchProps,
    searchResults,
    handleSelect,
    handleUpload,
    selectedIndex,
    isLoading,
    error,
    hasMore,
    totalResults,
    loadingRef,
  };
};

type PexelsTabProps = {
  onChange?: (assetId: string) => void;
};

export const PexelsTab = ({ onChange }: PexelsTabProps) => {
  const {
    searchProps,
    searchResults,
    handleSelect,
    handleUpload,
    selectedIndex,
    isLoading,
    error,
    hasMore,
    totalResults,
    loadingRef,
  } = useLogic({ onChange });

  return (
    <Flex
      direction="column"
      css={{
        overflow: "hidden",
        paddingBlock: theme.panel.paddingBlock,
        flex: 1,
        minHeight: 0, // Allow shrinking in flex containers
      }}
    >
      <Flex
        css={{ padding: theme.panel.padding }}
        gap="2"
        direction="column"
        shrink={false}
      >
        <SearchField
          {...searchProps}
          autoFocus
          placeholder="Search Pexels for free images..."
        />

        {error && (
          <Text
            variant="tiny"
            css={{
              color: theme.colors.foregroundDestructive,
              textAlign: "center",
              padding: theme.spacing[2],
            }}
          >
            {error}
          </Text>
        )}

        {totalResults > 0 && (
          <Text
            variant="tiny"
            css={{
              color: theme.colors.foregroundMoreSubtle,
              textAlign: "center",
            }}
          >
            {totalResults.toLocaleString()} results found
          </Text>
        )}
      </Flex>

      {searchResults.length === 0 && !isLoading && searchProps.value.trim() && (
        <Flex
          align="center"
          justify="center"
          css={{
            flex: 1,
            color: theme.colors.foregroundMoreSubtle,
            textAlign: "center",
            padding: theme.spacing[8],
          }}
        >
          <Text>No images found. Try different keywords.</Text>
        </Flex>
      )}

      {searchResults.length === 0 && !searchProps.value.trim() && (
        <Flex
          align="center"
          justify="center"
          css={{
            flex: 1,
            color: theme.colors.foregroundMoreSubtle,
            textAlign: "center",
            padding: theme.spacing[8],
          }}
        >
          <Text>Search for free images from Pexels</Text>
        </Flex>
      )}

      <Flex
        direction="column"
        css={{
          flex: 1,
          overflow: "auto",
          minHeight: 0, // Prevent flex item from growing beyond container
        }}
      >
        <Grid
          columns={3}
          gap="2"
          css={{
            paddingInline: theme.panel.paddingInline,
            paddingBottom: theme.spacing[4],
            minHeight: "fit-content", // Ensure grid maintains proper height
          }}
        >
          {searchResults.map((photo, index) => (
            <PexelsThumbnail
              key={photo.id}
              photo={photo}
              onSelect={handleSelect}
              onUpload={handleUpload}
              state={index === selectedIndex ? "selected" : undefined}
            />
          ))}
        </Grid>

        {/* Infinite scroll loading indicator */}
        {hasMore && (
          <Flex
            ref={loadingRef}
            align="center"
            justify="center"
            css={{
              padding: theme.spacing[4],
              color: theme.colors.foregroundMoreSubtle,
            }}
          >
            <Text variant="tiny">
              {isLoading ? "Loading more images..." : "Scroll to load more"}
            </Text>
          </Flex>
        )}

        {/* No more results indicator */}
        {searchResults.length > 0 && !hasMore && !isLoading && (
          <Flex
            align="center"
            justify="center"
            css={{
              padding: theme.spacing[4],
              color: theme.colors.foregroundMoreSubtle,
            }}
          >
            <Text variant="tiny">No more results</Text>
          </Flex>
        )}

        {/* Initial loading state */}
        {isLoading && searchResults.length === 0 && (
          <Flex
            align="center"
            justify="center"
            css={{
              flex: 1,
              color: theme.colors.foregroundMoreSubtle,
              padding: theme.spacing[8],
            }}
          >
            <Text>Searching...</Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};
