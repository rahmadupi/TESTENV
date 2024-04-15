import React from 'react'
import Foot from './DeviceMenu/Foot'

import { useMQTT } from '../../context/MQTTContext'
import { LoadCellCommand, FootData, ControlMenu } from './Properties'

import HowToUsePage from './ControlMenu/HowToUse'
import VariablePage from './ControlMenu/Variable'
import SerialMonitorPage from './ControlMenu/SerialMonitor'
import SettingsPage from './ControlMenu/Settings'

export default function LoadCellPage() {
	const { mqttClient } = useMQTT()

	const [footData, setFootData] = React.useState(FootData)
	const [role, setRole] = React.useState('Master')
	const [activeMenu, setActiveMenu] = React.useState(1)

	// MAC Index Configuration
	React.useEffect(() => {
		if (role === 'Slave') {
			footData[0].mac_index = 7
			footData[1].mac_index = 6
			footData[2].mac_index = 3
		} else {
			footData[0].mac_index = 5
			footData[1].mac_index = 4
			footData[2].mac_index = 2
		}
	}, [role])

	// Callback function for MQTT
	React.useEffect(() => {
		if (mqttClient) {
			const handleMsg = (topic, message) => {
				let state
				const payload = JSON.parse(message.toString())

				console.log('Callback | topic: ' + topic, payload)

				const mac_index = topic.split('/')[1]
				const foot = footData.find(foot => foot.mac_index == mac_index)

				switch (payload.command) {
					case 'RESPONSE_LC_RAW_DATA':
						foot.cells.forEach(cell => (cell.raw = payload.data.cells[cell.id - 1]))
						setFootData([...footData])
						break
					case 'RESPONSE_LC_ATTRIBUTE':
						state = payload.data.state
						foot.cells.forEach((cell, index) => (cell[state.toLowerCase()] = payload.data.cells[index]))
						setFootData([...footData])
						break
					case 'RESPONSE_CONTROL_PID_ROLL':
						foot.pid = payload.data.pid
						setFootData([...footData])
						break
					case 'RESPONSE_STATUS_MESSAGE':
						foot.message.status = payload.data.status
						foot.message.interval = payload.data.interval
						setFootData([...footData])
						break
					case 'RESPONSE_ACTIVE_MESSAGE':
						state = payload.data.state
						if (state === 'COP_AND_MASS') {
							foot.magnitude.cop_x = payload.data.cop_x
							foot.magnitude.cop_y = payload.data.cop_y
							foot.magnitude.mass = payload.data.mass
							foot.cells.forEach((cell, index) => (cell.value = payload.data.cells[index]))
						} else if (state === 'ROBOT_COP') {
							foot.magnitude.left_foot = payload.data.left_foot
							foot.magnitude.right_foot = payload.data.right_foot
							foot.magnitude.robot_foot = payload.data.robot_foot
						}
						setFootData([...footData])
						break
					default:
						console.log('Unknown command:', payload.command)
						break
				}
			}

			mqttClient.on('message', handleMsg)

			// Cleanup function
			return () => {
				mqttClient.off('message', handleMsg)
			}
		}
	}, [mqttClient])

	const publishMessage = (mac_index, payload) => {
		console.log('Publish | topic: esp32/' + mac_index + '/recv', payload)
		if (mqttClient) {
			mqttClient.publish('esp32/' + mac_index + '/recv', JSON.stringify(payload))
		}
	}

	// Center of Pressure (COP) Calculation
	const center_x =
		(FootData[2].message.status ? footData[2].magnitude.robot_foot.cop_x : (-footData[0].magnitude.cop_x + footData[1].magnitude.cop_x) / 2) * 44 +
		50 +
		'%'
	const center_y =
		(FootData[2].message.status ? footData[2].magnitude.robot_foot.cop_y : (footData[0].magnitude.cop_y - footData[1].magnitude.cop_y) / 2) * 16 +
		'rem'

	return (
		<>
			{/* Left Side */}
			<div className="relative mx-auto mt-[38%] flex h-fit w-5/6 justify-center gap-16 lg:sticky lg:top-1/2 lg:-mt-20 lg:w-3/5">
				<Foot
					cop_x={FootData[2].message.status ? footData[2].magnitude.left_foot.cop_x : footData[1].magnitude.cop_x}
					cop_y={FootData[2].message.status ? footData[2].magnitude.left_foot.cop_y : footData[1].magnitude.cop_y}
					cells={FootData[2].message.status ? [0, 0, 0, 0] : footData[1].cells.map(cell => cell.value)}
					mass={FootData[2].message.status ? footData[2].magnitude.left_foot.mass : footData[1].magnitude.mass}
					duration={FootData[2].message.status ? footData[2].message.interval : footData[1].message.interval}
					isRight={false}
				/>
				<Foot
					cop_x={FootData[2].message.status ? footData[2].magnitude.right_foot.cop_x : footData[0].magnitude.cop_x}
					cop_y={FootData[2].message.status ? footData[2].magnitude.right_foot.cop_y : footData[0].magnitude.cop_y}
					cells={FootData[2].message.status ? [0, 0, 0, 0] : footData[0].cells.map(cell => cell.value)}
					mass={FootData[2].message.status ? footData[2].magnitude.right_foot.mass : footData[0].magnitude.mass}
					duration={FootData[2].message.status ? footData[2].message.interval : footData[0].message.interval}
					isRight={true}
				/>
				<div
					id="left-cop"
					className={`cop-marker center-cop-marker transition-all ease-in-out ${'duration-' + footData[2].message.interval}`}
					style={{ position: 'absolute', left: center_x, top: center_y }}
				/>
			</div>
			{/* Right Side */}
			<div className="relative mx-auto -mt-20 lg:mb-0 lg:mt-[12%] lg:w-2/5">
				<h3 className="border-b-2 border-gray-800 pb-6 text-center text-4xl font-bold leading-none tracking-tight text-slate-300">Control Menu</h3>
				<div className="mb-4 flex justify-center gap-2 overflow-x-hidden border-b-2 border-gray-800 py-4 pb-6 md:gap-5">
					{ControlMenu.map(item => (
						<div
							key={item.id}
							className={`shadow-black-40 relative flex cursor-pointer rounded-lg border-[2px] shadow-xl transition-all duration-300 ease-in-out hover:scale-110 ${
								activeMenu === item.id ? 'border-blue-500' : 'border-gray-600'
							}`}
							onClick={() => setActiveMenu(item.id)}>
							<item.icon className={`h-12 py-2 text-4xl md:text-6xl ${activeMenu === item.id ? 'text-blue-500' : 'text-gray-400'}`} />
						</div>
					))}
				</div>
				{activeMenu &&
					[
						<HowToUsePage />,
						<VariablePage footData={footData} setFootData={setFootData} handlePublish={publishMessage} />,
						<SerialMonitorPage />,
						<SettingsPage role={role} setRole={setRole} />,
					][activeMenu - 1]}
			</div>
		</>
	)
}
