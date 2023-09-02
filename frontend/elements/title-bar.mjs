export const ELEMENT_NAME = 'title-bar';

/**
 * @type {import('@enhance/types').EnhanceElemFn}
 */
export function element({ html, state }) {
  const currentPath = state.store?.path;
  const isAuthenticated = state.store?.session?.idToken && state.store?.session?.accessToken && state.store?.session?.refreshToken;
  const authLink = isAuthenticated
    ? /* html */ `<a class="link" href="/logout">Log Out</a>`
    : /* html */ `<a class="link" href="/login">Log In</a>`;
  return html`
    <nav-bar breakpoint="512px">
      <a href="/" slot="title">mc.mbarney.me</a>
      <a class="link ${currentPath === '/' ? 'active' : ''}" href="/">Go Home</a>
      ${authLink}
    </nav-bar>
  `;
}
