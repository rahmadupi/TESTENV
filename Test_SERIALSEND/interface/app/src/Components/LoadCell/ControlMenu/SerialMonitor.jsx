import React, { useState, useEffect, useRef } from 'react'
import { useMQTT } from '../../../context/MQTTContext'

function SerialMonitorPage() {
	const { mqttClient } = useMQTT()
	const [terminalContent, setTerminalContent] = useState('')
	const terminalRef = useRef(null)

	useEffect(() => {
		if (mqttClient) {
			const handleMsg = (topic, message) => {
				if (topic === 'esp32/monitor') {
					const msg = message.toString()
					setTerminalContent(prevContent => prevContent + msg)
					if (terminalRef.current) {
						terminalRef.current.scrollTop = terminalRef.current.scrollHeight
					}
				}
			}

			mqttClient.on('message', handleMsg)

			return () => {
				mqttClient.off('message', handleMsg)
			}
		}
	}, [mqttClient])

	return (
		<>
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-gray-300">Settings</h2>
				<p className="text-gray-400">Configure application settings</p>
			</div>
			<div className="mt-4 flex flex-col items-center justify-center">
				<div
					ref={terminalRef}
					className="no-scrollbar h-72 w-full overflow-y-auto rounded-xl border-4 border-slate-700 bg-slate-800 p-4 text-white"
					style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
					{terminalContent.split('\n').map((line, index) => (
						<div key={index} className={index % 2 === 0 ? 'bg-slate-700/40' : ''}>
							{line}
						</div>
					))}
				</div>
			</div>
		</>
	)
}

export default SerialMonitorPage
