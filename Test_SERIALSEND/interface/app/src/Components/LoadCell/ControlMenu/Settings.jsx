import React from 'react'
import { Dropdown, Flowbite } from 'flowbite-react'

const customTheme = {
	dropdown: {
		arrowIcon: 'ml-2 h-6 w-6',
		content: 'focus:outline-none',
		floating: {
			animation: 'transition-opacity',
			base: 'z-10 w-fit divide-y divide-gray-100 rounded shadow focus:outline-none',
			content: 'py-1 text-sm text-gray-200',
			divider: 'my-1 h-px bg-gray-600',
			header: 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200',
			hidden: 'invisible opacity-0',
			item: {
				container: '',
				base: 'flex w-full cursor-pointer items-center justify-start px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white',
				icon: 'ml-2 h-4 w-4',
			},
			style: {
				auto: 'text-white bg-red-500 dark:bg-gray-700',
			},
			target: 'w-fit',
		},
	},
}

function SettingsPage({ role, setRole }) {
	return (
		<>
			<div className="mx-5 my-10 flex items-center justify-between">
				<h2 className="w-5/12 text-2xl font-semibold text-gray-300">Role</h2>
				<Flowbite theme={{ theme: customTheme }}>
					<Dropdown label={role} size="lg" dismissOnClick={false} color="">
						<Dropdown.Item onClick={() => setRole('Master')}>Master</Dropdown.Item>
						<Dropdown.Item onClick={() => setRole('Slave')}>Slave</Dropdown.Item>
					</Dropdown>
				</Flowbite>
			</div>
		</>
	)
}

export default SettingsPage
