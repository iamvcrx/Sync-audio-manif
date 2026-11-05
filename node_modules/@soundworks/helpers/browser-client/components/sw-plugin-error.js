import { LitElement, html, css } from 'lit';

import './sw-header.js';

// this one is used by other sw-plugin-* elements to have a common layout for error messages
class SwPluginError extends LitElement {
  static get properties() {
    return {
      errorMsg: { type: String, attribute: 'error-msg' },
      localizedTexts: { type: Object, attribute: 'localized-texts' },
    };
  }

  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-content: stretch;
        flex-wrap: wrap;
      }

      :host > div {
        height: 100px;
        margin: 0 20px;
      }

      p {
        font-size: 1.4rem;
        line-height: 2rem;
        opacity: 0.9;
        margin-bottom: 0;
      }

      p:first-child {
        font-style: italic;
        color: var(--sw-font-color-error, #a94442);
      }
    `;
  }

  constructor() {
    super();

    this.client = null;
    this.msg = '';
    this.localizedTexts = {};
  }

  render() {
    const { name, author } = this.client.config.app;

    return html`
      <sw-header name="${name}" author="${author}"></sw-header>
      <div>
        <p>${this.localizedTexts.sorry}
        <p>${this.errorMsg}</p>
      </div>
    `;
  }
}

if (customElements.get('sw-plugin-error') === undefined) {
  customElements.define('sw-plugin-error', SwPluginError);
}
