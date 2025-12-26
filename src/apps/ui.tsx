import { Container, render, Tabs, type TabsOption, useWindowResize } from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { useState } from 'preact/hooks'
import type { NonNullableComponentTypeExtract } from 'types/utilType'
import BatchPage from '@/domain/Batch/BatchPage'
import LogsPage from '@/domain/Logs/LogsPage'
import { AppProvider } from '@/domain/Provider'
import SettingPage from '@/domain/Setting/SettingPage'
import StylePage from '@/domain/Style/StylePage'
import TranslatePage from '@/domain/Translate/TranslatePage'
import { useSignal } from '@/hooks/useSignal'
import { isDirectSignal } from '@/model/signal'
import type { ResizeWindowHandler } from '../figmaPluginUtils/types'

const nav = ['Keys', 'Section', 'Preview', 'Table', 'Setting', 'Style', 'Translate', 'Batch', 'Logs']

function Plugin() {
  const isBatch = useSignal(isDirectSignal)
  function onWindowResize(windowSize: { width: number; height: number }) {
    emit<ResizeWindowHandler>('RESIZE_WINDOW', windowSize)
  }

  // useEffect(() => {
  // 	runExample();
  // }, []);

  useWindowResize(onWindowResize, {
    maxHeight: 1080,
    maxWidth: 1920,
    minHeight: 120,
    minWidth: 120,
    resizeBehaviorOnDoubleClick: 'minimize',
  })

  function handleChange(
    //  event: NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>
    event: Parameters<NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>>[0],
  ) {
    const newValue = event.currentTarget.value
    setValue(newValue)
  }

  const options: Array<TabsOption> = [
    // {
    // 	children: <LabelPage />,
    // 	value: nav[0],
    // },
    {
      children: <BatchPage />,
      value: nav[0],
    },

    {
      children: <StylePage />,
      value: nav[5],
    },
    {
      children: <TranslatePage />,
      value: nav[6],
    },

    {
      children: <SettingPage />,
      value: nav[4],
    },
    {
      children: <LogsPage />,
      value: nav[8],
    },
    // {
    //   children: <Inspect></Inspect>,
    //   value: nav[2],
    // },
  ] as const
  const [value, setValue] = useState<string>(nav[0])

  return (
    <AppProvider>
      <Container
        space="extraSmall"
        style={{
          background: isBatch ? 'var(--figma-color-bg-danger-secondary)' : 'var(--figma-color-bg)',
        }}
      >
        <Tabs options={options} value={value} onChange={handleChange} />
      </Container>
    </AppProvider>
  )
}

export default render(Plugin)
