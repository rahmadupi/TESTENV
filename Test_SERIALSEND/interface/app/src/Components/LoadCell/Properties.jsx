import { HiMiniInformationCircle, HiMiniPencilSquare, HiMiniWrenchScrewdriver, HiCodeBracket } from 'react-icons/hi2'

const FootData = [
	{
		id: 1,
		mac_index: 5,
		name: 'Left Foot',
		cells: [
			{ id: 1, value: 0.0, raw: 0, offset: 0.0, balance: 0.0, x0: 0.0, x1: 0.0, x2: 0.0, scale: 0 },
			{ id: 2, value: 0.0, raw: 0, offset: 0.0, balance: 0.0, x0: 0.0, x1: 0.0, x2: 0.0, scale: 0 },
			{ id: 3, value: 0.0, raw: 0, offset: 0.0, balance: 0.0, x0: 0.0, x1: 0.0, x2: 0.0, scale: 0 },
			{ id: 4, value: 0.0, raw: 0, offset: 0.0, balance: 0.0, x0: 0.0, x1: 0.0, x2: 0.0, scale: 0 },
		],
		message: {
			status: false,
			interval: 200,
		},
		magnitude: {
			cop_x: 1.0,
			cop_y: 0.0,
			mass: 0.0,
		},
	},
	{
		id: 2,
		mac_index: 4,
		name: 'Right Foot',
		cells: [
			{ id: 1, value: 0.0, raw: 0.0, offset: 0.0, balance: 0.0, x0: 0.0, x1: 0.0, x2: 0.0, scale: 0 },
			{ id: 2, value: 0.0, raw: 0.0, offset: 0.0, balance: 0.0, x0: 0.0, x1: 0.0, x2: 0.0, scale: 0 },
			{ id: 3, value: 0.0, raw: 0.0, offset: 0.0, balance: 0.0, x0: 0.0, x1: 0.0, x2: 0.0, scale: 0 },
			{ id: 4, value: 0.0, raw: 0.0, offset: 0.0, balance: 0.0, x0: 0.0, x1: 0.0, x2: 0.0, scale: 0 },
		],
		message: {
			status: false,
			interval: 200,
		},
		magnitude: {
			cop_x: -1.0,
			cop_y: 0.0,
			mass: 0.0,
		},
	},
	{
		id: 3,
		mac_index: 2,
		magnitude: {
			left_foot: { cop_x: 0.0, cop_y: 0.0, mass: 0.0 },
			right_foot: { cop_x: 0.0, cop_y: 0.0, mass: 0.0 },
			robot_foot: { cop_x: 0.0, cop_y: 0.0, mass: 0.0 },
		},
		pid: [0.0, 0.0, 0.0],
		message: {
			status: false,
			interval: 200,
		},
	},
]

const LoadCellCommand = {
	// POST
	set_attribute: {
		command: 'POST_LC_ATTRIBUTE',
		data: {
			state: 'OFFSET',
			cells: [200, 200, 200, 200],
		},
	},
	set_message: {
		command: 'POST_ACTIVE_MESSAGE',
		data: {
			state: 'COP_AND_MASS',
			status: true,
			interval: 500,
		},
	},
	set_pid: {
		command: 'POST_CONTROL_PID_ROLL',
		data: {
			pid: [0.0, 0.0, 0.0],
		},
	},
	// GET
	get_raw: {
		command: 'GET_LC_RAW_DATA',
		data: {},
	},
	get_attribute: {
		command: 'GET_LC_ATTRIBUTE',
		data: {
			state: 'OFFSET',
		},
	},
	get_message: {
		command: 'GET_STATUS_MESSAGE',
		data: {},
	},
	get_pid: {
		command: 'GET_CONTROL_PID_ROLL',
		data: {},
	},
}

const ControlMenu = [
	{
		id: 1,
		icon: HiMiniInformationCircle,
	},
	{
		id: 2,
		icon: HiMiniPencilSquare,
	},
	{
		id: 3,
		icon: HiCodeBracket,
	},
	{
		id: 4,
		icon: HiMiniWrenchScrewdriver,
	},
]

const HowToUseList = [
	{
		title: 'What is Load Cell?',
		content:
			'Load Cell is an open-source library of interactive components built on top of Tailwind CSS including buttons, dropdowns, modals, navbars, and more.',
		link: 'https://flowbite.com/docs/getting-started/introduction/',
	},
	{
		title: 'How to Use Load Cell?',
		content: 'Check out this guide to learn how to get started and start developing websites even faster with components on top of Tailwind CSS.',
		link: 'https://flowbite.com/docs/getting-started/introduction/',
	},
	{
		title: 'How to Configure Load Cell?',
		content: 'Learn how to configure Load Cell and start developing websites even faster with components on top of Tailwind CSS.',
		link: 'https://flowbite.com/docs/getting-started/introduction/',
	},
]

export { LoadCellCommand, FootData, HowToUseList, ControlMenu }
