#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import os from "os";
import readline from "readline";

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");
const CLI_PATH = path.join(ROOT_DIR, "bin/cli.js");

// Create temporary directory for tests
const TEMP_DIR = path.join("demos/", `dircraft-nextjs-demo-${Date.now()}`);

/**
 * Creates a command line interface for user interaction
 * @returns {readline.Interface}
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user for input
 * @param {string} message - Message to display
 * @returns {Promise<string>} - User input
 */
async function promptUser(message) {
  const rl = createInterface();

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Generate a Next.js component structure
 * @param {string} componentName - Component name
 * @param {boolean} isPageComponent - Whether it's a page component
 * @param {boolean} hasTests - Whether to include tests
 * @param {boolean} hasStories - Whether to include stories (Storybook)
 * @returns {string} - Component structure
 */
function generateComponentStructure(
  componentName,
  isPageComponent = false,
  hasTests = true,
  hasStories = true
) {
  let structure = `${componentName}/
├── ${componentName}.jsx            # Main component
├── ${componentName}.module.css     # Component styles
├── index.js                        # Default export`;

  if (hasTests) {
    structure += `
├── ${componentName}.test.jsx       # Unit tests`;
  }

  if (hasStories) {
    structure += `
├── ${componentName}.stories.jsx    # Stories for Storybook`;
  }

  if (isPageComponent) {
    structure += `
├── hooks/                          # Component-specific hooks
│   └── use${componentName}Data.js  # Hook to fetch data`;
  }

  return structure;
}

/**
 * Create a component structure file
 * @param {string} outputDir - Output directory
 * @param {string} structure - Component structure
 * @returns {Promise<string>} - Path to the created file
 */
async function createComponentStructureFile(outputDir, structure) {
  const filePath = path.join(TEMP_DIR, "component-structure.txt");

  // Write structure to file
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, structure);

  return filePath;
}

/**
 * Run the component generator
 */
async function main() {
  try {
    console.log("=== Next.js 15 Component Generator ===\n");

    // Create temporary directory
    await fs.mkdir(TEMP_DIR, { recursive: true });

    // Request information from user
    const componentName = await promptUser("Component name: ");
    const isPageComponent = (
      await promptUser("Is this a page component? (y/n): ")
    )
      .toLowerCase()
      .startsWith("y");
    const hasTests = (await promptUser("Include tests? (y/n): "))
      .toLowerCase()
      .startsWith("y");
    const hasStories = (
      await promptUser("Include stories for Storybook? (y/n): ")
    )
      .toLowerCase()
      .startsWith("y");

    // Output directory (current directory by default)
    let outputDir = await promptUser(
      "Output directory (empty to use current directory): "
    );
    outputDir = outputDir.trim() || ".";

    // Generate structure
    const structure = generateComponentStructure(
      componentName,
      isPageComponent,
      hasTests,
      hasStories
    );

    // Show structure
    console.log("\nStructure to create:");
    console.log(structure);
    console.log();

    // Confirm
    const confirm = await promptUser("Create this structure? (y/n): ");
    if (!confirm.toLowerCase().startsWith("y")) {
      console.log("Operation cancelled.");
      process.exit(0);
    }

    // Create structure file
    const structureFile = await createComponentStructureFile(
      outputDir,
      structure
    );

    // Run Scaffoldy
    console.log("\nCreating component structure...");
    try {
      const output = execSync(
        `node ${CLI_PATH} "${structureFile}" -o "${outputDir}" -y`,
        {
          encoding: "utf-8",
        }
      );
      console.log(output);

      console.log(
        `\n✅ Component ${componentName} successfully created in ${outputDir}/${componentName}`
      );
    } catch (error) {
      console.error("Error creating component:", error.message);
      if (error.stdout) console.log(error.stdout);
      if (error.stderr) console.error(error.stderr);
    }

    // Clean up temporary files
    try {
      await fs.rm(structureFile);
      await fs.rmdir(TEMP_DIR, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Execute script
main().catch((error) => {
  console.error("Critical error:", error);
  process.exit(1);
});
