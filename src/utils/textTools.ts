import { StyleHashSegment, StyleSync } from '@/model/types';

export const safeNumberConversion = (input: string) => {
	// 입력이 문자열이 아니면 그대로 반환
	if (typeof input !== 'string') {
		return input;
	}

	// 문자열이 숫자로만 구성되어 있는지 확인 (양수, 음수, 소수점 허용)
	const numberRegex = /^-?\d+(\.\d+)?$/;

	if (numberRegex.test(input)) {
		// 숫자로만 구성된 경우, Number 함수를 사용하여 변환
		return Number(input);
	} else {
		// 숫자가 아닌 문자가 포함된 경우, 원래 문자열 반환
		return input;
	}
};

/** input이 숫자로 바꿨을 때 숫자면 true */
export const typeofNumber = (input: string) => {
	return typeof safeNumberConversion(input) === 'number';
};

// -_ 잡아서 스플릿해서 파스칼로
export const pascal = (text: string) =>
	text
		.split(/[-_]/) // 수정: - 또는 _로 스플릿
		.map((t, index) => {
			return t.charAt(0).toUpperCase() + t.slice(1);
			return t;
		})
		.join('');

// -_ 잡아서 스플릿해서 카멜로 수정
export const camel = (text: string) =>
	text
		.split(/[-_]/) // 수정: - 또는 _로 스플릿
		.map((t, index) => {
			if (index > 0) return t.charAt(0).toUpperCase() + t.slice(1);
			return t;
		})
		.join('');

/** svg-color-1 이 들어왔을 때, s */
export const varToName = (input: string) => {
	return input.split('-').slice(1).join('');
};

/** 랜덤 텍스트 */
export function generateRandomText(length: number) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const encodeNumber = (num: number) => {
	let binary = Number(num).toString(2);
	while (binary.length % 6 !== 0) {
		binary = '0' + binary;
	}
	let base64 = '';
	for (let i = 0; i < binary.length; i += 6) {
		let sixBits = binary.slice(i, i + 6);
		let index = parseInt(sixBits, 2);
		base64 += BASE64_CHARS[index];
	}
	return base64;
};

export const generateRandomText2 = () => {
	const date = Date.now();
	return generateRandomText(3) + encodeNumber(date);
};

/**
 * 문자열 시작 부분의 # 또는 @ 문자를 모두 제거
 * @param text
 * @returns
 */
export const removeLeadingSymbols = (text: string) => {
	// 정규식을 사용하여 문자열 시작 부분의 # 또는 @ 문자, 등록 식별 심볼을 모두 제거
	return text.replace(/^[#@❎✅]+/, '');
};

export const keyConventionRegex = (text: string) => {
	const trimmed = text.trim().replace(/[^a-zA-Z0-9_]/g, '');
	// 첫 글자가 숫자인 경우 '_'를 앞에 추가
	return /^\d/.test(trimmed) ? '_' + trimmed : trimmed;
};

export const generateXmlString = (styles: StyleSync[], tag: 'id' | 'name', effectStyle: Omit<StyleSync, 'ranges'>) => {
	// 모든 스타일 정보를 위치별로 정렬
	const allRanges: Array<StyleHashSegment> = [];

	const effectTag = effectStyle[tag];

	styles.forEach((style) => {
		if (style.ranges) {
			style.ranges.forEach((range) => {
				// 시작 태그 정보
				allRanges.push({
					id: style.id ?? '',
					name: style.name ?? '',
					total: range.end + range.start,
					text: range.text,
					hashId: style.hashId,
					styles: style.style,
				});
			});
		}
	});

	// 위치에 따라 정렬 (시작 위치가 같으면 닫는 태그가 먼저 오도록)
	allRanges.sort((a, b) => {
		return a.total - b.total;
	});

	return allRanges
		.map((item) => {
			console.log('🚀 ~ .map ~ item effectTag:', item, effectTag);
			const addTag = effectTag + ':' + item[tag];

			return `<${addTag}>${item.text}</${addTag}>`;
		})

		.join('');
};

type LocalizationVariable = {
	variable: string;
	content: string;
	name: string;
};

/**
 * 텍스트에서 {.(.*)} 패턴만 찾는 파서
 * 내부 중괄호를 포함한 전체 내용을 콘텐츠로 취급하고, 정리된 name 필드 추가
 * @param {string} text - 파싱할 텍스트
 * @returns {Object} - 파싱 결과 (성공 여부, 값 또는 오류 메시지)
 */
export const parseLocalizationVariables = (text: string) => {
	// 결과를 저장할 배열
	const results = {} as Record<string, LocalizationVariable>;
	// 오류 메시지를 저장할 배열
	const errors = [];

	// 텍스트를 순회하면서 파싱
	let i = 0;

	while (i < text.length) {
		// 최상위 레벨의 { 문자를 찾음 (중첩된 중괄호의 시작이 아닌)
		if (text[i] === '{' && (i === 0 || text[i - 1] !== '{')) {
			const startIndex = i;
			let depth = 1; // 중괄호 깊이 추적
			let j = i + 1;

			// 같은 깊이의 닫는 } 를 찾을 때까지 진행
			while (j < text.length && depth > 0) {
				if (text[j] === '{') {
					depth++;
				} else if (text[j] === '}') {
					depth--;
				}
				j++;
			}

			// 중괄호가 제대로 닫혔는지 확인
			if (depth > 0) {
				errors.push(`오류: 닫는 중괄호가 없습니다. 위치: ${startIndex}`);
				i = j;
				continue;
			}

			// 외부 중괄호 전체를 변수로 추출
			const variable = text.substring(startIndex, j);
			// 중괄호 내부 내용을 콘텐츠로 추출 (내부 중괄호 포함)
			const content = text.substring(startIndex + 1, j - 1);

			// 내용에서 특수 문자를 제거한 name 필드 생성
			const name = content.replace(/[{}\s]/g, ''); // 중괄호와 공백 제거

			results[name] = {
				variable, // 원본 변수 (예: "{a{b}c}")
				content, // 내부 내용 (예: "a{b}c")
				name, // 특수 문자가 제거된 버전 (예: "abc")
			};

			i = j;
		} else {
			i++;
		}
	}

	return {
		success: true,
		variables: results,
		errors: errors,
	};
};

// 템플릿에서 변수를 대체하는 함수
export const applyLocalization = (template: string, variables: Record<string, string>, useNameField = false) => {
	let result = template;

	// 템플릿에서 변수 파싱
	const parseResult = parseLocalizationVariables(template);

	// 각 변수를 대체
	Object.values(parseResult.variables).forEach((variable) => {
		// useNameField가 true이면 name 필드를 사용하고, 아니면 content 필드를 사용
		const variableName = useNameField ? variable.name : variable.content;

		if (variables[variableName] !== undefined) {
			// split과 join을 사용하여 replaceAll 구현
			result = result.split(variable.variable).join(variables[variableName]);
		} else if (useNameField && variables[variable.content] !== undefined) {
			// name으로 찾지 못했을 경우 content로 한번 더 시도
			result = result.split(variable.variable).join(variables[variable.content]);
		}
	});

	return result;
};

// 로컬라이제이션 적용 테스트
// console.log("로컬라이제이션 적용 전:", template);
// console.log("로컬라이제이션 적용 후:", applyLocalization(template, variables));
