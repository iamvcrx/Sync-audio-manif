import { html, LitElement, nothing, css } from 'lit';

import '@ircam/sc-components/sc-filetree.js';
import '@ircam/sc-components/sc-editor.js';
import '@ircam/sc-components/sc-separator.js';
import '@ircam/sc-components/sc-code-example.js';

// cf. https://www.npmjs.com/package/@visulima/error
function formatErrorMessage(err) {

  const text = err.location.methodName
    ? `"${err.text}" (in \`${err.location.methodName}\`)`
    : err.text;

  return `${text}
\tat ${err.location.file}:${err.location.line}:${err.location.column}

\t${err.location.line} | ${err.location.lineText}
  `;
}

class SwEditor extends LitElement {
  static styles = css`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }

    sc-filetree {
      display: flex;
      width: 250px;
      height: 100%;
      background-color: var(--sc-color-primary-1);
      padding: 6px 0;
    }

    .editor {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }

    .editor > sc-text {
      width: 100%;
      text-indent: 11px;
      min-height: 30px;
    }

    .editor > sc-editor {
      width: 100%;
      height: 100%;
      /* font-size: 11px; */
    }

    .editor sc-code-example {
      padding: 20px 10px;
      border-top: 3px solid var(--sc-color-secondary-3);
      border-left: 2px solid var(--sc-color-secondary-3);
      border-radius: 0;
    }
  `;

  constructor() {
    super();

    this.plugin = null;
    this._filesystem = null;
    this._scripting = null;
    this._source = null;
    this._currentScript = null;

    this._emptyEditorContent = '// select a file in the side bar';
  }

  async connectedCallback() {
    super.connectedCallback();

    if (this.plugin.filesystem) {
      this._filesystem = this.plugin.filesystem;
      this._scripting = this.plugin;
    } else {
      this._filesystem = this.plugin;
      this._scripting = null;
    }

    this._filesystem.onUpdate(async ({ events }) => {
      for (let event of events) {
        if (event.type === 'update' && event.node.path === this._source.node.path) {
          this._setEditorContent(event.node);
        }
      }

      this.requestUpdate();
    });

    this._scriptCollection = await this._scripting.getCollection();
    this._scriptCollection.onUpdate((state, updates) => {
      if (this._currentScript === state && updates.buildError) {
        this.requestUpdate();
      }
      if (updates.runtimeError) {
        this.requestUpdate();
      }
    }, true);
  }

  render() {
    let errors = [];

    if (this._currentScript?.getUnsafe('buildError')) {
      const err = this._currentScript?.getUnsafe('buildError');

      let msg = `[Script "${this._currentScript.get('name')}"] Build Error: `;
      msg += formatErrorMessage(err);

      if (err.notes.length) {
        err.notes.forEach(note => {
          msg += '\n' + formatErrorMessage(note);
        });
      }

      errors.push(html`<sc-code-example .value=${msg}></sc-code-example>`);
    }

    // as getCollection is async, this._scriptCollection may not be ready on first render
    if (this._scriptCollection) {
      const scriptWithErrors = this._scriptCollection
        .getValues()
        .filter(err => err.runtimeError !== null);

      if (scriptWithErrors.length) {
        scriptWithErrors.map(values => {
          const err = values.runtimeError;
          let msg = `[Script "${values.name}"] Runtime Error: `;
          msg += formatErrorMessage(err);
          errors.push(html`<sc-code-example .value=${msg}></sc-code-example>`);
        });
      }
    }

    return html`
      <sc-filetree
        editable
        .value=${this._filesystem.getTree()}
        @input=${e => this._setEditorContent(e.detail.value)}
        @change=${this._executeFileTreeCommand}
      ></sc-filetree>
      <sc-separator direction="row"></sc-separator>
      <div class="editor">
        <sc-text>${this._source ? this._source.relPath : ''}</sc-text>
        <sc-editor
          language=${this._source ? this._source.language : 'js'}
          value=${this._source ? this._source.content : this._emptyEditorContent}
          error=${this._source ? this._source.error : ''}
          @change=${this._saveEditorContent}
        ></sc-editor>
        ${errors.length ? errors : nothing}
      </div>
    `;
  }

  async _executeFileTreeCommand(e) {
    const infos = e.detail.value;

    switch (infos.command) {
      case 'touch': {
        await this._filesystem.writeFile(infos.relPath);
        // open the new created file in editor
        const node = this._filesystem.findInTree(infos.relPath);
        this._setEditorContent(node);
        break;
      }
      case 'mkdir': {
        await this._filesystem.mkdir(infos.relPath);
        break;
      }
      case 'rename': {
        await this._filesystem.rename(infos.oldRelPath, infos.newRelPath);
        // if renamed file is the edited one, update editor
        if (this._source && this._source.relPath === infos.oldRelPath) {
          const node = this._filesystem.findInTree(infos.newRelPath);
          this._setEditorContent(node);
        }
        break;
      }
      case 'delete': {
        await this._filesystem.rm(infos.relPath);
        // if delete file is the edited one, empty editor
        if (this._source && this._source.relPath === infos.relPath) {
          this._source = null;
          this.requestUpdate();
        }
        break;
      }
    }
  }

  async _setEditorContent(node) {
    if (node.type === 'directory') {
      return;
    }

    const blob = await this._filesystem.readFile(node.relPath);
    const content = await blob.text();
    const language = node.extension.replace(/^./, '');
    const $editor = this.shadowRoot.querySelector('sc-editor');

    if (this._source
        && this._source.node.path === node.path
        && $editor.value === content
    ) {
      return;
    }

    this._source = {
      content,
      language,
      relPath: node.relPath,
      node,
    };

    if (this._scripting) {
      if (this._currentScript) {
        // reset to null as we may open a file that is not a script
        this._currentScript = null;
      }

      if (this._scripting.getList().includes(node.relPath)) {
        this._currentScript = this._scriptCollection.find(s => s.get('name') === node.relPath);
      }
    }

    this.requestUpdate();
  }

  async _saveEditorContent(e) {
    await this._filesystem.writeFile(this._source.relPath, e.detail.value);
  }
}

if (customElements.get('sw-editor') === undefined) {
  customElements.define('sw-editor', SwEditor);
}
