import React from 'react';
import {useSelector} from 'react-redux'
import inventory from '../asset/images/inventory.webp';
import store from '../asset/images/store.png';
import cart from '../asset/images/cart.webp';
import config from '../asset/images/config.png';
import sales from '../asset/images/sales.webp';
import {Link} from 'react-router-dom';

// <style>
// .redirect:hover {box-shadow: -4px 7px 15px -2px gray;transition: width ease-in-out 0.2s;margin-top: -3px;}.redirect {box-shadow: 0px 7px 15px -2px gray;}h5.pt-3 {  font-family: 'Roboto';}.row.jstify-content-center\;{justify-content: center;}.main-panel {overflow-x: inherit;overflow-y: inherit;position: inherit;right: inherit;top: inherit;bottom: inherit;padding: 0;}.main-panel {display: flex;-webkit-flex-direction: column;flex-direction: column;padding-bottom: 0vh;align-items: center;align-content: center;justify-content: center;}.page-body-wrapper {padding-top: 7%;}
// </style>

export default function Dashboard() {
  const { isAdmin } = useSelector(state=>state.auth);
  const padding = {padding:'2%'};
  const card = {width:'100%',textAlign:'center'}
  return (
    <>
      <div className="container">
        <div className="d-grid" style={{placeItems:'center'}}>
          <div className="col-md-6">
            <div className="row justify-content-center" >
              <div className="col-md-4 text-center" style={padding}>
                <Link to={`/pos`}>
                  <div className="card redirect" data-toggle="tooltip" data-placement="bottom" title="Point of sale">
                    <div className="card-body">
                      <div className="">
                        <div style={card}>
                          <img src={store} className="w-100" alt=''/>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                <h5 className="pt-3">Point of sale</h5>
              </div>
              {isAdmin && (
                <>
                    <div className="col-md-4 text-center" style={padding}>
                      <Link to={`/inventory`}>
                        <div className="card redirect" data-toggle="tooltip" data-placement="bottom" title="Inventory">
                          <div className="card-body">
                            <div className="d-flex">
                              <div style={card}>
                                <img src={inventory} className="w-100" alt='' />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <h5 className="pt-3">Inventory</h5>
                    </div>
                    <div className="col-md-4 text-center" style={padding}>
                      <Link to={`/products`} >
                        <div className="card redirect" data-toggle="tooltip" data-placement="bottom" title="Products">
                            <div className="card-body">
                            <div className="d-flex">
                                <div style={card}>
                                <img src={cart} className="w-100" alt='' />
                                </div>
                            </div>
                            </div>
                        </div>
                      </Link>
                      <h5 className="pt-3"> Products </h5>
                    </div>
                    <div className="col-md-4 text-center" style={padding}>
                      <Link to={`/configuration`}>
                        <div className="card redirect" data-toggle="tooltip" data-placement="bottom" title="Configuration">
                            <div className="card-body">
                            <div className="d-flex">
                                <div style={card}>
                                <img src={config} className="w-100" alt=''/>
                                </div>
                            </div>
                            </div>
                        </div>
                      </Link>
                      <h5 className="pt-3">Configuration</h5>
                    </div>
                    <div className="col-md-4 text-center" style={padding}>
                      <Link to={`/sales`}>
                        <div className="card redirect" data-toggle="tooltip" data-placement="bottom" title="Sales">
                            <div className="card-body">
                            <div className="d-flex">
                                <div style={card}>
                                <img src={sales} className="w-100" alt=''/>
                                </div>
                            </div>
                            </div>
                        </div>
                      </Link>
                      <h5 className="pt-3">Sales</h5>
                    </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
