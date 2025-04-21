import { useSignal } from '@/hooks/useSignal';
import ProgressBar from '@ramonak/react-progress-bar';
import { h, Fragment } from 'preact';
import { Process, processSignal } from './process';
import styles from './Process.module.css';
import {
	Bold,
	Text,
	IconLockLocked16,
	IconLockUnlocked16,
	IconButton,
	IconTrash24,
	Button,
} from '@create-figma-plugin/ui';

import { currentPointerSignal, patternMatchDataSignal } from '@/model/signal';
import { emit } from '@create-figma-plugin/utilities';
import { DISABLE_RENDER_PAIR, RENDER_PAIR } from '../constant';

const ProcessBar = () => {
	const processStore = useSignal(processSignal);

	const keys = Object.keys(processStore);
	const currentPointer = useSignal(currentPointerSignal);
	const patternMatchData = useSignal(patternMatchDataSignal);

	const isPageLock = currentPointer?.pageLock ?? false;

	// process_id: string;
	// process_name: string;
	// process_status: string;
	// process_end: string;

	return (
		<div className={styles.container}>
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
			<div className={styles.row}>
				<Text>번역 미리보기 가능 여부 : {isPageLock ? '불가능' : '가능'}</Text>
				{isPageLock ? <IconLockLocked16 /> : <IconLockUnlocked16 />}
			</div>
			{keys.length > 0 && <Bold>변경 대상의 번역 상태</Bold>}
			{keys.map((key) => {
				const process = processStore[key];
				const { process_status, process_name, process_end } = process;

				console.log(process_status, process_end);

				return (
					<div className={styles.row}>
						<Bold className={styles.text}>{process_name}</Bold>
						<ProgressBar
							className={styles.row}
							completed={process_status}
							height="12px"
							width="100%"
							labelSize="10px"
							customLabel={`${process_status} / ${process_end}`}
							labelAlignment="center"
							bgColor={'var(--figma-color-bg-brand)'}
							baseBgColor={'var(--figma-color-bg-secondary)'}
							labelColor={'var(--figma-color-text)'}
							margin="2px"
							maxCompleted={process_end}
							customLabelStyles={{
								whiteSpace: 'nowrap',
							}}
						/>
						<IconButton
							onClick={() => {
								delete processStore[key];
								processSignal.value = { ...processStore };
							}}
						>
							<IconTrash24 />
						</IconButton>
					</div>
				);
			})}
		</div>
	);
};

export default ProcessBar;
