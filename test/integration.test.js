import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { fileURLToPath } from "url";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { execSync } from "child_process";

// Mock readline before importing any module that uses it
jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((query, callback) => callback("y")),
    close: jest.fn(),
  }),
}));

// Import function for testing
import { parseDirectoryFromText } from "../src/dircraft.js";

// Get path relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// These tests perform real operations on the file system
// They should only be run in CI or controlled development environments
describe("Integration Tests for Direct Structure Input", () => {
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = path.join(os.tmpdir(), `dircraft-direct-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      // Clean up temporary directory
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Error cleaning temporary directory:", error);
    }
  });

  // This test uses the parseDirectoryFromText function directly
  test.skip("creates real structure from direct input", async () => {
    // Define a test structure
    const testStructure = `test-direct-project/
├── src/
│   ├── components/
│   │   └── Button.js           # Button component
│   └── index.js                # Entry point
├── public/
│   └── index.html              # HTML template
└── package.json                # Dependencies`;

    // Output directory
    const outputDir = path.join(tempDir, "output");

    try {
      // Mock console to avoid output during tests
      const mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
      };

      // Run the function directly with skipConfirmation
      const result = await parseDirectoryFromText(testStructure, outputDir, {
        skipConfirmation: true,
        logger: mockLogger,
      });

      expect(result.success).toBe(true);

      // Verify that the structures were created
      const rootExists = await fs
        .access(path.join(outputDir, "test-direct-project"))
        .then(() => true)
        .catch(() => false);

      expect(rootExists).toBe(true);

      // Verify specific components
      const srcExists = await fs
        .access(path.join(outputDir, "test-direct-project/src"))
        .then(() => true)
        .catch(() => false);

      expect(srcExists).toBe(true);

      const buttonExists = await fs
        .access(
          path.join(outputDir, "test-direct-project/src/components/Button.js")
        )
        .then(() => true)
        .catch(() => false);

      expect(buttonExists).toBe(true);

      const packageExists = await fs
        .access(path.join(outputDir, "test-direct-project/package.json"))
        .then(() => true)
        .catch(() => false);

      expect(packageExists).toBe(true);
    } catch (error) {
      console.error("Error in integration test:", error);
      throw error;
    }
  });

  // This test uses the CLI directly via execSync
  // It's skipped by default to avoid actual execution during automated tests
  test.skip("CLI creates structure from direct input", async () => {
    const outputDir = path.join(tempDir, "cli-output");
    await fs.mkdir(outputDir, { recursive: true });

    const cliPath = path.join(__dirname, "..", "bin", "cli.js");

    // Define a simple structure for testing
    const testStructure = `test-cli-project/
├── src/
│   └── index.js
└── README.md`;

    try {
      // Execute the CLI with direct structure
      // Note: We need to escape newlines and other special characters for the shell
      const escapedStructure = testStructure
        .replace(/\n/g, "\\n")
        .replace(/'/g, "\\'");

      execSync(
        `node ${cliPath} -s "${escapedStructure}" -o "${outputDir}" -y`,
        { encoding: "utf-8" }
      );

      // Verify that files were created
      const indexExists = await fs
        .access(path.join(outputDir, "test-cli-project/src/index.js"))
        .then(() => true)
        .catch(() => false);

      expect(indexExists).toBe(true);

      const readmeExists = await fs
        .access(path.join(outputDir, "test-cli-project/README.md"))
        .then(() => true)
        .catch(() => false);

      expect(readmeExists).toBe(true);
    } catch (error) {
      console.error("Error in CLI integration test:", error);
      throw error;
    }
  });
});
