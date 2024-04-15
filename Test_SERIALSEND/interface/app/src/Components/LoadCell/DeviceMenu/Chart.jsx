import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
// import faker from 'faker'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export const options = {
	maintainAspectRatio: false,
	animation: {
		duration: 0,
	},
	plugins: {
		legend: {
			position: 'top',
			align: 'end',
			labels: {
				boxWidth: 20,
				boxHeight: 2,
				color: 'white',
			},
		},
	},
	scales: {
		x: {
			border: {
				color: '#4D4D8D',
				width: 2,
			},
			grid: {
				color: 'transparent',
				tickColor: '#4D4D8D',
				tickWidth: 2,
				tickLength: 5,
			},
			ticks: {
				display: false,
			},
		},
		y: {
			min: -1,
			max: 1,
			border: {
				color: '#4D4D8D',
				width: 2,
			},
			grid: {
				color: '#4D4D8D',
				lineWidth: 2,
				tickColor: '#4D4D8D',
				tickWidth: 2,
				tickLength: 0,
			},
			ticks: {
				display: false,
				color: '#21D3FE',
				stepSize: 1000,
				// callback: (value: number) =>
			},
		},
	},
}

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July']

export const data = {
	labels,
	datasets: [
		{
			label: 'Dataset 1',
			data: labels.map(() => Math.random() * 2 - 1),
			borderColor: 'rgb(255, 99, 132)',
			backgroundColor: 'rgba(255, 99, 132, 0.5)',
		},
		{
			label: 'Dataset 2',
			data: labels.map(() => Math.random() * 2 - 1),
			borderColor: 'rgb(53, 162, 235)',
			backgroundColor: 'rgba(53, 162, 235, 0.5)',
		},
	],
}

export default function Chart() {
	return <Line options={options} data={data} />
}
