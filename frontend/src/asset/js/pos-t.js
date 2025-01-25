// Every ajax would try atleast 5 times on failure
var firstData = {};
var categoryColors = {}
var selectedCustomer = JSON.parse(localStorage.getItem('selected-customer')??'{}')
var productsLoaded = false
var allProducts = {}
var session = {}
var splitOn = JSON.parse(localStorage.getItem('split-on')??'false') ??false;
var printReceipt = JSON.parse(localStorage.getItem('print-receipt')??'false') ??false;
var aboveNine = false;
var tried = 1;

const getProducts = (catID=null) => {  // loaded after the categories finished

    $('#products').html(`<tr>
        <td colspan="8" class="text-center">
            <h3><i class="fa fa-spin fa-spinner"></i> </h3> <p class="text-secondary">Loading </p>
        </td>
    </tr>`);

    $.ajax({
        url: routes.products,
        data: { category_id },
        success: data => {
            garbage = data;
            if(category_id==null || category_id == 'all') {
                firstData = data;
                localStorage.getItem('pos_prods', JSON.stringify(firstData))
            }
            allProducts = data; // have it stored as original
            data.forEach( row => { // categorize each product

                if(row.category_id)
                {
                    if(categorizedProducts[row.category_id] === undefined) {
                        categorizedProducts[row.category_id] = [];
                    }
                    categorizedProducts[row.category_id].push(row)
                } else {
                    categorizedProducts.uncategorized.push(row)
                }
                // categorizedProducts[cat].push(row)
            })
            tried=0;
            setTimeout(() => {
                makeGrid();
            }, 1000);
        },
        error: err => {
            console.log(err)
            tried+=1
            $('#products td').html('<b class="text-danger ms-5"> Failed to load data! </b><span class="btn btn-sm btn-success mt-3" onclick="getProducts()" >Reload </span>')
            if(tried < 10) getProducts(catID) // try for at least 5 times there could be 401 error
        }
    }).done(()=> restoreData())

}

var firstCat=0;
const initCategories = (force=false) => {  // the first thing to be called off after load
    const cats = localStorage.getItem('categories')
    if(!force && cats){
        try {
            return makeCategories(JSON.parse(cats))
        } catch (error) {initCategories(true)}
    }
    $.ajax({
        url : routes.categories,
        success:res=> {
            localStorage.setItem('categories', JSON.stringify(res))
            makeCategories(res)
        },
        error: err => {
            console.log(err)
            tried+=1
            if(tried < 10) initCategories() // try for at least 5 times there could be 401 error
        }
    });
}
function makeCategories(data){
    let target = document.querySelector('div.library .category');
    let allCategories = {id:'all',name:"All",color:'#1f1f1f', status:1};
    data.unshift(allCategories);
    data.forEach( row => {
        if(row.status) {
            if(!firstCat && row.id) firstCat = row.id;
            let col = new HtmlBuddy('div');
            col = col.p('className',`category-item d-none ${data.indexOf(row)==0?'active':''}`).p('style', 'background-color:'+row.color+`;color:${isColorDark(hexToRgb(row.color))? 'white':'black'}` ).t(row.name).p('dataset','id', row.id ).p('onclick', getCategorized.bind(null, row.id))
            target.appendChild(col.elem);
            categoryColors[row.id] = row.color;
        }
        categorizedProducts[row.category_id] = []; // making a space
    })
    let other = new HtmlBuddy('div').p('className', 'category-item uncategorized bg-white d-none').p('background-color:#fff,color:black').p('onclick', getUncategorized.bind(null)).t('Other');
    tried = 0;
    target.appendChild(other.elem);
    getProducts();
}
const getUncategorized = () => {
    $('.category-item').removeClass('active')
    $('.uncategorized').addClass('active')
    garbage = categorizedProducts.uncategorized
    makeGrid(false, true)
}

const getCategorized = id => {

    category_id = id
    document.querySelector('.lib-loader').innerHTML = loadingHTML
    $('.category-item').removeClass('active')
    $('.contents').addClass('d-none')
    $(`.category-item[data-id=${id}]`).addClass('active')
    if(categorizedProducts[id]) {
        garbage = categorizedProducts[id]
        return makeGrid()
    }
    if(id== 'all') {
        garbage = firstData
        return makeGrid();
    }
    getProducts()

}

