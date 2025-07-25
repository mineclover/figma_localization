import { emit, on } from '@create-figma-plugin/utilities'
import { keyIdNameSignal, removeKeyIdsSignal } from '@/model/signal'
import { clientFetchDBCurry } from '../utils/fetchDB'

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
