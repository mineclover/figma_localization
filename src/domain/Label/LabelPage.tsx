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
import { useFetch } from '@/hooks/useFetch';
import {
	selectedPresetNameSignal,
	editPresetSignal,
	presetStoreSignal,
	autoCurrentNodesSignal,
	autoCurrentNodeStyleSignal as autoCurrentNodeBaseSignal,
	currentPointerSignal,
	inputKeySignal,
	apiKeySignal,
	patternMatchDataSignal,
	selectedKeySignal,
	selectIdsSignal,
	searchStoreLocationSignal,
	KeyIdNameSignal,
} from '@/model/signal';
import { useSignal } from '@/hooks/useSignal';
import { emit } from '@create-figma-plugin/utilities';
import {
	DISABLE_RENDER_PAIR,
	RENDER_PAIR,
	RENDER_TRIGGER,
	SAVE_ACTION,
	TRANSLATION_ACTION_PAIR,
	UPDATE_BASE_NODE,
} from '../constant';
import { modeStateSignal } from '@/model/signal';
import SimpleSelect, { nextBaseSignal } from '../Batch/SimpleSelect';
import { main } from '@/ai/example';
import { textRecommend } from '@/ai/textRecommend';
import { signal } from '@preact/signals-core';
import { TargetedEvent } from 'preact/compat';
import { useAsync } from '@/hooks/useAsync';
import { modalAlert } from '@/components/alert';
import { ProviderResponse } from '@/ai/provider';
import { updateKeyIds } from '../Search/searchModel';

type SelectKeyNameType = { id: string; name: string; type: 'normal' | 'ai' };

