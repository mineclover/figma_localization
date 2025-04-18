import { isValidHexColor, convertNamedColorToHexColor } from '@create-figma-plugin/utilities';

/**
 *
 * @param text
 * @param startHue  색조
 * @returns
 */
export function generatePastelColors(text: string[], startHue: number = 0, lightness: number = 85) {
	const uniqueChars = [...new Set(text)];
	const hueStep = 207;
	// const hueStep = 360 / uniqueChars.length;

	const colorMap: Record<string, string> = {};

	uniqueChars.forEach((char, index) => {
		// HSL 값 계산 (시작 색상에 오프셋 추가)
		const hue = (startHue + index * hueStep) % 360;
		const saturation = 100; // 파스텔톤을 위한 적절한 채도
		// const lightness = 85; // 높은 명도로 파스텔톤 구현

		// HSL을 HEX로 변환
		const color = hslToHex(hue, saturation, lightness);
		colorMap[char] = color;
	});

	return colorMap;
}

function hslToHex(h: number, s: number, l: number) {
	l /= 100;
	const a = (s * Math.min(l, 1 - l)) / 100;
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

// 사용 예시
// const text = ["Hello", "World"];
// const colors = generatePastelColors(text);
// console.log(colors);

export const splitHexAndOpacity = (color: string) => {
	// 8자리 헥사코드인 경우 (예: FF0000FF)
	if (color.length === 8) {
		const hex = color.slice(0, 6); // 6자리 헥사코드 (FF0000)
		const opacityHex = color.slice(6, 8); // opacity 헥사값 (FF)
		const opacity = Math.round((parseInt(opacityHex, 16) / 255) * 100).toString(); // 백분율로 변환
		return { color: hex, opacity };
	}
	return null;
};

export const colorToHexO = (color: string) => {
	const isHex = isValidHexColor(color);

	// 8자리 헥사코드 처리
	const hexOpacity = splitHexAndOpacity(color);
	if (hexOpacity) {
		return hexOpacity;
	}

	if (isHex) {
		return {
			color: color,
			opacity: '100',
		};
	} else {
		const convertedColor = convertNamedColorToHexColor('#' + color)?.replace('#', '') ?? color;
		return {
			color: convertedColor,
			opacity: '100',
		};
	}
};

export const HexOToHexO = (hex: string, opacity: string) => {
	const hexOpacity = Math.round((Number(opacity.replace('%', '')) / 100) * 255)
		.toString(16)
		.padStart(2, '0');
	return `${hex}${hexOpacity}`;
};

export function getContrastColors(inputColor: string) {
	inputColor = convertNamedColorToHexColor(inputColor) ?? inputColor;

	if (!inputColor.startsWith('#')) {
		inputColor = '#' + inputColor;
	}
	/**
	 * 헥스 코드를 RGB로 변환하는 함수 , 16진수를 10 진수로 변환함
	 * 피그마에 쓰려면 0~1로 바꿔야 함
	 * @param hex
	 * @returns
	 */
	function hexToRgb(hex: string) {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])(?:([a-f\d]))?$/i;
		hex = hex.replace(shorthandRegex, (m, r, g, b, a) => `${r}${r}${g}${g}${b}${b}${a ? `${a}${a}` : ''}`);

		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})(?:([a-f\d]{2}))?$/i.exec(hex) ?? ['0', '0', '0', '1'];

		return result
			? {
					r: parseInt(result[0], 16),
					g: parseInt(result[1], 16),
					b: parseInt(result[2], 16),
					a: result[3] ? parseInt(result[3], 16) / 255 : 1,
				}
			: null;
	}

	// RGB를 헥스 코드로 변환하는 함수
	function rgbToHex(r: number, g: number, b: number) {
		const toHex = (n: number) => {
			const hex = Math.round(n).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}

	// 입력 색상을 RGB로 변환
	const rgb = hexToRgb(inputColor);
	if (!rgb) {
		throw new Error('Invalid color format');
	}

	let background, foreground;

	// 중간 범위 색상의 경우, background와 foreground 모두 조정
	const lighterAdjustment = 0.6; // 60% 증가로 더 밝게
	const darkerAdjustment = 0.25; // 25% 감소로 약간만 어둡게

	const lighterRgb = {
		r: Math.min(255, rgb.r + (255 - rgb.r) * lighterAdjustment),
		g: Math.min(255, rgb.g + (255 - rgb.g) * lighterAdjustment),
		b: Math.min(255, rgb.b + (255 - rgb.b) * lighterAdjustment),
	};
	const darkerRgb = {
		r: Math.max(0, rgb.r * (1 - darkerAdjustment)),
		g: Math.max(0, rgb.g * (1 - darkerAdjustment)),
		b: Math.max(0, rgb.b * (1 - darkerAdjustment)),
	};
	background = rgbToHex(lighterRgb.r, lighterRgb.g, lighterRgb.b);
	foreground = rgbToHex(darkerRgb.r, darkerRgb.g, darkerRgb.b);

	return {
		background,
		foreground,
	};
}

export const hexToRGBA = (hex: string) => {
	// '#' 문자가 있다면 제거
	hex = hex.replace('#', '');

	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	// 알파값이 있는 경우 처리 (8자리 헥사코드)
	const a = hex.length === 8 ? Math.round((parseInt(hex.slice(6, 8), 16) / 255) * 100) : 100;

	return {
		r: Math.max(0, Math.min(1, r / 255)),
		g: Math.max(0, Math.min(1, g / 255)),
		b: Math.max(0, Math.min(1, b / 255)),
		a: Math.max(0, Math.min(1, a / 100)),
	};
};
