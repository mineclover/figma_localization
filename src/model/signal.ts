import { signal } from '@preact/signals-core';
import { ValidAllStyleRangesType } from '@/figmaPluginUtils/text';
import { LocalizationKeyDTO, LocationDTO, Preset, PresetStore, SearchNodeData, StyleSync } from './types';
import { LocalizationKey } from './types';
import { DomainSettingType } from './types';
import { CurrentNode } from './types';
import { CurrentCursorType } from './types';
import { ActionType } from '@/domain/System/ActionResourceDTO';
import { MetaData } from '@/domain/Search/searchStore';
import { NULL_STATE } from '@/domain/Search/visualModel';

// ================================================
// Type Definitions
// ================================================
export type StyleStore = Record<string, StyleSync>;

export type StyleData = {
	styleData: ValidAllStyleRangesType;
	boundVariables: any;
	effectStyleData: any;
};

// ================================================
// Project & Settings Signals
// ================================================
export const projectIdSignal = signal<string>('');
export const domainSettingSignal = signal<DomainSettingType | null>(null);
export const languageCodesSignal = signal<string[]>([]);
export const userHashSignal = signal<string | null>(null);
export const apiKeySignal = signal<string | null>(null);

// ================================================
// Localization & Translation Signals
// ================================================
export const localizationKeySignal = signal<LocalizationKey | null>(null);
export const selectedKeySignal = signal<string | null>(null);
export const selectedKeyDataSignal = signal<LocalizationKeyDTO | null>(null);
export const inputKeySignal = signal<string>('');
export const keyIdNameSignal = signal<Record<string, string>>({});
export const removeKeyIdsSignal = signal<string[]>([]);

// ================================================
// Selection & Navigation Signals
// ================================================
export const currentSectionSignal = signal<CurrentNode | null>(null);
export const currentPointerSignal = signal<CurrentCursorType | null>(null);
export const autoCurrentNodesSignal = signal<MetaData[]>([]);
export const autoCurrentNodeStyleSignal = signal<string | 'mixed' | 'none'>('none');
export const sectionSelectModeSignal = signal<boolean>(true);
export const autoSelectModeSignal = signal<boolean>(false);

// ================================================
// Batch Processing Signals
// ================================================
export const patternMatchDataSignal = signal<MetaData[]>([]);
export const selectIdsSignal = signal<string[]>([]);
export const isDirectSignal = signal<boolean>(false);
export const isTravelSignal = signal<boolean>(false);

// ================================================
// Search & Location Signals
// ================================================
export const searchStoreLocationSignal = signal<Map<string, LocationDTO>>(new Map());
export const ignoreSectionIdsSignal = signal<string[]>([]);

// ================================================
// Style Management Signals
// ================================================
export const styleSignal = signal<StyleStore>({});
export const styleTagModeSignal = signal<'name' | 'id'>('id');
export const styleDataSignal = signal<StyleData | null>(null);
export const variableDataSignal = signal<Record<string, string>>({});

// ================================================
// Preset Management
// ================================================
export const defaultPreset: Preset = {
	name: '',
	figmaSectionIds: [],
	baseNodeId: '',
	serverSectionId: '',
};

export const selectedPresetNameSignal = signal<string>('');
export const editPresetSignal = signal<Preset>(defaultPreset);
export const presetStoreSignal = signal<PresetStore>({});

// ================================================
// Visual Mode Signals
// ================================================
export const modeStateSignal = signal(NULL_STATE);
