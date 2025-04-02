import { modalAlert } from '@/components/alert';

import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { languageCodesSignal, StyleData, styleDataSignal } from '@/model/signal';
import { domainSettingSignal } from '@/model/signal';

import { useSignal } from '@/hooks/useSignal';
import {
	Bold,
	Button,
	Container,
	Dropdown,
	IconButton,
	IconLockLocked16,
	IconTarget16,
	IconTarget32,
	IconTrash32,
	Muted,
	Stack,
	Text,
	Textbox,
	TextboxMultiline,
	Toggle,
	VerticalSpace,
} from '@create-figma-plugin/ui';

import { DOWNLOAD_STYLE, SET_NODE_ACTION, SET_NODE_RESET_KEY, SET_PAGE_LOCK_OPEN, SET_STYLE } from '../constant';
import { emit } from '@create-figma-plugin/utilities';

import { styleTagModeSignal } from '@/model/signal';
import { currentPointerSignal } from '@/model/signal';

import { clientFetchDBCurry } from '../utils/fetchDB';

import styles from '../Label/LabelPage.module.css';

import { signal } from '@preact/signals-core';

import { deepEqual } from '@/utils/data';

import { isXmlCheck } from '@/utils/xml';
import { localizationKeySignal } from '@/model/signal';
import { StyleSync, StyleHashSegment } from '@/model/types';
import { ErrorBoundary, ResourceProvider } from './suspense';
import { Suspense, TargetedEvent } from 'preact/compat';
import { styleResourceCache, styleToXml, xmlToStyle } from './styleAction';
import { safeJsonParse } from '../utils/getStore';
import { clc } from '@/components/modal/utils';
import { removeLeadingSymbols } from '@/utils/textTools';
import { pageNodeZoomAction } from '@/figmaPluginUtils/utilAction';
import Tags, { tagsSignal } from './Tags';
import { replaceTagNames } from '@/utils/xml2';
import { ActionType, actionTypes } from '../System/ActionResourceDTO';

type CurrentMetadata = {
	nodeId?: string;
	name: string;
	localizationKey?: string;
	originalLocalizeId?: string;
	domainValid: boolean;
};

export const actionSignal = signal<ActionType>('default');

export const setActionSignal = (value: ActionType) => {
	actionSignal.value = value;
};

const MetadataBlock = ({ nodeId, name, localizationKey, originalLocalizeId, domainValid }: CurrentMetadata) => {
	const action = useSignal(actionSignal);
	const options = Object.entries(actionTypes).map(([key, value]) => ({ value: value }));

	const handleChange = (event: TargetedEvent<HTMLInputElement, Event>) => {
		// 위치 저장
		// 액션 값 저장
		//
		setActionSignal(event.currentTarget.value as ActionType);
	};

	return (
		<div className={styles.metadataContainer}>
			<VerticalSpace space="extraSmall" />
			<div className={styles.labelRow}>
				<Text>{name}</Text>
				<Muted>#{localizationKey}</Muted>
				<IconButton
					onClick={() => {
						if (nodeId) {
							emit(SET_NODE_RESET_KEY.REQUEST_KEY);
						}
					}}
				>
					<IconTrash32 />
				</IconButton>
			</div>
			<div className={styles.labelRow}>
				<Dropdown
					onChange={handleChange}
					options={[{ value: '' }, ...options]}
					value={action}
					className={styles.action}
				/>
				<Text>선택 된 텍스트 : {nodeId}</Text>
				<IconButton
					onClick={() => {
						if (nodeId) {
							pageNodeZoomAction(nodeId);
						}
					}}
				>
					<IconTarget16></IconTarget16>
				</IconButton>
			</div>

			{domainValid ? null : <Text className={styles.dangerText}>도메인이 다름</Text>}
		</div>
	);
};

const parseSame = (style: string, serverStyle: string) => {
	if (!style || !serverStyle) return false;

	const styleValue = safeJsonParse(style);
	const styleValue2 = safeJsonParse(serverStyle);
	return deepEqual(styleValue, styleValue2);
};

const textStylesName = ['default', 'first', 'second', 'third', 'fourth', 'fifth'];

