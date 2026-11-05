import { LitElement, html, css } from 'lit';

import './sw-header.js';
import './sw-plugin-error.js';

class SwPluginDefault extends LitElement {
  static get properties() {
    return {
      plugin: { hasChanged: () => true, attribute: false },
      client: { hasChanged: () => true, attribute: false },
      localizedTexts: { type: Object, attribute: 'localized-texts' },
    };
  }

  static get styles() {
    return css`
      :host {
        min-height: 100%;
      }

      :host > div {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        margin: 0 20px;
      }

      p {
        font-size: 1.4rem;
        line-height: 100px;
        text-align: left;
        margin:  0;
      }

      /* blinking animation */
      @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; }}

      p span {
        animation-name: blink;
        animation-duration: 1.4s;
        animation-iteration-count: infinite;
        animation-fill-mode: both;
      }

      p span:nth-child(2) {
        animation-delay: .2s;
      }

      p span:nth-child(3) {
        animation-delay: .4s;
      }
    `;
  }

  constructor() {
    super();

    this.localizedTexts = null;
    this.client = null;
    this.plugin = null;
  }

  render() {
    const { name, author } = this.client.config.app;

    if (this.plugin.status === 'errored') {
      let msg = this.localizedTexts.errored
        ? this.localizedTexts.errored
        : `${this.localizedTexts.defaultErrored} ${this.plugin.id}`;
      // @todo
      return html`
        <sw-plugin-error
          localized-texts="${JSON.stringify(this.localizedTexts)}"
          error-msg="${msg}"
          .client="${this.client}"
        >
        </sw-plugin-error>
      `;
    } else {
      let msg = this.localizedTexts.inited
        ? this.localizedTexts.inited
        : `${this.localizedTexts.defaultInited} ${this.plugin.id}`;

      return html`
        <div>
          <sw-header name="${name}" author="${author}"></sw-header>
          <p>${msg}<span>.</span><span>.</span><span>.</span></p>
        </div>
      `;
    }
  }
}

if (customElements.get('sw-plugin-default') === undefined) {
  customElements.define('sw-plugin-default', SwPluginDefault);
}
