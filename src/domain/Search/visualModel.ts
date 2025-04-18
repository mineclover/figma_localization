import { emit, on } from '@create-figma-plugin/utilities';
import { MetaData, searchStore } from './searchStore';
import { generatePastelColors, hexToRGBA } from '@/utils/color';

import { NODE_STORE_KEY, STORE_KEY } from '../constant';
import { modeStateSignal } from '@/model/signal';
import { ActionType } from '../System/ActionResourceDTO';
import { getNodeData } from '../Label/TextPluginDataModel';
import { LocalizationKeyDTO, Preset, PresetStore } from '@/model/types';
import { safeJsonParse } from '../utils/getStore';
import { getDomainSetting } from '../Setting/SettingModel';
import { clientFetchDBCurry, fetchDB, pureFetch } from '../utils/fetchDB';
import { generateRandomText2 } from '@/utils/textTools';
import { baseIsAllNode } from '../Batch/batchModel';

export const RENDER_PAIR = {
	RENDER_REQUEST: 'RENDER_REQUEST',
	RENDER_RESPONSE: 'RENDER_RESPONSE',
};

export const DISABLE_RENDER_PAIR = {
	DISABLE_RENDER_REQUEST: 'DISABLE_RENDER_REQUEST',
	DISABLE_RENDER_RESPONSE: 'DISABLE_RENDER_RESPONSE',
};

export const BACKGROUND_SYMBOL = {
	background: 'IS_BACKGROUND',
	idStore: 'BACKGROUND_ID_STORE',
};

export const RENDER_MODE_STATE = {
	/**
	 * 선택 된 걸로 오버라이드 개념만 있어서 없어도 될 듯하긴 하지만?
	 * 선택 시 바로바로 활성화 시켜주는 용도로 쓰려면 있는게 좋을지도?
	 */
	SECTION_SELECT: 'SECTION_SELECT_MODE',
	/**
	 * 멀티 키 선택 시 일관적이게 선택되는 모드
	 */
	MULTI_KEY_SELECT: 'MULTI_KEY_SELECT_MODE',
	/**
	 * 베이스 키 선택 시 하나만 선택 되게 하는 모드
	 */
	BASE_KEY_SELECT: 'BASE_KEY_SELECT_MODE',
};

/** 각 트리거는 다른 모드들을 비활성화하고 단일 대상을 활성화 하는데 사용된다 */
export const RENDER_TRIGGER = {
	SECTION_SELECT: 'SECTION_SELECT_ACCEPT',
	MULTI_KEY_SELECT: 'MULTI_KEY_SELECT_ACCEPT',
	BASE_KEY_SELECT: 'BASE_KEY_SELECT_ACCEPT',
	SAVE_ACCEPT: 'SAVE_ACCEPT',
	SAVE_ACTION: 'SAVE_ACTION',
};

/** 저장 액션 안하면 취소임 */
export const SAVE_ACTION = {
	/** 삽입 */
	INSERT: 'INSERT',
	/** 합집합 */
	UNION: 'UNION',
	/** 차집합 */
	SUBTRACT: 'SUBTRACT',
} as const;

// 데이터 전송은 비활성화 시 발생
// 인터렉션은 활성화 중에 발생
// 일단 인터렉션으로 데이터 변경을 전파하고 그 데이터가 클라이언트에 가고 그 데이터가 서버로 가는 것까지가 플로우
// 충분한 정보가 메인 프로세스에도 있으면 전파하지 않고 내부에서 서버로 보낸 후 해당 내용들을 전파 후 클라에도 업데이트
// 선택한 섹션 아이디는 뭐고, 액션은 뭐고, 로컬라이제이션 키는 뭐고, 위치 값은 뭐고, 스타일 키에 매핑되는 이름은 뭐고

