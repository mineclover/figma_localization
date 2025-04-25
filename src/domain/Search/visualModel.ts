import { emit, on } from '@create-figma-plugin/utilities';
import { getFrameNodeMetaData, MetaData, searchStore, setFrameNodeMetaData } from './searchStore';
import { nodeMetaData } from '../getState';
import { generatePastelColors, hexToRGBA } from '@/utils/color';

import {
	AUTO_SELECT_NODE_EMIT,
	AUTO_SELECT_STYLE_EMIT,
	BACKGROUND_STORE_KEY,
	DISABLE_RENDER_PAIR,
	NODE_STORE_KEY,
	RENDER_MODE_STATE,
	RENDER_PAIR,
	RENDER_TRIGGER,
	SAVE_ACTION,
	STORE_KEY,
} from '../constant';
import {
	autoCurrentNodesSignal,
	autoCurrentNodeStyleSignal,
	modeStateSignal,
	selectIdsSignal,
	StyleData,
} from '@/model/signal';
import { ActionType } from '../System/ActionResourceDTO';

import { LocalizationKeyDTO, LocationDTO, Preset, PresetStore } from '@/model/types';
import { safeJsonParse } from '../utils/getStore';
import { getDomainSetting } from '../Setting/SettingModel';
import { clientFetchDBCurry, fetchDB, pureFetch } from '../utils/fetchDB';
import { generateRandomText2 } from '@/utils/textTools';
import { baseIsAllNode, idsBaseAll } from '../Batch/batchModel';
import { newGetStyleData } from '@/model/on/GET_STYLE_DATA';
import { idSetLocation, setNodeLocation } from './locations';

// 데이터 전송은 비활성화 시 발생
// 인터렉션은 활성화 중에 발생
// 일단 인터렉션으로 데이터 변경을 전파하고 그 데이터가 클라이언트에 가고 그 데이터가 서버로 가는 것까지가 플로우
// 충분한 정보가 메인 프로세스에도 있으면 전파하지 않고 내부에서 서버로 보낸 후 해당 내용들을 전파 후 클라에도 업데이트
// 선택한 섹션 아이디는 뭐고, 액션은 뭐고, 로컬라이제이션 키는 뭐고, 위치 값은 뭐고, 스타일 키에 매핑되는 이름은 뭐고

export const autoSelectNodeEmit = async (nodes: MetaData[]) => {
	console.log('autoSelectNodeEmit 전송함', nodes);
	emit(AUTO_SELECT_NODE_EMIT.RESPONSE_KEY, nodes);

	const style = nodes.map((node) => node.baseNodeId);
	const styleSet = new Set(style);
	console.log('🚀 ~ autoSelectNodeEmit ~ styleSet:', styleSet);
	styleSet.delete(undefined);
	//@ts-ignore
	styleSet.delete(null);

	if (styleSet.size === 1) {
		console.log('🚀 ~ autoSelectNodeEmit ~ styleSet:', 0);
		const baseNodeId = styleSet.values().next().value!;
		// const style = await newGetStyleData(baseNodeId);
		// 스타일을 무조건 빼야할까? 안빼도 될 거 같은데
		// 대표 노드가 1개 또는 그 이상인게 식별되면 스타일이 별로 중요하지 않을 것 같다는 말임

		emit(AUTO_SELECT_STYLE_EMIT.RESPONSE_KEY, baseNodeId);
		console.log('🚀 ~ autoSelectNodeEmit ~ baseNodeId:', baseNodeId);
	} else if (styleSet.size > 1) {
		emit(AUTO_SELECT_STYLE_EMIT.RESPONSE_KEY, 'mixed');
		console.log('🚀 ~ autoSelectNodeEmit ~ styleSet:', 1);
	} else {
		emit(AUTO_SELECT_STYLE_EMIT.RESPONSE_KEY, 'none');
		console.log('🚀 ~ autoSelectNodeEmit ~ styleSet:', 2);
	}
};

export const nullSelectEmit = () => {
	emit(AUTO_SELECT_NODE_EMIT.RESPONSE_KEY, []);
	emit(AUTO_SELECT_STYLE_EMIT.RESPONSE_KEY, 'none');
};

