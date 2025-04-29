import { h } from 'preact';
import styles from './Label.module.css';
import {
	Bold,
	Button,
	IconActionChangeSmall24,
	IconBooleanSubtract24,
	IconBooleanUnion24,
	IconButton,
	IconChevronDownLarge24,
	IconDropShadowMidSmall24,
	IconEyeSmall24,
	IconHiddenSmall24,
	IconInsert24,
	Textbox,
} from '@create-figma-plugin/ui';
import { clc } from '@/components/modal/utils';
import { useEffect, useState } from 'preact/hooks';

import {
	selectedPresetNameSignal,
	editPresetSignal,
	presetStoreSignal,
	autoCurrentNodesSignal,
	autoCurrentNodeStyleSignal,
	currentPointerSignal,
	inputKeySignal,
	apiKeySignal,
	patternMatchDataSignal,
	selectedKeySignal,
	selectIdsSignal,
} from '@/model/signal';
import { useSignal } from '@/hooks/useSignal';
import { emit } from '@create-figma-plugin/utilities';
import { DISABLE_RENDER_PAIR, RENDER_PAIR, RENDER_TRIGGER, SAVE_ACTION, UPDATE_BASE_NODE } from '../constant';
import { modeStateSignal } from '@/model/signal';
import SimpleSelect, { nextBaseSignal } from '../Batch/SimpleSelect';
import { main } from '@/ai/example';
import { textRecommend } from '@/ai/textRecommend';
import { signal } from '@preact/signals-core';
import { TargetedEvent } from 'preact/compat';
import { clientFetchDBCurry } from '../utils/fetchDB';

const KeyIdNameSignal = signal<Record<string, string>>({});

const clientFetch = clientFetchDBCurry();

const updateKeyIds = async (keyIds: string[]) => {
	const oldKeyNames = KeyIdNameSignal.value;

	const data = await clientFetch('/localization/keys/names-by-ids', {
		method: 'POST',
		body: JSON.stringify({
			ids: keyIds,
		}),
	});

	const newKeyNames = (await data.json()) as Record<string, string>;

	KeyIdNameSignal.value = { ...oldKeyNames, ...newKeyNames };
};

/**
 * 단일 키 기준으로 변경할 선택지들을 제공하고
 * 입력으로 추가하거나
 * 추천 받은 것에서 선택하거나
 * 새로운 공간에서 새로운 key를 새로 부여해야할 때 문제가 있음
 * 의미적으로 완전히 같은데 피그마에서 완전히 새로 생겨났을 때 완전히 새로운 키로 생성되는 문제 임
 * 이는 검색을 통해 똑같은 텍스트가 있으면 그 키를 추가하는 식으로 동기화하는 방법이 있긴 함
 * 섹션이 없으면 그다지 유효하지 않음
 * 섹션이 있으면 충분히 유효함
 * 키에는 기존에 포함된 로케이션 키 이름이 있을 수 있음
 *
 */
const KeyIds = ({
	keyIds,
	selectKey,
	searchHandler,
}: {
	keyIds: string[];
	selectKey: string | null;
	searchHandler: (key: string) => void;
}) => {
	// 로컬라이제이션 키에 저장 된 이름들
	//
	const keyNameStore = useSignal(KeyIdNameSignal);
	const patternMatchData = useSignal(patternMatchDataSignal);
	const selectIds = useSignal(selectIdsSignal);

	const keyName = keyIds.map((id) => {
		return [id, keyNameStore[id]];
	});

	useEffect(() => {
		const nullKeyIds = keyName.filter((item) => item[1] == null).map((item) => item[0]);
		if (nullKeyIds.length > 0) {
			updateKeyIds(nullKeyIds);
		}
	}, [keyIds]);

	return (
		<div className={styles.keyIds}>
			{keyName.map(([id, name]) => {
				const list = patternMatchData.filter((item) => item.localizationKey === id).map((item) => item.id);
				return (
					<button
						className={clc(styles.keyId, selectKey === id && styles.keyMatch)}
						onClick={() => {
							if (selectedKeySignal.value === id) {
								selectedKeySignal.value = null;
								searchHandler('');
							} else {
								selectedKeySignal.value = id;
								searchHandler(name);
							}
						}}
						// 원래 기능은 다중 선택 기능이였으나 이름 추천 후 선택 변경 , 및 저장으로 대체하려 함

						onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
							e.preventDefault(); // 기본 우클릭 메뉴 방지
							if (selectIds.some((item) => list.includes(item))) {
								const newList = new Set(selectIds.filter((item) => !list.includes(item)));
								selectIdsSignal.value = Array.from(newList);
							} else {
								const newList = new Set([...selectIds, ...list]);
								selectIdsSignal.value = Array.from(newList);
							}
						}}
					>
						#{id} : {name}
					</button>
				);
			})}
		</div>
	);
};

