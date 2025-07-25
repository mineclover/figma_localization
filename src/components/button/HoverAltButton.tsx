import { IconButton, type IconButtonProps } from '@create-figma-plugin/ui'
import { type ComponentChildren, h } from 'preact'
import { useState } from 'preact/hooks'
import { clc } from '../modal/utils'
import styles from './button.module.css'

type Props = {
	children: ComponentChildren
	alt: string
	direction?: 'left' | 'right'
}

export const HoverAltButton = ({ children, alt, direction = 'right', ...props }: Props & IconButtonProps) => {
	const [hover, setHover] = useState(false)

	return (
		<IconButton {...props} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
			{hover && <div className={clc(styles.hover, styles[direction])}>{alt}</div>}
			{children}
		</IconButton>
	)
}
