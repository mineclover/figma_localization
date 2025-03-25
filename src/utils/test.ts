// example.js
import { replaceTagNames, replaceTagsWithCondition, preserveXmlDeclaration } from './xml2';

// 테스트용 XML 문자열
const xmlText = `<root>
  <a>태그 내용 1</a>
  <other>
    <a>태그 내용 2</a>
  </other>
  <a attr="값">태그 내용 3</a>
  <a attr="다른값">태그 내용 4</a>
</root>`;

export async function runExample() {
	try {
		// 예제 1: 단순히 모든 'a' 태그를 'b' 태그로 변경
		const result1 = await replaceTagNames(xmlText, 'a', 'b');
		console.log('모든 태그 변경 결과:');
		console.log(preserveXmlDeclaration(xmlText, result1));

		console.log('\n-----------------------------------\n');

		// 예제 2: 특정 속성을 가진 'a' 태그만 'c' 태그로 변경
		const result2 = await replaceTagsWithCondition(
			xmlText,
			'a',
			'c',
			(elem) => elem.attribs && elem.attribs.attr === '값'
		);
		console.log('조건부 태그 변경 결과:');
		console.log(preserveXmlDeclaration(xmlText, result2));
	} catch (error) {
		console.error('오류 발생:', error);
	}
}
