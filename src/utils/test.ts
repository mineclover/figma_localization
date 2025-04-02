// example.js
import {
	replaceTagNames,
	replaceTagsWithCondition,
	preserveXmlDeclaration,
	parseXmlToHierarchy,
	parseXmlToFlatStructure,
	convertFlatStructureToXml,
	toggleATagAndText,
} from './xml2';

// 테스트용 XML 문자열
// const xmlText = `<root>
//   <a>태그 내용 1</a>
// 	<other>
// 		<a>태그 내용 2</a>
// 	</other>
// 	<a attr="값">태그 내용 3</a>
// 	<a attr="다른값">태그 내용 4</a>
//   <b>태그 내용 5</b>
//   <c>태그 내용 6</c>
// </root>`;

const xmlText = `<a>태그 내용 1</a>
	<other>
		<a>태그 내용 2</a>
	</other>
	<a attr="값">태그 내용 3</a>
	<a attr="다른값">태그 내용 4</a>
  <b>태그 내용 5</b>
  <c>태그 내용 6</c>`;

const xmlText2 = `태그 내용 1
	<b>태그 내용 5</b>
  <c>태그 내용 6</c>
	헬로우`;

const xmlText3 = `<a>태그 내용 1</a>
	<b>태그 내용 5</b>
  <c>태그 내용 6</c>
	<a>태그 내용 1</a>`;

export async function runExample() {
	try {
		// 예제 1: 단순히 모든 'a' 태그를 'b' 태그로 변경
		const result1 = await replaceTagNames(xmlText, 'a', 'b');
		console.log('모든 태그 변경 결과:');
		console.log(preserveXmlDeclaration(xmlText, result1));

		console.log('\n-----------------------------------\n');

		// 예제 2: 특정 속성을 가진 'a' 태그만 'c' 태그로 변경
		const result2 = await replaceTagsWithCondition(xmlText, 'a', 'c', (elem) => {
			return elem.attribs && elem.attribs.attr === '값';
		});

		console.log('조건부 태그 변경 결과:');
		console.log(preserveXmlDeclaration(xmlText, result2));

		console.log('\n-----------------------------------\n');

		// 예제 3: XML을 계층 구조 객체로 파싱
		const hierarchyResult = await parseXmlToHierarchy(xmlText);
		console.log('계층 구조 파싱 결과:');
		console.log(JSON.stringify(hierarchyResult, null, 2));

		console.log('\n-----------------------------------\n');

		// 예제 4: XML을 평탄화된 구조로 파싱
		const flatResult = await parseXmlToFlatStructure(xmlText);
		console.log('평탄화 구조 파싱 결과:');
		console.log(JSON.stringify(flatResult, null, 2));
	} catch (error) {
		console.error('오류 발생:', error);
	}
	// testXmlParsing();
	// 새 테스트 함수 호출
	testFlatStructureToXmlConversion(xmlText);

	// 새로운 테스트 실행
	console.log('\n=== XML 태그 변환 테스트 ===\n');
	await testToggleATagAndText();
}

// 평탄화 구조 <-> XML 변환 테스트 함수
export async function testFlatStructureToXmlConversion(testXml: string) {
	try {
		// 테스트할 XML 문자열

		console.log('원본 XML:');
		console.log(testXml);
		console.log('\n-----------------------------------\n');

		// 1. XML을 평탄화 구조로 변환
		const flatItems = await parseXmlToFlatStructure(testXml);
		console.log('평탄화 구조:');
		console.log(JSON.stringify(flatItems, null, 2));
		console.log('\n-----------------------------------\n');

		// 2. 평탄화 구조를 다시 XML로 변환
		const regeneratedXml = convertFlatStructureToXml(flatItems);

		console.log('다시 변환된 XML:');
		console.log(regeneratedXml);
		console.log('\n-----------------------------------\n');

		console.log('🚀 ~ testFlatStructureToXmlConversion ~ flatItems:', flatItems);
		// 3. 부분 구조 변환 테스트
		// 첫 번째 child 태그와 그 하위 태그만 변환

		// 4. 데이터 수정 후 변환 테스트
		console.log('데이터 수정 후 변환 테스트:');
		// 특정 태그의 텍스트 내용 변경
		const modifiedItems = flatItems.map((item) => {
			if (item.path === 'parent/child/grandchild' && item.text === '내용 1') {
				return { ...item, text: '수정된 내용' };
			}
			return item;
		});

		const modifiedXml = convertFlatStructureToXml(modifiedItems);
		console.log('수정된 XML:');
		console.log(modifiedXml);
		console.log('\n-----------------------------------\n');

		// 5. 새 노드 추가 테스트
		const newItems = [...flatItems];
		// 마지막 순서 값 찾기
		const lastOrder = Math.max(...newItems.map((item) => item.order));

		// 새 항목 추가
		newItems.push({
			path: 'parent/newChild',
			tagName: 'newChild',
			depth: 1,
			order: lastOrder + 1,
			// order: 1,
			siblingIndex: 2,
			attributes: { type: '새로운' },
			text: '새로 추가된 태그',
		});

		const xmlWithNewNode = convertFlatStructureToXml(newItems);
		console.log('새 노드 추가된 XML:');
		console.log(xmlWithNewNode);
	} catch (error) {
		console.error('XML 변환 테스트 중 오류 발생:', error);
	}
}

// XML 변환 테스트 함수
export async function testToggleATagAndText() {
	try {
		console.log('원본 XML (xmlText2):');
		console.log(xmlText2);
		console.log('\n-----------------------------------\n');

		// xmlText2 -> xmlText3 변환 테스트
		const result1 = await toggleATagAndText(xmlText2);
		console.log('xmlText2 -> xmlText3 변환 결과:');
		console.log(result1);
		console.log('\n-----------------------------------\n');

		// xmlText3 -> xmlText2 변환 테스트
		const result2 = await toggleATagAndText(xmlText3);
		console.log('xmlText3 -> xmlText2 변환 결과:');
		console.log(result2);
		console.log('\n-----------------------------------\n');

		// 변환 결과 검증
		const expectedXmlText3 = xmlText3.trim().replace(/\s+/g, ' ');
		const expectedXmlText2 = xmlText2.trim().replace(/\s+/g, ' ');

		const normalizedResult1 = result1.trim().replace(/\s+/g, ' ');
		const normalizedResult2 = result2.trim().replace(/\s+/g, ' ');

		console.log('검증 결과:');
		console.log('xmlText2 -> xmlText3 변환 성공:', normalizedResult1 === expectedXmlText3);
		console.log('xmlText3 -> xmlText2 변환 성공:', normalizedResult2 === expectedXmlText2);
	} catch (error) {
		console.error('XML 변환 테스트 중 오류 발생:', error);
	}
}