var done = false;

const makeGrid = (firstcall = false, uncategorized=false) => {
    let library = document.querySelector('.library .contents')
    if(!loadingHTML) { // use the variable to show loading again when categorizing the results
        loadingHTML = document.querySelector('.lib-loader').innerHTML
    }

    library.innerHTML= ''
    library.classList.remove('d-none')

    if(category_id == null && firstcall) garbage = categorizedProducts[$('.category-item.active').data('id')]

    let chunked = uncategorized ? chunk(garbage, 4, true): chunk(garbage, 4)
    document.querySelector('.lib-loader').innerHTML = loadingHTML

    let usedStocks = {}
    let chosenProducts = document.querySelectorAll('.chosen-product')
    for (let index = 0; index < chosenProducts.length; index++) {
        const pr = chosenProducts[index];
        let qt = pr.querySelector('span.quantity').innerHTML
        usedStocks[pr.dataset.id] = qt
    }

    chunked.forEach( arr => {

        let gridcol = new HtmlBuddy('div')
        let col = gridcol.p('className','row mt-3')
        arr.forEach( row => {
            if(uncategorized && (arr.indexOf(row)== 0 && chunked.indexOf(arr)===0)) {
                let card = col.a('div').p('className', 'col-md-3 also').p('onclick', addProduct.bind(null)).a('div').p('className','cell')
                card.a('div').p('className','w-100').a('img').p('className','title-img').p('src', addImg )
                card.a('div').p('className','w-100').p('style', 'background-color:white;color:black').a('strong').p('className','wrapped-text').t(wrapText('Add new product')).a('span').p('className', 'tooltiptext').t('Add a new product to uncategorized items!')
                done = true
                return
            }

            let bg = categoryColors[row.category_id]

            let style = `background-color: ${bg}; color:${isColorDark(hexToRgb(bg))? 'white':'black'}`;

            if($(`.category-item[data-id=${row.category_id}]`).length) {
                $(`.category-item[data-id=${row.category_id}]`).addClass('active')
            }
            let className = (usedStocks[row.id] == row.quantity ) || row.quantity==0 ?'col-md-3 also stock-out':'col-md-3 also'
            let remainingStock = usedStocks[row.id] ? row.quantity - usedStocks[row.id] : row.quantity

            let card = col.a('div').p('className', className).p('dataset','barcode', row.code??row.id).p('draggable', true).p('ondragstart', drag.bind(null, JSON.stringify(row))).p('onclick', chooseProduct.bind(null, row)).p('ondrop', removeProduct.bind(null)).p('ondragover', allowDrop.bind(null)).p('dataset','id', row.id).p('dataset', 'record', JSON.stringify(row)).p('dataset','stock', row.backStock?? remainingStock).p('dataset', 'quantity', row.quantity)

            let cell1 = card.a('div').p('className','cell').p('dataset', 'record', JSON.stringify(row))

            cell1.a('div').p('className','w-100').a('img').p('className','title-img').p('src', assetPath+'/'+row.image).r(x=> x.setAttribute('onerror', `this.src="${altImage}"`))
            cell1.a('div').p('className','w-100').p('style', style).a('strong').p('className','wrapped-text').t(wrapText(row.name, 25)).a('span').p('className', 'tooltiptext').t(row.name)
            // let last = card.a('div').p('className','position-absolute extras')
            // last.a('div').p('className','tax').t(row.tax)
            // last.a('div').p('className','stock').t(row.quantity)
            let cell2 = card.a('div').p('className', 'extras')
            let tax = cell2.a('div').p('className','tax')
            tax.a('small').t('Tax')
            tax.a('div').p('style','font-weight:800').t(row.tax??'untaxed')
            let stock = cell2.a('div').p('className','stock')
            stock.a('small').t('Items')
            stock.a('div').p('style','font-weight:800').t(row.backStock?? remainingStock?? row.quantity)

        })

        library.appendChild(gridcol.elem)

    })
    putCategoryWidth()
    document.querySelector('.lib-loader').innerHTML = chunked.length == 0 ? '<h5 class="text-danger">No products for this category!</h5>': ''

}

