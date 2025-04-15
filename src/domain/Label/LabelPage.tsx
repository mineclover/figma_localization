import { h } from 'preact';
import styles from './Label.module.css';
import {
	Bold,
	Button,
	IconActionChangeSmall24,
	IconBooleanSubtract24,
	IconBooleanUnion24,
	IconButton,
	IconChevronDownLarge24,
	IconDropShadowMidSmall24,
	IconInsert24,
	Textbox,
} from '@create-figma-plugin/ui';
import { clc } from '@/components/modal/utils';
import { useState } from 'preact/hooks';

import { selectedPresetNameSignal, editPresetSignal, presetStoreSignal } from '@/model/signal';
import { useSignal } from '@/hooks/useSignal';
import { emit } from '@create-figma-plugin/utilities';
import { DISABLE_RENDER_PAIR, RENDER_PAIR } from '../Search/visualModel';

const Preset = () => {
	const [isOpen, setIsOpen] = useState(false);

	const editPreset = useSignal(editPresetSignal);
	const presetStore = useSignal(presetStoreSignal);
	const presetNames = Object.keys(presetStore);

	return (
		<div className={styles.wrap}>
			<div className={styles.row}>
				<Bold>프리셋 선택</Bold>
				<Textbox
					placeholder="프리셋 이름 입력 가능"
					value={editPreset.name}
					onChange={(e) => {
						editPreset.name = e.currentTarget.value;
						editPresetSignal.value = editPreset;
					}}
				/>
				<button className={clc(styles.iconButton, isOpen && styles.up)} onClick={() => setIsOpen(!isOpen)}>
					<IconChevronDownLarge24></IconChevronDownLarge24>
				</button>
			</div>
			{isOpen && (
				<div className={styles.wrap}>
					{presetNames.map((item) => {
						const preset = presetStore[item];
						return (
							<button className={styles.item}>
								{preset.name} : {preset.figmaSectionIds.join(',')}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};

function LabelPage() {
	const preset = useSignal(editPresetSignal);
	const presetStore = useSignal(presetStoreSignal);
	const presetNames = Object.keys(presetStore);

	return (
		<div className={styles.container}>
			<Preset />

			<div className={styles.row}>
				<Bold>섹션 선택</Bold>
				<p>섹션들</p>
			</div>
			<div className={styles.row}>
				<p>조회 후</p>
				<Button
					onClick={() => {
						emit(RENDER_PAIR.RENDER_REQUEST);
					}}
				>
					활성화
				</Button>
				<Button
					onClick={() => {
						emit(DISABLE_RENDER_PAIR.DISABLE_RENDER_REQUEST);
					}}
				>
					비활성화
				</Button>
				<IconButton>
					<IconActionChangeSmall24></IconActionChangeSmall24>
				</IconButton>
			</div>
			<Bold>타겟 키 선택</Bold>
			<span>선택할 수 있는 전체 키 목록</span>

			<div className={styles.row}>
				<Bold>선택 적용 옵션</Bold>

				<IconButton>
					<IconInsert24 />
				</IconButton>
				<IconButton>
					<IconBooleanUnion24 />
				</IconButton>
				<IconButton>
					<IconBooleanSubtract24 />
				</IconButton>
			</div>
			<div className={styles.row}>
				<Bold>대표 노드 키 선택</Bold>
			</div>
			<div className={styles.row}>
				<Button>저장</Button>
			</div>
		</div>
	);
}
export default LabelPage;
