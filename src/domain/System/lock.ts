import { GET_CURSOR_POSITION, PAGE_LOCK_KEY, SET_PAGE_LOCK_OPEN } from '../constant';
import { getCursorPosition } from '../Label/LabelModel';

import { emit, on } from '@create-figma-plugin/utilities';

export const getPageLockOpen = () => {
	const page = figma.currentPage;
	const pageLock = page.getPluginData(PAGE_LOCK_KEY) === 'true';
	if (pageLock) {
		return true;
	} else {
		return false;
	}
};

export const setPageLockOpen = async (lock: boolean) => {
	const page = figma.currentPage;
	page.setPluginData(PAGE_LOCK_KEY, JSON.stringify(lock));
	const currentNode = page.selection[0];
	const cursorPosition = await getCursorPosition(currentNode);
	emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition);
};

export const onSetPageLockOpen = () => {
	return on(SET_PAGE_LOCK_OPEN.REQUEST_KEY, (openStatus: boolean) => {
		setPageLockOpen(openStatus);
	});
};
