import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate} from 'react-router-dom';
import profile from "../../asset/images/profile.png";
import { useDispatch, useSelector } from 'react-redux';
import { useSearch } from '../../contexts/SearchContext';
import { FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Form, Row } from 'reactstrap';

function Navbar() {
    const location = useLocation();
    const { setSearchQuery, sessions, setSession, activeSession, setActiveSession  } = useSearch();
    const notHome = location.pathname !== '/dashboard';
    const { cartProducts, split:splitStat } = useSelector( state => state.auth );
    const [ open, setModal ] = useState(false); 
    const [ price, setPrice] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toggleModal = () => setModal(!open);

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

    useEffect(()=> {
        setActiveSession(sessions[0]);
        return ()=> setActiveSession(sessions[0]);
    },[ sessions ])

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

            {['/pos','/payment'].includes(location.pathname) && 
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
                            <button className={'btn btn-light'} onClick={toggleModal}> Close </button>
                            <button className={'btn btn-success'} > Submit </button>
                        </ModalFooter>
                    </Form>
                </Modal>
                </>)
            }

            {location.pathname === '/products' && (
                <Link to={'/product/create'} className={`btn-success btn btn-md btn-rounded`}> New </Link>
            )}

            <ul className="navbar-nav ms-auto">

                <li className="nav-item">
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
                    <Link className="nav-link count-indicator" id="notificationDropdown" style={{marginTop:'10px'}} href="#" data-bs-toggle="dropdown">
                        <i className="icon-bell"/>
                        <span className="count"/>
                    </Link>
                    <div className="dropdown-menu dropdown-menu-right navbar-dropdown preview-list pb-0" aria-labelledby="notificationDropdown" style={{ borderRadius:8 }}>
                        <Link className={`dropdown-item py-3 border-bottom`}>
                            <p className={`mb-0 fw-medium float-start`}> You have 0 notifications </p>
                            <span className={`badge badge-pill badge-primary float-end`}> View all </span>
                        </Link>
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
                        <Link to={`#`} className="dropdown-item cache-clear">
                            <i className="dropdown-item-icon mdi mdi-check text-primary me-2" /> 
                            Clear Cache 
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

    </>
    )
}

export default Navbar