export const ELEMENT_NAME = 'hello-world';

/** @type {import('@enhance/types').EnhanceElemFn} */
export function element({ html }) {
  return html`
    <p>
      <slot></slot>
    </p>
  `;
}