const allowDrop = ev => ev.preventDefault();

const drag = (data, ev) => ev.dataTransfer.setData("text", data );

const drop = ev => {
    ev.preventDefault();
    var data = JSON.parse(ev.dataTransfer.getData("text")??'{}');
    writeHTML(data)
    select(data.id)
    if(current.products.indexOf(data.id)!==false) {
        current.products.push(data.id)
    }
    selectedID = null // no need to focus editing the price
    saveSession()
}

function select(id) {
    $('.row').removeClass('selected')
    $(`.chosen-product[data-id=${id}]:last`).toggleClass('selected')
    if(id!= selectedID ) {
        selectedID = null
    }
}

const openActions = () => {
    $('.put-here').addClass('action-visible') // reduce height to plate
    $('.actionBar').removeClass('d-none')
}

const closeActions = () => {
    if($('.chosen-product').length == 0)
    {
        $('.put-here').removeClass('action-visible') // reduce height to plate
        $('.put-here .card').removeClass('d-none')
        return $('.actionBar').addClass('d-none')
    }
}

const removeProduct = ev => {    //  dropped to remove

    ev.preventDefault()
    var data = JSON.parse(ev.dataTransfer.getData("text")??'{}')
    let elem = document.querySelector(`div.chosen-product[data-id="${data.id}"]`)
    let card = document.querySelector(`.also[data-id="${data.id}"]`)
    card.dataset.stock = card.dataset.quantity
    card.classList.remove('stock-out')
    card.querySelector('.stock div').innerHTML = card.dataset.stock
    if(elem.classList.contains('selected')) {
        let prev = elem.previousElementSibling
        if(!prev.classList.contains('card'))
        {
            prev.classList.add('selected')
            let btns = $('button.num')
            for (let i = 0; i < btns.length; i++) {
                const btn = btns[i];
                let available = $(`.also[data-id=${prev.dataset.id}]`).data('quantity')
                $(btn).attr('disabled', i >= available )
            }
        }
    }
    elem.remove()
    closeActions()
    selectedID = null
    reviseTotal()
    saveSession()
}

function chooseProduct(data) {    // clicked on product
    writeHTML(data)
    select(data.id)
    saveSession()
}

const removeCurrentProduct = (id) =>  //    clicked to remove
{
    let elem = document.querySelector('div.chosen-product[data-id="'+id+'"]')
    if(elem==null) elem = document.querySelector('div.chosen-product').parentElement.lastElementChild
    let prev = elem.previousElementSibling
    let quantity = parseInt(elem.querySelector('.quantity').innerHTML)
    let card = document.querySelector(`.also[data-id="${elem.dataset.id}"]`) // re-fill the stock
    if(card==null)
    {
        // let category = allProducts.find( item => item.id == elem.dataset.id).category_id
        // const product = categorizedProducts[category].find( item => item.id == elem.dataset.id)
        // product.backStock = product.quantity - quantity
    } else {
        card.dataset.stock = parseInt(card.dataset.stock) + quantity
        card.classList.remove('stock-out')
        card.querySelector('.stock div').innerHTML = card.dataset.stock
    }

    if(prev && !prev.classList.contains('card')) {
        prev.classList.add('selected')
        // selectedID = elem.dataset.id
    }
    elem.remove()
    closeActions()
    reviseTotal()
    saveSession()
    num='';timesCalled=0;
    $('.btn.active')?.removeClass('active')
}

