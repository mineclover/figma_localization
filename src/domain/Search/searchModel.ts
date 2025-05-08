import { KeyIdNameSignal } from '@/model/signal';
import { emit, on } from '@create-figma-plugin/utilities';
import { clientFetchDBCurry } from '../utils/fetchDB';
const clientFetch = clientFetchDBCurry();
/** KeyIdNameSignal 업데이트 */
export const updateKeyIds = async (keyIds: string[]) => {
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
/** 단일 대상 키 이름 업데이트 */
const updateKeyId = async (keyId: string) => {
	const oldKeyNames = KeyIdNameSignal.value;

	const data = await clientFetch('/localization/keys/names-by-ids', {
		method: 'POST',
		body: JSON.stringify({
			ids: [keyId],
		}),
	});

	const newKeyNames = (await data.json()) as Record<string, string>;

	KeyIdNameSignal.value = { ...oldKeyNames, ...newKeyNames };
};
