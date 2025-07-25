// @ts-nocheck
// 추론되지 않는 타입 처리용
export type Welcome = {
	document?: Document
	components?: { [key: string]: ComponentSet }
	componentSets?: { [key: string]: ComponentSet }
	schemaVersion?: number
	styles?: Object
	name?: string
}

export type ComponentSet = {
	key?: string
	name?: string
	description?: string
	documentationLinks?: any[]
	remote?: boolean
	componentSetID?: string
	styleType?: StyleType
}

export type StyleType = 'FIXED' | 'FILL' | 'HUG'

export type Document = {
	id?: string
	name?: string
	type?: string
	scrollBehavior?: ScrollBehavior
	children?: DocumentChild[]
	backgroundColor?: BackgroundColorClass
	prototypeStartNodeID?: null
	flowStartingPoints?: any[]
	prototypeDevice?: PrototypeDevice
}
export type PrototypeDevice = {
	type?: string
	rotation?: string
}

export type BackgroundColorClass = {
	r?: number
	g?: number
	b?: number
	a?: number
}

type ChildType = SceneNode

type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL'
type LayoutWrap = 'NO_WRAP' | 'WRAP'
export type DocumentChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	sectionContentsHidden?: boolean
	fills?: Fill[]
	strokes?: Fill[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	children?: PurpleChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	blendMode?: BlendMode
	constraints?: Constraints
	clipsContent?: boolean
	background?: Background[]
	backgroundColor?: BackgroundColorClass
	effects?: any[]
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	layoutWrap?: LayoutWrap
	componentPropertyDefinitions?: ComponentPropertyDefinitions
	cornerRadius?: number
	cornerSmoothing?: number
	itemSpacing?: number
	paddingLeft?: number
	paddingRight?: number
	paddingTop?: number
	paddingBottom?: number
	strokeDashes?: number[]
	componentID?: string
	componentProperties?: ComponentProperties
	overrides?: Override[]
}

type Override = {
	id: string
	overriddenFields: NodeChangeProperty[]
}

export type Absolute = {
	x?: number
	y?: number
	width?: number
	height?: number
}

type ChildBlendMode = BlendMode

type BackgroundType = Paint['type']

export type Background = {
	blendMode?: BlendMode
	type?: BackgroundType
	color?: BackgroundColorClass
	visible?: boolean
	opacity?: number
}

export type PurpleChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	sectionContentsHidden?: boolean
	fills?: Background[]
	strokes?: Background[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	children?: FluffyChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	blendMode?: ChildBlendMode
	constraints?: Constraints
	clipsContent?: boolean
	background?: Background[]
	backgroundColor?: BackgroundColorClass
	effects?: any[]
	componentPropertyDefinitions?: TentacledComponentPropertyDefinitions
	cornerRadius?: number
	cornerSmoothing?: number
	strokeDashes?: number[]
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	layoutWrap?: LayoutWrap
	componentID?: string
	overrides?: Override[]
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	componentProperties?: IndecentComponentProperties
	componentPropertyReferences?: FluffyComponentPropertyReferences
	itemSpacing?: number
	paddingLeft?: number
	paddingRight?: number
	paddingTop?: number
	paddingBottom?: number
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: StyleOverrideTable
	lineTypes?: string[]
	lineIndentations?: number[]
}

export type FluffyChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	componentPropertyDefinitions?: FluffyComponentPropertyDefinitions
	boundVariables?: PurpleBoundVariables
	blendMode?: ChildBlendMode
	children?: TentacledChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	clipsContent?: boolean
	background?: Background[]
	fills?: Background[]
	strokes?: Fill[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	backgroundColor?: BackgroundColorClass
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	counterAxisAlignItems?: string
	layoutWrap?: LayoutWrap
	effects?: any[]
	componentID?: string
	overrides?: Override[]
	sectionContentsHidden?: boolean
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: StyleOverrideTable
	lineTypes?: string[]
	lineIndentations?: number[]
	cornerRadius?: number
	cornerSmoothing?: number
	strokeDashes?: number[]
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	componentProperties?: IndigoComponentProperties
	componentPropertyReferences?: FluffyComponentPropertyReferences
}

export type TentacledChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	boundVariables?: FluffyBoundVariables
	blendMode?: ChildBlendMode
	children?: StickyChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	clipsContent?: boolean
	background?: Fill[]
	fills?: Fill[]
	strokes?: Background[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	backgroundColor?: BackgroundColorClass
	effects?: any[]
	componentPropertyReferences?: PurpleComponentPropertyReferences
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	layoutWrap?: LayoutWrap
	componentID?: string
	componentProperties?: StickyComponentProperties
	overrides?: Override[]
	componentPropertyDefinitions?: PurpleComponentPropertyDefinitions
	cornerRadius?: number
	cornerSmoothing?: number
	itemSpacing?: number
	paddingLeft?: number
	paddingRight?: number
	paddingTop?: number
	paddingBottom?: number
	strokeDashes?: number[]
	counterAxisAlignItems?: string
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: StyleOverrideTable
	lineTypes?: string[]
	lineIndentations?: number[]
	styles?: ChildStyles
}

export type Fill = {
	opacity?: number
	blendMode?: BlendMode
	type?: BackgroundType
	color?: BackgroundColorClass
	boundVariables?: FillBoundVariables
	visible?: boolean
}

