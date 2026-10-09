module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: 2019,
		sourceType: 'module',
	},
	ignorePatterns: ['dist/**', 'node_modules/**', '.eslintrc.js'],
	overrides: [
		{
			files: ['package.json'],
			parser: 'jsonc-eslint-parser',
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/community'],
		},
		{
			files: ['credentials/**/*.ts'],
			parser: '@typescript-eslint/parser',
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			rules: {
				// Per this rule's own docs: "Only applicable to nodes in the main
				// repository" (n8n's own core repo). Its "autofix" camelCases the
				// entire URL value, not just the property name — for a community
				// package's real HTTP URL that's destructive, not a style fix.
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			},
		},
		{
			files: ['nodes/**/*.ts'],
			parser: '@typescript-eslint/parser',
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/nodes'],
			rules: {
				// These predate NodeConnectionTypes and demand the string literal
				// ['main']. n8n's current verification scanner
				// (@n8n/eslint-plugin-community-nodes, node-connection-type-literal)
				// requires the opposite: [NodeConnectionTypes.Main].
				'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
				'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
			},
		},
	],
}
