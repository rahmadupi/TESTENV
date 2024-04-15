import single_foot from '../../../assets/single_foot.svg'

function Foot({ cop_x, cop_y, cells, mass, duration, isRight = false }) {
	let bullet_x = isRight ? -cop_x * 50 + 50 + '%' : cop_x * 50 + 50 + '%'
	let bullet_y = isRight ? cop_y * 50 + 50 + '%' : -cop_y * 50 + 50 + '%'

	const loadcells = [
		{
			id: isRight ? 3 : 1,
			value: cells[isRight ? 2 : 0],
			value_place: '-left-0 -bottom-0 rotate-[45deg]',
			id_place: 'left-14 bottom-10',
		},
		{
			id: isRight ? 4 : 2,
			value: cells[isRight ? 3 : 1],
			value_place: '-bottom-0 -right-0 rotate-[-45deg]',
			id_place: 'bottom-10 right-14',
		},
		{
			id: isRight ? 1 : 3,
			value: cells[isRight ? 0 : 2],
			value_place: '-top-0 -right-0 rotate-[45deg]',
			id_place: 'top-10 right-14',
		},
		{
			id: isRight ? 2 : 4,
			value: cells[isRight ? 1 : 3],
			value_place: '-top-0 -left-0 rotate-[-45deg]',
			id_place: 'top-10 left-14',
		},
	]

	return (
		<div className="relative mx-5 w-1/2">
			{/* <img src={single_foot} type="image/svg+xml" className="invisible relative"></img> */}
			<div className="-translate-y-1/2 lg:absolute">
				<img src={single_foot} type="image/svg+xml" className="w-full"></img>
				<div
					id="left-cop"
					className={`cop-marker transition-all ease-linear duration-${duration} `}
					style={{ position: 'absolute', left: bullet_x, top: bullet_y }}
				/>
				{loadcells.map((cell, index) => (
					<>
						<p key={index} className={`absolute ${cell.value_place} text-gray-300`}>
							{cell.value.toFixed(1)}
						</p>
						<p key={index + 4} className={`absolute text-xl font-bold ${cell.id_place} text-gray-300`}>
							{cell.id}
						</p>
					</>
				))}
				<p className={`absolute  left-1/2 top-1/2 -translate-x-1/2 translate-y-1/2 text-lg text-gray-200`}> {mass.toFixed(0)} </p>
				<p className={`absolute  left-1/2 mt-2 -translate-x-1/2 text-gray-300`}> X: {cop_x.toFixed(3)}</p>
				<p className={`absolute  top-1/2 -translate-y-1/2 rotate-90 text-gray-300 ${isRight ? '-right-12' : '-left-12'}`}> Y: {cop_y.toFixed(3)}</p>
			</div>
		</div>
	)
}

export default Foot
