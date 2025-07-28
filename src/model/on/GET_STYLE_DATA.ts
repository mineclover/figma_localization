import { emit, on, once } from '@create-figma-plugin/utilities'
import { GET_STYLE_DATA, SYNC_GET_STYLE_DATA } from '@/domain/constant'
import { getAllStyleRanges } from '@/figmaPluginUtils/text'
import { generateRandomText2 } from '@/utils/textTools'
import { type StyleData, styleDataSignal } from '../signal'

export const newGetStyleData = async (nodeId: string) => {
	const node = await figma.getNodeByIdAsync(nodeId)
	if (!node || node.type !== 'TEXT') {
		return null
	}
	const { styleData, boundVariables, effectStyleData } = getAllStyleRanges(node)
	// emit(GET_STYLE_DATA.RESPONSE_KEY, { styleData, boundVariables });
	return { styleData, boundVariables, effectStyleData }
}

export const onGetStyleData = () => {
	on(GET_STYLE_DATA.REQUEST_KEY, async (nodeId?: string) => {
		if (!nodeId) {
			const node = figma.currentPage.selection[0]
			if (!node) {
				return
			}
			nodeId = node.id
		}

		const styleData = await newGetStyleData(nodeId)
		emit(GET_STYLE_DATA.RESPONSE_KEY, styleData)
	})
}

export const onGetStyleDataResponse = () => {
	emit(GET_STYLE_DATA.REQUEST_KEY)
	return on(GET_STYLE_DATA.RESPONSE_KEY, (styleData: StyleData) => {
		styleDataSignal.value = styleData
	})
}

export const onSyncGetStyleData = () => {
	on(SYNC_GET_STYLE_DATA.REQUEST_KEY, async (nodeId: string, pairKey: string) => {
		if (!nodeId) {
			return
		}
		const styleData = await newGetStyleData(nodeId)
		emit(GET_STYLE_DATA.RESPONSE_KEY + pairKey, styleData)
	})
}

export const getSyncStyleData = (nodeId: string, timeoutMs: number = 5000): Promise<StyleData | null> => {
	const pairKey = generateRandomText2()

	return new Promise((resolve, reject) => {
		// 타임아웃 설정
		const timeoutId = setTimeout(() => {
			reject(new Error(`Style data request timeout for nodeId: ${nodeId}`))
		}, timeoutMs)

		// 응답 핸들러
		const handleResponse = (styleData: StyleData) => {
			clearTimeout(timeoutId)
			resolve(styleData)
		}

		try {
			// 응답 이벤트 리스너 등록
			once(GET_STYLE_DATA.RESPONSE_KEY + pairKey, handleResponse)

			// 요청 전송
			emit(SYNC_GET_STYLE_DATA.REQUEST_KEY, nodeId, pairKey)
		} catch (error) {
			clearTimeout(timeoutId)
			reject(new Error(`Failed to send style data request: ${error}`))
		}
	})
}
