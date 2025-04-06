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
import { parseDirectoryFromText } from "../src/dircraft.js";

describe("Direct Structure Input with memfs", () => {
  beforeEach(() => {
    // Reset virtual file system
    vol.reset();
    
    // Mock console.log and console.error for silent tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });

  test("parseDirectoryFromText creates correct structure with memfs", async () => {
    const sampleStructure = `test-project/
├── src/
│   ├── components/
│   │   └── Button.js
│   └── index.js
└── README.md`;  // No package.json

    // Setup virtual file system
    const outputDir = "/virtual/output";
    vol.mkdirSync(outputDir, { recursive: true });

    // Mock logger
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    // Run the function with memfs as the file system
    const result = await parseDirectoryFromText(
      sampleStructure,
      outputDir,
      {
        skipConfirmation: true,
        fileSystem: {
          mkdir: vol.mkdirSync.bind(vol),
          writeFile: vol.writeFileSync.bind(vol),
        },
        logger: mockLogger,
      }
    );

    // Check the result
    expect(result.success).toBe(true);

    // Verify the created directories and files
    const rootDir = path.join(outputDir, "test-project");
    const srcDir = path.join(rootDir, "src");
    const componentsDir = path.join(srcDir, "components");
    
    // Check directories
    expect(vol.existsSync(rootDir)).toBe(true);
    expect(vol.existsSync(srcDir)).toBe(true);
    expect(vol.existsSync(componentsDir)).toBe(true);
    
    // Check files
    expect(vol.existsSync(path.join(rootDir, "README.md"))).toBe(true);
    expect(vol.existsSync(path.join(srcDir, "index.js"))).toBe(true);
    expect(vol.existsSync(path.join(componentsDir, "Button.js"))).toBe(true);
  });

  test("parseDirectoryFromText handles malformed input with memfs", async () => {
    const malformedStructure = "just-a-file.txt";

    // Setup virtual file system
    const outputDir = "/virtual/malformed";
    vol.mkdirSync(outputDir, { recursive: true });

    // Mock logger
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    // Run the function with memfs as the file system
    const result = await parseDirectoryFromText(
      malformedStructure,
      outputDir,
      {
        skipConfirmation: true,
        fileSystem: {
          mkdir: vol.mkdirSync.bind(vol),
          writeFile: vol.writeFileSync.bind(vol),
        },
        logger: mockLogger,
      }
    );

    // Check the result
    expect(result.success).toBe(true);

    // Verify that only the single file was created
    const filePath = path.join(outputDir, malformedStructure);
    expect(vol.existsSync(filePath)).toBe(true);
    
    // Check that the content is empty
    expect(vol.readFileSync(filePath, 'utf8')).toBe('');
  });
});