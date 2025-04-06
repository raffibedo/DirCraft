import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
  beforeAll,
  afterAll,
} from "@jest/globals";
import path from "path";
import fs from "fs/promises";
import os from "os";

// Mock readline before importing any module that uses it
jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((query, callback) => callback("y")),
    close: jest.fn(),
  }),
}));

// Import the functions we need to test
import {
  parseArgs,
  parseDirectoryFromText,
  parseTreeStructure,
} from "../src/dircraft.js";
import { main } from "../bin/cli.js";

describe("Direct Structure Input", () => {
  // Create a temporary directory for our tests
  let tempDir;

  beforeAll(async () => {
    tempDir = path.join(os.tmpdir(), `dircraft-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      // Clean up the temporary directory after all tests
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Error cleaning temporary directory:", error);
    }
  });

  beforeEach(() => {
    // Mock console.log and console.error for silent tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock environment for tests
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });

  test("parseArgs correctly processes --structure flag", () => {
    const sampleStructure = "project/\n├── src/\n└── README.md";

    // Test with short flag
    const shortFlagArgs = parseArgs(["-s", sampleStructure]);
    expect(shortFlagArgs.directStructure).toBe(sampleStructure);
    expect(shortFlagArgs.filePath).toBeNull();

    // Test with long flag
    const longFlagArgs = parseArgs(["--structure", sampleStructure]);
    expect(longFlagArgs.directStructure).toBe(sampleStructure);
    expect(longFlagArgs.filePath).toBeNull();

    // Test with other options combined
    const combinedArgs = parseArgs([
      "-s",
      sampleStructure,
      "-o",
      "./output",
      "-y",
    ]);
    expect(combinedArgs.directStructure).toBe(sampleStructure);
    expect(combinedArgs.outputDir).toBe("./output");
    expect(combinedArgs.skipConfirmation).toBe(true);
    expect(combinedArgs.filePath).toBeNull();
  });

  test("parseDirectoryFromText correctly processes a direct structure", async () => {
    const sampleStructure = `project/
├── src/
│   ├── components/
│   │   ├── Button.js # Button component
│   │   └── Input.js
│   └── index.js
└── package.json # Project dependencies`;

    // Setup mock filesystem
    const mockFileSystem = {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    // Use the temp directory for output
    const outputDir = path.join(tempDir, "mock-test");

    // Test the function
    const result = await parseDirectoryFromText(sampleStructure, outputDir, {
      skipConfirmation: true,
      fileSystem: mockFileSystem,
      logger: mockLogger,
    });

    // Verify the result
    expect(result.success).toBe(true);

    // Check that directories were created
    expect(mockFileSystem.mkdir).toHaveBeenCalledWith(
      expect.stringContaining("project/"),
      { recursive: true }
    );
    expect(mockFileSystem.mkdir).toHaveBeenCalledWith(
      expect.stringContaining("project/src/"),
      { recursive: true }
    );
    expect(mockFileSystem.mkdir).toHaveBeenCalledWith(
      expect.stringContaining("project/src/components/"),
      { recursive: true }
    );

    // Check that files were created
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("Button.js"),
      ""
    );
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("Input.js"),
      ""
    );
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("index.js"),
      ""
    );
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      ""
    );
  });

  test("main function handles direct structure correctly", async () => {
    const sampleStructure = `test-project/
├── src/
│   └── index.js
└── README.md`; // No package.json to avoid Jest trying to parse it

    // Use a subdirectory in our temp directory
    const outputDir = path.join(tempDir, `main-test-${Date.now()}`);

    // Create options object to pass to main
    const options = {
      directStructure: sampleStructure,
      outputDir: outputDir,
      skipConfirmation: true,
      showHelp: false,
      filePath: null,
    };

    // Run the main function with our options
    const result = await main(options);

    // Check that main returned a successful exit code
    expect(result.exitCode).toBe(0);
  });

  test("parseTreeStructure handles invalid inputs correctly", () => {
    // Test with empty string
    const emptyResult = parseTreeStructure("");
    expect(emptyResult.paths).toEqual([]);
    expect(emptyResult.comments).toEqual({});

    // Test with malformed structure
    const malformedResult = parseTreeStructure("not a valid structure");
    // This should parse but only have one entry (the root)
    expect(malformedResult.paths.length).toBe(1);
    expect(malformedResult.paths[0]).toBe("not a valid structure");
  });

  test("handles empty structure gracefully", async () => {
    // Setup mock filesystem and logger
    const mockFileSystem = {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    // Test with empty structure
    const emptyResult = await parseDirectoryFromText(
      "",
      path.join(tempDir, "empty-test"),
      {
        skipConfirmation: true,
        fileSystem: mockFileSystem,
        logger: mockLogger,
      }
    );

    // Empty structure should be handled gracefully
    expect(emptyResult.success).toBe(false);
    expect(mockLogger.log).toHaveBeenCalledWith(
      "No valid structure found in the input."
    );
  });

  test("handles malformed structure input", async () => {
    // We need to check how parseDirectoryFromText behaves with a malformed input
    // First, let's understand what happens in the parseTreeStructure function
    const malformedStructure = "malformed-file.txt"; // Use a simple filename instead
    const parseResult = parseTreeStructure(malformedStructure);

    // Even though it's not a proper tree, it will be treated as a root path
    expect(parseResult.paths).toContain(malformedStructure);

    // Setup mock filesystem and logger
    const mockFileSystem = {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    // When we call parseDirectoryFromText with this malformed input
    const result = await parseDirectoryFromText(
      malformedStructure,
      path.join(tempDir, "malformed-test"),
      {
        skipConfirmation: true,
        fileSystem: mockFileSystem,
        logger: mockLogger,
      }
    );

    // It should succeed because it will create the file
    expect(result.success).toBe(true);
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(malformedStructure),
      ""
    );
  });
});
