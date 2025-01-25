/* I am open to giving this a different name */

if (typeof HtmlBuddy !== 'function')
{
/**
 * This class offers a wrapper around HTML DOM with similar syntax to jQuery.
 */
var HtmlBuddy=class {

    /**
     * @type {HTMLElement}
     */
    elem=null;
    /**
     * Creates an HtmlBuddy object that stores an HTML DOM object.
     * @param {HTMLElement|DocumentFragment|String} elem The HTML tag name for the element you wish to create, an HTMLElement object or a Document Fragment
     */
    constructor(elem)
    {
        if (elem.nodeName !== undefined)
        {
            this.elem=elem;
        }
        else
        {
            this.elem=document.createElement(elem);
        }
    }
    /**
     * Run a function against the element. May not work for some function types.
     * @param {string} funcName Name of the function you wish to execute
     * @returns {HtmlBuddy}
     */
    f(funcName)
    {
        let func=this.elem[funcName];
        for (let i = 1; i < arguments.length; i++)
        {
            func.bind(this.elem, arguments[i]);
        }
        return func();
    }
    /**
     * Run a nested function against the element. May not work for some function types.
     * Last parameter will be an array of the parameters
     * @returns {any} Whatever the function returns
     */
    nf()
    {
        let obj=this.elem;
        let params=arguments[arguments.length-1];
        let func=arguments[arguments.length-2];
        if (!Array.isArray(params)) params=[params];
        for (let i = 0; i < arguments.length-2; i++)
        {
            obj=obj[arguments[i]];
        }
        return obj[func](...params);
    }
    /**
     * Alias of nf()
     * @returns {any} Whatever the function returns
     */
    nestedFunction()
    {
        return this.nf(...arguments);
    }
    /**
     * Modify a property, or a child of a property. Takes any number of arguments, which
     * will be interpreted as arg1.arg2.arg3.[...].argN-1=argN
     * @returns {HtmlBuddy} itself
     */
    p()
    {
        let prop=this.elem;
        if (arguments.length > 2)
        {
            for (let i = 0; i < (arguments.length-2); i++)
            {
                prop=prop[arguments[i]];
            }
        }
        prop[arguments[arguments.length-2]]=arguments[arguments.length-1];
        return this;
    }
    /**
     * Create new element to add to this element as a child. Returns child
     * @param {String} elem HTML element tag name
     * @returns {HtmlBuddy} The new child element
     */
    a(elem)
    {
        let newElem=new HtmlBuddy(elem);
        this.elem.appendChild(newElem.elem);
        return newElem;
    }
    /**
     * Create new element to insert before a child element. Returns new child.
     * Child element can be a constant from the below:
     * * HtmlBuddy.INSERT_TOP
     * Or it can be a DOM element, or a HTML
     * @param {String} elem HTML element tag name
     * @param {HTMLElement|HtmlBuddy|number} before Element to place new element before, or an INSERT_* constant
     * @returns {HtmlBuddy} The new child element
     */
    i(elem, before)
    {
        before=this.#evalBefore(before);
        let newElem=new HtmlBuddy(elem);
        this.elem.insertBefore(newElem.elem, before);
        return newElem;
    }
    /**
     * Insert DOM text element as a child to this element
     * @param {String} text The text you wish to insert
     * @returns {HtmlBuddy} itself
     */
    t(text)
    {
        this.elem.appendChild(document.createTextNode(text));
        return this;
    }
    /**
     * Insert DOM text element as a child to this element before another element
     * @param {String} text The text you wish to insert
     * @param {HTMLElement|HtmlBuddy|number} before Element to place new element before, or an INSERT_* constant
     * @returns {HtmlBuddy} itself
     */
    ti(text, before)
    {
        before=this.#evalBefore(before);
        this.elem.insertBefore(document.createTextNode(text), before);
        return this;
    }
    /**
     * Run a function using the DOM node as a parameter
     * @param {Function} func the function to run (first parameter is DOM node)
     * @returns {HtmlBuddy} itself
     */
    r(func)
    {
        func(this.elem);
        return this;
    }
    /**
     * Returns the parent element to the one you're currently using
     * @returns {HtmlBuddy} a new object containing the parent element
     */
    u()
    {
        return new HtmlBuddy(this.elem.parentElement);
    }
    #evalBefore=function(before)
    {
        if (before === HtmlBuddy.INSERT_TOP)
        {
            before=this.elem.childNodes[0];
        }
        else if (before instanceof HtmlBuddy)
        {
            before=before.elem;
        }
        else if (!(before instanceof HTMLElement))
        {
            throw new Error('number/HtmlBuddy/HTMLElement expected in parameter 1');
        }
        return before;
    }
    /**
     * Alias of a()
     * @param {String} elem HTML element tag name
     * @returns {HtmlBuddy} the new child element
     */
        add(elem)
        {
            return this.a(elem);
        }
        /**
         * Alias of i()
         * @param {String} elem HTML element tag name
         * @param {HTMLElement|HtmlBuddy|number} before Element to place new element before, or an INSERT_* constant
         * @returns {HtmlBuddy} The new child element
         */
        insert(elem, before)
        {
            return this.i(elem, before);
        }
        /**
         * Alias of t()
         * @param {String} text The text you wish to insert
         * @returns {HtmlBuddy} itself
         */
    text(text)
    {
        return this.t(text);
    }
        /**
         * Alias of ti()
         * @param {String} text The text you wish to insert
         * @param {HTMLElement|HtmlBuddy|number} before Element to place new element before, or an INSERT_* constant
         * @returns {HtmlBuddy} itself
         */
    textInsert(text, before)
    {
        return this.ti(text, before);
    }
    /**
     * Alias of r()
     * @param {Function} func the function to run (first parameter is DOM node)
     * @returns {HtmlBuddy} itself
     */
    run(func)
    {
        return this.r(func);
    }
    /**
     * Alias of u()
     * @returns {HtmlBuddy} a new object containing the parent element
     */
    up()
    {
        return this.u();
    }
    /**
     * Alias of p()
     * @returns {HtmlBuddy} itself
     */
    prop()
    {
        return this.p(...arguments);
    }
    /**
     * Run querySelector on element
     * @param {String} sel DOM selector to search for
     * @returns {HtmlBuddy} Element that matches the selector, or false on failure
     */
    q(sel)
    {
        let el=this.elem.querySelector(sel);
        if (el === null) return false;
        return new HtmlBuddy(el);
    }
    /**
     * Alias of q()
     * @param {String} sel DOM selector to search for
     * @returns {HtmlBuddy} Element that matches the selector, or false on failure
     */
    querySelector(sel)
    {
        return this.q(sel);
    }
    /**
     * Runs querySelectorAll on elem
     * @param {String} sel DOM selector to search for
     * @returns {HtmlBuddy[]} Array of elements
     */
    qsa(sel)
    {
        let output=[];
        let all=this.elem.querySelectorAll(sel);
        for (let i = 0; i < all.length; i++)
        {
            output.push(new HtmlBuddy(all[i]));
        }
        return output;
    }
    /**
     * Alias of qsa()
     * @param {String} sel DOM selector to search for
     * @returns {HtmlBuddy[]} Array of elements
     */
    querySelectorAll(sel)
    {
        return this.qsa(sel);
    }
    /**
     * Clone this element into a new HtmlBuddy element
     * @param {boolean} deep Duplicate child elements as well
     * @returns {HtmlBuddy} HtmlBuddy object
     */
    c(deep)
    {
        return new HtmlBuddy(this.elem.cloneNode(deep));
    }
    /**
     * Alias of c()
     * @param {boolean} deep Duplicate child elements as well
     * @returns {HtmlBuddy} HtmlBuddy object
     */
    cloneNode(deep)
    {
        return this.c(deep);
    }
    }
/**
 * Insert the incoming element at the top of the DOM node tree
 * @type {number}
 */
HtmlBuddy.INSERT_TOP=1;
}
