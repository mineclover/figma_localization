import { useSignal } from '@/hooks/useSignal'
import { h } from 'preact'
import { CurrentNode, currentSectionSignal } from '../Translate/TranslateModel'
import { useEffect, useState } from 'preact/hooks'
import { Button, Container, Stack, Toggle } from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { GET_LOCALIZATION_KEY_VALUE, GET_PATTERN_MATCH_KEY } from '../constant'
import { groupByPattern, onPatternMatchResponse, patternMatchDataSignal } from './batchModel'

/**
 * 그루핑 할때는 아이디를 하위 값으로 두고 속성을 위로 올린다
 * 전체 선택, 또는 선택으로 검색 영역 지정
 * 전체는 너무 많은 것을 지정해서 ... 업데이트에 적합하지 않다고 생각함
 *
 *
 *
 *
 *
 *
 * 신규 등록 메뉴에서는 로컬라이제이션 키 값이 없는 대상을 그루핑
 * 업데이트 > 노드 아이디로 키 추가
 */
function BatchPage() {
	const section = useSignal(currentSectionSignal)

	const [selectMode, setSelectMode] = useState<boolean>(false)
	const [selectTarget, setSelectTarget] = useState<CurrentNode | null>(null)

	const patternMatchData = useSignal(patternMatchDataSignal)
	// console.log('🚀 ~ BatchPage ~ patternMatchData:', patternMatchData)
	const patternMatchDataGroup = groupByPattern(patternMatchData)
	console.log('🚀 ~ BatchPage ~ patternMatchDataGroup:', patternMatchDataGroup)

	useEffect(() => {
		if (section && selectMode) {
			setSelectTarget(section)
			setSelectMode(false)
		}
	}, [section])
	useEffect(() => {
		onPatternMatchResponse()
	}, [])

	return (
		<Container space="extraSmall">
			<Stack space="extraSmall">
				BatchPage 패턴 매칭 룰 : 스타일 일치 표시 : 키 값이 있는 대상을 볼 것인지 , 없는 대상을 볼 것인지 타겟 선택 후
				변경 사항 작성 또는 선택 표시 변경 대상 선택은 검색 또는 신규 입력
				<h1>선택된 값 : {selectTarget?.name}</h1>
				<Toggle value={selectMode} onClick={() => setSelectMode(!selectMode)}>
					선택
				</Toggle>
				<Button
					disabled={selectTarget == null}
					onClick={() => emit(GET_PATTERN_MATCH_KEY.REQUEST_KEY, selectTarget?.id!)}
				>
					검색
				</Button>
			</Stack>
		</Container>
	)
}
export default BatchPage