export const getBackgroundSize = (ignoreIds: string[] = []) => {
	const filterNodes = figma.currentPage.children;
	const padding = 100;
	const nodes = filterNodes.filter((node) => !ignoreIds.includes(node.id));

	const minmax = nodes.reduce(
		(acc, node) => {
			if (node.name === '##overlay') {
				return acc;
			}
			if (node && 'absoluteBoundingBox' in node && node.absoluteBoundingBox) {
				const { x, y, width, height } = node.absoluteBoundingBox;
				return {
					x: Math.min(acc.x, x),
					y: Math.min(acc.y, y),
					right: Math.max(acc.right, x + width), // Store rightmost instead of width
					bottom: Math.max(acc.bottom, y + height), // Store bottommost instead of height
				};
			}
			return acc;
		},
		{ x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity }
	);

	// Calculate the actual dimensions with margin
	const actualWidth = minmax.right - minmax.x;
	const actualHeight = minmax.bottom - minmax.y;

	return {
		x: minmax.x - padding,
		y: minmax.y - padding,
		width: actualWidth + padding * 2,
		height: actualHeight + padding * 2,
	};
};

const getBackgroundFrame = () => {
	const nodes = figma.currentPage.children;
	for (const node of nodes) {
		if (node.name === '##overlay') {
			// 일단 이름만 맞아도 되게 하자
			// if (node.getPluginData(BACKGROUND_SYMBOL.background) === 'true') {
			// 	return node as FrameNode;
			// }
			node.remove();
		}
	}
	return figma.createFrame();
};
/** 텍스트 기준으로 정렬 */
const textSorter = (data: MetaData[]) => {
	return data.reduce(
		(acc, node) => {
			if (acc[node.text] == null) {
				acc[node.text] = [];
			}
			acc[node.text].push(node);
			return acc;
		},
		{} as Record<string, MetaData[]>
	);
};

const localizationKeySplit = (data: MetaData[]) => {
	const hasKey = data.reduce(
		(acc, node) => {
			if (node.localizationKey != '') {
				acc.hasKey.push(node);
				acc.keys.add(node.localizationKey);
			} else {
				acc.nullKey.push(node);
			}

			return acc;
		},
		{
			hasKey: [] as MetaData[],
			nullKey: [] as MetaData[],
			keys: new Set<string>(),
		}
	);
	return {
		/**
		 * 키 있는 데이터
		 */
		hasKey: hasKey.hasKey,
		/**
		 * 키 없는 데이터
		 */
		nullKey: hasKey.nullKey,
		/**
		 * 로컬라이제이션 키 목록
		 */
		keys: Array.from(hasKey.keys),
	};
};

const clearBackground = (frame: FrameNode, data: MetaData[]) => {
	const nodes = frame.children;
	const idStore = data.map((item) => item.id);
	const idSet = new Set(idStore);
	const removeTarget = nodes.filter((node) => idSet.has(node.getPluginData(BACKGROUND_SYMBOL.idStore)));
	for (const node of removeTarget) {
		node.remove();
	}
};

const lzTextOverlay = (
	data: MetaData,
	colorMap: Record<string, string>,
	frame: FrameNode,
	position: { x: number; y: number }
) => {
	const padding = 10;
	const { x: rootX, y: rootY } = position;

	const { x, y, width, height, localizationKey, id } = data;
	const node = figma.createFrame();

	node.resize(width + padding * 2, height + padding * 2);
	const color = colorMap[localizationKey] ?? '#ffffff';

	const rgba = hexToRGBA(color);
	const paint = figma.util.solidPaint(rgba);
	node.fills = [paint];
	node.name = '#' + localizationKey;
	node.setPluginData(BACKGROUND_SYMBOL.background, 'true');
	frame.appendChild(node);
	node.setPluginData(BACKGROUND_SYMBOL.idStore, id);
	// node.blendMode = 'OVERLAY';
	node.blendMode = 'HARD_LIGHT';

	node.strokes = [figma.util.solidPaint({ r: 0, g: 0, b: 0 })];
	node.strokeWeight = 1;
	node.strokeMiterLimit = 10;
	node.strokeJoin = 'ROUND';
	node.strokeCap = 'ROUND';
	node.strokeAlign = 'CENTER';
	node.dashPattern = [2, 4];

	node.x = x - rootX - padding;
	node.y = y - rootY - padding;

	return node;
};

