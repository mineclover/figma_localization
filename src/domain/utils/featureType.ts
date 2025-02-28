import { ValidAllStyleRangesType } from '@/figmaPluginUtils/text'

/** 화면 이동 */
export type ViewMoveType = {
	pageId: string
	nodeId: string
}

/**
 * 피그마 figma_locations 키
 */
export type LocationKey = string
/**
 * 로컬라이제이션 키 값
 * localizationKey , localization_keys 의 key_id
 */
export type LocalizationKey = string
/**
 * 원본 로컬라이즈 아이디
 * 기준이 되는 로컬라이즈 텍스트의 키 ( 변환용이고 피그마 용 )
 */
export type OriginalLocalizeId = string

/**  */
export type NodeData = {
	/** 키 값 등록해놓고 저장은 글로벌 스토어에서 처리 */
	localizationKey: LocalizationKey
	originalLocalizeId: OriginalLocalizeId
	ignore?: boolean
}

/** 현재 커서 정보 */
export type CurrentCursorType = {
	/**
	 * 표시 생략해도 됨
	 */
	projectId: string
	/**
	 *
	 */

	pageName: string
	pageId: string
	nodeName: string
	nodeId: string
	characters: string
	autoRename: boolean

	data: NodeData
	styleData?: ValidAllStyleRangesType
	boundVariables?: any
}

// 저장을 어떻게 할까
