export type FigmaNodeType<T extends keyof FigmaNodeTypeMapping> =
  T extends keyof FigmaNodeTypeMapping ? FigmaNodeTypeMapping[T] : never;
export type FigmaNodeTypeMapping = {
  BOOLEAN_OPERATION: BooleanOperationNode;
  CODE_BLOCK: CodeBlockNode;
  COMPONENT: ComponentNode;
  COMPONENT_SET: ComponentSetNode;
  CONNECTOR: ConnectorNode;
  DOCUMENT: DocumentNode;
  ELLIPSE: EllipseNode;
  EMBED: EmbedNode;
  FRAME: FrameNode;
  GROUP: GroupNode;
  HIGHLIGHT: HighlightNode; // 추가됨
  INSTANCE: InstanceNode;
  LINE: LineNode;
  LINK_UNFURL: LinkUnfurlNode;
  MEDIA: MediaNode;
  PAGE: PageNode;
  POLYGON: PolygonNode;
  RECTANGLE: RectangleNode;
  SECTION: SectionNode;
  SHAPE_WITH_TEXT: ShapeWithTextNode;
  SLICE: SliceNode;
  STAMP: StampNode;
  STAR: StarNode;
  STICKY: StickyNode;
  TABLE: TableNode;
  TABLE_CELL: TableCellNode;
  TEXT: TextNode;
  VECTOR: VectorNode;
  WASHI_TAPE: WashiTapeNode; // 추가됨
  WIDGET: WidgetNode;
};

export type SceneNodeTypeMapping = {
  BOOLEAN_OPERATION: BooleanOperationNode;
  CODE_BLOCK: CodeBlockNode;
  COMPONENT: ComponentNode;
  COMPONENT_SET: ComponentSetNode;
  CONNECTOR: ConnectorNode;
  ELLIPSE: EllipseNode;
  EMBED: EmbedNode;
  FRAME: FrameNode;
  GROUP: GroupNode;
  INSTANCE: InstanceNode;
  LINE: LineNode;
  LINK_UNFURL: LinkUnfurlNode;
  MEDIA: MediaNode;
  POLYGON: PolygonNode;
  RECTANGLE: RectangleNode;
  SECTION: SectionNode; // SectionNode 추가
  SHAPE_WITH_TEXT: ShapeWithTextNode;
  SLICE: SliceNode;
  STAMP: StampNode;
  STAR: StarNode;
  STICKY: StickyNode;
  TABLE: TableNode;
  TABLE_CELL: TableCellNode;
  TEXT: TextNode;
  VECTOR: VectorNode;
  WIDGET: WidgetNode;
};
