import { LitElement, html, css, nothing } from 'lit';

function padLeft(value, size) {
  let str = value + ''; // cast to string

  while (str.length < size) {
    // we really want an non-breaking space here
    str = ` ${str}`;
  }

  return str;
}

/**
 * Component for the soundworks internal audit state
 */
class SwAudit extends LitElement {
  static styles = css`
    :host > div {
      background-color: var(--sw-light-background-color);
      height: 100%;
      padding: 0 20px;
      overflow: hidden;
    }
  `;

  constructor() {
    super();

    this.client = null;
    this._auditState = null;
    this._numClientsString = '';
    this.filter = null;
  }

  async connectedCallback() {
    super.connectedCallback();

    this._auditState = await this.client.getAuditState();
    this._auditState.onUpdate(updates => {
      if ('numClients' in updates) {
        const numClientsStrings = [];
        const numClients = this._auditState.get('numClients');

        for (let role in numClients) {
          if (
            this.filter === null ||
            (Array.isArray(this.filter) && this.filter.includes(role))
          ) {
            const str = `${role}: ${padLeft(numClients[role], 2)}`;
            numClientsStrings.push(str);
          }
        }

        this._numClientsString = numClientsStrings.join(' - ');
      }

      this.requestUpdate();
    }, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._auditState.detach();
  }

  render() {
    if (this._auditState === null) {
      return nothing;
    }

    const avgLatency = this._auditState.get('averageNetworkLatency');
    const avgLatencyString = padLeft((avgLatency * 1e3).toFixed(2), 6);

    return html`
      <div>${this._numClientsString} | avg latency: ${avgLatencyString} ms</div>
    `;
  }
}

if (customElements.get('sw-audit') === undefined) {
  customElements.define('sw-audit', SwAudit);
}
