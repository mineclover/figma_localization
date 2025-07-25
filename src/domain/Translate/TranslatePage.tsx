import {
	Bold,
	Button,
	Container,
	Divider,
	IconButton,
	IconSwapSmall24,
	IconTrash24,
	Stack,
	Text,
	Textbox,
	TextboxMultiline,
	VerticalSpace,
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { components } from 'types/i18n'
import { modalAlert } from '@/components/alert'
import { addLayer } from '@/components/modal/Modal'
import { clc } from '@/components/modal/utils'
import { useFetch } from '@/hooks/useFetch'

import { useSignal } from '@/hooks/useSignal'
import {
	currentPointerSignal,
	currentSectionSignal,
	domainSettingSignal,
	languageCodesSignal,
	localizationKeySignal,
	projectIdSignal,
	variableDataSignal,
} from '@/model/signal'
import type { LocalizationTranslation, LocalizationTranslationDTO } from '@/model/types'
import {
	CHANGE_LANGUAGE_CODE,
	CLEAR_VARIABLE_DATA,
	GET_PROJECT_ID,
	GET_VARIABLE_DATA,
	RELOAD_NODE,
	SET_LANGUAGE_CODES,
	SET_PROJECT_ID,
	SET_VARIABLE_DATA,
} from '../constant'
import { onSetProjectIdResponse } from '../Label/LabelModel'
import { NullDisableText } from '../Label/LabelSearch'
import { localizationTranslationMapping } from '../Label/TextPluginDataModel'
import { onGetDomainSettingResponse, onGetLanguageCodesResponse } from '../Setting/SettingModel'
import ProcessBar from '../System/ProcessBar'
import { clientFetchDBCurry } from '../utils/fetchDB'
import styles from './translate.module.css'

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
}: LocalizationTranslation & {
	domainId: number
	updateAction: () => Promise<any> | undefined
}) => {
	const [translation, setTranslation] = useState(text)

	useEffect(() => {
		setTranslation(text)
	}, [text])

	const clientFetchDB = clientFetchDBCurry(domainId)

	const isSelect = localization_id != null

	return (
		<div className={clc(styles.translateItem, isSelect && styles.translateBorder)}>
			<section className={styles.nationLeft}>
				<Text className={styles.smallText}>#{localization_id ?? 'NaN'}</Text>
				<Bold>{language_code}</Bold>
			</section>

			<TextboxMultiline
				value={translation}
				rows={2}
				onChange={e => {
					const nextText = e.currentTarget.value.replace(/\n/g, '\n')
					setTranslation(nextText)
				}}
			/>
			{language_code !== 'origin' && (
				<button
					type="button"
					className={styles.translateRight}
					onClick={async () => {
						await clientFetchDB('/localization/translations', {
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
			)}
		</div>
	)
}

const VariableItem = ({ id, value }: { id: string; value: string }) => {
	const [variableValue, setVariableValue] = useState(value)

	return (
		<div className={styles.translateRow}>
			<div className={styles.translateLeft}>
				<Text>{id}</Text>
			</div>
			<Textbox
				value={variableValue}
				onChange={e => {
					setVariableValue(e.currentTarget.value)
				}}
			/>

			<Button
				onClick={() => {
					emit(SET_VARIABLE_DATA.REQUEST_KEY, id, variableValue)
				}}
			>
				저장
			</Button>
		</div>
	)
}

const TranslatePage = () => {
	const { data, loading, error, fetchData } = useFetch<LocalizationTranslationDTO[]>()

	const [translations, setTranslations] = useState<Record<string, LocalizationTranslation>>({})

	/** 도메인에 설정된 리스트 */
	const languageCodes = useSignal(languageCodesSignal)
	const currentPointer = useSignal(currentPointerSignal)
	const currentSection = useSignal(currentSectionSignal)
	const domainSetting = useSignal(domainSettingSignal)
	const localizationKeyValue = useSignal(localizationKeySignal)

	const variableData = useSignal(variableDataSignal)
	const targetArray = ['origin', ...languageCodes]
	const pageLock = currentPointer?.pageLock ?? false

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
			if (targetArray.includes(item.language_code)) {
				const data = localizationTranslationMapping(item)
				newTranslations[item.language_code] = data
			}
		})

		setTranslations(newTranslations)
	}, [data, targetArray.includes])

	useEffect(() => {
		if (localizationKeyValue?.key_id == null) {
			return
		}
		updateAction()
	}, [localizationKeyValue?.key_id, updateAction])

	if (domainSetting == null) {
		return <Bold>도메인 설정이 없습니다</Bold>
	}

	return (
		<div>
			<ProcessBar />

			<div className={styles.container}>
				<Bold>{currentSection == null ? '페이지' : `${currentSection.name} 섹션`} 에서 언어 변경</Bold>

				<div className={styles.translateRow}>
					{targetArray.map(item => {
						return (
							<Button
								onClick={() => {
									if (pageLock) {
										modalAlert(
											<Text>
												페이지가 잠겨있습니다<br></br>
												번역 여부 확인만 진행합니다
											</Text>
										)
									}
									emit(CHANGE_LANGUAGE_CODE.REQUEST_KEY, item, currentSection?.id)
								}}
							>
								{item}
							</Button>
						)
					})}
				</div>
			</div>
			<VerticalSpace space="extraSmall" />
			<Divider />
			<VerticalSpace space="extraSmall" />
			{/* <div>1. 해당 키가 가진 번역 목록을 준다 {'>'} 번역 목록 기반으로 변경 확인</div>
    <div>2. 번역 가능한 인터페이스를 준다 {'>'} 실시간 번역</div>
    <div>3. 위치가 있으면 위치를 준다 {'>'} 해당 키를 검색으로 입력 받게 해서 확장 가능</div> */}
			<div className={styles.container}>
				<div className={styles.translateRow}>
					<Bold>변수 목록</Bold>
					<IconButton
						onClick={() => {
							emit(GET_VARIABLE_DATA.REQUEST_KEY)
						}}
					>
						<IconSwapSmall24 />
					</IconButton>
					<IconButton
						onClick={() => {
							emit(CLEAR_VARIABLE_DATA.REQUEST_KEY)
						}}
					>
						<IconTrash24 />
					</IconButton>
				</div>

				{Object.entries(variableData).map(([key, value]) => {
					return <VariableItem key={key} id={key} value={value} />
				})}
			</div>
			<VerticalSpace space="extraSmall" />
			<Divider />
			<VerticalSpace space="extraSmall" />
			<div className={styles.container}>
				<Bold>번역 텍스트</Bold>
				<NullDisableText>{localizationKeyValue?.name}</NullDisableText>
				<VerticalSpace space="extraSmall" />
				{/* {JSON.stringify(data)} */}
				{localizationKeyValue &&
					targetArray.map(item => {
						return (
							<TranslateItem
								key={item + translations[item]?.localization_id}
								{...translations[item]}
								language_code={item}
								key_id={localizationKeyValue.key_id}
								domainId={domainSetting.domainId}
								updateAction={updateAction}
							/>
						)
					})}
			</div>
		</div>
	)
}

export default TranslatePage
