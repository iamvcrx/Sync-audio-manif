import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

class SwPluginPlatformInit extends LitElement {
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
      }

      p {
        font-size: 1.4rem;
        line-height: 100px;
        text-align: center;
        margin:  0;
      }

      /* blink softly */
      @keyframes regular-soft-blink {
        0% { opacity: 1.0 }
        50% { opacity: 0.3 }
        100% { opacity: 1.0 }
      }

      .has-listener {
        cursor: pointer;
      }

      .has-listener p {
        animation: regular-soft-blink 3.6s ease-in-out infinite;
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
    if (this.plugin.status === 'errored') {
      const msg = this.plugin.state.check.result === false
        ? this.localizedTexts.checkError
        : this.localizedTexts.activateError;

      return html`
        <sw-plugin-error
          localized-texts="${JSON.stringify(this.localizedTexts)}"
          error-msg="${msg}"
          .client="${this.client}"
        >
        </sw-plugin-error>
      `;
    } else {
      const { name, author } = this.client.config.app;
      const { check, userGestureTriggered, activate } = this.plugin.state;

      let msg;
      let listener = undefined;

      if (check === null) {
        msg = this.localizedTexts.initializing;
      } else if (userGestureTriggered === false) {
        msg = this.localizedTexts.click;
        listener = e => {
          e.preventDefault();
          this.plugin.onUserGesture(e);
        };
      } else if (activate === null) {
        msg = this.localizedTexts.activating;
      } else {
        msg = this.localizedTexts.finalizing;
      }

      const classes = {
        'has-listener': !!listener,
      };

      return html`
        <div class="${classMap(classes)}" @click="${listener}">
          <sw-header name="${name}" author="${author}"></sw-header>
          <!-- @todo - replace w/ a component so that we can have a fixed height -->
          <p>${msg}</p>
        </div>
      `;
    }
  }

  connectedCallback() {
    super.connectedCallback();

    if (customElements.get('sw-header') === undefined || customElements.get('sw-plugin-error') === undefined) {
      throw new Error('[@soundworks/plugin-platform-init] sw-header and sw-plugin-error not found in customElements registry, the @soundworks/helpers should be imported');
    }
  }
}

if (customElements.get('sw-plugin-platform-init') === undefined) {
  customElements.define('sw-plugin-platform-init', SwPluginPlatformInit);
}
