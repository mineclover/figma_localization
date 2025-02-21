import { JSX } from "react";
import { ExtractProps, Prettify } from "./utilType";
import { extendsComponent, AtomMap, tagMap } from "./functions";
import { ComponentChild } from "preact";

export type HTMLTags = Prettify<keyof JSX.IntrinsicElements>;
export type ExtendsTagNames = keyof extendsComponent;

// 기본적인 html 키는 원래 쓰이던대로 사용하고 확장된 컴포넌트는 해당 컴포넌트에서
export type ConditionalType<T extends TagNames> = T extends HTMLTags
  ? JSX.IntrinsicElements[T]
  : T extends ExtendsTagNames
    ? ExtractProps<extendsComponent, T>
    : never;

export type RecursiveNodeType<T extends TagNames> = {
  _tagName: T;
  _nextChildren: (RecursiveNodeType<T> | string | boolean | null)[];
  // children?: ComponentChild; preact
  children?: React.ReactNode;
  // children:  React.JSX.Element | NodeType<Tags>,
  // children: unknown;
  _description?: string;
  _id: string;
  _props: ConditionalType<T>;
};

// type TagName = keyof typeof ElementMap;
export type AtomNames = keyof typeof AtomMap;

export type TagNames = keyof (typeof tagMap & extendsComponent);
