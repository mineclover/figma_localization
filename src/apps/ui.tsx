import { render, useWindowResize, TabsOption, Tabs, Container } from '@create-figma-plugin/ui';
import { Fragment, h } from 'preact';

import { emit } from '@create-figma-plugin/utilities';
import { ResizeWindowHandler } from '../figmaPluginUtils/types';

import { AppProvider } from '@/domain/Provider';
import { NonNullableComponentTypeExtract } from 'types/utilType';
import { useEffect, useState } from 'preact/hooks';
import LabelPage from '@/domain/Label/LabelPage';
import SettingPage from '@/domain/Setting/SettingPage';
import TranslatePage from '@/domain/Translate/TranslatePage';
import { isDirectSignal } from '@/model/signal';
import { useSignal } from '@/hooks/useSignal';
import StylePage from '@/domain/Style/StylePage';
import BatchPage from '@/domain/Batch/BatchPage';
import SimpleSelect from '@/domain/Batch/SimpleSelect';
import LogsPage from '@/domain/Logs/LogsPage';
import { runExample } from '@/utils/test';
import IconPage from '@/domain/Icon/Icon';

const TAB_NAMES = {
	ICON: 'Icon',
	LABEL: 'Label',
	KEYS: 'Keys',
	STYLE: 'Style',
	TRANSLATE: 'Translate',
	SETTING: 'Setting',
	LOGS: 'Logs',
} as const;

const DEFAULT_TAB = TAB_NAMES.LABEL;

const WINDOW_CONFIG = {
	maxHeight: 1080,
	maxWidth: 1920,
	minHeight: 120,
	minWidth: 120,
	resizeBehaviorOnDoubleClick: 'minimize' as const,
};

function createTabOptions(): Array<TabsOption> {
	return [
		{
			children: <IconPage />,
			value: TAB_NAMES.ICON,
		},
		{
			children: <LabelPage />,
			value: TAB_NAMES.LABEL,
		},
		{
			children: <BatchPage />,
			value: TAB_NAMES.KEYS,
		},
		{
			children: <StylePage />,
			value: TAB_NAMES.STYLE,
		},
		{
			children: <TranslatePage />,
			value: TAB_NAMES.TRANSLATE,
		},
		{
			children: <SettingPage />,
			value: TAB_NAMES.SETTING,
		},
		{
			children: <LogsPage />,
			value: TAB_NAMES.LOGS,
		},
	];
}

function Plugin() {
	const isBatch = useSignal(isDirectSignal);
	const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);

	const tabOptions = createTabOptions();

	function onWindowResize(windowSize: { width: number; height: number }) {
		emit<ResizeWindowHandler>('RESIZE_WINDOW', windowSize);
	}

	useWindowResize(onWindowResize, WINDOW_CONFIG);

	function handleTabChange(event: Parameters<NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>>[0]) {
		const newValue = event.currentTarget.value;
		setActiveTab(newValue);
	}

	return (
		<AppProvider>
			<Container
				space="extraSmall"
				style={{
					background: isBatch ? 'var(--figma-color-bg-danger-secondary)' : 'var(--figma-color-bg)',
				}}
			>
				<Tabs options={tabOptions} value={activeTab} onChange={handleTabChange} />
			</Container>
		</AppProvider>
	);
}

export default render(Plugin);
