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
import {
	Bold,
	Button,
	Container,
	Stack,
	Text,
	Textbox,
	TextboxMultiline,
	Toggle,
	VerticalSpace,
} from '@create-figma-plugin/ui'

import {
	CHANGE_LANGUAGE_CODE,
	DOWNLOAD_STYLE,
	GET_PROJECT_ID,
	RELOAD_NODE,
	SET_LANGUAGE_CODES,
	SET_NODE_LOCALIZATION_KEY_BATCH,
	SET_PROJECT_ID,
	SET_STYLE,
	UPDATE_NODE_LOCALIZATION_KEY_BATCH,
} from '../constant'
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

import { clientFetchDBCurry } from '../utils/fetchDB'
import { NullDisableText } from '../Label/LabelSearch'
import { clc } from '@/components/modal/utils'
import styles from '../Label/LabelPage.module.css'
import { createStyleSegments, groupAllSegmentsByStyle, groupSegmentsByStyle, StyleGroup } from './styleModel'
import { computed, signal } from '@preact/signals-core'
import { createStableStyleKey } from '@/utils/keyJson'
import { deepEqual } from '@/utils/data'
import { XMLParser } from 'fast-xml-parser'
import prettier from 'prettier'
import { ParseTextBlock, parseXML } from '@/utils/xml'

// 있든 없든 수정 가능하게 구성

export type StyleSync = {
	hashId: string
	name?: string
	id?: string
} & StyleGroup

export type StyleHashSegment = {
	total: number
	text: string

	id?: string
	hashId: string
	name?: string
	styles: Record<string, any>
}

export type Resource = {
	resource_id: number
	style_name: string
	style_value: string
	hash_value: string
	alias?: string
	is_deleted: boolean
	created_at: string
	updated_at: string
}

export type ResourceDTO = {
	resource_id: number
	style_name: string
	style_value: string
	hash_value: string
	alias?: string
	is_deleted: number
	created_at: string
	updated_at: string
}
export type ParsedResourceDTO = {
	resource_id: number
	style_name: string
	style_value: Record<string, any>
	hash_value: string
	alias?: string
	is_deleted: number
	created_at: string
	updated_at: string
}

const parseSame = (style: string, serverStyle: string) => {
	if (!style || !serverStyle) return false

	const styleValue = JSON.parse(style)
	const styleValue2 = JSON.parse(serverStyle)
	return deepEqual(styleValue, styleValue2)
}

export type StyleStore = Record<string, StyleSync>

export const styleSignal = signal<StyleStore>({})
export const styleTagModeSignal = signal<'name' | 'id'>('id')

const StyleItem = ({ style, hashId, name, id, ranges }: StyleSync) => {
	const { data, loading, error, fetchData } = useFetch<ResourceDTO>()

	useEffect(() => {
		// store 동시 실행 시 컨텍스트가 이전 컨텍스트여서 오류
		if (data) {
			const newId = data.resource_id.toString()
			const newAlias = data.alias
			const newName = data.style_name

			const store = { hashId, name: newName, id: newId, alias: newAlias, style, ranges }

			styleSignal.value = {
				...styleSignal.value,

				[hashId]: store,
			}
		}
	}, [data])

	useEffect(() => {
		fetchData('/resources', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				styleValue: JSON.stringify(style),
				hashValue: hashId,
			}),
		})
	}, [hashId])

	const isSame = parseSame(JSON.stringify(style), data?.style_value ?? '')

	return (
		<div className={styles.container} style={{ border: '1px solid red' }}>
			<Text>{hashId}</Text>
			<Text>name: {data?.style_name}</Text>
			<Text>id: {data?.resource_id}</Text>

			{isSame ? <Text>동일</Text> : <Text>다름</Text>}
		</div>
	)
}
export const generateXmlString = (styles: StyleSync[], tag: 'id' | 'name') => {
	// 모든 스타일 정보를 위치별로 정렬
	const allRanges: Array<StyleHashSegment> = []

	styles.forEach((style) => {
		if (style.ranges) {
			style.ranges.forEach((range) => {
				// 시작 태그 정보
				allRanges.push({
					id: style.id ?? '',
					name: style.name ?? '',
					total: range.end + range.start,
					text: range.text,
					hashId: style.hashId,
					styles: style.style,
				})
			})
		}
	})

	// 위치에 따라 정렬 (시작 위치가 같으면 닫는 태그가 먼저 오도록)
	allRanges.sort((a, b) => {
		return a.total - b.total
	})

	return allRanges
		.map((item) => {
			return `<${item[tag]}>${item.text}</${item[tag]}>`
		})
		.join('')
}

