import axios from "axios";

let userToken = localStorage.getItem('pos-token') ?? null
const menus = JSON.parse(localStorage.getItem('menus'))??[];
const isAdmin = JSON.parse(localStorage.getItem('isAdmin'))??false;
const myInfo = JSON.parse(localStorage.getItem('pos-user')??'{}')
const cartProducts = JSON.parse(localStorage.getItem('cartProducts')??'{"1":[]}');
const cartStocks = JSON.parse(localStorage.getItem('cartStocks')??'{}')
const openingCash = JSON.parse(localStorage.getItem('openingCash')??'{}');
const openingCashID = localStorage.getItem('openingCashID')?? null;

async function getUserDetails () {
  try {
    return axios.get('user').then(resp=>resp.data);
  } catch(er) {
    console.log(er.message)
    return {}
  }
}

const initialState = {
    loading:false,
    myInfo,
    userToken,
    error: null,
    errorCode:null,
    success: false, 
    currency: localStorage.getItem('currency'),  
	search:'',  
    isAdmin,
    openingCash,
    openingCashID,
    cartProducts,
    split: JSON.parse(localStorage.getItem('split')??'false'),
    cartStocks
}

const authReducer = (state=initialState,action) => {
    switch(action.type){
       
        case 'SET_TOKEN':  
            return {
                ...state,
                loading:false,
                userToken:action.payload
            }
        case 'SET_AUTH':
            return {
                ...state,
                loading:false,
                myInfo:action.payload
            }
        case 'LOGOUT':
            axios.post('/logout').then(({ data }) => {  
                localStorage.removeItem('auth-token')
                localStorage.removeItem('companyID') 
            }).catch()

            return {
                ...state,
                myInfo:null,
                userToken:null,
                loading:false,
                companyID:null
            }
            
        case 'LOADING': 
            return {
                ...state,
                loading:true
            } 
        case 'SET_CURRENCY': 

            localStorage.setItem(`currency`, action.payload )

            return {
                ...state,
                currency:action.payload,
            }

        case 'STOP_LOADING':
            return {
                ...state,
                loading:false
            } 
		
		case 'SEARCH':
			return {
				...state,
				search:action.payload
			}
            
        case 'ERROR':{
            return {
                ...state,
                error:action.payload.error,
                errorCode:action.payload.code
            }
        }

        case "SPLIT": {
            localStorage.setItem('split', action.payload);
            return {
                ...state,
                split: action.payload
            }
        }

        case 'SET_DASHBOARD_MENU':
			return {
				...state, 
                menus:action.payload
			}
            
        case 'SET_ADMIN_STATUS':
            localStorage.setItem('isAdmin', action.payload )
            return {
                ...state,
                isAdmin:action.payload
            }
       
        case 'SET_PERMISSION':
            return {
                ...state,
                permissions:action.payload
            }
       
        case 'CHOOSEN_PRODUCT':
            localStorage.setItem('cartProducts', JSON.stringify(action.payload??[]));
            let prod = Object.values(Object.values(action.payload).flat()) // Get all the arrays in the object
            .flat() // Flatten them into one array
            .reduce((acc, product) => {
              acc[product.id] = (acc[product.id] || 0) + product.stock; // Sum stocks by product id
              return acc;
            }, {})
            localStorage.setItem('cartStocks', JSON.stringify(prod));
            return {
                ...state,
                cartProducts:action.payload,
                cartStocks:prod
            }

        case 'CART_STOCKS':
            localStorage.setItem('cartStocks', JSON.stringify(action.payload))
            return {
                ...state,
                cartStocks: action.payload
            }

        case "SET_CASH" : {
            localStorage.setItem('openingCash', JSON.stringify(action.payload));
            return {
                ...state,
                openingCash:action.payload
            }
        }

        case "SET_OPENING_ID": {
            localStorage.setItem('openingCashID', action.payload);
            return {
                ...state,
                openingCashID: action.payload
            }
        }
        default : return state
    }
}
export {authReducer, getUserDetails}