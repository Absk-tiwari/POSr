import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import category from '../../asset/images/category.png';
import tax from '../../asset/images/tax.png';
import currencyImg from '../../asset/images/currency.webp';
import addUser from '../../asset/images/add-user.png';
import notes from '../../asset/images/notes.webp';
import alert from '../../asset/images/alert.png';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Modal, ModalHeader, ModalFooter, ModalBody, FormGroup, Form } from 'reactstrap';

function Configuration() {
    const { currency, stockAlert } = useSelector(state => state.auth);
    const [ currencyCatogory, setCurrencyCategory ] = useState(false);
    const [ stockModal, setStockModal ] = useState(false);
    const [ minStock, setAlert ] = useState(stockAlert)
    const dispatch = useDispatch();
    const updateCurrency = () => {
        axios.get("https://api.apilayer.com/exchangerates_data/latest?symbols=EUR&base=INR", {
            redirect: 'follow',
            headers: {
              apikey : "vs3K0OZhqMCEvsgiDYTEj97mfSHKCxn7"
            }
          }).then(({data}) => console.log(data))
        .then(result => console.log(result))
        .catch(error => console.log('error', error))
    }

    const updateStockAlert = e => {
        e.preventDefault();
        axios.post('config/update-stock-alert', {stock: minStock}).then(({data}) => {
            if(data.status) {
                toast.success(data.message);                 
                dispatch({ type: "STOCK_ALERT", payload: minStock })
            } else {
                toast.error(data.message);
            }
        }).catch(()=>toast.error("Something went wrong!"))
    }

    useEffect(()=>{});

    return (
    <>
        <div className="content-wrapper">
            <div className="d-grid mt-3" style={{placeItems: 'center'}}>

                <div className="d-flex" style={{gap:'50px',marginTop:'10%'}}>
                    <div className="text-center">
                        <Link className="card redirect tablink showCat" to={`/config/categories`} title={"Categories"}>
                            <div className="card-body">
                                <div className="d-flex" title={"Categories"}>
                                    <div style={{width:'70px', textAlign:'center'}}>
                                        <img src={category} height="60" alt=''/>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <h5 className="pt-3">Category</h5>
                    </div>
                    <div className="text-center">
                        <Link className="card redirect tablink" to={`/config/taxes`} title={"Taxes"}>
                            <div className="card-body">
                                <div className="d-flex" title={"Taxes"}>
                                    <div style={{width:'70px', textAlign:'center'}} >
                                        <img src={tax} height="60" alt={''}/>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <h5 className="pt-3"> Tax </h5>
                    </div>
                   
                    <div className="text-center">
                        <div className="card redirect tablink" onClick={()=> setStockModal(!stockModal)} title={"Set stock alert"}>
                            <div className="card-body">
                                <div className="d-flex" title={"Set stock alert"}>
                                    <div style={{width:'70px', textAlign:'center'}} >
                                        <img src={alert} height="60" alt='' />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h5 className="pt-3"> Stock Alert </h5>
                    </div>
                    
                    <div className="text-center">
                        <Link className="card redirect tablink" to={`/users`} title="Add user">
                            <div className="card-body">
                                <div className="d-flex" title="Add user">
                                    <div style={{width:'70px', textAlign:'center'}} >
                                        <img src={addUser} height="60" alt=''/>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <h5 className="pt-3"> Add User </h5>
                    </div>
                    <div className="text-center">
                        <Link className="card redirect tablink" to={`/notes`} title="Add payment notes">
                            <div className="card-body">
                                <div className="d-flex" title="Add payment notes">
                                    <div style={{width:'70px', textAlign:'center'}} >
                                        <img src={notes} height="60" alt=''/>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <h5 className="pt-3"> Add Notes </h5>
                    </div>
                </div>
            </div>

        </div>

        <Modal isOpen={currencyCatogory} >
            <ModalHeader >
                Currency
            </ModalHeader>
            <ModalBody>
                <div className="form-group">
                    <select name="currency" id="currency" className="form-control" onChange={updateCurrency}>
                        <option value="euro" {...currency === '€ ' ? 'selected':''} > Euro </option>
                        <option value="inr" {...currency === '₹ ' ? 'selected':''} > INR </option>
                    </select>
                </div>
            </ModalBody>
            <ModalFooter>
                <button className='btn btn-light btn-rounded' onClick={()=> setCurrencyCategory(!currencyCatogory)}>Close</button>
            </ModalFooter>
        </Modal>

        <Modal isOpen={stockModal}>
            <Form onSubmit={updateStockAlert}>
                <ModalHeader>
                    Set stock alert
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <small><b> Select minimun stock to get notified </b></small>
                        <input type="number" className="form-control" placeholder="e.g 50, 100" onChange={ e => setAlert(e.target.value)} defaultValue={minStock} />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <button className='btn btn-light btn-rounded' type='button' onClick={()=> setStockModal(!stockModal)}>Close</button>
                    <button className='btn btn-success btn-rounded' > Update </button>
                </ModalFooter>
            </Form>
        </Modal>

        <div className="modal addTaxes">
            <div className="modal-dialog modal-sm">
                <form action="{{route('tax.create')}}" id="createTax" method="POST">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="modal-title">
                                <h5> Add Tax </h5>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="row align-items-center">
                                <div className="col-4"> Type </div>
                                <div className="col-8">
                                    <input type="text" className="form-control" name="name"/>
                                </div>
                            </div>
                            <div className="row mt-2 align-items-center">
                                <div className="col-4"> Amount </div>
                                <div className="col-8">
                                    <input type="text" placeholder="%" className="form-control" name="amount"/>
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

    </>
    )
}

export default Configuration