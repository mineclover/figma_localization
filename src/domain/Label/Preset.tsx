import { Bold, IconChevronDownLarge24, Textbox } from '@create-figma-plugin/ui'
import { h } from 'preact'
import { useState } from 'preact/hooks'
import { textRecommend } from '@/ai/textRecommend'
import { clc } from '@/components/modal/utils'
import { useSignal } from '@/hooks/useSignal'
import { apiKeySignal, editPresetSignal, presetStoreSignal } from '@/model/signal'
import styles from './Label.module.css'

export const Preset = () => {
	const [isOpen, setIsOpen] = useState(false)

	const editPreset = useSignal(editPresetSignal)
	const presetStore = useSignal(presetStoreSignal)
	const apiKey = useSignal(apiKeySignal)

	const presetNames = Object.keys(presetStore)

	const handlePresetNameChange = (value: string) => {
		editPreset.name = value
		editPresetSignal.value = editPreset
	}

	const handleEnterKeyPress = async (inputValue: string) => {
		if (apiKey) {
			const _response = await textRecommend(apiKey, inputValue)
		}
	}

	return (
		<div className={styles.wrap}>
			<div className={styles.row}>
				<Bold>프리셋 선택</Bold>
				<Textbox
					placeholder="프리셋 이름 입력 가능"
					value={editPreset.name}
					onChange={e => handlePresetNameChange(e.currentTarget.value)}
					onKeyDown={async e => {
						if (e.key === 'Enter') {
							const inputValue = e.currentTarget.value
							await handleEnterKeyPress(inputValue)
						}
					}}
				/>
				<button
					type="button"
					className={clc(styles.iconButton, isOpen && styles.up)}
					onClick={() => setIsOpen(!isOpen)}
				>
					<IconChevronDownLarge24 />
				</button>
			</div>
			{isOpen && (
				<div className={styles.wrap}>
					{presetNames.map(item => {
						const preset = presetStore[item]
						return (
							<button type="button" key={item} className={styles.item}>
								{preset.name} : {preset.figmaSectionIds.join(',')}
							</button>
						)
					})}
				</div>
			)}
		</div>
	)
}
