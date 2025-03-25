// xml-tag-replacer.js
import { Parser } from 'htmlparser2';
import { DomHandler } from 'domhandler';
import * as domutils from 'domutils';
import render from 'dom-serializer';

/**
 * XML 문자열에서 특정 태그 이름을 변경합니다.
 * @param {string} xmlString - 처리할 XML 문자열
 * @param {string} oldTagName - 변경할 태그 이름
 * @param {string} newTagName - 새로운 태그 이름
 * @returns {Promise<string>} 변경된 XML 문자열
 */
export function replaceTagNames(xmlString: string, oldTagName: string, newTagName: string) {
	return new Promise<string>((resolve, reject) => {
		const handler = new DomHandler((error, dom) => {
			if (error) {
				reject(error);
				return;
			}

			// 지정된 태그 찾기
			const tagsToRename = domutils.findAll((elem) => elem.type === 'tag' && elem.name === oldTagName, dom);

			// 찾은 태그의 이름 변경
			tagsToRename.forEach((tag) => {
				tag.name = newTagName;
			});

			// 변경된 DOM을 XML 문자열로 변환
			const result = render(dom, {
				xmlMode: true,
				decodeEntities: false,
			});

			resolve(result);
		});

		const parser = new Parser(handler, {
			xmlMode: true,
			decodeEntities: false,
		});

		parser.write(xmlString);
		parser.end();
	});
}

/**
 * 특정 조건을 만족하는 태그만 변경합니다.
 * @param {string} xmlString - 처리할 XML 문자열
 * @param {string} oldTagName - 변경할 태그 이름
 * @param {string} newTagName - 새로운 태그 이름
 * @param {Function} condition - 조건 함수 (태그 요소를 인자로 받고 boolean 반환)
 * @returns {Promise<string>} 변경된 XML 문자열
 */
export function replaceTagsWithCondition(
	xmlString: string,
	oldTagName: string,
	newTagName: string,
	condition: (elem: any) => boolean
) {
	return new Promise<string>((resolve, reject) => {
		const handler = new DomHandler((error, dom) => {
			if (error) {
				reject(error);
				return;
			}

			// 조건을 만족하는 태그 찾기
			const tagsToRename = domutils.findAll(
				(elem) => elem.type === 'tag' && elem.name === oldTagName && condition(elem),
				dom
			);

			// 찾은 태그의 이름 변경
			tagsToRename.forEach((tag) => {
				tag.name = newTagName;
			});

			// 변경된 DOM을 XML 문자열로 변환
			const result = render(dom, {
				xmlMode: true,
				decodeEntities: false,
			});

			resolve(result);
		});

		const parser = new Parser(handler, {
			xmlMode: true,
			decodeEntities: false,
		});
		// 모델 처리 랑 비슷함
		parser.write(xmlString);
		parser.end();
	});
}

/**
 * XML 선언부를 보존합니다.
 * @param {string} originalXml - 원본 XML 문자열
 * @param {string} transformedXml - 변환된 XML 문자열
 * @returns {string} XML 선언부가 보존된 XML 문자열
 */
export function preserveXmlDeclaration(originalXml: string, transformedXml: string) {
	// originalXml 에서 xml 선언이 있었으면 그것을 넣어서 리턴
	const xmlDeclMatch = originalXml.match(/^<\?xml[^?]*\?>/);
	if (xmlDeclMatch) {
		return xmlDeclMatch[0] + transformedXml;
	}
	// 없으면 그냥 리턴
	return transformedXml;
}
