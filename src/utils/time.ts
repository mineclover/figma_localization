/**
 * 저장된 시간과 현재 시간을 비교해서 경과 시간을 문자열로 반환하는 함수
 * @param {Date|string|number} savedTime - 저장된 시간 (Date 객체, ISO 문자열, 또는 타임스탬프)
 * @return {string} 경과 시간을 나타내는 문자열 (예: "5초 전", "3분 전", "2시간 전" 등)
 */
export function getTimeAgo(savedTime: Date | string | number) {
	// savedTime을 Date 객체로 변환
	const savedDate = savedTime instanceof Date ? savedTime : new Date(savedTime);

	// 현재 시간
	const currentDate = new Date();

	// 두 시간의 차이(밀리초)
	const timeDiff = currentDate.getTime() - savedDate.getTime();

	// 밀리초를 초로 변환
	const secondsDiff = Math.floor(timeDiff / 1000);

	// 1분 미만인 경우
	if (secondsDiff < 60) {
		return `${secondsDiff}초 전`;
	}

	// 1시간 미만인 경우
	const minutesDiff = Math.floor(secondsDiff / 60);
	if (minutesDiff < 60) {
		return `${minutesDiff}분 전`;
	}

	// 1일 미만인 경우
	const hoursDiff = Math.floor(minutesDiff / 60);
	if (hoursDiff < 24) {
		return `${hoursDiff}시간 전`;
	}

	// 1개월 미만인 경우
	const daysDiff = Math.floor(hoursDiff / 24);
	if (daysDiff < 30) {
		return `${daysDiff}일 전`;
	}

	// 1년 미만인 경우
	const monthsDiff = Math.floor(daysDiff / 30);
	if (monthsDiff < 12) {
		return `${monthsDiff}개월 전`;
	}

	// 1년 이상인 경우
	const yearsDiff = Math.floor(monthsDiff / 12);
	return `${yearsDiff}년 전`;
}
