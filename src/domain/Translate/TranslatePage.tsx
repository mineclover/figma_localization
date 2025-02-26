import { modalAlert } from '@/components/alert'
import { addLayer } from '@/components/modal/Modal'
import { useFetch } from '@/hooks/useFetch'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { components } from 'types/i18n'
import {
	domainSettingSignal,
	languageCodesSignal,
	onGetDomainSettingResponse,
	onGetLanguageCodesResponse,
} from '../Setting/SettingModel'

import { useSignal } from '@/hooks/useSignal'
import { Bold, Button, Container, Stack, Text, Textbox, TextboxMultiline, VerticalSpace } from '@create-figma-plugin/ui'

import { GET_PROJECT_ID, RELOAD_NODE, SET_LANGUAGE_CODES, SET_PROJECT_ID } from '../constant'
import { emit } from '@create-figma-plugin/utilities'
import {
	currentPointerSignal,
	onGetCursorPositionResponse,
	onSetProjectIdResponse,
	projectIdSignal,
} from '../Label/LabelModel'
import {
	localizationKeySignal,
	LocalizationTranslation,
	LocalizationTranslationDTO,
	localizationTranslationMapping,
	onGetLocalizationKeyResponse,
} from '../Label/TextPluginDataModel'
import styles from './translate.module.css'
import { clientFetchDBCurry } from '../utils/fetchDB'
import { NullDisableText } from '../Label/LabelSearch'
import { clc } from '@/components/modal/utils'
// 있든 없든 수정 가능하게 구성

const TranslateItem = ({
	key_id,
	text,
	language_code,
	localization_id,
	version,
	updated_at,
	domainId,
	updateAction,
	selectedId,
}: LocalizationTranslation & {
	domainId: number
	updateAction: () => Promise<any> | undefined
	selectedId: string | undefined
}) => {
	const [translation, setTranslation] = useState(text)

	useEffect(() => {
		setTranslation(text)
	}, [text])

	const clientFetchDB = clientFetchDBCurry(domainId)

	const isSelect = localization_id != null && selectedId === localization_id.toString()

	return (
		<div className={clc(styles.translateItem, isSelect && styles.translateBorder)}>
			<section className={styles.translateLeft}>
				<Text className={styles.smallText}>#{localization_id ?? 'NaN'}</Text>
				<Bold>{language_code}</Bold>
			</section>

			<TextboxMultiline
				value={translation}
				rows={2}
				onChange={(e) => {
					const nextText = e.currentTarget.value.replace(/\n/g, '<br/>')
					setTranslation(nextText)
				}}
			/>
			<button
				className={styles.translateRight}
				onClick={() => {
					clientFetchDB('/localization/translations', {
						method: 'PUT',
						body: JSON.stringify({
							keyId: key_id.toString(),
							language: language_code,
							translation: translation,
						}),
					})
					emit(RELOAD_NODE.REQUEST_KEY)
					updateAction()
				}}
			>
				<Text className={styles.smallText}>no. {version ?? 'NaN'}</Text>
				<Bold>Save</Bold>
			</button>
		</div>
	)
}

const TranslatePage = () => {
	const { data, loading, error, fetchData } = useFetch<LocalizationTranslationDTO[]>()

	const [translations, setTranslations] = useState<Record<string, LocalizationTranslation>>({})
	console.log('🚀 ~ TranslatePage ~ translations:', translations)

	/** 도메인에 설정된 리스트 */
	const languageCodes = useSignal(languageCodesSignal)

	const currentPointer = useSignal(currentPointerSignal)
	console.log('🚀 ~ TranslatePage ~ currentPointer:', currentPointer)

	const domainSetting = useSignal(domainSettingSignal)
	const localizationKeyValue = useSignal(localizationKeySignal)
	const targetArray = ['origin', ...languageCodes]

	const updateAction = () => {
		const keyId = localizationKeyValue?.key_id
		if (!keyId) {
			return
		}
		return fetchData(('/localization/keys/' + keyId + '/translations') as '/localization/keys/{id}/translations', {
			method: 'GET',
		})
	}

	useEffect(() => {
		if (!data) {
			return
		}

		const newTranslations = {} as Record<string, LocalizationTranslation>

		data.forEach((item) => {
			if (targetArray.includes(item.language_code)) {
				const data = localizationTranslationMapping(item)
				newTranslations[item.language_code] = data
			}
		})

		setTranslations(newTranslations)
	}, [data])

	useEffect(() => {
		updateAction()
	}, [])

	if (domainSetting == null) {
		return <Bold>도메인 설정이 없습니다</Bold>
	}

	if (localizationKeyValue?.key_id == null) {
		return <Bold>감지된 키가 없습니다</Bold>
	}

	return (
		<div>
			<VerticalSpace space="extraSmall" />
			{/* <div>1. 해당 키가 가진 번역 목록을 준다 {'>'} 번역 목록 기반으로 변경 확인</div>
    <div>2. 번역 가능한 인터페이스를 준다 {'>'} 실시간 번역</div>
    <div>3. 위치가 있으면 위치를 준다 {'>'} 해당 키를 검색으로 입력 받게 해서 확장 가능</div> */}

			<div className={styles.container}>
				<NullDisableText>{localizationKeyValue.name}</NullDisableText>
				<VerticalSpace space="extraSmall" />
				{/* {JSON.stringify(data)} */}
				{targetArray.map((item) => {
					return (
						<TranslateItem
							key={item + translations[item]?.localization_id}
							{...translations[item]}
							language_code={item}
							key_id={localizationKeyValue.key_id}
							domainId={domainSetting.domainId}
							updateAction={updateAction}
							selectedId={currentPointer?.data.originalLocalizeId}
						/>
					)
				})}
			</div>
		</div>
	)
}
export default TranslatePage
