import React, { useEffect, useRef, useState } from "react";
import $ from "jquery";
import { useDispatch, useSelector } from "react-redux";
import { Form, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { commonApiSlice, useDeleteProductMutation, useGetProductCategoriesQuery, useGetProductsQuery, useGetTaxesQuery } from "../../features/centerSlice";
import { Warning, wrapText } from "../../helpers/utils";
import toast from "react-hot-toast";
import axios from "axios";
import { preview } from "../../helpers/attachments";
import labelImg from "../../asset/images/default.png";

const Products = () => {

    const listtableRef = useRef();
    const tableRef = useRef();
    const selectRef = useRef();
    const dispatch = useDispatch()

    const {data:categories, isSuccess:catSuccess} = useGetProductCategoriesQuery();
    const {data:taxess, isSuccess:taxAaGaya} = useGetTaxesQuery();
    const [ deleteProduct ] = useDeleteProductMutation();

    const [rowData, setRowData] = useState([]);
    const {currency } = useSelector( state=> state.auth );
    const [modal, setModal ] = useState(false);
    const { data, isSuccess } = useGetProductsQuery();
    const [ editingProduct, setEditingProduct ] = useState({});
    const [ cats, setCats ] = useState([]);
    const [ taxes, setTaxes ] = useState([]);
    const [ uploadedSrc, setPlaceholder ] = useState('');
    const [ view, setView] = useState('list');

    const changeProductField = e => {
        console.log({ ...editingProduct, [e.target.name]: e.target.value })
        setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
    }

    const handleFile = e => {
        let file = e.target.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        setEditingProduct({ ...editingProduct, uploaded:file })
        reader.onload = function() {
            setPlaceholder(reader.result)
        }
    }

    const refer = e =>{ 
        let {img} = e.target.dataset;
        preview([img], true)
    }
    const handleImgError = e => {
        e.target.src = labelImg
    }

    const handleProductUpdate = async(e) => {
        e.preventDefault();
        let fd = new FormData();
        for (const key in editingProduct) {
            fd.append(key, editingProduct[key])
        }
        try {
            const {data} = await axios.post(`products/update`, fd, {
                headers: {
                    'Accept': 'application/json',
                    "Content-Type" : "multipart/form-data",
                    'pos-token' : localStorage.getItem('pos-token')
                }
            });
            if(data.status) {
                toast.success("Product updated!")
                console.log(editingProduct);
                dispatch(
                    commonApiSlice.util.updateQueryData('getProducts', undefined, (draft) => {
                        const {products} = draft
                        const {updated} = data;
                        const index = products.findIndex((item) => item.id === parseInt(updated.id));
                        if (index !== -1) {
                            draft['products'][index] = updated;
                            draft['products'][index]['catName'] = cats.find( c => c.id === updated.category_id).name;    
                        }
                    })
                ); 
                dispatch(
                    commonApiSlice.util.updateQueryData('getPosProducts', undefined, draft => {
                        const {products} = draft
                        const {updated} = data;
                        const index = products.findIndex((item) => item.id === parseInt(updated.id));
                        if (index !== -1) draft['products'][index] = updated; // Update the item in the cache
                    })
                )
            } else {
                toast.error(data.message); 
            }
        } catch (error) {
            toast.error(`Exception`);
            console.log(error)
        }
        
    }
  
    const toggleModal = () => setModal(!modal)

    const edit = (e) => {
        let {id} = e.target.dataset;
        let product = rowData.find( item => item.id === parseInt(id))
        setEditingProduct(product);
        toggleModal()
    }

    const removeProduct = async e => {
        if(window.confirm("Are you sure")) {
            const {id} = e.target.dataset;
            try {
                await deleteProduct({id}).unwrap(); 
                dispatch({ type:"RESET_KART" }) // the product could be already chosen in one
            } catch (error) {
                console.log(error.message);
            }
        }
    }

    const labelStyle = {
        cursor: 'pointer',
        borderRadius: '10px',
        height: '145px',
        width: '145px'
    }


    useEffect(()=> {
        if(catSuccess){
            setCats(categories.categories)
        }
    },[catSuccess, categories])

    useEffect(()=> {
        if(taxAaGaya) setTaxes(taxess.taxes);
    },[taxess, taxAaGaya])

    useEffect(() => {
        if(rowData.length) {
            $(tableRef.current).DataTable({
            //   paging: true,
              data: rowData,
              columns: [
                { 
                    title: "",
                    render: (data, type, row) => {
                        return `<div class="card-body d-flex grid-view">
                            <div class="col-9 d-block" >
                                <div class="row">
                                    <strong class="wrapped-text">${wrapText(row.name, 50)}<span class="${row.name?.length > 28? 'tooltiptext':`d-none`}">${row.name}</span></strong>
                                </div>
                                <div class="row mt-2" >
                                    <p> Price: ${currency+' '+row?.price}
                                        <button class="btn btn-sm ms-2" style="border:1px solid gray"
                                            onclick="()=> printBarcode(${row?.code})" >
                                            <i class="fa-solid fa-barcode" style="font-size:1rem"></i>    
                                        </button>
                                    </p>
                                </div> 
                            </div>
                            <div class="col-3 text-center position-relative">
                                <img src="http://localhost:5100/images/${row.image}" onerror="this.src='${labelImg}'" alt=''/>
                                <div class='image-container d-none' style="background-image:url(http://localhost:5100/images/${row.image}); background-size:cover;background-repeat:no-repeat" />
                                
                            </div>
                        </div>`
                    }
                }, 
                { 
                    title: "",
                    render: (data, type, row) => {
                        return `<div class="card-body d-flex grid-view">
                            <div class="col-9 d-block" >
                                <div class="row">
                                    <strong class="wrapped-text">${wrapText(row.name, 50)}<span class="${row.name.length > 28? 'tooltiptext':`d-none`}">${row.name}</span></strong>
                                </div>
                                <div class="row mt-2" >
                                    <p> Price: ${currency+' '+row.price}
                                        <button class="btn btn-sm ms-2" style="border:1px solid gray"
                                            onclick="()=> printBarcode(${row.code})" >
                                            <i class="fa-solid fa-barcode" style="font-size:1rem"></i>    
                                        </button>
                                    </p>
                                </div> 
                            </div>
                            <div class="col-3 text-center position-relative">
                                <img src="http://localhost:5100/images/${row.image}" onerror="this.src='${labelImg}'" alt=''/>
                                <div class='image-container d-none' style="background-image:url(http://localhost:5100/images/${row.image}); background-size:cover;background-repeat:no-repeat" />
                                
                            </div>
                        </div>`
                    }
                }, 
                { 
                    title: "",
                    render: (data, type, row) => {
                        return `<div class="card-body d-flex grid-view">
                            <div class="col-9 d-block" >
                                <div class="row">
                                    <strong class="wrapped-text">${wrapText(row.name, 50)}<span class="${row.name.length > 28? 'tooltiptext':`d-none`}">${row.name}</span></strong>
                                </div>
                                <div class="row mt-2" >
                                    <p> Price: ${currency+' '+row.price}
                                        <button class="btn btn-sm ms-2 bcode" style="border:1px solid gray"
                                            onclick="()=> printBarcode(${row.code})" >
                                            <i class="fa-solid fa-barcode" style="font-size:1rem"></i>
                                        </button>
                                    </p>
                                </div> 
                            </div>
                            <div class="col-3 text-center position-relative">
                                <img src="http://localhost:5100/images/${row.image}" onerror="this.src='${labelImg}'" alt=''/>
                                <div class='image-container d-none' style="background-image:url(http://localhost:5100/images/${row.image}); background-size:cover;background-repeat:no-repeat" />
                            </div>
                        </div>`
                    }
                }
              ],
              searching: true,
              info: true,
              processing:true,
              ordering: true,
              lengthMenu:[ 10,25,50]
            });
            $(tableRef.current).on('click', '.image-container', e => refer(e))
            $(tableRef.current).on('click', '.bcode.btn', e => printBarcode(e.target.dataset.code))
        }
        $.fn.DataTable.ext.errMode = 'none';
        return () => $(tableRef.current).DataTable().destroy();

      }, [view, rowData]);

    useEffect(() => {
        if(rowData.length) {
            $(listtableRef.current).DataTable({
                data: rowData,
                columns: [
                    /*
                    
                    Action*/
                    { data: "name", title: "Name" },
                    { data: "catName", title: "Category" },
                    { 
                        data: null, 
                        title: "Price",
                        render: (data,type, row) => {
                            return `${currency} ${row.price}`
                        }
                    },
                    { data: "code", title: "Barcode" },
                    { data: "weight", title: "Weight" },
                    {   
                        data: null, 
                        title: "Description",
                        render: (data, type, row) => {
                            return `
                                <p class="wrapped-text">
                                    ${wrapText(row.sales_desc??'', 25)}
                                    <span class="${row.sales_desc?.length > 28? 'tooltiptext':`d-none`}">${row.sales_desc}</span>
                                </p>
                            `
                        }
                    },
                    {   
                        data: null,
                        title: "Image",
                        render: (data, type, row) => {
                            return `<div class="position-relative img">
                                <img 
                                    class='img-fluid img-thumbnail'
                                    src="http://localhost:5100/images/${row.image}" 
                                    alt=''
                                    data-img="${row.image}"
                                    onerror="this.src='${labelImg}'"
                                />
                            </div>`
                        },

                    },
                    {
                      data: null, // No direct data, render custom content
                      title: "Actions",
                      render: (data, type, row) => {
                        return `
                          <button class="edit-list btn btn-success btn-sm btn-rounded" data-id="${row.id}">Edit</button>
                          <button class="barcode-list btn btn-success btn-sm btn-rounded" data-code="${row.code}">Barcode</button>
                          <button class="delete-list btn btn-danger btn-sm btn-rounded" data-id="${row.id}">Delete</button>
                        `;
                      },
                    },
                ],
                paging: true,
                searching: true,
                processing:true,
                info: true,
                ordering: true,
                lengthMenu:[ 10,25,50]
            });

            $(listtableRef.current).on('click', '.edit-list.btn', e => {
                edit(e)
            })
            $(listtableRef.current).on('click', '.barcode-list.btn', e => printBarcode(e.target.dataset.code))
            $(listtableRef.current).on('click', '.delete-list.btn', e => removeProduct(e))
            $(listtableRef.current).on('click', '.img-thumbnail', e => refer(e))
        }
        $.fn.DataTable.ext.errMode = 'none';
        return () => $(listtableRef.current).DataTable().destroy();
    }, [view, rowData]);

    const handleView = view => {
        if(view==='grid') {
            $(listtableRef.current).DataTable().destroy();
        } else {
            $(tableRef.current).DataTable().destroy();
        }
        setView(view)
    }

    const printBarcode = (code) => {
        if(window.electronAPI) {
            window.electronAPI.generateBarcode(code)
        } else {
            Warning("Connect to a printer first!")
        }
    }
   
    useEffect(()=> {
        if(isSuccess)
        { 
            setRowData(data.products)
        }
    },[isSuccess, data])
  
    return (
        <> 
        <div className="row w-100 h-100 mt-4"> 
            <div className="col-lg-12 grid-margin stretch-card"> 
                <div className="card">
                    <div className="card-header" >
                            <div style={{display:'flex',alignItems:'end',justifyContent:'space-between'}}>
                            <div/> 
                            <div className="d-flex flex-end" style={{width:'140px',justifyContent:'space-around',alignItems:'center'}}>
                                <button type="button" className={`btn btn-outline-light btn-sm`} style={{ backgroundColor:view==='grid' && '#55aaad', color: view=== 'grid' && '#fff' }} onClick={()=>handleView('grid')} > Grid </button>
                                <button type="button" className={`btn btn-outline-light btn-sm`} style={{ backgroundColor:view==='list' && '#55aaad',color: view=== 'list' &&'#fff' }} onClick={()=>handleView('list')} > List </button>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        {view==='list' && <table className='table' ref={listtableRef} />}
                        {view === 'grid' && <table ref={tableRef} className='table grid-view' />}
                        {rowData.length ===0 && <h3>No products yet..</h3>}
                    </div>
                   
                    <Modal isOpen={modal} toggle={toggleModal} className="modal-md" > 
                        <Form onSubmit={handleProductUpdate} id="updateForm">
                            <ModalHeader toggle={toggleModal}> Update Product </ModalHeader>
                                <ModalBody >
                                    <div className="col-md-12 d-flex justify-content-center">
                                        <div className="col-md-6">
                                            <div className="row mt-2">
                                                <div className="col-4 align-self-center">
                                                    <label htmlFor="name">Name</label>
                                                </div>
                                                <div className="col-8">
                                                    <input type="text" id="name" name="name" className="form-control" onChange={changeProductField} defaultValue={editingProduct.name} />
                                                </div>
                                            </div>
                                            <div className="row mt-2">
                                                <div className="col-4 align-self-center">
                                                    <label htmlFor="price">Price</label>
                                                </div>
                                                <div className="col-8">
                                                    <input type="text" id="price" name="price" pattern="^\d+(\.\d+)?$" title="price should be in numbers" className="form-control" defaultValue={ editingProduct.price } onChange={changeProductField} placeholder={currency}/>
                                                </div>
                                            </div>
                                            <div className="row mt-2">
                                                <div className="col-4 align-self-center">
                                                    <label htmlFor="barcode"> Barcode </label>
                                                </div>
                                                <div className="col-8">
                                                    <input type="text" name="code" defaultValue={editingProduct.code} onChange={changeProductField} className="form-control" id="barcode" />
                                                </div>
                                            </div>
                                            <div className="row mt-2">
                                                <div className="col-4 align-self-center">
                                                    <label htmlFor="tax">Tax</label>
                                                </div>
                                                <div className="col-8">
                                                    <select name="tax" ref={selectRef} className="form-control select2" id="tax" onChange={changeProductField}>
                                                        {taxes.map( tax => <option key={tax.id} value={tax.amount+' '+tax.name}>{tax.amount+' '+tax.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row mt-2">
                                                <div className="col-4 align-self-center">
                                                    <label htmlFor="category">Category</label>
                                                </div>
                                                <div className="col-8">
                                                    <select name="category_id" className="form-control select2" id="category" onChange={changeProductField}>
                                                        {cats.map( cat => <option key={cat.id} value={cat.id} selected={cat.name===editingProduct.catName}> {cat.name} </option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4 offset-1 align-content-center">
                                            <div className="row mt-2">
                                                <div className="form-group position-relative img">
                                                    <h5> Update Image </h5>
                                                    <label htmlFor="image">
                                                        <img 
                                                            src={ uploadedSrc ? uploadedSrc :`http://localhost:5100/images/${editingProduct.image}`} 
                                                            alt=""
                                                            onError={handleImgError} 
                                                            style={labelStyle}  
                                                        />
                                                    </label>
                                                    <input name="image" type="file" id="image" className="d-none" onChange={handleFile} accept="image/*" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ModalBody>
                            <ModalFooter>
                                <button className="btn btn-light btn-rounded" type="button" onClick={toggleModal}>
                                    Close
                                </button>
                                <button className="btn btn-success btn-rounded"> Update </button>
                            </ModalFooter> 
                        </Form>
                    </Modal>
                </div>
            </div>
        </div>
        </>
    );
};

export default Products
