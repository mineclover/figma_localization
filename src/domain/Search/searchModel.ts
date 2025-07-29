import { emit, on, once } from '@create-figma-plugin/utilities'
import { keyIdNameSignal, removeKeyIdsSignal } from '@/model/signal'
import { clientFetchDBCurry } from '../utils/fetchDB'
import { getFrameNodeMetaData, MetaData } from './searchStore'
import { generateRandomText2 } from '@/utils/textTools'
import { nodeMetaData } from '../getState'
import { SYNC_GET_NODE_DATA } from '../constant'

const clientFetch = clientFetchDBCurry()

export const updateKeyIds = async (keyIds: string[]) => {
	try {
		const oldKeyNames = keyIdNameSignal.value
		const removeTarget = removeKeyIdsSignal.value

		const requestIds = keyIds.filter(id => !removeTarget.includes(id))

		if (requestIds.length === 0) {
			return
		}

		const response = await clientFetch('/localization/keys/names-by-ids', {
			method: 'POST',
			body: JSON.stringify({
				ids: requestIds,
			}),
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch key names: ${response.status}`)
		}

		const newKeyNames = (await response.json()) as Record<string, string>
		const removeKeyIds = keyIds.filter(id => !Object.keys(newKeyNames).includes(id))

		removeKeyIdsSignal.value = removeKeyIds
		keyIdNameSignal.value = { ...oldKeyNames, ...newKeyNames }
	} catch (error) {
		console.error('Error updating key IDs:', error)
		throw error
	}
}

const _updateKeyId = async (keyId: string) => {
	try {
		const oldKeyNames = keyIdNameSignal.value

		const response = await clientFetch('/localization/keys/names-by-ids', {
			method: 'POST',
			body: JSON.stringify({
				ids: [keyId],
			}),
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch key name: ${response.status}`)
		}

		const newKeyNames = (await response.json()) as Record<string, string>
		keyIdNameSignal.value = { ...oldKeyNames, ...newKeyNames }
	} catch (error) {
		console.error('Error updating key ID:', error)
		throw error
	}
}

export const onSyncGetNodeData = () => {
	on(SYNC_GET_NODE_DATA.REQUEST_KEY, async (nodeId: string, pairKey: string) => {
		if (!nodeId) {
			return
		}

		const node = await figma.getNodeByIdAsync(nodeId)
		if (node && node.type === 'TEXT') {
			const styleData = nodeMetaData(node)
			emit(SYNC_GET_NODE_DATA.RESPONSE_KEY + pairKey, styleData)
		}
	})
}

export const getSyncNodeData = (nodeId: string, timeoutMs: number = 5000): Promise<MetaData | null> => {
	const pairKey = generateRandomText2()
	return new Promise((resolve, reject) => {
		// 타임아웃 설정
		const timeoutId = setTimeout(() => {
			reject(new Error(`Style data request timeout for nodeId: ${nodeId}`))
		}, timeoutMs)

		// 응답 핸들러
		const handleResponse = (nodeData: MetaData) => {
			clearTimeout(timeoutId)
			resolve(nodeData)
		}

		try {
			// 응답 이벤트 리스너 등록
			once(SYNC_GET_NODE_DATA.RESPONSE_KEY + pairKey, handleResponse)

			// 요청 전송
			emit(SYNC_GET_NODE_DATA.REQUEST_KEY, nodeId, pairKey)
		} catch (error) {
			clearTimeout(timeoutId)
			reject(new Error(`Failed to send style data request: ${error}`))
		}
	})
}
