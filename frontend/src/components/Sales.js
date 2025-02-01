import React, { useRef } from 'react';
import $ from 'jquery';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { capitalFirst, formatDatefromTimestamp } from '../helpers/utils';
import {Modal, ModalHeader, ModalBody, ModalFooter, Form, Card, CardBody } from 'reactstrap';
import toast from 'react-hot-toast';
$.fn.DataTable.ext.errMode = 'none';
export default function Sales() {
    
    const dispatch = useDispatch();
    const tableRef = useRef();
    const [ closing_cash, setClosingCash ] = useState(0)
    const [ orders, setOrders] = useState([]);
    const [ orderProducts, setOrderProducts] = useState([]);
    const [ open, setModal ] = useState(false);
    const [ reportModal, setReportModal ] = useState(false);
    const [ total, setTotal ] = useState(0);
    const [ sessionID, setSessionID ] = useState(1);
    const [ paymentMethod, setPaymentMethod ]= useState(0);
    const [ cashierEmail, setCashierEmail ] = useState('');
    const [ reportType, setReportType ] = useState('');
    const [ dates, setDates ] = useState({ from:'', to:''})

    const {isAdmin, currency, openingCash} = useSelector( state => state.auth );
    const setDate = e => setDates({...dates, [e.target.name]: e.target.value });
    const [today, setToday] = useState(true);

    const view = e => {
        dispatch({ type:`LOADING` });
        const order = orders[e.target.dataset.index];
        if( order ) {
            axios.get(`orders/view-order/${order.id}`).then(({data})=> { 
                const {products, session} = data;
                const sessionData = JSON.parse(session.data);
                setTotal(data.order.amount);
                setPaymentMethod(data.order.payment_mode);
                setSessionID(order.session_id)
                setCashierEmail(data.cashier?.email)
                toggleModal();
                
                let orderedProducts = Object.values(products).map( pr => ({...pr, stock:sessionData?.quantity[pr.id]}) );
                if((sessionData?.products??[]).indexOf('quick') !== -1) {
                    let overallExcept = orderedProducts.reduce( (pre,a) => pre + parseFloat(a.price * sessionData?.quantity[a.id]), 0);
                    let otherPrice = data.order.amount - overallExcept;
                    orderedProducts = [...orderedProducts, {name:"Others", price: otherPrice, id:`quick`, stock: sessionData?.quantity['quick']}];
                }
                setOrderProducts(orderedProducts);

            }).catch()
            .finally( () => dispatch({ type:`STOP_LOADING` }))
        } else {
            console.log(order, e.target.dataset.index, orders)
        }
    }

    const toggleModal = () => setModal(!open)

    const toggleReport = () => setReportModal(!reportModal)

    const generateReceipt = async (e) => {
        e.preventDefault();

        if(reportType) {
            console.log(openingCash)
            const payload = {
                currency,
                today,
                from: dates.from,
                to: dates.to,
                register_id: openingCash.id,
                closing_cash,
            }
            if(reportType==='X') {
                dispatch({ type:"LOADING" })
                
                const {data} = await axios.post(`/orders/x-report`, payload);
                if(data.status) {
                    toast.success(data.message );
                } else {
                    toast.error(data.message)
                }
                dispatch({ type:"STOP_LOADING" })

            } else {
                if(window.confirm("This will reset all sessions for current cash registered!")) {
                    
                    dispatch({ type:"LOADING" })
                    const {data} = await axios.post(`orders/z-report`, payload);
                    if(data.status) {
                        if(window.electronAPI){
                            window.electronAPI.printReport(data.html)
                        }
                        localStorage.setItem('cartSessions','[1]');
                        dispatch({ type:"RESET_KART" });
                        dispatch({ type: "DAY_CLOSE" })
                        toast.success(data.message)
                    } else {
                        toast.error(data.message);
                    }
                    dispatch({ type:"STOP_LOADING" })
                }
            }
        }
    }

    useEffect(()=> {
        axios.get('orders').then(({data}) => setOrders(data.orders)).catch(()=>{})
        return () => null
    },[])

    useEffect(() => {
        $(tableRef.current).DataTable({
            paging: true,
            searching: true,
            info: true,
            ordering: true,
            pageLength:40
        });
        return ()=> null;
    },[orders])

    return (
        <>
        <div className="content-wrapper" style={{width:'100%'}}>
            <div className="row">
                <div className="col-lg-12 grid-margin stretch-card">
                    <div className='d-block position-absolute' style={{zIndex:9999,right:60}}>
                        <button className='btn btn-success btn-rounded' onClick={toggleReport}> Generate Report </button>
                    </div>
                    <div className="card mt-5">
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered" ref={tableRef} >
                                    <thead>
                                        <tr>
                                            <th> Order ID </th>
                                            <th> Session ID </th>
                                            <th> Customer </th>
                                            <th> Amount </th>
                                            <th> Date </th>
                                            <th> Transaction Type </th>
                                            {isAdmin && (<>
                                                <th> Cashier </th>
                                                <th> Action </th>
                                            </>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        { orders.map((order,i) => (<tr key={order.id}>
                                            <td>{order.id}</td>
                                            <td>{order.session_id}</td>
                                            <td>{order.customer?.name}</td>
                                            <td>{currency +" "+parseFloat(order.amount).toFixed(2) }</td>
                                            <td>{formatDatefromTimestamp(order.created_at)}</td>
                                            <td>{order.transaction_type}</td>
                                            { isAdmin && (<>
                                                <td> {order.cashier?.name} </td>
                                                <td>
                                                    <Link type="button" data-index={i} className="text-decoration-none" onClick={view}> View </Link>
                                                </td>
                                            </>)}
                                        </tr>))}
                                        
                                        { orders.length===0 && <tr>
                                            <td colSpan={9} >
                                                <p className="text-danger text-center"> No orders yet </p>
                                            </td>
                                        </tr> }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal isOpen={reportModal} >
            <Form onSubmit={generateReceipt}>
                <ModalHeader>
                    <span className="report-type"> Generate-Report</span>
                </ModalHeader>
                <ModalBody>
                    <Card>
                        <CardBody>
                            <div className="card-body asking">
                                <div className="container" style={{placeItems:'center'}}>
                                    <div className="row">
                                        <b> Select Type </b>
                                    </div>
                                    <div className="row mt-2">
                                        <button className={`btn btn-rounded btn-success ms-3 ${reportType && reportType!=='X' ? 'btn-inactive':''}`} type='button' onClick={()=> setReportType('X')} style={{border:'5px solid #afe9f5'}}> X-Report </button>
                                        <button className={`btn btn-rounded btn-danger ms-3 ${reportType && reportType!=='Z'?'btn-inactive': ''}`} type='button' onClick={()=> setReportType('Z')} style={{border:'5px solid #afe9f5'}}> Z-Report </button>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body the-report" style={{ display:reportType==='' && 'none' }}>
                                <input type="hidden" name="type" defaultValue={reportType}/>
                                <div className="row mb-2">
                                    <div className="col-3">
                                        <label htmlFor=""> Today </label>
                                    </div>
                                    <div className="col-7">
                                        <input type="checkbox" name="today" checked={today} onChange={()=>setToday(!today)} />
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-3" style={{alignSelf:'center'}}>
                                        <strong className="mt-3"> From </strong>
                                    </div>
                                    <div className="col-9">
                                        <input type="date" name="from" className="form-control" onChange={setDate} style={{float:'right'}}/>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-3" style={{alignSelf:'center'}}>
                                        <strong className="mt-3"> To </strong>
                                    </div>
                                    <div className="col-9">
                                        <input type="date" name="to" className="form-control" onChange={setDate} style={{float:'right'}}/>
                                    </div>
                                </div>
                                {
                                    reportType==='Z' && (<div className="row mt-3">
                                        <div className="col-12">
                                            <input className='input' type="number" style={{border:'1px solid'}} placeholder={`Closing cash in drawer `+currency} required name="closing_cash" onChange={e => setClosingCash(e.target.value)}/>
                                        </div>
                                    </div>)
                                }
                            </div>
                        </CardBody>
                    </Card>
                </ModalBody>
                <ModalFooter>
                    <button type="button" className="bg-light btn btn-rounded" onClick={toggleReport}>Close</button>
                    <button className="bg-info btn text-white btn-rounded" > Generate </button>
                </ModalFooter>
            </Form>
        </Modal>
       
        <Modal isOpen={open}>
            <ModalHeader>
                <p style={{fontSize:'1.5rem'}}>Order Details</p>
            </ModalHeader>
            <ModalBody>
                <div className="col-lg-12" id="receipt">
                    <div className="container" style={{backgroundColor:'white',paddingBottom:'10px',borderRadius:'15px'}} >
                        <div className="row" style={{display:'flex'}}>
                            <div className="d-grid text-center w-100" style={{justifyContent:'center'}}>
                                <p > Served by <b>{cashierEmail}</b> </p>
                                Session <h2 className="sessionID">#{sessionID}</h2>
                            </div>
                        </div>
                        <div className="row">
                            <div className="receipt" style={{width:'90%',background:'#fff',marginLeft:'5%'}}>
                                {orderProducts.map( (order,i) => <div key={i} className='row mt-2 chosen-product' >
                                        <div className='d-flex w-100'>
                                            <b>{order.name}</b>
                                            <strong className='price'> Qty: {order.stock}</strong>
                                        </div>
                                        <div className='d-flex'>
                                            <p className='ms-3 mt-1' style={{fontFamily:'cursive'}}>
                                                { currency +' '+ order.price }
                                                { order.id !=='quick' && '/ Units'}  
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="">
                                    <div className="row d-flex mt-3" style={{justifyContent:'space-between'}}>
                                        <div>
                                            <h2>TOTAL </h2>
                                            <p></p>
                                        </div>
                                        <div>
                                            <h2> {currency+ ' ' + parseFloat(total).toFixed(2) } </h2>
                                            <p></p>
                                        </div>
                                    </div>
                                    <div className="row d-flex mt-0" style={{justifyContent:'space-between'}}>
                                        <div>
                                            <small> { capitalFirst(paymentMethod) } </small>
                                        </div>
                                        <div>
                                            <small> {currency+ '' + parseFloat(total).toFixed(2) } </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <button className='btn btn-light btn-rounded' onClick={()=> toggleModal(!open)}> Close </button>
            </ModalFooter>
        </Modal>

        </>
    )
}
