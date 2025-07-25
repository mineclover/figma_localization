import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { useFetch } from '@/hooks/useFetch'
import { useSignal } from '@/hooks/useSignal'
import { currentPointerSignal, languageCodesSignal, localizationKeySignal } from '@/model/signal'
import type { LocalizationTranslation, LocalizationTranslationDTO } from '@/model/types'
import { localizationTranslationMapping } from '../Label/TextPluginDataModel'

const TranslateLine = ({ characters }: { characters: string }) => {
	const { data, loading, error, fetchData } = useFetch<LocalizationTranslationDTO[]>()

	const [translations, setTranslations] = useState<Record<string, LocalizationTranslation>>({})

	/** 도메인에 설정된 리스트 */
	const languageCodes = useSignal(languageCodesSignal)
	const _currentPointer = useSignal(currentPointerSignal)
	const localizationKeyValue = useSignal(localizationKeySignal)

	const targetArray = languageCodes
	const updateAction = () => {
		const keyId = localizationKeyValue?.key_id
		if (!keyId) {
			return
		}
		return fetchData(`/localization/keys/${keyId}/translations` as '/localization/keys/{id}/translations', {
			method: 'GET',
		})
	}

	useEffect(() => {
		if (!data) {
			return
		}

		const newTranslations = {} as Record<string, LocalizationTranslation>

		data.forEach(item => {
			if (['origin', ...targetArray].includes(item.language_code)) {
				const data = localizationTranslationMapping(item)
				newTranslations[item.language_code] = data
			}
		})

		setTranslations(newTranslations)
	}, [data, targetArray])

	useEffect(() => {
		if (localizationKeyValue?.key_id == null) {
			return
		}
		updateAction()
	}, [localizationKeyValue?.key_id, updateAction])

	const newMap = Object.entries(translations).filter(([_key, value]) => value.text === characters)
	console.log('🚀 ~ TranslateLine ~ newMap:', translations, characters)

	const mapLength = newMap.length
	const isOrigin = newMap.some(([key, _value]) => key === 'origin')

	/**
	 * 1. origin 이면 추가
	 * 2. 같은 것이 없으면 수정
	 * 3. 같은 것이 있는데 origin이 아니면 특정 값
	 */
	const resultText = isOrigin ? '= origin' : mapLength === 0 ? '수정 됨' : `= ${newMap[0][0]}`

	return <div>{resultText.toLocaleUpperCase()}</div>
}

export default TranslateLine
