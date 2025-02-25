import { modalAlert } from '@/components/alert'
import { addLayer } from '@/components/modal/Modal'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { GET_CURSOR_POSITION, RELOAD_NODE, SET_NODE_LOCATION } from '../constant'
import { emit } from '@create-figma-plugin/utilities'
import { currentPointerSignal, onGetCursorPositionResponse } from './LabelModel'
import { useSignal } from '@/hooks/useSignal'
import { CurrentCursorType } from '../utils/featureType'

function LabelPage() {
	const currentPointer = useSignal<CurrentCursorType | null>(currentPointerSignal)
	console.log('🚀 ~ LabelPage ~ currentPointer:', currentPointer)

	useEffect(() => {
		const event = onGetCursorPositionResponse()

		return () => {
			event()
		}
	}, [])

	if (currentPointer && 'styleData' in currentPointer) {
		delete currentPointer.styleData
	}

	return (
		<div>
			LabelPage
			<button onClick={() => emit(GET_CURSOR_POSITION.REQUEST_KEY)}>emit</button>
			{JSON.stringify(currentPointer, null, 2)}
			<div>
				<div>
					<div></div>
				</div>
			</div>
			<hr></hr>
			<button onClick={() => emit(SET_NODE_LOCATION.REQUEST_KEY)}>플러그인 데이터 추가</button>
			<div>검색 결과</div>
			<button onClick={() => emit(RELOAD_NODE.REQUEST_KEY)}>오리지널 로컬라이제이션 이름 리로드</button>
		</div>
	)
}
export default LabelPage
