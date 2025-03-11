import { h } from 'preact';
import styles from './icon.module.css';

const FigmaIcon = ({ size = 24, color = '#5F6368', ...props }) => {
	return (
		<div className={styles.icon}>
			<svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M4 23.9999C6.208 23.9999 8 22.2079 8 19.9999V15.9999H4C1.792 15.9999 0 17.7919 0 19.9999C0 22.2079 1.792 23.9999 4 23.9999Z"
					fill="#0ACF83"
				/>
				<path
					d="M0 12.0002C0 9.79217 1.792 8.00017 4 8.00017H8V15.9999H4C1.792 15.9999 0 14.2082 0 12.0002Z"
					fill="#A259FF"
				/>
				<path d="M0 4C0 1.792 1.792 0 4 0H8V8.00017H4C1.792 8.00017 0 6.208 0 4Z" fill="#F24E1E" />
				<path
					d="M8 0H11.9998C14.2078 0 15.9998 1.792 15.9998 4C15.9998 6.208 14.2078 8 11.9998 8L8 8.00017V0Z"
					fill="#FF7262"
				/>
				<path
					d="M15.9998 12C15.9998 14.208 14.2078 16 11.9998 16C9.79178 16 7.99978 14.208 7.99978 12C7.99978 9.79204 9.79179 8 11.9998 8C14.2078 8 15.9998 9.79204 15.9998 12Z"
					fill="#1ABCFE"
				/>
			</svg>
		</div>
	);
};

export default FigmaIcon;
