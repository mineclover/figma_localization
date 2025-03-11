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
export type LocationDTO = {
	created_at: string;
	is_deleted: number;
	is_pinned: number;
	location_id: number;
	node_id: string;
	page_id: string;
	project_id: string;
	updated_at: string;
};

export type Location = {
	location_id: number;
	project_id: string;
	node_id: string;
	page_id: string;
	is_pinned: boolean;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
};
export type LocalizationKeyDTO = {
	key_id: number;
	domain_id: number;
	name: string;
	origin_id?: number;
	origin_value?: string;
	alias?: string;
	parent_key_id?: number;
	parent_name?: string;
	parent_origin_value?: string;
	is_variable: number;
	is_temporary: number;
	section_id?: number;
	section_name: string;
	version: number;
	is_deleted: number;
	created_at: string;
	updated_at: string;
};

export type LocalizationKey = {
	key_id: number;
	domain_id: number;
	name: string;
	origin_id?: number;
	origin_value?: string;
	alias?: string;
	parent_key_id?: number;
	is_variable: boolean;
	is_temporary: boolean;
	section_id?: number;
	section_name: string;
	version: number;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
};
export type LocalizationKeyProps = {
	domainId: number;
	name: string;
	alias?: string;
	sectionId?: string;
	parentKeyId?: number;
	isVariable?: boolean;
	isTemporary?: boolean;
	sectionName?: string;
};
// TextPluginDataModel 타입 정의

export type LocalizationTranslationDTO = {
	created_at: string;
	is_deleted: number;
	key_id: number;
	language_code: string;
	last_modified_by: null | string;
	localization_id: number;
	text: string;
	updated_at: string;
	version: number;
};

export type LocalizationTranslation = {
	created_at: string;
	is_deleted: boolean;
	key_id: number;
	language_code: string;
	last_modified_by: string | null;
	localization_id: number;
	text: string;
	updated_at: string;
	version: number;
};
