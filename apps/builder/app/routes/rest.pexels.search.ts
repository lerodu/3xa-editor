import { z } from "zod";
import type { ActionFunctionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import env from "~/env/env.server";
import { preventCrossOriginCookie } from "~/services/no-cross-origin-cookie";
import { checkCsrf } from "~/services/csrf-session.server";

const RequestSchema = z.object({
  query: z.string().min(1).max(200),
  page: z.number().min(1).max(100).default(1),
  perPage: z.number().min(1).max(80).default(20),
});

type PexelsPhoto = {
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

type PexelsSearchResponse = {
  photos: PexelsPhoto[];
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
  prev_page?: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    preventCrossOriginCookie(request);
    await checkCsrf(request);

    if (!env.PEXELS_API_KEY) {
      console.error("PEXELS_API_KEY environment variable not set");
      return json({ error: "Pexels API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { query, page, perPage } = RequestSchema.parse(body);

    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", perPage.toString());

    const response = await fetch(url, {
      headers: {
        Authorization: env.PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error("Pexels API error:", response.status, response.statusText);
      return json(
        { error: "Failed to search Pexels API" },
        { status: response.status }
      );
    }

    const data: PexelsSearchResponse = await response.json();

    return json(data);
  } catch (error) {
    console.error("Pexels search error:", error);

    if (error instanceof z.ZodError) {
      return json({ error: "Invalid request parameters" }, { status: 400 });
    }

    return json({ error: "Internal server error" }, { status: 500 });
  }
};