export const onAutoSelectUI = () => {
	return on(AUTO_SELECT_NODE_EMIT.RESPONSE_KEY, (nodes: MetaData[]) => {
		selectIdsSignal.value = nodes.map((node) => node.id);
		autoCurrentNodesSignal.value = nodes;
	});
};
export const onAutoSelectStyleUI = () => {
	return on(AUTO_SELECT_STYLE_EMIT.RESPONSE_KEY, (style: string | 'mixed' | 'none') => {
		autoCurrentNodeStyleSignal.value = style;
	});
};

export const baseNodeCheck = (node: TextNode) => {
	const baseNodeId = node.getPluginData(NODE_STORE_KEY.LOCATION);

	return baseNodeId === node.id;
};

/**
 * 베이스 노드 전달
 * @param node 사라질 노드
 */
export const baseNodeEmit = (node: TextNode) => {};

/**
 * 배경 프레임 크기 계산
 * 랜더링 사이즈 얻으려고 해당 함수 사용
 */
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

/** 배경 프레임 조회 */
export const getBackgroundFrame = () => {
	const nodes = figma.currentPage.children;
	for (const node of nodes) {
		if (node.name === '##overlay') {
			//
			if (node.getPluginData(BACKGROUND_STORE_KEY.background) === 'true') {
				return node as FrameNode;
			}
		}
	}
};

/** 배경 프레임 조회 */
const initBackgroundFrame = () => {
	const nodes = figma.currentPage.children;
	for (const node of nodes) {
		if (node.name === '##overlay') {
			//
			if (node.getPluginData(BACKGROUND_STORE_KEY.background) === 'true') {
				return node as FrameNode;
			}
			// 있는데 플러그인 데이터가 없으면 삭제
			node.remove();
		}
	}
	return figma.createFrame();
};

/**
 * 배경 프레임 초기화 그냥 삭제하고 새로 만들어서 반환
 * 내부 프레임 없애야해서
 */
const removeBackgroundFrame = () => {
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
/** 내용 기준으로 모으기 */
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

/** 로컬라이제이션 키 존재 여부 기준으로 모으기 */
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

/** 배경 프레임 초기화
 * 인데 지금 안씀 , getBackgroundFrame 를 쓰지 않기 때문
 *  */
const clearBackground = (frame: FrameNode, data: MetaData[]) => {
	const nodes = frame.children;
	const idStore = data.map((item) => item.id);
	const idSet = new Set<string>(idStore);
	const { removeTarget, keepTarget } = nodes.reduce(
		(acc, node) => {
			const { id } = getFrameNodeMetaData(node as FrameNode) ?? {};
			if (id != null && idSet.has(id)) {
				acc.keepTarget.set(id, node as FrameNode);
			} else {
				acc.removeTarget.push(node as FrameNode);
			}
			return acc;
		},
		{
			removeTarget: [] as FrameNode[],
			keepTarget: new Map<string, FrameNode>(),
		}
	);
	for (const node of removeTarget) {
		node.remove();
	}
	return keepTarget;
};

/**
 * 로컬라이제이션 택스트 오버레이
 * 키 기준으로컬러 부여 된 map 값에서 색상 얻어서 오버레이
 */
const lzTextOverlay = (
	data: MetaData,

	colorMap: Record<string, string>,
	backgroundFrame: FrameNode,
	position: { x: number; y: number },

	/**
	 * ignoreIds로 영역 쪼개서 데이터 얻고 백그라운드 확인해서 기존에 데이터가 들어 있는
	 * 프레임 노드 목록
	 */
	keepTarget: Map<string, FrameNode>
) => {
	const padding = 10;
	const { x: rootX, y: rootY } = position;

	// width, height 어디감0
	// const { x, y, width, height, id ,localizationKey : oldLocalizationKey} = data;
	const { x, y, width, height, id } = data;
	// 프레임 노드 목록임 메타데이터는 컬러프레임을 알 수 없는 상태임
	// id가 텍스트 아이디 인지 뭔 아이디인지

	const node = keepTarget.get(id) ?? figma.createFrame();
	const test = getFrameNodeMetaData(node as FrameNode);
	const isSelected = figma.currentPage.selection.some((item) => item.id === node.id);
	const isSelected2 = figma.currentPage.selection.includes(node);
	if (test && isSelected) {
		data = test;
	}
	const { localizationKey } = data;

	if (width != null && height != null) {
		node.resize(width + padding * 2, height + padding * 2);
	}
	const color = colorMap[localizationKey] ?? '#ffffff';

	const rgba = hexToRGBA(color);
	const paint = figma.util.solidPaint(rgba);
	node.fills = [paint];
	node.name = '#' + localizationKey;
	setFrameNodeMetaData(node, data);
	node.setPluginData(BACKGROUND_STORE_KEY.background, 'true');
	backgroundFrame.appendChild(node);

	// node.blendMode = 'OVERLAY';
	node.blendMode = 'HARD_LIGHT';

	node.strokes = [figma.util.solidPaint({ r: 0, g: 0, b: 0 })];
	node.strokeWeight = 1;
	node.strokeMiterLimit = 10;
	node.strokeJoin = 'ROUND';
	node.strokeCap = 'ROUND';
	node.strokeAlign = 'CENTER';
	node.dashPattern = [2, 4];

	if (x != null && y != null) {
		node.x = x - rootX - padding;
		node.y = y - rootY - padding;
	}
	searchStore.setFrameStore(id, node);

	return node;
};

/** 랜덤 로컬라이제이션 키 생성
 * 중복 뜨면 해결을 위해 4번 시도
 */
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

/** null key에 대한 오버레이 처리를 위해 존재했었음
 * null 없어질 때까지 매핑하는 로직으로 변경되서 이제 안씀
 */
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

	if (width != null && height != null) {
		node.resize(width + padding * 2, height + padding * 2);
	}
	const color = colorMap[text] ?? '#ffffff';

	const rgba = hexToRGBA(color);
	const paint = figma.util.solidPaint(rgba);
	node.fills = [paint];
	node.name = '#' + text;
	node.setPluginData(BACKGROUND_STORE_KEY.background, 'true');
	frame.appendChild(node);

	// node.blendMode = 'OVERLAY';
	node.blendMode = 'HARD_LIGHT';

	node.strokes = [figma.util.solidPaint({ r: 0, g: 0, b: 0 })];
	node.strokeWeight = 1;
	node.strokeMiterLimit = 10;
	node.strokeJoin = 'ROUND';
	node.strokeCap = 'ROUND';
	node.strokeAlign = 'CENTER';
	node.dashPattern = [2, 4];

	if (x != null && y != null) {
		node.x = x - rootX - padding;
		node.y = y - rootY - padding;
	}

	return node;
};

