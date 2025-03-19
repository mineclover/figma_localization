import { GET_STYLE_DATA } from '@/domain/constant';
import { on, emit } from '@create-figma-plugin/utilities';
import { StyleData, styleDataSignal } from '../signal';
import { getAllStyleRanges } from '@/figmaPluginUtils/text';

export const newGetStyleData = async (nodeId: string) => {
	const node = await figma.getNodeByIdAsync(nodeId);
	if (!node || node.type !== 'TEXT') {
		return null;
	}
	const { styleData, boundVariables, effectStyleData } = getAllStyleRanges(node);
	// emit(GET_STYLE_DATA.RESPONSE_KEY, { styleData, boundVariables });
	return { styleData, boundVariables, effectStyleData };
};

export const onGetStyleData = () => {
	on(GET_STYLE_DATA.REQUEST_KEY, async (nodeId?: string) => {
		if (!nodeId) {
			const node = figma.currentPage.selection[0];
			if (!node) {
				return;
			}
			nodeId = node.id;
		}

		const styleData = await newGetStyleData(nodeId);
		emit(GET_STYLE_DATA.RESPONSE_KEY, styleData);
	});
};

export const onGetStyleDataResponse = () => {
	emit(GET_STYLE_DATA.REQUEST_KEY);
	return on(GET_STYLE_DATA.RESPONSE_KEY, (styleData: StyleData) => {
		styleDataSignal.value = styleData;
	});
};
