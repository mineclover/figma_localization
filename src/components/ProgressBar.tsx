import { h } from 'preact'
import { CSSProperties } from 'preact/compat'

interface ProgressBarProps {
	completed: number
	height?: string
	width?: string
	labelSize?: string
	customLabel?: string
	labelAlignment?: 'left' | 'center' | 'right'
	bgColor?: string
	baseBgColor?: string
	labelColor?: string
	margin?: string
	maxCompleted?: number
	customLabelStyles?: CSSProperties
	className?: string
}

const ProgressBar = ({
	completed,
	height = '16px',
	width = '100%',
	labelSize = '12px',
	customLabel,
	labelAlignment = 'center',
	bgColor = 'var(--figma-color-bg-brand)',
	baseBgColor = 'var(--figma-color-bg-secondary)',
	labelColor = 'var(--figma-color-text)',
	margin = '0',
	maxCompleted,
	customLabelStyles = {},
	className = '',
}: ProgressBarProps) => {
	const percentage = maxCompleted ? Math.round((completed / maxCompleted) * 100) : completed
	const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

	const containerStyle: CSSProperties = {
		width,
		height,
		backgroundColor: baseBgColor,
		borderRadius: '4px',
		position: 'relative',
		overflow: 'hidden',
		margin,
	}

	const fillerStyle: CSSProperties = {
		height: '100%',
		width: `${clampedPercentage}%`,
		backgroundColor: bgColor,
		borderRadius: 'inherit',
		transition: 'width 0.3s ease-in-out',
	}

	const labelStyle: CSSProperties = {
		position: 'absolute',
		top: '50%',
		left: labelAlignment === 'left' ? '8px' : labelAlignment === 'right' ? 'auto' : '50%',
		right: labelAlignment === 'right' ? '8px' : 'auto',
		transform: labelAlignment === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)',
		fontSize: labelSize,
		color: labelColor,
		fontWeight: '500',
		lineHeight: '1',
		...customLabelStyles,
	}

	const displayLabel = customLabel || `${clampedPercentage}%`

	return (
		<div className={className} style={containerStyle}>
			<div style={fillerStyle} />
			<div style={labelStyle}>{displayLabel}</div>
		</div>
	)
}

export default ProgressBar
