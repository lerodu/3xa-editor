import { useState, useOptimistic } from "react";
import { useStore } from "@nanostores/react";
import {
  Button,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverClose,
  PopoverTitleActions,
  IconButton,
  Text,
  Flex,
  Grid,
  theme,
  rawTheme,
  toast,
  css,
} from "@webstudio-is/design-system";
import {
  UploadIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  AlertIcon,
} from "@webstudio-is/icons";
import { nativeClient } from "~/shared/trpc/trpc-client";
import { $authTokenPermissions, $project } from "~/shared/nano-states";
import { builderUrl } from "~/shared/router-utils";

type DeployProps = {
  projectId: string;
};

export const DeployButton = ({ projectId }: DeployProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeploying, setIsDeployingOptimistic] = useOptimistic(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [githubActionStatus, setGithubActionStatus] = useState<string | null>(
    null
  );

  const authTokenPermissions = useStore($authTokenPermissions);
  const project = useStore($project);
  const isDeployEnabled = authTokenPermissions.canPublish;

  const tooltipContent = isDeployEnabled
    ? "Deploy your latest changes via GitHub Actions"
    : "Only the owner, an admin, or content editors with publish permissions can deploy projects";

  const handleDeploy = async () => {
    if (project === undefined) {
      toast.error("Project not found");
      return;
    }

    try {
      setIsDeployingOptimistic(true);
      setDeploymentUrl(null);
      setShareUrl(null);
      setGithubActionStatus(null);

      // Step 1: Skip publishing - GitHub Action works with development builds directly

      // Step 2: Create a share URL (same as share button)
      const shareResult = await nativeClient.authorizationToken.create.mutate({
        projectId,
        relation: "viewers",
        name: "Auto-generated share link",
      });

      if (!shareResult || !shareResult[0]) {
        toast.error("Failed to create share URL");
        return;
      }

      const shareUrl = builderUrl({
        projectId,
        origin: window.location.origin,
        authToken: shareResult[0].token,
        mode: "preview",
      });

      setShareUrl(shareUrl);

      // Step 3: Send to GitHub Action
      const githubActionResult = await sendToGithubAction(shareUrl, projectId);

      if (githubActionResult.success) {
        setGithubActionStatus("success");
        toast.success("Successfully deployed! GitHub Action triggered.");
      } else {
        setGithubActionStatus("error");
        toast.error(`GitHub Action failed: ${githubActionResult.error}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deploy failed");
      setGithubActionStatus("error");
    } finally {
      setIsDeployingOptimistic(false);
    }
  };

  const sendToGithubAction = async (shareUrl: string, projectId: string) => {
    try {
      const response = await fetch("/api/github-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareUrl,
          projectId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: result.success, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return (
    <Popover modal open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip
        side="bottom"
        content={tooltipContent}
        sideOffset={Number.parseFloat(rawTheme.spacing[5])}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            disabled={isDeployEnabled === false}
            color="gradient"
            prefix={<UploadIcon />}
          >
            Deploy
          </Button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent
        sideOffset={Number.parseFloat(rawTheme.spacing[8])}
        css={{
          width: theme.spacing[33],
          maxWidth: theme.spacing[33],
          marginRight: theme.spacing[3],
        }}
      >
        <PopoverTitle
          suffix={
            <PopoverTitleActions>
              <PopoverClose />
            </PopoverTitleActions>
          }
        >
          Deploy
        </PopoverTitle>

        <Grid columns={1} gap={3} css={{ padding: theme.panel.padding }}>
          <Text color="subtle">
            This will create a share link and trigger a GitHub Action to deploy
            your latest changes to Cloudflare Pages.
          </Text>

          {shareUrl && (
            <Flex gap={2} align="center">
              <Text color="success">Share URL created!</Text>
              <Button
                size="small"
                color="neutral"
                prefix={<ExternalLinkIcon />}
                onClick={() => window.open(shareUrl, "_blank")}
              >
                Open
              </Button>
            </Flex>
          )}

          {githubActionStatus === "success" && (
            <Flex gap={2} align="center">
              <CheckCircleIcon />
              <Text color="success">GitHub Action triggered successfully!</Text>
            </Flex>
          )}

          {githubActionStatus === "error" && (
            <Flex gap={2} align="center">
              <AlertIcon />
              <Text color="destructive">GitHub Action failed</Text>
            </Flex>
          )}

          <Button
            type="button"
            color="positive"
            state={isDeploying ? "pending" : undefined}
            onClick={handleDeploy}
            disabled={isDeploying}
          >
            {isDeploying ? "Deploying..." : "Deploy"}
          </Button>
        </Grid>
      </PopoverContent>
    </Popover>
  );
};
