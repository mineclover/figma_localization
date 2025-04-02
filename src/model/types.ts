import { ValidAllStyleRangesType } from '@/figmaPluginUtils/text';

// 번역 관련 이벤트 타입
export interface TranslationKeyEventTypes {
	REQUEST_KEY: string;
	RESPONSE_KEY: string;
}

// 노드 데이터 타입
export interface NodeData {
	localizationKey: string;

	domainId?: string;
	ignore?: boolean;
	action?: string;
	modifier?: string;
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
export type SearchNodeData = {
	id: string;
	name: string;
	ignore: boolean;
	localizationKey: string;
	text: string;
	parentName: string;
};

export type PatternMatchData = Omit<SearchNodeData, 'id'> & {
	ids: string[];
};
export type GroupOption = {
	localizationKey: true;
	/** 부모 이름을 그루핑 파라미터로 사용 */
	parentName: true;
	/** 이름을 그루핑 파라미터로 사용 */
	name: true;
	/** 텍스트를 그루핑 파라미터로 사용 */
	text: true;
};
export type ViewOption = {
	/** 숨김 대상을 표시 */
	ignore: boolean;
	/** 숨기지 않은 대상을 표시 */
	notIgnore: boolean;
	/** 키 값이 있는 대상을 표시 */
	hasLocalizationKey: boolean;
	/** 키 값이 없는 대상을 표시 */
	notHasLocalizationKey: boolean;
}; // inspect 모드에서 figma.fileKey가 없기 때문에 프로젝트 아이디를 STORE_KEY에 추가함

export type SectionDTO = {
	section_id: number;
	section_name: string;
	domain_id: number;
	doc_link: string;
	created_at: string;
	updated_at: string;
	code?: string;
};
export type DomainSettingType = {
	domainId: number;
	domainName: string;
}; // 있든 없든 수정 가능하게 구성

export type StyleSync = {
	hashId: string;
	name?: string;
	id?: string;
	alias?: string;
} & StyleGroup;

export type StyleHashSegment = {
	total: number;
	text: string;

	id?: string;
	hashId: string;
	name?: string;
	styles: Record<string, any>;
};

export type Resource = {
	resource_id: number;
	style_name: string;
	style_value: string;
	hash_value: string;
	alias?: string;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
};

export type ResourceDTO = {
	resource_id: number;
	style_name: string;
	style_value: Record<string, any>;
	hash_value: string;
	alias?: string;
	is_deleted: number;
	created_at: string;
	updated_at: string;
};
export type ParsedResourceDTO = {
	resource_id: number;
	style_name: string;
	style_value: Record<string, any>;
	hash_value: string;
	alias?: string;
	is_deleted: number;
	created_at: string;
	updated_at: string;
};
export interface StyleSegment {
	start: number;
	end: number;
	text: string;
	style: Record<string, any>;
}

export interface StyleSegmentsResult {
	defaultStyle: Record<string, any>;
	segments: StyleSegment[];
}
export interface StyleGroup {
	style: Record<string, any>;
	ranges: { start: number; end: number; text: string }[];
}
export type CurrentNode = {
	id: string;
	name: string;
}; /** 현재 커서 정보 */

export type CurrentCursorType = {
	/**
	 * 표시 생략해도 됨
	 */
	projectId: string;
	/**
	 *
	 */
	pageName: string;
	pageId: string;
	nodeName: string;
	nodeId: string;
	characters: string;
	autoRename: boolean;
	data: NodeData;
	pageLock: boolean;
	// styleData?: ValidAllStyleRangesType;
	// boundVariables?: any;
}; /**  */

export interface LocalizationKeyAction {
	/**
	 * 키 ID
	 */
	key_id: number;

	/**
	 * 액션 타입 (예: "default")
	 */
	action: string;

	/**
	 * 열거형 값
	 */
	from_enum: string;

	/**
	 * 스타일 리소스 ID
	 */
	style_resource_id: number;

	/**
	 * 이펙트 리소스 ID
	 */
	effect_resource_id: number;

	/**
	 * 생성일
	 */
	created_at: string;

	/**
	 * 수정일
	 */
	updated_at: string;

	style_value: string;

	effect_value: string;
}