const reduceCurrentProduct = () => {

    let elem = document.querySelector('div.chosen-product.selected')
    if(elem==null) elem = document.querySelector('div.chosen-product').parentElement.lastElementChild
    let prev = elem.previousElementSibling
    let quantity = parseInt(elem.querySelector('.quantity').innerHTML)
    let price = parseFloat(elem.dataset.price)
    let card = document.querySelector(`.also[data-id="${elem.dataset.id}"]`) // re-fill the stock
    if(card==null)
    {
        // let category = allProducts.find( item => item.id == elem.dataset.id).category_id
        // const product = categorizedProducts[category].find( item => item.id == elem.dataset.id)
        // product.backStock = product.quantity - quantity
    } else {
        card.dataset.stock = parseInt(card.dataset.stock) + 1
        card.classList.remove('stock-out')
        card.querySelector('.stock div').innerHTML =  parseInt(card.querySelector('.stock div').innerHTML) + 1 // card.dataset.stock
    }

    if(elem == null && prev && !prev.classList.contains('card')) {
        prev.classList.add('selected')
    }
    if(quantity==1){
        elem.remove()
    } else {
        quantity-=1
        elem.querySelector('.quantity').innerHTML = parseFloat(quantity).toFixed(2)
        elem.querySelector('.price').innerHTML = currency+ ' '+  (price * quantity).toFixed(2)
    }
    closeActions()
    reviseTotal()
    saveSession()
    num='';timesCalled=0;
    $('.btn.active')?.removeClass('active')
}

function writeHTML(data, barcode=false) {
    try {

        if(!barcode)
        {
            let card = document.querySelector(`.also[data-id="${data?.id}"]`)
            $('.also').removeClass('active')
            if(card=== null)  // its from a category which is not currently opened yet, in this case we just need to modify the original array
            {
                let cID = data.category_id
                for(let item of categorizedProducts[cID??'uncategorized']) {
                    if(item.id == data.id) { // modify its stock
                        item.backStock = item.quantity - Object.entries(session)[0][1].quantity[data.id]
                        break;
                    }
                }
            } else {
                card.classList.add('active')
                if(parseInt(card.dataset.stock)) {  // reduce stock as it is being added
                    let prev = document.querySelector('.chosen-product[data-id="'+data.id+'"]')
                    if(prev) {
                        prev = prev.querySelector('span.quantity').innerHTML
                    } else prev = 1;
                    card.dataset.stock = card.dataset.stock - 1
                    card.querySelector('.stock div').innerHTML = card.dataset.stock
                } else return; // 0 ho gaya to laut lo

                if(card.dataset.stock == 0) {
                    card.classList.add('stock-out')
                }
            }

        }
        $('.put-here .card').addClass('d-none')

        if($('.put-here[data-session-id='+sessionID+'] div[data-id="'+data.id+'"]').length && !splitOn)
        {
            let prev  = $('.put-here[data-session-id='+sessionID+'] div[data-id="'+data.id+'"]:last').find('.quantity').text()
            if(data.other){
                $('.put-here[data-session-id='+sessionID+'] div[data-id="'+data.id+'"]:last').find('.price').text(currency + parseFloat(data.price).toFixed(2))
            } else {
                $('.put-here[data-session-id='+sessionID+'] div[data-id="'+data.id+'"]:last').find('.price').text(currency +(data.price * (parseInt(prev) +1)).toFixed(2))
            }
            $('.put-here[data-session-id='+sessionID+'] div[data-id="'+data.id+'"]:last').find('.quantity').text((parseFloat(prev) +1).toFixed(2))
            current.quantity[data.id] = parseInt(prev) + 1

        } else {

            let selected = ''
            if(barcode) selected = 'selected'
            current.quantity[data.id] = 1
            let html = new HtmlBuddy('div').p('className','row mt-2 chosen-product '+selected).p('dataset','id', data.id).p('dataset','price', data.price).p('draggable', true).p('ondragstart', drag.bind(null, JSON.stringify(data))).p('onclick', select.bind(null, data.id))

            let lineA = html.a('div').p('className', 'd-flex w-100')
            lineA.a('b').p('className', data.name.length> 45 ? 'mt-1':'').t(data.name)
            lineA.a('strong').p('className','price').p('dataset','price', data.price ).t(`${currency+parseFloat(data.price).toFixed(2)}`)

            let lineB = html.a('div').p('className','d-flex')
            lineB.a('span').p('className','quantity').t('1.00')
            lineB.a('p').p('className','ms-3 mt-1').t(`${currency} ${parseFloat(data.price).toFixed(2)} / Units`);

            lineC = html.a('button').p('className','btn').p('onclick', removeCurrentProduct.bind(null, data.id)).a('i').p('className', 'mdi mdi-close')

            $('.put-here[data-session-id='+sessionID+']').append(html.elem)
            $('.btn.active').removeClass('active')

        }
        //  update buttons so that quantity can't be chosen more than the stock available
        let buttons = document.querySelectorAll('button.num')
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].disabled = i >= data.quantity
        }

        document.querySelector('.put-here[data-session-id="'+sessionID+'"]').scrollTop = document.querySelector('.put-here[data-session-id="'+sessionID+'"]').scrollHeight
        openActions()  // open the action-bar
        reviseTotal()
        aboveNine = false // toggle above nine btn

    } catch (error) {
        console.log(error.message)
    }

}

