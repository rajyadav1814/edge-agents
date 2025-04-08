/**
 * This script generates a mock GitHub token for testing
 * It doesn't create a real token, but provides a valid format for testing
 */

// Generate a random string of the specified length
function generateRandomString(length: number): string {
  const characters = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Generate a mock GitHub token (40 characters hexadecimal)
function generateMockGitHubToken(): string {
  return generateRandomString(40);
}

// Generate a mock GitHub personal access token (fine-grained, longer format)
function generateMockGitHubPAT(): string {
  // Format: github_pat_<random>_<random>
  return `github_pat_${generateRandomString(22)}_${generateRandomString(59)}`;
}

// Generate a mock GitHub OAuth token
function generateMockGitHubOAuthToken(): string {
  // Format: gho_<random>
  return `gho_${generateRandomString(36)}`;
}

// Generate and display tokens
const mockToken = generateMockGitHubToken();
const mockPAT = generateMockGitHubPAT();
const mockOAuth = generateMockGitHubOAuthToken();

console.log('Mock GitHub Token:');
console.log(mockToken);
console.log('\nMock GitHub Personal Access Token (fine-grained):');
console.log(mockPAT);
console.log('\nMock GitHub OAuth Token:');
console.log(mockOAuth);

console.log('\nExport commands:');
console.log(`export GITHUB_TOKEN=${mockToken}`);
console.log(`export GITHUB_PERSONAL_ACCESS_TOKEN=${mockPAT}`);