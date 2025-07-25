import type { JSXInternal } from 'preact/src/jsx'

/** DOM 요소의 크기 얻기 */
export function getElementRect(element: HTMLElement) {
	const rect = element.getBoundingClientRect()
	return {
		width: rect.width >> 0,
		height: rect.height >> 0,
		/** viewport 기준 위치 */
		x: rect.left >> 0,
		y: rect.top >> 0,
	}
}
/** 현재 뷰포트 크기 얻기 */
export function getViewportSize() {
	return {
		width: (window.innerWidth || document.documentElement.clientWidth) >> 0,
		height: (window.innerHeight || document.documentElement.clientHeight) >> 0,
	}
}

type RectStyle = {
	position: 'absolute'
	left: number
	top: number
	width: number
	height: number
}

export type Axis = 'left' | 'right' | 'top' | 'bottom'

export function rectToStyle(element: HTMLElement): RectStyle {
	const rect = getElementRect(element)

	return {
		position: 'absolute',
		left: rect.x,
		top: rect.y,
		width: rect.width,
		height: rect.height,
	}
}

/** axis default : bottom */
export function rectToStyleOffset(element: HTMLElement, offset: number, axis: Axis): RectStyle {
	const rect = rectToStyle(element)

	if (axis === 'left') {
		return {
			position: 'absolute',
			left: rect.left - rect.width - offset,
			top: rect.top,
			width: rect.width,
			height: rect.height,
		}
	}

	if (axis === 'right') {
		return {
			position: 'absolute',
			left: rect.left + rect.width + offset,
			top: rect.top,
			width: rect.width,
			height: rect.height,
		}
	}

	if (axis === 'top') {
		return {
			position: 'absolute',
			left: rect.left,
			top: rect.top - rect.height - offset,
			width: rect.width,
			height: rect.height,
		}
	}

	if (axis === 'bottom') {
		return {
			position: 'absolute',
			left: rect.left,
			top: rect.top + rect.height + offset,
			width: rect.width,
			height: rect.height,
		}
	}
	// default : bottom
	return {
		position: 'absolute',
		left: rect.left,
		top: rect.top + rect.height + offset,
		width: rect.width,
		height: rect.height,
	}
}

const xAxis = ['left', 'right']
const yAxis = ['top', 'bottom']

const objectKeyClear = (keys: string[], target: Record<string, any>) => {
	for (const key of keys) {
		delete target[key]
	}
}

/** axis default : 해당 축 데이터 지우고 다시 주입 */
export function rectToViewportStyleOffset(before: RectStyle, offset: number, align: Axis) {
	if (xAxis.includes(align)) {
		objectKeyClear(xAxis, before)
	}
	if (yAxis.includes(align)) {
		objectKeyClear(yAxis, before)
	}
	return {
		...before,
		[align]: offset,
	}
}

export type DiagonalAxis =
	| 'topLeft'
	| 'topRight'
	| 'rightTop'
	| 'rightBottom'
	| 'bottomLeft'
	| 'bottomRight'
	| 'leftTop'
	| 'leftBottom'

export const diagonalAxisToAxis = (axis: DiagonalAxis): Axis => {
	if (axis.startsWith('top')) {
		return 'top'
	}
	if (axis.startsWith('bottom')) {
		return 'bottom'
	}
	if (axis.startsWith('left')) {
		return 'left'
	}
	if (axis.startsWith('right')) {
		return 'right'
	}
	return 'bottom'
}

export type BaseProps = JSXInternal.IntrinsicElements

export type NullableString = string | boolean | undefined

export const clc = (...classNames: NullableString[]) => {
	const result = classNames.filter((text): text is string => typeof text === 'string')

	if (result.length === 0) {
		return undefined
	}
	return result.map(txt => txt.trim()).join(' ')
}
