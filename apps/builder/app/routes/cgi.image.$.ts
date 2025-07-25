import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { createReadableStreamFromReadable } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { wsImageLoader } from "@webstudio-is/image";
import env from "~/env/env.server";
import { getImageNameAndType } from "~/builder/shared/assets/asset-utils";
import { fileUploadPath } from "~/shared/asset-client";

const ImageParams = z.object({
  width: z.string().transform((value) => Math.round(parseFloat(value))),
  height: z.optional(
    z.string().transform((value) => Math.round(parseFloat(value)))
  ),
  fit: z.optional(z.literal("pad")),
  background: z.optional(z.string()),

  quality: z.string().transform((value) => Math.round(parseFloat(value))),

  format: z.union([
    z.literal("auto"),
    z.literal("avif"),
    z.literal("webp"),
    z.literal("json"),
    z.literal("jpeg"),
    z.literal("png"),
    z.literal("raw"),
  ]),
});

const decodePathFragment = (fragment: string) => {
  return decodeURIComponent(fragment);
};

// this route used as proxy for images to cloudflare endpoint
// https://developers.cloudflare.com/fundamentals/get-started/reference/cdn-cgi-endpoint/

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const basePath = `/cgi/image/`;

  const url = new URL(request.url);
  const name = decodePathFragment(url.pathname.slice(basePath.length));

  // The code should be +- same as here https://github.com/webstudio-is/webstudio-saas/blob/6c9a3bfb67cf5a221c20666de34bd20dc14bd558/packages/assets-proxy/src/image-transform.ts#L68
  const rawParameters: Record<string, string> = {
    format: url.searchParams.get("format") ?? "auto",
    width: url.searchParams.get("width") ?? "0",
    quality: url.searchParams.get("quality") ?? "80",
  };

  const height = url.searchParams.get("height");

  if (height != null) {
    rawParameters.height = height;
  }

  const fit = url.searchParams.get("fit");

  if (fit != null) {
    rawParameters.fit = fit;
  }

  const imageParameters = ImageParams.parse(rawParameters);

  // Allow direct image access, and from the same origin
  const refererRawUrl = request.headers.get("referer");
  const refererUrl = refererRawUrl === null ? url : new URL(refererRawUrl);
  if (refererUrl.host !== url.host) {
    throw new Response("Forbidden", {
      status: 403,
    });
  }

  if (env.RESIZE_ORIGIN !== undefined) {
    const imgHref = wsImageLoader({
      src: name,
      ...imageParameters,
      format: "auto",
    });

    const imgUrl = new URL(env.RESIZE_ORIGIN + imgHref);
    imgUrl.search = url.search;

    const response = await fetch(imgUrl.href, {
      headers: {
        accept: request.headers.get("accept") ?? "",
        "accept-encoding": request.headers.get("accept-encoding") ?? "",
      },
    });

    const responseWHeaders = new Response(response.body, response);

    if (false === responseWHeaders.ok) {
      console.error(
        `Request to Image url ${imgUrl.href} responded with status = ${responseWHeaders.status}`
      );
    }

    responseWHeaders.headers.set("Access-Control-Allow-Origin", url.origin);

    return responseWHeaders;
  }

  // support absolute urls locally
  if (URL.canParse(name)) {
    return fetch(name);
  }

  // Check if file exists locally first
  const filePath = join(process.cwd(), fileUploadPath, name);

  if (existsSync(filePath)) {
    const [contentType] = getImageNameAndType(name) ?? ["image/png"];

    return new Response(
      createReadableStreamFromReadable(createReadStream(filePath)),
      {
        headers: {
          "content-type": contentType,
        },
      }
    );
  }

  // If S3 is configured and file doesn't exist locally, try to fetch from S3
  if (env.S3_ENDPOINT !== undefined && env.S3_BUCKET !== undefined) {
    const s3Url = new URL(`/${env.S3_BUCKET}/${name}`, env.S3_ENDPOINT);

    try {
      const response = await fetch(s3Url.href);

      if (response.ok) {
        const [contentType] = getImageNameAndType(name) ?? ["image/png"];

        return new Response(response.body, {
          headers: {
            "content-type": contentType,
            "cache-control": "public, max-age=31536004,immutable",
          },
        });
      }
    } catch (error) {
      console.error(`Failed to fetch from S3: ${s3Url.href}`, error);
    }
  }

  throw new Response("Not found", {
    status: 404,
  });
};