const changePrice = () => { // manual price edit button clicked
    let selected = document.querySelector('div.selected')
    selected.querySelector('.price').innerText = currency+' 0.00'
    selectedID = selected.dataset.id
}

const reviseTotal = () => {

    total = 0;
    let plate = document.querySelector('.put-here[data-session-id="'+sessionID+'"]')
    plate.querySelectorAll('.chosen-product').forEach( el => {
        if(el.querySelector('.quantity').innerHTML == '1.00' && el.dataset.id!= 'quick'){
            total+= parseFloat(el.dataset.price)
        } else if(el.dataset.id=='quick'){
            let price = el.querySelector('.price').innerHTML
            price = parseFloat(price.replace(currency,''))
            localStorage.setItem('customPrice',price)
            total+= price;
        } else {
            let q = parseFloat(el.querySelector('.quantity').innerHTML)
            total+= q * parseFloat(el.dataset.price)
        }
    })
    document.querySelector('span.total-amount').innerHTML = total.toFixed(2)
    current.total = total.toFixed(2)
}

$('.col-sm-3 .num').on('click',function() // manual product-price edit
{
    if(aboveNine) return recordNumbers(this.innerText)
    let number = this.innerText
    let selected = document.querySelector('div.selected')
    let price = selected.querySelector('.price').dataset.price
    card = document.querySelector(`.also[data-id="${selected.dataset.id}"]`)
    card.dataset.stock = card.dataset.quantity - number
    if(card.dataset.stock == 0) card.classList.add('stock-out')
    else card.classList.remove('stock-out')

    if(selectedID) {
        selected.querySelector('.price').innerText = currency+` ${parseFloat(parseFloat(price) * number).toFixed(2)}`
    }
    let newTotal = parseFloat(parseFloat(price) * number).toFixed(2)
    selected.querySelector('.price').innerText = currency + newTotal
    selected.querySelector('.quantity').innerText = parseFloat(number).toFixed(2)
    reviseTotal()
})

document.querySelector('#customer .modal-footer .btn-light').addEventListener('click', ()=>{
    $('.create-update-customer-form').addClass('d-none')
    $('#customer .modal-footer .btn-primary').addClass('d-none')
    $('#customer .table-responsive').removeClass('d-none')
    $('#customer .modal-header .btn').text('Create')
})

const createCustomer = btn => {  // from modal header button
    $('.create-update-customer-form').toggleClass('d-none')
    $('#customer .modal-footer .btn-primary').toggleClass('d-none')
    $('#customer .table-responsive').toggleClass('d-none')
    $(btn).text($('.create-update-customer-form').hasClass('d-none')? 'Create' : 'Cancel' )
    $('.create-update-customer-form')[0].reset()
    document.querySelector('input[name="id"]')?.remove()
}

