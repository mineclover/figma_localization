import { modalAlert } from '@/components/alert'
import { addLayer } from '@/components/modal/Modal'
import { ComponentChildren, Fragment, h } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import {
	GET_CURSOR_POSITION,
	GET_LOCALIZATION_KEY_VALUE,
	PUT_LOCALIZATION_KEY,
	RELOAD_NODE,
	SET_NODE_LOCATION,
	SET_NODE_RESET_KEY,
} from '../constant'
import { emit } from '@create-figma-plugin/utilities'
import { currentPointerSignal, onGetCursorPositionResponse, sectionNameParser } from './LabelModel'
import { useSignal } from '@/hooks/useSignal'
import { CurrentCursorType } from '../utils/featureType'
import {
	Button,
	Checkbox,
	IconLayerFrameCoverArt16,
	Stack,
	Textbox,
	Text,
	IconButton,
	IconLockLocked16,
	IconLockUnlocked16,
	IconStarFilled16,
} from '@create-figma-plugin/ui'
import styles from './LabelPage.module.css'
import {
	LocalizationKey,
	localizationKeySignal,
	onGetLocalizationKeyResponse,
	onLocalizationKeyTranslationsResponse,
	PutLocalizationKeyType,
} from './TextPluginDataModel'
import { removeLeadingSymbols } from '@/utils/textTools'
import LabelSearch from './LabelSearch'

const isTemporary = (data: LocalizationKey | null) => {
	if (data == null) {
		return false
	}

	return !data.is_temporary
}

function LabelPage() {
	const currentPointer = useSignal(currentPointerSignal)

	const localizationKeyValue = useSignal(localizationKeySignal)
	const [search, setSearch] = useState('')
	const [aliasHover, setAliasHover] = useState(false)
	const [lockHover, setLockHover] = useState(false)

	useEffect(() => {
		const event = onGetCursorPositionResponse()
		// const event2 = onLocalizationKeyTranslationsResponse()
		const event3 = onGetLocalizationKeyResponse()

		return () => {
			event()
			// event2()
			event3()
		}
	}, [])

	return (
		<div className={styles.container}>
			<div className={styles.sectionRow}>
				<IconLayerFrameCoverArt16></IconLayerFrameCoverArt16>
				<span className={styles.sectionTitle}>{currentPointer?.sectionName ?? ''}</span>

				{currentPointer?.data.localizationKey ? (
					<button
						className={styles.dangerButton}
						onClick={() => {
							emit(RELOAD_NODE.REQUEST_KEY)
							emit(GET_LOCALIZATION_KEY_VALUE.REQUEST_KEY)
						}}
					>
						새로 고침
					</button>
				) : (
					<button
						className={styles.dangerButton}
						onClick={() => {
							emit(SET_NODE_RESET_KEY.REQUEST_KEY)
							currentPointerSignal.value = {
								...currentPointer,
								data: {
									locationKey: '',
									localizationKey: '',
									originalLocalizeId: '',
								} as CurrentCursorType['data'],
							} as CurrentCursorType
							localizationKeySignal.value = null
						}}
					>
						초기화
					</button>
				)}

				{currentPointer?.data.localizationKey ? (
					<button
						className={styles.componentButton}
						onClick={() => {
							emit(SET_NODE_RESET_KEY.REQUEST_KEY)
							currentPointerSignal.value = {
								...currentPointer,
								data: {
									locationKey: '',
									localizationKey: '',
									originalLocalizeId: '',
								} as CurrentCursorType['data'],
							} as CurrentCursorType
							localizationKeySignal.value = null
						}}
					>
						연결 해제
					</button>
				) : (
					<button
						className={styles.brandButton}
						onClick={() => {
							emit(SET_NODE_LOCATION.REQUEST_KEY)
						}}
					>
						추가
					</button>
				)}
			</div>

			<div className={styles.aliasRow}>
				<IconButton
					onBlur={() => {
						setAliasHover(false)
					}}
					onMouseEnter={() => {
						setAliasHover(true)
					}}
					onMouseLeave={() => {
						setAliasHover(false)
					}}
				>
					<IconStarFilled16 />
					{aliasHover && (
						<div className={styles.descriptionTag}>
							<Text>별칭</Text>
						</div>
					)}
				</IconButton>
				<Textbox
					placeholder="alias"
					value={localizationKeyValue?.alias ?? ''}
					// className={styles.inputText}
					onChange={(e) => {
						const next = {
							...localizationKeyValue,
							alias: e.currentTarget.value,
						} as LocalizationKey
						localizationKeySignal.value = next
					}}
				></Textbox>
				<button
					className={styles.dangerButton}
					onClick={() => {
						const body = {} as PutLocalizationKeyType
						if (localizationKeyValue?.alias != null) {
							body.alias = localizationKeyValue.alias
						}
						if (localizationKeyValue?.name != null) {
							body.name = localizationKeyValue.name
						}
						if (localizationKeyValue?.is_temporary != null) {
							body.isTemporary = localizationKeyValue.is_temporary
						}
						if (currentPointer?.sectionId && currentPointer.sectionId != null) {
							// DB에 등록된 섹션 아이디랑 현재 상위에 정의된 섹션 아이디가 달라질 수 있음
							// 그래서 수집함
							body.sectionId = currentPointer.sectionId.toString()
						}

						emit(PUT_LOCALIZATION_KEY.REQUEST_KEY, currentPointer?.data.localizationKey, body)
					}}
				>
					저장
				</button>
			</div>

			<div className={styles.labelRow}>
				<IconButton
					onClick={() => {
						const next = {
							...localizationKeyValue,
							is_temporary: false,
						} as LocalizationKey
						localizationKeySignal.value = next
					}}
					onBlur={() => {
						setLockHover(false)
					}}
					onMouseEnter={() => {
						setLockHover(true)
					}}
					onMouseLeave={() => {
						setLockHover(false)
					}}
				>
					{isTemporary(localizationKeyValue) ? <IconLockLocked16 /> : <IconLockUnlocked16 />}
					{lockHover && (
						<div className={styles.descriptionTag}>
							<Text>잠금</Text>
						</div>
					)}
				</IconButton>

				<Textbox
					placeholder="name"
					value={removeLeadingSymbols(localizationKeyValue?.name ?? '')}
					disabled={isTemporary(localizationKeyValue)}
					// className={styles.inputText}
					onChange={(e) => {
						const sectionPrefix = sectionNameParser(currentPointer?.sectionName ?? '') ?? ''
						// 입력값이 이미 sectionPrefix로 시작하는지 확인
						const finalPrefix = sectionPrefix === '' ? 'Default' : sectionPrefix

						const inputValue = e.currentTarget.value
						const finalValue = inputValue.startsWith(finalPrefix + '_') ? inputValue : finalPrefix + '_'

						const next = {
							...localizationKeyValue,
							name: finalValue,
						} as LocalizationKey
						localizationKeySignal.value = next
					}}
				></Textbox>
			</div>
			<Text className={styles.labelText}>* 잠긴 이름은 수정할 수 없습니다</Text>
			{/* {JSON.stringify(localizationKeyValue, null, 2)} */}

			<div>1. 검색 창을 준다 {'>'} 라벨링 + 번역 키 검색</div>
			<LabelSearch />
		</div>
	)
}
export default LabelPage
