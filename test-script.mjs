import { grepSearch } from './dist/index.js';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Detect OS and set path accordingly
const rootDir = resolve(__dirname, '../../active');
const testDir = join(rootDir, 'choise');

async function runTest() {
  console.log('Testing grepSearch on choise project...\n');
  
  // Test 1: Find "const" declarations
  console.log('=== Test 1: Find "const" declarations ===');
  try {
    let count = 0;
    for await (const match of grepSearch({
      cwd: testDir,
      query: 'const',
      extensions: ['ts', 'js'],
      maxResults: 5,
    })) {
      console.log(`${match.file}:${match.line}:${match.column} - ${match.text.trim()}`);
      count++;
    }
    console.log(`Found ${count} matches\n`);
  } catch (error) {
    console.error('Test 1 failed:', error.message);
  }

  // Test 2: Find "export" statements
  console.log('=== Test 2: Find "export" statements ===');
  try {
    let count = 0;
    for await (const match of grepSearch({
      cwd: testDir,
      query: 'export',
      extensions: ['ts', 'js'],
      maxResults: 5,
    })) {
      console.log(`${match.file}:${match.line}:${match.column} - ${match.text.trim()}`);
      count++;
    }
    console.log(`Found ${count} matches\n`);
  } catch (error) {
    console.error('Test 2 failed:', error.message);
  }

  // Test 3: Find "function" declarations
  console.log('=== Test 3: Find "function" declarations ===');
  try {
    let count = 0;
    for await (const match of grepSearch({
      cwd: testDir,
      query: 'function',
      extensions: ['ts', 'js'],
      maxResults: 5,
    })) {
      console.log(`${match.file}:${match.line}:${match.column} - ${match.text.trim()}`);
      count++;
    }
    console.log(`Found ${count} matches\n`);
  } catch (error) {
    console.error('Test 3 failed:', error.message);
  }

  console.log('Test completed!');
}

runTest().catch(console.error);