export const randomLocalizationKeyGenerator = async (
	domainId: string | number,
	count: number = 0
): Promise<string | null> => {
	const key = generateRandomText2();
	const result = await pureFetch('/localization/keys', {
		method: 'POST',
		body: JSON.stringify({
			domainId: domainId,
			name: key,
		}),
	});
	if (result.ok) {
		const json = (await result.json()) as LocalizationKeyDTO;
		const key = json.key_id;
		return String(key);
	}
	if (count > 4) {
		console.log('4 try failed to register text key ::::', key);
		return null;
	}
	return randomLocalizationKeyGenerator(domainId, count + 1);
};

const textMatchOverlay = (
	data: MetaData,
	colorMap: Record<string, string>,
	frame: FrameNode,
	position: { x: number; y: number }
) => {
	const padding = 10;
	const { x: rootX, y: rootY } = position;

	const { x, y, width, height, text, id } = data;
	const node = figma.createFrame();

	node.resize(width + padding * 2, height + padding * 2);
	const color = colorMap[text] ?? '#ffffff';

	const rgba = hexToRGBA(color);
	const paint = figma.util.solidPaint(rgba);
	node.fills = [paint];
	node.name = '#' + text;
	node.setPluginData(BACKGROUND_SYMBOL.background, 'true');
	frame.appendChild(node);
	node.setPluginData(BACKGROUND_SYMBOL.idStore, id);
	// node.blendMode = 'OVERLAY';
	node.blendMode = 'HARD_LIGHT';

	node.strokes = [figma.util.solidPaint({ r: 0, g: 0, b: 0 })];
	node.strokeWeight = 1;
	node.strokeMiterLimit = 10;
	node.strokeJoin = 'ROUND';
	node.strokeCap = 'ROUND';
	node.strokeAlign = 'CENTER';
	node.dashPattern = [2, 4];

	node.x = x - rootX - padding;
	node.y = y - rootY - padding;

	return node;
};

/** 텍스트 기준으로 키 생성 */
export const textKeyRegister = async (data: Record<string, MetaData[]>) => {
	const domain = getDomainSetting();

	if (domain == null) {
		return;
	}

	const newData: Record<string, MetaData[]> = {};
	const textKeys = Object.keys(data);
	for (const textKey of textKeys) {
		const nodes = data[textKey];
		const result = await randomLocalizationKeyGenerator(domain.domainId);
		const key = result ?? 'null';
		newData[key] = nodes;
	}
	return newData;
};

/** 키 생성 후 모든 노드에 키 등록 */
export const textOriginRegister = async (data: Awaited<ReturnType<typeof textKeyRegister>>) => {
	const domain = getDomainSetting();
	if (domain == null || data == null) {
		return;
	}
	for (const [key, nodes] of Object.entries(data)) {
		// 키 등록
		// 누구를 기준으로 할거냐
		// 키만 등록하고 스타일 등록은 미루는 것도 방법임
		// 즉 베이스 노드를 일단 클리어하자는 얘긴데.. 지금 이 코드는 nullKey 에 대한 처리로 시작하고 있어서 baseNode를 잡는게 합리적이다고 생각되긴 함
		// 근데 그 베이스 노드가 기준 노드고, 로컬라이제이션, 키, 액션 단위에서 한 개라고 가정되어있기 때문에
		//

		await baseIsAllNode({
			domainId: String(domain.domainId),
			keyId: key,
			ids: nodes.map((node) => node.id),
		});
	}
};

