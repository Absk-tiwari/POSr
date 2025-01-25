import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from 'react-redux'
import { useGetNotesQuery } from '../../features/centerSlice';
import pos from '../../asset/images/pos.png'
import { capitalFirst } from '../../helpers/utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { useSearch } from '../../contexts/SearchContext';


export default function Payment() 
{
    const {active} = useParams();
    const {data, isSuccess} = useGetNotesQuery();
    const componentRef = useRef(null);
    const {setSession, sessions, setActiveSession } = useSearch();

    const [ byAll , setByAll ] = useState({Cash:0, Card:0, Account:0});

    const dispatch = useDispatch()
    const mode = {width:'96%',cursor:'pointer'}
    const reactToPrintFn = useReactToPrint({ contentRef:componentRef});
    const { currency, myInfo, cartProducts, openingCash } = useSelector(state => state.auth );
    const [notes, setNotes] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [ paidAmount, setCashAmount ] = useState(byAll.Cash + byAll.Card + byAll.Account);
    const [paymentComplete, completePayment] = useState(false);
    const [KartProducts, setKartProducts] = useState([]);

    const choosePaymentMethod = (method, amount=false) => {
        if( amount ) {
            setCashAmount(amount)
        } else { // its the method chosen manually
            // setCashAmount({...byAll, [method]: total})
            // setByAll({ ...byAll, [method]: total });
            setCashAmount( byAll.Cash+ byAll.Card + byAll.Account);
            console.log({ ...byAll, [method]: total });

        }
        setPaymentMethod(method)
    }

    const total = cartProducts[parseInt(active)]?.length? cartProducts[parseInt(active)].reduce( (acc, item) => acc + (item.stock * item.price), 0) : KartProducts.reduce( (acc, item) => acc + (item.stock * item.price), 0)
    
    const initPayment = () => {
        
        dispatch({ type:"LOADING" })
        axios.post(`orders/create`, {
            session_id: active,
            customer_id:'',
            cash_register_id: openingCash.id,
            amount: total,
            payment_mode: paymentMethod,
            transaction_type:'credit',
            sessionData: cartProducts[parseInt(active)].reduce(
                (acc, { stock, id, ...rest }) => {
                    if(acc.products.indexOf(id)===-1) acc.products.push(id);
                    acc.quantity[id] = (acc.quantity[stock] || 0) + stock; // Increment quantity
                    acc.total = total; // Accumulate total price
                    return acc;
                },
                { products: [], total: 0, quantity: {} }
            )
        }).then(({data}) => { 

            completePayment(true)
            setKartProducts(cartProducts[active]);
            
            localStorage.setItem('cartSessions', JSON.stringify(sessions.map( item => item + 1)));
            setSession(sessions.map( ite => ite + 1 ));
            
            toast.success("Order completed! You can print receipt!");
            dispatch({type: "CHOOSEN_PRODUCT" , payload: []});

        })
        .catch(()=>{})
        .finally(()=> dispatch(()=> dispatch({ type:'STOP_LOADING'})));

    }

    useEffect(() => {
        if( isSuccess ) {
            setNotes(data.notes)
        }
    },[isSuccess, data]);

    return (
        <>
     
        <div className="content-wrapper">

            <div className="col-lg-12 grid-margin stretch-card" style={{justifyContent:'space-around'}}>
                <div className="col-lg-5">
                    <div className="row" style={{height:'15rem'}}>
                        <div className="container">
                            <div className="row">
                                <div className="card ms-2 payment-cash" style={mode} onClick={()=>choosePaymentMethod('Cash')} >
                                    <div className="card-body">
                                        <div className="d-flex" style={{alignItems:'center',gap:'5px',color: '#1e283d'}}>
                                            <i className="fa fa-money" aria-hidden={true} />
                                            <strong > <p className="m-0"> Cash </p></strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row mt-2">
                                <div className="card ms-2 payment-card" style={mode} onClick={()=>choosePaymentMethod('Card')}>
                                    <div className="card-body">
                                        <div className="d-flex" style={{alignItems:'center',gap:'5px',color: '#1e283d'}}>
                                            <i className="fa fa-credit-card" aria-hidden="true" />
                                            <strong ><p className="m-0"> Card </p>  </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row mt-2">
                                <div className="card ms-2 payment-account" style={mode} onClick={()=>choosePaymentMethod('Account')}>
                                    <div className="card-body">
                                        <div className="d-flex" style={{alignItems:'center',gap:'5px',color:'#1e283d'}}>
                                            <i className="fa fa-user" aria-hidden="true" />
                                            <strong > <p className="m-0"> Customer Account </p>  </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-12 d-flex">
                            <button type="button" className="btn btn-light text-white cust" data-toggle="modal" data-target="#customer" style={{width:'49%',backgroundColor:'#56947d'}}>
                                Customer
                            </button>
                            <button type="button" className="offset-1 btn btn-light text-dark justify-content-center" style={{width:'50%',background:'',color:'white!important'}} disabled={!paymentComplete} onClick={reactToPrintFn} title="print receipt" >
                                <strong className='position-relative'> 
                                    <i className="fa-solid fa-receipt position-absolute" style={{left:-25, top:-2}} /> 
                                    Receipt 
                                </strong>
                            </button>
                        </div>
                    </div>

                    <div className="calculator">
                        <div className="row mt-2">
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 1 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 2 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 3 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light  w-100 text-dark"> <b> +10 </b> </button>
                            </div>
                        </div>
                        <div className="row mt-1">
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 4 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 5 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 6 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light w-100 text-dark"> <b> +20 </b> </button>
                            </div>
                        </div>
                        <div className="row mt-1">
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 7 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 8 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light price-num w-100 text-dark"> <b> 9 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light w-100 text-dark"> <b> +50 </b> </button>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-1">
                        <div className="col-sm-3">
                            <button className="btn btn-light w-100 text-dark"> <b> +/- </b> </button>
                        </div>
                        <div className="col-sm-3">
                            <button className="btn btn-light num w-100 text-dark"> <b> 0 </b> </button>
                        </div>
                        <div className="col-sm-3">
                            <button className="btn btn-light w-100 text-dark"> <b> . </b> </button>
                        </div>
                        <div className="col-sm-3">
                            <button className="btn btn-light w-100 text-dark"> <b className="fa fa-close">  </b> </button>
                        </div>
                    </div>
                    <div className="row mt-1">
                        <div className="col-sm-12 d-flex">
                            <button type={`button`} className={`w-100 btn btn-light text-white validate`} style={{width:'47%',backgroundColor: '#0d172c',opacity:1}} onClick={initPayment}>
                                Validate
                            </button>
                        </div>
                    </div>
                </div>
                <div className="final col-lg-6">
                    <div className="card">
                        <div className="card-body">
                            <h1 className="text-success" style={{textAlign:'center'}}>
                                <span className="total-amount">{currency + total}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="card mt-3 w-100 parent">
                        <div className="d-flex selections">
                            <strong className={`${paymentMethod && 'd-none'}`}>
                                <span className="info"> Please select a payment method </span>
                            </strong>
                            {paymentMethod && (
                                <>
                                    { total < paidAmount || total === paidAmount ? (<div className={`card fulfilled`} >
                                        <div className="card-body exception">
                                            <div className="d-flex" style={{ justifyContent:'space-between' }}>
                                                <div className="d-flex">
                                                    <i className="fa-solid fa-cash" />
                                                    <p>Return </p>
                                                </div>
                                                <b>&nbsp; {currency} {Math.abs((total - paidAmount).toFixed(2))}</b>
                                            </div>
                                        </div>
                                    </div>) : (
                                        <div className={`card remaining`}>
                                            <div className="card-body exception">
                                                <div className="d-flex" style={{ justifyContent:'space-between' }}>
                                                    <div className="d-flex">
                                                        <i className="fa-solid fa-cash" />
                                                        <p>Remaining </p>
                                                    </div>
                                                    <b>&nbsp; {currency} {Math.abs((total - paidAmount).toFixed(2))}</b>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="card methods payment-cash active" onclick="selectMethod(this)">
                                        <div className="card-body exception">
                                            <div className="d-flex" style={{justifyContent:'space-between'}}>
                                                <div className="d-flex">
                                                    <i className="fa-solid fa-cash" />
                                                    <p> { paymentMethod } </p>
                                                </div>
                                                <div className="d-flex">
                                                    <b className="price" data-paid={paidAmount}> &nbsp;{currency} { paidAmount ? paidAmount: total }</b>
                                                    <i className="mdi mdi-close mx-3" style={{cursor:'pointer'}} onClick={()=>setPaymentMethod('')} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={`container`}>
                        <div className={`row`}>
                            {notes.map((note) => (
                                <div className="col-sm-4 mt-1" style={{maxHeight:'110px',cursor:'pointer'}} onClick={()=>choosePaymentMethod('Cash', note.amount)}>
                                    <img src={process.env.REACT_APP_BACKEND_URI+'images/'+note.image} alt={''} style={{width:'100%',height:'100%',borderRadius:'10px'}} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <form id="payment-form" className="d-none">
                        <div id="pay-button"></div>
                        <div className="card-container" />
                        <button id="card-button" type="button"> Pay 1 {currency}</button>
                    </form>
                    <div id="payment-status-container" />
                </div>
            </div>
            <div className="col-lg-6 d-none" id="receipt" ref={componentRef}>
                <div className="container" style={{backgroundColor:'white',paddingBottom:'40px',borderRadius:'15px'}} >
                    <div className="row d-flex" >
                        <div className="d-grid text-center w-100" style={{justifyContent:'center'}}>
                            <img src={pos} alt="" style={{height:'150px',width:'300px'}} />
                            <small> { myInfo.email }</small>
                            <p className="mt-2"> ----------------------- </p>
                            <p> Served by { myInfo.email } </p>
                            <h2 className="sessionID">{}</h2>
                        </div>
                    </div>
                    <div className="row">
                        <div className="receipt" style={{width:'90%',background:'#fff',marginLeft:'5%'}}>
                            {
                                KartProducts.map( product => {
                                   return <div key={product.id} className='row mt-2 choosen-product receipt'>
                                        <div className='d-flex w-100'>
                                            <b>{product.name}</b>
                                            <strong className='price' style={{fontFamily:'cursive'}}>
                                                {currency+' '+ (product.stock * parseFloat(product.price)).toFixed(2)}
                                            </strong>
                                        </div>
                                        <div className='d-flex'>
                                            <span className='quantity'> {product.stock} </span>
                                            {!product.other && <p className='ms-3 mt-1'> x {currency + '' + product.price} / Units </p>}
                                        </div>
                                    </div>
                                })
                            }
                            <div >
                                <p className="text-center"> ------------------------------ </p>
                                <div className="row d-flex mt-4" style={{justifyContent:'space-between'}}>
                                    <div>
                                        <h2>TOTAL </h2>
                                        <p></p>
                                    </div>
                                    <div>
                                        <h2> {currency+ '' + total.toFixed(2) } </h2>
                                        <p></p>
                                    </div>
                                </div>
                                <div className="row d-flex mt-0" style={{justifyContent:'space-between'}}>
                                    <div>
                                        <small> { capitalFirst(paymentMethod) } </small>
                                    </div>
                                    <div>
                                        <small> {currency+ '' + total.toFixed(2) } </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
        
    )
}
