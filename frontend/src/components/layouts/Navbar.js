import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import profile from "../../asset/images/profile.png";
import { useDispatch, useSelector } from 'react-redux';
import { useSearch } from '../../contexts/SearchContext';
import { FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Form, Row } from 'reactstrap';
import { capitalFirst, dataURLtoFile } from '../../helpers/utils';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { commonApiSlice, useGetNotificationsQuery } from '../../features/centerSlice';

function Navbar() {
    const params = useParams();
    const {data} = useGetNotificationsQuery();

    const removeNotification = e => {
        e.stopPropagation();
        e.preventDefault();
        const id = e.target.dataset.id
        axios.get(`config/notification/delete/${id}`).then(({data}) => {
            console.log(data);
            if(data.status) {
                dispatch(
                    commonApiSlice.util.updateQueryData('getNotifications', undefined, cache => {
                        cache['notifications'] = cache.notifications.filter( item => item.id !== parseInt(id) )
                    })
                )

            }
        })
    }
    const clearNotification = e => {
        e.stopPropagation();
        e.preventDefault();
        axios.get('config/clear-notifications', {
            headers: {
                "Content-Type":'application/json',
                'pos-token' : localStorage.getItem('pos-token')
            }
        }).then(({data}) => {
            if(data.status) {
                dispatch(
                    commonApiSlice.util.updateQueryData('getNotifications', undefined , cache => {
                        cache['notifications'] = [];
                    })
                )
            }
        })
    }
    const [notifications, setNotifications] = useState(data?.notifications??[])
    useEffect(()=> {
        setNotifications(data?.notifications??[])
    },[data])
    const modalBody = useRef(null);
    const location = useLocation();
    const { setSearchQuery, sessions, setSession, activeSession, setActiveSession, displayImage, handleImageDisplay  } = useSearch();
    const printReceipt = async () => {
        const elem = modalBody.current;
        if(!elem) return toast.error(`Sorry can't go further...`);
        try {
        const canvas = await html2canvas(elem);
            const image = canvas.toDataURL("image/png");
            console.log(image)
            window.electronAPI?.printContent(image);
        } catch (error) {
            console.error("Error capturing image:", error);
        }
    }
    const [appModal , setAppModal ] = useState(false);
    const notHome = location.pathname !== '/dashboard';
    const { cartProducts, split:splitStat, currency, appKey } = useSelector( state => state.auth );
    const [key,setKey] = useState(appKey)
    const [ open, setModal ] = useState(false); 
    const [ price, setPrice] = useState('');
    const [ orderModal, toggleOrderModal ] = useState(false);
    const [ total, setTotal ] = useState(0);
    const [ sessionID, setSessionID ] = useState(1);
    const [ paymentMethod, setPaymentMethod ]= useState(0);
    const [ cashierEmail, setCashierEmail ] = useState('');
    const [ orderProducts, setOrderProducts] = useState([]);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toggleModal = () => setModal(!open);

    const updateProducts = async e => {
        e.preventDefault()
        try {
            if(!appKey) {
                return setAppModal(!appModal)
            }
            dispatch({ type: "SET_APP_KEY", payload: appKey })
            dispatch({ type:"LOADING" });

            const {data} = await axios.get(`https://pos.dftech.in/sync-products/${appKey}`);
            if(data.status) {
                toast.success(data.message);
                let fd = new FormData();
                const midFile= dataURLtoFile(`data:application/json;base64,`+data.file, 'client.json');
                fd.append('file', midFile);

                const {data:resp} = await axios.post('products/sync', fd, {
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type" : "multipart/form-data",
                        'pos-token' : localStorage.getItem('pos-token')
                    }
                });
    
                if(resp.status) {
                    toast.success("Importing completed");
                    setTimeout(()=> window.location.reload(), 2400);
                }
            } else {
                toast.error(data.message);
            }
            
        } catch (error) {
            console.log(error.message);
            toast.error("Couln't fetch products right now!")
        }
        dispatch({ type:"STOP_LOADING" });
    }

    const split = () => {
        let btn = document.querySelector('.split-btn')
        dispatch({
            type: 'SPLIT',
            payload: btn.classList.contains('btn-outline-success')
        })
    }

    const handleSession = () => {
        localStorage.setItem('cartSessions', JSON.stringify([...sessions, sessions[sessions.length-1] + 1]) );
        setSession([...sessions, sessions[sessions.length-1] + 1])
    }

    const search = e => setSearchQuery(e.target.value)
 
    const handleQuickProduct = e => {
        e.preventDefault();
        if(price) {
            dispatch({ type: "CHOOSEN_PRODUCT", payload: {...cartProducts,[activeSession]: [...cartProducts[activeSession]??[], { id:'quick', name:'Others', price, stock:1, other:true, weight:null }] } });
        }
        setPrice(()=> null);
    }

    const lastOrder = e => {
        dispatch({ type:`LOADING` });
        toggleOrderModal(!orderModal)
        axios.get(`orders/last-order`).then(({data})=> { 
            const {products, session} = data;
            const sessionData = JSON.parse(session.data);
            setTotal(data.order.amount);
            setPaymentMethod(data.order.payment_mode);
            setSessionID(data.order.session_id)
            setCashierEmail(data.cashier?.email)
            // toggleModal(); 
            let orderedProducts = Object.values(products).map( pr => ({...pr, stock:sessionData?.quantity[pr.id]}) );
            if((sessionData?.products??[]).indexOf('quick') !== -1) {
                let overallExcept = orderedProducts.reduce( (pre,a) => pre + parseFloat(a.price * sessionData?.quantity[a.id]), 0);
                let otherPrice = data.order.amount - overallExcept;
                orderedProducts = [...orderedProducts, {name:"Others", price: otherPrice, id:`quick`, stock: sessionData?.quantity['quick']}];
            }
            setOrderProducts(orderedProducts);
        }).catch()
        .finally( () => dispatch({ type:`STOP_LOADING` })) 
    }

    useEffect(()=> {
        setActiveSession(sessions[0]);
        return ()=> setActiveSession(sessions[0]);
    },[ sessions ])

    if(params && params.type==='customer') return null;
    
    return (
    <>
        <nav className="navbar default-layout col-lg-12 col-12 p-0 d-flex align-items-top flex-row no-print" style={{zIndex:999}}>
            { notHome && (<>
                <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-start">
                    <div className="me-3">
                        <Link to={`/dashboard`} className="nav-link">
                            <i className="mdi mdi-home menu-icon fs-3" />
                        </Link>
                    </div>
                <div>
            </div>
        </div>
        </>)}
                
        <div className="navbar-menu-wrapper d-flex align-items-top" style={{width:!notHome?'100%':''}}>
            {notHome &&
            <li className="navbar-nav nav-item">
                <button className="btn btn-sm" onClick={()=>navigate(-1)}>
                    <i style={{fontSize:'1.8rem'}} className="mdi mdi-arrow-left"/>
                </button>
            </li>}

            {['/pos','/pos/','/payment'].includes(location.pathname) && 
                (<>
                <li className="navbar-nav nav-item ms-3" onClick={handleSession} >
                    <div className="box"> + </div>
                </li>
                <ul className="navbar-nav ms-1 sessions">
                    { sessions.map( id => (<li className="nav-item fw-semibold ms-1" key={id} onClick={()=>setActiveSession(id)}>
                        <div className={`box ${activeSession===id? 'active':''}`}> {id} </div>
                    </li>)) }
                </ul>
                <button className={`btn ${splitStat?'btn-success':'btn-outline-success'} btn-sm ms-2 split-btn text-dark`} type="button" onClick={split} title="Split products"> 
                    Split Products 
                </button>
                <button className="btn btn-outline-success btn-light btn-sm ms-2 quick-btn text-dark" type="button" onClick={lastOrder} title="Quick add product to cart">
                    Print Last Receipt
                </button>
                <button className="btn btn-outline-success btn-light btn-sm ms-2 quick-btn text-dark" type="button" onClick={toggleModal} title="Quick add product to cart" >
                    Quick Add
                </button>
                <Modal isOpen={open} className={'modal-sm'} toggle={toggleModal}>
                    <Form onSubmit={handleQuickProduct}>
                        <ModalHeader>
                            Quick Add 
                        </ModalHeader>
                        <ModalBody>
                            <Row>
                                <FormGroup className='w-100'>
                                    <Label> Price </Label>
                                    <Input
                                        type='text'
                                        pattern="^\d+(\.\d+)?$"
                                        title="price should be in numbers"
                                        placeholder={localStorage.getItem('currency')}
                                        onChange={ e => setPrice(e.target.value) }
                                    />
                                </FormGroup>
                            </Row>
                        </ModalBody>
                        <ModalFooter>
                            <button className={'btn btn-light btn-rounded'} onClick={toggleModal}> Close </button>
                            <button className={'btn btn-success btn-rounded'} > Submit </button>
                        </ModalFooter>
                    </Form>
                </Modal>
                </>)
            }

            {location.pathname === '/products' && (
                <Link to={'/product/create'} className={`btn-success btn btn-md btn-rounded`}> New </Link>
            )}

            <ul className="navbar-nav ms-auto">

                <li className="nav-item d-flex align-items-center">
                    {location.pathname==='/pos' && <button className='btn btn-rounded btn-warning fs-4' onClick={()=>handleImageDisplay(!displayImage)}> 
                        {displayImage?'Hide':"Show"} Images 
                        <div className='d-none'>
                            <input type={`checkbox`} id={`btn1901_m`} name={'status'} defaultChecked={true} className='status'/>
                            <label htmlFor={`btn1901_m`}/>
                            <div className='plate'/>
                        </div>
                    </button>}
                    <button className="btn" onClick={()=>window.location.reload()} title={'Refresh'}>
                        <i style={{fontSize:'2rem'}} className="mdi mdi-refresh" />
                    </button>
                </li>
                {location.pathname==='/pos' && (<>
                    <li className="nav-item">
                        <form className="search-form" action="#">
                            <i className="icon-search" />
                            <input type="search" className="form-control" placeholder="Search Here" title="Search here" onInput={search} />
                        </form>
                    </li>
                </>)}

                <li className="nav-item dropdown">
                    <Link className="nav-link count-indicator" id="notificationDropdown" href="#" data-bs-toggle="dropdown">
                        <i className="mdi mdi-bell"/>
                        <span className="count"/>
                    </Link>
                    <div className="dropdown-menu dropdown-menu-right navbar-dropdown preview-list pb-0" aria-labelledby="notificationDropdown" style={{ borderRadius:8 }}>
                        <Link className={`dropdown-item py-3 border-bottom`}>
                            <p className={`mb-0 fw-medium float-start`}> You have {notifications.length} notifications </p>
                            <span className={`badge badge-pill badge-primary float-end`} onClick={clearNotification}> Clear all </span>
                        </Link>
                        {notifications.map( row => <Link className="dropdown-item preview-item py-2 position-relative" key={row.id} data-id={row.id}>
                            <div class="preview-thumbnail"><i class="mdi mdi-alert m-auto text-primary" /></div>
                            <div class="preview-item-content">
                                <h5 class="preview-subject fw-normal text-dark mb-1">{row.content}</h5>
                                <p class="fw-light small-text mb-0" />
                            </div>
                            <span onClick={removeNotification} data-id={row.id} class="fa fa-close align-items-center position-absolute align-self-center" style={{right:20}} />
                        </Link>)}
                    </div>
                </li>

                <li className="nav-item dropdown d-none d-lg-block user-dropdown">
                    <Link className="nav-link" id="UserDropdown" to={"#"} data-bs-toggle="dropdown" aria-expanded="false">
                        <img className={"img-xs rounded-circle"} src={profile} alt="" /> 
                    </Link>
                    <div className="dropdown-menu dropdown-menu-right navbar-dropdown" aria-labelledby="UserDropdown" style={{ borderRadius:8 }}>
                        <div className="dropdown-header text-center">
                            <img className={"img-md rounded-circle"} src={profile} alt={''} />
                            <p className="mb-1 mt-3 fw-semibold"> default </p>
                            <p className="fw-light text-muted mb-0"> default </p>
                        </div>
                        <Link className="dropdown-item">
                            <i className="dropdown-item-icon mdi mdi-account-outline text-primary me-2"/> 
                            My Profile <span className="badge badge-pill badge-danger"> 1 </span>
                        </Link>
                        <Link className="dropdown-item" to={"#"}>
                            <i className="dropdown-item-icon mdi mdi-cogs text-primary me-2"/> 
                            Settings 
                        </Link>
                        <Link to={`#`} className="dropdown-item cache-clear" onClick={updateProducts}>
                            <i className="dropdown-item-icon mdi mdi-refresh text-primary me-2" /> 
                            Sync Products 
                        </Link>
                        <Link className="dropdown-item" to={"#"}> 
                            <i className="dropdown-item-icon mdi mdi-power text-primary me-2"/> 
                            Sign Out
                        </Link>
                    </div>
                </li>
            </ul>
            <button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" data-bs-toggle="offcanvas" >
                <span className="mdi mdi-menu" />
            </button>
        </div>
        </nav>
        <Modal isOpen={orderModal}>
            <ModalHeader>
                <p style={{fontSize:'1.5rem'}}>Previous Order Details</p>
            </ModalHeader>
            <ModalBody ref={modalBody}>
                <div className="col-lg-12" id="receipt" >
                    <div className="container" style={{backgroundColor:'white',paddingBottom:'10px',borderRadius:'15px'}} >
                        <div className="row" style={{display:'flex'}}>
                            <div className="d-grid text-center w-100" style={{justifyContent:'center'}}>
                                <p> Served by <b>{cashierEmail}</b> </p>
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
                <button className='btn btn-light btn-rounded' onClick={()=> toggleOrderModal(!orderModal)}> Close </button>
                <button className='btn btn-primary btn-rounded' onClick={printReceipt}>Print</button>
            </ModalFooter>
        </Modal>

        <Modal isOpen={appModal} size='sm'>
                <Form onSubmit={updateProducts}>
                    <ModalHeader>
                        Enter application key 
                    </ModalHeader>
                    <ModalBody>
                        <Input onChange={e=> setKey(e.target.value)} defaultValue={key} type='text' name='appKey'/>
                    </ModalBody>
                    <ModalFooter>
                        <button className='btn btn-light btn-sm btn-rounded' type='button' onClick={()=> setAppModal(!appModal)}>Cancel</button>
                        <button className='btn btn-success btn-sm btn-rounded' > Submit </button>
                    </ModalFooter>
                </Form>
            </Modal>

    </>
    )
}

export default Navbar