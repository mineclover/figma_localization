import { convertTag, unwrapTag, wrapTextWithTag } from '../utils/xml2'

describe('XML 태그 변환 테스트', () => {
	const xmlText2 = `태그 내용 1
	<b>태그 내용 5</b>
	태그 내용 2
  <c>태그 내용 6</c>
	헬로우`

	const xmlText3 = `<a>태그 내용 1</a>
	<b>태그 내용 5</b>
	<a>태그 내용 2</a>
  <c>태그 내용 6</c>
	<a>헬로우</a>`

	const xmlText4 = `<a>태그 내용 1</a><br/><b>태그 내용 5</b><br/><a>태그 내용 2</a><br/><c>태그 내용 6</c><br/><a>헬로우</a>`

	const normalizeXml = (xml: string) => xml.trim().replace(/\s+/g, ' ')

	describe('wrapTextWithTag', () => {
		it('일반 텍스트를 a 태그로 변환해야 함', async () => {
			const result = await wrapTextWithTag(xmlText2)
			expect(result).toMatch(/<a>태그 내용 1<\/a>/)
			expect(result).toMatch(/<a>태그 내용 2<\/a>/)
			expect(result).toMatch(/<a>헬로우<\/a>/)
			expect(result).toMatch(/<b>태그 내용 5<\/b>/)
			expect(result).toMatch(/<c>태그 내용 6<\/c>/)
		})

		it('일반 텍스트를 b 태그로 변환해야 함', async () => {
			const result = await wrapTextWithTag(xmlText2, 'b')
			expect(result).toMatch(/<b>태그 내용 1<\/b>/)
			expect(result).toMatch(/<b>태그 내용 2<\/b>/)
			expect(result).toMatch(/<b>헬로우<\/b>/)
			expect(result).toMatch(/<b>태그 내용 5<\/b>/)
			expect(result).toMatch(/<c>태그 내용 6<\/c>/)
		})

		it('br 태그를 추가해야 함', async () => {
			const result = await wrapTextWithTag(xmlText2, 'a', { addBrTags: true })
			const normalized = normalizeXml(result)
			expect(normalized).toBe(normalizeXml(xmlText4))

			// 세부 검증
			expect(result).toMatch(/<a>태그 내용 1<\/a><br\/>/)
			expect(result).toMatch(/<b>태그 내용 5<\/b><br\/>/)
			expect(result).toMatch(/<a>태그 내용 2<\/a><br\/>/)
			expect(result).toMatch(/<c>태그 내용 6<\/c><br\/>/)
			expect(result).toMatch(/<a>헬로우<\/a>/)
		})

		it('빈 문자열 처리가 가능해야 함', async () => {
			const result = await wrapTextWithTag('')
			expect(result).toBe('')
		})

		it('공백만 있는 텍스트는 무시해야 함', async () => {
			const input = '  \n  \t  '
			const result = await wrapTextWithTag(input)
			expect(normalizeXml(result)).toBe('')
		})
	})

	describe('unwrapTag', () => {
		it('a 태그를 일반 텍스트로 변환해야 함', async () => {
			const result = await unwrapTag(xmlText3)
			const normalized = normalizeXml(result)
			expect(normalized).toContain('태그 내용 1')
			expect(normalized).toContain('헬로우')
			expect(normalized).toContain('태그 내용 2')
			expect(normalized).toContain('<b>태그 내용 5</b>')
			expect(normalized).toContain('<c>태그 내용 6</c>')
		})

		it('b 태그를 일반 텍스트로 변환해야 함', async () => {
			const result = await unwrapTag(xmlText3, 'b')
			const normalized = normalizeXml(result)
			expect(normalized).toContain('<a>태그 내용 1</a>')
			expect(normalized).toContain('태그 내용 5')
			expect(normalized).toContain('<c>태그 내용 6</c>')
		})

		it('다른 태그는 변경되지 않아야 함', async () => {
			const result = await unwrapTag(xmlText3)
			expect(result).toMatch(/<b>태그 내용 5<\/b>/)
			expect(result).toMatch(/<c>태그 내용 6<\/c>/)
		})
	})

	describe('convertTag', () => {
		it('a 태그를 b 태그로 변환해야 함', async () => {
			const result = await convertTag(xmlText3, 'a', 'b')
			expect(result).not.toMatch(/<a>/)
			expect(result).toMatch(/<b>태그 내용 1<\/b>/)
			expect(result).toMatch(/<b>태그 내용 2<\/b>/)
			expect(result).toMatch(/<b>헬로우<\/b>/)
		})

		it('태그 내용과 속성을 유지해야 함', async () => {
			const xml = '<a attr="test">내용</a>'
			const result = await convertTag(xml, 'a', 'b')
			expect(result).toBe('<b attr="test">내용</b>')
		})
	})
})
