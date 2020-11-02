/**
 * Build styles
 */
const katex = require("katex");
require('./index.css');
require("katex/dist/katex.css");
const uuid = require("uuid")

/**
 * Math Block for the Editor.js.
 * Render Tex syntax/plain text to pretty math equations
 *
 * @author flaming-cl
 * @license The MIT License (MIT)
 */

/**
 * @typedef {Object} MathData
 * @description Tool's input and output data format
 * @property {String} text — Math's content. Can include HTML tags: <a><b><i>
 */
class Math {
  /**
   * Default placeholder for Math Tool
   *
   * @return {string}
   * @constructor
   */
  static get DEFAULT_PLACEHOLDER() {
    return '';
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {{data: MathData, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   */
  constructor({data, config, api}) {
    this.api = api;

    this._CSS = {
      block: this.api.styles.block,
      wrapper: 'ce-Math'
    };
    this.onKeyUp = this.onKeyUp.bind(this);

    this._placeholder = config.placeholder ? config.placeholder : Math.DEFAULT_PLACEHOLDER;
    this._data = {};
    this._element = this.drawView();

    this.config = {
      fleqn: true,
      output: 'html',
      delimiter: '$$',
      throwOnError: true,
      displayMode: true,
    };

    this.data = data;
  }

  /**
   * Check if text content is empty and set empty string to inner html.
   * We need this because some browsers (e.g. Safari) insert <br> into empty contenteditanle elements
   *
   * @param {KeyboardEvent} e - key up event
   */
  onKeyUp(e) {
    const { textContent } = this._element;

    this.renderKatex();

    if (e.code !== 'Backspace' && e.code !== 'Delete') {
      return;
    }

    if (textContent === '') {
      this._element.innerHTML = '';
    }
  }

  /**
   * Change block editing state - rendering Katex or being editable
   */
  onClick(e) {
    if (!this.textNode || !this.katexNode || e.target === this.textNode) return;

    this.textNode.hidden = !(this.textNode.hidden);

    this.panel.hidden = !(this.panel.hidden);

    const inputError = this.katexNode.innerText.indexOf('ParseError') > -1;
    if (this.textNode.hidden === true && inputError) {
      katex.render(this.textBeforeError, this.katexNode, this.config);
    }
  }

  /**
   * switch the block to editable mode
   */
  enableEditing() {
    if (this.textNode) {
      return this.textNode.hidden = false;
    }

    this.textNode = document.createElement('input');
    this.textNode.contentEditable = true;
    this.textNode.value = this.data.text;
    this.textNode.hidden = true;
    this.textNode.className = 'text-node';
    this._element.appendChild(this.textNode);
  }

  /**
   * Create Tool's view
   * @return {HTMLElement}
   * @private
   */
  drawView() {
    const div = document.createElement('DIV');

    div.classList.add(this._CSS.wrapper, this._CSS.block);
    div.contentEditable = true;
    div.dataset.placeholder = this._placeholder;
    this.katexNode = document.createElement('div');
    this.katexNode.id = 'katex-node';
    this.katexNode.contentEditable = false;
    this.katexNode.addEventListener('click', (e) => this.onClick(e));
    div.appendChild(this.katexNode);

    this.buildPanel(div)
    div.addEventListener('keyup', this.onKeyUp);
    return div;
  }

  buildPanel(div) {
    const image = "data:image/png;base64,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";

    this.panel = document.createElement('div')
    this.panel.className = 'panel'
    // panel.style.height = '28px'
    this.panel.style.overflow = 'hidden'
    this.panel.style.position = 'relative'
    this.panel.hidden = true
    this.panel.contentEditable = false

    let id = uuid.v4().split('-')[0]

    const map = document.createElement('map')
    map.name = `operators_map_${id}`
    map.id = `operators_map_${id}`

    const img = document.createElement('img')
    img.src = image
    img.width = 168
    img.height = 140
    img.title = "Operators"
    img.alt = "Operators Panel"
    img.useMap = `#operators_map_${id}`


    this.panelArea.forEach((areaConfig)=>{
      const area = document.createElement('area')
      area.shape = "rect"
      area.title = areaConfig.title
      area.coords = areaConfig.coords
      area.addEventListener('click', (e) => {
        if(areaConfig.insert){
          areaConfig.insert();
        }
      });

      map.appendChild(area)
    });

    this.panel.appendChild(map)
    this.panel.appendChild(img)

    div.appendChild(this.panel)
  }

  insert(value) {
    this.textNode.value = this.textNode.value + value
    this.renderKatex();
  }

  panelArea = [
    {
      title: "superscript",
      coords: "0,0,25,25",
      insert: ()=>this.insert('^{}')
    },
    {
      title: "subscript",
      coords: "0,28,25,53",
      insert: ()=>this.insert('_{}')
    },
    {
      title: "x_a^b",
      coords: "0,56,25,81",
      insert: ()=>this.insert('_{}^{}')
    },{
      title:"{x_a}^b",
      coords: "0,84,25,109",
      insert: ()=>this.insert('{_{}}^{}')
    },
    {
      title: "_{a}^{b}\textrm{C}",
      coords:  "0,112,25,137",
      insert: ()=>this.insert('_{}^{}\\textrm{}')
    },
    {
      title: "fraction",
      coords: "28,0,53,25",
      insert: ()=>this.insert('\\frac{}{}')
    },
    {
      title:"tiny fraction",
      coords: "28,28,53,53",
      insert: ()=>this.insert('\\tfrac{}{}')
    },
    {
      title:"\frac{\partial }{\partial x}",
      coords: "28,56,53,81",
      insert: ()=>this.insert('\\frac{\\partial }{\\partial x}')
    },
    {
      title: "\frac{\partial^2 }{\partial x^2}",
      coords:  "28,84,53,109",
      insert: ()=>this.insert('\\frac{\\partial^2 }{\\partial x^2}')
    },
    {
      title: "\frac{\mathrm{d} }{\mathrm{d} x}",
      coords: "28,112,53,137",
      insert: ()=>this.insert('\\frac{\\mathrm{d} }{\\mathrm{d} x}')
    },
    {
      title: "\int",
      coords: "56,0,81,25",
    },
    {
      title: "\int_{}^{}",
      coords: "56,28,81,53",
      insert: ()=>this.insert('\\int_{}^{}')
    },
    {
      title: "\oint",
      coords: "56,56,81,81",
      insert: ()=>this.insert('\\oint')
    },
    {
      title: "\oint_{}^{}",
      coords: "56,84,81,109",
      insert: ()=>this.insert('\\oint_{}^{}')
    },
    {
      title: "\iint_{}^{}",
      coords: "56,112,81,137",
      insert: ()=>this.insert('\\iint_{}^{}')
    },
    {
      title: "\bigcap",
      coords:  "84,0,109,25",
    },
    {
      title: "\bigcap_{}^{}",
      coords: "84,28,109,53",
      insert: ()=>this.insert('\\bigcap_{}^{}')
    },
    {
      title: "\bigcup",
      coords: "84,56,109,81",
      insert: ()=>this.insert('\\bigcup')
    },
    {
      title: "\bigcup_{}^{}",
      coords: "84,84,109,109",
      insert: ()=>this.insert('\\bigcup_{}^{}')
    },
    {
      title: "\lim_{x \to 0}",
      coords: "84,112,109,137",
      insert: ()=>this.insert('\\lim_{}')
    },
    {
      title: "\sum",
      coords: "112,0,137,25",
    },
    {
      title: "\sum_{}^{}",
      coords: "112,28,137,53",
      insert: ()=>this.insert('\\sum_{}^{}')
    },
    {
      title: "\sqrt{}",
      coords: "112,56,137,81",
      insert: ()=>this.insert('\\sqrt{}')
    },
    {
      title: "\sqrt[]{}",
      coords: "112,84,137,109",
      insert: ()=>this.insert('\\sqrt[]{}')
    },
    {
      title: "\\prod",
      coords: "140,0,165,25",
    },
    {
      title: "\prod_{}^{}",
      coords: "140,28,165,53",
      insert: ()=>this.insert('\\prod_{}^{}')
    },
    {
      title: "\coprod",
      coords: "140,56,165,81",
    },
    {
      title: "\coprod_{}^{}",
      coords: "140,84,165,109",
      insert: ()=>this.insert('\\coprod_{}^{}')
    },
  ]

  /**
   * Return Tool's view
   * @returns {HTMLDivElement}
   * @public
   */
  render() {
    this.renderKatex();
    this.enableEditing();
    return this._element;
  }

  /**
   * Return Tool's view
   * @returns {HTMLDivElement}
   */
  renderKatex() {
    this.data.text = this.textNode ? this.textNode.value : this.data.text;
    this.textToKatex();
  }

  /**
   * parsing the current text to Tex syntax if it has not been transformed
   */
  textToKatex() {
    if (!this.data.text) {
      this.data.text = 'equation:';
    }

    if (!this.katexNode) return;

    if (this._element.innerText.indexOf('ParseError') < 0) {
      this.textBeforeError = this._element.innerText;
    }

    try {
      katex.render(this.data.text, this.katexNode, this.config);
    } catch (e) {
      const errorMsg = 'Invalid Equation. ' + e.toString();
      this.katexNode.innerText = errorMsg;
    }
  }

  /**
   * content inside Math is unchangeable.
   * @param {MathData} data
   * @public
   */
  merge(data) {
    this.data = this.data;
  }

  /**
   * Validate Math block data:
   * - check for emptiness
   *
   * @param {MathData} savedData — data received after saving
   * @returns {boolean} false if saved data is not correct, otherwise true
   * @public
   */
  validate(savedData) {
    if (savedData.text.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * content inside Math is unchangeable
   * @param {HTMLDivElement} toolsContent - Math tools rendered view
   * @returns {MathData} - saved data
   * @public
   */
  save(toolsContent) {
    return {
      text: this.data.text
    };
  }

  /**
   * On paste callback fired from Editor.
   *
   * @param {PasteEvent} event - event with pasted data
   */
  onPaste(event) {
    const data = {
      text: event.detail.data.innerHTML
    };

    this.data = data;
  }

  /**
   * Enable Conversion Toolbar. Math can be converted to/from other tools
   */
  static get conversionConfig() {
    return {
      export: 'text', // to convert Math to other block, use 'text' property of saved data
      import: 'text' // to covert other block's exported string to Math, fill 'text' property of tool data
    };
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      text: {
        br: true,
        svg: true
      }
    };
  }

  /**
   * Get current Tools`s data
   * @returns {MathData} Current data
   * @private
   */
  get data() {
    return this._data;
  }

  /**
   * Store data in plugin:
   * - at the this._data property
   * - at the HTML
   *
   * @param {MathData} data — data to set
   * @private
   */
  set data(data) {
    this._data = data || {};

    this.katexNode.innerHTML = this._data.text || '';
  }

  /**
   * Used by Editor paste handling API.
   * Provides configuration to handle P tags.
   *
   * @returns {{tags: string[]}}
   */
  static get pasteConfig() {
    return {
      tags: [ 'P' ]
    };
  }

  /**
   * Icon and title for displaying at the Toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: require('./math-icon.svg').default,
      title: 'Math'
    };
  }
}

module.exports = Math;