export type StickyChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	componentPropertyReferences?: PurpleComponentPropertyReferences
	blendMode?: ChildBlendMode
	children?: IndigoChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	clipsContent?: boolean
	background?: Fill[]
	fills?: Fill[]
	strokes?: any[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	backgroundColor?: BackgroundColorClass
	effects?: any[]
	componentID?: string
	componentProperties?: TentacledComponentProperties
	overrides?: Override[]
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: StyleOverrideTable
	lineTypes?: string[]
	lineIndentations?: number[]
	boundVariables?: FluffyBoundVariables
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	counterAxisAlignItems?: string
	layoutWrap?: LayoutWrap
	styles?: ChildStyles
}

export type IndigoChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	boundVariables?: TentacledBoundVariables
	blendMode?: ChildBlendMode
	children?: IndecentChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	clipsContent?: boolean
	background?: Fill[]
	fills?: Fill[]
	strokes?: any[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	backgroundColor?: BackgroundColorClass
	effects?: any[]
	componentPropertyReferences?: PurpleComponentPropertyReferences
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	layoutWrap?: LayoutWrap
	componentID?: string
	componentProperties?: TentacledComponentProperties
	overrides?: Override[]
	counterAxisAlignItems?: string
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: StyleOverrideTable
	lineTypes?: string[]
	lineIndentations?: number[]
}

export type IndecentChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	componentPropertyReferences?: PurpleComponentPropertyReferences
	blendMode?: ChildBlendMode
	children?: HilariousChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	clipsContent?: boolean
	background?: Fill[]
	fills?: Fill[]
	strokes?: any[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	backgroundColor?: BackgroundColorClass
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	counterAxisAlignItems?: string
	layoutWrap?: LayoutWrap
	effects?: any[]
	componentID?: string
	componentProperties?: FluffyComponentProperties
	overrides?: Override[]
	boundVariables?: TentacledBoundVariables
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: StyleOverrideTable
	lineTypes?: string[]
	lineIndentations?: number[]
}

export type HilariousChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	boundVariables?: StickyBoundVariables
	blendMode?: ChildBlendMode
	children?: AmbitiousChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	clipsContent?: boolean
	background?: Fill[]
	fills?: Fill[]
	strokes?: any[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	backgroundColor?: BackgroundColorClass
	effects?: any[]
	componentPropertyReferences?: PurpleComponentPropertyReferences
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	layoutWrap?: LayoutWrap
	componentID?: string
	componentProperties?: FluffyComponentProperties
	overrides?: Override[]
	counterAxisAlignItems?: string
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: StyleOverrideTable
	lineTypes?: string[]
	lineIndentations?: number[]
}

export type AmbitiousChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	componentPropertyReferences?: PurpleComponentPropertyReferences
	blendMode?: ChildBlendMode
	children?: CunningChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	clipsContent?: boolean
	background?: Background[]
	fills?: Background[]
	strokes?: any[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	backgroundColor?: BackgroundColorClass
	effects?: any[]
	componentID?: string
	componentProperties?: PurpleComponentProperties
	overrides?: Override[]
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: StyleOverrideTable
	lineTypes?: string[]
	lineIndentations?: number[]
	styles?: ChildStyles
	layoutMode?: LayoutMode
	counterAxisSizingMode?: StyleType
	primaryAxisSizingMode?: StyleType
	layoutWrap?: LayoutWrap
}
type LayoutAlign = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'INHERIT'

type PurpleComponentPropertyReferences =
	| {
			[nodeProperty in 'visible' | 'characters' | 'mainComponent']?: string
	  }
	| null

export type CunningChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	componentPropertyReferences?: PurpleComponentPropertyReferences
	blendMode?: ChildBlendMode
	children?: MagentaChild[]
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	layoutAlign?: LayoutAlign
	layoutGrow?: number
	layoutSizingHorizontal?: StyleType
	layoutSizingVertical?: StyleType
	clipsContent?: boolean
	background?: Background[]
	fills?: Background[]
	strokes?: any[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	backgroundColor?: BackgroundColorClass
	effects?: any[]
	componentID?: string
	overrides?: any[]
}

export type MagentaChild = {
	id?: string
	name?: string
	type?: ChildType
	scrollBehavior?: ScrollBehavior
	blendMode?: ChildBlendMode
	absoluteBoundingBox?: Absolute
	absoluteRenderBounds?: Absolute
	constraints?: Constraints
	fills?: Background[]
	strokes?: any[]
	strokeWeight?: number
	strokeAlign?: StrokeAlign
	effects?: any[]
	characters?: string
	style?: Style
	layoutVersion?: number
	characterStyleOverrides?: any[]
	styleOverrideTable?: Object
	lineTypes?: string[]
	lineIndentations?: number[]
}

export type Style = {
	fontFamily?: string
	fontPostScriptName?: string | null
	fontWeight?: number
	textAutoResize?: TextAutoResize
	fontSize?: number
	textAlignHorizontal?: Horizontal
	textAlignVertical?: Vertical
	letterSpacing?: number
	lineHeightPx?: number
	lineHeightPercent?: number
	lineHeightUnit?: LineHeightUnit
}

type LineHeightUnit = string
type Vertical = 'TOP' | 'CENTER' | 'BOTTOM'
type Horizontal = 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'
type TextAutoResize = 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE'
type StrokeAlign = 'CENTER' | 'INSIDE' | 'OUTSIDE'
