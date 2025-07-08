import { json, type ActionFunctionArgs } from "@remix-run/node";
import env from "~/env/env.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { shareUrl, projectId, timestamp } = await request.json();

    if (!shareUrl || !projectId) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate that the GitHub Action configuration is set up
    if (!env.GITHUB_ACTION_TOKEN || !env.GITHUB_REPOSITORY) {
      console.error("GitHub Action environment variables missing:", {
        GITHUB_ACTION_TOKEN: env.GITHUB_ACTION_TOKEN ? "SET" : "NOT SET",
        GITHUB_REPOSITORY: env.GITHUB_REPOSITORY || "NOT SET",
      });
      return json(
        {
          error:
            "GitHub Action configuration not complete. Please set GITHUB_ACTION_TOKEN and GITHUB_REPOSITORY environment variables.",
          debug: {
            GITHUB_ACTION_TOKEN: env.GITHUB_ACTION_TOKEN ? "SET" : "NOT SET",
            GITHUB_REPOSITORY: env.GITHUB_REPOSITORY || "NOT SET",
          },
        },
        { status: 500 }
      );
    }

    // Trigger GitHub Action using repository_dispatch
    const githubApiUrl = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/dispatches`;

    console.log("GitHub API URL:", githubApiUrl);
    console.log(
      "Token preview:",
      env.GITHUB_ACTION_TOKEN
        ? `${env.GITHUB_ACTION_TOKEN.substring(0, 10)}...`
        : "NOT SET"
    );

    const response = await fetch(githubApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GITHUB_ACTION_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Webstudio-Builder",
      },
      body: JSON.stringify({
        event_type: "webstudio-deploy",
        client_payload: {
          shareUrl,
          projectId,
          timestamp,
          source: "webstudio-builder",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub Action webhook failed: ${response.status} - ${errorText}`
      );
    }

    // GitHub API returns 204 No Content for successful repository_dispatch
    // So we don't need to parse JSON if the status is 204
    let result = null;
    if (response.status !== 204) {
      try {
        result = await response.json();
      } catch (error) {
        // If JSON parsing fails, that's okay for repository_dispatch
        console.log(
          "No JSON response from GitHub API (this is normal for repository_dispatch)"
        );
      }
    }

    return json({
      success: true,
      message: "GitHub Action triggered successfully",
      result,
    });
  } catch (error) {
    console.error("GitHub Action webhook error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
