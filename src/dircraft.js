import { promises as fs } from "fs";
import path from "path";
import readline from "readline";

/**
 * Creates a command line interface for user interaction
 * @returns {readline.Interface}
 */
export function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompts the user for confirmation
 * @param {string} message - Message to display
 * @returns {Promise<boolean>} - true if user confirms, false otherwise
 */
export async function confirmAction(message) {
  const rl = createInterface();

  return new Promise((resolve) => {
    rl.question(`${message} (Y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes" || answer === "");
    });
  });
}

/**
 * Extracts the clean name and comment from a line in the structure
 * @param {string} line - Line to process
 * @returns {Object} - Object with name and comment
 */
export function extractNameAndComment(line) {
  // Separate name and comment
  const parts = line.split("#");
  const rawName = parts[0].trim();
  const comment = parts.length > 1 ? parts[1].trim() : "";

  // Clean the name (remove ASCII tree characters)
  const cleanName = rawName.replace(/^[\s│]*[├└]──\s*/, "").trim();

  return { name: cleanName, comment };
}

/**
 * Calculates the indentation level based on ASCII tree characters
 * @param {string} line - Line to analyze
 * @returns {number} - Indentation level
 */
export function calculateIndentationLevel(line) {
  // Count │ characters to determine the level
  const matches = line.match(/│/g);
  return matches ? matches.length : 0;
}

/**
 * Parses the hierarchical structure of a file in ASCII tree format
 * @param {string} content - File content
 * @returns {Object} - Parsed structure with paths and comments
 */
export function parseTreeStructure(content) {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return { paths: [], comments: {} };

  // Get the root
  const { name: rootName, comment: rootComment } = extractNameAndComment(
    lines[0]
  );

  // Structures to store the result
  const paths = []; // List of complete paths
  const comments = {}; // Map of comments by path

  // If there's a root name, add it
  if (rootName) {
    paths.push(rootName);
    if (rootComment) {
      comments[rootName] = rootComment;
    }
  }

  // Stack to track parents at each level
  const parentStack = [rootName];

  // Process lines starting from the second
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Get the indentation level
    const level = calculateIndentationLevel(line);

    // Extract name and comment
    const { name, comment } = extractNameAndComment(line);
    if (!name) continue;

    // Adjust the parent stack based on level
    // If we're deeper than the current stack, keep the current parent
    // If we're at a previous level, go back in the stack
    while (parentStack.length > level + 1) {
      parentStack.pop();
    }

    // Build the full path
    const parentPath = parentStack[parentStack.length - 1] || "";
    const fullPath = parentPath + name;

    // Save the full path
    paths.push(fullPath);

    // If it's a directory, update the stack for children
    if (name.endsWith("/")) {
      parentStack.push(fullPath);
    }

    // Save comment if it exists
    if (comment) {
      comments[fullPath] = comment;
    }
  }

  return { paths, comments };
}

/**
 * Groups paths into directories and files
 * @param {Array} paths - List of paths
 * @returns {Object} - Object with directories and files
 */
export function separateDirectoriesAndFiles(paths) {
  const directories = new Set();
  const files = [];

  // Process each path
  for (const filePath of paths) {
    if (filePath.endsWith("/")) {
      // It's a directory
      directories.add(filePath);
    } else {
      // It's a file
      files.push(filePath);

      // Ensure all parent directories exist
      let currentDir = path.dirname(filePath);
      while (currentDir && currentDir !== ".") {
        directories.add(currentDir + "/");
        currentDir = path.dirname(currentDir);
      }
    }
  }

  // Sort directories by depth (least nested first)
  const sortedDirectories = Array.from(directories).sort((a, b) => {
    const aDepth = (a.match(/\//g) || []).length;
    const bDepth = (b.match(/\//g) || []).length;
    return aDepth - bDepth;
  });

  return { directories: sortedDirectories, files };
}

/**
 * Parses a file containing a directory structure in ASCII tree format
 * @param {string} filePath - Path to the file containing the structure
 * @param {string} outputDir - Directory where to create the structure
 * @param {Object} options - Additional options
 * @param {boolean} options.skipConfirmation - If true, skips confirmation
 * @param {Object} options.logger - Object for logging (console by default)
 * @param {Object} options.fileSystem - File system to use (fs by default)
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
export async function parseDirectoryStructure(
  filePath,
  outputDir = ".",
  options = {}
) {
  const logger = options.logger || console;
  const fileSystem = options.fileSystem || fs;

  try {
    // Read file content
    logger.log(`Reading structure from: ${filePath}`);
    const content = await fileSystem.readFile(filePath, "utf8");

    logger.log("Analyzing structure...");

    // Parse the complete structure
    const { paths, comments } = parseTreeStructure(content);

    // Separate directories and files
    const { directories, files } = separateDirectoriesAndFiles(paths);

    // Check if there are directories or files
    if (directories.length === 0 && files.length === 0) {
      logger.log("No valid structure found in the file.");
      return { success: false };
    }

    // Show summary
    logger.log("\nSummary of the structure to create:");
    logger.log(`- Directories: ${directories.length}`);
    logger.log(`- Files: ${files.length}`);
    logger.log(`- Destination directory: ${outputDir}\n`);

    // Simulate creation to verify
    logger.log("Structure that will be created:");
    for (const dir of directories) {
      logger.log(`  📁 ${dir}${comments[dir] ? ` (${comments[dir]})` : ""}`);
    }
    for (const file of files) {
      logger.log(`  📄 ${file}${comments[file] ? ` (${comments[file]})` : ""}`);
    }
    logger.log();

    // Request confirmation if necessary
    let shouldProceed = options.skipConfirmation;
    if (!shouldProceed) {
      shouldProceed = await confirmAction(
        "Do you want to create this structure?"
      );
    }

    if (!shouldProceed) {
      logger.log("Operation cancelled.");
      return { success: false };
    }

    logger.log("Creating structure...");

    // Create directories
    for (const dir of directories) {
      const dirPath = path.join(outputDir, dir);
      await fileSystem.mkdir(dirPath, { recursive: true });
      const commentMsg = comments[dir] ? ` (${comments[dir]})` : "";
      logger.log(`✅ Directory created: ${dirPath}${commentMsg}`);
    }

    // Create files
    for (const file of files) {
      const filePath = path.join(outputDir, file);

      // Ensure parent directory exists
      const parentDir = path.dirname(filePath);
      await fileSystem.mkdir(parentDir, { recursive: true });

      // Create empty file
      await fileSystem.writeFile(filePath, "");
      const commentMsg = comments[file] ? ` (${comments[file]})` : "";
      logger.log(`📄 File created: ${filePath}${commentMsg}`);
    }

    logger.log(`\n✨ Structure successfully created in ${outputDir}`);
    return { success: true };
  } catch (error) {
    logger.error("\n❌ Error:", error.message);
    logger.error(error.stack);
    return { success: false, error };
  }
}

/**
 * Parses a directory structure directly from a text string
 * @param {string} structureText - String containing the structure in ASCII tree format
 * @param {string} outputDir - Directory where to create the structure
 * @param {Object} options - Additional options
 * @param {boolean} options.skipConfirmation - If true, skips confirmation
 * @param {Object} options.logger - Object for logging (console by default)
 * @param {Object} options.fileSystem - File system to use (fs by default)
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
export async function parseDirectoryFromText(
  structureText,
  outputDir = ".",
  options = {}
) {
  const logger = options.logger || console;
  const fileSystem = options.fileSystem || fs;

  try {
    logger.log("Analyzing structure from direct input...");

    // Parse the complete structure
    const { paths, comments } = parseTreeStructure(structureText);

    // Separate directories and files
    const { directories, files } = separateDirectoriesAndFiles(paths);

    // Check if there are directories or files
    if (directories.length === 0 && files.length === 0) {
      logger.log("No valid structure found in the input.");
      return { success: false };
    }

    // Show summary
    logger.log("\nSummary of the structure to create:");
    logger.log(`- Directories: ${directories.length}`);
    logger.log(`- Files: ${files.length}`);
    logger.log(`- Destination directory: ${outputDir}\n`);

    // Simulate creation to verify
    logger.log("Structure that will be created:");
    for (const dir of directories) {
      logger.log(`  📁 ${dir}${comments[dir] ? ` (${comments[dir]})` : ""}`);
    }
    for (const file of files) {
      logger.log(`  📄 ${file}${comments[file] ? ` (${comments[file]})` : ""}`);
    }
    logger.log();

    // Request confirmation if necessary
    let shouldProceed = options.skipConfirmation;
    if (!shouldProceed) {
      shouldProceed = await confirmAction(
        "Do you want to create this structure?"
      );
    }

    if (!shouldProceed) {
      logger.log("Operation cancelled.");
      return { success: false };
    }

    logger.log("Creating structure...");

    // Create directories
    for (const dir of directories) {
      const dirPath = path.join(outputDir, dir);
      await fileSystem.mkdir(dirPath, { recursive: true });
      const commentMsg = comments[dir] ? ` (${comments[dir]})` : "";
      logger.log(`✅ Directory created: ${dirPath}${commentMsg}`);
    }

    // Create files
    for (const file of files) {
      const filePath = path.join(outputDir, file);

      // Ensure parent directory exists
      const parentDir = path.dirname(filePath);
      await fileSystem.mkdir(parentDir, { recursive: true });

      // Create empty file
      await fileSystem.writeFile(filePath, "");
      const commentMsg = comments[file] ? ` (${comments[file]})` : "";
      logger.log(`📄 File created: ${filePath}${commentMsg}`);
    }

    logger.log(`\n✨ Structure successfully created in ${outputDir}`);
    return { success: true };
  } catch (error) {
    logger.error("\n❌ Error:", error.message);
    logger.error(error.stack);
    return { success: false, error };
  }
}

/**
 * Processes command line arguments
 * @param {Array} args - List of arguments
 * @returns {Object} Object with processed options
 */
export function parseArgs(args) {
  // If args is not provided, use process.argv
  const cliArgs = args || process.argv.slice(2);

  const options = {
    filePath: null,
    outputDir: ".",
    skipConfirmation: false,
    showHelp: false,
    directStructure: null, // New option for direct structure
  };

  for (let i = 0; i < cliArgs.length; i++) {
    const arg = cliArgs[i];

    if (arg === "-h" || arg === "--help") {
      options.showHelp = true;
    } else if (arg === "-y" || arg === "--yes") {
      options.skipConfirmation = true;
    } else if (arg === "-o" || arg === "--output") {
      options.outputDir = cliArgs[++i] || ".";
    } else if (arg === "-s" || arg === "--structure") {
      options.directStructure = cliArgs[++i] || null;
    } else if (!options.filePath && !options.directStructure) {
      options.filePath = arg;
    }
  }

  return options;
}

/**
 * Shows program help
 * @param {Object} logger - Object for logging (console by default)
 */
export function showHelp(logger = console) {
  logger.log(`
DirCraft - Project structure generator

Usage: dircraft [options] <structure-file>
   or: dircraft -s "<structure-text>"

Options:
  -h, --help              Shows this help
  -y, --yes               Skips confirmation
  -o, --output <dir>      Specifies the output directory (default: current directory)
  -s, --structure <text>  Provides the structure directly as text instead of from a file

Examples:
  dircraft structure.txt
  dircraft -y structure.txt
  dircraft -o ./my-project structure.txt
  dircraft -s "my-project/
├── src/
│   └── index.js
└── package.json"
  `);
}
