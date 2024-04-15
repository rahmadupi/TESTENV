import React from 'react'

const PageOptions = [
	{
		id: 1,
		name: 'Load Cell Foot',
	},
	{
		id: 2,
		name: 'Robot Control',
	},
	{
		id: 3,
		name: 'V+ Motion',
	},
]

function PageControl({ activePage, setActivePage }) {
	function removeFocus() {
		document.activeElement.blur()
	}

	const Button = ({ page, children }) => (
		<button
			type="button"
			className={`inline-flex items-center px-4 py-1.5 text-sm font-medium ${
				activePage === page ? 'rounded-full bg-blue-700 text-white' : 'rounded-full bg-transparent text-gray-300'
			} hover:bg-gray-700 hover:text-white focus:z-10 focus:bg-gray-700 focus:text-white focus:ring-2`}
			onClick={() => {
				setActivePage(page)
				removeFocus()
			}}>
			{children}
		</button>
	)

	return (
		<div className="mt-14 flex justify-center py-4 lg:fixed lg:inset-x-0 lg:bottom-4">
			<div className="inline-flex gap-2 rounded-full border-2 border-slate-600 bg-slate-800 px-2 py-2 shadow-sm" role="group">
				{PageOptions.map(option => (
					<Button key={option.id} page={option.id}>
						{option.name}
					</Button>
				))}
			</div>
		</div>
	)
}

export default PageControl
