import { modalAlert } from '@/components/alert'
import { addLayer } from '@/components/modal/Modal'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { GET_CURSOR_POSITION } from '../constant'
import { emit } from '@create-figma-plugin/utilities'
import { currentPointerSignal, onGetCursorPositionResponse } from './LabelModel'
import { useSignal } from '@/hooks/useSignal'
import { CurrentCursorType } from '../utils/featureType'

function LabelPage() {
	const currentPointer = useSignal<CurrentCursorType | null>(currentPointerSignal)

	useEffect(() => {
		const event = onGetCursorPositionResponse()

		return () => {
			event()
		}
	}, [])

	return (
		<div>
			LabelPage
			<button onClick={() => emit(GET_CURSOR_POSITION.REQUEST_KEY)}>emit</button>
			{JSON.stringify(currentPointer)}
			<div>
				<div>
					<div></div>
				</div>
			</div>
			<hr></hr>
			<button onClick={() => emit(GET_CURSOR_POSITION.REQUEST_KEY)}>플러그인 데이터 추가</button>
		</div>
	)
}
export default LabelPage