export const onRender = () => {
	on(RENDER_PAIR.RENDER_REQUEST, async () => {
		const ignoreIds = ignoreSectionAll().map((node) => node.id);
		const backgroundSize = getBackgroundSize(ignoreIds);

		const frame = getBackgroundFrame();
		const nodes = await searchStore.search(ignoreIds);
		console.log('🚀 ~ on ~ nodes:', nodes);

		// 전체 스토어 초기화하지 않음 > getBackgroundFrame 에서 없애고 시작하기 때문
		// clearBackground(frame, nodes);

		const { hasKey, nullKey, keys } = localizationKeySplit(nodes);
		const textMap = textSorter(nullKey);
		const textMapId = (await textKeyRegister(textMap)) ?? {};

		// 키 등록 후 모든 노드에 키 등록 (baseNode 어디 갔음)
		await textOriginRegister(textMapId);
		const textKeys = Object.keys(textMapId);

		// const textColorMap = generatePastelColors(textKeys, 0, 40);

		const optionColorMap = generatePastelColors([...keys, ...textKeys], 40);

		const { x, y, width, height } = backgroundSize;
		frame.x = x;
		frame.y = y;
		frame.resize(width, height);
		const paint = figma.util.solidPaint({ r: 0, g: 0, b: 0, a: 0.4 });

		frame.fills = [paint];

		frame.opacity = 0.7;
		// frame.locked = true;
		frame.name = '##overlay';
		frame.setPluginData(BACKGROUND_SYMBOL.background, 'true');

		hasKey.forEach((item, index) => {
			// 시작 대상 포커스 해도 됨
			const node = lzTextOverlay(item, optionColorMap, frame, { x, y });
			// if (0 === index) {
			// 	figma.currentPage.selection = [node];
			// 	figma.viewport.scrollAndZoomIntoView([node]);
			// }
			// 마지막 대상 포커스 ?
			if (hasKey.length - 1 === index) {
				figma.currentPage.selection = [node];
				figma.viewport.scrollAndZoomIntoView([node]);
			}
		});
		nullKey.forEach((item) => {
			const node = textMatchOverlay(item, optionColorMap, frame, { x, y });
		});
	});
};

export const onDisableRender = () => {
	on(DISABLE_RENDER_PAIR.DISABLE_RENDER_REQUEST, async () => {
		const frame = getBackgroundFrame();
		frame.remove();
	});
};

/**
 * 앞에 _ 가 있거나 무시 상태가 있는지 확인
 * @param sectionNode
 * @returns
 */
const sectionIgnoreCheck = (sectionNode: SectionNode) => {
	const ignoreState = sectionNode.getPluginData(NODE_STORE_KEY.IGNORE) === 'true';
	const ignoreName = sectionNode.name.startsWith('_');

	const some = ignoreState || ignoreName;

	if (some) {
		return true;
	}
	return false;
};

// 이거 프리셋 붙여야됨
// 지금 구조는 .. 복제가 안됨
// 됨 => 지금 구조를 recent 로 취급
// 프리셋 어디에 저장하고 어디서 가져올 건지
// 어떻게 적용할꺼고 어떻게 딱 생명주기 동안만 가지고 있을건지
// 시각적인 직관성을 제공해줄 수 있는 건 맞음 그런데 그걸 언제 복원 시킬건지

export const NULL_STATE = '';
export const ignoreSectionAll = () => {
	const nodes = figma.currentPage.children.filter((node) => {
		if (node.type === 'SECTION') {
			return sectionIgnoreCheck(node);
		}
		return false;
	});
	return nodes;
};

const ignoreSectionAllSelect = () => {
	const nodes = ignoreSectionAll();
	figma.currentPage.selection = nodes;
	figma.viewport.scrollAndZoomIntoView(nodes);
	return nodes;
};

export const addSectionIgnore = (sectionNode: SectionNode) => {
	sectionNode.setPluginData(NODE_STORE_KEY.IGNORE, 'true');
	if (sectionIgnoreCheck(sectionNode)) {
		if (!sectionNode.name.startsWith('_')) {
			sectionNode.name = '_' + sectionNode.name;
		}
	} else {
		sectionNode.name = '_' + sectionNode.name;
	}

	const fill = figma.util.solidPaint('#FFD8D8');
	sectionNode.fills = [fill];
};

export const removeSectionIgnore = (sectionNode: SectionNode) => {
	sectionNode.setPluginData(NODE_STORE_KEY.IGNORE, '');
	sectionNode.name = sectionNode.name.replace(/^_*/, '');
	const fill = figma.util.solidPaint('#ffffff');
	sectionNode.fills = [fill];
};

export const sectionIgnoreToggle = (sectionNode: SectionNode) => {
	if (sectionIgnoreCheck(sectionNode)) {
		removeSectionIgnore(sectionNode);
	} else {
		addSectionIgnore(sectionNode);
	}
};