/** 텍스트 기준으로 키 생성 및 등록 */
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

/**
 * 키 생성 후 모든 노드에 키 등록
 * null 만 처리된다는 단점
 */
export const textOriginRegister = async (data: Awaited<ReturnType<typeof textKeyRegister>>) => {
	console.log('🚀 ~ textOriginRegister ~ data:', data);
	// localizationKey 는 data의 키 값임
	// localizationKey 와 baseNodeId 가 없는 상태에서 들어옴
	const domain = getDomainSetting();

	if (domain == null || data == null) {
		return;
	}
	for (const [key, nodes] of Object.entries(data)) {
		// 키 등록
		// 누구를 기준으로 할거냐
		// 키만 등록하고 스타일 등록은 미루는 것도 방법임
		// 즉 베이스 노드를 일단 클리어하자는 얘긴데.. 지금 이 코드는 nullKey 에 대한 처리로 시작하고 있어서 baseNode를 잡는게 합리적이다고 생각되긴 함
		// 애초에 키가 없음 만약 baseNode를 잡고 싶으면
		// 근데 그 베이스 노드가 기준 노드고, 로컬라이제이션, 키, 액션 단위에서 한 개라고 가정되어있기 때문에 일단
		// baseNode 를 시각적으로 인지시킨 후 이에 대해 자동 생성 ok 일 때 자동 생성하는 로직으로 진행

		// 1. baseNodeId 가 아예 없을 수 있음

		// 첫번 째 : 그냥 아이디 값
		const firstBaseNode = nodes.find((node) => node.id)!;
		// 두번 째 : 있으면 잘 되는 것
		const nullableBaseNode = nodes.find((node) => node.baseNodeId != null);

		// 최적 값 : 인스턴스 노드가 아닌 텍스트 노드
		const secondBaseNode = nodes.find((node) => {
			const id = node.id;
			// 아이디는 있고 인스턴스 노드가 아닌 텍스트 노드
			if (id) {
				return !id.startsWith('I');
			}
			return false;
		});

		// base 노드 체크
		let baseCheck = false;
		let location: LocationDTO | undefined = undefined;
		let xNode: SceneNode | undefined = undefined;
		// 아이디 생성이 필요한지 확인
		//
		const needNullBaseNode = nullableBaseNode == null;

		// baseNode가 있으면 있는 기준 노드로 생성
		if (needNullBaseNode) {
			xNode = (await figma.getNodeByIdAsync(firstBaseNode.id)) as SceneNode;
			if (xNode) {
				location = await setNodeLocation(xNode as SceneNode);
				baseCheck = true;
			}
		} else if (secondBaseNode) {
			xNode = (await figma.getNodeByIdAsync(secondBaseNode.id)) as SceneNode;
			if (xNode) {
				location = await setNodeLocation(xNode as SceneNode);
				baseCheck = true;
			}
		}
		// 없으면 무작위 노드에서 찾아서 기준 노드로 설정
		else if (nullableBaseNode) {
			xNode = (await figma.getNodeByIdAsync(nullableBaseNode.id)) as SceneNode;
			if (xNode) {
				location = await setNodeLocation(xNode as SceneNode);
				baseCheck = true;
			}
		}
		// 로컬라이제이션 키가 없는게 맞는 걸 수도 있음
		// 로컬 기준이 정확하지 않을 수 있음
		// 항상 서버 기준으로 조회하는게 맞지 않냐는 말임
		// lz키가 있는 상황에서 베이스 노드를 조회해보고 위 로직을 처리하는게 맞지 않냐는 말임

		await idsBaseAll(
			{
				domainId: String(domain.domainId),
				keyId: key,
				ids: nodes.map((node) => node.id),
			},
			location
		);
	}
};

