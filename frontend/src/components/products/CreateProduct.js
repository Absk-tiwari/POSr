import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import {useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast'
import product from '../../asset/images/default.png';
import GIF from '../../asset/images/progress.gif';
import xlsImg from '../../asset/images/xls.png';
import axios from 'axios';
import { Warning } from '../../helpers/utils';
import { commonApiSlice, useGetPosProductsQuery, useGetProductCategoriesQuery, useGetProductsQuery } from '../../features/centerSlice';

function CreateProduct() {
    const { currency }= useSelector(state => state.auth);
    const [ categories , setCategories] = useState([])
    const { refetch } = useGetPosProductsQuery();
    const { refetch: refetchOrg} = useGetProductsQuery()
    const { refetch: refetchCat } = useGetProductCategoriesQuery()
    const [ taxes , setTaxes] = useState([])
    const input = {borderRadius: '25px'};
    const dispatch = useDispatch();
    const [xls, noteFile] = useState(null);
    const navigate = useNavigate();
    const [fields, setFields] = useState({name:'',price:'',category_id:'',barcode:'',tax:'',image:null})

    const handleFile =e => {
        setFields({...fields, image: e.target.files[0]??null })
    }

    const importXl = e => {

        e.preventDefault();

        let fd = new FormData();
        if(!xls) return toast.error('Fill the required fields!')

        fd.append('file', xls);
        dispatch({type:"LOADING"});

        axios.post(`/products/import`, fd, {
            headers:{ 
                "Accept"       :"application/json",
                "Content-Type" : "multipart/form-data",
                "pos-token": localStorage.getItem('pos-token')
            }
        }).then(({data}) => {
            if(data.status) {
                refetch()
                refetchOrg()
                refetchCat()
                navigate('/products');
                return toast.success(data.message);
            }
            return toast.error(data.message);
        }).catch(()=> toast.error("Failed to import excel.Re-check the format and try again!"))
        .finally(()=> dispatch({type:"STOP_LOADING"}));

    }

    const change = e => {
        setFields({...fields, [e.target.name]: e.target.value })
    }
    const addProduct = async e => {
        e.preventDefault();
        if(!fields.name || !fields.barcode || !fields.price) {
            return Warning("Fill the required fields")
        }
        let fd = new FormData();
        for (const field in fields) {
            fd.append(field, fields[field])
        }
        dispatch({type:"LOADING"})

        try {
            const {data} = await axios.post(`/products/create`, fd, {
                headers:{ 
                    "Accept"       :"application/json",
                    "Content-Type" : "multipart/form-data",
                    "pos-token"    : localStorage.getItem('pos-token')
                }
            })
            if(data.status) {
                toast.success(data.message)
                dispatch(
                    commonApiSlice.util.updateQueryData('getPosProducts', undefined, cache => {
                        if(cache['products']){
                            cache['products'].unshift(data.product)
                        }
                    })
                )
                dispatch(
                    commonApiSlice.util.updateQueryData('getProducts', undefined, cache => {
                        if(cache['products']){
                            cache['products'].unshift(data.product)
                        }
                    })
                )
                dispatch({type:"STOP_LOADING"})
                navigate('/products')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)    
        }
        dispatch({type:"STOP_LOADING"})
    }

    const getCategories = ()=> {
        axios.get('category').then(({data}) => {
            if(data.status){ 
                setCategories(data.categories)
            }
        })
    }
    const getTaxes = ()=> {
        axios.get('tax').then(({data}) => {
            if(data.status){ 
                setTaxes(data.taxes)
            }
        })
    }

    useEffect(()=> { 
        getCategories();
        getTaxes();

        return ()=> null
    },[])

    function putFile(e){
        e.preventDefault();
        noteFile(e.target.files[0])
    }
    
    return (
        <>
        <div className="content-wrapper">
            <div className="row">
                <div className="col-md-12 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mt-2">Create Product</h4>
                        </div>
                        <div className="card-body">
                            <div className="row" id="hider">
                                <div className="col-6">
                                    <form onSubmit={addProduct} >
                                        <div className="card-body">
                                            <div className="row" style={{width:'100%'}} >
                                                <div className="col-10">
                                                    <div className="form-group">
                                                        <label htmlFor="product_name" className="fs-5"> Product </label> <br/>
                                                        <textarea name="name" onChange={change} id="product_name" className="form-control" style={input} placeholder="e.g. somethin"></textarea>
                                                    </div>
                                                </div>
                                                <div className="col-2">
                                                    <div className="form-group">
                                                        <label htmlFor="product_image" >
                                                            <img src={product} alt="" className="label-img"/>
                                                        </label>
                                                        <input name="image" id="product_image" onChange={handleFile} accept="image/*" type="file" className="d-none" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">

                                                <div className="col-8">
                                                    <div className="row mb-1">
                                                        <div className="col-4 align-self-center">
                                                            Category
                                                        </div>
                                                        <div className="col-8">
                                                            <select name="category_id" onChange={change} className="form-control" style={input}>
                                                                <option value=""> Choose </option>
                                                                {categories.map( opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="row mt-3">
                                                        <div className="col-4">
                                                            Sales Taxes
                                                        </div>
                                                        <div className="col-8">
                                                            <select name="tax" onChange={change} className="form-control" id="" >
                                                                <option value="">Choose</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="row mt-1">
                                                        <div className="col-4 align-self-center">
                                                            Price
                                                        </div>
                                                        <div className="col-8">
                                                            <input type="text" pattern="^\d+(\.\d+)?$" onChange={change} title="Price should be number" name="price" className="form-control" id="" placeholder={currency} style={input}/>
                                                        </div>
                                                    </div>

                                                    <div className="row mt-1">
                                                        <div className="col-4 align-self-center">
                                                            Barcode
                                                        </div>
                                                        <div className="col-8">
                                                            <input type="text" name="barcode" onChange={change} placeholder='Barcode here..' style={input} className="form-control" id=""/>
                                                        </div>
                                                    </div>

                                                </div>

                                            </div>
                                        </div>
                                        <div className="row mt-2 ms-4">
                                            <button className="btn btn-rounded btn-success"> Create </button>
                                        </div>
                                    </form>

                                </div>
                                <div className="col-2 align-self-center position-relative" style={{height:'74vh',placeContent:'center'}}>
                                    <div className="l"></div>
                                    <div className="circle">
                                        <h1>OR</h1>
                                    </div>
                                </div>
                                <div className="col-4 d-grid" style={{placeContent:'center'}}>
                                    <form id="importForm" onSubmit={importXl}>
                                    <div className="form-group d-flex" style={{border:'1px solid gray',borderRadius:'10px',width:'300px',position:'relative'}}> 
                                        <label htmlFor="importFile" style={{width:'100%',height:'100%'}}>
                                            <img className="xlsImg" src={xlsImg} alt=""/>
                                            <img className="spinner d-none" src={GIF} alt="spinner"/>
                                        </label> 
                                        <input type="file" name="file" id="importFile" className="d-none" accept=".csv, .xls, .xlsx" onChange={putFile}/> 
                                        </div> 
                                        <button type="submit" className="btn btn-primary uploadBtn" disabled={!xls}> Upload Excel </button>
                                    </form>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default CreateProduct