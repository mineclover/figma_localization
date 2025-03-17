import { useSignal } from '@/hooks/useSignal';
import ProgressBar from '@ramonak/react-progress-bar';
import { h, Fragment } from 'preact';
import { processSignal } from './process';
import styles from './Process.module.css';

const ProcessBar = () => {
	const processStore = useSignal(processSignal);

	const keys = Object.keys(processStore);

	// process_id: string;
	// process_name: string;
	// process_status: string;
	// process_end: string;

	return (
		<div className={styles.container}>
			{keys.map((key) => {
				const process = processStore[key];
				const { process_status, process_end } = process;

				return (
					<ProgressBar
						completed={process_status}
						height="12px"
						labelAlignment="center"
						baseBgColor={'var(--figma-color-bg)'}
						labelColor={'var(--figma-color-bg-brand)'}
						margin="2px"
						padding="2px"
						maxCompleted={process_end}
					/>
				);
			})}
		</div>
	);
};

export default ProcessBar;
