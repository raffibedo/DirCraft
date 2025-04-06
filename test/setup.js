// test/setup.js

// Make sure we're in test environment
process.env.NODE_ENV = "test";

// Configure Node to not exit when process.exit is called
const originalExit = process.exit;
process.exit = (code) => {
  console.log(`process.exit called with "${code}"`);
  // Do nothing in tests to prevent the process from closing
};

// We don't do global mock of readline, we'll do it in each test specifically
