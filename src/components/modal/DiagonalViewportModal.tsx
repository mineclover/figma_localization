import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import styles from './modal.module.css'
import {
	type Axis,
	type BaseProps,
	clc,
	type DiagonalAxis,
	diagonalAxisToAxis,
	rectToStyle,
	rectToStyleOffset,
	rectToViewportStyleOffset,
} from './utils'

type Props = {
	target: HTMLElement
	offset: number
	axis: DiagonalAxis
	align: Axis
	children: React.ReactNode
}

/**
 * 화면 끝에 붙이는 기능을 가짐
 * align : 화면상 정렬 위치
 * @param param0
 * @returns
 */
const DiagonalViewportModal = ({ target, offset, axis, align, children }: Props & BaseProps['div']) => {
	const direction = diagonalAxisToAxis(axis)
	const temp = rectToStyleOffset(target, offset, direction)

	const [next, setNext] = useState(rectToViewportStyleOffset(temp, offset, align))

	useEffect(() => {
		const handleResize = () => {
			setNext(rectToViewportStyleOffset(temp, offset, align))
		}

		window.addEventListener('resize', handleResize)
		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [offset, align, temp])

	return (
		<div style={{ ...next }} className={clc(styles[axis])}>
			{children}
		</div>
	)
}

export default DiagonalViewportModal
