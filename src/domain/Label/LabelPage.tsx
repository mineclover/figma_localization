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
	IconEyeSmall24,
	IconHiddenSmall24,
	IconInsert24,
	Textbox,
} from '@create-figma-plugin/ui';
import { clc } from '@/components/modal/utils';
import { useState } from 'preact/hooks';

import { selectedPresetNameSignal, editPresetSignal, presetStoreSignal } from '@/model/signal';
import { useSignal } from '@/hooks/useSignal';
import { emit } from '@create-figma-plugin/utilities';
import { DISABLE_RENDER_PAIR, RENDER_PAIR, RENDER_TRIGGER, SAVE_ACTION } from '../Search/visualModel';
import { modeStateSignal } from '@/model/signal';

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
// 활성화와 새로고침의 기능이 같음
// 선택 적용 옵션은 모든 저장에 적용할 수 있음
function LabelPage() {
	const preset = useSignal(editPresetSignal);
	const presetStore = useSignal(presetStoreSignal);
	const modeState = useSignal(modeStateSignal);
	const presetNames = Object.keys(presetStore);

	return (
		<div className={styles.container}>
			<div className={styles.row}>
				<IconButton
					onClick={() => {
						// 더하기
						emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.INSERT, {
							localizationKey: 'insert',
							action: 'default, hover 등등',
							baseNodeId: 'test',
						});
					}}
				>
					<IconInsert24 />
				</IconButton>
				<IconButton
					onClick={() => {
						// 합집합
						emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.UNION, {
							localizationKey: 'union',
							action: 'default, hover 등등',
							baseNodeId: 'test',
						});
					}}
				>
					<IconBooleanUnion24 />
				</IconButton>
				<IconButton
					onClick={() => {
						// 차집합
						emit(RENDER_TRIGGER.SAVE_ACTION, SAVE_ACTION.SUBTRACT, {
							localizationKey: 'subtract',
							action: 'default, hover 등등',
							baseNodeId: 'test',
						});
					}}
				>
					<IconBooleanSubtract24 />
				</IconButton>
				{/* 활성화 */}
				<IconButton
					onClick={() => {
						emit(RENDER_PAIR.RENDER_REQUEST);
						// 오버레이 존재 여부를 모른다는 단점
					}}
				>
					<IconEyeSmall24></IconEyeSmall24>
				</IconButton>
				{/* 비활성화 */}
				<IconButton
					onClick={() => {
						emit(DISABLE_RENDER_PAIR.DISABLE_RENDER_REQUEST);
					}}
				>
					<IconHiddenSmall24 />
				</IconButton>
			</div>
			<Preset />
			<span>{modeState}</span>

			<div className={styles.row}>
				<Button
					onClick={() => {
						emit(RENDER_TRIGGER.SECTION_SELECT);
					}}
				>
					제외할 섹션 선택
				</Button>
				<p>선택 섹션들은 수정 대상에서 제외됩니다.(전체 선택 시 제외)</p>
			</div>

			<Bold>타겟 키 선택</Bold>
			<span>선택할 수 있는 전체 키 목록</span>

			<div className={styles.row}>
				<Bold>선택 적용 옵션</Bold>
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
