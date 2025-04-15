import { on } from '@create-figma-plugin/utilities';
import { MetaData, searchStore } from './searchStore';
import { generatePastelColors, hexToRGBA } from '@/utils/color';

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
};

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
			return node as FrameNode;
		}
	}
	return figma.createFrame();
};

const keySplit = (data: MetaData[]) => {
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
		 * 키 목록
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

const textOverlay = (
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

export const onRender = () => {
	on(RENDER_PAIR.RENDER_REQUEST, async (ignoreIds: string[] = []) => {
		const backgroundSize = getBackgroundSize(ignoreIds);

		const frame = getBackgroundFrame();
		const nodes = await searchStore.search();
		// 전체 스토어 초기화
		clearBackground(frame, nodes);

		const { hasKey, nullKey, keys } = keySplit(nodes);

		const optionColorMap = generatePastelColors(keys, 40);

		const { x, y, width, height } = backgroundSize;
		frame.x = x;
		frame.y = y;
		frame.resize(width, height);
		const paint = figma.util.solidPaint({ r: 0, g: 0, b: 0, a: 0.4 });

		frame.fills = [paint];

		frame.opacity = 0.7;
		frame.locked = true;
		frame.name = '##overlay';
		frame.setPluginData(BACKGROUND_SYMBOL.background, 'true');

		hasKey.forEach((item, index) => {
			// 시작 대상 포커스 해도 됨

			const node = textOverlay(item, optionColorMap, frame, { x, y });
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
			const node = textOverlay(item, optionColorMap, frame, { x, y });
		});
	});
};

export const onDisableRender = () => {
	on(DISABLE_RENDER_PAIR.DISABLE_RENDER_REQUEST, async () => {
		const frame = getBackgroundFrame();
		frame.remove();
	});
};
