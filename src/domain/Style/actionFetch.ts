import { LocalizationKeyAction } from '@/model/types';
import { createCachedFetch } from '@/utils/cacheStore';
import { paths } from 'types/i18n';
import { ActionType } from '../System/ActionResourceDTO';
import { clientFetchDBCurry } from '../utils/fetchDB';

export const fetchClient = clientFetchDBCurry();
export const cachedFetch = createCachedFetch<paths>(fetchClient, { ttl: 1000 }); // 1초 캐시
// userId 필요하긴 한데 일단 넣지 않음
export const keyActionFetchCurry = (key: string, action: ActionType) => {
	return async () => {
		const url = `/localization/actions?key_id=${key}&action=${action}` as '/localization/actions';
		const result = await cachedFetch(url, {
			method: 'GET',
		});

		const data = result as LocalizationKeyAction[];

		return data;
	};
};

export const labelKeyMapping = (list: LocalizationKeyAction[]) => {
	return list.reduce(
		(acc, item) => {
			const value = [item.effect_resource_id, item.style_resource_id].join(':');

			acc[item.from_enum] = value;
			return acc;
		},
		{} as Record<string, string>
	);
};