const getCustomers = async(force=false) => {  // will be used in modal as table
    let custs = localStorage.getItem('customers')
    if(!force && custs){
        return makeCustomers(JSON.parse(custs))
    }
    $.ajax({
        url: routes.getCustomers,
        success:data => {
            localStorage.setItem('customers', JSON.stringify(data))
            makeCustomers(data)
            tried = 0;
        },
        error: err => {
            console.log(err)
            tried+=1
            if(tried < 10) getCustomers(force) // try for at least 5 times there could be 401 error
        }
    })

}
function makeCustomers(data){
    target = document.getElementById('customers')
    target.innerHTML = '';

    let table = new HtmlBuddy('table')
    let thead = table.p('className','table table-stripped').p('id', 'customer-table').a('thead').a('tr')
    thead.a('th').t('Name')
    thead.a('th').t('Contact')
    thead.a('th').t('Email')
    thead.a('th').t('Edit')

    let tbody = table.a('tbody')
    data.forEach( customer => {
        let className = selectedCustomer.name ? 'selected-customer' : '';
        let tr = tbody.a('tr').p('dataset','record', JSON.stringify(customer)).p('dataset','id', customer.id).p('dataset','name',customer.name).p('className', className)
        tr.a('td').t(customer.name)
        tr.a('td').t(customer.phone)
        tr.a('td').t(customer.email)
        tr.a('td').a('a').p('text-decoration-none').p('dataset','id', customer.id).p('onclick', editCustomer.bind(null, customer)).a('i').p('className','fa fa-bars')
    })

    if(!data.length){
        tbody.a('tr').a('td').p('colSpan', 4).p('className','text-center p-3').a('b').t('No customers yet!')
    }
    target.appendChild(table.elem)
    $('#customer-table tr').click(function(e)
    {
        if(this.classList.contains('selected-customer')) {
            this.classList.remove('selected-customer')
            selectedCustomer = {}
            $(`button[data-target="#customer"]`).text("Customer").removeClass('selected-customer')
        } else {
            this.classList.add('selected-customer')
            selectedCustomer = this.dataset.record
            $(`button[data-target="#customer"]`).text(!notPos ? wrapText(this.dataset.name, 7): this.dataset.name).addClass('selected-customer')
        }
        localStorage.setItem('selected-customer', selectedCustomer)
        $('.close').click();
    })
}
function openPage(pageName, elmnt)
{
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
        tablinks[i].dataset.active= false
    }
    document.getElementById(pageName).style.display = "block";
    document.querySelector('button[data-btn="'+pageName+'"]').setAttribute('data-active', true)
}
document.getElementById("defaultOpen").click();

const editCustomer = data => {

    document.querySelector('#customer button.modal-title').click()
    let form = document.querySelector('form.create-update-customer-form')
    form.querySelectorAll('.input').forEach( elem => {
        let name = elem.getAttribute('name')
        elem.value = data[name]??''
    })

    let inputId = document.querySelector('input[name="id"]')
    if(!inputId) {
        $(form).append(`<input name="id" type="hidden" value="${data.id}" >`)
    } else {
        inputId.value = data.id
    }
}

document.querySelector('#customer .modal-footer .btn-primary').addEventListener('click', ()=>
{
    let updateInput = $('input[name=id]')
    let url = $('form.create-update-customer-form').attr('action')
    url = updateInput?.length ? [url, $(updateInput).val()].join('/'): url;
    let formData = new FormData($('.create-update-customer-form')[0])

    $.ajax({
        url,
        type:'POST',
        data: formData ,
        processData:false,
        contentType:false,
        success:res => {
            if(res.status) {
                getCustomers(true)
                return showAlert(res.message)
            }
            showAlert(res.message, 1 )
        },
        error:err => console.log(err)
    })
})

function paymentInit()
{
    saveSession()
    localStorage.setItem('print-separate', splitOn)
    a = document.createElement('a')
    a.href = routes.payment
    a.click()
}

function createNewSession ( id = false)
{
    sessionID = id ? id : parseInt($('.box:last').text()) + 1
    $('.sessions .box').removeClass('active')
    $('.sessions').append(`<li class="nav-item ms-3" onclick="sessionActive(this)"><div class="box active">${sessionID}</div></li>`)

    let node = document.querySelector('.put-here')
    let clone = node.cloneNode(true)
    node.classList.add('d-none')
    clone.innerHTML = ''
    clone.dataset.sessionId = sessionID
    let scrollable = document.querySelector('.sessions')
    scrollable.scrollLeft = scrollable.scrollWidth;
    document.querySelector('.col-md-4.position-fixed').insertBefore(clone, document.querySelector('.actionBar'))
    reviseTotal() // reset the total
}

function sessionActive( item )
{
    $('.sessions .box').removeClass('active')
    $(item).children().addClass('active')
    $('.put-here').addClass('d-none')
    sessionID = parseInt($(item).children().text())
    $('.put-here[data-session-id='+sessionID+']').removeClass('d-none')
    reviseTotal()
}

