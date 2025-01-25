import React, { useEffect, useRef, useState } from "react";
import $ from "jquery";
import { useSelector } from "react-redux";
import { Form, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { useDeleteProductMutation, useGetProductCategoriesQuery, useGetProductsQuery, useGetTaxesQuery, useUpdateProductMutation } from "../../features/centerSlice";
import { chunk, wrapText } from "../../helpers/utils";
import toast from "react-hot-toast";
import axios from "axios";
import { preview } from "../../helpers/attachments";

const Products = () => {

    const listtableRef = useRef();
    const tableRef = useRef();
    const selectRef = useRef();


    const {data:categories, isSuccess:catSuccess} = useGetProductCategoriesQuery();
    const {data:taxess, isSuccess:taxAaGaya} = useGetTaxesQuery();
    // const [ updateProduct ] = useUpdateProductMutation();
    const [ deleteProduct ] = useDeleteProductMutation();
    // console.log(deleteProduct)

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
        // let a = document.createElement('a');
        // a.href = 'http://localhost:5000/images/'+img;
        // a.target = "_blank";
        // a.click()
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
            console.log(data);

        } catch (error) {
            console.log(`Exception on first sight`, error.message)
            toast.error(`Exception on first sight`);
        }
        
    }
  
    const [ hovered, setHovered ] = useState('');
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
        $(tableRef.current).DataTable({
        //   paging: true,
          searching: true,
          info: true,
          ordering: true,
          pageLength:40
        });
        $.fn.DataTable.ext.errMode = 'none';
      }, [view]);

    useEffect(() => {
        $(listtableRef.current).DataTable({
            paging: true,
            searching: true,
            info: true,
            ordering: true,
            pageLength:40
        });
        $.fn.DataTable.ext.errMode = 'none';
    }, [view]);

    const handleView = view => {
        if(view==='grid') {
            $(listtableRef.current).DataTable().destroy();
        } else {
            $(tableRef.current).DataTable().destroy();
        }
        setView(view)
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
                    <div className="card-header" onMouseEnter={()=>setHovered('')}>
                            <div style={{display:'flex',alignItems:'end',justifyContent:'space-between'}}>
                            <div/> 
                            <div className="d-flex flex-end" style={{width:'140px',justifyContent:'space-around',alignItems:'center'}}>
                                <button type="button" className={`btn btn-outline-light btn-sm`} style={{ backgroundColor:view==='grid' && '#55aaad', color: view=== 'grid' && '#fff' }} onClick={()=>handleView('grid')} > Grid </button>
                                <button type="button" className={`btn btn-outline-light btn-sm`} style={{ backgroundColor:view==='list' && '#55aaad',color: view=== 'list' &&'#fff' }} onClick={()=>handleView('list')} > List </button>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        {view==='list' && <table className='table' ref={listtableRef}>
                            <thead onMouseEnter={()=>setHovered('')}>
                                <tr>
                                    <th> Name</th>
                                    <th> Category</th>
                                    <th> Price</th>
                                    <th> Barcode</th>
                                    <th> Weight</th>
                                    <th> Description</th> 
                                    <th> Image</th>
                                    <th> Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rowData?.map( row => <tr key={row.id}> 
                                    <td onMouseEnter={()=>setHovered('')}>{row.name}</td>
                                    <td onMouseEnter={()=>setHovered('')}>{row.catName}</td>
                                    <td onMouseEnter={()=>setHovered('')}>{currency +' '+row.price}</td>
                                    <td onMouseEnter={()=>setHovered('')}>{row.code}</td>
                                    <td className='position-relative' onMouseEnter={()=>setHovered('')}>
                                        {row.weight}
                                    </td>
                                    <td onMouseEnter={()=>setHovered('')}>
                                        <p className="wrapped-text">
                                            {wrapText(row.sales_desc, 25)}
                                            <span className={row.sales_desc?.length > 28? 'tooltiptext':`d-none`}>{row.sales_desc}</span>
                                        </p>
                                    </td>
                                    <td className='position-relative img'>
                                        <img 
                                            className='img-fluid img-thumbnail'
                                            src={`http://localhost:5000/images/${row.image}`} 
                                            onMouseEnter={()=>setHovered(row.id)}
                                            alt=''
                                        />
                                        {
                                            hovered === row.id && <div className='image-container' onClick={refer} data-img={row.image} style={{backgroundImage:`url('http://localhost:5000/images/${row.image}')`, backgroundSize:'cover', backgroundRepeat:'no-repeat'}} />
                                        }
                                    </td>
                                    <td onMouseEnter={()=>setHovered('')}>
                                        <div className="action-plate d-flex" style={{justifyContent:'space-between',gap:4}} >
                                            <button className="btn btn-sm btn-success" data-id={row.id} onClick={edit} > Edit </button>
                                            <button className="btn btn-sm btn-success" data-id={row.id}> Barcode </button>
                                            <button className="btn btn-sm btn-danger" data-id={row.id} onClick={removeProduct} > Delete </button>
                                        </div>
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>}
                        {view === 'grid' && (
                            <table ref={tableRef} className='table grid-view'>
                                <thead>
                                    <tr className='d-none'>
                                        <th>Col</th>
                                        <th>Col</th>
                                        <th>Col</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chunk(rowData,3).map( (chunk,i) => <tr key={i}>
                                        { chunk.map( row => (<td key={row.id} colSpan={ chunk.length < 3 ? chunk.length: 0 }> <div className={`card-body d-flex grid-view`} >
                                            <div className={`col-9 d-block`} >
                                                <div className={`row`}>
                                                    <strong className="wrapped-text">{wrapText(row.name, 50)}<span className={row.name.length > 28? 'tooltiptext':`d-none`}>{row.name}</span></strong>
                                                </div>
                                                <div className="row mt-2" >
                                                    <p> Price: {currency+' '+row.price}
                                                        <button className="btn btn-sm ms-2" style={{border:'1px solid gray'}}>
                                                            <i className="fa-solid fa-barcode" style={{fontSize:'1rem'}}/>    
                                                        </button>
                                                    </p>
                                                </div> 
                                            </div>
                                            <div className="col-3 text-center position-relative">
                                                <img src={`http://localhost:5000/images/${row.image}`} onMouseEnter={()=>setHovered(row.id)} alt=''/>
                                                {
                                                    hovered === row.id && <div className='image-container' style={{backgroundImage:`url(http://localhost:5000/images/${row.image})`, backgroundSize:'cover', backgroundRepeat:'no-repeat'}} />
                                                }
                                            </div>
                                        </div></td>))}
                                    </tr>)}
                                </tbody>
                            </table>
                        )}
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
                                                    <input type="text" id="name" name="name" className="form-control" defaultValue={editingProduct.name} />
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
                                                        {taxes.map( tax => <option value={tax.amount+' '+tax.name}>{tax.amount+' '+tax.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row mt-2">
                                                <div className="col-4 align-self-center">
                                                    <label htmlFor="category">Category</label>
                                                </div>
                                                <div className="col-8">
                                                    <select name="category_id" className="form-control select2" id="category" onChange={changeProductField}>
                                                        {cats.map( pussy => <option value={pussy.id} selected={pussy.name===editingProduct.catName}> {pussy.name} </option>)}
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
                                                            src={ uploadedSrc ? uploadedSrc :`http://localhost:5000/images/${editingProduct.image}`} 
                                                            alt="" 
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
