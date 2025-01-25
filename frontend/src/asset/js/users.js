var users = [];
$(function(){
    getUsers()
})

function fillTable () {
    let table= document.getElementById('users')
    table.innerHTML=''
    users.forEach( user => {
        let tr = new HtmlBuddy('tr')
        tr.a('td').t(user.id)
        tr.a('td').t(user.name==''? 'Yet to setup': user.name)
        tr.a('td').t(user.email)
        tr.a('td').a('div').p('className', user.status? '':'text-danger').t(user.status? 'Active': 'Inactive')
        tr.a('td').t(user.verified? 'Yes': 'No')

        let stat = tr.a('td').p('className','d-flex')//.t(row.status? 'Active' : 'Inactive')
            stat.a('input').p('type','checkbox').p('id', 'btn'+user.id).p('checked', user.status ).p('onclick', toggleUser.bind(null, user.id, user.status))
            stat.a('label').r((x) => x.setAttribute('for', 'btn'+user.id))//p('for', 'btn'+row.id)
            stat.a('div').p('className','plate')

        stat.a('a').p('href', '#').p('className', 'text-danger mt-1 ms-2').a('i').p('className', 'mdi mdi-delete').p('onclick', Delete.bind(null, user.id))
        table.appendChild(tr.elem)
    })
}

function getUsers() {
    $.ajax({
        url: routes.getUsers,
        success:data => {
            users = data
            fillTable()
        }
    })
}

function Delete(id){
    if(confirm('Are you sure?'))
    {
        $.ajax({
            url: [routes.delete, id].join('/'),
            success: res=>{
                if(res.status)
                {
                    return showAlert('User deleted!')
                }
                showAlert('Something went wrong!', 1)
            },
            error: er => {
                console.log(er)
                showAlert('Something went wrong!',1)
            }
        })
    }
}

function toggleUser(id, stat)
{
    $.ajax({
        url: routes.toggle,
        type:"POST",
        data:{_token, id, status:stat?0:1},
        success: res => {
            showAlert(res.message??'Status Updated!')
            getUsers()
        }
    })
}


function createUser () {
    $.ajax({
        url: routes.create,
        type:'POST',
        data: {email: $('input[name=email]').val(), _token},
        success:res=> {
            if(res.status){
                $('.close').click()
                getUsers()
                return showAlert(res.message)
            }
            showAlert('Something went wrong!', 1)
        }
    })
}
