import { render, useWindowResize, TabsOption, Tabs } from '@create-figma-plugin/ui'
import { Fragment, h } from 'preact'

import { emit } from '@create-figma-plugin/utilities'
import { ResizeWindowHandler } from '../figmaPluginUtils/types'

import { AppProvider } from '@/domain/Provider'
import { NonNullableComponentTypeExtract } from 'types/utilType'
import { useState } from 'preact/hooks'
import LabelPage from '@/domain/Label/LabelPage'
import SettingPage from '@/domain/Setting/SettingPage'

const nav = ['Keys', 'Section ToC', 'Preview', 'Table', 'Setting', 'Style', 'Translate']

function Plugin() {
	function onWindowResize(windowSize: { width: number; height: number }) {
		emit<ResizeWindowHandler>('RESIZE_WINDOW', windowSize)
	}
	useWindowResize(onWindowResize, {
		maxHeight: 1080,
		maxWidth: 1920,
		minHeight: 120,
		minWidth: 120,
		resizeBehaviorOnDoubleClick: 'minimize',
	})

	function handleChange(
		//  event: NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>
		event: Parameters<NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>>[0]
	) {
		const newValue = event.currentTarget.value
		setValue(newValue)
	}

	const options: Array<TabsOption> = [
		{
			children: <LabelPage />,
			value: nav[0],
		},
		{
			children: <div>3. 스타일 정의에 대한 인터페이스를 준다 {'>'} 스타일에 대한 라벨링</div>,
			value: nav[5],
		},
		{
			children: (
				<Fragment>
					<div>2. 해당 키가 가진 번역 목록을 준다 {'>'} 번역 목록 기반으로 변경 확인</div>
					<div>4. 번역 가능한 인터페이스를 준다 {'>'} 실시간 번역</div>
				</Fragment>
			),
			value: nav[6],
		},

		{
			children: <SettingPage />,
			value: nav[4],
		},
		// {
		//   children: <Inspect></Inspect>,
		//   value: nav[2],
		// },
	] as const
	const [value, setValue] = useState<string>(nav[0])

	return (
		<AppProvider>
			<Tabs options={options} value={value} onChange={handleChange} />
		</AppProvider>
	)
}

export default render(Plugin)
