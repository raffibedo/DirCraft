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

// Import the functions from the new module
import {
  parseTreeStructure,
  extractNameAndComment,
  calculateIndentationLevel,
} from "../src/dircraft.js";

describe("ASCII Tree Structure Parser", () => {
  describe("extractNameAndComment", () => {
    test("correctly extracts name and comment from a simple line", () => {
      const line = "file.js # Test comment";
      const result = extractNameAndComment(line);

      expect(result.name).toBe("file.js");
      expect(result.comment).toBe("Test comment");
    });

    test("correctly extracts name without comment", () => {
      const line = "file.js";
      const result = extractNameAndComment(line);

      expect(result.name).toBe("file.js");
      expect(result.comment).toBe("");
    });

    test("cleans ASCII tree characters", () => {
      const line = "├── file.js # Comment";
      const result = extractNameAndComment(line);

      expect(result.name).toBe("file.js");
      expect(result.comment).toBe("Comment");
    });
  });

  describe("calculateIndentationLevel", () => {
    test("calculates level 0 for lines without indentation", () => {
      const line = "project/";
      const level = calculateIndentationLevel(line);

      expect(level).toBe(0);
    });

    test("calculates correct level for lines with vertical bars", () => {
      const line = "│   ├── file.js";
      const level = calculateIndentationLevel(line);

      // Should count one vertical bar
      expect(level).toBe(1);
    });

    test("calculates level for multiple indentation", () => {
      const line = "│   │   │   ├── file.js";
      const level = calculateIndentationLevel(line);

      // Should count three vertical bars
      expect(level).toBe(3);
    });
  });

  describe("parseTreeStructure", () => {
    test("correctly builds a simple structure", () => {
      const content = `project/
├── file1.js
├── file2.js`;

      const { paths, comments } = parseTreeStructure(content);

      expect(paths).toContain("project/");
      expect(paths).toContain("project/file1.js");
      expect(paths).toContain("project/file2.js");
    });

    test("correctly builds a structure with comments", () => {
      const content = `project/ # Root project
├── file1.js # Main script
├── file2.js # Utilities`;

      const { paths, comments } = parseTreeStructure(content);

      expect(comments["project/"]).toBe("Root project");
      expect(comments["project/file1.js"]).toBe("Main script");
      expect(comments["project/file2.js"]).toBe("Utilities");
    });

    test("correctly builds a structure with multiple levels", () => {
      const content = `project/
├── src/
│   ├── components/
│   │   ├── Button.js
│   │   └── Input.js
│   └── index.js
└── package.json`;

      const { paths } = parseTreeStructure(content);

      expect(paths).toContain("project/");
      expect(paths).toContain("project/src/");
      expect(paths).toContain("project/src/components/");
      expect(paths).toContain("project/src/components/Button.js");
      expect(paths).toContain("project/src/components/Input.js");
      expect(paths).toContain("project/src/index.js");
      expect(paths).toContain("project/package.json");
    });
  });
});
