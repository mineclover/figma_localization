import { Bold, IconButton, IconCollapse24, Muted } from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { signal } from '@preact/signals-core'
import { Fragment, h } from 'preact'
import { type TargetedEvent, useEffect } from 'preact/compat'
import { HoverAltButton } from '@/components/button/HoverAltButton'
import { clc } from '@/components/modal/utils'
import { notify } from '@/figmaPluginUtils'
import { pageNodeZoomAction, selectIdsAction, selectIdsToBoxAction } from '@/figmaPluginUtils/utilAction'
import { useSignal } from '@/hooks/useSignal'
import {
	autoCurrentNodeStyleSignal,
	autoCurrentNodesSignal,
	currentPointerSignal,
	keyIdNameSignal,
	patternMatchDataSignal,
	searchStoreLocationSignal,
	selectedKeySignal,
	selectIdsSignal,
} from '@/model/signal'
import { TRANSLATION_ACTION_PAIR } from '../constant'
import type { TranslationInputType } from '../Search/locations'
import { updateKeyIds } from '../Search/searchModel'
import type { MetaData } from '../Search/searchStore'
import { isHideNode } from '../Search/visualModel'
import styles from './SimpleSelect.module.css'

type Props = {
	id: string
	selected: boolean
	keyMatch: boolean
	current: boolean
	hide: boolean
	isNext: boolean
	locationId?: string
	pageId?: string
	projectId?: string
}

/** basenode로 등록할 때 */
export const nextBaseSignal = signal<{
	baseNodeId: string
	nodeId: string
	pageId: string
	projectId: string
}>({
	baseNodeId: '',
	nodeId: '',
	pageId: '',
	projectId: '',
})

const TestBaseLabel = ({ id, selected, keyMatch, current, hide, isNext, locationId, pageId, projectId }: Props) => {
	// console.log(
	// 	'🚀 ~ Test ~  id, selected, keyMatch, current, hide, isNext, locationId, pageId, projectId:',
	// 	id,
	// 	selected,
	// 	keyMatch,
	// 	current,
	// 	hide,
	// 	isNext,
	// 	locationId,
	// 	pageId,
	// 	projectId
	// )
	const badRequestPrams = !locationId || !pageId || !projectId

	return (
		<button
			type="button"
			onClick={e => {
				// 화면만 움직여서 문제 없었던거임
				const shiftKey = e.shiftKey
				if (shiftKey) {
					// 범용성 있게 표준화
					if (selectIdsSignal.value.includes(id)) {
						// 선택해제 했으면 선택을 바꾸는 걸 추천,
						selectIdsSignal.value = selectIdsSignal.value.filter(item => item !== id)
					} else {
						selectIdsSignal.value = [...selectIdsSignal.value, id]
					}
					selectIdsToBoxAction(selectIdsSignal.value, true)
					// 선택 중에 선택해제 되는게 불편해서 뺌
					// pageNodeZoomAction(id, true);
				} else {
					pageNodeZoomAction(id, false)
				}
			}}
			onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
				e.preventDefault() // 기본 우클릭 메뉴 방지
				if (badRequestPrams) {
					notify('잘못된 파라미터 입니다.', 'OK')
					return
				}
				const shiftKey = e.shiftKey

				if (shiftKey) {
					// 무조건 선택도 추가
					selectIdsSignal.value = [...selectIdsSignal.value, id]

					nextBaseSignal.value = {
						baseNodeId: locationId,
						nodeId: id,
						pageId,
						projectId,
					}
				}
			}}
			className={clc(styles.outline, current && styles.current, isNext && styles.next)}
		>
			<div
				className={clc(styles.inline, keyMatch && styles.keyMatch, selected && styles.selected, hide && styles.hide)}
			></div>
		</button>
	)
}

export const ignoreSectionIdsSignal = signal<string[]>([])