const putCategoryWidth = () => {
    w = $('.col-md-3').width()
    $('.category-item').removeClass('d-none').css('min-width', w )

    let a = $('.row.mt-3').width()
    ww = a - (w * 4)
    let gap = ww / 4
    $('.category-item:not(:first-child)').css('margin-left', gap )
}

const removeIntro = () => {
    $('.main-panel:last').remove()
    $('.main-panel').removeClass('d-none')
    restoreData()
}

let imdone = true
const restoreData = () => {
    if(imdone==false) return
    session = JSON.parse(localStorage.getItem('session-data'))
    let sessionArr = Object.keys(session??{})

    for ( let i = 0; i < sessionArr.length; i++ ) {
        const id = sessionArr[i];
        Object.keys(session[id].quantity).forEach( pr => {
            let j=0;
            let data = JSON.parse(document.querySelector(`.also[data-id="${pr}"]`)?.dataset?.record ?? '{}')
            if(Object.keys(data).length === 0) {
                data = allProducts.find( item => item.id == pr )
            }
            if(pr =='quick') {
                data = {id:'quick',name:'Others', price: localStorage.getItem('customPrice'), other:true}
            }
            do {
                writeHTML(data)
                j++
            } while (j < session[id].quantity[pr]);
            $('.chosen-product').removeClass('selected')
            $('.put-here[data-session-id='+id+'] .chosen-product:last').addClass('selected')
        })
        if( sessionArr.length > 1 && i!= sessionArr.length-1) {
            createNewSession(sessionArr[i+1])
        }
    }
    if(imdone) putCategoryWidth()

    imdone = false
}
// Quick add product
const addProduct = () => $('.custom').click()

const saveSession = () => {
    let final = {}
    let plates = document.querySelectorAll('.put-here')
    plates.forEach( plate => {
        let key = plate.dataset.sessionId
        let products = plate.querySelectorAll('.chosen-product')
        let items = [];
        let total = 0;
        let quantity = {}
        products.forEach( product => {
            items.push(product.dataset.id);
            if(product.dataset.id=='quick') {
                total+= parseInt((product.querySelector('.price').innerText).replace(currency,''));
            } else {
                total+= parseFloat(product.dataset.price) * parseInt(product.querySelector('span.quantity').innerText);
            }
            quantity[product.dataset.id] = quantity[product.dataset.id]? quantity[product.dataset.id]+ parseInt(product.querySelector('.quantity').innerText) : parseInt(product.querySelector('.quantity').innerText)
        })
        final[key] = { products: items, total, quantity }  // each of the session data is set here
    })
    localStorage.setItem('session-data', JSON.stringify(final))
    sessionID = document.querySelector('.sessions .box.active').innerText
    let products = garbage.filter( item => final[sessionID].products.includes(JSON.stringify(item.id)) )
    if(final[sessionID].products.indexOf('quick')!==-1) {
        products.push({name:'Others',id:'quick', price: localStorage.getItem('customPrice'), other:true});
        final[sessionID].otherAmount = localStorage.getItem('customPrice')
    }
    localStorage.setItem('sessionID', sessionID)
    localStorage.setItem('payment-for-session', JSON.stringify(final[sessionID]))
    localStorage.setItem('products', JSON.stringify(products))
}

const search = input => {
    let term = input.value
    if(!term) return $('.also').removeClass('d-none')
    $('.library .contents .also').each(function(k, card ){
        if( $(card).find('.tooltiptext').text().toLowerCase().includes(term.toLowerCase()) || (card.dataset.barcode).indexOf(term)!==-1 ) {
            $(card).removeClass('d-none')
        } else $(card).addClass('d-none')
    })
}


const toggleSplit = () => {

    let btn = document.querySelector('.split-btn')
    if(btn.classList.contains('btn-outline-success')) {
        $(btn).removeClass('btn-outline-success text-dark')
        $(btn).addClass('btn-success text-white')
        localStorage.setItem('split-on', true)
        splitOn = true
    } else {
        $(btn).addClass('btn-outline-success text-dark')
        $(btn).removeClass('btn-success text-white')
        localStorage.setItem('split-on', false)
        splitOn = false
    }

}

