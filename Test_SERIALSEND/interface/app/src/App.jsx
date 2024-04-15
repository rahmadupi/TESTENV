import React from 'react'

import { MQTTProvider } from './context/MQTTContext'
import Aurora from './Components/Aurora'
import './App.css'

import LoadCellPage from './Components/LoadCell/Page'
import RobotControlPage from './Components/RobotControl/Page'
import VMotionPage from './Components/V+Motion/Page'
import PageControl from './Components/PageControl'

function App() {
	const [activePage, setActivePage] = React.useState(1)

	const ActivePage = () => {
		return (
			<>
				{activePage === 1 && <LoadCellPage />}
				{activePage === 2 && <RobotControlPage />}
				{activePage === 3 && <VMotionPage />}
			</>
		)
	}

	return (
		<div className="unselectable w-screen bg-slate-900 text-white">
			<Aurora />
			<div className="z-10 mx-auto flex min-h-screen w-5/6 flex-col gap-10 lg:flex-row">
				<MQTTProvider>
					<PageControl activePage={activePage} setActivePage={setActivePage} />
					<ActivePage />
				</MQTTProvider>
			</div>
		</div>
	)
}

export default App