export type OptionMetaData = {
	/**
	 * 프리셋 이름
	 */
	name: string;
	/**
	 * 로컬라이제이션 키
	 * 텍스트 식별에 필요
	 */
	localizationKey: string;
	//
	/**
	 * 액션 타입
	 * 스타일 호출 영역 지정에 필요
	 */
	action: ActionType;

	/**
	 * 넣을지 말지 약간 고민 됨
	 * 최신 값이 아닐 수 있다
	 */
	baseNodeId: string;
	/**
	 * 프리셋이 인식할 서버 세션 아이디
	 */
	serverSectionId: string;
};

// 밖에서 유형으로 라우팅 하고 안에서 액션으로 라우팅 할 수 있음
// 선택되는 대상은 프레임이기 때문에 이 프레임이 참조하는 텍스트를 찾아서 수정해야 함
// 액션 타입에 따라 선택된 대상을 기존 대상에 더하거나 빼거나 교체하는 식으로 처리
// 더하거나 뺀다 라는 것은 해당 노드에 키를 추가하거나 제거하는 것을 의미
// 제거 할 경우 키 있는 노드만 제거 할 수 있도록 처리

/** 새로 작성된 프리셋 정보를 store에 저장 */
const newPreset = (name: string, baseNodeId: string, serverSectionId: string) => {
	const preset = presetSave(name, baseNodeId, serverSectionId);
	const allPresets = figma.currentPage.getPluginData(STORE_KEY.PRESET);
	const presetList = safeJsonParse<PresetStore>(allPresets) ?? {};
	if (serverSectionId === '') {
		presetList['recent'] = preset;
	} else {
		presetList[name] = preset;
	}
	figma.currentPage.setPluginData(STORE_KEY.PRESET, JSON.stringify(presetList));
};

/** section에 대한 액션 설정 */
const setSectionAction = async (acceptAction: keyof typeof SAVE_ACTION, option: OptionMetaData) => {
	// 섹션들이 선택될 거임
	const selectedNodes = figma.currentPage.selection.filter((node) => node.type === 'SECTION');

	console.log('🚀 ~ setSectionAction ~ selectedNodes:', selectedNodes);
	const { localizationKey, action, name, baseNodeId, serverSectionId } = option;
	// 찾아도 안나옴 섹션들이라서
	// 노드 파악

	if (acceptAction === SAVE_ACTION.INSERT) {
		const beforeNodes = ignoreSectionAll();
		for (const node of beforeNodes) {
			if (node.type === 'SECTION') {
				removeSectionIgnore(node);
			}
		}
		for (const node of selectedNodes) {
			addSectionIgnore(node);
		}
	} else if (acceptAction === SAVE_ACTION.UNION) {
		for (const node of selectedNodes) {
			addSectionIgnore(node);
		}
	} else if (acceptAction === SAVE_ACTION.SUBTRACT) {
		for (const node of selectedNodes) {
			removeSectionIgnore(node);
		}
	}

	newPreset(name, baseNodeId, serverSectionId);
};

/**
 * 프리셋 저장
 * baseNodeId 는 최초에 설정 값이 없거나
 * 서버
 */
export const presetSave = (name: string, baseNodeId?: string, serverSectionId?: string) => {
	const sections = ignoreSectionAll();
	const figmaSectionIds = sections.map((node) => node.id);

	const preset: Preset = {
		name,
		figmaSectionIds: figmaSectionIds,
		baseNodeId: baseNodeId ?? figmaSectionIds[0],
		serverSectionId: serverSectionId ?? '',
	};
	return preset;
};

