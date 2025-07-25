import { emit } from '@create-figma-plugin/utilities'
import { MetaData } from '@/domain/Search/searchStore'
import { domainSettingSignal } from '@/model/signal'
import { baseIsAllNode } from '../Batch/batchModel'
import { TaskExecutor, TaskItem } from './taskProcessor'

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
				keyId: data.localizationKey || `auto_key_${Date.now()}`,
				ids: [data.id],
			}

			onProgress(50)

			// 첫 번째 노드를 기준 노드로 설정
			const baseNodeId = data.id

			await baseIsAllNode(localizationData, baseNodeId)

			onProgress(100)
		} else {
			throw new Error('작업할 노드 ID가 없습니다.')
		}
	}
}
