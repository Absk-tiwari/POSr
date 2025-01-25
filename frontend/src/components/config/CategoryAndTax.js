import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom'
import { Modal, ModalFooter, ModalHeader, Form, ModalBody, Row, Container, FormGroup, Label, Input } from 'reactstrap'
import { useGetProductCategoriesQuery } from '../../features/centerSlice';

function CategoryAndTax() {

    const {type} = useParams()
    const openPage = () => {};
    const dispatch = useDispatch();

    const { data:original, isSuccess } = useGetProductCategoriesQuery()
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(false);
    const containerRef = useRef(null);
    const [taxes, setTaxes] = useState([]);
    const [editingTax, setEditingTax ] = useState({})

    const [catFields, setCatField] = useState({})

    const [justifyActive, setJustifyActive] = useState(type);
    const handleJustifyClick = value => {
        if (value === justifyActive) {
            return;
        } 
        setJustifyActive(value);
    };
    const [open, setModal] = useState(false);

    const editTax = e => {
        const {index} = e.target.dataset;
        setTaxes([{...taxes[index], [e.target.name]: e.target.value}])
        // setEditingTax({...editingTax, [e.target.name]: e.target.value})
        console.log(taxes)
    }

    const toggleModal = () => setModal(!open)
    const catChange = (e) => setCatField({ ...catFields, [e.target.name]:e.target.value })

    const initTax = () => {
        setTaxes([...taxes, {name:'', amount:'', status:true }])
    }
    const initCategory = () => { 
        setCategories([...categories, { name:'', color:'', status: true }]);
        document.querySelector('.categoryTable').scrollTop = document.querySelector('.table-responsive.categoryTable').scrollHeight
        console.log('initiated?', categories)
    }

    const createCategory = e => {

        e.preventDefault();
        dispatch({type:"LOADING"});
        axios.post(`category/create`, catFields).then(({data})=> {
            console.log(data);
        }).catch(()=>{})
        .finally(()=> dispatch({type:"STOP_LOADING"}));

    }

    const deleteCategory = (id,event) => {
        const {index} = event.target.dataset
        if(!id) {
            return setCategories(categories.filter( (cat, ind)=> ind !== parseInt(index)))
        }
        if(!window.confirm('Are you sure?')) {
            return 
        }
        dispatch({ type:"LOADING" });
        axios.get(`category/remove/${id}`).then(({data})=> {
            console.log(data)
        }).catch(()=> null )
        .finally(()=> dispatch({ type:"STOP_LOADING" }))
    }

    const createTax = e => {

        e.preventDefault();
        dispatch({type:"LOADING"});
        axios.post(`category/create`, catFields).then(({data})=> {
            console.log(data);
        }).catch(()=>{})
        .finally(()=> dispatch({type:"STOP_LOADING"}));

    }

    const getTaxes = () => {
        dispatch({type:"LOADING"});
        axios.get('tax').then(({data})=> {
            console.log(data)
        }).catch(()=>{})
        .finally(()=>dispatch({type:"STOP_LOADING"}))
    }

    const edit = (id) => setEditing(id)

    const save = id => {
        const cat = categories.find( ite => ite.id === id);
        axios.post('category/update', cat).then(({data})=> console.log(data)).catch().finally()
    }

    const updateTaxRow = e => {
        e.preventDefault()
        const {index} = e.target.dataset;
        console.log(taxes[index])
        // window.alert(index)
    }

    const updateCategory = e => {
        let {index} = e.target.dataset;
        // console.log(index, categories[index]);
        setCategories([...categories, {...categories[index], [e.target.name]: e.target.value }]) 
    }

    useEffect(() => {
        if(isSuccess) {
            setCategories(original.categories);
        }
        return () => null
    },[ isSuccess,original ])

    useEffect(()=>{
        return ()=> null
    },[taxes, categories])

    const CategoryModal = () => {
        return <Modal isOpen={open} toggle={toggleModal} > 
            <Form onSubmit={createCategory} >
                <ModalHeader toggle={toggleModal}> Update Product </ModalHeader>
                    <ModalBody>
                        <Container>
                            <Row>
                                <FormGroup>
                                    <Label> Name </Label>
                                    <Input
                                        type={'text'}
                                        name='name'
                                        onChange={catChange}
                                    />
                                </FormGroup>
                            </Row>
                            <Row>
                                <FormGroup>
                                    <Label> Revised Photo </Label>
                                    <Input 
                                        name='color'
                                        type='color'
                                        onChange={catChange}
                                    />
                                </FormGroup>
                            </Row>
                            <Row>
                                <FormGroup>
                                    <Label> Status </Label>
                                    <Input 
                                        name='status'
                                        type='checkbox'
                                        onChange={catChange}
                                        defaultChecked={true}
                                    />
                                </FormGroup>
                            </Row>
                        </Container>
                    </ModalBody>
                <ModalFooter>
                    <button className="btn btn-primary" type="button" onClick={toggleModal}>
                        Close
                    </button>
                </ModalFooter> 
            </Form>
        </Modal>
    }
    
    return (
        <>
           <div className={`content-wrapper`} >
                <div className="d-grid" id="pages">
                    <div className="d-flex position-relative">
                        <button className="btn tablink" data-btn="category" onClick={() => handleJustifyClick('categories')} data-active={justifyActive==='categories'}> Categories </button>
                        <button className="btn tablink" data-btn="tax" onClick={() => handleJustifyClick('taxes')}  data-active={justifyActive==='taxes'} 
                        style={{borderTopLeftRadius:'0px',borderBottomLeftRadius:'0px'}}>
                            Taxes 
                        </button>
                    </div>
                    <div id="category" className={`tabcontent ${ justifyActive==='categories' ?'d-block': 'd-none' }`}  ref={containerRef}>
                        <div className="col-lg-12 grid-margin stretch-card">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive w-100 categoryTable">
                                        <table className='table table-bordered w-100'>
                                            <thead>
                                                <tr>
                                                    <th>S.No</th>
                                                    <th>Name</th>
                                                    <th>Color</th> 
                                                    <th>Status</th>
                                                    <th>
                                                        Action
                                                        <span className={`fa fa-plus btn-sm btn-rounded btn btn-success ms-4`} title="Create" onClick={initCategory}> New </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            { categories.map( (cat,i) => (
                                                <tr>
                                                    <td> {1 + i} </td>        
                                                    <td> <Input name='name' type='text' data-index={i} onChange={updateCategory} disabled={ cat.id && editing!==cat.id } defaultValue={cat.name}/> </td>
                                                    <td> <Input type='color' data-index={i} onChange={updateCategory} disabled={ cat.id && editing!==cat.id } defaultValue={cat.color} /> </td>        
                                                    <td>
                                                        <input type={`checkbox`} data-index={i} onChange={updateCategory} style={{display:'none'}} id={`btn`+cat.id} name={'status'} defaultChecked={cat.status} className='status'/>
                                                        <label htmlFor={`btn`+cat.id}/>
                                                        <div className='plate'/>
                                                    </td>
                                                    <td>
                                                        { cat.id && 
                                                        (<button className={`btn btn-sm btn-primary ${editing===cat.id && 'btn-success'}`} onClick={()=> editing !== cat.id ? edit(cat.id): save(cat.id)}>
                                                            { editing && editing === cat.id ? 'Save':'Edit'}
                                                        </button>)}
                                                        <button data-index={i} className={`btn btn-sm btn-danger ms-3 delete`} onClick={e=> deleteCategory(cat.id, e)}>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="tax" className={`tabcontent ${ justifyActive ==='taxes' ? 'd-block': 'd-none' }`}>
                        <div className="col-lg-12 grid-margin stretch-card">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive w-100 taxTable">
                                        <table className={`table table-bordered w-100`}>
                                            <thead>
                                                <tr>
                                                    <th>S.No</th>
                                                    <th>Name</th>
                                                    <th>Amount</th> 
                                                    <th>Status</th>
                                                    <th>
                                                        Action
                                                        <span className={`mdi mdi-plus btn-sm btn-rounded btn btn-success ms-4`} 
                                                        data-toggle="modal" data-target=".addTaxes" title="Create" onClick={initTax}> New </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {taxes.map( (tax,i) => {
                                                    return <tr key={i}>
                                                        <td>{1+i}</td>
                                                        <td>
                                                            <input data-index={i} 
                                                                name='name' 
                                                                defaultValue={tax.name} 
                                                                onBlur={updateTaxRow} 
                                                                onChange={editTax}
                                                                className='input'
                                                            />
                                                        </td>
                                                        <td>
                                                            <input 
                                                                data-index={i} 
                                                                name='amount' 
                                                                defaultValue={tax.amount} 
                                                                onBlur={updateTaxRow} 
                                                                onChange={editTax}
                                                                className='input'
                                                            />
                                                        </td>
                                                        <td>
                                                            <input type={`checkbox`} style={{display:'none'}} id={`btn-tax`+tax.id} name={'status'} defaultChecked={tax.status} className='status'/>
                                                            <label htmlFor={`btn-tax`+tax.id} />
                                                            <div className='plate' />
                                                        </td>
                                                        <td>
                                                            {tax.id && <button className='btn btn-sm btn-rounded btn-primary'> Edit </button>}
                                                            <button className='btn btn-sm btn-rounded btn-danger ms-3' onClick={()=> setTaxes(taxes.filter((item,ind)=> ind !== i))} >Delete</button>
                                                        </td>
                                                    </tr>
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

           </div>
           <div className="modal createCategory">
                <div className="modal-dialog modal-md">
                    <form onSubmit={createCategory} id="createCategory" method="POST">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div className="modal-title">
                                    <h5> Add Category </h5>
                                </div>
                            </div>
                            <div className="modal-body">
                                <div className="row align-items-center">
                                    <div className="col-4"> Name </div>
                                    <div className="col-8">
                                        <input type="text" className="form-control" name="name" />
                                    </div>
                                </div>
                                <div className="row mt-2 align-items-center">
                                    <div className="col-4"> Color </div>
                                    <div className="col-8">
                                        <input type="color" style={{width:'100px'}} placeholder="%" className="form-control" name="color" />
                                    </div>
                                </div>
                                <div className="row mt-2 align-items-center">
                                    <div className="col-4"> Status </div>
                                    <div className="col-8">
                                        <input type="checkbox" style={{display:'block'}} name="status" checked={true} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-gray btn btn-sm close" data-dismiss="modal">Close</button>
                                <button className="btn-sm btn btn-success" type="submit"> Add </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <CategoryModal/>
        </>
    )
}

export default CategoryAndTax