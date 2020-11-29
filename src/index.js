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
    this.panel = document.createElement('div')
    this.panel.className = 'panel'
    // panel.style.height = '28px'
    this.panel.style.overflow = 'hidden'
    this.panel.hidden = true
    this.panel.contentEditable = false

    let operatorHolder = document.createElement('div')
    operatorHolder.style.display = 'flex';
    Object.entries(this.panelArea).forEach(([operator, operations]) => {

      let labelOperator = document.createElement('button')
      let operators = document.createElement('div')

      operators.style.display = "block";
      operators.style.position = "absolute";
      operators.style.backgroundColor = 'white';
      operators.style.width = '40px';
      operators.style.border = '0.025rem solid';
      operators.style.borderRadius = '4px';

      labelOperator.classList.add(this.api.styles.button)
      labelOperator.style.margin = '2px'
      labelOperator.innerHTML = operator
      labelOperator.style.fontWeight = 'bold'
      labelOperator.style.padding = '5px'
      labelOperator.style.margin = '2px'

      labelOperator.addEventListener('click', () => {
        if (labelOperator.lastChild !== operators) {
          labelOperator.appendChild(operators);
        } else {
          labelOperator.removeChild(operators)
        }
      })

      operatorHolder.appendChild(labelOperator);

      operations.forEach((operation) => {
        let div = document.createElement('div');
        div.style.display = 'flex'
        div.style.justifyContent = 'center'
        div.style.padding = '5px'
        katex.render(operation.operator, div, this.config);

        div.onclick = () => {
          this.insert(operation.operator);
        }
        operators.appendChild(div);
      });

      this.panel.appendChild(operatorHolder);
    });

    let operatorHolder2 = document.createElement('div')
    operatorHolder2.style.display = 'flex';
    Object.entries(this.panelArea2).forEach(([operator, operations]) => {

      let labelOperator = document.createElement('button')

      let operators = document.createElement('div')

      operators.style.display = "block";
      operators.style.position = "absolute";
      operators.style.backgroundColor = 'white';
      operators.style.minWidth = '40px';
      operators.style.border = '0.025rem solid';
      operators.style.borderRadius = '4px';

      labelOperator.classList.add(this.api.styles.button)
      labelOperator.style.margin = '2px'
      labelOperator.innerHTML = operator
      labelOperator.style.fontWeight = 'bold'
      labelOperator.style.padding = '5px'

      labelOperator.addEventListener('click', () => {
        if (labelOperator.lastChild !== operators) {
          labelOperator.appendChild(operators);
        } else {
          labelOperator.removeChild(operators)
        }
      })

      operatorHolder2.appendChild(labelOperator);

      operations.forEach((operation) => {
        let div = document.createElement('div');
        div.style.display = 'flex'
        div.style.justifyContent = 'center'
        div.style.padding = '5px'
        katex.render(operation.operator, div, this.config);

        div.onclick = () => {
          this.insert(operation.operator);
        }
        operators.appendChild(div);
      });

      this.panel.appendChild(operatorHolder2);
    });

    div.appendChild(this.panel)
  }

  insert(value) {
    this.textNode.value = this.textNode.value + value
    this.renderKatex();
  }

  panelArea = {
    Math: [{operator: "\\neq"}, {operator: "\\simeq"}, {operator: "\\geq"}, {operator: "\\leq"}, {operator: "\\pm"}, {operator: "\\mp"}, {operator: "\\times"}, {operator: "\\cdot"}, {operator: "\\div"}, {operator: "\\circ"}, {operator: "\\perp"}, {operator: "\\oplus"}, {operator: "\\otimes"}, {operator: "<"}, {operator: "\\Delta"}, {operator: "\\infty"}],
    Greek: [{operator: "\\alpha"}, {operator: "\\beta"}, {operator: "\\gamma"}, {operator: "\\delta"}, {operator: "\\theta"}, {operator: "\\lambda"}, {operator: "\\mu"}, {operator: "\\pi"}, {operator: "\\rho"}, {operator: "\\sigma"}, {operator: "\\phi"}, {operator: "\\psi"}, {operator: "\\omega"}],
    Arrows: [{operator: "\\Rightarrow"}, {operator: " \\Leftrightarrow "}, {operator: "\\rightarrow"}, {operator: "\\leftrightarrow"}],
    Logic: [{operator: "\\land"}, {operator: "\\lor"}, {operator: "\\exists"}, {operator: "\\forall"}, {operator: "\\lnot"}, {operator: "\\because"}, {operator: "\\therefore"}, {operator: "\\blacksquare"}, {operator: "\\Box"}],
    Sets: [{operator: "\\emptyset"}, {operator: "\\in"}, {operator: "\\not\\in"}, {operator: "\\subset"}, {operator: "\\subseteq"}, {operator: "\\cap"}, {operator: "\\cup"}, {operator: "\\mathbb{N}"}, {operator: "\\mathbb{Z}"}, {operator: "\\mathbb{Q}"}, {operator: "\\mathbb{R}"}, {operator: "\\mathbb{C}"}]
    // {
    //   title: "superscript",
    //   insert: ()=>this.insert('^{}')
    // },
    // {
    //   title: "subscript",
    //   insert: ()=>this.insert('_{}')
    // },
    // {
    //   title: "x_a^b",
    //   insert: ()=>this.insert('_{}^{}')
    // },{
    //   title:"{x_a}^b",
    //   insert: ()=>this.insert('{_{}}^{}')
    // },
    // {
    //   title: "_{a}^{b}\textrm{C}",
    //   insert: ()=>this.insert('_{}^{}\\textrm{}')
    // },
    // {
    //   title: "fraction",
    //   insert: ()=>this.insert('\\frac{}{}')
    // },
    // {
    //   title:"tiny fraction",
    //   insert: ()=>this.insert('\\tfrac{}{}')
    // },
    // {
    //   title:"\frac{\partial }{\partial x}",
    //   insert: ()=>this.insert('\\frac{\\partial }{\\partial x}')
    // },
    // {
    //   title: "\frac{\partial^2 }{\partial x^2}",
    //   insert: ()=>this.insert('\\frac{\\partial^2 }{\\partial x^2}')
    // },
    // {
    //   title: "\frac{\mathrm{d} }{\mathrm{d} x}",
    //   insert: ()=>this.insert('\\frac{\\mathrm{d} }{\\mathrm{d} x}')
    // },
    // {
    //   title: "\int",
    // },
    // {
    //   title: "\int_{}^{}",
    //   insert: ()=>this.insert('\\int_{}^{}')
    // },
    // {
    //   title: "\oint",
    //   insert: ()=>this.insert('\\oint')
    // },
    // {
    //   title: "\oint_{}^{}",
    //   insert: ()=>this.insert('\\oint_{}^{}')
    // },
    // {
    //   title: "\iint_{}^{}",
    //   insert: ()=>this.insert('\\iint_{}^{}')
    // },
    // {
    //   title: "\bigcap",
    // },
    // {
    //   title: "\bigcap_{}^{}",
    //   insert: ()=>this.insert('\\bigcap_{}^{}')
    // },
    // {
    //   title: "\bigcup",
    //   insert: ()=>this.insert('\\bigcup')
    // },
    // {
    //   title: "\bigcup_{}^{}",
    //   insert: ()=>this.insert('\\bigcup_{}^{}')
    // },
    // {
    //   title: "\lim_{x \to 0}",
    //   insert: ()=>this.insert('\\lim_{}')
    // },
    // {
    //   title: "\sum",
    // },
    // {
    //   title: "\sum_{}^{}",
    //   insert: ()=>this.insert('\\sum_{}^{}')
    // },
    // {
    //   title: "\sqrt{}",
    //   insert: ()=>this.insert('\\sqrt{}')
    // },
    // {
    //   title: "\sqrt[]{}",
    //   insert: ()=>this.insert('\\sqrt[]{}')
    // },
    // {
    //   title: "\\prod",
    // },
    // {
    //   title: "\prod_{}^{}",
    //   insert: ()=>this.insert('\\prod_{}^{}')
    // },
    // {
    //   title: "\coprod",
    // },
    // {
    //   title: "\coprod_{}^{}",
    //   insert: ()=>this.insert('\\coprod_{}^{}')
    // },
  }

  panelArea2 = {
    Fraction: [{operator: '\\frac{a}{b}'}, {operator: 'x\\tfrac{a}{b}'}, {operator: '\\frac{dy}{dx}'}, {operator: '\\frac{\\partial }{\\partial x}'}, {operator: '\\frac{\\partial }{\\partial x}'}, {operator: '\\frac{\\partial^2 }{\\partial x^2}'}],
    Script: [{operator: 'x^{a}'}, {operator: 'x_{a}'}, {operator: 'x_{a}^{b}'}, {operator: '{x_{a}}^{b}'}],
    Radical: [{operator: '\\sqrt{x}'}, {operator: '\\sqrt[n]{x}'}],
    Integral: [{operator: '\\int'}, {operator: '\\iint'}, {operator: '\\iiint'}, {operator: '\\oint'}, {operator: '\\oiint'}, {operator: '\\int_{a}^{b}'}, {operator: '\\oiint_{a}^{b}'}],
    Operators: [{operator: '\\Sigma'}, {operator: '\\sum_{b}^{a}'}, {operator: '\\prod'}, {operator: '\\prod_{a}^{b}'}, {operator: '\\coprod'}, {operator: '\\bigcap'}, {operator: '\\bigcup'}],
    Brackets: [{operator: '()'}, {operator: '[]'}, {operator: '\\{ \\}'}, {operator: '\\|'}, {operator: '\\langle \\rangle'}, {operator: '\\| \\| '}, {operator: '\\lfloor \\rfloor'}, {operator: '\\lceil \\rceil'}]
  }

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
