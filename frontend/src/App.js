import axios from "axios"; 
import headers from './headers';
import Themeroutes from "./routes/Router";

import ShowError from './components/errors/ShowError';
import "./asset/css/feather.css";
import "./asset/css/materialdesignicons.min.css";
import "./asset/css/all.min.css";
import "./asset/css/fontawesome.min.css";
import "./asset/css/style.css"; 
import 'datatables.net-dt'
import 'datatables.net-dt/css/dataTables.dataTables.css'
import 'jquery/dist/jquery.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';

import { useSelector } from "react-redux";
import { useNavigate, useRoutes } from "react-router-dom";
import { useEffect } from "react";

axios.defaults.baseURL='http://localhost:5000';

axios.defaults.headers.common = headers();

function App() {

    let { userToken } = useSelector(state=>state.auth);

    const { error, errorCode } = useSelector( state=>state.auth )
    let navigate = useNavigate();
    useEffect(()=> {

        if( userToken===null ) {
            navigate('/login')
        } 
        return () => {}

    },[ userToken, navigate ])
    
    const routing = useRoutes(Themeroutes);
    if(error) {
        if(errorCode===500) {
            return <ShowError error={error}/>
        }
    }
    return routing;
}

export default App;
