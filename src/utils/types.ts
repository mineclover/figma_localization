// XML 노드의 기본 인터페이스
export interface XmlNode {
	tagName: string;
	attributes: Record<string, string>;
	children?: XmlNode[];
	text?: string;
}

// 계층 구조 전체를 표현하는 타입
export type XmlHierarchy = XmlNode[];

// XML 평탄화 노드 인터페이스
export interface XmlFlatNode {
	path: string; // 전체 노드 경로 (예: "root/child/grandchild")
	tagName: string; // 태그 이름
	depth: number; // 중첩 깊이 (0부터 시작)
	order: number; // 문서에서의 순서
	siblingIndex: number; // 동일 부모 내에서의 위치
	attributes: Record<string, string>; // 태그 속성
	text?: string; // 태그 내용 (선택적)
}

// 평탄화된 XML 구조 타입
export type XmlFlatStructure = XmlFlatNode[];
