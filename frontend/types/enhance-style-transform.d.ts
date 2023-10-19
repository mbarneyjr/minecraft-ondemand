declare module '@enhance/enhance-style-transform' {
  import { StyleTransformerOptions } from '@enhance/ssr';

  export default function styleTransform(options: StyleTransformerOptions): string;
}
