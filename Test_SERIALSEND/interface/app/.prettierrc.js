// prettier.config.js, .prettierrc.js, prettier.config.mjs, or .prettierrc.mjs

/** @type {import("prettier").Config} */
const config = {
	semi: false,
	trailingComma: 'es5',
	singleQuote: true,
	bracketSameLine: true,
	jsxBracketSameLine: true,
	arrowParens: 'avoid',
	printWidth: 150,
	plugins: ['prettier-plugin-tailwindcss'],
	tailwindAttributes: ['theme'],
	tailwindFunctions: ['twMerge', 'createTheme'],
}

export default config