export const StyleXml = ({ text, styleInfo }: { text: string; styleInfo: StyleSync[] }) => {
	const [xml, setXml] = useState<string>('')
	/**
	 * {
	 * 11: {
	 * 		#text: 'string'
	 * 	}
	 * ...
	 * }[]
	 */
	const [parsedData, setParsedData] = useState<ParseTextBlock[]>([])

	const styleStore = useSignal(styleSignal)
	const styleTagMode = useSignal(styleTagModeSignal)
	const styleValues = computed(() => {
		return Object.values(styleStore)
	})

	useEffect(() => {
		try {
			// XML 파싱

			const parsedDataArr = parseXML(xml)
			/** 텍스트 출력 */
			// const removeTag = parsedDataArr.map((item) => {
			// 	const key = Object.keys(item)[0]
			// 	const target = item[key]
			// 	const value = target[0]
			// 	// 이걸 하면 순서가 깨짐
			// 	return {
			// 		[key]: value['#text'],
			// 	}
			// })
			setParsedData(parsedDataArr)
		} catch (error) {
			console.error('XML 처리 중 오류:', error)
		}
	}, [xml])

	useEffect(() => {
		// XML 형식의 문자열 생성 함수

		// 함수 실행하여 XML 생성

		if (typeof text === 'string' && styleValues.value.length > 0) {
			const xmlString = generateXmlString(styleValues.value, styleTagMode)

			setXml(xmlString)
		}
	}, [text, styleValues.value, styleTagMode])
	return (
		<div>
			<VerticalSpace space="small" />
			<Text>원본 XML:</Text>
			<TextboxMultiline value={xml} placeholder="XML 출력" />

			<VerticalSpace space="small" />
			<Text>파싱된 데이터:</Text>
			<Text>{parsedData ? JSON.stringify(parsedData, null, 2) : '데이터 없음'}</Text>

			<VerticalSpace space="small" />
			{styleInfo.map((item) => {
				return <StyleItem key={item.hashId} {...item} />
			})}
		</div>
	)
}

const StylePage = () => {
	/** 도메인에 설정된 리스트 */
	const languageCodes = useSignal(languageCodesSignal)
	const currentPointer = useSignal(currentPointerSignal)
	const styleTagMode = useSignal(styleTagModeSignal)

	const domainSetting = useSignal(domainSettingSignal)
	const localizationKeyValue = useSignal(localizationKeySignal)
	const targetArray = ['origin', ...languageCodes]

	const clientFetchDB = clientFetchDBCurry(2)

	useEffect(() => {
		styleSignal.value = {}
	}, [currentPointer])

	if (currentPointer && currentPointer.styleData && currentPointer.characters && currentPointer.boundVariables) {
		const segments = createStyleSegments(currentPointer.characters, currentPointer.styleData)
		const boundVariables = createStyleSegments(currentPointer.characters, currentPointer.boundVariables)
		const allStyleGroups = groupAllSegmentsByStyle(currentPointer.characters, segments, boundVariables)

		return (
			<div>
				<Text>키 : {currentPointer.data.localizationKey}</Text>
				<Button
					onClick={async () => {
						// 변경할 키가 없으면 추가하고
						const randomId = Math.random().toString(36).substring(2, 15)
						const result = await clientFetchDB('/localization/keys', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								domainId: 2,
								name: randomId,
								isTemporary: true,
							}),
						})

						const resultData = await result.json()

						if (resultData) {
							emit(SET_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY, {
								domainId: resultData.domain_id,
								keyId: resultData.key_id,
								ids: [currentPointer.nodeId],
							})
						}
					}}
					secondary
				>
					추가
				</Button>
				<Button
					onClick={() => {
						emit(DOWNLOAD_STYLE.REQUEST_KEY, {
							localizationKey: currentPointer.data.localizationKey,
						})
					}}
				>
					키 있는 상태에서 origin 스타일 받는 테스트
				</Button>
				<Button
					onClick={() => {
						emit(SET_STYLE.REQUEST_KEY)
					}}
				>
					키 있는 상태에서 추가 테스트
				</Button>
				<Toggle
					value={styleTagMode === 'id'}
					onChange={() => {
						styleTagModeSignal.value = styleTagMode === 'id' ? 'name' : 'id'
					}}
				>
					name, id 태그 선택
				</Toggle>
				<Text>
					1. Group 의 갯수가 1개면 단일 스타일을 가지고 있는 것이다
					<br />- 이 경우 group 0 에서 전체 길이와 텍스트를 얻을 수 있다
				</Text>

				<Text>
					1. Group 의 갯수가 2개 이상일 경우 복합 스타일을 가지고 있는 것이다
					<br /> - 이 경우 defaultStyle 을 base로 group 별로 스타일을 정의할 수 있다
				</Text>

				<StyleXml text={currentPointer.characters} styleInfo={allStyleGroups.exportStyleGroups} />
				<Button
					onClick={() => {
						emit(SET_STYLE.REQUEST_KEY)
					}}
				>
					aasf
				</Button>
			</div>
		)
	}
}
export default StylePage