const aboveNineQuantity = btn => {
    btn.classList.toggle('active')
    aboveNine = btn.classList.contains('active')
    timesCalled = 0 // reset
    num = '';
}

let num = '';
let timesCalled = 0;
const recordNumbers = (number) => {
    // console.log(number)
    num += number
    timesCalled++;

    if( timesCalled > 1 )
    {
        let selected = document.querySelector('div.selected')
        let price = selected.querySelector('.price').dataset.price
        // let quantity = selected.querySelector('.quantity').innerText
        card = document.querySelector(`.also[data-id="${selected.dataset.id}"]`)
        if(JSON.parse(num) > card.dataset.quantity) {
            num = '';
            timesCalled = 0;
            return alert('Not enough stocks');
        }
        card.dataset.stock = card.dataset.quantity - JSON.parse(num)
        card.querySelector('.extras .stock div').innerText = card.dataset.stock
        if(card.dataset.stock == 0) card.classList.add('stock-out')
        else card.classList.remove('stock-out')

        if(selectedID) {
            // console.log('editing price of ...'+selectedID)
            selected.querySelector('.price').innerText = currency+` ${parseFloat(parseFloat(price) * JSON.parse(num)).toFixed(2)}`
        }
        // let total = parseFloat($('.total-amount').text())
        let newTotal = parseFloat(parseFloat(price) * JSON.parse(num)).toFixed(2)
        // $('span.total-amount').html((total + newTotal))
        selected.querySelector('.price').innerText = currency + newTotal
        selected.querySelector('.quantity').innerText = parseFloat(JSON.parse(num)).toFixed(2)

        reviseTotal()
    }

}

const checkReceipt = () => {
    let btn = document.querySelector('.receipt-btn')
    if(btn.classList.contains('btn-outline-success')) {
        $(btn).removeClass('btn-outline-success text-dark')
        $(btn).addClass('btn-success text-white')
        localStorage.setItem('print-receipt', true)
        printReceipt=true
        $(btn).find('input').prop('checked', true)
    } else {
        $(btn).addClass('btn-outline-success text-dark')
        $(btn).removeClass('btn-success text-white')
        $(btn).find('input').prop('checked', false)
        localStorage.setItem('print-receipt', false)
        printReceipt=false
    }
}

if(document.querySelector('.btn.next'))
{
    $('.btn.next').click('click', function() {
        document.querySelector('.category.row').scrollLeft += $('.col-md-3').width();
        $('.btn.prev').removeClass('d-none')
    });
    $('.btn.prev').click('click', function() {
        document.querySelector('.category.row').scrollLeft -= $('.col-md-3').width();
        let left = parseInt(document.querySelector('.category.row').scrollLeft)
        if(left <= $('.col-md-3').width()) {
            $('.btn.prev').addClass('d-none')
        }
    });
    $('.category.row').on('scroll', function(e){
        if(document.querySelector('.category.row').scrollLeft) $('.btn.prev').removeClass('d-none')
        else $('.btn.prev').addClass('d-none')
    })
}

const reduceStocks = products => {

    let prIDs = Object.keys(products)
    prIDs.forEach( id => {
        let card = document.querySelector('.also[data-id="'+id+'"')
        if(card)
        {
            console.log('card found')
            tStock = card.dataset.stock;
            card.dataset.quantity -= products[id]
            card.dataset.stock -= products[id]
            document.querySelector('.also[data-id="'+id+'"] .extras .stock div').innerText = tStock - products[id]
            if(card.dataset.stock <= 0 ) card.classList.add('stock-out')
        }
    })
    //  do it for future wellness too also for un-opened category too
    //  the grid is maintained by `categorizedProducts` variable
    for (const key in categorizedProducts) {
        let catProducts = categorizedProducts[key]
        if(catProducts.length) {
            prIDs.forEach( prID => {
                if(catProducts.some( ite => ite.id == prID)) {
                    let pr = catProducts.find( item => item.id == prID )
                    pr.quantity = pr.quantity - products[prID]
                    catProducts.splice(catProducts.indexOf(pr))
                    catProducts.push(pr)
                }
            })
        }
    }

}
