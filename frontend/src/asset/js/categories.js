var triedCat=1;
$(function(){
    getCategories()
})

function createUpdate()
{
    if(this.getAttribute('readonly') || this.getAttribute('disabled')) return
    if(this.classList.contains('dynamic')) return $(this).parent().parent().remove()
    if(this.value.length == 0) return showAlert('Can\'t be empty!', 1)

    $.ajax({
        url: routes.category.createUpdate,
        type:'POST',
        data:{ id:this.dataset.id, name:this.name, value:this.value, _token },
        success:res=> {
            showAlert(res.message)
            $(`.categoryTable tr[data-id=${this.dataset.id}] td:last i.mdi-content-save`).attr('class','mdi mdi-pencil text-success')
            if($(this).attr('type')== 'color'){
                $(this).attr('disabled', true)
            } else {
                $(this).attr('readonly', true)
            }
            if(res.message.includes('added')){
                getCategories()
                makeReload =false
            }
        },
        error:err=> {
            console.log(err)
            showAlert(err.responseJSON.message??'Something went wrong!', 1)
        }
    })

}

const getCategories = () => {

    $.ajax({
        url : routes.category.index,
        success:data => {
            triedCat=1;
            let table=  new HtmlBuddy('table')
            let thead = table.p('className','table table-bordered w-100').a('thead')
            let row = thead.a('tr')
            row.a('th').t('S.No')
            row.a('th').t('Name')
            row.a('th').t('Color')
            row.a('th').t('Status')
            row.a('th').t('Action').a('span').p('className', 'mdi mdi-plus btn-sm btn-rounded btn btn-success ms-4 category').p('dataset', 'toggle', 'modal').p('dataset','target', '.createCategory').p('title', 'Create').t('New')

            let tbody =  table.a('tbody')
            data.forEach( row => {

                let tr = tbody.a('tr').p('dataset','id',row.id)

                tr.a('td').t(data.indexOf(row)+1)
                tr.a('td').a('input').p('className','input').p('name','name').r(x=> x.setAttribute('readonly', true)).p('dataset','id',row.id).p('value', row.name)
                tr.a('td').a('input').p('className','input').p('name','color').p('type','color').r(x=> x.setAttribute('disabled', true)).p('dataset','id',row.id).p('value', row.color)

                let stat = tr.a('td')//.t(row.status? 'Active' : 'Inactive')
                stat.a('input').p('type','checkbox').p('id', 'btn'+row.id).p('checked', row.status ).p('onclick', toggleCategory.bind(null, row.id,row.status))
                stat.a('label').r((x) => x.setAttribute('for', 'btn'+row.id))//p('for', 'btn'+row.id)
                stat.a('div').p('className','plate')

                let action = tr.a('td')
                action.a('button').p('className','btn btn-sm btn-outline-light').p('onclick', editCategory.bind(null, row)).p('type','button').a('i').p('className','mdi mdi-pencil text-success')
                action.a('button').p('className','btn btn-sm btn-outline-light ms-3 delete').p('onclick', removeCategory.bind(null, row.id)).p('type','button').a('i').p('className','mdi mdi-delete text-danger')

                let options = [
                    new ContextMenuItem('mdi mdi-pencil','Edit', editCategory.bind(null, row )),
                    new ContextMenuItem('mdi mdi-delete','Remove', removeCategory.bind(null, row.id )),
                ];

                new ContextMenu(tr.elem, options , ()=> tr.elem.classList.add('force-hover'))

            });
            document.querySelector('.categoryTable').innerHTML = ''
            document.querySelector('.categoryTable').appendChild(table.elem)

            $("[data-toggle=tooltip]").tooltip()
            $("[data-toggle=tooltip]").css('cursor','pointer')

            $('.categoryTable .input').on('blur', createUpdate )
            $('span.category').on('click', create )

        },
        error:err => {
            if(triedCat < 5) {
                getCategories();
                triedCat+=1;
            }
        }
    })
}

const editCategory = data => {

    $(`.categoryTable tr[data-id=${data.id}] td:last i.mdi-pencil`).attr('class', 'mdi mdi-content-save text-success')
    $('.categoryTable input[name="name"][data-id="'+data.id+'"]').attr('readonly', false )
    $('.categoryTable input[name=color][data-id="'+data.id+'"]').attr('disabled', false )
    $('.categoryTable input[name=name][data-id="'+data.id+'"]').focus()

}

const create = () => {

    let newId = $('.categoryTable tbody tr').length + 1
    if(newId == 1) {
        let tr = new HtmlBuddy('tr')
        tr.a('td').t(1)
        tr.a('td').a('input').p('className', 'input dynamic').p('name','name').p('dataset','id',1)
        tr.a('td').a('input').p('className','input').p('name','color').p('type','color').r(x=> x.setAttribute('disabled', true)).p('dataset','id', 1)
        let stat = tr.a('td')
        stat.a('input').p('type','checkbox').p('id', 'btn-1')
        stat.a('label').r( x => x.setAttribute('for', 'btn-1'))
        stat.a('div').p('className', 'plate')

        let action = tr.a('td')
            action.a('button').p('className','btn btn-sm btn-outline-light').a('i').p('className','mdi mdi-pencil text-success')
            action.a('button').p('className','btn btn-sm btn-outline-light delete').p('type','button').a('i').p('className','mdi mdi-delete text-danger').p('onclick', ()=> $('.categoryTable tr:last').remove())

        $('.categoryTable tbody').append(tr.elem)

        document.querySelector('.categoryTable .input').addEventListener( 'blur', createUpdate )
        $('.input').keyup( ()=> $('.input').removeClass('dynamic'))
        return
    }
    let node = document.querySelector('.categoryTable tbody').lastChild
    let clone = node.cloneNode(true)
    clone.dataset.id = newId
    clone.querySelector('td').innerHTML = newId
    clone.querySelector('.input').value = ''
    clone.querySelector('.input').classList.add('dynamic')
    clone.querySelector('.input').dataset.id = newId
    clone.querySelector('.input').addEventListener('blur', createUpdate )
    clone.querySelector('button').addEventListener('click', editCategory.bind( null, { id:newId } ))
    clone.querySelector('button.delete').addEventListener('click', () => document.querySelector('tbody').lastChild.remove())
    document.querySelector('.categoryTable tbody').appendChild(clone)
    clone.querySelector('button').click()

    $('.input').keyup(()=> $('.input').removeClass('dynamic'))
    makeReload=true

}

const removeCategory = id => {

    if(!confirm('Are you sure?')) return
    $.ajax({
        url : [ routes.category.remove, id].join('/'),
        success : res => {
            if(res.status) {
                $(`tr[data-id=${id}]`).remove()
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

const toggleCategory = (id, stat) => $.ajax({
    url: routes.category.toggle,
    data:{id, status:stat?0:1},
    success: res => showAlert(res.message)
})
