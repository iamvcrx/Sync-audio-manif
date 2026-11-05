import { LitElement, html, css } from 'lit';

class SwLauncher extends LitElement {
  static get properties() {
    return {
      width: { type: Number, reflect: true },
      height: { type: Number, reflect: true },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }
  constructor() {
    super();

    this.$screen = null;
    // debounce generate some errors if the launcher screen is
    // removed while a timeout is on-going
    this._handleResize = this._handleResize.bind(this);
  }

  setScreen($screen) {
    this.$screen = $screen;
    this.requestUpdate();
  }

  firstUpdated() {
    this._handleResize();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._handleResize);
    super.disconnectedCallback();
  }

  _handleResize() {
    if (this.parentNode === document.body) {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    } else {
      // emulated client, this doesn't work has expected when not emulated
      // because the `sw-launcher`` itself defines the container (document.bdy)
      // size (e.g. moving from portrait to landscape), while this is fine for
      // emulated client because their containers are sized themselves.
      const { width, height } = this.parentNode.getBoundingClientRect();
      this.width = width;
      this.height = height;

    }

    this.style.width = `${this.width}px`;
    this.style.height = `${this.height}px`;

    this.requestUpdate();
  }

  render() {
    return html`
      ${this.$screen}
    `;
  }
}

SwLauncher.disableWarning?.('change-in-update');

if (customElements.get('sw-launcher') === undefined) {
  customElements.define('sw-launcher', SwLauncher);
}
