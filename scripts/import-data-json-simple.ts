#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Simple argument parsing
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

  // Validate required fields
  if (!parsed.dataJsonPath) {
    throw new Error("--dataJsonPath is required");
  }
  if (!parsed.projectTitle) {
    throw new Error("--projectTitle is required");
  }

  return parsed as ImportArgs;
}

// Simple data structure validation
interface WebstudioData {
  pages: any;
  instances: any[];
  props: any[];
  dataSources: any[];
  resources: any[];
  breakpoints: any[];
  styleSourceSelections: any[];
  styleSources: any[];
  styles: any[];
  assets: any[];
}

export const importDataJsonSimple = async (
  dataJsonPath: string,
  projectTitle: string,
  userId?: string
) => {
  console.log(`📁 Reading data.json from: ${dataJsonPath}`);

  // 1. Parse data.json
  const dataJsonContent = readFileSync(dataJsonPath, "utf8");
  const dataJson = JSON.parse(dataJsonContent);

  console.log("🔍 Validating data.json structure...");

  // Basic validation of data.json structure
  if (!dataJson.pages || !dataJson.instances || !dataJson.props) {
    throw new Error(
      "Invalid data.json structure: missing required fields (pages, instances, props)"
    );
  }

  const webstudioData: WebstudioData = {
    pages: dataJson.pages,
    instances: dataJson.instances || [],
    props: dataJson.props || [],
    dataSources: dataJson.dataSources || [],
    resources: dataJson.resources || [],
    breakpoints: dataJson.breakpoints || [],
    styleSourceSelections: dataJson.styleSourceSelections || [],
    styleSources: dataJson.styleSources || [],
    styles: dataJson.styles || [],
    assets: dataJson.assets || [],
  };

  console.log("✅ Data validation successful");
  console.log(`📊 Found ${webstudioData.instances.length} instances`);
  console.log(`📊 Found ${webstudioData.props.length} props`);
  console.log(`📊 Found ${webstudioData.assets.length} assets`);
  console.log(`📊 Found ${webstudioData.pages.pages?.length + 1 || 1} pages`);

  // 2. Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 3. Create project
  console.log("🏗️  Creating new project...");
  const projectId = crypto.randomUUID();
  const domain =
    projectTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") +
    "-" +
    Math.random().toString(36).substring(2, 8);

  const { error: projectError } = await supabase.from("Project").insert({
    id: projectId,
    title: projectTitle,
    domain: domain,
    userId: userId,
    createdAt: new Date().toISOString(),
  });

  if (projectError) {
    throw new Error(`Failed to create project: ${projectError.message}`);
  }

  console.log(`✅ Project created with ID: ${projectId}`);

  // 4. Create build with imported data
  console.log("🔨 Creating build with imported data...");
  const buildId = crypto.randomUUID();

  const buildData = {
    id: buildId,
    projectId: projectId,
    version: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: JSON.stringify(webstudioData.pages),
    breakpoints: JSON.stringify(webstudioData.breakpoints),
    styles: JSON.stringify(webstudioData.styles),
    styleSources: JSON.stringify(webstudioData.styleSources),
    styleSourceSelections: JSON.stringify(webstudioData.styleSourceSelections),
    props: JSON.stringify(webstudioData.props),
    dataSources: JSON.stringify(webstudioData.dataSources),
    resources: JSON.stringify(webstudioData.resources),
    instances: JSON.stringify(webstudioData.instances),
    deployment: null,
    marketplaceProduct: JSON.stringify({}),
  };

  const { error: buildError } = await supabase.from("Build").insert(buildData);

  if (buildError) {
    throw new Error(`Failed to create build: ${buildError.message}`);
  }

  console.log(`✅ Build created with ID: ${buildId}`);

  // 5. Handle assets (informational only)
  if (webstudioData.assets.length > 0) {
    console.log(
      `⚠️  Note: ${webstudioData.assets.length} assets found in data.json`
    );
    console.log("   You'll need to manually upload the actual asset files");
    console.log(
      "   The asset metadata has been imported, but files are missing"
    );
  }

  return {
    projectId,
    buildId: buildId,
    projectTitle,
    assetCount: webstudioData.assets.length,
  };
};

async function main() {
  try {
    const args = parseArgs();

    console.log("🚀 Starting data.json import (simple version)...");
    console.log(`📝 Project Title: ${args.projectTitle}`);
    console.log(`👤 User ID: ${args.userId || "Not specified"}`);

    const result = await importDataJsonSimple(
      args.dataJsonPath,
      args.projectTitle,
      args.userId
    );

    console.log("\n🎉 Import completed successfully!");
    console.log(`📋 Project ID: ${result.projectId}`);
    console.log(`🔨 Build ID: ${result.buildId}`);
    console.log(`📊 Assets to upload: ${result.assetCount}`);

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