const Preset = () => {
	const [isOpen, setIsOpen] = useState(false);

	const editPreset = useSignal(editPresetSignal);
	const presetStore = useSignal(presetStoreSignal);
	const apiKey = useSignal(apiKeySignal);

	const presetNames = Object.keys(presetStore);

	return (
		<div className={styles.wrap}>
			<div className={styles.row}>
				<Bold>프리셋 선택</Bold>
				<Textbox
					placeholder="프리셋 이름 입력 가능"
					value={editPreset.name}
					onChange={(e) => {
						editPreset.name = e.currentTarget.value;
						editPresetSignal.value = editPreset;
					}}
					onKeyDown={async (e) => {
						if (e.key === 'Enter') {
							const inputValue = e.currentTarget.value;
							if (apiKey) {
								console.log('🚀 ~ onKeyDown={ ~ apiKey:', apiKey);

								const response = await textRecommend(apiKey, inputValue);
								console.log('🚀 ~ response:', response, 'home');
							}
						}
					}}
				/>
				<button className={clc(styles.iconButton, isOpen && styles.up)} onClick={() => setIsOpen(!isOpen)}>
					<IconChevronDownLarge24></IconChevronDownLarge24>
				</button>
			</div>
			{isOpen && (
				<div className={styles.wrap}>
					{presetNames.map((item) => {
						const preset = presetStore[item];
						return (
							<button className={styles.item}>
								{preset.name} : {preset.figmaSectionIds.join(',')}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};
// 활성화와 새로고침의 기능이 같음
// 선택 적용 옵션은 모든 저장에 적용할 수 있음
function LabelPage() {
	const preset = useSignal(editPresetSignal);
	const presetStore = useSignal(presetStoreSignal);
	const modeState = useSignal(modeStateSignal);
	const currentPointer = useSignal(currentPointerSignal);
	const nextBase = useSignal(nextBaseSignal);
	console.log('🚀 ~ LabelPage ~ currentPointer:', currentPointer);

	const autoCurrentNodes = useSignal(autoCurrentNodesSignal);
	console.log('🚀 ~ LabelPage ~ autoCurrentNodes:', autoCurrentNodes);
	const autoCurrentNodeStyle = useSignal(autoCurrentNodeStyleSignal);
	console.log('🚀 ~ LabelPage ~ 믹스 판단:', autoCurrentNodeStyle);

	return (
		<div className={styles.container}>
			<div className={styles.row}>
				<IconButton
					onClick={() => {
						emit(RENDER_PAIR.RENDER_REQUEST);
						// 오버레이 존재 여부를 모른다는 단점
					}}
				>
					<IconEyeSmall24></IconEyeSmall24>
				</IconButton>
				{/* 비활성화 */}
				<IconButton
					onClick={() => {
						emit(DISABLE_RENDER_PAIR.DISABLE_RENDER_REQUEST);
					}}
				>
					<IconHiddenSmall24 />
				</IconButton>
			</div>
			<p>대표 로케이션 아이디: {autoCurrentNodeStyle}</p>
			<Bold>섹션</Bold>
			<div className={styles.row}>
				<Button
					onClick={() => {
						emit(RENDER_TRIGGER.SECTION_SELECT);
					}}
				>
					제외된 섹션 선택
				</Button>
				<IconButton
					onClick={() => {
						// 더하기
						emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.INSERT, {
							localizationKey: 'insert',
							action: 'default, hover 등등',
							baseNodeId: 'test',
						});
					}}
				>
					<IconInsert24 />
				</IconButton>
				<IconButton
					onClick={() => {
						// 합집합
						emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.UNION, {
							localizationKey: 'union',
							action: 'default, hover 등등',
							baseNodeId: 'test',
						});
					}}
				>
					<IconBooleanUnion24 />
				</IconButton>
				<IconButton
					onClick={() => {
						// 차집합
						emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.SUBTRACT, {
							localizationKey: 'subtract',
							action: 'default, hover 등등',
							baseNodeId: 'test',
						});
					}}
				>
					<IconBooleanSubtract24 />
				</IconButton>
				{/* 활성화 */}
			</div>
			<Preset />
			<SimpleSelect />
			<span>{modeState}</span>

			<Bold>타겟 키 선택</Bold>
			<span>선택할 수 있는 전체 키 목록</span>

			<div className={styles.row}>
				<Bold>선택 적용 옵션</Bold>
			</div>
			<div className={styles.row}>
				<Bold>대표 노드 키 선택</Bold>
				<Button
					onClick={() => {
						const { baseNodeId, nodeId, pageId, projectId } = nextBase;

						emit(UPDATE_BASE_NODE.REQUEST_KEY, baseNodeId, { nodeId, pageId, projectId });
					}}
				>
					베이스 적용
				</Button>
			</div>
			<div className={styles.row}>
				<Button>저장</Button>
			</div>
		</div>
	);
}
export default LabelPage;
