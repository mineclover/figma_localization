import { LocalizationKey, LocalizationTranslationDTO } from '../domain/Label/TextPluginDataModel';

// 번역 관련 이벤트 타입
export interface TranslationKeyEventTypes {
	REQUEST_KEY: string;
	RESPONSE_KEY: string;
}

// 노드 데이터 타입
export interface NodeData {
	localizationKey: string;
	originalLocalizeId: string;
	domainId?: string;
	ignore?: boolean;
}

// 캐시 시스템 구현을 위한 타입
export interface CacheItem<T> {
	timestamp: number;
	data: T;
}

// 번역 관련 상태 관리 타입
export interface TranslationState {
	translations: Record<string, LocalizationTranslationDTO>;
	currentKey: string | null;
	isLoading: boolean;
}
