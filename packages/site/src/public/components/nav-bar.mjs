const DEFAULT_BREAKPOINT = '512px';

const navBar = document.createElement('template');

navBar.innerHTML = /* html */ `
  <style>
    :host {
      display: block;
    }

    button {
      border: none;
      margin: 0;
      padding: 0;
      width: auto;
      background: transparent;
      line-height: normal;
    }

    .navbar {
      width: 100%;
      display: flex;
      /* force the right side elements to be on a new line when expanded on mobile */
      flex-wrap: wrap;
      /* ensure that the toggle is on the right edge and the title is on the left edge */
      justify-content: space-between;
    }

    /* navbar hamburger toggle styles */
    .navbar-toggle {
      cursor: pointer;
      /* when shown, display will be flex */
      flex-direction: column;
      justify-content: center;
    }
    .navbar-toggle span {
      display: block;
      width: 32px;
      height: 1px;
      margin: 2px;
      background-color: black;
      transition: 0.1s;
    }
    .navbar-toggle-open span:nth-child(1) {
      transform: rotate(-45deg) translate(0px, 7px);
      width: 24px;
    }
    .navbar-toggle-open span:nth-child(2) {
      opacity: 0;
    }
    .navbar-toggle-open span:nth-child(3) {
      transform: rotate(45deg) translate(0px, -7px);
      width: 24px;
    }

    /* navbar link styles */
    .left,
    .right {
      /* use flex container for links */
      display: flex;
    }
    /* desktop styles */
    .navbar-toggle {
      display: none;
    }
  </style>
  <nav class="navbar" part="nav-bar">
    <div class="left">
      <slot name="left"></slot>
    </div>
    <div id="navbar-toggle" class="navbar-toggle" aria-label="nav-bar toggle" part="toggle">
      <span part="toggle-line"></span>
      <span part="toggle-line"></span>
      <span part="toggle-line"></span>
    </div>
    <div class="right" part="right">
      <slot name="right"></slot>
    </div>
  </nav>
`;

class NavBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(navBar.content.cloneNode(true));

    this.shadowRoot?.querySelector('#navbar-toggle')?.addEventListener('click', () => this.navBarToggle());
  }

  connectedCallback() {
    const breakpoint = this.getAttribute('breakpoint');
    this.shadowRoot?.querySelector('style')?.append(/* css */ `
      /* mobile styles */
      @media only screen and (max-width: ${breakpoint || DEFAULT_BREAKPOINT}) {
        .right {
          /* hide the right side elements by default */
          display: none;
        }
        .navbar-toggle {
          /* show the toggle */
          display: flex;
        }
        .expand-rightside-elements {
          /* ensure that the links are rendered below the navbar */
          flex-basis: 100%;
          /* render each element on the right side of the screen when expanded */
          text-align: right;
          /* render each link in a new line */
          display: flex;
          flex-direction: column;
        }
      }
    `);
  }

  navBarToggle() {
    this.shadowRoot?.querySelector('.right')?.classList.toggle('expand-rightside-elements');
    this.shadowRoot?.querySelector('.navbar-toggle')?.classList.toggle('navbar-toggle-open');
  }
}
window.customElements.define('nav-bar', NavBar);
