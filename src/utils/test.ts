// example.js
import {
	replaceTagNames,
	replaceTagsWithCondition,
	preserveXmlDeclaration,
	parseXmlToHierarchy,
	parseXmlToFlatStructure,
	convertFlatStructureToXml,
	convertPartialFlatStructureToXml,
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
}

// 계층 구조와 평탄화 구조 파싱 테스트를 위한 추가 함수
async function testXmlParsing() {
	try {
		// 더 복잡한 테스트용 XML
		const complexXml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
	<book id="bk101" category="소설">
		<author>홍길동</author>
		<title>한국 문학의 이해</title>
		<price currency="KRW">25000</price>
		<description>현대 한국 문학에 대한 종합적인 분석</description>
		<tags>
			<tag>소설</tag>
			<tag>한국문학</tag>
			<tag>현대문학</tag>
		</tags>
	</book>
	<book id="bk102" category="기술">
		<author>김개발</author>
		<title>프로그래밍 입문</title>
		<price currency="KRW">35000</price>
		<description>초보자를 위한 프로그래밍 가이드</description>
		<tags>
			<tag>프로그래밍</tag>
			<tag>입문서</tag>
		</tags>
	</book>
</catalog>`;

		console.log('복잡한 XML 계층 구조 파싱:');
		const hierarchyResult = await parseXmlToHierarchy(complexXml);
		console.log(JSON.stringify(hierarchyResult, null, 2));

		console.log('\n-----------------------------------\n');

		console.log('복잡한 XML 평탄화 구조 파싱:');
		const flatResult = await parseXmlToFlatStructure(complexXml);
		console.log(JSON.stringify(flatResult, null, 2));

		// 특정 데이터 접근 예시
		console.log('\n-----------------------------------\n');
		console.log('계층 구조에서 데이터 접근 예시:');
		if (hierarchyResult && hierarchyResult[0]?.tagName === 'catalog') {
			const books = hierarchyResult[0].children;
			console.log(`총 책 수: ${books?.length || 0}`);
			if (books && books.length > 0) {
				books.forEach((book: any, index: number) => {
					const title = book.children?.find((child: any) => child.tagName === 'title')?.text;
					const author = book.children?.find((child: any) => child.tagName === 'author')?.text;
					console.log(`책 ${index + 1}: "${title}" (저자: ${author})`);
				});
			}
		}

		console.log('\n-----------------------------------\n');
		console.log('평탄화 구조에서 데이터 접근 예시:');

		const bookTitles = flatResult.filter((item: any) => item.tagName === 'title');
		console.log('모든 책 제목:');
		bookTitles.forEach((titleItem: any, index: number) => {
			console.log(`${index + 1}. ${titleItem.text}`);
		});

		// 경로로 필터링 예시
		const tags = flatResult.filter((item: any) => item.path.includes('/tags/tag'));
		console.log('\n모든 태그:');
		tags.forEach((tag: any, index: number) => {
			console.log(`${index + 1}. ${tag.text}`);
		});
	} catch (error) {
		console.error('XML 파싱 테스트 중 오류 발생:', error);
	}
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

		// 3. 부분 구조 변환 테스트
		// 첫 번째 child 태그와 그 하위 태그만 변환
		const partialXml = convertPartialFlatStructureToXml(flatItems, 'parent/child');
		console.log('첫 번째 child 부분 구조 변환:');
		console.log(partialXml);
		console.log('\n-----------------------------------\n');

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
