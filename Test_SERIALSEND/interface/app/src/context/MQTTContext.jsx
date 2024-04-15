import { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import mqtt from 'mqtt'

export const MQTTContext = createContext()

export const MQTTProvider = ({ children }) => {
	const [mqttClient, setMqttClient] = useState(null)

	useEffect(() => {
		const client = mqtt.connect('ws://localhost:8083/mqtt', {
			clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
			clean: true,
		})

		client.on('connect', () => {
			console.log('connected')
			client.subscribe('esp32/+/response')
		})

		setMqttClient(client)
	}, [])

	return <MQTTContext.Provider value={{ mqttClient }}>{children}</MQTTContext.Provider>
}

// props validation
MQTTProvider.propTypes = {
	children: PropTypes.node.isRequired,
}

export default MQTTProvider

export const useMQTT = () => useContext(MQTTContext)
