declare module '@enhance/ssr' {
  import { EnhanceElemFn } from '@enhance/types';

  export type StyleTransformerOptions = {
    attrs: Array<unknown>;
    raw: string;
    tagName: string;
    context: string;
  };
  export type StyleTransformerFn = (options: StyleTransformerOptions) => string;

  export type EnhanceOptions = {
    initialState: Record<string, unknown>;
    elements: Record<string, EnhanceElemFn>;
    // scriptTransforms: [],
    styleTransforms?: Array<StyleTransformerFn>;
  };
  function HtmlTemplateFunction(strings: string[], ...expr: string[]): string;
  export default function enhance(options: EnhanceOptions): HtmlTemplateFunction;
}
