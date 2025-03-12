import { baseURL } from '@/domain/constant';

import { paths } from 'types/i18n';
import { getDomainSetting } from '../Setting/SettingModel';

export const fetchDB = <V extends keyof paths>(url: V, options?: RequestInit) => {
	const domainSetting = getDomainSetting();

	if (!domainSetting) {
		figma.notify('도메인 설정이 없습니다.');
		return;
	}

	return fetch(baseURL + url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			'X-Domain-Id': domainSetting.domainId.toString(),
		},
	});
};

export const clientFetchDBCurry =
	(domainId: number | string) =>
	<V extends keyof paths>(url: V, options?: RequestInit) => {
		return fetch(baseURL + url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				'X-Domain-Id': domainId.toString(),
			},
		});
	};
