import { ValidAllStyleRangesType } from '@/figmaPluginUtils/text';
import { LocalizationKeyDTO, LocationDTO, Preset, PresetStore, SearchNodeData, StyleSync } from './types';
import { LocalizationKey } from './types';
import { DomainSettingType } from './types';
import { CurrentNode } from './types';
import { CurrentCursorType } from './types';
import { signal } from '@preact/signals-core';
import { ActionType } from '@/domain/System/ActionResourceDTO';
import { MetaData } from '@/domain/Search/searchStore';
import { NULL_STATE } from '@/domain/Search/visualModel';

/**
 * 번역 키 관련 상태를 저장하는 시그널
 **/
export const localizationKeySignal = signal<LocalizationKey | null>(null);

/** 배치 처리 시 피그마 노드의 패턴 매칭 데이터 */
// export const patternMatchDataSignal = signal<SearchNodeData[]>([]);
export const patternMatchDataSignal = signal<MetaData[]>([]);

/** 배치 처리를 위한 선택된 아이디 배열 */
export const selectIdsSignal = signal<string[]>([]);

/**
 * 클라이언트 측에서 관리되는
 * 선택된 섹션 타겟
 * 선택 로직에 의해 선택 된 것으로
 */
/** 현재 커서가 있는 섹션 ( 실시간 감지 ) */
export const currentSectionSignal = signal<CurrentNode | null>(null);

/** old:  현재 포인터의 노드 데이터 1개 ( 실시간 감지 ) */
export const currentPointerSignal = signal<CurrentCursorType | null>(null);

/*
 * 자동 선택 시 다중 선택된 노드 데이터
 */
export const autoCurrentNodesSignal = signal<MetaData[]>([]);

/**
 * 자동 선택 시 다중 선택된 노드 스타일 데이터
 * 만약 baseNodeId가 다르면 mixed 반환할 계획
 */
export const autoCurrentNodeStyleSignal = signal<string | 'mixed' | 'none'>('none');

/**
 * 선택된 키의 위치 정보
 * 어쨌든 키 값이 얻어지고 구분 되게 됬을 때?
 * 상태 갱신이 잘 되면 그대로 쓰고 안되면, new Map() 으로 새로 생
 */
export const searchStoreLocationSignal = signal<Map<string, LocationDTO>>(new Map());

/** 프로젝트 아이디 */
export const projectIdSignal = signal<string>('');

/** 선택된 섹션 키 */
export const selectedKeySignal = signal<string | null>(null);
export const selectedKeyDataSignal = signal<LocalizationKeyDTO | null>(null);
/** 입력된 키 값 */
export const inputKeySignal = signal<string>('');

/** 즉시 처리 여부 */
export const isDirectSignal = signal<boolean>(false);
/** 추정 일괄 처리 여부 */
export const isTravelSignal = signal<boolean>(false);

/** 스타일 저장소 */
export const styleSignal = signal<StyleStore>({});

/** 스타일 태그 네이밍 값 결정 모드 */
export const styleTagModeSignal = signal<'name' | 'id'>('id');

/** 도메인 설정 */
export const domainSettingSignal = signal<DomainSettingType | null>(null);

/** 언어 코드 배열 */
export const languageCodesSignal = signal<string[]>([]);
export type StyleStore = Record<string, StyleSync>;

export type StyleData = {
	styleData: ValidAllStyleRangesType;
	boundVariables: any;
	effectStyleData: any;
};

export const styleDataSignal = signal<StyleData | null>(null);
export const variableDataSignal = signal<Record<string, string>>({});

export const userHashSignal = signal<string | null>(null);
// elwkdlsj
// 디자이너라 씀

// ================================================
// 프리셋 관련
// ================================================

export const defaultPreset: Preset = {
	name: '',
	figmaSectionIds: [],
	baseNodeId: '',
	serverSectionId: '',
};

/** 선택 원본 프리셋 이름 */
export const selectedPresetNameSignal = signal<string>('');
/** 수정할 프리셋 데이터 */
export const editPresetSignal = signal<Preset>(defaultPreset);
/** 프리셋 원본 저장소 */
export const presetStoreSignal = signal<PresetStore>({});

/** 섹션 선택 모드 */
export const sectionSelectModeSignal = signal<boolean>(true);

/** 무시할 섹션 아이디 목록 */
export const ignoreSectionIdsSignal = signal<string[]>([]);
export const modeStateSignal = signal(NULL_STATE);
