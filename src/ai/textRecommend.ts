import { z } from 'zod';
import { GoogleProvider, GoogleProviderOptions } from './model';

// Schema for structured output
const textSchema = z.object({
	variableName: z.string(),
	normalizePoint: z.number(),
});

const prompt = `
텍스트를 보고 적절한 로컬라이제이션 변수명을 추천.
prefix는 변수명의 접두사로 사용될 것임으로 변수명에 포함되지 않게 구성.
글자는 전부 대문자로 쓰고 띄어쓰기는 _ 로 표현.
텍스트에 대한 변수명은 범용적으로 사용할 수 있도록 추천.
범용적으로 쓸 수 있는 수준을 정규화 점수는 0~100 사이의 숫자로 표현.
20, 40, 60, 80, 100 5개의 변수명을 추천할 것.

중복된 변수명을 추천하지 않을 것.

텍스트: {text}
접두사: {prefix}
이미 사용 중인 변수명: {duplicate}
`;

/**
 * 텍스트 추천 api
 * @param apiKey
 * @param text
 * @param prefix
 * @param duplicate
 * @returns ProviderResponse<Schema> 임 ProviderResponse에서 data : T[] 가 붙으므로 T만 추론하면 됨
 */
export async function textRecommend(apiKey: string, text: string, prefix: string = '', duplicate: string[] = []) {
	// Create a provider with initial API key
	const provider = new GoogleProvider({
		apiKey: apiKey,
		responseModalities: ['TEXT'],
		temperature: 0.8,
	});

	// Initialize with model ID
	provider.initialize({
		modelId: 'gemini-2.5-flash-preview-04-17',
	});

	try {
		// Generate structured output
		const response = await provider.generateObject(
			prompt.replace('{text}', text).replace('{prefix}', prefix).replace('{duplicate}', duplicate.join(',')),
			textSchema
			// Override temperature for this request
		);
		return response;
	} catch (error) {
		console.error('Error generating object:', error);
	}
}
