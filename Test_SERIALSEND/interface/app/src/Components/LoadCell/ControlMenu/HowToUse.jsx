import React from 'react'
import { Accordion, Flowbite } from 'flowbite-react'
import { HowToUseList } from '../Properties'

const customTheme = {
	accordion: {
		root: {
			base: 'divide-y divide-gray-700 border-gray-700',
			flush: {
				off: 'rounded-lg border',
				on: 'border-b',
			},
		},
		content: {
			base: 'p-5 first:rounded-t-lg last:rounded-b-lg bg-gray-900',
		},
		title: {
			arrow: {
				base: 'h-6 w-6 shrink-0',
				open: {
					off: '',
					on: 'rotate-180',
				},
			},
			base: 'flex w-full items-center justify-between p-5 text-left font-medium first:rounded-t-lg last:rounded-b-lg text-gray-400',
			flush: {
				off: 'focus:ring-gray-200 hover:bg-gray-800 focus:ring-gray-800',
				on: 'bg-transparent',
			},
			heading: '',
			open: {
				off: '',
				on: 'bg-gray-800 text-white',
			},
		},
	},
}

function HowToUsePage() {
	return (
		<Flowbite theme={{ theme: customTheme }}>
			<Accordion>
				{HowToUseList.map((item, index) => (
					<Accordion.Panel key={index}>
						<Accordion.Title theme={customTheme.title}>{item.title}</Accordion.Title>
						<Accordion.Content theme={customTheme.content}>
							<p className="mb-2 text-gray-400">{item.content}</p>
							<p className="text-gray-400">
								Check out this guide to learn how to&nbsp;
								<a href={item.link} className="text-cyan-600 hover:underline dark:text-cyan-500">
									get started&nbsp;
								</a>
								and start developing websites even faster with components on top of Tailwind CSS.
							</p>
						</Accordion.Content>
					</Accordion.Panel>
				))}
			</Accordion>
		</Flowbite>
	)
}

export default HowToUsePage
