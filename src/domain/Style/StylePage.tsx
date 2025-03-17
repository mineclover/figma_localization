import { modalAlert } from '@/components/alert';

import { h } from 'preact';
import { useState } from 'preact/hooks';
import { languageCodesSignal, StyleData, styleDataSignal } from '@/model/signal';
import { domainSettingSignal } from '@/model/signal';

import { useSignal } from '@/hooks/useSignal';
import {
	Bold,
	Button,
	Container,
	Muted,
	Stack,
	Text,
	Textbox,
	TextboxMultiline,
	Toggle,
	VerticalSpace,
} from '@create-figma-plugin/ui';

import { DOWNLOAD_STYLE, SET_PAGE_LOCK_OPEN, SET_STYLE } from '../constant';
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
import { Suspense } from 'preact/compat';
import { styleResourceCache, styleToXml, xmlToStyle } from './styleAction';
import { safeJsonParse } from '../utils/getStore';
import { clc } from '@/components/modal/utils';

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
		<div className={styles.styleContainer}>
			<Text>
				name : {name} / id: {id}
			</Text>

			<div className={styles.rowContainer}>
				<Textbox
					value={styleValue}
					placeholder="style name here..."
					onChange={(e) => setStyleValue(e.currentTarget.value)}
				/>
				<button
					className={clc(styles.normalButton, styles.buttonOverride)}
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

	const currentPointer = useSignal(currentPointerSignal);

	return (
		<div>
			<VerticalSpace space="small" />
			<Text>{currentPointer?.data.localizationKey}: 피그마 저장 결과 미리보기:</Text>
			<VerticalSpace space="small" />
			<TextboxMultiline value={xmlString} placeholder="XML 출력" />
			<VerticalSpace space="small" />
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

	const pageLock = currentPointer?.pageLock ?? false;

	const targetArray = ['origin', ...languageCodes];
	const isStyle = currentPointer && currentPointer.data.originalLocalizeId !== '';
	const isKeySetting = currentPointer && currentPointer.data.localizationKey !== '';

	if (currentPointer && styleData && domainSetting && domainSetting.domainId) {
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
				{isStyle && isKeySetting ? (
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
				) : (
					<div className={styles.padding}>
						<Bold>스타일 키 없음</Bold>
					</div>
				)}
				{isKeySetting ? (
					<Button
						onClick={() => {
							emit(SET_STYLE.REQUEST_KEY);
						}}
					>
						Upload
					</Button>
				) : (
					<div className={styles.padding}>
						<Bold>로컬라이제이션 키 없음</Bold>
					</div>
				)}

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
