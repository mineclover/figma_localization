import { toggleATagAndText } from '../utils/xml2';

describe('XML 태그 변환 테스트', () => {
	const xmlText2 = `태그 내용 1
	<b>태그 내용 5</b>
	태그 내용 2
  <c>태그 내용 6</c>
	헬로우`;

	const xmlText3 = `<a>태그 내용 1</a>
	<b>태그 내용 5</b>
	<a>태그 내용 2</a>
  <c>태그 내용 6</c>
	<a>헬로우</a>`;

	const normalizeXml = (xml: string) => xml.trim().replace(/\s+/g, ' ');

	describe('toggleATagAndText', () => {
		it('일반 텍스트를 a 태그로 변환해야 함', async () => {
			const result = await toggleATagAndText(xmlText2);
			expect(result).toMatch(/<a>태그 내용 1<\/a>/);
			expect(result).toMatch(/<a>태그 내용 2<\/a>/);
			expect(result).toMatch(/<a>헬로우<\/a>/);
			expect(result).toMatch(/<b>태그 내용 5<\/b>/);
			expect(result).toMatch(/<c>태그 내용 6<\/c>/);
		});

		it('a 태그를 일반 텍스트로 변환해야 함', async () => {
			const result = await toggleATagAndText(xmlText3);
			const normalized = normalizeXml(result);
			expect(normalized).toContain('태그 내용 1');
			expect(normalized).toContain('헬로우');
			expect(normalized).toContain('태그 내용 2');
			expect(normalized).toContain('<b>태그 내용 5</b>');
			expect(normalized).toContain('<c>태그 내용 6</c>');
		});

		it('b와 c 태그는 변경되지 않아야 함', async () => {
			const result1 = await toggleATagAndText(xmlText2);
			const result2 = await toggleATagAndText(xmlText3);

			expect(result1).toMatch(/<b>태그 내용 5<\/b>/);
			expect(result1).toMatch(/<c>태그 내용 6<\/c>/);
			expect(result2).toMatch(/<b>태그 내용 5<\/b>/);
			expect(result2).toMatch(/<c>태그 내용 6<\/c>/);
		});

		it('빈 문자열 처리가 가능해야 함', async () => {
			const result = await toggleATagAndText('');
			expect(result).toBe('');
		});

		it('공백만 있는 텍스트는 무시해야 함', async () => {
			const input = '  \n  \t  ';
			const result = await toggleATagAndText(input);
			expect(normalizeXml(result)).toBe('');
		});
	});
});