export const StyleXml = ({
	resource,
	focusUpdateCount,
}: {
	resource: {
		read: () => {
			xmlString: string;
			styleStoreArray: StyleSync[];
			effectStyle: Omit<StyleSync, 'ranges'> | null;
		};
	};
	focusUpdateCount: number;
}) => {
	const { xmlString, styleStoreArray: styleValues, effectStyle } = resource.read();

	// br로 할지 br로 할지 결정되지 않음
	// 안정적인 건 br긴 함
	const brString = xmlString.replace(/\n/g, '<br/>');
	const styleTagMode = useSignal(styleTagModeSignal);
	const currentPointer = useSignal(currentPointerSignal);
	const isKeySetting = currentPointer && currentPointer.data.localizationKey !== '';
	const action = useSignal(actionSignal);
	const [resultXml, setResultXml] = useState<string>(brString);
	const tags = useSignal<Record<string, string>>(tagsSignal);

	const changeXml = async () => {
		let result = brString;
		for (const [key, value] of Object.entries(tags)) {
			if (value !== '') {
				result = await replaceTagNames(result, key, value);
			}
		}
		setResultXml(result);
	};

	useEffect(() => {
		changeXml();
	}, [brString, tags]);

	return (
		<div>
			<VerticalSpace space="small" />
			<Text>{currentPointer?.data.localizationKey}: 피그마 저장 결과 미리보기:</Text>
			<VerticalSpace space="small" />
			<TextboxMultiline value={resultXml} placeholder="XML 출력" />
			<VerticalSpace space="small" />
			<div className={styles.rowContainer}>
				<Toggle
					value={styleTagMode === 'id'}
					onChange={() => {
						styleTagModeSignal.value = styleTagMode === 'id' ? 'name' : 'id';
					}}
				>
					<Text>
						아이디 표시
						<Muted> *off 시 이름 표시</Muted>
					</Text>
				</Toggle>

				<VerticalSpace space="small" />
				{/* 공백 */}
				<span className={styles.span}></span>
			</div>
			{/* 조회도 해야하고 변환도 해야하고 */}
			{/* <ResourceProvider fetchFn={} >
					{(resource) => (
						<Suspense fallback={<div className="loading">데이터를 불러오는 중...</div>}>
						
						</Suspense>
					)}
				</ResourceProvider> */}
			<Tags localizationKey={currentPointer?.data.localizationKey ?? ''} xmlString={brString} action={action} />

			{isKeySetting ? (
				<Button
					onClick={async () => {
						// 메타데이터 저장
						emit(SET_NODE_ACTION.REQUEST_KEY, {
							localizationKey: currentPointer?.data.localizationKey,
							action: action,
							domainId: currentPointer?.data.domainId,
						});
						const fetchClient = clientFetchDBCurry(currentPointer?.data.domainId);

						const fetchData2 = await fetchClient('/localization/translations', {
							method: 'PUT',
							body: JSON.stringify({
								keyId: currentPointer?.data.localizationKey,
								language: 'origin',
								translation: resultXml,
							}),
						});

						const data2 = await fetchData2.json();
						const fetchData = await fetchClient('/localization/actions/bulk', {
							method: 'POST',
							body: JSON.stringify({
								key_id: currentPointer?.data.localizationKey,
								action: action,
								mappings: tags,
							}),
						});
						const data = await fetchData.json();
						modalAlert(
							<div>
								<Text>{data.success ? '성공' : '실패'}</Text>
								<Text>{data.message}</Text>
							</div>
						);

						// 키, 액션, xml 로 저장
						// 키, 액션, 태그 이름, a,b 로 저장
					}}
				>
					Save
				</Button>
			) : (
				<div className={styles.padding}>
					<Bold>로컬라이제이션 키 없음</Bold>
				</div>
			)}
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

	// const localizationKeyValue = useSignal(localizationKeySignal);
	// const pageLock = currentPointer?.pageLock ?? false;

	const targetArray = ['origin', ...languageCodes];
	const action = useSignal(actionSignal);
	const isStyle = currentPointer;

	const currentMetadata = {
		nodeId: currentPointer?.nodeId,
		name: currentPointer?.nodeName ? removeLeadingSymbols(currentPointer?.nodeName) : '',
		localizationKey: currentPointer?.data.localizationKey,

		domainValid: currentPointer?.data.domainId == domainSetting?.domainId,
	};

	if (currentPointer && styleData && domainSetting && domainSetting.domainId) {
		return (
			<div>
				<MetadataBlock {...currentMetadata} />
				<VerticalSpace space="extraSmall" />
				<Toggle
					value={currentPointer?.pageLock ?? false}
					onChange={(e) => {
						emit(SET_PAGE_LOCK_OPEN.REQUEST_KEY, e.currentTarget.checked);
					}}
				>
					<Text>페이지 잠금</Text>
				</Toggle>

				<VerticalSpace space="small" />

				<div className={styles.container}>
					<Bold>다운로드 선택</Bold>
					<div className={styles.rowContainer}>
						{isStyle &&
							targetArray.map((item) => {
								return (
									<Button
										key={item}
										onClick={() => {
											emit(DOWNLOAD_STYLE.REQUEST_KEY, {
												localizationKey: currentPointer.data.localizationKey,
												lang: item,
											});
											focusUpdateCountSignal.value = focusUpdateCount + 1;
										}}
									>
										{item}
									</Button>
								);
							})}
					</div>
				</div>
				<VerticalSpace space="small" />

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
