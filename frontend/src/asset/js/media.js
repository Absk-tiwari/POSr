/*
 * Please commit changes to this under bug #1305 separate to your code - do not
 * commit these under specific bug tickets.
 */

var Attachments =
{
    messageOrigin: null,
    preview: function(elem, module, sFunction)
    {
        // Remove existing elements, otherwise things get very confusing very quickly
        let cModalBody=document.body.querySelectorAll('.attachment-viewer.display-none');
        for (let i = 0; i < cModalBody.length; i++)
        {
            document.body.removeChild(cModalBody[i]);
        }

        let singlePixel='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        let oModalBody=document.body.appendChild(document.createElement('div'));
        oModalBody.className='attachment-viewer display-none'
        let oImg=oModalBody.appendChild(document.createElement('div')).appendChild(document.createElement('img'));
        oImg.id="image";
        oImg.src=singlePixel;
        let oUL=oModalBody.appendChild(document.createElement('div')).appendChild(document.createElement('ul'));
        oUL.id='images';
        let url=['', module, sFunction];
        if (elem.tagName === undefined)
        {
            url.push(elem);
        }
        else
        {
            if (elem.dataset.id !== undefined)
            {
                url.push(elem.dataset.id);
            }
            else if (elem.dataset.emp_id)
            {
                url.push(elem.dataset.emp_id);
            }

            if ($(elem).data('type') == 'view')
            {
                url.push($(elem).data('licid'));
                if (elem.dataset.empid !== undefined)
                {
                    url.push(elem.dataset.empid);
                }
            }
            else
            {
                let fields=['employee', 'search', 'expiry', 'guid'];
                for (let i = 0; i < fields.length; i++)
                {
                    if (elem.dataset[fields[i]] !== undefined)
                    {
                        url.push(elem.dataset[fields[i]]);
                    }
                }
            }
        }
        console.log(url, elem);
        showLoader();

        $.ajax({
            url: url.join('/'),
            type: 'get',
            data:{column:$(elem).data('column')},
            success: Attachments.events.previewCallback,
            error: Attachments.events.error
        });
    },
    events:
    {
        previewCallback: function (data)
        {
            let oModalBody=document.querySelector('.attachment-viewer.display-none');
            let oUL=document.querySelector('.attachment-viewer.display-none ul');

            if (data.indexOf === undefined)
            {
                hideLoader();
                if (data.error !== undefined)
                {
                    showError(data.error);
                }
                else
                {
                    console.log(data);
                    showError('An unexpected system error occurred, please contact IT and leave this tab/window open.');
                }
                return
            }

            if (data.indexOf('status') != -1)
            {
                hideLoader();
                $('.close').trigger('click');
                var msg = JSON.parse(data);
                window.parent.postMessage([msg], location.origin);
            }
            else
            {
                for (let i = 0; i < data.length; i++)
                {
                    let oImg=oUL.appendChild(document.createElement('li')).appendChild(document.createElement('img'));
                    oImg.className='rotate-0';
                    oImg.id='image-'+i;
                    oImg.classList.add('pending-load');
                    oImg.onload=function()
                    {
                        this.classList.remove('pending-load');
                        if ($('.attachment-viewer ul li img.pending-load').length == 0)
                        {
                            hideLoader();
                            oModalBody.querySelector('img#image').src=oUL.querySelector('li:first-child img').src;
                            let viewer=new Viewer(document.getElementById('images'), {
                                title: false,
                                hide: function(e)
                                {
                                    setTimeout(function(viewer)
                                    {
                                        viewer.destroy();
                                        let oContainer=document.body.querySelector('div.attachment-viewer');
                                        document.body.removeChild(oContainer);
                                    }, 1000, e.target.viewer);
                                }
                            });
                            if (viewer.element.querySelectorAll('img').length == 1)
                            {
                                document.body.classList.add('one-image');
                            }
                            else
                            {
                                document.body.classList.remove('one-image');
                            }
                            viewer.show();
                        }
                    }
                    oImg.src=data[i];
                }
            }
        },
        load: function()
        {
            if (document.querySelector('.loading-modal') === null)
            {
                let oOuterDiv=document.body.appendChild(document.createElement('div'));
                oOuterDiv.className='modal fade loading-modal';
                oOuterDiv.tabIndex='-1';
                oOuterDiv.setAttribute('role', 'dialog');
                oOuterDiv.setAttribute('aria-hidden', 'true');

                let oDialogDiv=oOuterDiv.appendChild(document.createElement('div'));
                oDialogDiv.className='modal-dialog modal-dialog-centered';
                oDialogDiv.style.width='85px';

                let oContentDiv=oDialogDiv.appendChild(document.createElement('div'));
                oContentDiv.className='modal-content';
                // oContentDiv.appendChild(document.createElement('img')).src='/hub/img/loading.gif';

                let oAnchor=document.body.appendChild(document.createElement('a'));
                oAnchor.className='display-none loading-modal-trigger';
                oAnchor.dataset.toggle='modal';
                oAnchor.dataset.target='.loading-modal';
            }

            // A safeguard against attack... maybe?
            Attachments.messageOrigin=location.protocol + '//' + location.host;
        },
        message: function(event)
        {
            if (event.origin === Attachments.messageOrigin)
            {
                if (['print-loaded', 'printing'].indexOf(event.data) > -1)
                {
                    hideLoader();
                }
            }
        },
        error(resp)
        {
            console.log(resp);
            hideLoader();
            showError('An error occurred! please contact IT and do not close this window');
        }
    },
    // print: function(id, module, sFunction)
    // {
    //     let oIframe=document.querySelector('iframe[name="_print"]');
    //     if (oIframe === null)
    //     {
    //         oIframe=document.createElement('iframe');
    //         oIframe.name='_print';
    //         document.body.appendChild(oIframe);
    //     }

    //     oIframe.src=['', module, sFunction, id].join('/');
    //     hideLoader();
    // }
    print: function(getURL)
    {
        let oIframe=document.querySelector('iframe[name="_print"]');
        if (oIframe === null)
        {
            oIframe=document.createElement('iframe');
            oIframe.name='_print';
            document.body.appendChild(oIframe);
        }
        oIframe.src= getURL;
    }
}

function attachments(elem, module, sFunction)
{
    Attachments.preview(elem, module, sFunction);
}

function printMedia(getURL){
    Attachments.print(getURL);
}

window.onload=Attachments.events.load;
window.onmessage=Attachments.events.message;
