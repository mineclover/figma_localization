// xml-tag-replacer.js
import { Parser } from 'htmlparser2';
import { DomHandler } from 'domhandler';
import * as domutils from 'domutils';
import render from 'dom-serializer';
import { XmlFlatNode, XmlFlatStructure, XmlHierarchy } from './types';
import { Element, ChildNode } from 'domhandler';

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
	condition: (elem: Element) => boolean
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
	// 보통 최상단에 있음
	const xmlDeclMatch = originalXml.match(/^<\?xml[^?]*\?>/);
	if (xmlDeclMatch) {
		return xmlDeclMatch[0] + transformedXml;
	}
	// 없으면 그냥 리턴
	return transformedXml;
}

/**
 * XML 문자열을 트리 계층 구조 객체로 변환합니다.
 * @param {string} xmlString - 처리할 XML 문자열
 * @returns {Promise<XmlHierarchy>} XML의 계층 구조 객체
 */
export function parseXmlToHierarchy(xmlString: string): Promise<XmlHierarchy> {
	return new Promise((resolve, reject) => {
		const handler = new DomHandler((error, dom) => {
			if (error) {
				reject(error);
				return;
			}

			// DOM을 계층 구조 객체로 변환
			const result = domToHierarchy(dom);
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
 * DOM 요소를 트리 계층 구조 객체로 변환하는 헬퍼 함수
 * @param {any} dom - DOM 요소 또는 요소 배열
 * @returns {any} 변환된 계층 구조 객체
 */
function domToHierarchy(dom: any): any {
	if (Array.isArray(dom)) {
		return dom.map(domToHierarchy).filter((item) => item !== null);
	}

	if (dom.type === 'text') {
		return dom.data.trim() === '' ? null : dom.data.trim();
	}

	if (dom.type === 'tag') {
		const result: any = {
			tagName: dom.name,
			attributes: dom.attribs || {},
		};

		const children = domToHierarchy(dom.children);

		if (Array.isArray(children)) {
			if (children.length === 1 && typeof children[0] === 'string') {
				result.text = children[0];
			} else if (children.length > 0) {
				result.children = children;
			}
		}

		return result;
	}

	return null;
}

/**
 * DOM 요소를 평탄화하는 헬퍼 함수 (순서 정보 포함)
 * @param {ChildNode} dom - DOM 요소 또는 요소 배열
 * @param {string} path - 현재 요소의 경로
 * @param {Array<XmlFlatNode>} result - 결과를 저장할 배열
 * @param {number} depth - 현재 깊이
 * @param {number} siblingIndex - 형제 요소 중 인덱스
 */
function flattenDom(
	dom: ChildNode[] | ChildNode,
	path: string,
	result: Array<XmlFlatNode>,
	depth: number = 0,
	siblingIndex: number = 0
): void {
	if (Array.isArray(dom)) {
		dom.forEach((item, index) => {
			flattenDom(item, path, result, depth, index);
		});
		return;
	}

	// 처리를 외부로 빼면 문제 생김
	if (dom.type === 'text') {
		const item: XmlFlatNode = {
			path: path,
			tagName: path,
			depth: depth,
			order: result.length,
			siblingIndex: siblingIndex,
			attributes: {},
			text: dom.data.trim(),
		};

		result.push(item);
	}

	if (dom.type === 'tag') {
		const currentPath = path ? `${path}/${dom.name}` : dom.name;

		const item: any = {
			path: currentPath,
			tagName: dom.name,
			depth: depth, // 깊이 정보 추가
			order: result.length, // 전체 순서
			siblingIndex: siblingIndex, // 형제 간 순서
			attributes: dom.attribs || {},
		};

		result.push(item);

		// 자식 요소 처리

		dom.children.forEach((child: ChildNode, index: number) => {
			flattenDom(child, currentPath, result, depth + 1, index);
		});
	}
}

/**
 * XML 문자열을 순서가 보장된 평탄화 구조로 변환합니다.
 * @param {string} xmlString - 처리할 XML 문자열
 * @param {boolean} sortByOriginalOrder - 원래 순서대로 정렬할지 여부
 * @returns {Promise<Array<XmlFlatNode>>} 평탄화된 XML 구조 배열
 */
export function parseXmlToFlatStructure(
	xmlString: string,
	sortByOriginalOrder: boolean = true
): Promise<Array<XmlFlatNode>> {
	return new Promise((resolve, reject) => {
		const handler = new DomHandler((error, dom) => {
			if (error) {
				reject(error);
				return;
			}

			const flatItems: Array<XmlFlatNode> = [];
			flattenDom(dom, '', flatItems);

			// 원래 순서대로 정렬 (이미 순서대로 추가되었기 때문에 기본적으로는 필요 없음)
			if (sortByOriginalOrder) {
				flatItems.sort((a, b) => a.order - b.order);
			}

			resolve(flatItems);
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
 * 평탄화된 XML 구조를 XML 문자열로 변환합니다.
 * @param {XmlFlatStructure} flatItems - 평탄화된 XML 구조 배열
 * @returns {string} XML 문자열
 */
export function convertFlatStructureToXml(flatItems: XmlFlatStructure): string {
	// 원본 순서대로 정렬
	flatItems.sort((a, b) => a.order - b.order);

	// 계층 구조 재구성을 위한 맵
	const nodeMap = new Map<string, any>();
	const rootNodes: any[] = [];

	// 먼저 모든 노드 생성
	flatItems.forEach((item) => {
		const node = {
			tagName: item.tagName,
			attributes: item.attributes || {},
			children: [],
			text: item.text || null,
			order: item.order, // 원본 순서 보존
		};

		nodeMap.set(`${item.path}_${item.order}`, node); // 경로와 순서로 고유키 생성

		// 루트 노드 저장
		if (!item.path.includes('/')) {
			rootNodes.push(node);
		}
	});

	// 부모-자식 관계 설정
	flatItems.forEach((item) => {
		if (item.path.includes('/')) {
			const pathParts = item.path.split('/');
			const currentTagName = pathParts.pop(); // 현재 노드 이름 제거
			const parentPath = pathParts.join('/');

			// 부모의 고유 키를 찾기
			const parentNodeEntries = Array.from(nodeMap.entries())
				.filter(([key, _]) => key.startsWith(`${parentPath}_`))
				.sort(([_, nodeA], [__, nodeB]) => nodeA.order - nodeB.order);

			// 가장 가까운 상위 부모 찾기 (현재 노드보다 앞에 있는 가장 마지막 부모)
			const closestParentEntry = parentNodeEntries.filter(([_, node]) => node.order < item.order).pop();

			if (closestParentEntry) {
				const parentNode = closestParentEntry[1];
				const currentNode = nodeMap.get(`${item.path}_${item.order}`);

				if (parentNode && currentNode) {
					parentNode.children.push(currentNode);
				}
			}
		}
	});

	// 모든 루트 노드를 XML 문자열로 변환하여 연결
	return rootNodes
		.sort((a, b) => a.order - b.order) // 원본 순서대로 정렬
		.map((node) => nodeToXmlString(node))
		.join('');
}

/**
 * 노드 객체를 XML 문자열로 변환하는 헬퍼 함수
 * @param {any} node - 변환할 노드 객체
 * @returns {string} XML 문자열
 */
function nodeToXmlString(node: any): string {
	if (!node) return '';

	// 태그 시작 부분 생성
	let xml = `<${node.tagName}`;

	// 속성 추가
	for (const [key, value] of Object.entries(node.attributes)) {
		xml += ` ${key}="${value}"`;
	}

	// 닫는 태그 또는 내용 추가
	if (node.children.length === 0 && !node.text) {
		// 자식 노드와 텍스트가 없는 경우
		xml += ' />';
	} else {
		xml += '>';

		// 텍스트 추가
		if (node.text) {
			xml += node.text;
		}

		// 자식 노드 추가
		node.children.forEach((child: any) => {
			xml += nodeToXmlString(child);
		});

		// 닫는 태그
		xml += `</${node.tagName}>`;
	}

	return xml;
}

/**
 * 일반 텍스트를 지정된 태그로 감쌉니다.
 * @param {string} xmlString - 처리할 XML 문자열
 * @param {string} tagName - 감쌀 태그 이름 (기본값: 'a')
 * @param {Object} options - 변환 옵션
 * @param {boolean} options.addBrTags - 각 태그 뒤에 br 태그를 추가할지 여부
 * @returns {Promise<string>} 변환된 XML 문자열
 */
export function wrapTextWithTag(
	xmlString: string,
	tagName: string = 'a',
	options: { addBrTags?: boolean } = {}
): Promise<string> {
	return new Promise((resolve, reject) => {
		const handler = new DomHandler((error, dom) => {
			if (error) {
				reject(error);
				return;
			}

			// 텍스트 노드를 지정된 태그로 변환
			const result = dom.map((node: any) => {
				if (node.type === 'text') {
					const trimmedText = node.data.trim();
					if (trimmedText !== '') {
						return {
							type: 'tag',
							name: tagName,
							attribs: {},
							children: [{ type: 'text', data: trimmedText }],
						};
					}
					// 줄바꿈만 유지하고 다른 공백은 제거
					const hasNewline = /\n/.test(node.data);
					return hasNewline ? { type: 'text', data: '\n' } : null;
				}
				return node;
			});

			// null 노드 제거
			const filteredResult = result.filter((node: any) => node !== null);

			if (options.addBrTags) {
				// br 태그 추가
				const resultWithBr: any[] = [];
				const lastIndex = filteredResult.length - 1;

				filteredResult.forEach((node: any, index: number) => {
					resultWithBr.push(node);
					if (index !== lastIndex) {
						resultWithBr.push({
							type: 'tag',
							name: 'br',
							attribs: {},
							children: [],
						});
					}
				});

				resolve(render(resultWithBr, { xmlMode: true, decodeEntities: false }));
			} else {
				resolve(render(filteredResult, { xmlMode: true, decodeEntities: false }));
			}
		});
		const parser = new Parser(handler, { xmlMode: true, decodeEntities: false });

		parser.write(xmlString);
		parser.end();
	});
}

/**
 * 지정된 태그를 일반 텍스트로 변환합니다. a > text
 * @param {string} xmlString - 처리할 XML 문자열
 * @param {string} tagName - 변환할 태그 이름 (기본값: 'a')
 * @returns {Promise<string>} 변환된 XML 문자열
 */
export function unwrapTag(xmlString: string, tagName: string = 'a'): Promise<string> {
	return new Promise((resolve, reject) => {
		const handler = new DomHandler((error, dom) => {
			if (error) {
				reject(error);
				return;
			}

			// 지정된 태그를 텍스트로 변환
			const result = dom.map((node: any, index: number) => {
				if (node.type === 'tag' && node.name === tagName) {
					const textContent = domutils.textContent(node).trim();
					// 이전 노드가 줄바꿈을 포함하는지 확인
					const prevNode = dom[index - 1];
					const hasNewlineBefore = prevNode?.type === 'text' && /\n/.test(prevNode.data);

					return { type: 'text', data: hasNewlineBefore ? '\n' + textContent : textContent };
				}
				return node;
			});

			// null 노드 제거
			const filteredResult = result.filter((node: any) => node !== null);
			resolve(render(filteredResult, { xmlMode: true, decodeEntities: false }));
		});

		const parser = new Parser(handler, { xmlMode: true, decodeEntities: false });
		const brString = xmlString.replace(/<br\/>/g, '\n');
		parser.write(brString);
		parser.end();
	});
}

/**
 * 특정 태그를 다른 태그로 변환합니다.
 * @param {string} xmlString - 처리할 XML 문자열
 * @param {string} fromTag - 변환할 태그 이름
 * @param {string} toTag - 새로운 태그 이름
 * @returns {Promise<string>} 변환된 XML 문자열
 */
export function convertTag(xmlString: string, fromTag: string, toTag: string): Promise<string> {
	return replaceTagNames(xmlString, fromTag, toTag);
}