/** 반복해서 매핑하면서 nullKey를 완전히 제거 */
const autoKeyMapping = async (ignoreIds: string[], backgroundFrame: FrameNode, count: number = 0) => {
	const { metadata, searchNodes } = await searchStore.search(ignoreIds);

	// 전체 스토어 초기화하지 않음 > getBackgroundFrame 에서 없애고 시작하기 때문

	// 쓰려했는데... 생각해보면 텍스트노드와 프레임 노드의 발생 시점이 다름
	const keepTarget = clearBackground(backgroundFrame, metadata);
	// keepTarget 은 삭제되지 않은 프레임 노드
	// 메타데이터 기준  없는 데이터
	const { hasKey, nullKey, keys } = localizationKeySplit(metadata);
	// 메타데이터 기준 로컬라이제이션 키 없는 데이터
	const textMap = textSorter(nullKey);
	// 메타데이터 기준 로컬라이제이션 키 없는 데이터에 키 부여
	const textMapId = (await textKeyRegister(textMap)) ?? {};

	await textOriginRegister(textMapId);

	if (nullKey.length > 0 && count < 4) {
		return autoKeyMapping(ignoreIds, backgroundFrame, count + 1);
	}

	return {
		keys,
		/** 로컬라이제이션 키 있는 데이터 */
		hasKey,
		/** 로컬라이제이션 키 없는 데이터 */
		nullKey,
		/**
		 * frameId : Node 쌍
		 * ignoreIds로 영역 쪼개서 데이터 얻고 백그라운드 확인해서 기존에 데이터가 들어 있는
		 *  프레임 노드 목록 */
		keepTarget,
	};
};

/** 베이스 노드 표시 하이라이트 */
const baseNodeHighlight = (node: FrameNode) => {
	const redSolid = figma.util.solidPaint({ r: 1, g: 0, b: 0 });

	if (node) {
		node.dashPattern = [0];
		node.strokeWeight = 3;
		node.strokes = [redSolid];
	}
};
/** 회전을 위한 랜덤 회전 */
const getRandomNumber = () => {
	return Math.floor(Math.random() * 360) + 1;
};

export const isHideNode = (node: MetaData) => {
	if (node.x == null || node.y == null || node.width == null || node.height == null) {
		return true;
	}
	return false;
};

/**
 *
 * 오버레이 트리거가 들어올 때 실행될 렌더링 로직
 * 새로고침을 겸함
 */
