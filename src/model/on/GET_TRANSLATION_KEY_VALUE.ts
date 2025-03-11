import { emit, on } from '@create-figma-plugin/utilities';
import { GET_TRANSLATION_KEY_VALUE } from '../../domain/constant';
import { getNodeTranslations, localizationKeyMapping } from '../../domain/Label/TextPluginDataModel';
import { CacheItem } from '../types';
import { localizationKeySignal } from '../signal';

// 번역 키 요청 캐시
const translationKeyCache = new Map<string, CacheItem<any>>();

/**
 * UI에서 번역 키 데이터 응답 수신 처리
 */
export const onLocalizationKeyTranslationsResponse = () => {
	emit(GET_TRANSLATION_KEY_VALUE.REQUEST_KEY);
	return on(GET_TRANSLATION_KEY_VALUE.RESPONSE_KEY, (data) => {
		localizationKeySignal.value = data;
	});
};

/**
 * 번역 키에 대한 모든 번역 데이터 요청 처리
 */
export const onGetKeyTranslations = () => {
	on(GET_TRANSLATION_KEY_VALUE.REQUEST_KEY, async () => {
		const node = figma.currentPage.selection[0];
		if (!node || node.type !== 'TEXT') {
			return;
		}

		const result = await getNodeTranslations(node);
		if (result) {
			emit(GET_TRANSLATION_KEY_VALUE.RESPONSE_KEY, result);
		}
	});
};

/**
 * 캐시된 번역 데이터 조회 또는 새로 요청
 * @param keyId 로컬라이제이션 키 ID
 * @param maxAge 캐시 유효 시간(ms)
 */
export const getCachedTranslationData = async (keyId: string, maxAge: number = 1000) => {
	const cacheKey = `translation_${keyId}`;
	const now = Date.now();
	const cachedItem = translationKeyCache.get(cacheKey);

	if (cachedItem && now - cachedItem.timestamp < maxAge) {
		return cachedItem.data;
	}

	// 새로운 데이터 요청 로직
	// (여기에 기존 getTargetTranslations 호출 또는 유사한 로직 구현)

	return null;
};
