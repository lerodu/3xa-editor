#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "../packages/postgrest/src/index.server.js";
import { generateDomain } from "../packages/project/src/db/project-domain.js";
import type { Data } from "@webstudio-is/http-client";

// Parse command line arguments
interface ImportArgs {
  dataJsonPath: string;
  projectTitle: string;
  userId?: string;
  outputFile?: string;
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (key.startsWith("--")) {
      parsed[key.slice(2)] = value;
    }
  }

  if (!parsed.dataJsonPath) {
    throw new Error("--dataJsonPath is required");
  }
  if (!parsed.projectTitle) {
    throw new Error("--projectTitle is required");
  }

  return parsed as ImportArgs;
}

// Create minimal context for database operations
function createMinimalContext() {
  const postgrestUrl = process.env.POSTGREST_URL;
  const postgrestApiKey = process.env.POSTGREST_API_KEY;

  if (!postgrestUrl || !postgrestApiKey) {
    throw new Error(
      "POSTGREST_URL and POSTGREST_API_KEY environment variables are required"
    );
  }

  return {
    postgrest: {
      client: createClient(postgrestUrl, postgrestApiKey),
    },
  };
}

export const importDataJson = async (
  dataJsonPath: string,
  projectTitle: string,
  userId?: string
) => {
  console.log(`📁 Reading data.json from: ${dataJsonPath}`);

  // 1. Parse data.json - this contains the Data structure from loadProductionCanvasData
  const dataJsonContent = readFileSync(dataJsonPath, "utf8");
  const data: Data = JSON.parse(dataJsonContent);

  console.log("🔍 Validating data.json structure...");

  if (!data.build || !data.build.id || !data.build.projectId) {
    throw new Error("Invalid data.json structure: missing build data");
  }

  const { build } = data;

  console.log("✅ Data validation successful");
  console.log(`📊 Build ID: ${build.id}`);
  console.log(`📊 Project ID: ${build.projectId}`);
  console.log(`📊 Version: ${build.version}`);
  console.log(`📊 Found ${build.instances.length} instances`);
  console.log(`📊 Found ${build.props.length} props`);
  console.log(`📊 Found ${data.assets.length} assets`);
  console.log(`📊 Found ${data.pages.length} pages`);

  // 2. Create context
  const context = createMinimalContext();

  // 3. Create new project
  console.log("🏗️  Creating new project...");
  const newProjectId = crypto.randomUUID();

  const newProject = await context.postgrest.client
    .from("Project")
    .insert({
      id: newProjectId,
      title: projectTitle,
      domain: generateDomain(projectTitle),
      userId: userId || null,
    })
    .select("*")
    .single();

  if (newProject.error) {
    throw new Error(`Failed to create project: ${newProject.error.message}`);
  }

  console.log(`✅ Project created with ID: ${newProjectId}`);

  // 4. Create build with imported data
  console.log("🔨 Creating build with imported data...");

  // Convert the build data back to the serialized format expected by the database
  const newBuildId = crypto.randomUUID();
  const buildData = {
    id: newBuildId,
    projectId: newProjectId,
    version: 0, // Start with version 0 for imported project
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Serialize the data back to JSON strings as stored in the database
    pages: JSON.stringify(build.pages),
    breakpoints: JSON.stringify(build.breakpoints.map(([id, item]) => item)),
    styles: JSON.stringify(build.styles.map(([key, item]) => item)),
    styleSources: JSON.stringify(build.styleSources.map(([id, item]) => item)),
    styleSourceSelections: JSON.stringify(
      build.styleSourceSelections.map(([id, item]) => item)
    ),
    props: JSON.stringify(build.props.map(([id, item]) => item)),
    dataSources: JSON.stringify(build.dataSources.map(([id, item]) => item)),
    resources: JSON.stringify(build.resources.map(([id, item]) => item)),
    instances: JSON.stringify(build.instances.map(([id, item]) => item)),

    // Clear deployment info for imported project
    deployment: null,
    marketplaceProduct: JSON.stringify({}),
  };

  // 5. Insert build
  const newBuild = await context.postgrest.client
    .from("Build")
    .insert(buildData);

  if (newBuild.error) {
    throw new Error(`Failed to create build: ${newBuild.error.message}`);
  }

  console.log(`✅ Build created with ID: ${newBuildId}`);

  // 6. Handle assets (informational only)
  if (data.assets.length > 0) {
    console.log(`⚠️  Note: ${data.assets.length} assets found in data.json`);
    console.log("   Asset metadata will need to be imported separately");
    console.log("   Actual asset files will need to be uploaded manually");

    // Log asset info for manual handling
    console.log("\n📄 Assets found:");
    data.assets.forEach((asset, index) => {
      console.log(`   ${index + 1}. ${asset.name} (${asset.type})`);
    });
  }

  return {
    projectId: newProjectId,
    buildId: newBuildId,
    projectTitle,
    assetCount: data.assets.length,
    originalProjectId: build.projectId,
    originalBuildId: build.id,
  };
};

async function main() {
  try {
    const args = parseArgs();

    console.log("🚀 Starting data.json import...");
    console.log(`📝 Project Title: ${args.projectTitle}`);
    console.log(`👤 User ID: ${args.userId || "Current authenticated user"}`);

    const result = await importDataJson(
      args.dataJsonPath,
      args.projectTitle,
      args.userId
    );

    console.log("\n🎉 Import completed successfully!");
    console.log(`📋 New Project ID: ${result.projectId}`);
    console.log(`🔨 New Build ID: ${result.buildId}`);
    console.log(`📊 Assets to handle: ${result.assetCount}`);
    console.log(`🔗 Original Project ID: ${result.originalProjectId}`);
    console.log(`🔗 Original Build ID: ${result.originalBuildId}`);

    // Save result to file if requested
    if (args.outputFile) {
      const outputData = {
        ...result,
        importDate: new Date().toISOString(),
        originalDataJsonPath: args.dataJsonPath,
      };

      writeFileSync(args.outputFile, JSON.stringify(outputData, null, 2));
      console.log(`💾 Results saved to: ${args.outputFile}`);
    }

    console.log("\n🔗 You can now access your project at:");
    console.log(`   http://localhost:3000/builder/${result.projectId}`);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
