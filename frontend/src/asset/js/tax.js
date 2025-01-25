var triedTax=1;
$(function(){
    getTaxes()
})
function createUpdateTax()
{
    if(this.getAttribute('readonly')) return
    if(this.classList.contains('dynamic')) return $(this).parent().parent().remove()
    if(this.value.length == 0) return showAlert('Can\'t be empty!', 1)
    $.ajax({
        url: routes.tax.createUpdate,
        type:'POST',
        data:{ id:this.dataset.id, name:this.name, value:this.value, _token },
        success:res=> {
            showAlert(res.message)
            $(`.taxTable tr[data-id=${this.dataset.id}] td:last i.mdi-content-save`).attr('class','mdi mdi-pencil text-success')
            $(this).attr('readonly', true)
            if(res.message.includes('added')){
                getTaxes()
                makeTaxReload =false
            }
        },
        error:err => {
            console.log(err)
            showAlert(err.responseJSON.message?? 'Something went wrong!', 1)
        }
    })
}
const getTaxes = () => {
    $.ajax({
        url : routes.tax.index,
        success:data => {
            let table=  new HtmlBuddy('table')
            let thead = table.p('className','table table-bordered w-100').a('thead')
            let row = thead.a('tr')
            row.a('th').t('S.No')
            row.a('th').t('Name')
            row.a('th').t('Amount')
            row.a('th').t('Status')
            row.a('th').t('Action').a('span').p('className', 'mdi mdi-plus btn-rounded btn btn-sm btn-success ms-4 tax').p('dataset', 'toggle', 'modal').p('dataset','target', '.addTaxes').p('title', 'Create').p('cursor:pointer').t('New')
            let tbody =  table.a('tbody')
            data.forEach( row => {
                let tr = tbody.a('tr').p('dataset','id',row.id)
                tr.a('td').t(data.indexOf(row)+1)
                tr.a('td').a('input').p('className','input').p('name', 'name').r(x=> x.setAttribute('readonly', true)).p('dataset','id',row.id).p('value', row.name)
                tr.a('td').a('input').p('className','input').p('name', 'amount').r(x=> x.setAttribute('readonly', true)).p('dataset','id',row.id).p('value', row.amount)
                let stat = tr.a('td')//.t(row.status? 'Active' : 'Inactive')
                stat.a('input').p('type','checkbox').p('id', 'btn-'+row.id).p('checked', row.status ).p('onclick', toggleTax.bind(null, row.id,row.status))
                stat.a('label').r((x) => x.setAttribute('for', 'btn-'+row.id))//p('for', 'btn'+row.id)
                stat.a('div').p('className','plate')
                let action = tr.a('td')
                action.a('button').p('className','btn btn-sm btn-outline-light').p('onclick', editTax.bind(null, row)).p('type','button').a('i').p('className','mdi  mdi-pencil text-success')
                action.a('button').p('className','btn btn-sm btn-outline-light ms-3 delete').p('onclick', removeTax.bind(null, row.id)).p('type','button').a('i').p('className','mdi mdi-delete text-danger')
                let options = [
                    new ContextMenuItem('mdi mdi-pencil','Edit', editTax.bind(null, row )),
                    new ContextMenuItem('mdi mdi-trash-o','Remove', removeTax.bind(null, row.id )),
                ];
                new ContextMenu(tr.elem, options , ()=> tr.elem.classList.add('force-hover'))
            });
            document.querySelector('.taxTable').innerHTML = ''
            document.querySelector('.taxTable').appendChild(table.elem)
            $("[data-toggle=tooltip]").tooltip()
            $("[data-toggle=tooltip]").css('cursor','pointer')
            $('.taxTable .input').on('blur', createUpdateTax )
            triedTax = 0;
        },
        error:err=>{
            if(triedTax < 10)
            {
                getTaxes();
                triedTax+=1;
            }
        }
    })
}

const editTax = data => {
    $(`tr[data-id=${data.id}] td:last i.mdi-pencil`).attr('class', 'mdi mdi-content-save text-success')
    $('input[name=name][data-id="'+data.id+'"]').attr('readonly', false )
    $('input[name=amount][data-id="'+data.id+'"]').attr('readonly', false )
    $('input[name=amount][data-id="'+data.id+'"]').focus()
}

const createTax = () => {

    let newId = $('.taxTable .table tbody tr').length + 1
    if(newId == 1) {
        let tr = new HtmlBuddy('tr')
        tr.a('td').t(1)
        tr.a('td').a('input').p('className', 'input dynamic').p('name','name').p('dataset','id', 1)
        tr.a('td').a('input').p('type','text').p('name','amount').p('className','input')
        let stat = tr.a('td')
        stat.a('input').p('type','checkbox').p('id', 'btn-1')
        stat.a('label').r( x => x.setAttribute('for', 'btn-1'))
        stat.a('div').p('className', 'plate')

        let action = tr.a('td')
            action.a('button').p('className','btn btn-sm btn-outline-light').a('i').p('className','mdi mdi-pencil text-success')
            action.a('button').p('className','btn btn-sm btn-outline-light delete').p('type','button').a('i').p('className','mdi mdi-delete text-danger').p('onclick', ()=> $('.taxTable tr:last').remove())

        $('.taxTable tbody').append(tr.elem)
        document.querySelector('.taxTable .input').addEventListener( 'blur', createUpdateTax )
        $('.dynamic').on('keyup', ()=> $('.input').removeClass('dynamic'))
        return
    }
    let node = document.querySelector('.taxTable table tbody').lastChild
    let clone = node.cloneNode(true)
    clone.dataset.id = newId
    clone.querySelector('td').innerHTML = newId
    clone.querySelectorAll('.input').forEach( element => {
        element.value = '';
    });
    clone.querySelector('.input').classList.add('dynamic')
    clone.querySelector('.input').dataset.id = newId
    clone.querySelector('.input').addEventListener('blur', createUpdateTax )
    clone.querySelector('button').addEventListener('click', editTax.bind(null, {id:newId}))
    clone.querySelector('button.delete').addEventListener('click', () => $('.taxTable tbody tr:last-child').remove())
    document.querySelector('.taxTable tbody').appendChild(clone)
    $('.dynamic').on('keyup', ()=> $('.input').removeClass('dynamic'))
    clone.querySelector('button').click()
    makeReload=true
}

const removeTax = id => {
    if(!confirm('Are you sure?')) return
    $.ajax({
        url : [ routes.tax.remove, id].join('/'),
        success : res => {
            if(res.status) {
                $(`tr[data-id=${id}]`).remove();
                let loc = JSON.parse(localStorage.getItem('taxes')??'[]')
                loc = loc.filter(item => item.id != id);
                localStorage.setItem('taxes', JSON.stringify(loc));
                return showAlert(res.message)
            }
            showAlert(res.message, 1)
        },
        error: err => {
            console.log(err)
            showAlert(err.message, 1)
        }
    })
}
const toggleTax = (id, stat) => $.ajax({
    url: routes.tax.toggle,
    data:{ id, status:stat?0:1 },
    success: res => showAlert(res.message)
})
