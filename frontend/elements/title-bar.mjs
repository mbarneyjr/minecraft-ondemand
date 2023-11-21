import { sessionIsMember } from '../lib/middleware/auth/index.mjs';

export const ELEMENT_NAME = 'title-bar';

/**
 * @type {import('@enhance/types').EnhanceElemFn}
 */
export function element({ html, state }) {
  const currentPath = state.store?.path;
  const isAuthenticated =
    state.store?.session?.idToken && state.store?.session?.accessToken && state.store?.session?.refreshToken;
  const authLink = isAuthenticated
    ? /* html */ `<a href="/logout" slot="right">Log Out</a>`
    : /* html */ `<a href="/login" slot="right">Log In</a>`;
  const adminLink = sessionIsMember(state.store.session, 'admins')
    ? /* html */ `<a ${currentPath === '/admin' ? 'active' : ''} href="/admin" slot="right">Admin</a>`
    : '';
  return html`
    <nav-bar breakpoint="512px">
      <a href="/" slot="left">mc.mbarney.me</a>
      <button primary slot="left" id="theme-toggle">Switch Theme</button>
      ${adminLink} ${authLink}
    </nav-bar>
  `;
}
