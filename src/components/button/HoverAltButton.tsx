import { IconButton, IconButtonProps } from '@create-figma-plugin/ui';
import { ComponentChildren, h } from 'preact';
import { useState } from 'preact/hooks';
import styles from './button.module.css';
import { clc } from '../modal/utils';

type Props = {
	children: ComponentChildren;
	alt: string;
	direction?: 'left' | 'right';
};

export const HoverAltButton = ({ children, alt, direction = 'right', ...props }: Props & IconButtonProps) => {
	const [hover, setHover] = useState(false);

	return (
		<IconButton {...props} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
			{hover && <div className={clc(styles.hover, styles[direction])}>{alt}</div>}
			{children}
		</IconButton>
	);
};
