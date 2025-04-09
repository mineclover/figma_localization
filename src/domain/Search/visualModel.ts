import { on } from '@create-figma-plugin/utilities';
import { MetaData, searchStore } from './searchStore';
import { generatePastelColors, hexToRGBA } from '@/utils/color';

export const RENDER_PAIR = {
	RENDER_REQUEST: 'RENDER_REQUEST',
	RENDER_RESPONSE: 'RENDER_RESPONSE',
};
export const BACKGROUND_SYMBOL = {
	background: 'IS_BACKGROUND',
	idStore: 'BACKGROUND_ID_STORE',
};

export const getBackgroundSize = () => {
	const nodes = figma.currentPage.children;
	const padding = 100;

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
			if (node.getPluginData(BACKGROUND_SYMBOL.background) === 'true') {
				return node as FrameNode;
			}
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
		hasKey: hasKey.hasKey,
		nullKey: hasKey.nullKey,
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
	const color = colorMap[localizationKey];
	const rgba = hexToRGBA(color);
	const paint = figma.util.solidPaint(rgba);
	node.fills = [paint];
	node.name = '#' + localizationKey + '/' + id;
	node.setPluginData(BACKGROUND_SYMBOL.background, 'true');
	frame.appendChild(node);
	node.setPluginData(BACKGROUND_SYMBOL.idStore, id);

	node.x = x - rootX - padding;
	node.y = y - rootY - padding;

	return node;
};

export const onRender = () => {
	on(RENDER_PAIR.RENDER_REQUEST, async () => {
		const backgroundSize = getBackgroundSize();

		const frame = getBackgroundFrame();
		const nodes = await searchStore.search();
		clearBackground(frame, nodes);

		const { hasKey, nullKey, keys } = keySplit(nodes);

		const optionColorMap = generatePastelColors(keys, 40);

		const { x, y, width, height } = backgroundSize;
		frame.x = x;
		frame.y = y;
		frame.resize(width, height);
		const paint = figma.util.solidPaint({ r: 1, g: 1, b: 1, a: 0.4 });
		frame.fills = [paint];

		frame.opacity = 0.7;
		frame.locked = true;
		frame.name = '##overlay';
		frame.setPluginData(BACKGROUND_SYMBOL.background, 'true');
		figma.viewport.scrollAndZoomIntoView([frame]);

		hasKey.forEach((item) => {
			textOverlay(item, optionColorMap, frame, { x, y });
		});
	});
};
