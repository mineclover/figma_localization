import { h } from 'preact';

import { IconButton } from '@create-figma-plugin/ui';

import { icons } from './icons';
import styles from './Icon.module.css';

// import asset from '@create-figma-plugin/ui';
const asset = require('@create-figma-plugin/ui');

const IconViewer = ({ icon }: { icon: string }) => {
	const Icon = asset[icon];
	return (
		<div>
			<Icon />
			<input type="text" value={icon} />
		</div>
	);
};

function LabelPage() {
	const asset = require('@create-figma-plugin/ui');
	const icons16 = icons['16'];
	const icons24 = icons['24'];

	return (
		<div className={styles.flow}>
			{icons16.map((icon) => {
				return <IconViewer key={icon} icon={icon} />;
			})}
			{icons24.map((icon) => {
				return <IconViewer key={icon} icon={icon} />;
			})}
		</div>
	);
}
export default LabelPage;
