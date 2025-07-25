import { h } from 'preact'

const PinIcon = ({ size = 24, color = '#5F6368', ...props }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<path
				d="M16 11L18 13V15H13V21L12 22L11 21V15H6V13L8 11V4H7V2H17V4H16V11ZM8.85 13H15.15L14 11.85V4H10V11.85L8.85 13Z"
				fill={color}
			/>
		</svg>
	)
}

export default PinIcon
