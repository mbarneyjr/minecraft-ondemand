declare module '@enhance/ssr' {
  import { EnhanceElemFn } from '@enhance/types';

  type EnhanceOptions = {
    initialState: Record<string, unknown>,
    elements: Record<string, EnhanceElemFn>,
    // scriptTransforms: [],
    // styleTransforms: [],
  };
  function HtmlTemplateFunction(strings: string[], ...expr: string[]): string
  export default function enhance(options: EnhanceOptions): HtmlTemplateFunction;
}
