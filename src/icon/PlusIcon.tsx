import { h } from 'preact';

const PlusIcon = ({ size = 24, color = '#5F6368', ...props }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<path d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z" fill={color} />
		</svg>
	);
};

export default PlusIcon;
