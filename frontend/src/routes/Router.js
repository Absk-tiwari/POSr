import { lazy } from "react";
import { Navigate } from "react-router-dom"; 
// import { ProtectedRoute } from './../middleware/ProtectedRoute.js'
// import * as constant from "../constansts/permission.js";

const FullLayout = lazy(() => import("../components/layouts/FullLayout.js"));

/***** Pages ****/
const Login = lazy(()=>import("../components/auth/Login.js"))
const Register = lazy(()=>import("../components/auth/Register.js"))
const Dashboard = lazy(() => import("../components/Dashboard.js"));
const Sales = lazy(() => import("../components/Sales.js"));
const POS = lazy(() => import("../components/pos/POS.js"));
const Payment = lazy(() => import("../components/pos/Payment.js"));
const Products = lazy(() => import("../components/products/Products.js"));
const CreateProduct = lazy(() => import("../components/products/CreateProduct.js"));
const Configuration = lazy(() => import("../components/config/Configuration.js"));
const CategoryAndTax = lazy(() => import("../components/config/CategoryAndTax.js"));
const Notes = lazy(() => import("../components/config/Notes.js"));
const User = lazy(() => import("../components/config/User.js"));
const Inventory = lazy(() => import("../components/inventory/Inventory.js"));
/*****Routes******/

const ThemeRoutes = [
  {
    path: "/",
    element: <FullLayout />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" /> },
      { path: "/login", exact: true, element:<Login />},
      { path: "/register", exact: true, element: <Register /> },
      { path: "/dashboard", 
        exact: true, 
        element: (
          // <ProtectedRoute permission={constant.DASHBOARD}>
            <Dashboard />
          // </ProtectedRoute> 
        ) 
      },
      {
        path: "/sales",
        element: <Sales/>,
      },
      {
        path: "/pos",
        element: <POS/>,
      },
      {
        path: "/products",
        element: <Products/>,
      },
      {
        path: "/product/create",
        element: <CreateProduct/>,
      }, 
      {
        path: "/configuration",
        element: <Configuration/>,
      },
      {
        path: "/config/:type",
        element: <CategoryAndTax/>,
      },
      {
        path: "/inventory",
        element: <Inventory/>,
      },
      {
        path: "/payment/:active",
        element: <Payment/>,
      },
      {
        path: "/notes",
        element: <Notes/>,
      },
      {
        path: "/users",
        element: <User/>,
      },

    ],
  },
  
];

export default ThemeRoutes;
