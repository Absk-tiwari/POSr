/*
 * If you are making changes to this code, commit them separate to your work
 * under bug #1276. Also understand that this code is used in multiple places
 * throughout the site so be extremely mindful that you don't break something
 * else while trying to get your thing to work. If you add it to something,
 * put it in the list below so future developers know where to look to make
 * sure their changes don't break them.
 *
 * Used in:
 * - Jobs Dashboard
 */

/*
 * HOW TO USE
 * ----------
 * First, create your ContextMenu object (where oElementForMenu is the
 * element you want the menu associated with):
 *
 * let menu = new ContextMenu(oElementForMenu);
 *
 * Then build your menu with ContextMenuItems:
 *
 * menu.add(new ContextMenuItem('fas fa-clock', 'Set Timer', timerSetFunc,
 *     '#ff4961', 'black', 'transparent'));
 *
 * If you need your menu option to open a bootstrap modal, use the
 * ContextMenuItemDef class like so:
 *
 * menu.add(new ContextMenuItem('fas fa-page', 'View Timers',
 *     new ContextMenuDialogDef('modal', '.modal.timer-list-modal',
 *     timerViewFunc), '#62d493'));
 *
 * You can also combine these steps into one statement:
 *
 * let menu = new ContextMenu(oElementForMenu, [
 *     new ContextMenuItem('fas fa-clock', 'Set Timer', timerSetFunc,
 *         '#ff4961', 'black', 'transparent'),
 *     new ContextMenuItem('fas fa-page', 'View Timers',
 *         new ContextMenuDialogDef('modal', '.modal.timer-list-modal',
 *         timerViewFunc), '#62d493')
 * ]);
 */

const CONTEXTMENU_DISPLAY_MIN = 0;
const CONTEXTMENU_DISPLAY_MAX = 1;
const CONTEXTMENU_X_OFFSET = 5;
const CONTEXTMENU_Y_OFFSET = 5;

let isThereAContextMenu = false;

class ContextMenu
{
    /**
     * Creates a ContextMenu class for the supplied element
     * @param {Element} elem The element to put the context menu on
     * @param {Array<ContextMenuItem>} items The items to put into the menu (optional)
     * @param {Function} openCallback An optional callback function to run when the menu opens
     * @param {Function} closeCallback An optional callback function to run when the menu closes
     */
    constructor(elem, items = [], openCallback = () => false, closeCallback = () => false)
    {
        elem.addEventListener('contextmenu', this.execute.bind(this));

        this.elem=elem;
        this.items=items;
        /**
         * @type {HTMLDivElement}
         */
        this.menu=null;
        this.openCallback=openCallback;
        this.closeCallback=closeCallback;
    }
    /**
     * Handle the contextmenu event
     * @param {Event} e The event
     */
    execute(e)
    {
        if (e.ctrlKey === false)
        {
            e.preventDefault();
            e.stopPropagation();
            $('.context-menu.display-block').removeClass('display-block');
            if (this.menu === null)
            {
                this.menu=document.body.appendChild(document.createElement('div'));
                this.menu.className='context-menu';
            }
            else
            {
                this.menu.innerHTML='';
            }
            this.menu.style.top=(e.pageY - CONTEXTMENU_X_OFFSET)+'px';
            this.menu.style.left=(e.pageX - CONTEXTMENU_Y_OFFSET)+'px';
            let close=(e) =>
            {
                if (e.target == this.menu)
                {
                    this.close();
                }
            };
            for (let i = 0; i < this.items.length; i++)
            {
                let oItem=this.items[i];
                if (oItem.canDisplay(this.elem))
                {
                    let oDom = this.menu.appendChild(oItem.toDOM());
                    $(oDom).on('click', this.close);
                }
            }
            this.menu.classList.add('display-block');
            // this.menu.onmouseout=close;
            this.openCallback();

            // These are things that only {need to,can be} done once.
            if (isThereAContextMenu === false)
            {
                let disable=() =>
                {
                    $('.context-menu.display-block').removeClass('display-block');
                    $('tr.force-hover').removeClass('force-hover');
                };
                document.body.addEventListener('click', disable);
                // If there's a scrolling datatable, turn the menu off when you scroll
                if (document.querySelector('.dataTables_scrollBody') !== null)
                {
                    document.querySelector('.dataTables_scrollBody').addEventListener('scroll', disable);
                }
                // Make sure we don't run these again
                isThereAContextMenu=true;
            }
        }
    }
    close()
    {
        if(this.menu)
        {
            this.menu.classList.remove('display-block');
            this.elem.classList.remove('force-hover');
        }
    }
    /**
     * Adds a context menu option to the list
     * @param {ContextMenuItem} item A context menu item object
     */
    add(item)
    {
        this.items.push(item);
    }
}

class ContextMenuItem
{
    /**
     * Define the menu item
     * @param {String} icon A FontAwesome icon definition
     * @param {String} text The text for the menu item
     * @param {Function} callback A function to call when the item is selected
     * @param {String} iconcolour An optional colour for the item (CSS, not bootstrap)
     * @param {String} textcolour The colour for the text (optional)
     * @param {String} bgcolour Background colour (optional)
     * @param {Array<String>} requiredClasses Classes required on the element to display this item on open
     */
    constructor(icon, text, callback, iconcolour = 'inherit', textcolour = 'inherit', bgcolour = 'transparent', requiredClasses = [])
    {
        this.icon=icon;
        this.text=text;
        this.callback=callback;
        this.iconcolour=iconcolour;
        this.textcolour=textcolour;
        this.bgcolour=bgcolour;
        this.requiredClasses=requiredClasses;
    }
    toDOM()
    {
        let base=document.createElement('div');
        base.className='context-menu-item';
        let icon = base.appendChild(document.createElement('div'));
        icon.className='context-menu-icon ' + this.icon;
        icon.style.color = this.iconcolour;
        base.appendChild(document.createTextNode(' '));
        base.appendChild(document.createTextNode(this.text));
        base.style.color=this.textcolour;
        base.style.backgroundColor=this.bgcolour;

        let callback = this.callback;
        // If this has a target, it could be a bootstrap trigger
        if (callback instanceof ContextMenuDialogDef)
        {
            callback.apply(base);

            if (typeof callback.onclick == 'function')
            {
                callback=callback.onclick;
            }
            else
            {
                callback=() => {};
            }
        }
        if (typeof callback == 'function')
        {
            $(base).on('click', callback);
        }

        return base;
    }
    canDisplay(elem)
    {
        let out = true;
        for (let i = 0; i < this.requiredClasses.length; i++)
        {
            let sClass=this.requiredClasses[i];
            if (sClass.charAt(0) == '!')
            {
                out=out && !elem.classList.contains(sClass.slice(1));
            }
            else
            {
                out=out && elem.classList.contains(sClass);
            }
        }
        return out;
    }
}
class ContextMenuDivider
{
    constructor(){}
    toDOM()
    {
        return document.createElement('div').style.borderBottom='1px solid black';
    }
}
class ContextMenuDialogDef
{
    /**
     * Define handling for bootstrap modals etc
     * @param {String} toggle The type of bootstrap item to toggle
     * @param {String} target The DOM selector of the item to toggle
     * @param {Function} onclick An optional callback function
     */
    constructor(toggle, target, onclick)
    {
        this.toggle=toggle;
        this.target=target;
        this.onclick=onclick;
    }
    apply(elem)
    {
        elem.dataset.toggle=this.toggle;
        elem.dataset.target=this.target;
    }
}
