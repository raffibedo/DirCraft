#!/usr/bin/env node

import {
  parseArgs,
  showHelp,
  parseDirectoryStructure,
  parseDirectoryFromText,
} from "../src/dircraft.js";

/**
 * Main function that handles CLI execution
 * @param {Object} options - Options (to be able to pass options directly in tests)
 * @returns {Promise<{exitCode: number, error?: Error}>}
 */
async function main(options = null) {
  // If options are provided, use them, otherwise parse arguments
  const parsedOptions = options || parseArgs();

  if (
    parsedOptions.showHelp ||
    (!parsedOptions.filePath && !parsedOptions.directStructure)
  ) {
    showHelp();
    // Instead of process.exit, we return to facilitate testing
    return { exitCode: parsedOptions.showHelp ? 0 : 1 };
  }

  let result;

  // If direct structure is provided, use it
  if (parsedOptions.directStructure) {
    result = await parseDirectoryFromText(
      parsedOptions.directStructure,
      parsedOptions.outputDir,
      {
        skipConfirmation: parsedOptions.skipConfirmation,
      }
    );
  } else {
    // Otherwise use the file path
    result = await parseDirectoryStructure(
      parsedOptions.filePath,
      parsedOptions.outputDir,
      {
        skipConfirmation: parsedOptions.skipConfirmation,
      }
    );
  }

  // Return an exit code instead of calling process.exit directly
  return { exitCode: result.success ? 0 : 1, error: result.error };
}

// Only call process.exit if executed directly (not in tests)
if (process.env.NODE_ENV !== "test") {
  main()
    .then((result) => {
      if (result && typeof result.exitCode === "number") {
        process.exit(result.exitCode);
      }
    })
    .catch((error) => {
      console.error("Critical error:", error);
      console.error(error.stack);
      process.exit(1);
    });
}

// Export for testing
export { main };
