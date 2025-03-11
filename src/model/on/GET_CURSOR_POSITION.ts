import { emit, on } from '@create-figma-plugin/utilities';
import { GET_CURSOR_POSITION } from '../../domain/constant';
import { currentPointerSignal } from '../signal';
import { getCursorPosition } from '../../domain/Label/LabelModel';
import { CurrentCursorType } from '../types';

/**
 * 메인 프로세스에서 커서 위치 정보 조회 이벤트 처리
 */
export const onGetCursorPosition = () => {
	on(GET_CURSOR_POSITION.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0];
		const cursorPosition = await getCursorPosition(node);
		emit(GET_CURSOR_POSITION.RESPONSE_KEY, cursorPosition);
	});
};

/**
 * UI에서 커서 위치 정보 응답 수신 처리
 */
export const onGetCursorPositionResponse = () => {
	emit(GET_CURSOR_POSITION.REQUEST_KEY);
	return on(GET_CURSOR_POSITION.RESPONSE_KEY, (cursorPosition: CurrentCursorType) => {
		currentPointerSignal.value = cursorPosition;
	});
};
