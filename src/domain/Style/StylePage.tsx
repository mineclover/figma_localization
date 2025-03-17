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
	UPDATE_STYLE_DATA,
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
import { computed, signal } from '@preact/signals-core';
import { createStableStyleKey } from '@/utils/keyJson';
import { deepEqual } from '@/utils/data';
import { XMLParser } from 'fast-xml-parser';
import prettier from 'prettier';
import { isXmlCheck, parseTextBlock, ParseTextBlock, parseXML } from '@/utils/xml';
import { localizationKeySignal } from '@/model/signal';
import { StyleSync, ResourceDTO, StyleHashSegment, StyleSegmentsResult } from '@/model/types';
import { App, ErrorBoundary, ResourceProvider } from './suspense';
import { Suspense } from 'preact/compat';
import { styleResourceCache, styleToXml, xmlToStyle } from './styleAction';
import { safeJsonParse } from '../utils/getStore';

const parseSame = (style: string, serverStyle: string) => {
	if (!style || !serverStyle) return false;

	const styleValue = safeJsonParse(style);
	const styleValue2 = safeJsonParse(serverStyle);
	return deepEqual(styleValue, styleValue2);
};

const StyleItem = ({ style, hashId, name, id, ranges, ...props }: StyleSync) => {
	// const isSame = parseSame(JSON.stringify(style), data?.style_value ?? '');

	// 상위 노드에서 처리하므로 NotNull
	const domainSetting = useSignal(domainSettingSignal)!;
	const [styleValue, setStyleValue] = useState<string>(name ?? '');

	return (
		<div className={styles.container} style={{ border: '1px solid red' }}>
			<Text>{hashId}</Text>
			<Text>name: {name}</Text>
			<Text>id: {id}</Text>
			<Textbox
				value={styleValue}
				placeholder="style name here..."
				onChange={(e) => setStyleValue(e.currentTarget.value)}
			/>
			<button
				onClick={async () => {
					const fetchDB = clientFetchDBCurry(domainSetting.domainId);
					const result = await fetchDB(('/resources/' + id) as '/resources/{id}', {
						method: 'PUT',
						body: JSON.stringify({
							styleName: styleValue,
						}),
					});
					const resultData = await result.json();

					delete styleResourceCache[hashId];
					if (resultData) {
						modalAlert('수정 완료');
						setTimeout(() => {
							focusUpdateCountSignal.value = focusUpdateCountSignal.value + 1;
						}, 300);
					} else {
						modalAlert('수정 실패');
					}
				}}
			>
				save
			</button>
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
	focusUpdateCount,
}: {
	resource: {
		read: () => {
			xmlString: string;
			styleStoreArray: StyleSync[];
		};
	};
	focusUpdateCount: number;
}) => {
	const { xmlString, styleStoreArray: styleValues } = resource.read();

	const styleTagMode = useSignal(styleTagModeSignal);

	return (
		<div>
			<VerticalSpace space="small" />
			<Text>원본 XML:</Text>
			<TextboxMultiline value={xmlString} placeholder="XML 출력" />

			<VerticalSpace space="small" />

			<VerticalSpace space="small" />
			{styleValues.map((item) => {
				return <StyleItem key={item.hashId + item.name} {...item} />;
			})}
		</div>
	);
};

export const focusUpdateCountSignal = signal(0);

const StylePage = () => {
	/** 도메인에 설정된 리스트 */
	const languageCodes = useSignal(languageCodesSignal);
	const currentPointer = useSignal(currentPointerSignal);
	const styleTagMode = useSignal(styleTagModeSignal);
	const styleData = useSignal(styleDataSignal);
	const focusUpdateCount = useSignal(focusUpdateCountSignal);

	const domainSetting = useSignal(domainSettingSignal);
	const localizationKeyValue = useSignal(localizationKeySignal);
	const targetArray = ['origin', ...languageCodes];
	const isStyle = currentPointer && currentPointer.data.originalLocalizeId !== '';
	const isKeySetting = currentPointer && currentPointer.data.localizationKey !== '';

	if (currentPointer && styleData && domainSetting && domainSetting.domainId) {
		const clientFetchDB = clientFetchDBCurry(domainSetting.domainId);

		return (
			<div>
				{/* <Button
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
					랜덤으로 이름 추가
				</Button> */}

				{isStyle && isKeySetting && (
					<Button
						onClick={() => {
							emit(DOWNLOAD_STYLE.REQUEST_KEY, {
								localizationKey: currentPointer.data.localizationKey,
							});
							focusUpdateCountSignal.value = focusUpdateCount + 1;
						}}
					>
						Download
					</Button>
				)}
				{isKeySetting && (
					<Button
						onClick={() => {
							emit(SET_STYLE.REQUEST_KEY);
						}}
					>
						Update
					</Button>
				)}

				<Toggle
					value={styleTagMode === 'id'}
					onChange={() => {
						styleTagModeSignal.value = styleTagMode === 'id' ? 'name' : 'id';
					}}
				>
					name, id 태그 선택
				</Toggle>

				<VerticalSpace space="small" />
				<Text>{(domainSetting.domainId, currentPointer.characters, styleData)}</Text>

				<ErrorBoundary>
					<ResourceProvider
						fetchFn={async ({
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
							if (isXmlCheck(characters)) {
								return xmlToStyle(characters, domainId);
							} else {
								return styleToXml(domainId, characters, StyleDataArr, mode);
							}
						}}
						domainId={domainSetting.domainId}
						characters={currentPointer.characters}
						StyleDataArr={styleData}
						mode={styleTagMode}
						focusUpdateCount={focusUpdateCount}
					>
						{(resource) => {
							return (
								<Suspense fallback={<div className="loading">데이터를 불러오는 중...</div>}>
									<StyleXml resource={resource} focusUpdateCount={focusUpdateCount} />
								</Suspense>
							);
						}}
					</ResourceProvider>
				</ErrorBoundary>
			</div>
		);
	}
};
export default StylePage;
