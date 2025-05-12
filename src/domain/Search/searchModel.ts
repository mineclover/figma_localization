import { keyIdNameSignal, removeKeyIdsSignal } from '@/model/signal';
import { emit, on } from '@create-figma-plugin/utilities';
import { clientFetchDBCurry } from '../utils/fetchDB';

const clientFetch = clientFetchDBCurry();
/**
 * KeyIdNameSignal 업데이트
 * 이름 없는 애들이 요청 들어오는 거임
 */
export const updateKeyIds = async (keyIds: string[]) => {
	const oldKeyNames = keyIdNameSignal.value;
	const removeTarget = removeKeyIdsSignal.value;
	console.log('🚀 ~ updateKeyIds ~ removeTarget:', removeTarget);

	// 무한 제귀 방지
	const requestIds = keyIds.filter((id) => !removeTarget.includes(id));
	console.log('🚀 ~ updateKeyIds ~ requestIds:', requestIds);

	if (requestIds.length === 0) {
		return;
	}

	const data = await clientFetch('/localization/keys/names-by-ids', {
		method: 'POST',
		body: JSON.stringify({
			ids: requestIds,
		}),
	});

	if (data.ok) {
		const newKeyNames = (await data.json()) as Record<string, string>;
		const removeKeyIds = keyIds.filter((id) => !Object.keys(newKeyNames).includes(id));
		console.log('🚀 ~ updateKeyIds ~ removeKeyIds:', removeKeyIds);

		removeKeyIdsSignal.value = removeKeyIds;
		keyIdNameSignal.value = { ...oldKeyNames, ...newKeyNames };
	}
};
/** 단일 대상 키 이름 업데이트 */
const updateKeyId = async (keyId: string) => {
	const oldKeyNames = keyIdNameSignal.value;

	const data = await clientFetch('/localization/keys/names-by-ids', {
		method: 'POST',
		body: JSON.stringify({
			ids: [keyId],
		}),
	});

	const newKeyNames = (await data.json()) as Record<string, string>;

	keyIdNameSignal.value = { ...oldKeyNames, ...newKeyNames };
};
