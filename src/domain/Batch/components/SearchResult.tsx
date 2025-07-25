import {
	Bold,
	Button,
	Code,
	IconButton,
	IconChevronDown24,
	IconChevronUp24,
	IconCloseSmall24,
	IconEyeSmall24,
	IconHiddenSmall24,
	Text,
} from '@create-figma-plugin/ui'
import { h } from 'preact'
import type { TargetedEvent } from 'preact/compat'
import { useState } from 'preact/hooks'
import { clc } from '@/components/modal/utils'
import type { Dispatch } from '@/hooks/useDispatch'
import { useSignal } from '@/hooks/useSignal'
import { selectIdsSignal } from '@/model/signal'
import type { PatternMatchData } from '@/model/types'
import styles from '../batch.module.css'

type SearchResultProps = PatternMatchData & {
	dispatch: Dispatch<any>
}

export const SearchResult = ({ ignore, name, text, parentName, localizationKey, ids, dispatch }: SearchResultProps) => {
	const [isExtended, setIsExtended] = useState<boolean>(false)
	const selectIds = useSignal(selectIdsSignal)
	const hasAnyId = ids.some(id => selectIds.includes(id))

	return (
		<div className={clc(styles.container, hasAnyId && styles.containerSelected)}>
			<div className={styles.column}>
				<div className={styles.row}>
					<IconButton
						onClick={() =>
							dispatch({
								type: 'toggleNodeIgnore',
								payload: { ignore: !ignore, ids },
							})
						}
					>
						{ignore ? <IconHiddenSmall24 /> : <IconEyeSmall24 />}
					</IconButton>
					<Text align="left" className={styles.width}>
						<Code>text: {text}</Code>
					</Text>

					<IconButton
						onClick={() => {
							setIsExtended(true)
							dispatch({
								type: 'toggleAllIdsSelection',
								payload: { ids, selectIds },
							})
						}}
					>
						{hasAnyId ? <IconCloseSmall24 /> : ids.length.toString()}
					</IconButton>
				</div>
				<div className={styles.row}>
					<Bold className={clc(localizationKey === '' && styles.disabled)}>
						key: {localizationKey === '' ? 'NULL' : localizationKey}
					</Bold>
					<IconButton onClick={() => setIsExtended(!isExtended)}>
						{isExtended ? <IconChevronUp24 /> : <IconChevronDown24 />}
					</IconButton>
				</div>
			</div>
			<div className={clc(!isExtended && styles.rowExtended)}>
				<button
					type="button"
					className={styles.button}
					onClick={() =>
						dispatch({
							type: 'selectIds',
							payload: { ids },
						})
					}
				>
					{parentName} / {name}
				</button>

				<div className={styles.wrap}>
					{ids.map(item => {
						const selected = selectIds.includes(item)

						return (
							<Button
								{...selectStyle(selected)}
								onClick={() =>
									dispatch({
										type: 'zoomToNode',
										payload: { id: item },
									})
								}
								onContextMenu={(e: TargetedEvent<HTMLButtonElement, MouseEvent>) => {
									e.preventDefault()
									dispatch({
										type: 'toggleIdSelection',
										payload: { id: item, selectIds },
									})
								}}
							>
								{item}
							</Button>
						)
					})}
				</div>
			</div>
		</div>
	)
}

const selectStyle = (selected: boolean) => {
	if (selected) {
		return {
			secondary: false,
		}
	}

	return {
		secondary: true,
	}
}
