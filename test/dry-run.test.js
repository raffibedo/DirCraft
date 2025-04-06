import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

// Mock readline before importing any module that uses it
jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((query, callback) => callback("y")),
    close: jest.fn(),
  }),
}));

// Import the functions we need to test
import { parseArgs, parseDirectoryFromText } from "../src/dircraft.js";
import { main } from "../bin/cli.js";

describe("Dry Run Mode", () => {
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

  test("parseArgs correctly processes --dry-run flag", () => {
    // Test with short flag
    const shortFlagArgs = parseArgs(["-d"]);
    expect(shortFlagArgs.dryRun).toBe(true);

    // Test with long flag
    const longFlagArgs = parseArgs(["--dry-run"]);
    expect(longFlagArgs.dryRun).toBe(true);

    // Test with other options combined
    const combinedArgs = parseArgs([
      "-s",
      "sample structure",
      "-o",
      "./output",
      "-d",
    ]);
    expect(combinedArgs.dryRun).toBe(true);
    expect(combinedArgs.outputDir).toBe("./output");
  });

  test("Dry run mode doesn't create files", async () => {
    const sampleStructure = `test-project/
├── src/
│   └── index.js
└── README.md`;

    // Mock file system operations
    const mockFileSystem = {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    // Run with dry-run mode
    const result = await parseDirectoryFromText(
      sampleStructure,
      "/test/output",
      {
        skipConfirmation: true,
        dryRun: true,
        fileSystem: mockFileSystem,
        logger: mockLogger,
      }
    );

    // Function should succeed
    expect(result.success).toBe(true);

    // But no files should be created
    expect(mockFileSystem.mkdir).not.toHaveBeenCalled();
    expect(mockFileSystem.writeFile).not.toHaveBeenCalled();

    // Dry run message should be logged
    expect(mockLogger.log).toHaveBeenCalledWith(
      "DRY RUN: No files or directories were created."
    );
  });

  test("main function passes dry-run flag correctly", async () => {
    const sampleStructure = `test-project/
├── src/
│   └── index.js
└── README.md`;

    // Create options object to pass to main with dry-run enabled
    const options = {
      directStructure: sampleStructure,
      outputDir: "./test-output",
      skipConfirmation: true,
      showHelp: false,
      dryRun: true,
      filePath: null,
    };

    // Run the main function with dry-run option
    const result = await main(options);

    // Check that main returned a successful exit code
    expect(result.exitCode).toBe(0);

    // Check that the dry run message was logged (but no actual files created)
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("DRY RUN")
    );
  });
});
