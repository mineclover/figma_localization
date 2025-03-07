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

import { CHANGE_LANGUAGE_CODE, GET_PROJECT_ID, RELOAD_NODE, SET_LANGUAGE_CODES, SET_PROJECT_ID } from '../constant'
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
import { createStyleSegments, groupSegmentsByStyle } from './styleModel'

// 있든 없든 수정 가능하게 구성

const StylePage = () => {
	const { data, loading, error, fetchData } = useFetch<LocalizationTranslationDTO[]>()

	/** 도메인에 설정된 리스트 */
	const languageCodes = useSignal(languageCodesSignal)

	const currentPointer = useSignal(currentPointerSignal)
	console.log('🚀 ~ TranslatePage ~ currentPointer:', currentPointer)

	const domainSetting = useSignal(domainSettingSignal)
	const localizationKeyValue = useSignal(localizationKeySignal)
	const targetArray = ['origin', ...languageCodes]

	if (currentPointer && currentPointer.styleData && currentPointer.characters && currentPointer.boundVariables) {
		const segments = createStyleSegments(currentPointer.characters, currentPointer.styleData)

		const styleGroups = groupSegmentsByStyle(segments)

		const boundVariables = createStyleSegments(currentPointer.characters, currentPointer.boundVariables)
		const boundVariablesGroups = groupSegmentsByStyle(boundVariables)
		console.log('🚀 ~ StylePage ~ segments:', segments, boundVariables)
		console.log('🚀 ~ StylePage ~ styleGroups:', styleGroups, boundVariablesGroups)

		return (
			<div>
				<Text>
					1. Group 의 갯수가 1개면 단일 스타일을 가지고 있는 것이다
					<br />- 이 경우 group 0 에서 전체 길이와 텍스트를 얻을 수 있다
				</Text>

				<Text>
					1. Group 의 갯수가 2개 이상일 경우 복합 스타일을 가지고 있는 것이다
					<br /> - 이 경우 defaultStyle 을 base로 group 별로 스타일을 정의할 수 있다
				</Text>

				{JSON.stringify(styleGroups)}
				{styleGroups.styleGroups.map((item) => {
					return <div>{JSON.stringify(item)}</div>
				})}
			</div>
		)
	}
}
export default StylePage
