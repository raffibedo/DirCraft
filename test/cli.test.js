import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { vol } from "memfs";
import path from "path";

// Mock readline before importing any module that uses it
jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((query, callback) => callback("y")),
    close: jest.fn(),
  }),
}));

// Import the functions we need to test
import { parseArgs, parseDirectoryStructure } from "../src/dircraft.js";
import { main } from "../bin/cli.js";

describe("CLI dircraft", () => {
  // Mock the file system and console
  beforeEach(() => {
    // Create virtual file system structure
    vol.fromJSON({
      "/tmp/test-structure.txt": `project/
├── src/
│   ├── components/
│   │   ├── Button.js # Button component
│   │   └── Input.js
│   └── index.js
└── package.json # Project dependencies`,
    });

    // Mock console.log and console.error for silent tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock environment for tests
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
    // Clean up virtual file system
    vol.reset();
  });

  test("parseArgs processes arguments correctly", () => {
    const args = parseArgs(["structure.txt", "-o", "output"]);
    expect(args.filePath).toBe("structure.txt");
    expect(args.outputDir).toBe("output");
    expect(args.skipConfirmation).toBe(false);

    const argsWithSkip = parseArgs(["structure.txt", "-y"]);
    expect(argsWithSkip.skipConfirmation).toBe(true);
  });

  test("main reports error when no file is specified", async () => {
    const result = await main();
    expect(result.exitCode).toBe(1);
  });

  test("main shows help with --help", async () => {
    const result = await main({ filePath: null, showHelp: true });
    expect(result.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalled();
  });

  // For this test, we modify the approach to avoid issues with memfs
  test("parseDirectoryStructure handles inputs correctly", async () => {
    // Use a mock for fileSystem instead of memfs directly
    const mockFileSystem = {
      readFile: jest.fn().mockResolvedValue(`project/
├── src/
│   ├── components/
│   │   ├── Button.js # Button component
│   │   └── Input.js
│   └── index.js
└── package.json # Project dependencies`),
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    const result = await parseDirectoryStructure(
      "/tmp/test-structure.txt",
      "/tmp/output",
      {
        skipConfirmation: true,
        fileSystem: mockFileSystem,
        logger: mockLogger,
      }
    );

    expect(result.success).toBe(true);
    expect(mockFileSystem.readFile).toHaveBeenCalledWith(
      "/tmp/test-structure.txt",
      "utf8"
    );
    expect(mockFileSystem.mkdir).toHaveBeenCalled();
    expect(mockFileSystem.writeFile).toHaveBeenCalled();
  });
});
