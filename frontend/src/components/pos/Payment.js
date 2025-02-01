import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from 'react-redux'
import { commonApiSlice, useGetNotesQuery } from '../../features/centerSlice';
import pos from '../../asset/images/pos.png'
import { capitalFirst, Warning } from '../../helpers/utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useSearch } from '../../contexts/SearchContext';
import html2canvas from 'html2canvas';


export default function Payment() 
{
    const targetDiv = useRef(null);
    const navigate = useNavigate();
    const {active} = useParams();
    const [receiptOn, setReceipt] = useState(JSON.parse(localStorage.getItem('prt_receipt')??'false'));
    const { data, isSuccess } = useGetNotesQuery();
    const componentRef = useRef(null);
    const { setSession, sessions } = useSearch();
    const [ byAll, setByAll ] = useState({Cash:0, Card:0, Account:0});
    const dispatch = useDispatch();
    const mode = { width:'96%', cursor:'pointer' }
    const reactToPrintFn = useReactToPrint({ contentRef:componentRef});
    const { currency, myInfo, cartProducts, openingCash,cartStocks } = useSelector(state => state.auth );
    const [ notes, setNotes] = useState([]);
    const [ paymentMethod, setPaymentMethod ] = useState([]);
    const [ paidAmount, setCashAmount ] = useState(byAll.Cash + byAll.Card + byAll.Account);
    const [ KartProducts, setKartProducts] = useState([]);
    const [ currentMethod, setCurrentMethod ] = useState('');
   
    const [ number, setNumber ] = useState('');

    const choosePaymentMethod = (method, amount=false) => {
        if( amount ) 
        {
            let previous = byAll.Cash;
            previous = parseFloat(previous);
            setByAll({...byAll, Cash: ( previous + parseInt(amount) ) });
        } else {
            let fillAmt = total - Object.values(byAll).reduce((p,c)=> p+ parseFloat(c),0);
            if( fillAmt <= total ){
                setByAll(() => ({ ...byAll, [method]: fillAmt.toFixed(2) }));
            }
            setCashAmount(() => (byAll.Cash+ byAll.Card + byAll.Account));
        }
        if( !paymentMethod.includes(method) ) {
            setPaymentMethod([ ...paymentMethod, method ]);
        }
        setCurrentMethod(method);
        setNumber('');
    }

    const changeInput = input => {
        let newAmount = number + input;  
        setNumber(number + input);
        setByAll({...byAll, [currentMethod]:newAmount});
    }

    const total = cartProducts[parseInt(active)]?.length? cartProducts[parseInt(active)].reduce( (acc, item) => acc + (item.stock * item.price), 0) : KartProducts.reduce( (acc, item) => acc + (item.stock * item.price), 0)
    
    const takeSnipAndPrint = async () => {
        const elem = targetDiv.current;
        if(!elem) return toast.error(`Sorry can't go further...`);
        try {
            const canvas = await html2canvas(elem);
            const image = canvas.toDataURL("image/png");
            if(window.electronAPI){
                window.electronAPI.printContent(image);
            } else {
                Warning("Printer not connected!")
            }
            
        } catch (error) {
            console.error("Error capturing image:", error);
        }
    }

    const initPayment = async () => {
        if(total===0) {
            return navigate('/pos')
        }
        dispatch({ type:"LOADING" })
        const {data} = await axios.post(`orders/create`, {
            session_id: active,
            customer_id:'',
            cash_register_id: openingCash.id,
            amount: total,
            payment_mode: paymentMethod.toString(),
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
        });
        
        if ( receiptOn && data.status ) { 
            await takeSnipAndPrint();
            toast.success("Order completed!");
            setKartProducts(cartProducts[active]);
            
            localStorage.setItem('cartSessions', JSON.stringify(sessions.map( item => item + 1)));
            setSession(sessions.map( ite => ite + 1 ));
            // let products = Object.keys(cartStocks);
            dispatch({ type: "CHOOSEN_PRODUCT" , payload: []});

            dispatch(
                commonApiSlice.util.updateQueryData(`getPosProducts`, undefined, cache => {
                    cache['products'] = cache.products.map( product => {
                        if(cartStocks.hasOwnProperty(product.id)) {
                            product.quantity = product.quantity - cartStocks[product.id]
                        } 
                        return product;
                    })
                }),
            )
            if(data.notifications.length) {
                dispatch(
                    commonApiSlice.util.updateQueryData('getNotifications', undefined, cache => {
                        data.notifications.forEach( notify => { 
                            cache['notifications'].push(notify);
                        });
                    })
                )
            }

            dispatch({ type: "STOP_LOADING" })
            navigate(`/pos`);
            
        } else {
            toast.error(data.message);
        }

    }

    const toggleReceipt = mode => {
        localStorage.setItem('prt_receipt', mode)
        setReceipt(mode);
    }

    const printReceipt = async () => {
        reactToPrintFn()
    }
    console.log(cartStocks)
    useEffect(() => {
        if( isSuccess ) {
            setNotes(data.notes)
        }
    },[isSuccess, data]);

    const btnStyle = {minHeight:'60px'}

    return (
        <>
     
        <div className="content-wrapper">

            <div className="col-lg-12 grid-margin stretch-card" style={{justifyContent:'space-around'}}>
                <div className="col-lg-5">
                    <div className="row" style={{height:'15rem'}}>
                        <div className="container">
                            {[ 'Cash', 'Card', 'Account' ].map( met => <div className="row mt-2" key={met}>
                                <div className={`card ms-2 payment-${met.toLowerCase()} ${currentMethod===met && 'active'}`} style={mode} onClick={()=> choosePaymentMethod(met)}>
                                    <div className="card-body">
                                        <div className="d-flex" style={{alignItems:'center',gap:'5px',color:'#1e283d'}}>
                                            { met === 'Cash' ? <i className="mdi mdi-cash" aria-hidden={true} />: null}
                                            { met === 'Card' ? <i className="fa fa-credit-card" aria-hidden={true} />: null}
                                            { met === 'Account' ? <i className="fa fa-user" aria-hidden={true} />: null} 
                                            <strong> <p className="m-0"> {met} </p>  </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>)}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-12 d-flex">
                            <button type="button" className=" btn btn-light text-dark w-100 mt-3 justify-content-center" style={{width:'50%',background:'',color:'white!important'}} onClick={()=>toggleReceipt(!receiptOn)} title="print receipt" > 
                                Receipt 
                                <input type='checkbox' checked={receiptOn} onChange={()=>{}} /> 
                            </button>
                        </div>
                    </div>

                    { paymentMethod.length ? (<>
                        <div className="calculator">
                            <div className="row mt-2 offset-2">
                                {[1,2,3].map( (btn,i) => <div className="col-sm-3" key={i} onClick={()=>changeInput(btn)}>
                                    <button style={{fontSize:'1.5rem'}} className="btn btn-light  w-100 text-dark"> <b> {btn} </b> </button>
                                </div> )}
                            </div>
                            <div className="row mt-1 offset-2">
                                {[4,5,6].map( (btn,i) => <div className="col-sm-3" key={i} onClick={()=>changeInput(btn)}>
                                    <button style={{fontSize:'1.5rem'}} className="btn btn-light  w-100 text-dark"> <b> {btn} </b> </button>
                                </div> )}
                            </div>
                            <div className="row mt-1 offset-2">
                                {[7,8,9].map( (btn,i) => <div className="col-sm-3" key={i} onClick={()=>changeInput(btn)}>
                                    <button style={{fontSize:'1.5rem'}} className="btn btn-light  w-100 text-dark"> <b> {btn} </b> </button>
                                </div> )}
                            </div>
                        <div className="row mt-1 offset-2">
                            {[0, '.'].map( it => <div key={it} className={`col-sm-3 `} onClick={()=> changeInput(it)}>
                                <button style={{fontSize:'1.5rem'}} className="btn btn-light w-100 text-dark"> <b> {it} </b> </button>
                            </div> )}
                            <div className="col-sm-3" onClick={()=> {
                                setByAll({...byAll, [currentMethod]:0});
                                setNumber('')
                            }}>
                                <button style={{fontSize:'1.5rem'}} className="btn btn-light w-100 text-dark"> <b> Clear </b> </button>
                            </div>
                        </div>
                        <div className="row mt-1">
                            <div className="col-sm-12 d-flex">
                                <button type={`button`} className={`w-100 btn btn-light text-white validate`} style={{width:'47%',backgroundColor: '#0d172c',opacity:1}} onClick={initPayment}>
                                    Complete Payment
                                </button>
                            </div>
                        </div>
                        </div>
                    </>)
                    : null }
                </div>
                <div className="final col-lg-6">
                    <div className="card">
                        <div className="card-body">
                            <h1 className="text-success" style={{textAlign:'center'}}>
                                <span className="total-amount">{currency + parseFloat(total).toFixed(2)}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="card mt-3 w-100 parent">
                        <div className="row selections">
                            <strong className={`${paymentMethod.length && 'd-none'}`}>
                                <span className="info"> Please select a payment method </span>
                            </strong>
                            {paymentMethod.length ? (
                                <>
                                    { total < Object.values(byAll).reduce((p,c)=> p+parseFloat(c),0) || total === paidAmount ? (<div className={`card fulfilled`} >
                                        <div className="card-body exception">
                                            <div className="d-flex" style={{ justifyContent:'space-between'}}>
                                                <div className="d-flex">
                                                    <i className={`fa-solid fa-cash`} />
                                                    <p> Return </p>
                                                </div>
                                                <b>&nbsp; {currency} {Math.abs((total - Object.values(byAll).reduce((p,c)=> p+parseFloat(c),0)).toFixed(2))}</b>
                                            </div>
                                        </div>
                                    </div>) : (
                                        <div className={`card remaining`}>
                                            <div className={`card-body exception`}>
                                                <div className="d-flex" style={{ justifyContent:'space-between' }}>
                                                    <div className="d-flex">
                                                        <i className={`fa-solid fa-cash`} />
                                                        <p>Remaining </p>
                                                    </div>
                                                    <b>&nbsp; {currency} {Math.abs((total - Object.values(byAll).reduce((p,c)=> p+ parseFloat(c),0)).toFixed(2))}</b>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {
                                        paymentMethod.map( meth => <div className={`card methods payment-${meth.toLowerCase()} ${currentMethod===meth && 'active'}`} key={meth} onClick={()=> setCurrentMethod(meth)}>
                                            <div className={`card-body exception`} >
                                                <div className="d-flex" style={{justifyContent:'space-between'}}>
                                                    <div className="d-flex"> 
                                                        <p> { meth } </p>
                                                    </div>
                                                    <div className="d-flex">
                                                        &nbsp;{currency} &nbsp;<b className="price" data-paid={paidAmount}> {byAll[meth]}</b>
                                                        <i className="mdi mdi-close mx-3" style={{cursor:'pointer'}} onClick={()=>setPaymentMethod(()=>{ 
                                                            setByAll({...byAll, [meth]:0})
                                                            return paymentMethod.filter(ite => ite !== meth)
                                                        })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>) 
                                    }
                                </>
                            ): null}
                        </div>
                    </div>
                    <div className={`container`}>
                        <div className={`row`}>
                            {notes.map((note) => (
                                <div className="col-sm-4 mt-1" key={note.id} style={{maxHeight:'110px',cursor:'pointer'}} onClick={()=>choosePaymentMethod('Cash', note.amount)}>
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
            {/* Receipt Area */}
            <div className="col-lg-6 d-none" id="receipt" ref={componentRef}>
                <div className="container" ref={targetDiv} style={{backgroundColor:'white',paddingBottom:'40px',borderRadius:'15px'}} >
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
                                cartProducts[active]?.map( product => <div key={product.id} className='row mt-2 choosen-product receipt'>
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
                                )
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
                                        <small> { capitalFirst(paymentMethod[0]??'') } </small>
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
