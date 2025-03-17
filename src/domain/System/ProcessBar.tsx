import { useSignal } from '@/hooks/useSignal';
import ProgressBar from '@ramonak/react-progress-bar';
import { h, Fragment } from 'preact';
import { Process, processSignal } from './process';
import styles from './Process.module.css';
import { Bold, IconButton, IconTrash32 } from '@create-figma-plugin/ui';

const ProcessBar = () => {
	const processStore = useSignal(processSignal);

	const keys = Object.keys(processStore);

	// process_id: string;
	// process_name: string;
	// process_status: string;
	// process_end: string;

	return (
		<div className={styles.container}>
			<Bold>변경 대상의 번역 상태</Bold>
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
							labelSize="12px"
							customLabel={`${process_status} / ${process_end}`}
							labelAlignment="center"
							bgColor={'var(--figma-color-bg-brand)'}
							baseBgColor={'var(--figma-color-bg-secondary)'}
							labelColor={'var(--figma-color-bg)'}
							margin="2px"
							maxCompleted={process_end}
						/>
						<IconButton
							onClick={() => {
								delete processStore[key];
								processSignal.value = { ...processStore };
							}}
						>
							<IconTrash32 />
						</IconButton>
					</div>
				);
			})}
		</div>
	);
};

export default ProcessBar;
