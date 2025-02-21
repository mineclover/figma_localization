import { h } from "preact";
import {
  Button,
  Columns,
  Container,
  Muted,
  render,
  Text,
  TextboxNumeric,
  VerticalSpace,
  Code,
  TextboxMultiline,
  IconPlus32,
  IconTarget32
} from "@create-figma-plugin/ui";
import {
  ExtractProps,
  NonNullableComponentTypeExtract,
  SingleExtractProps
} from "./utilType";

type Props = {
  hello: string;
};

function UtilTypeTest({ hello }: Props) {
  return <div>{hello}</div>;
}

const JSXGroups = {
  a: UtilTypeTest
};

type JSX_A = ExtractProps<typeof JSXGroups, "a">;

type JSX_B = NonNullableComponentTypeExtract<(typeof JSXGroups)["a"], "hello">;

export default UtilTypeTest;
