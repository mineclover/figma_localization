import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import styles from './modal.module.css'
import { type Axis, type BaseProps, clc, rectToStyle, rectToStyleOffset } from './utils'

type Props = {
	target: HTMLElement
	offset: number
	axis: Axis

	children: React.ReactNode
}

const StraightClientModal = ({ target, offset, axis, children }: Props & BaseProps['div']) => {
	const [next, setNext] = useState(rectToStyleOffset(target, offset, axis))

	useEffect(() => {
		const handleResize = () => {
			setNext(rectToStyleOffset(target, offset, axis))
		}

		window.addEventListener('resize', handleResize)
		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [target, offset, axis])

	return (
		<div style={{ ...next }} className={clc(styles[axis])}>
			{children}
		</div>
	)
}

export default StraightClientModal
