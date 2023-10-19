export const ELEMENT_NAME = 'admin-control-list';

/** @type {import('@enhance/types').EnhanceElemFn} */
export function element({ html }) {
  return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      ::slotted(a) {
        width: 100%;
        padding: 1rem;
        background-color: #eee;
        color: #000;
        text-decoration: none;
      }
      ::slotted(a):hover {
        background-color: #ddd;
      }
    </style>
    <slot></slot>
  `;
}