//  baseNode , key , action 으로 매칭 되야 함
/**
 * 단일 키 기준으로 변경할 선택지들을 제공하는 컴포넌트
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
	localizationKey,
	action,

	text,
	prefix,
}: {
	localizationKey: string;
	action: string;

	text: string;
	prefix: string;
}) => {
	console.log('🚀 ~ localizationKey:', localizationKey);
	// 로컬라이제이션 키에 저장 된 이름들
	//
	const keyNameStore = useSignal(KeyIdNameSignal);
	const patternMatchData = useSignal(patternMatchDataSignal);
	const selectIds = useSignal(selectIdsSignal);
	const apiKey = useSignal(apiKeySignal);
	const nextBase = useSignal(nextBaseSignal);

	const [selectName, setSelectName] = useState<string>('');
	const [selectKeyName, setSelectKeyName] = useState<SelectKeyNameType[]>([]);
	const baseNodeId = useSignal(autoCurrentNodeBaseSignal);

	const searchStoreLocation = useSignal(searchStoreLocationSignal);
	const selectLocation = searchStoreLocation.get(baseNodeId);
	const tempSelectKeyId = patternMatchData
		.filter((item) => selectIds.includes(item.id))
		.map((item) => item.localizationKey);
	// 중복 제거
	const selectKeyId = new Set(tempSelectKeyId);
	// useEffect(() => {
	// 	const settingName = keyNameStore[localizationKey];
	// 	console.log('🚀 ~ useEffect ~ settingName:', settingName);
	// 	setSelectName(settingName);
	// }, [keyNameStore]);

	// 선택된 객체에서의 키 아이디

	const { data, loading, error, executeAsync, hasMessage, setHasMessage } = useAsync<
		ProviderResponse<{
			variableName: string;
			normalizePoint: number;
		}>
	>();

	// 키 추천 모아서 바꿀 수 있게
	// ai 추천 키 이름을 선택지로 제공

	// 초기화할 때 상태 넣으면 비효율적이지 않나
	// 그런데 정확히 모든 연산이 끝난 후의 정보가 필요함

	// 변경되면 변경 반영
	useEffect(() => {
		///

		const settingName = keyNameStore[localizationKey];
		console.log('🚀 ~ useEffect ~ settingName:', settingName);
		// 선택된 키 이름
		setSelectName(settingName);

		// 표시 될 키 이름 관리
		const prevSelectKeyName = selectKeyName.filter((item) => item.type !== 'normal');
		const nextSelectKeyName = [] as SelectKeyNameType[];

		for (const item of selectKeyId) {
			const keyName = keyNameStore[item];

			nextSelectKeyName.push({
				id: item,
				name: keyName,
				type: 'normal',
			});
		}
		setSelectKeyName(() => [...prevSelectKeyName, ...nextSelectKeyName]);
		// keyNameStore 만 찍으면 전부 업데이트된 이후로 업데이트가 안됨
	}, [keyNameStore, localizationKey]);

	useEffect(() => {
		const prevSelectKeyName = selectKeyName.filter((item) => item.type !== 'ai');
		const nextSelectKeyName = [] as SelectKeyNameType[];

		if (data && !loading) {
			for (const item of data.data) {
				nextSelectKeyName.push({
					id: String(item.normalizePoint),
					name: item.variableName,
					type: 'ai',
				});
			}
		}
		setSelectKeyName([...prevSelectKeyName, ...nextSelectKeyName]);
	}, [loading, data]);

	// useEffect(() => {
	// 	// 키 이름 변경 시 추천 키 이름 제거
	// 	// 문제는
	// 	const prevSelectKeyName = selectKeyName.filter((item) => item.type !== 'ai');
	// 	setSelectKeyName([...prevSelectKeyName]);
	// }, [localizationKey]);

	// ai 루프까지를 기다렸다가 렌더링하는 것도 고려중임
	// 일단 localizationKey 변경 시점은 너무 이르다
	console.log('🚀 ~ KeyIds ~ normal count');
	// localizationKey 이 변경 되면 선택한 키에서 이름 전부 얻고,

	// 키 이름 업데이트 > 결국 selectKeyName 를 업데이트 하기 위함
	// 변경이 됬든 안됬든 이벤트는 발생함 즉 selectKeyName는 무조건 변함

	// 어짜피 선택이 변경되면 추천이 갱신되야됨

	return (
		<div className={styles.keyIds}>
			<span>{baseNodeId}</span>
			<span>{text}</span>
			<Button
				onClick={() => {
					if (apiKey) {
						executeAsync(textRecommend, apiKey, text, prefix);
					} else {
						modalAlert('api key 가 없습니다.');
					}
				}}
			>
				추천
			</Button>
			{loading && <p>Loading...5초</p>}
			{error && <p>Error: {error.message}</p>}
			{selectKeyName
				.sort((a, b) => {
					const typeCompare = b.type.localeCompare(a.type);
					if (typeCompare !== 0) return typeCompare;
					return a.id.localeCompare(b.id);
				})
				.map(({ id, name, type }) => {
					const ids = patternMatchData.filter((item) => item.localizationKey === id).map((item) => item.id);

					return (
						<button
							className={clc(styles.keyId, selectName === name && styles.keyMatch)}
							onClick={() => {
								setSelectName(name);

								console.log('>>', localizationKey, action, baseNodeId, prefix, name);
								// 선택한 다음 baseNodeId 선택 안했으면 = '' 올 수 있음
								const { nodeId: nextNodeId, pageId, projectId, baseNodeId: nextBaseNode } = nextBase;

								const isNextBase = nextBaseNode === baseNodeId;
								const nodeId = selectLocation?.node_id;
								console.log('🚀 ~ {selectKeyName.map ~ nodeId:', nextNodeId, nodeId);
								emit(TRANSLATION_ACTION_PAIR.REQUEST_KEY, {
									localizationKey,
									action,
									baseNodeId,
									prefix,
									name,
									targetNodeId: isNextBase ? nextNodeId : nodeId,
									beforeIds: ids,
								});
							}}
							// 원래 기능은 다중 선택 기능이였으나 이름 추천 후 선택 변경 , 및 저장으로 대체하려 함
						>
							{type === 'ai' ? '표준화 추천 ' : '#'}
							{id} : {name}
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
	/** 로케이션 검색 공유 */
	const searchStoreLocation = useSignal(searchStoreLocationSignal);
	const nextBase = useSignal(nextBaseSignal);
	const { baseNodeId, nodeId, pageId, projectId } = nextBase;

	console.log('🚀 ~ LabelPage ~ currentPointer:', currentPointer);

	const autoCurrentNodes = useSignal(autoCurrentNodesSignal);
	console.log('🚀 ~ LabelPage ~ autoCurrentNodes:', autoCurrentNodes);

	const autoCurrentBaseNode = useSignal(autoCurrentNodeBaseSignal);

	const selectLocation = searchStoreLocation.get(autoCurrentBaseNode);
	const selectNodeData = autoCurrentNodes.find((item) => item.id === selectLocation?.node_id);

	console.log('🚀 ~ LabelPage ~ 믹스 판단:', autoCurrentBaseNode);
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

			<span>선택할 수 있는 전체 키 목록</span>
			<KeyIds
				localizationKey={selectNodeData?.localizationKey ?? ''}
				action={'default'}
				text={selectNodeData?.text ?? ''}
				prefix="test"
			/>

			{/* <Button
					onClick={() => {
						emit(UPDATE_BASE_NODE.REQUEST_KEY, baseNodeId, { nodeId, pageId, projectId });
					}}
				>
					베이스만 적용
				</Button> */}
		</div>
	);
}
export default LabelPage;
