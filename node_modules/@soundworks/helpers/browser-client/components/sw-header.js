import { LitElement, html, css } from 'lit';

class SwAppHeader extends LitElement {
  static get properties() {
    return {
      name: { type: String },
      author: { type: String },
    };
  }

  static get styles() {
    return css`
      .name {
        font-size: 3rem;
        line-height: 5rem;
        text-align: center;
        font-weight: normal;
        display: var(--title-display, block);
      }

      .author {
        margin: 0;
        font-size: 2rem;
        line-height: 2.4rem;
        font-style: italic;
        opacity: 0.5;
        text-align: center;
      }
    `;
  }

  render() {
    return html`
      <div>
        <h1 class="name">${this.name}</h1>
        <p class="author">${this.author ? this.author : ''}</p>
      </div>
    `;
  }
}

if (customElements.get('sw-header') === undefined) {
  customElements.define('sw-header', SwAppHeader);
}
