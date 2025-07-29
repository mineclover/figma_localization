import { emit } from '@create-figma-plugin/utilities'
import { textRecommend } from '@/ai/textRecommend'
import { MetaData } from '@/domain/Search/searchStore'
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction'
import { getSyncStyleData } from '@/model/on/GET_STYLE_DATA'
import {
	apiKeySignal,
	currentPointerSignal,
	domainSettingSignal,
	patternMatchDataSignal,
	styleDataSignal,
	styleTagModeSignal,
} from '@/model/signal'
import { XmlFlatNode } from '@/utils/types'
import { parseXmlToFlatStructure, replaceTagNames } from '@/utils/xml2'
import { baseIsAllNode } from '../Batch/batchModel'
import { SET_NODE_ACTION, SET_TARGET_NODE_ACTION, TRANSLATION_ACTION_PAIR } from '../constant'
import { getSyncNodeData } from '../Search/searchModel'
import { getSyncBatchBaseId } from '../Search/visualModel'
import { styleToXml } from '../Style/styleAction'
import { clientFetchDBCurry } from '../utils/fetchDB'
import { TaskExecutor, TaskItem } from './taskProcessor'

const testStyles = async (nodeData: MetaData) => {
	const baseId = nodeData.baseNodeId
	if (baseId == null) {
		throw new Error('base Id가 없습니다.')
	}

	const domainSetting = domainSettingSignal.value
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:13 ~ testStyles ~ domainSetting:', domainSetting)
	if (!domainSetting?.domainId) {
		throw new Error('도메인 설정이 없습니다.')
	}
	const styleTagMode = styleTagModeSignal.value
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:18 ~ testStyles ~ styleTagMode:', styleTagMode)

	// currentPointerSignal 의 경우 다른 로직과 신호를 공유하므로 안정적이지 못함
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:24 ~ testStyles ~ nodeData:', nodeData)

	const nodeId = nodeData.id

	if (nodeId == null) {
		throw new Error('노드 아이디가 없습니다.')
	}
	const styleData = await getSyncStyleData(nodeId, 3000)
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:27 ~ testStyles ~ styleData:', styleData)
	if (!styleData) {
		throw new Error(' 스타일 데이터가 없습니다.')
	}

	const domainId = domainSetting.domainId
	const characters = nodeData.text
	const StyleDataArr = styleData
	const mode = styleTagMode

	return await styleToXml(domainId, characters, StyleDataArr, mode)
}

export const xmlTagsParse = async (xmlString: string) => {
	const flatItems = await parseXmlToFlatStructure(xmlString)
	const targetKey = flatItems.filter(item => item.tagName !== 'br')
	return new Set(targetKey.map(item => item.tagName))
}

// 무지성으로 a,b,c를 맞추기 때문에, 글자 순서가 변경되면 태그 적용 순서가 변경 될 수 있음
// 전체 자동 생성의 경우 <a>aaa</a><b>bbb</b> 글자마다 스타일이 다르다는 가정하에 b가 앞에오면 b가 a가 됨 <a>b</a><b>aaa</b><a>bbb</a>
// 원본 텍스트의 경우 글의 내용보다 순서가 중요하다는 의미
// ko, en 등의 실제 번역에서 순서가 변경되는 것은 문제되지 않음 origin이 가지는 스타일에 중요
// 첫 번째 노드를 기준 노드로 설정

export const tagToNormalize = (list: Set<string>) => {
	const index = 'abcdefghijklmnopqrstuvwxyz'
	const keyMap: Record<string, string> = {}
	let count = 0
	list.forEach((v, i) => {
		console.log('🚀 ~ PatternMatchTaskExecutor.ts:57 ~ tagToNormalize ~ v , i:', v, i)
		keyMap[v] = index[count]
		count++
	})
	return keyMap
}

const xmlUpdate = async ({
	keyId,
	nodeId,
	action,
	domainId,
	resultXml,
	list,
}: {
	keyId: string
	nodeId: string
	action: 'default'
	domainId: string
	/** 변경된 xml */
	resultXml: string
	list: Record<string, string>
}) => {
	emit(SET_TARGET_NODE_ACTION.REQUEST_KEY, nodeId, {
		localizationKey: keyId,
		action: action,
		domainId: domainId,
	})
	const fetchClient = clientFetchDBCurry(domainId)

	const fetchData2 = await fetchClient('/localization/translations', {
		method: 'PUT',
		body: JSON.stringify({
			keyId,
			language: 'origin',
			translation: resultXml,
		}),
	})

	const data2 = await fetchData2.json()
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:113 ~ xmlUpdate ~ data2:', data2)

	const body = {
		key_id: keyId,
		action: action,
		mappings: list,
	}

	const fetchData = await fetchClient('/localization/actions/bulk', {
		method: 'POST',
		body: JSON.stringify(body),
	})
	const data = await fetchData.json()
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:126 ~ xmlUpdate ~ data:', data)
}

