import React, { useEffect, useRef, useState } from 'react'; 
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProductCategoriesQuery, useGetPosProductsQuery } from '../../features/centerSlice';
import { isColorDark, hexToRgb, chunk, wrapText, Warning, dataURLtoFile } from '../../helpers/utils';
import labelImg from '../../asset/images/default.png';
import addNew from '../../asset/images/image.png';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSearch } from '../../contexts/SearchContext';
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Label, Input, FormGroup, Col, Form } from 'reactstrap';
import toast from 'react-hot-toast';

function POS() {
    const sectionRef = useRef(null);
    const cRef = useRef(null);
    const cntRef = useRef(null);
    const dispatch = useDispatch();
    const navigator = useNavigate();
    const location = useLocation();
    const { currency, split, cartStocks, cartProducts, openingCash, appKey } = useSelector( state => state.auth );
    const [ key, setKey] = useState(appKey)
    const [appModal , setAppModal] = useState(false)
    const [ openingAmountSet, setOpeningAmount ] = useState(openingCash); 
    const [ enteredCash , setEnteredCash ] = useState('');
    const { data, isSuccess } = useGetProductCategoriesQuery();
    const [ products, setProducts ] = useState([])
    const [ catColors, putCats] = useState({})
    const [ noProduct, setNoProduct ] = useState(false)
    const [ prCategories, setCategories ] = useState([])
    const [ initialProducts, setInitialProducts] = useState([]);
    const [ KartProducts, setCartProducts ] = useState(cartProducts);
    const [ currentProduct, setCurrent ] = useState(0);
    const [ Other, toggleOther ] = useState(false);
    const [ otherOpen, setModal ] = useState(false);
    const [ availableStocks, setAvailableStocks ] = useState(cartStocks);
    const [ barcode, setBarcode ] = useState('');
    const [ opened, toggleVegetableModal ] = useState(false);
    const [ number, setNumber ] = useState('');
    const [ editing, setEditing ] = useState(false);
    const [ loadingPhone, setLoading ]= useState(false);
    const [vegetable, setVegetable] = useState({});
    const [custom, setCustom] = useState({image:null, price:0, name:'', barcode:'', stock:0});
    
    const btnStyle = {minHeight:'60px', fontSize:'1.4rem'}

    useEffect(() => {

        let inputBuffer = "";
        const handleKeyDown = (event) => {

            const { key } = event;
            // Check for "Enter" key to signal the end of a barcode
            if (key === "Enter") {
                setBarcode(inputBuffer); // Update the barcode state 
                inputBuffer = ""; // Reset buffer for the next scan
            } else {
                // Append the key to the buffer (only if it's a character key)
                if (key.length === 1) {
                    inputBuffer += key;
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);

    }, [barcode]);

    useEffect(()=> {
        if(barcode) {
            axios.get(`products/barcode/${barcode}`).then(({data})=> {
                addToCart(data.product.id)
                setBarcode('')
            }).catch(()=>{}).finally(()=> null);
        }
        return () => null
    },[barcode])
    
    const allProducts = useGetPosProductsQuery();
    const { searchQuery, sessions, activeSession, displayImage } = useSearch();

    useEffect(() => {
        if(allProducts.data?.products){
            setProducts(chunk(allProducts.data.products.filter(ite => (ite.name).toLowerCase().includes(searchQuery.toLowerCase())),4))
        }
        return () => setProducts([]);
    },[searchQuery])

    const handleVegetable = () => toggleVegetableModal(!opened)

    const scrollTop = e => {
        console.log(cntRef.current.scrollHeight)
        cntRef.current.scrollTo({
            top: 0, // Scroll to the top
            behavior: "smooth", // Smooth scrolling effect
        });

        let el = document.querySelector(`.t-scroller`);
        if(el) {
            el.scrollIntoView({
                behavior:'smooth',
                top: 0
            })
        }

    }

    const fetchPhoneProducts = async (e) => {
        e.preventDefault()
        try {
            setLoading(true);
            console.log(key);
            if(!key) {
                return setAppModal(!appModal)
            }
            dispatch({ type: "SET_APP_KEY", payload: key })
            dispatch({ type:"LOADING" });

            const {data} = await axios.get(`https://pos.dftech.in/sync-products/${key}`);
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
        setLoading(false)
    }

    const addVeg = e => {
        e.preventDefault();
        const copyKartProducts = JSON.parse(JSON.stringify(KartProducts));
        let thisProduct = copyKartProducts[activeSession]?.find(ite => ite.id === vegetable.id);
        // check if the product is already in cart
        if( thisProduct && !split ) {
            // let updatedStock = thisProduct.stock + 1;
            let availableStock = vegetable.quantity - vegetable.stock;
            if( availableStock === -1 ) {
                return document.querySelector('.also[data-id="'+vegetable.id+'"]').classList.add('stock-out');
            }
            // update the remaining stock each product
            setAvailableStocks({...availableStocks, [vegetable.id]: availableStock });
            thisProduct.stock = vegetable.stock;
            setCartProducts(copyKartProducts);
            dispatch({ type: "CHOOSEN_PRODUCT", payload:copyKartProducts });
        
        } else {
 
            let consumed = Object.values(KartProducts).flat()?.filter( item => item.id === vegetable.id).reduce( (prev, item) => prev + item.stock, 0 )?? 0;
            let availableStock = vegetable.quantity - ( consumed + 1 );
            if( availableStock === -1 ) {
                return document.querySelector('.also[data-id="'+vegetable.id+'"]').classList.add('stock-out');
            }
            setAvailableStocks({...availableStocks, [vegetable.id]: availableStock });
            setCartProducts({...KartProducts,[activeSession]: [...KartProducts[activeSession]??[], vegetable] });
            dispatch({ type: 'CHOOSEN_PRODUCT', payload: {...KartProducts,[activeSession]: [...KartProducts[activeSession]??[], vegetable] } });

        }
        toggleVegetableModal(!opened)
        scrollToSection()
    }
    
    const addToCart = prID => 
    {
        let product = initialProducts.find(ite => ite.id === prID); 
        if(product.catName && product.catName.toLowerCase().indexOf('vegetable')!==-1 ) {
            product = {...product, unit:'kg', stock:1}
            setVegetable(product)
            return handleVegetable() 
        }
        const copyKartProducts = JSON.parse(JSON.stringify(KartProducts));
        let thisProduct = copyKartProducts[activeSession]?.find(ite => ite.id === prID);
        // check if the product is already in cart
        if( thisProduct && !split ) {
            let updatedStock = thisProduct.stock + 1;
            let availableStock = product.quantity - updatedStock;
            if( availableStock === -1 ) {
                return document.querySelector('.also[data-id="'+product.id+'"]').classList.add('stock-out');
            }
            if(!split) {  // update the current project highlight
                setCurrent(KartProducts[activeSession].findIndex(item => item.id === product.id))
            } else { // update the current project highlight if splittin products is off
                setCurrent(KartProducts[activeSession]?.length??0) 
            }
            // update the remaining stock each product
            setAvailableStocks({...availableStocks, [product.id]: availableStock });
            thisProduct.stock = updatedStock;
            setCartProducts(copyKartProducts);
            dispatch({ type: "CHOOSEN_PRODUCT", payload:copyKartProducts });
        
        } else {
            setCurrent(KartProducts[activeSession]?.length??0 ) 
            product = {...product, stock: 1 }
            let consumed = Object.values(KartProducts).flat()?.filter( item => item.id === product.id).reduce( (prev, item) => prev + item.stock, 0 )?? 0;
            let availableStock = product.quantity - ( consumed + 1 );
            if( availableStock === -1 ) {
                return document.querySelector('.also[data-id="'+product.id+'"]').classList.add('stock-out');
            }
            setAvailableStocks({...availableStocks, [product.id]: availableStock });
            setCartProducts({...KartProducts,[activeSession]: [...KartProducts[activeSession]??[], product] });
            dispatch({ type: 'CHOOSEN_PRODUCT', payload: {...KartProducts,[activeSession]: [...KartProducts[activeSession]??[], product] } });
            // update the current project highlight
        }
        
    }

    const resetCart = () => {
        setCartProducts( {...KartProducts,[activeSession]: [] });
        dispatch({ type: "CHOOSEN_PRODUCT", payload: {...KartProducts, [activeSession]: []} });
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

    const handleImgError = e => {
        e.target.src = labelImg
    }
    // category se filter karega
    const filterProducts = catID => {
        setProducts(chunk(allProducts.data.products.filter(ite => ite.category_id===catID),4))
        toggleOther(!catID)
    }

    const scrollToSection = () => {
        let el = document.querySelector(`.chosen-product.selected`);
        if(el) {
            el.scrollIntoView({
                behavior:'smooth',
                block: 'center'
            })
        }
    };
    
    useEffect(() => {
        if( isSuccess ) {
            setCategories(data.categories)
            const cats = [];
            data.categories.forEach( cat => (cats[cat.id] = cat.color));
            putCats(cats);
        }
        if(allProducts.isSuccess) {
            if(allProducts.data.products.length === 0 ){
                setNoProduct(true);
            } else {
                setNoProduct(false)
            }
            setProducts(chunk(allProducts.data.products, 4))
            setInitialProducts(allProducts.data.products);
        }
        return () => {
            setInitialProducts([])
            setProducts([])
        }
    },[ isSuccess, data, allProducts.data, allProducts.isSuccess, navigator]);

    useEffect(()=> {
        setCartProducts(cartProducts);
        scrollToSection()
        return () => {
            setCartProducts([]);
        }
    },[ cartProducts ]);

    useEffect(()=> {
        if(cartStocks){
            setAvailableStocks(cartStocks)
        }
        return () => setAvailableStocks({})
    },[location, cartStocks])
 
    const base = {
        height:'69vh',
        placeContent:'center',
        display:'grid',
        placeItems:'center',
        width:'100%',
        backgroundColor: '#dadada', 
        marginTop:'5%'
    }

    const addCustomProduct = async e => 
    {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', custom.name);
        fd.append('price', custom.price);
        fd.append('barcode', custom.barcode);
        fd.append('quantity', custom.stock);
        fd.append('image', custom.image);
        if(!custom.name || !custom.price || !custom.barcode) {
            return Warning('Fill the required fields');
        }

        dispatch({ type:"LOADING" })
        const {data} = await axios.post(`/products/create-custom`, fd, {
            headers:{ 
                "Accept"       :"application/json",
                "Content-Type" : "multipart/form-data",
                "pos-token"    : localStorage.getItem('pos-token')
            }
        });
        dispatch({ type:"STOP_LOADING" })
        if( data.status ) {
            toast.success(data.message);
        } else { 
            toast.error(data.message);
        }       
    }

    const handleFile = e => {
        const file = e.target.files[0];
        setCustom({...custom, image: file})
    }
    
    const {type:screenType} = useParams();
    
    const changeInput = input => {
        if(editing) {
            let newAmount
            if(input==='clear') {
                newAmount = '0'
                setNumber(''); 
            } else {
                newAmount = number + input;  
                setNumber(number + input); 
            } 
            setCartProducts( {...KartProducts,[activeSession]: KartProducts[activeSession].map((item, i)=> {
                if(i=== currentProduct ) {
                    item = {...item, price:newAmount}
                }
                return item
            }) });
        }
    }

    const fs2 = {fontSize: '2rem'}

    return (
        <>
            <div className={`col-md-12 position-relative ${screenType==='customer' && "d-grid justify-content-center"}`} >
                { (Object.keys(openingAmountSet).length === 0 || !openingAmountSet.status === true) && screenType!=='customer'? (
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
                                                    type={'text'}
                                                    placeholder={currency}
                                                    onChange={e => setEnteredCash(e.target.value)}
                                                    style={{border:'1px solid gray'}}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </ModalBody>
                                <ModalFooter className={'justify-content-center'}>
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
                {
                    screenType==='customer' && <div >
                        <h2 className='text-center' style={{ fontSize:'3rem', fontWeight:'900' }}>
                        {currency} {parseFloat(KartProducts[activeSession]?.reduce((acc, cur)=> acc + (cur.stock * parseFloat(cur.price)),0)).toFixed(2)}
                        </h2>
                    </div>
                }
                <div className={`col-md-4 pt-3 ${screenType==='customer'?'':'position-fixed'}`} style={{filter:Object.keys(openingAmountSet).length === 0 || !openingAmountSet.status === true ? 'blur(5px)':'',width:screenType==='customer'?'100%':'38.8%'}}>
                    { sessions.map( session => (<div key={session} ref={sectionRef} className={`container ms-2 put-here ${activeSession===session?'':'d-none'} ${KartProducts[activeSession] && KartProducts[activeSession].length && screenType!=='customer' ?'action-visible':''}`} 
                        style={{
                            borderRadius:'20px',
                            backgroundColor:'#dadada'
                    }}>
                        <div className={`card ${KartProducts[activeSession] && KartProducts[activeSession].length? 'd-none':''}`} style={base}>
                            <i className="fa-solid fa-cart-shopping" style={{fontSize:'60px'}} />
                            <b className="mt-3"> Start adding products </b>
                        </div>
                        { KartProducts[activeSession] && KartProducts[activeSession].map( (item,index) => (<div key={index} className={`row chosen-product mt-2 ${currentProduct===index && 'selected'}`} data-id={item.id} onClick={()=> setCurrent(index)}>
                            <div className="d-flex w-100">
                                <b style={{maxWidth:'24rem'}}> {item.name} </b>
                                <strong className="price" data-price={item.price}>{currency +' '+ (item.stock * parseFloat(item.price)).toFixed(2)}</strong>
                            </div>
                            <div className="d-flex">
                                <span className="quantity"> {parseFloat(item.stock).toFixed(2)} </span>
                                {item.id!=='quick' && <p className="ms-3 mt-1">{`${currency + ' ' + parseFloat(item.price).toFixed(2)} / ${item.unit? item.unit : 'Units'}`}</p>}
                            </div>
                            <button className="btn" onClick={()=>removeFromCart(index)}><i className="mdi mdi-close"/></button>
                        </div>))}
                    </div>))}
                    <div className={`container ms-2 mt-3 actionBar ${KartProducts[activeSession] && KartProducts[activeSession].length && screenType!=='customer' ? '':'d-none'}`} style={{height: '54vh'}}>
                        <div className="row">
                            <div className="col-sm-12 d-flex">
                                <div className="col-sm-6">
                                    <Link className="btn btn-light btn-rounded text-white" to={`/payment/${activeSession}`} style={{backgroundColor:'#04537d',width:'93%'}}> Payment </Link>
                                </div>
                                <div className="col-sm-6 d-flex justify-content-end align-items-center position-relative">
                                    <div className='position-absolute'>
                                        <p style={{lineHeight:2.1}}><b> Total: &nbsp; 
                                        <span className="total-amount" style={{left:0,fontSize:'2.3rem'}}>{currency} {parseFloat(KartProducts[activeSession]?.reduce((acc, cur)=> acc + (cur.stock * parseFloat(cur.price)),0)).toFixed(2)} </span> </b></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row mt-1">
                            {[1,2,3].map( it => <div className="col-sm-3" key={it} onClick={()=> changeInput(it)}>
                                <button className="btn btn-light num w-100 text-dark" disabled={!editing} style={btnStyle}> <b> {it} </b> </button>
                            </div>)}
                            <div className="col-sm-3" onClick={resetCart}>
                                <button className="btn btn-light text-dark" type="button" style={btnStyle}> <b>Delete</b> </button>
                            </div>
                        </div>
                        <div className="row mt-1">
                            { [4,5,6].map( it => <div className="col-sm-3" key={it} onClick={()=> changeInput(it)}>
                                <button className="btn btn-light num w-100 text-dark" disabled={!editing} style={btnStyle}> <b> {it} </b> </button>
                            </div>)}
                            <div className="col-sm-3"/>
                        </div>
                        <div className="row mt-1">
                            {[7,8,9].map( ite => <div className="col-sm-3" key={ite} onClick={()=> changeInput(ite)}>
                                <button className="btn btn-light num w-100 text-dark" disabled={!editing} style={btnStyle}> <b> {ite} </b> </button>
                            </div>)}
                            <div className="col-sm-3">
                            </div>
                        </div>
                        <div className="row mt-1">
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark" disabled={!editing} onClick={()=> changeInput('.')} style={btnStyle}> <b> . </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark" disabled={!editing} onClick={()=> changeInput(0)} style={btnStyle}> <b> 0 </b> </button>
                            </div>
                            <div className="col-sm-3">
                                <button className="btn btn-light num w-100 text-dark" disabled={!editing} onClick={()=>changeInput('clear')} style={btnStyle}> <b>Clear</b> </button>
                            </div>
                            <div className="col-sm-3" onClick={()=> setEditing(!editing)}>
                                <button className="btn btn-light num w-100 text-dark" > <b> {!editing?'Edit Price':'Done'} </b> </button>
                            </div>
                        </div>
                    </div>

                </div>
                {screenType!=='customer' ? <div className="col-md-7 position-absolute library" style={{
                    height:'70vh',
                    right:'5px',
                    filter: Object.keys(openingAmountSet).length === 0 || !openingAmountSet.status === true ? 'blur(5px)':''
                    }}
                    
                >
                    <div className="position-fixed" style={{backgroundColor:'#a0bfcf',minHeight:70, width:'58%',zIndex:100}}>
                        <div className="category row ms-5" style={{flexWrap:'nowrap'}} ref={cRef}>
                            { prCategories.map((Cat,i) => (<div key={i} className={`category-item ${i===0 ?'active':''}`} style={{color:isColorDark(hexToRgb(Cat.color))? 'white':'black', background:Cat.color}} onClick={()=>filterProducts(Cat.id)}>
                                {(Cat.name).includes('/') ? (Cat.name).split('/')[1]: Cat.name }
                            </div>))}
                            <div className='category-item' onClick={()=> filterProducts(null)} style={{background:"azure", width:200, marginRight:80}}>
                                Other 
                            </div>
                            <div className='position-fixed t-scroller' style={{bottom:40,right:40}} onClick={scrollTop}>
                                <button className='btn btn-rounded bg-white' style={{border:"2px dashed"}}>
                                    <i className='fa fa-arrow-up'/>
                                </button>
                            </div>
                        </div>
                        <button className={`btn prev position-relative`} style={{top:5,zIndex:2,left:-30}} onClick={()=> cRef.current.scrollBy({left:-200, behavior:'smooth'})}>
                            <i style={fs2} className="fa-solid fa-circle-chevron-left text-dark"/>
                        </button>
                        <button className="btn next position-absolute" style={{right:-10,top:5,zIndex:2 }} onClick={()=>cRef.current.scrollBy({left:200, behavior:'smooth'})}>
                            <i style={fs2} className="fa-solid fa-circle-chevron-right text-dark" />
                        </button>
                    </div>
                    <div className="contents" ref={cntRef}>
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
                        { products.map( (row, k) => (<div className={'row mt-3'} key={k}>
                                {row.map((product,i ) => (
                                    <div key={i} className={`col-md-3 also ${(product.quantity - product.stock)===0 || product.quantity - cartStocks[product.id] === 0 || parseInt(product.quantity)=== 0 ? 'stock-out':''}`} onClick={()=>addToCart(product.id)} data-id={product.id}>
                                        <div className='cell' style={{minHeight:135}}>
                                            {
                                            displayImage &&
                                            <div className='w-100'>
                                                <img className='title-img' src={process.env.REACT_APP_BACKEND_URI+'images/'+product.image} onError={handleImgError} alt={product.name}/>
                                            </div>
                                            }
                                            <div className='w-100' style={{minHeight: !displayImage && 'inherit' ,color:isColorDark(hexToRgb(catColors[product.category_id]))? 'white':'black', background:catColors[product.category_id]}}>
                                                <strong className='wrapped-text' style={{alignContent:'center'}}>
                                                    {wrapText(product.name, 100)}
                                                    {
                                                        product.name.length > 100 &&
                                                    <span className='tooltiptext'>{product.name}</span>
                                                    }
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
                        
                    </div>
                    {products.length === 0 && !Other && (<div className="lib-loader justify-content-center align-items-center" 
                    style={{height:'-webkit-fill-available'}} >
                        {
                            noProduct && isSuccess? <>
                            <h1> No products... </h1>
                            <button className='btn btn-rounded btn-warning fs-4' onClick={fetchPhoneProducts}> 
                                { loadingPhone? <i className='fa fa-spin fa-spinner'/>:'Sync phone products'} 
                            </button> 
                            </> : 
                            <i className='fa fa-spin fa-spinner' />
                        }
                        
                    </div>)}
                </div>: null}
            </div>

            <Modal isOpen={otherOpen}>
                <Form onSubmit={addCustomProduct}>
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
                                    onChange={e => setCustom({...custom, name: e.target.value})}
                                    defaultValue={custom.name}
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
                                    onChange={e => setCustom({...custom, price: e.target.value})}
                                    defaultValue={custom.price}
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
                                    onChange={e => setCustom({...custom, stock: e.target.value})}
                                    defaultValue={custom.stock}
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
                                    onChange={e => setCustom({...custom, barcode: e.target.value})}
                                    defaultValue={custom.barcode}
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
                                onChange={handleFile}
                            />
                            Upload Product Image
                        </label>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <button className='btn btn-light btn-rounded' type='button' onClick={()=> toggleModal(!otherOpen)} > Close </button>
                    <button className='btn btn-primary btn-rounded'> Submit </button>
                </ModalFooter>
                </Form>
            </Modal>
            <Modal isOpen={opened}>
                <Form onSubmit={addVeg}>
                    <ModalHeader>
                        <b> Add Vegetable </b>
                    </ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col>
                                <FormGroup>
                                    <Label>
                                        <b> Price </b>
                                    </Label>
                                    <Input 
                                        type='text'
                                        placeholder={currency}
                                        onChange={e => setVegetable({...vegetable, price:e.target.value})}
                                        defaultValue={vegetable.price}
                                        style={{border:'1px solid gray'}}
                                    />
                                </FormGroup>
                            </Col>
                            <Col>
                                <FormGroup>
                                    <Label>
                                        <b> Weight </b>
                                    </Label>
                                    <Input 
                                        type='text'
                                        placeholder={`KGs / gm`}
                                        onChange={e => setVegetable({...vegetable, unit:e.target.value})}
                                        defaultValue={vegetable.unit}
                                        style={{border:'1px solid gray'}}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <FormGroup>
                                    <Label>
                                        Quantity (optional)
                                    </Label>
                                    <Input 
                                        type='number'
                                        onChange={e=> setVegetable({...vegetable, stock: e.target.value})}
                                        defaultValue={vegetable.stock}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter >
                        <button className='btn btn-light btn-rounded' type='button' onClick={()=> toggleVegetableModal(!opened)} >
                            Cancel
                        </button>
                        <button className='btn btn-rounded btn-success' type={`submit`} > Add </button>
                    </ModalFooter>
                </Form>
            </Modal>
            <Modal isOpen={appModal} size='sm'>
                <Form onSubmit={fetchPhoneProducts}>
                    <ModalHeader>
                        Enter application key 
                    </ModalHeader>
                    <ModalBody>
                        <Input onChange={e=> setKey(e.target.value)} type='text' name='appKey'/>
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

export default POS