/** 상태 전달 */
export const onSelectModeMain = () => {
	on(RENDER_TRIGGER.SECTION_SELECT, async () => {
		const allIgnores = ignoreSectionAll();
		figma.currentPage.selection = allIgnores;
		figma.currentPage.setPluginData(STORE_KEY.SELECT_MODE, RENDER_MODE_STATE.SECTION_SELECT);
		emit(RENDER_TRIGGER.SECTION_SELECT, RENDER_MODE_STATE.SECTION_SELECT);
	});
	on(RENDER_TRIGGER.MULTI_KEY_SELECT, async () => {
		figma.currentPage.selection = [];
		figma.currentPage.setPluginData(STORE_KEY.SELECT_MODE, RENDER_MODE_STATE.MULTI_KEY_SELECT);
		emit(RENDER_TRIGGER.MULTI_KEY_SELECT, RENDER_MODE_STATE.MULTI_KEY_SELECT);
	});
	on(RENDER_TRIGGER.BASE_KEY_SELECT, async () => {
		figma.currentPage.selection = [];
		figma.currentPage.setPluginData(STORE_KEY.SELECT_MODE, RENDER_MODE_STATE.BASE_KEY_SELECT);
		emit(RENDER_TRIGGER.BASE_KEY_SELECT, RENDER_MODE_STATE.BASE_KEY_SELECT);
	});
	// 대부분의 트리거는 모드 전환할 때 단일 키로 쓰는데
	on(RENDER_TRIGGER.SAVE_ACCEPT, async (acceptAction: keyof typeof SAVE_ACTION, option: OptionMetaData) => {
		figma.currentPage.selection = [];
		figma.currentPage.setPluginData(STORE_KEY.SELECT_MODE, NULL_STATE);
		const mode = figma.currentPage.getPluginData(STORE_KEY.SELECT_MODE);

		if (mode === NULL_STATE) {
			return;
		}
		if (mode === RENDER_MODE_STATE.SECTION_SELECT) {
			presetSave(option.name, option.baseNodeId, option.serverSectionId);
		}

		emit(RENDER_TRIGGER.SAVE_ACCEPT, NULL_STATE);
	});
	// 저장 액션은 모드 전환할 때 써서 옵션이 좀 많음

	on(RENDER_TRIGGER.SAVE_ACTION, async (acceptAction: keyof typeof SAVE_ACTION, option: OptionMetaData) => {
		console.log('🚀 ~ on ~ option:', option);
		console.log('🚀 ~ on ~ acceptAction:', acceptAction);
		const mode = figma.currentPage.getPluginData(STORE_KEY.SELECT_MODE);
		const onlySection = figma.currentPage.selection.every((node) => node.type === 'SECTION');
		console.log('🚀 ~ on ~ mode:', mode);
		if (mode === NULL_STATE) {
			// 만약 선택 대상이 섹션만 있는 상태라면 특정 행동을 원한 것을 유추할 수 있다
			if (onlySection) {
				setSectionAction(acceptAction, option);
			}
			return;
		}
		// 저장을 눌렀을 때 이미 선택된 노드가 있었으면
		if (mode === RENDER_MODE_STATE.SECTION_SELECT) {
			setSectionAction(acceptAction, option);
		}
		// 기존 모드 + 액션 조합으로 행동 결정
	});
};

/** 상태 전달  */
export const onSaveAccept = () => {
	emit(RENDER_TRIGGER.SAVE_ACCEPT, NULL_STATE);
	return on(RENDER_TRIGGER.SAVE_ACCEPT, async () => {
		console.log('🚀 ~ onSaveAccept ~ onSaveAccept:', NULL_STATE);
		modeStateSignal.value = NULL_STATE;
	});
};

export const onSectionSelect = () => {
	return on(RENDER_TRIGGER.SECTION_SELECT, async () => {
		console.log('🚀 ~ onSectionSelect ~ onSectionSelect:', RENDER_MODE_STATE.SECTION_SELECT);
		modeStateSignal.value = RENDER_MODE_STATE.SECTION_SELECT;
	});
};

export const onMultiKeySelect = () => {
	return on(RENDER_TRIGGER.MULTI_KEY_SELECT, async () => {
		console.log('🚀 ~ onMultiKeySelect ~ onMultiKeySelect:', RENDER_MODE_STATE.MULTI_KEY_SELECT);
		modeStateSignal.value = RENDER_MODE_STATE.MULTI_KEY_SELECT;
	});
};

export const onBaseKeySelect = () => {
	return on(RENDER_TRIGGER.BASE_KEY_SELECT, async () => {
		console.log('🚀 ~ onBaseKeySelect ~ onBaseKeySelect:', RENDER_MODE_STATE.BASE_KEY_SELECT);
		modeStateSignal.value = RENDER_MODE_STATE.BASE_KEY_SELECT;
	});
};
