import { Button } from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import type { ProviderResponse } from '@/ai/provider'
import { textRecommend } from '@/ai/textRecommend'
import { modalAlert } from '@/components/alert'
import { clc } from '@/components/modal/utils'
import { useAsync } from '@/hooks/useAsync'
import { useSignal } from '@/hooks/useSignal'
import {
	apiKeySignal,
	autoCurrentNodeStyleSignal as autoCurrentNodeBaseSignal,
	keyIdNameSignal,
	patternMatchDataSignal,
	searchStoreLocationSignal,
	selectIdsSignal,
} from '@/model/signal'
import { nextBaseSignal } from '../Batch/SimpleSelect'
import { TRANSLATION_ACTION_PAIR } from '../constant'
import styles from './Label.module.css'

type SelectKeyNameType = {
	id: string
	name: string
	type: 'normal' | 'ai'
}

interface KeyIdsProps {
	localizationKey: string
	action: string
	text: string
	prefix: string
}

export const KeyIds = ({ localizationKey, action, text, prefix }: KeyIdsProps) => {
	const keyNameStore = useSignal(keyIdNameSignal)
	const patternMatchData = useSignal(patternMatchDataSignal)
	const selectIds = useSignal(selectIdsSignal)
	const apiKey = useSignal(apiKeySignal)
	const nextBase = useSignal(nextBaseSignal)
	const baseNodeId = useSignal(autoCurrentNodeBaseSignal)
	const searchStoreLocation = useSignal(searchStoreLocationSignal)

	const [selectName, setSelectName] = useState<string>('')
	const [selectKeyName, setSelectKeyName] = useState<SelectKeyNameType[]>([])

	const selectLocation = searchStoreLocation.get(baseNodeId)
	const tempSelectKeyId = patternMatchData.filter(item => selectIds.includes(item.id)).map(item => item.localizationKey)
	const selectKeyId = new Set(tempSelectKeyId)

	const { data, loading, error, executeAsync } =
		useAsync<
			ProviderResponse<{
				variableName: string
				normalizePoint: number
			}>
		>()

	useEffect(() => {
		const settingName = keyNameStore[localizationKey]
		setSelectName(settingName)

		const prevSelectKeyName = selectKeyName.filter(item => item.type !== 'normal')
		const nextSelectKeyName: SelectKeyNameType[] = []

		for (const item of selectKeyId) {
			const keyName = keyNameStore[item]
			nextSelectKeyName.push({
				id: item,
				name: keyName,
				type: 'normal',
			})
		}
		setSelectKeyName(() => [...prevSelectKeyName, ...nextSelectKeyName])
	}, [keyNameStore, localizationKey, selectKeyId, selectKeyName.filter])

	useEffect(() => {
		const prevSelectKeyName = selectKeyName.filter(item => item.type !== 'ai')
		const nextSelectKeyName: SelectKeyNameType[] = []

		if (data && !loading) {
			for (const item of data.data) {
				nextSelectKeyName.push({
					id: String(item.normalizePoint),
					name: item.variableName,
					type: 'ai',
				})
			}
		}
		setSelectKeyName([...prevSelectKeyName, ...nextSelectKeyName])
	}, [loading, data, selectKeyName.filter])

	const handleRecommendation = () => {
		if (apiKey) {
			executeAsync(textRecommend, apiKey, text, prefix)
		} else {
			modalAlert('api key 가 없습니다.')
		}
	}

	const handleKeySelection = (name: string, id: string) => {
		setSelectName(name)

		const { nodeId: nextNodeId, baseNodeId: nextBaseNode } = nextBase
		const isNextBase = nextBaseNode === baseNodeId
		const nodeId = selectLocation?.node_id
		const ids = patternMatchData.filter(item => item.localizationKey === id).map(item => item.id)

		emit(TRANSLATION_ACTION_PAIR.REQUEST_KEY, {
			localizationKey,
			action,
			baseNodeId,
			prefix,
			name,
			targetNodeId: isNextBase ? nextNodeId : nodeId,
			beforeIds: ids,
		})
	}

	const sortedKeyNames = [...selectKeyName].sort((a, b) => {
		const typeCompare = b.type.localeCompare(a.type)
		if (typeCompare !== 0) {
			return typeCompare
		}
		return a.id.localeCompare(b.id)
	})

	return (
		<div className={styles.keyIds}>
			<span>{baseNodeId}</span>
			<span>{text}</span>
			<Button onClick={handleRecommendation}>추천</Button>

			{loading && <p>Loading...5초</p>}
			{error && <p>Error: {error.message}</p>}

			{sortedKeyNames.map(({ id, name, type }) => (
				<button
					type="button"
					key={`${type}-${id}`}
					className={clc(styles.keyId, selectName === name && styles.keyMatch)}
					onClick={() => handleKeySelection(name, id)}
				>
					{type === 'ai' ? '표준화 추천 ' : '#'}
					{id} : {name}
				</button>
			))}
		</div>
	)
}
