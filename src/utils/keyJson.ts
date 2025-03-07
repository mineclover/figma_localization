/**
 * 객체의 속성을 안정적으로 정렬하여 일관된 해시 키를 생성하는 함수
 *
 * @param {Object} styleObj - 키로 변환할 스타일 객체
 * @returns {string} 안정적인 해시 키
 */
export function createStableStyleKey(styleObj: Record<string, any>): string {
	// 기본 타입 처리
	if (styleObj === null || typeof styleObj !== 'object') {
		return String(styleObj)
	}

	// 배열 처리
	if (Array.isArray(styleObj)) {
		return '[' + styleObj.map(createStableStyleKey).join(',') + ']'
	}

	// 객체 처리: 키를 알파벳 순으로 정렬하고 값 직렬화
	const sortedKeys = Object.keys(styleObj).sort()
	return (
		'{' +
		sortedKeys
			.map((key) => {
				const value = styleObj[key]
				return key + ':' + createStableStyleKey(value)
			})
			.join(',') +
		'}'
	)
}
