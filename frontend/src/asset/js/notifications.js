
let notifications = []

$(function(){

    getNotifications()

})
const getNotifications = () => { // first call
    $.ajax({
        url:generalRoutes.notifications,
        success:res=> {
            notifications = res
            populate()
        },
        error:er=> console.log(er)
    })
}
const populate = () => {

    let drawer = document.querySelector('.preview-list')
    if(notifications.length === 0 ) {
        drawer.querySelector('.float-start').innerHTML = 'No notifications';
        drawer.querySelector('.badge-pill').classList.add('d-none')
        return
    }

    notifications.forEach( row => {
        let allitems = document.querySelectorAll('.preview-list a')
        let a = new HtmlBuddy('a').p('className','dropdown-item preview-item py-2 position-relative'+(!row.read?' active':'')).p('dataset','id', row.id)
        a.a('div').p('className','preview-thumbnail').a('i').p('className', `${row.icon} m-auto text-primary`)
        let content = a.a('div').p('className','preview-item-content')
        content.a('h5').p('className', 'preview-subject fw-normal text-dark mb-1').t(row.content)
        content.a('p').p('className', 'fw-light small-text mb-0').t(howLong(row.created_at))
        a.a('span').p('className', 'fa fa-close align-items-center position-absolute align-self-center').p('onclick', removeNotification.bind(null, row.id))
        document.querySelector('.preview-list .border-bottom').after(a.elem)
        document.querySelector('.preview-list .float-start').innerHTML = `${allitems.length} Notifications!`
    });

}

const addNotification = note => {
    let {message} = note;
    let allitems = document.querySelectorAll('.preview-list a')
    let a = new HtmlBuddy('a').p('className','dropdown-item preview-item py-2 position-relative active').p('dataset','id', message.id )
    a.a('div').p('className','preview-thumbnail').a('i').p('className', `${message.icon??'mdi mdi-alert'} m-auto text-primary`)
    let content = a.a('div').p('className','preview-item-content')
    content.a('h5').p('className', 'preview-subject fw-normal text-dark mb-1').t(message.message)
    content.a('p').p('className', 'fw-light small-text mb-0').t(howLong(message.created_at))
    a.a('span').p('className', 'fa fa-close align-items-center position-absolute align-self-center').p('onclick', removeNotification.bind( null, message.id ))
    document.querySelector('.preview-list .border-bottom').after( a.elem )
    document.querySelector('.preview-list .float-start').innerHTML = `${allitems.length} Notifications!`
}

const removeNotification = id => {
    event.stopPropagation()
    let allitems = document.querySelectorAll('.preview-list a')
    document.querySelector('.preview-list .float-start').innerHTML = `${allitems.length - 2} Notifications!`
    $(`.preview-item[data-id=${id}]`).fadeOut()
    $.ajax({
        url:[ generalRoutes.removeNotification, id].join('/'),
        success:res => {
            if(res.status){
                return setTimeout(() => {
                    $(`.preview-item[data-id=${id}]`).remove()
                }, 1400);
            }
            $(`.preview-item[data-id=${id}]`).fadeIn() // restore it back
        }
    })
}
