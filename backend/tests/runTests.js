/**
 * This is a simple test runner script that can be used to run specific tests or all tests.
 * 
 * Usage:
 * node tests/runTests.js                   # Run all tests
 * node tests/runTests.js models            # Run all model tests
 * node tests/runTests.js controllers       # Run all controller tests
 * node tests/runTests.js middleware        # Run all middleware tests
 * node tests/runTests.js user              # Run all user-related tests
 * node tests/runTests.js workout           # Run all workout-related tests
 */

const { execSync } = require('child_process');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const testType = args[0] || '';

// Define test patterns
const testPatterns = {
  '': 'tests/**/*.test.js',                         // All tests
  'models': 'tests/models/**/*.test.js',            // All model tests
  'controllers': 'tests/controllers/**/*.test.js',  // All controller tests
  'middleware': 'tests/middleware/**/*.test.js',    // All middleware tests
  'user': 'tests/**/user*.test.js',                 // All user-related tests
  'workout': 'tests/**/workout*.test.js'            // All workout-related tests
};

// Determine the test pattern
const testPattern = testPatterns[testType] || testPatterns[''];

try {
  console.log(`\n🧪 Running tests: ${testPattern}\n`);
  
  // Run the tests
  execSync(`npx jest ${testPattern} --colors`, { stdio: 'inherit' });
  
  console.log('\n✅ All tests completed successfully!\n');
} catch (error) {
  console.error('\n❌ Some tests failed!\n');
  process.exit(1);
}