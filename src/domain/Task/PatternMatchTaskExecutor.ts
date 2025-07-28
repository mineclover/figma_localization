import { emit } from '@create-figma-plugin/utilities'
import { MetaData } from '@/domain/Search/searchStore'
import { currentPointerSignal, domainSettingSignal, styleDataSignal, styleTagModeSignal } from '@/model/signal'
import { baseIsAllNode } from '../Batch/batchModel'
import { TaskExecutor, TaskItem } from './taskProcessor'
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction'
import { styleToXml } from '../Style/styleAction'
import { getSyncStyleData } from '@/model/on/GET_STYLE_DATA'

const testStyles = async (baseNodeId: string) => {
	const domainSetting = domainSettingSignal.value
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:13 ~ testStyles ~ domainSetting:', domainSetting)
	if (!domainSetting?.domainId) {
		throw new Error('도메인 설정이 없습니다.')
	}
	const styleTagMode = styleTagModeSignal.value
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:18 ~ testStyles ~ styleTagMode:', styleTagMode)

	const currentPointer = currentPointerSignal.value
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:21 ~ testStyles ~ currentPointer:', currentPointer)
	if (!currentPointer) {
		throw new Error('노드 데이터가 없습니다.')
	}

	const styleData = await getSyncStyleData(baseNodeId, 3000)
	console.log('🚀 ~ PatternMatchTaskExecutor.ts:27 ~ testStyles ~ styleData:', styleData)
	if (!styleData) {
		throw new Error(' 스타일 데이터가 없습니다.')
	}

	const domainId = domainSetting.domainId
	const characters = currentPointer.characters
	const StyleDataArr = styleData
	const mode = styleTagMode

	return await styleToXml(domainId, characters, StyleDataArr, mode)
}

export class PatternMatchTaskExecutor implements TaskExecutor<MetaData> {
	async execute(task: TaskItem<MetaData>, onProgress: (progress: number) => void): Promise<void> {
		const { data } = task

		// 작업 중인 노드로 포커스
		if (data.id) {
			emit('PAGE_SELECT_IDS_TO_BOX', { ids: [data.id], select: true })
		}

		onProgress(20)

		// 로컬라이제이션 키 설정 작업 수행
		if (data.id) {
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

			// 첫 번째 노드를 기준 노드로 설정
			const baseNodeId = data.id
			console.log(
				'🚀 ~ PatternMatchTaskExecutor.ts:32 ~ PatternMatchTaskExecutor ~ execute ~ localizationData:',
				localizationData
			)

			pageNodeZoomAction(baseNodeId, true)
			await new Promise(resolve => setTimeout(resolve, 1000))

			const x = await testStyles(baseNodeId)
			console.log('🚀 ~ PatternMatchTaskExecutor.ts:80 ~ PatternMatchTaskExecutor ~ execute ~ x:', x)

			// await baseIsAllNode(localizationData, baseNodeId)

			onProgress(100)
		} else {
			throw new Error('작업할 노드 ID가 없습니다.')
		}
	}
}
