import React from 'react'
import { Table, Button, Flowbite, TextInput, ToggleSwitch, Modal } from 'flowbite-react'
import { HiClock, HiMiniArrowPath, HiMiniPencilSquare } from 'react-icons/hi2'
import customTheme from './Theme'
import { LoadCellCommand } from '../Properties'

function VariablePage({ footData, setFootData, handlePublish }) {
	const [footSelected, setFootSelected] = React.useState(footData[0])
	const [modal, setModal] = React.useState(false)
	const [modalProps, setModalProps] = React.useState('')

	React.useEffect(() => {
		if (footSelected.id === 3) {
			handlePublish(footSelected.mac_index, LoadCellCommand['get_pid'])
		} else {
			;['OFFSET', 'BALANCE', 'SCALE'].forEach(attr => {
				LoadCellCommand['get_attribute'].data.state = attr
				handlePublish(footSelected.mac_index, LoadCellCommand['get_attribute'])
			})
			handlePublish(footSelected.mac_index, LoadCellCommand['get_raw'])
		}
		handlePublish(footSelected.mac_index, LoadCellCommand['get_message'])
	}, [footSelected.mac_index])

	const handleToggle = () => {
		footSelected.message.status = !footSelected.message.status
		setFootData([...footData])
		// setFootSelected({ ...footSelected })

		footSelected.id === 3 ? (LoadCellCommand['set_message'].data.state = 'ROBOT_COP') : (LoadCellCommand['set_message'].data.state = 'COP_AND_MASS')

		LoadCellCommand['set_message'].data.status = footSelected.message.status
		LoadCellCommand['set_message'].data.interval = Number(footSelected.message.interval)
		handlePublish(footSelected.mac_index, LoadCellCommand['set_message'])
	}

	return (
		<>
			<Flowbite theme={{ theme: customTheme }}>
				<Button.Group>
					{['LEFT FOOT', 'RIGHT FOOT', 'CONTROLLER'].map((title, index) => (
						<Button key={index} onClick={() => setFootSelected(footData[index])} color={footSelected.id === index + 1 ? 'blue' : 'gray'}>
							{title}
						</Button>
					))}
				</Button.Group>

				<div className="mt-4 overflow-x-auto">
					{/* TABLE */}
					<Table>
						<Table.Head>
							{footSelected.id === 3
								? ['Kp', 'Ki', 'Kd', ''].map((title, index) => <Table.HeadCell key={index}>{title}</Table.HeadCell>)
								: ['', 'CELL 1', 'CELL 2', 'CELL 3', 'CELL 4', ''].map((title, index) => <Table.HeadCell key={index}>{title}</Table.HeadCell>)}
						</Table.Head>
						<Table.Body>
							{footSelected.id === 3 ? (
								<Table.Row className="border-gray-700 bg-gray-800">
									{footSelected.pid.map((pid, index) => (
										<Table.Cell key={index} className="text-center">
											{pid}
										</Table.Cell>
									))}
									<Table.Cell className="w-4 font-medium text-white">
										<HiMiniPencilSquare
											className="h-4 w-4 hover:cursor-pointer hover:text-blue-500"
											onClick={() => {
												setModal(true)
												setModalProps('Kp')
											}}
										/>
									</Table.Cell>
								</Table.Row>
							) : (
								[
									['raw', 'raw'],
									['offset', 'ofs'],
									['balance', 'bal'],
									['scale', 'scl'],
								].map((title, index) => (
									<Table.Row key={index} className=" border-gray-700 bg-gray-800">
										<Table.Cell className="w-2 whitespace-nowrap font-medium text-white">{title[1].toUpperCase()}</Table.Cell>
										{footSelected.cells.map((cell, index) => (
											<Table.Cell key={index} className="text-center">
												{cell[title[0]]}
											</Table.Cell>
										))}
										<Table.Cell className="w-4 font-medium text-white">
											{index ? (
												<HiMiniPencilSquare
													className="h-4 w-4 hover:cursor-pointer hover:text-blue-500"
													onClick={() => {
														setModal(true)
														setModalProps(title[0])
													}}
												/>
											) : null}
										</Table.Cell>
									</Table.Row>
								))
							)}
						</Table.Body>
					</Table>

					{/* FORMS INTERVAL */}
					<form className="mt-5 flex items-center justify-end gap-x-5">
						<Button
							color="blue"
							onClick={() => {
								footSelected.id === 3
									? handlePublish(footSelected.mac_index, LoadCellCommand['get_pid'])
									: handlePublish(footSelected.mac_index, LoadCellCommand['get_raw'])
								handlePublish(footSelected.mac_index, LoadCellCommand['get_message'])
							}}>
							<HiMiniArrowPath className="h-5 w-5" />
						</Button>
						<TextInput
							type="number"
							icon={HiClock}
							color="gray"
							sizing="sm"
							value={footSelected.message.interval}
							onChange={e => {
								footSelected.message.interval = e.target.value
								setFootSelected({ ...footSelected })
							}}
						/>
						<ToggleSwitch checked={footSelected.message.status} onChange={handleToggle} />
					</form>
				</div>

				{/* MODAL */}
				<Modal show={modal} onClose={() => setModal(false)} size="3xl">
					<Modal.Header />
					<Modal.Body>
						<Table>
							{footSelected.id === 3 ? (
								<>
									<Table.Head>
										{['Kp', 'Ki', 'Kd'].map((title, index) => (
											<Table.HeadCell key={index}>{title}</Table.HeadCell>
										))}
									</Table.Head>
									<Table.Body>
										<Table.Row>
											{footSelected.pid.map((pid, index) => (
												<Table.Cell key={index} className="text-center">
													<TextInput type="number" placeholder={pid} onChange={e => (footSelected.pid[index] = e.target.value)} />
												</Table.Cell>
											))}
										</Table.Row>
									</Table.Body>
								</>
							) : (
								<>
									<Table.Head>
										{['CELL 1', 'CELL 2', 'CELL 3', 'CELL 4'].map((title, index) => (
											<Table.HeadCell key={index}>{title}</Table.HeadCell>
										))}
									</Table.Head>
									<Table.Body>
										<Table.Row>
											{footSelected.cells.map((cell, index) => (
												<Table.Cell key={index} className="text-center">
													<TextInput
														type="number"
														placeholder={cell[modalProps]}
														onChange={e => (footSelected.cells[index][modalProps] = e.target.value)}
													/>
												</Table.Cell>
											))}
										</Table.Row>
									</Table.Body>
								</>
							)}
						</Table>
					</Modal.Body>
					<Modal.Footer>
						<Button
							onClick={() => {
								if (footSelected.id === 3) {
									LoadCellCommand['set_pid'].data.pid = footSelected.pid.map(pid => parseFloat(pid).toFixed(2))
								} else {
									LoadCellCommand['set_attribute'].data.state = modalProps.toUpperCase()
									LoadCellCommand['set_attribute'].data = footSelected.cells.map(cell => cell[modalProps])
								}
								handlePublish(footSelected.mac_index, LoadCellCommand[footSelected.id === 3 ? 'set_pid' : 'set_attribute'])
								setFootSelected({ ...footSelected })
								setModal(false)
							}}
							color="blue">
							Update Atrribute
						</Button>
					</Modal.Footer>
				</Modal>
			</Flowbite>
		</>
	)
}

export default VariablePage
