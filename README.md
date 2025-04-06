# DirCraft

![Version](https://img.shields.io/npm/v/dircraft)
![License](https://img.shields.io/npm/l/dircraft)

DirCraft is a CLI tool for generating project structures from ASCII tree formatted text files or directly from the command line. It's specifically designed to work seamlessly with AI-generated directory structures from LLMs.

## Features

- 🚀 Instantly transform LLM-generated ASCII trees into real directory structures
- 📁 Supports complex structures with multiple levels of nesting
- 💬 Preserves comments as contextual information
- ✅ Interactive interface with confirmation before creating the structure
- 🔄 Option for execution without confirmation
- 📝 Direct structure input via command line parameter

## Why DirCraft?

When working with AI assistants like ChatGPT, Claude, or GitHub Copilot, you often receive project structures in ASCII tree format:

```
my-project/
├── src/                       # Source code
│   ├── components/            # Reusable components
│   │   ├── Button.jsx
│   │   └── Input.jsx
...
```

Instead of manually creating these directories and files, DirCraft allows you to:

- Copy-paste the structure directly into a command
- Generate the entire directory tree in seconds
- Preserve the comments and context provided by the AI

## Installation

### Global (recommended)

```bash
npm install -g dircraft
```

### Local in a project

```bash
npm install dircraft --save-dev
```

## Usage

### Structure file format

Create a text file (e.g., `structure.txt`) with the following format:

```
my-project/
├── src/                       # Source code
│   ├── components/            # Reusable components
│   │   ├── Button.jsx
│   │   └── Input.jsx
│   ├── pages/                 # Application pages
│   │   └── Home.jsx           # Main page
│   └── index.js               # Entry point
├── public/                    # Static files
│   └── index.html             # Main HTML
├── package.json               # Dependencies
└── README.md                  # Documentation
```

### Basic commands

```bash
# View help
dircraft --help

# Basic usage (with interactive confirmation)
dircraft structure.txt

# Specify output directory
dircraft -o ./destination-directory structure.txt

# Skip confirmation (useful for scripts)
dircraft -y structure.txt

# Provide structure directly from command line
dircraft -s "my-project/
├── src/
│   └── index.js
└── package.json"
```

### Available options

- `-h, --help`: Shows help
- `-y, --yes`: Skips confirmation
- `-o, --output <dir>`: Specifies the output directory (default: current directory)
- `-s, --structure <text>`: Provides the structure directly as text instead of from a file

## Interactive Demos

DirCraft comes with interactive demos to help you visualize how to use it for real-world scenarios:

### Using the demo commands

After installing DirCraft globally, you can run the demos directly from your terminal:

```bash
# Run the Next.js component generator demo
dircraft-next

# Run the component structure generator demo
dircraft-component
```

### Running demos from npm scripts

If you've cloned the repository for development:

```bash
# Run the Next.js component generator demo
npm run demo:next

# Run the component structure generator demo
npm run demo:component
```

### Demo Features

The demos will guide you through:

1. Creating component structures for Next.js applications
2. Setting up file organization based on best practices
3. Generating test and story files for components
4. Organizing component-specific hooks and utilities

Each demo is interactive and will prompt you for input to customize the generated structure.

## Examples

### Example 1: Create a basic React project structure

1. Create a `react-app.txt` file:

```
react-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

2. Run DirCraft:

```bash
dircraft react-app.txt
```

### Example 2: Create a complex Next.js structure

1. Create a `nextjs-project.txt` file with the desired structure
2. Run:

```bash
dircraft -o ./my-new-project nextjs-project.txt
```

### Example 3: Direct structure creation from command line

You can provide the structure directly as a parameter:

```bash
dircraft -s "blog-project/
├── content/
│   ├── posts/
│   └── pages/
├── src/
│   ├── components/
│   └── templates/
├── package.json
└── README.md" -o ./projects
```

**Note**: When providing a structure directly in the command line, you need to escape special characters according to your shell. For complex structures, using a file is still recommended.

### Example 4: Creating a browser extension project with Next.js

You can create complex project structures directly from the command line:

```bash
dircraft -s "extension-project/
├── public/                    # Static files
├── extension/                 # Extension code
│   ├── background/
│   ├── content/
│   ├── popup/
│   └── manifest.json
├── src/
│   ├── app/                   # Next.js 15 app
│   │   ├── page.tsx           # Main page
│   │   ├── layout.tsx         # Main layout
│   │   └── api/               # API routes
│   ├── components/            # Shared components
│   └── lib/                   # Utilities
├── next.config.js
└── package.json" -y
```

### Example 5: Creating a project from AI-generated structure

DirCraft is perfect for use with LLM-generated structures:

1. Ask an AI assistant (like Claude or ChatGPT) to suggest a project structure
2. Copy the ASCII tree output
3. Use DirCraft to create it instantly:

```bash
dircraft -s "<paste-ai-structure-here>"
```

## Advanced Use Cases

### Working with AI Development Workflows

DirCraft is designed to complement AI-assisted development workflows:

1. **LLM Architecture Design**: Have an AI suggest a project architecture
2. **Instant Scaffolding**: Use DirCraft to create the structure in seconds
3. **Code Generation**: Have the AI generate actual code for key files
4. **Implementation**: Start developing with the proper foundation already in place

### Template Repositories

Create and maintain your own library of project structure templates:

```bash
# Create a templates directory
mkdir -p ~/.dircraft/templates

# Save different project structures
cat > ~/.dircraft/templates/nextjs-app.txt << EOF
nextjs-app/
├── src/
│   ├── app/
│   │   └── page.tsx
...
EOF

# Use your templates
dircraft ~/.dircraft/templates/nextjs-app.txt -o ./my-new-project
```

## Development and Tests

### Setting up development environment

```bash
# Clone the repository
git clone https://github.com/raffibedo/dircraft.git
cd dircraft

# Install dependencies
npm install

# Link the package locally
npm link
```

### Running tests

```bash
# Run all tests
npm test

# Run tests with watch mode (for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test structure

- **Unit tests**: Test individual functions
- **CLI tests**: Test the command line interface
- **Integration tests**: Test the complete flow (requires additional configuration)

To contribute new tests, review the files in the `test/` directory for examples.

## Contributions

Contributions are welcome. Please review the [CONTRIBUTING.md](CONTRIBUTING.md) file for contribution guidelines.

## License

[MIT](LICENSE)