function SimpleSelect() {
	/** 선택된 전체 아이디 */
	const selectItems = useSignal(selectIdsSignal)
	/** 베이스 키 마케팅 운용 */
	const selectKey = useSignal(selectedKeySignal)
	/** 검색된 키 : 벨류 */
	const patternMatchData = useSignal(patternMatchDataSignal)
	/** 로케이션 키: 벨류 */
	const searchStoreLocation = useSignal(searchStoreLocationSignal)
	console.log('🚀 ~ searchStoreLocation:', searchStoreLocation)
	const nextBase = useSignal(nextBaseSignal)

	const { baseNodeId, nodeId, pageId, projectId } = nextBase

	const batchId = useSignal(autoCurrentNodeStyleSignal)

	const _details = useSignal(autoCurrentNodesSignal)
	const currentNode = useSignal(currentPointerSignal)
	const keyNameStore = useSignal(keyIdNameSignal)

	/** 제어할 수 있게 해야해서 합쳐야 함 */
	// const allSectionIds = new Set([...sectionIds, ...ignoreSectionIds]);

	const selectNodes = patternMatchData.filter(item => selectItems.includes(item.id))
	console.log('🚀 ~ SimpleSelect ~ selectNodes:', selectNodes)

	const target = patternMatchData.find(item => item.baseNodeId === batchId)

	console.log('🚀 ~ patternMatchData.reduce ~ item:', patternMatchData)
	/**
	 * 검색된 노드 아이디들의 데이터 정보에서 베이스 아이디들을 찾아서
	 *
	 * 로컬라이제이션 키 기준으로
	 * 전체 선택 흭득
	 * */
	const baseNodes = patternMatchData.reduce((acc, item) => {
		// 인식된 노드 중에서 베이스 아이디가 있는지 확인
		const baseId = item.baseNodeId
		const baseX = searchStoreLocation.get(baseId ?? '')
		// 있으면 그 아이디랑 현재 노드 아이디를 비교
		if (baseId && baseX && item.id === String(baseX.node_id)) {
			if (acc.has(item.localizationKey)) {
				// 베이스 아이디 1개에 여러 키가 있는 건 논리 상으로 불가능한데...
				// 구조상 가능한가?
				// 로컬라이제이션 키 하나에 여러 위치는 가능하다
				// action이 쪼개지기 때문에
			}
			// 어떤 방식으로든 action과 연결된 baseId만 우효함
			acc.set(item.localizationKey, { [baseId]: item })
		}
		return acc
	}, new Map<string, Record<string, MetaData>>())
	console.log(
		'🚀 ~ baseNodes ~ baseNodes: 베이스 아이디 처리 방식이 잘못됨.... 지금 기준 노드, 매핑된 데이터의 로케이션 키를 쓰는지 가 분명하지 않음',
		baseNodes
	)
	// baseId에서 값 얻어서 baseNodes 에 들어갈 item을 선별함

	/** 전체 로컬라이제이션 키 종류 */
	const allKeys = new Set(patternMatchData.map(item => item.localizationKey))
	allKeys.delete('')

	useEffect(() => {
		const nullKeyIds = Array.from(allKeys).filter(item => keyNameStore[item] == null)
		if (nullKeyIds.length > 0) {
			updateKeyIds(nullKeyIds)
		}
	}, [allKeys, keyNameStore])

	/** 키 종류로 분리 */
	// const keyLayer = selectNodes.reduce((acc, item) => {
	// 	if (acc.has(item.localizationKey)) {
	// 		acc.get(item.localizationKey)?.add(item.id);
	// 	} else {
	// 		acc.set(item.localizationKey, new Set([item.id]));
	// 	}
	// 	return acc;
	// }, new Map<string, Set<string>>());

	const keyObject = patternMatchData.reduce((acc, item) => {
		if (acc.has(item.localizationKey)) {
			acc.get(item.localizationKey)?.add(item)
		} else {
			acc.set(item.localizationKey, new Set([item]))
		}
		return acc
	}, new Map<string, Set<MetaData>>())

	/**
	 * 키 뽑아서 타겟 키에 제공
	 *  */
	const targetBase = target?.baseNodeId

	const { nodeId: nextNodeId, pageId: nextPageId, projectId: nextProjectId, baseNodeId: nextBaseNode } = nextBase

	// const targetKey = target?.localizationKey;

	console.log('🚀 ~ SimpleSelect.tsx:217 ~ SimpleSelect ~ allKeys:', allKeys)
	return (
		<div className={styles.root}>
			{Array.from(allKeys).map(key => {
				// 선택 기준 노드 데이터
				// 여기서 키는 로컬라이제이션 키

				// 타겟 키 조건 확인
				// const batchSum = targetKey === key;
				// const batchText = batchSum ? '' : ` => ${targetKey}`;
				const ids = patternMatchData.filter(item => item.localizationKey === key).map(item => item.id)

				const baseNodeName = keyNameStore[key] ?? ''

				// const baseNodeText = baseNodeMetaData?.text ?? '';

				return (
					<article key={key} className={styles.article} onClick={() => {}}>
						<div className={styles.row}>
							<div className={styles.column}>
								<Muted>
									{/* #{key + batchText} : {baseNodeName} */}#{key} : {baseNodeName}
								</Muted>
								{/* <Bold>{baseNodeText}</Bold> */}
							</div>
							<HoverAltButton
								alt={`선택 대상을 #${key}로 병합`}
								onClick={e => {
									// 전파 방지
									e.stopPropagation()
									console.log(`선택 대상을 #${key}로 병합`, {
										localizationKey: key,
										action: 'default',
										locationId: nextBaseNode,
										prefix: 'sectionName',
										name: baseNodeName,
										targetNodeId: nodeId,
										beforeIds: ids,
									} as TranslationInputType)
									emit(TRANSLATION_ACTION_PAIR.REQUEST_KEY, {
										// 기준 키
										localizationKey: key,
										action: 'default',
										locationId: nextBaseNode,
										prefix: 'sectionName',
										// 추천 이름 받았으면 변경할 아이디
										name: baseNodeName,
										// 베이스노드 변경해야하면 바꿀 아이디
										targetNodeId: nodeId,
										// 없어도 될 수 도 있음
										beforeIds: ids,
									} as TranslationInputType)
								}}
							>
								<IconCollapse24 />
							</HoverAltButton>
						</div>

						<div className={styles.container}>
							{Array.from(keyObject.get(key) ?? []).map((item, _, _arr) => {
								// console.log('🚀 ~ {Array.from ~ item:', item)
								const selected = selectItems.includes(item.id)

								const keyMatch = selectKey === item.localizationKey
								// baseId에 대한 처리가 미흡해서 전부 삭제 중
								const current = false
								const isHide = isHideNode(item)

								// const current = currentId === item.id;
								const isNext = item.id === nodeId
								return (
									<TestBaseLabel
										id={item.id}
										selected={selected}
										keyMatch={keyMatch}
										current={current}
										hide={isHide}
										isNext={isNext}
										locationId={targetBase}
										pageId={currentNode?.pageId}
										projectId={currentNode?.projectId}
									/>
								)
							})}
						</div>

						{/* 키 리스트 */}
						{/* <KeyIds keyIds={keyIds} selectKey={selectKey} searchHandler={searchHandler} /> */}
					</article>
				)
			})}
		</div>
	)
}
export default SimpleSelect