/**
 * 이름 업데이트 로직
 * name : 바꿀 이름
 * 로컬라이제이션 키
 *
 */
const handleKeySelection = async (data: MetaData) => {
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:127 ~ handleKeySelection ~ data:', data)

	if (data == null) {
		return
	}

	const { localizationKey: keyId, name: before, id: nodeId, text } = data
	const apiKey = apiKeySignal.value

	if (apiKey == null) {
		return
	}

	const testPrefix = 'pageName'

	const recommends = await textRecommend(apiKey, text, testPrefix)

	if (recommends == null) {
		return
	}
	const centerName = recommends.data.find(item => item.normalizePoint === 0.6)

	const patternMatchData = patternMatchDataSignal.value
	const ids = patternMatchData.filter(item => item.localizationKey === keyId).map(item => item.id)

	const baseNodeId = await getSyncBatchBaseId(ids)
	console.log({
		localizationKey: keyId,
		action: 'default',
		baseNodeId,
		prefix: testPrefix,
		name: centerName,
		// 베이스노드 삼고 싶은 nodeId
		targetNodeId: nodeId,
		beforeIds: ids,
		// 이름을 변경해야할 대상
	})
	if (baseNodeId === 'mixed' || baseNodeId === 'none') {
		console.log('선택된 노드들에 baseId가 두개 이상이거나 없음')
		return
	}

	emit(TRANSLATION_ACTION_PAIR.REQUEST_KEY, {
		localizationKey: keyId,
		action: 'default',
		baseNodeId,
		prefix: testPrefix,
		name: centerName,
		// 베이스노드 삼고 싶은 nodeId
		targetNodeId: nodeId,
		beforeIds: ids,
		// 이름을 변경해야할 대상
	})
}

export class PatternMatchTaskExecutor implements TaskExecutor<MetaData> {
	async execute(task: TaskItem<MetaData>, onProgress: (progress: number) => void): Promise<void> {
		const { data } = task
		pageNodeZoomAction(data.id, true)
		onProgress(20)

		// 로컬라이제이션 키 설정 작업 수행
		if (data.id) {
			const nodeData = await getSyncNodeData(data.id)
			if (nodeData == null) {
				throw new Error('작업할 노드 정보가 없습니다.')
			}

			// 현재 도메인 설정 가져오기
			const domainSetting = domainSettingSignal.value
			if (!domainSetting?.domainId) {
				throw new Error('도메인 설정이 없습니다.')
			}

			// 기존 batchModel의 baseIsAllNode 함수 활용
			const localizationData = {
				domainId: String(domainSetting.domainId),
				keyId: data.localizationKey,
				ids: [data.id],
			}

			onProgress(50)

			// 노드 정보 얻기 위한 임시 로직

			// 안정성
			// await new Promise(resolve => setTimeout(resolve, 1000))

			// 스타일 파서
			const styleInfo = await testStyles(nodeData)
			// 태그 파서
			const originTags = await xmlTagsParse(styleInfo.xmlString)
			console.log('🚀 ~ PatternMatchTaskExecutor.ts:102 ~ PatternMatchTaskExecutor ~ execute ~ xx:', originTags)
			const tags = tagToNormalize(originTags)
			console.log('🚀 ~ PatternMatchTaskExecutor.ts:103 ~ PatternMatchTaskExecutor ~ execute ~ xxx:', tags)

			// 키 생성
			let resultXml = styleInfo.xmlString
			for (const [key, value] of Object.entries(tags)) {
				if (value !== '') {
					resultXml = await replaceTagNames(resultXml, key, value)
				}
			}
			const body = {
				keyId: localizationData.keyId,
				nodeId: data.id,
				action: 'default',
				domainId: localizationData.domainId,
				list: tags,
				resultXml,
			} as const
			// 매핑 데이터 업로드
			const last = xmlUpdate(body)
			console.log('🚀 ~ PatternMatchTaskExecutor.ts:176 ~ PatternMatchTaskExecutor ~ execute ~ data:', last)
			// 이름 부여

			handleKeySelection(nodeData)

			onProgress(100)
		} else {
			throw new Error('작업할 노드 ID가 없습니다.')
		}
	}
}
