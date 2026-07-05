import prettier from 'eslint-config-prettier';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));
const prettierIgnorePath = fileURLToPath(new URL('../../.prettierignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath, 'gitignore'),
	includeIgnoreFile(prettierIgnorePath, 'prettierignore'),
	js.configs.recommended,
	...ts.configs.recommended,
	prettier,
	{
		languageOptions: {
			globals: { ...globals.node, ...globals['shared-node-browser'] }
		},
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname
			}
		}
	}
);
