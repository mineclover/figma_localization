import { convertRgbColorToHexColor } from '@create-figma-plugin/utilities';

/** rgbToHex(255, 153, 51) */
const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
	const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	return hex.toUpperCase();
};

/** rgbaToHex(255, 153, 51, 1) */
export const rgbaToHex = ({ r, g, b, a }: { r: number; g: number; b: number; a?: number }) => {
	const hex = rgbToHex({ r, g, b });
	if (a == null || a === 1) return hex;
	const alphaHex = Math.round(a * 255)
		.toString(16)
		.padStart(2, '0')
		.toUpperCase();

	return hex + alphaHex;
};

const RGBToRGBA = (color: RGB, alpha: number) => {
	return {
		...color,
		a: roundToFourDecimals(alpha),
	};
};

export const colorTo255 = (color: RGBA) => {
	return [(color.r * 255) >> 0, (color.g * 255) >> 0, (color.b * 255) >> 0, roundToFourDecimals(color.a)];
};
export const colorTo255Object = (color: RGB | RGBA) => {
	if ('a' in color)
		return {
			r: (color.r * 255) >> 0,
			g: (color.g * 255) >> 0,
			b: (color.b * 255) >> 0,
			a: roundToFourDecimals(color.a),
		};

	return {
		r: (color.r * 255) >> 0,
		g: (color.g * 255) >> 0,
		b: (color.b * 255) >> 0,
		a: 1,
	};
};

const colorToCssRGBA = (color: RGBA) => {
	const arr = colorTo255(color);
	console.log('color:', arr, 'rgba(' + arr.join(',') + ')');
	return 'rgba(' + arr.join(',') + ')';
};

/**
 * 부호를 유지하면서 소수점 4자리까지 반올림
 * @param value
 * @returns
 */
function roundToFourDecimals(value: number) {
	return Number(Math.sign(value) * Number(Math.abs(value).toFixed(4)));
}

function calculateGradientDeg(matrix: Transform) {
	// 매트릭스의 요소 추출 및 반올림
	const m00 = roundToFourDecimals(matrix[0][0]);
	const m01 = roundToFourDecimals(matrix[0][1]);
	const m10 = roundToFourDecimals(matrix[1][0]);
	const m11 = roundToFourDecimals(matrix[1][1]);

	// 회전 각도 계산 (라디안)
	let angle = Math.atan2(m10, m00);

	// 라디안을 degree로 변환
	let degrees = angle * (180 / Math.PI);

	// 양수로만 조정하기 위한 + 360
	// CSS 그라디언트 각도로 조정 (시계 방향으로 90도 회전)
	degrees = (degrees + 90 + 360) % 360;

	// 최종 결과 반올림
	return roundToFourDecimals(degrees);
}

function getCSSColor(color: RGBA): string {
	// return colorToCssRGBA(color);
	return '#' + rgbaToHex(colorTo255Object(color));
}

function getGradientStop(stops: ReadonlyArray<ColorStop>): string {
	const colors = stops
		.map((stop) => {
			console.log(stop.position);
			const position = Math.round(stop.position * 100 * 100) / 100;
			// const color = getCSSColor(stop.color);
			const color = getCSSColor(stop.color);
			return color + ' ' + position + '%';
		})
		.join(', ');
	return colors;
}

export function cssGradient(paint: GradientPaint): string {
	const type = paint.type;
	const { gradientTransform, gradientStops } = paint;

	if (type === 'GRADIENT_RADIAL') {
		const a = 'radial-gradient(circle at 100%, #333, #333 50%, #eee 75%, #333 75%);';
		return 'radial-gradient';
	}
	if (type === 'GRADIENT_ANGULAR') {
		// 굉장히 다양한 방식으로 구성되고 그 구조가 메트릭을 기반으로 굉장히 효율적으로 표현되기 때문에
		// 메트릭의존도가 높은 것 같다
		// 위치 표현에 메트릭이 사용됨
		// return 'conic-gradient(from 45deg at 50% 50%, #f69d3c, 10deg, #3f87a6, 35deg, #ebf8e1);'
		return 'conic-gradient';
	}

	// 'GRADIENT_LINEAR' "GRADIENT_DIAMOND"

	const gradientTransformString = calculateGradientDeg(gradientTransform);
	const gradientStopString = getGradientStop(gradientStops);

	return `linear-gradient(${gradientTransformString}deg, ${gradientStopString})`;
}

const fillLinear = (colorChip: string) => {
	return `linear-gradient(${colorChip}, ${colorChip})`;
};

/** paintStyle 안에 paints가 Paint[]
 * 호출할 때 필터링 걸어서 빈 리스트느 안넘어온다
 *
 * 임 */
export const paintCheck = (paint: Paint, zero: boolean) => {
	// 가장 아래에 깔리는 객체는 일반 컬러여도 되고 해당 처리를 zero로 구분

	const result = {
		blend: paint.blendMode ?? '빈 블랜드 발생',
	};

	console.log('paintCheck:', paint, zero);
	const opacity = paint.opacity ?? 1;

	if (zero && paint.type === 'SOLID') {
		// 일반 컬러로 처리
		// const color = convert

		return {
			...result,
			background: colorToCssRGBA(RGBToRGBA(paint.color, opacity)),
		};
	} else if (paint.type === 'SOLID') {
		// 리니어 처리

		return {
			...result,
			background: fillLinear(colorToCssRGBA(RGBToRGBA(paint.color, opacity))),
		};
	} else if (paint.type.startsWith('GRADIENT_')) {
		return {
			...result,
			background: cssGradient(paint as GradientPaint),
		};
	} else {
		console.log('미구현');
		return {
			...result,
			background: '미구현',
		};
	}
};
