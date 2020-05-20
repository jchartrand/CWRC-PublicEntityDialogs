module.exports = {
	collectCoverage: true,
	collectCoverageFrom: ['./src/index.js'],
	coverageDirectory: './coverage',
	coverageThreshold: {
		global: {
			branches: 40,
			functions: 40,
			lines: 60,
			statements: 60,
		},
	},
	testMatch: ['**/test/test.js'],
};
