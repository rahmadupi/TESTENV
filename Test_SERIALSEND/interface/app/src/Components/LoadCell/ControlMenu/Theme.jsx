// import type { CustomFlowbiteTheme } from "flowbite-react";

const customTheme = {
	table: {
		root: {
			base: 'w-full text-left text-sm text-gray-500 dark:text-gray-400',
			shadow: 'absolute left-0 top-0 -z-10 h-full w-full rounded-lg bg-white drop-shadow-md dark:bg-black',
			wrapper: 'relative',
		},
		body: {
			base: 'group/body',
			cell: {
				base: 'px-4 py-4 group-first/body:group-first/row:first:rounded-tl-lg group-first/body:group-first/row:last:rounded-tr-lg group-last/body:group-last/row:first:rounded-bl-lg group-last/body:group-last/row:last:rounded-br-lg',
			},
		},
		head: {
			base: 'group/head text-xs uppercase text-gray-700 dark:text-gray-400',
			cell: {
				base: 'bg-gray-50 px-4 text-center py-3 group-first/head:first:rounded-tl-lg group-first/head:last:rounded-tr-lg dark:bg-gray-700',
			},
		},
		row: {
			base: 'group/row',
			hovered: 'hover:bg-gray-50 dark:hover:bg-gray-600',
			striped: 'odd:bg-white even:bg-gray-50 odd:dark:bg-gray-800 even:dark:bg-gray-700',
		},
	},
	buttonGroup: {
		base: 'flex',
		position: {
			none: '',
			start: 'w-1/3 rounded-r-none focus:ring-2',
			middle: 'w-1/3 rounded-none border-l-0 pl-0 focus:ring-2',
			end: 'w-1/3 rounded-l-none border-l-0 pl-0 focus:ring-2',
		},
	},
	button: {
		base: 'group relative flex items-stretch justify-center p-0 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none',
		fullSized: 'w-full',
		color: {},
	},
	textInput: {
		base: 'flex',
		field: {
			base: 'relative w-32',
			icon: {
				base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
				svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
			},
			input: {
				base: 'block w-full border disabled:cursor-not-allowed disabled:opacity-50',
				sizes: {
					sm: 'p-1',
				},
				colors: {
					gray: 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500',
				},
				withIcon: {
					on: 'pl-12',
					off: '',
				},
			},
		},
	},
	toggleSwitch: {
		root: {
			base: 'group relative flex items-center rounded-lg focus:outline-none',
			active: {
				on: 'cursor-pointer',
				off: 'cursor-not-allowed opacity-50',
			},
		},
		toggle: {
			base: 'rounded-full border group-focus:ring-4 group-focus:ring-cyan-500/25',
			checked: {
				on: 'after:translate-x-full after:border-white',
				off: 'border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-700',
				color: {
					default: 'bg-cyan-500 dark:bg-cyan-500',
				},
			},
			sizes: {
				sm: 'h-5 w-9 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4',
			},
		},
	},
	modal: {
		root: {
			base: 'fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full',
			show: {
				on: 'flex bg-gray-900 bg-opacity-50 dark:bg-opacity-80',
				off: 'hidden',
			},
			sizes: {
				lg: 'max-w-lg',
				xl: 'max-w-xl',
				'2xl': 'max-w-2xl',
				'3xl': 'max-w-3xl',
				'4xl': 'max-w-4xl',
				'5xl': 'max-w-5xl',
				'6xl': 'max-w-6xl',
				'7xl': 'max-w-7xl',
			},
			positions: {
				center: 'items-center justify-center',
			},
		},
		content: {
			base: 'relative h-full w-full p-4 md:h-auto',
			inner: 'relative flex max-h-[90dvh] flex-col rounded-lg bg-white shadow dark:bg-gray-700',
		},
		body: {
			base: 'flex-1 overflow-auto p-6',
			popup: 'pt-0',
		},
		header: {
			base: 'flex items-start justify-between rounded-t border-b p-5 dark:border-gray-600',
			popup: 'border-b-0 p-2',
			title: 'text-xl font-medium text-gray-900 dark:text-white',
			close: {
				base: 'ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white',
				icon: 'h-5 w-5',
			},
		},
		footer: {
			base: 'flex items-center justify-center space-x-2 rounded-b border-gray-200 p-6 dark:border-gray-600',
			popup: 'border-t',
		},
	},
}

export default customTheme
