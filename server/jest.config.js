module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/feed/',
    '/src/federation/',
    '/src/notifications/',
    '/src/advanced-features/',
    '/src/neural-compensation/',
    '/src/virtual-real-estate/',
    '/src/stories/',
    '/src/comments/',
    '/src/users/',
    '/src/posts/',
  ],
};
