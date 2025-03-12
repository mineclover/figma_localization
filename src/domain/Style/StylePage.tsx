import { modalAlert } from '@/components/alert';
import { addLayer } from '@/components/modal/Modal';
import { useFetch } from '@/hooks/useFetch';
import { ComponentChildren, Fragment, h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { components } from 'types/i18n';
import { onGetDomainSettingResponse, onGetLanguageCodesResponse } from '../Setting/SettingModel';
import { languageCodesSignal, StyleData, styleDataSignal } from '@/model/signal';
import { domainSettingSignal } from '@/model/signal';

import { useSignal } from '@/hooks/useSignal';
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
} from '@create-figma-plugin/ui';

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
} from '../constant';
import { emit } from '@create-figma-plugin/utilities';
import { onGetCursorPositionResponse, onSetProjectIdResponse } from '../Label/LabelModel';
import { projectIdSignal, styleSignal, styleTagModeSignal } from '@/model/signal';
import { currentPointerSignal } from '@/model/signal';

import { clientFetchDBCurry } from '../utils/fetchDB';
import { NullDisableText } from '../Label/LabelSearch';
import { clc } from '@/components/modal/utils';
import styles from '../Label/LabelPage.module.css';
import { groupSegmentsByStyle } from './styleModel';
import { computed } from '@preact/signals-core';
import { createStableStyleKey } from '@/utils/keyJson';
import { deepEqual } from '@/utils/data';
import { XMLParser } from 'fast-xml-parser';
import prettier from 'prettier';
import { ParseTextBlock, parseXML } from '@/utils/xml';
import { localizationKeySignal } from '@/model/signal';
import { StyleSync, ResourceDTO, StyleHashSegment, StyleSegmentsResult } from '@/model/types';
import { App, ErrorBoundary, ResourceProvider } from './suspense';
import { Suspense } from 'preact/compat';
import { styleToXml } from './styleAction';

const parseSame = (style: string, serverStyle: string) => {
	if (!style || !serverStyle) return false;

	const styleValue = JSON.parse(style);
	const styleValue2 = JSON.parse(serverStyle);
	return deepEqual(styleValue, styleValue2);
};

const StyleItem = ({ style, hashId, name, id, ranges, ...props }: StyleSync) => {
	console.table({ style, hashId, name, id, ranges, ...props });

	// const isSame = parseSame(JSON.stringify(style), data?.style_value ?? '');

	return (
		<div className={styles.container} style={{ border: '1px solid red' }}>
			<Text>{hashId}</Text>
			<Text>name: {name}</Text>
			<Text>id: {id}</Text>
		</div>
	);
};
export const generateXmlString = (styles: StyleSync[], tag: 'id' | 'name') => {
	// 모든 스타일 정보를 위치별로 정렬
	const allRanges: Array<StyleHashSegment> = [];

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
				});
			});
		}
	});

	// 위치에 따라 정렬 (시작 위치가 같으면 닫는 태그가 먼저 오도록)
	allRanges.sort((a, b) => {
		return a.total - b.total;
	});

	return allRanges
		.map((item) => {
			return `<${item[tag]}>${item.text}</${item[tag]}>`;
		})
		.join('');
};

export const StyleXml = ({
	resource,
}: {
	resource: {
		read: () => {
			xmlString: string;
			styleStoreArray: StyleSync[];
		};
	};
}) => {
	const { xmlString, styleStoreArray: styleValues } = resource.read();

	/**
	 * {
	 * 11: {
	 * 		#text: 'string'
	 * 	}
	 * ...
	 * }[]
	 */
	const [parsedData, setParsedData] = useState<ParseTextBlock[]>([]);

	const styleTagMode = useSignal(styleTagModeSignal);

	useEffect(() => {
		try {
			// XML 파싱
			const parsedDataArr = parseXML(xmlString);

			setParsedData(parsedDataArr);
		} catch (error) {
			console.error('XML 처리 중 오류:', error);
		}
	}, [xmlString]);

	return (
		<div>
			<VerticalSpace space="small" />
			<Text>원본 XML:</Text>
			<TextboxMultiline value={xmlString} placeholder="XML 출력" />

			<VerticalSpace space="small" />
			<Text>파싱된 데이터:</Text>
			<Text>{parsedData ? JSON.stringify(parsedData, null, 2) : '데이터 없음'}</Text>

			<VerticalSpace space="small" />
			{styleValues.map((item) => {
				return <StyleItem key={item.hashId} {...item} />;
			})}
		</div>
	);
};

const StylePage = () => {
	/** 도메인에 설정된 리스트 */
	const languageCodes = useSignal(languageCodesSignal);
	const currentPointer = useSignal(currentPointerSignal);
	const styleTagMode = useSignal(styleTagModeSignal);
	const styleData = useSignal(styleDataSignal);

	const domainSetting = useSignal(domainSettingSignal);
	const localizationKeyValue = useSignal(localizationKeySignal);
	const targetArray = ['origin', ...languageCodes];

	if (currentPointer && styleData && domainSetting && domainSetting.domainId) {
		const clientFetchDB = clientFetchDBCurry(domainSetting.domainId);

		return (
			<div>
				<Text>키 : {currentPointer.data.localizationKey}</Text>
				<Button
					onClick={async () => {
						// 변경할 키가 없으면 추가하고
						const randomId = Math.random().toString(36).substring(2, 15);
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
						});

						const resultData = await result.json();

						if (resultData) {
							emit(SET_NODE_LOCALIZATION_KEY_BATCH.REQUEST_KEY, {
								domainId: resultData.domain_id,
								keyId: resultData.key_id,
								ids: [currentPointer.nodeId],
							});
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
						});
					}}
				>
					키 있는 상태에서 origin 스타일 받는 테스트
				</Button>
				<Button
					onClick={() => {
						emit(SET_STYLE.REQUEST_KEY);
					}}
				>
					키 있는 상태에서 추가 테스트
				</Button>
				<Toggle
					value={styleTagMode === 'id'}
					onChange={() => {
						styleTagModeSignal.value = styleTagMode === 'id' ? 'name' : 'id';
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
				<VerticalSpace space="small" />
				<Text>{(domainSetting.domainId, currentPointer.characters, styleData)}</Text>

				<ErrorBoundary>
					<ResourceProvider
						fetchFn={({
							domainId,
							characters,
							StyleDataArr,
							mode,
						}: {
							domainId: number;
							characters: string;
							StyleDataArr: StyleData;
							mode: 'id' | 'name';
						}) => {
							return styleToXml(domainId, characters, StyleDataArr, mode);
						}}
						domainId={domainSetting.domainId}
						characters={currentPointer.characters}
						StyleDataArr={styleData}
						mode={styleTagMode}
					>
						{(resource) => {
							return (
								<Suspense fallback={<div className="loading">데이터를 불러오는 중...</div>}>
									<StyleXml resource={resource} />
								</Suspense>
							);
						}}
					</ResourceProvider>
				</ErrorBoundary>

				<Button
					onClick={() => {
						emit(SET_STYLE.REQUEST_KEY);
					}}
				>
					aasf
				</Button>
			</div>
		);
	}
};
export default StylePage;