export const overRayRender = async () => {
	const ignoreIds = ignoreSectionAll().map((node) => node.id);
	const backgroundSize = getBackgroundSize(ignoreIds);

	// 지우고 다시 생성하는거 너무 비효율적임
	// const frame = initBackgroundFrame();
	const backgroundFrame = initBackgroundFrame();
	backgroundFrame.name = '##overlay';
	backgroundFrame.setPluginData(BACKGROUND_STORE_KEY.background, 'true');
	// 여기서 베이스 노드도 탐색 됨
	const { hasKey, nullKey, keys, keepTarget } = await autoKeyMapping(ignoreIds, backgroundFrame);

	const optionColorMap = generatePastelColors(keys, 44);

	const { x, y, width, height } = backgroundSize;
	backgroundFrame.x = x;
	backgroundFrame.y = y;
	backgroundFrame.resize(width, height);
	const paint = figma.util.solidPaint({ r: 0, g: 0, b: 0, a: 1 });
	backgroundFrame.fills = [paint];
	backgroundFrame.opacity = 0.7;
	// frame.locked = true;

	const selected = figma.currentPage.selection;

	/**  기준 키가 있고  */
	const selectedIds = selected

		.map((item) => getFrameNodeMetaData(item as FrameNode)?.baseNodeId)
		.filter((item) => item != null);

	// const keepTarget = clearBackground(backgroundFrame, metadata);
	console.log('🚀 ~ overRayRender ~ selectedIds:', selectedIds);
	for (const item of hasKey) {
		if (isHideNode(item)) {
			// 설정 값이 없는 경우 무시 화면에 표시되지 않는 거임
			continue;
		}
		if (selectedIds.length === 0) {
			const node = lzTextOverlay(item, optionColorMap, backgroundFrame, { x, y }, keepTarget);
		} else if (selectedIds.length > 0) {
			const node = lzTextOverlay(item, optionColorMap, backgroundFrame, { x, y }, keepTarget);
			const metaData = getFrameNodeMetaData(node as FrameNode);
			const optionOpacity = metaData?.baseNodeId != null && selectedIds.includes(metaData?.baseNodeId) ? 1 : 0.3;
			node.opacity = optionOpacity;
		}
	}

	const baseNodeIds = Array.from(searchStore.baseNodeStore.keys());
	// 전체 조회

	const locations = await searchStore.getBaseLocation(baseNodeIds);
	console.log('🚀 ~ overRayRender ~ locations:', locations);

	for (const location of locations) {
		if (location) {
			const targetId = location?.node_id;
			if (targetId) {
				const targetNode = searchStore.textToFrameStore.get(targetId);

				if (targetNode) {
					console.log('🚀 ~ overRayRender ~ targetMetaData:', targetNode);

					baseNodeHighlight(targetNode);
				}
			}
		}
	}

	return hasKey;
};

/** 트리거 */
export const onRender = () => {
	on(RENDER_PAIR.RENDER_REQUEST, overRayRender);
};

/** 제거 */
export const onDisableRender = () => {
	on(DISABLE_RENDER_PAIR.DISABLE_RENDER_REQUEST, async () => {
		const frame = removeBackgroundFrame();
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
/** 제외할 섹션 모두 가져오기 */
export const ignoreSectionAll = () => {
	const nodes = figma.currentPage.children.filter((node) => {
		if (node.type === 'SECTION') {
			return sectionIgnoreCheck(node);
		}
		return false;
	});
	return nodes;
};

/** 제외할 섹션 모두 선택 후 스크롤 및 줌 */
const ignoreSectionAllSelect = () => {
	const nodes = ignoreSectionAll();
	figma.currentPage.selection = nodes;
	figma.viewport.scrollAndZoomIntoView(nodes);
	return nodes;
};

/** 제외 섹션에 대상 추가 */
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

/** 제외 섹션 토글 */
export const sectionIgnoreToggle = (sectionNode: SectionNode) => {
	if (sectionIgnoreCheck(sectionNode)) {
		removeSectionIgnore(sectionNode);
	} else {
		addSectionIgnore(sectionNode);
	}
};

/** 프리셋 옵션 메타 데이터 */
export type PresetMetaData = {
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
const setSectionAction = async (acceptAction: keyof typeof SAVE_ACTION, option: PresetMetaData) => {
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
		// 설계 의도를 모르겠음
		// baseNodeId: baseNodeId ?? figmaSectionIds[0],
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
	on(RENDER_TRIGGER.SAVE_ACCEPT, async (acceptAction: keyof typeof SAVE_ACTION, option: PresetMetaData) => {
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

	on(RENDER_TRIGGER.SAVE_ACTION, async (acceptAction: keyof typeof SAVE_ACTION, option: PresetMetaData) => {
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
