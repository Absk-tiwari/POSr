import React, { useEffect, useState } from 'react'; 
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProductCategoriesQuery, useGetPosProductsQuery } from '../../features/centerSlice';
import { isColorDark, hexToRgb, chunk, wrapText, Warning } from '../../helpers/utils';
import labelImg from '../../asset/images/product.png';
import addNew from '../../asset/images/image.png';
import { Link, useNavigate } from 'react-router-dom';
import { useSearch } from '../../contexts/SearchContext';
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Label, Input, FormGroup, Col, Form } from 'reactstrap';
import toast from 'react-hot-toast';

function POS() {
 
    const dispatch = useDispatch();
    const navigator = useNavigate();
    const { currency, split, cartStocks, cartProducts, openingCash } = useSelector( state => state.auth );
    const [ openingAmountSet, setOpeningAmount ] = useState(openingCash); 
    const [ enteredCash , setEnteredCash ] = useState('');
    const { data, isSuccess } = useGetProductCategoriesQuery();
    const [ products, setProducts ] = useState([])
    const [ catColors, putCats] = useState({})
    const [ prCategories, setCategories ] = useState([])
    const [ initialProducts, setInitialProducts] = useState([]);
    const [ KartProducts, setCartProducts ] = useState(cartProducts);
    const [ currentProduct, setCurrent ] = useState(0);
    const [ Other, toggleOther ] = useState(false);
    const [ otherOpen, setModal ] = useState(false);
    const [ availableStocks, setAvailableStocks ] = useState(cartStocks);
    
    const allProducts = useGetPosProductsQuery();
    const { searchQuery, sessions, activeSession } = useSearch();

    useEffect(() => {
        if(allProducts.data?.products){
            setProducts(chunk(allProducts.data.products.filter(ite => (ite.name).toLowerCase().includes(searchQuery.toLowerCase())),4))
        }
    },[searchQuery])
    
    const addToCart = (prID, add=true) => {
        if(add) {
            let product = initialProducts.find(ite => ite.id === prID); 
            setCurrent(prID)
            const copyKartProducts = JSON.parse(JSON.stringify(KartProducts));
            let thisProduct = copyKartProducts[activeSession]?.find(ite => ite.id === prID);

            if( thisProduct && !split ) {
                let updatedStock = thisProduct.stock + 1;
                let availableStock = product.quantity - updatedStock;
                if( availableStock === -1 ) {
                    return document.querySelector('.also[data-id="'+product.id+'"]').classList.add('stock-out');
                }
                setAvailableStocks({...availableStocks, [product.id]: availableStock })
                // dispatch({ type: "CART_STOCKS", payload:{...availableStocks, [product.id]: availableStock } });
                // console.log(availableStock);
                thisProduct.stock = updatedStock;
                setCartProducts(copyKartProducts);
                dispatch({ type: "CHOOSEN_PRODUCT", payload:copyKartProducts });
            
            } else {
                product = {...product, stock: 1 }
                let consumed = Object.values(KartProducts).flat()?.filter( item => item.id === product.id).reduce( (prev, item) => prev + item.stock, 0 )?? 0;
                let availableStock = product.quantity - ( consumed + 1 );
                if( availableStock === -1 ) {
                    return document.querySelector('.also[data-id="'+product.id+'"]').classList.add('stock-out');
                }
                setAvailableStocks({...availableStocks, [product.id]: availableStock });
                setCartProducts({...KartProducts,[activeSession]: [...KartProducts[activeSession]??[], product] });
                // dispatch({ type: 'CART_STOCKS', payload:{...availableStocks, [product.id]: availableStock } });
                dispatch({ type: 'CHOOSEN_PRODUCT', payload: {...KartProducts,[activeSession]: [...KartProducts[activeSession]??[], product] } });

            }
        }
    }

    // Reverse the stock decrement here
    const removeFromCart = index => {
        setCartProducts( {...KartProducts,[activeSession]: KartProducts[activeSession].filter((item, i)=> i!== index) });
        dispatch({ type: 'CHOOSEN_PRODUCT', payload: {...KartProducts,[activeSession]: KartProducts[activeSession].filter((item, i)=> i!== index) } });
    }

    const toggleModal = () => setModal(!otherOpen)

    const openTheFuckingDay = e => {
        e.preventDefault();

        if(enteredCash==='' || enteredCash === '0') return Warning("You can't open without a single cash amount in drawer!");

        dispatch({ type: "LOADING" });
        axios.post("pos/opening-day-cash-amount", {cash: currency + enteredCash}).then(({data}) => {
            
            if(data.status) {
                toast.success(data.message);
                dispatch({ type: "SET_CASH", payload: data.created })
                setOpeningAmount(data.created)
            } else {
                toast.error(data.message);
            }
        }).catch(()=>{}).finally(()=>dispatch({
            type: "STOP_LOADING"
        }))

    }

    // category se filter karega
    const filterProducts = catID => {
        setProducts(chunk(allProducts.data.products.filter(ite => ite.category_id===catID),4))
        toggleOther(!catID)
    }

    const createCustomer = () => {}
    
    useEffect(() => {
        if( isSuccess ) {
            setCategories(data.categories)
            const cats = [];
            data.categories.forEach( cat => (cats[cat.id] = cat.color));
            putCats(cats);
        }
        if(allProducts.isSuccess) {
            setProducts(chunk(allProducts.data.products, 4))
            setInitialProducts(allProducts.data.products);
        }
        return () => null
    },[ isSuccess, data, allProducts.data, allProducts.isSuccess ]);

    useEffect(()=> {
        setCartProducts(cartProducts);
        return () => null
    },[ cartProducts ]);

    useEffect(()=> {
    },[cartStocks])
 
    const base = {
        height:'69vh',
        placeContent:'center',
        display:'grid',
        placeItems:'center',
        width:'100%',
        backgroundColor: '#dadada', 
        marginTop:'5%'
    }

    const fs2 = {fontSize: '2rem'}

    return (
        <>
            <div className="col-md-12 position-relative">
                { Object.keys(openingAmountSet).length === 0 || !openingAmountSet.status === true ? (
                    <div className='overlay' style={{width:'100vw', height:'100vh',position:'absolute'}}>
                        <Modal isOpen={true}>
                            <Form onSubmit={openTheFuckingDay}>
                                <ModalHeader>
                                    <b>Day Opening!</b> <p>Good morning </p> 
                                </ModalHeader>
                                <ModalBody>
                                    <Row>
                                        <Col>
                                            <FormGroup>
                                                <Label>
                                                    <b>Enter Opening Cash In Drawer</b>
                                                </Label>
                                                <Input 
                                                    type='text'
                                                    placeholder={currency}
                                                    onChange={e => setEnteredCash(e.target.value)}
                                                    style={{border:'1px solid gray'}}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </ModalBody>
                                <ModalFooter className='justify-content-center'>
                                    <Col md={5} className='btn btn-light' onClick={()=> navigator('/')} >
                                        Back
                                    </Col>
                                    <Col md={5} >
                                        <button className='w-100 btn btn-success' type={`submit`} > Start </button>
                                    </Col>
                                </ModalFooter>
                            </Form>
                        </Modal>
                    </div>
                ): null}
                <div className="col-md-4 position-fixed pt-3" style={{filter:Object.keys(openingAmountSet).length === 0 || !openingAmountSet.status === true ? 'blur(5px)':''}}>
                    { sessions.map( session => (<div key={session} className={`container ms-2 put-here ${activeSession===session?'':'d-none'} ${KartProducts[activeSession] && KartProducts[activeSession].length ?'action-visible':''}`} style={{borderRadius:'20px',backgroundColor:'#dadada'}}>
                        <div className={`card ${KartProducts[activeSession] && KartProducts[activeSession].length? 'd-none':''}`} style={base}>
                            <i className="fa-solid fa-cart-shopping" style={{fontSize:'60px'}} />
                            <b className="mt-3"> Start adding products </b>
                        </div>
                        { KartProducts[activeSession] && KartProducts[activeSession].map( (item,index) => (<div key={index} className={`row chosen-product mt-2 ${currentProduct===item.id && 'selected'}`} data-id={item.id} onClick={()=> setCurrent(item.id)}>
                            <div className="d-flex w-100">
                                <b style={{maxWidth:'24rem'}}> {item.name} </b>
                                <strong className="price" data-price={item.price}>{currency +' '+ (item.stock * parseFloat(item.price)).toFixed(2)}</strong>
                            </div>
                            <div className="d-flex">
                                <span className="quantity"> {(item.stock).toFixed(2)} </span>
                                <p className="ms-3 mt-1">{`${currency + ' ' + parseFloat(item.price).toFixed(2)} / Units`}</p>
                            </div>
                            <button className="btn" onClick={()=>removeFromCart(index)}><i className="mdi mdi-close"/></button>
                        </div>))}
                    </div>))}
                    <div className={`container ms-2 mt-3 actionBar ${KartProducts[activeSession] && KartProducts[activeSession].length ? '':'d-none'}`} style={{height: '54vh'}}>
                        <div className="row">
                            <div className="col-sm-12 d-flex">
                                <div className="col-sm-6">
                                    <Link className="btn btn-light text-white" to={`/payment/${activeSession}`} style={{backgroundColor:'#04537d',width:'93%'}}> Payment </Link>
                                </div>
                                <div className="col-sm-6 d-flex justify-content-end align-items-center ">
                                    <p style={{lineHeight:2.1}}><b>Total: &nbsp; 
                                    <span className="total-amount fs-5">{currency} {parseFloat(KartProducts[activeSession]?.reduce((acc, cur)=> acc + (cur.stock * parseFloat(cur.price)),0)).toFixed(2)} </span> </b></p>
                                </div>
                            </div>
                        </div>
                        <div className="row mt-1">
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 1 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 2 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 3 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light text-dark" type="button" data-toggle="modal" data-target="#customer"> Customer </button>
                            </div>
                        </div>
                        <div className="row mt-1">
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 4 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 5 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 6 </b> </button>
                            </div>
                            <div className="col-sm-3">
                            </div>
                        </div>
                        <div className="row mt-1">
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 7 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 8 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 9 </b> </button>
                            </div>
                            <div className="col-sm-3">
                            </div>
                        </div>
                        <div className="row mt-1">
                            <div className="col-sm-3">
                                <button className="btn btn-light w-100 text-dark" > <b> . </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark"> <b> 0 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light w-100 text-dark" > <b className="fa fa-minus"></b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light w-100 text-dark" > <b> Price </b> </button>
                            </div>
                        </div>
                    </div>

                </div>
                <div className="col-md-7 position-absolute library" style={{
                    height:'70vh',
                    right:'5px',
                    filter: Object.keys(openingAmountSet).length === 0 || !openingAmountSet.status === true ? 'blur(5px)':''
                    }}
                >
                    <div className="position-relative">
                        <div className="category row w-100" style={{flexWrap:'nowrap'}}>
                            { prCategories.map((Cat,i) => (<div key={i} className={`category-item ${i===0 ?'active':''}`} style={{color:isColorDark(hexToRgb(Cat.color))? 'white':'black', background:Cat.color}} onClick={()=>filterProducts(Cat.id)}>
                                {(Cat.name).includes('/') ? (Cat.name).split('/')[1]: Cat.name }
                            </div>))}
                            <div className='category-item' onClick={()=> filterProducts(null)} style={{background:"azure", width:200, marginRight:80}}>
                                Other 
                            </div>
                        </div>
                        <button className="btn prev d-none position-absolute" style={{top:'3px',zIndex:2,left:0}}>
                            <i style={fs2} className="fa-solid fa-circle-chevron-left text-white"/>
                        </button>
                        <button className="btn next position-absolute" style={{right:'10px',paddingRight:'10px',top:'3px',zIndex:2}}>
                            <i style={fs2} className="fa-solid fa-circle-chevron-right text-white"/>
                        </button>
                    </div>
                    <div className="contents" >
                        { products.map( (row, k) => (<div className={'row mt-3'} key={k}>
                                {row.map((product,i ) => (
                                    <div key={i} className={`col-md-3 also ${(product.quantity - product.stock)===0 || product.quantity - cartStocks[product.id] === 0 ? 'stock-out':''}`} onClick={()=>addToCart(product.id)} data-id={product.id}>
                                        <div className='cell'>
                                            <div className='w-100'>
                                                <img className='title-img' src={process.env.REACT_APP_BACKEND_URI+'images/'+product.image} onError={()=> labelImg} alt={product.name}/>
                                            </div>
                                            <div className='w-100' style={{color:isColorDark(hexToRgb(catColors[product.category_id]))? 'white':'black', background:catColors[product.category_id]}}>
                                                <strong className='wrapped-text'>
                                                    {wrapText(product.name, 40)}
                                                    <span className='tooltiptext'>{product.name}</span>
                                                </strong>
                                            </div>
                                        </div>
                                        <div className='extras'>
                                            <div className='tax'>
                                                <small>Tax</small>
                                                <div style={{fontSize:'800'}}>{product.tax}</div>
                                            </div>
                                            <div className='stock'>
                                                <small>Items : </small>
                                                <div style={{fontSize:'800'}}>{ product.quantity - (cartStocks[product.id]?? 0) }</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>))
                        }
                        {
                            Other && (<div className='row mt-3' >
                                <div className='col-md-3 also' onClick={()=>toggleModal(!otherOpen)}>
                                    <div className='cell'>
                                        <div className='w-100'>
                                            <img className='title-img' src={addNew} alt={"Other"}/>
                                        </div>
                                        <div className='w-100' style={{color:'black', background:'lightgray'}}>
                                            <strong className='wrapped-text'>
                                                Add New &nbsp;
                                                <span className='fa fa-plus fs-5' />
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>)
                        }
                    </div>
                    {products.length === 0 && !Other && (<div className="d-flex lib-loader justify-self-center">
                        <i className="fa fa-spin fa-spinner fs-1" />
                    </div>)}
                </div>
            </div>

            <div className="modal" id="customer" tabIndex="-1" data-keyboard="false" data-backdrop="static" role="dialog" aria-labelledby="customerLabel" aria-hidden="true">
                <div className="modal-dialog modal-md" >
                    <div className="modal-content">
                        <div className="modal-header">
                            <button className="modal-title btn btn-light text-dark" onClick={createCustomer} type="button"> Create </button>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" className="fa fa-close"/>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="customer-create-update" className="create-update-customer-form d-none" >
                                <div className="col-12 grid-margin">
                                    <div className="card">
                                        <div className="card-body exception">
                                            <div className="row">
                                                <div className="row w-100">
                                                    <div className="col-12">
                                                        <div className="form-group">
                                                            <input type="text" name="name" className="input w-100" style={{fontSize:'larger'}} placeholder="e.g. Philips" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row w-100">
                                                    <div className="col-12">
                                                        <div className="row">
                                                            <div className="form-group">
                                                                <input type="text" className="input" name="phone" placeholder="Phone" />
                                                            </div>
                                                            <div className="form-group">
                                                                <input type="text" className="input" name="city" placeholder="City" />
                                                            </div>
                                                            <div className="form-group">
                                                                <input type="text" className="input" name="state" placeholder="State" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">

                                                        <div className="row">
                                                            <div className="form-group">
                                                                <input type="text" name="street1" className="input" placeholder="Street..." />
                                                            </div>
                                                            <div className="form-group">
                                                                <input type="text" name="email" className="input" placeholder="@" />
                                                            </div>
                                                            <div className="form-group">
                                                                <input type="text" name="title" className="input" placeholder="e.g. Mister" />
                                                            </div>
                                                        </div>

                                                    </div>

                                                </div>
                                                <div className="w-100 tabs">

                                                    <div className="d-flex tabheader">
                                                        <button type="button" className="tablink w-100" > Internal Notes </button>
                                                    </div>
                                                    <div id="About" className="tabcontent">
                                                        <textarea name="notes" rows="3" cols="50" className="input" placeholder="Internal notes..." />
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                            <div className="table-responsive" id="customers"></div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-light" data-dismiss="modal"> Close </button>
                            <button type="submit" className="d-none btn btn-primary">Save changes</button>
                        </div>
                    </div>
                </div>
            </div>


            <div className="modal fade" id="modal" tabIndex={-1} data-keyboard={false} role="dialog" aria-labelledby="customerLabel" aria-hidden={true} >
                <div className="modal-dialog modal-sm" role="document">
                    <form action="">
                        <div className="modal-content">
                            <div className="modal-header">
                                Currency
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <b className="mt-3"> 
                                    <h5> Scan the Barcode </h5>
                                    <p id="output"></p></b>
                                </div>
                                <div className="product">
                                    <span className="fa fa-spin fa-spinner" />
                                </div>
                            </div>

                        </div>
                    </form>
                </div>
            </div>

            <Modal isOpen={otherOpen}>
                <ModalHeader >
                    Add Custom Product
                </ModalHeader>
                <ModalBody style={{padding:60}}>
                    <Row>
                        <div className='col-4'>
                            <Label> Name </Label>
                        </div>
                        <div className='col-8'>
                            <FormGroup>
                                <input 
                                    type='text'
                                    name="productname"
                                    className='input'
                                />
                            </FormGroup>
                        </div>
                    </Row>
                    <Row>
                        <div className='col-4'>
                            <Label> Price </Label>
                        </div>
                        <div className='col-8'>
                            <FormGroup>
                                <input 
                                    type='text'
                                    className='input'
                                    name='productprice'
                                    placeholder={currency}
                                />
                            </FormGroup>
                        </div>
                    </Row>
                    <Row>
                        <div className='col-4'>
                            <Label> Stock </Label>
                        </div>
                        <div className='col-8'>
                            <FormGroup>
                                <input 
                                    type='text'
                                    className='input'
                                    name="productstock"
                                />
                            </FormGroup>
                        </div>
                    </Row>
                    <Row>
                        <div className='col-4'>
                            <Label> Barcode </Label>
                        </div>
                        <div className='col-8'>
                            <FormGroup>
                                <input 
                                    type='text'
                                    className='input'
                                    placeholder='Enter barcode'
                                    name="productbarcode"
                                />
                            </FormGroup>
                        </div>
                    </Row>
                    <Row>
                        <label className='custom-file-upload' > 
                            <i className={'fa fa-paperclip'} /> &nbsp;
                            <Input 
                                type='file' 
                                className='d-none'
                                accept='image/*'
                            />
                            Upload Product Image
                        </label>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <button className='btn btn-secondary' onClick={()=>toggleModal(!otherOpen)} > Close </button>
                    <button className='btn btn-primary'> Submit </button>
                </ModalFooter>
            </Modal>

            <button className="d-none qckbtn" data-target=".quickAdd" data-toggle="modal"></button>
            
        </>
    )
}

export default POS