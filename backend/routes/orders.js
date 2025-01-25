const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const CashierSession = require('../models/CashierSession');

const fetchuser= require('../middlewares/loggedIn');

let error = { status : false, message:'Something went wrong!' }
let output = { status : true }

router.get('/', fetchuser , async(req, res) => {

    const orders = Order.query()
    .withGraphFetched('[customer(selectName), cashier(selectName)]')
    .modifiers({
      selectName(build) {
        build.select('id', 'name');
      },
    });

    let me = await User.query().where('id', req.body.myID ).first();
    if(me.type == 'admin') {
        orders.orderBy('id', 'desc'); 
    } else {
        orders.where('cashier_id', me.id ).orderBy('id', 'desc'); 
    }
    return res.json({status:true, orders:await orders });

});

router.post('/create', fetchuser, async(req, res) => 
{ 
    try {
        // Create the order
        const order = await Order.query().insert({
            session_id: req.body.session_id,
            amount: req.body.amount,
            ref_no: Math.floor(100000000000 + Math.random() * 899999999999),
            customer_id: req.body.customer_id?? 0,
            payment_mode: req.body.payment_mode,
            transaction_type: req.body.transaction_type,
            cashier_id: req.body.myID,
            created_at: new Date(),
        });

        if (!order) {
            throw new Error('Error creating order');
        }

        if (req.body.sessionData) {
            // Create the cashier session
            await CashierSession.query().insert({
                order_id: order.id,
                cashier_id: req.body.myID,
                session_id: req.body.session_id,
                cash_register_id: req.body.cash_register_id,
                data: req.body.sessionData,
            });

            const sessionData = req.body.sessionData;
            const minStock = await Setting.query().where('user_id', req.body.myID )
            .where('key', 'STOCK_ALERT')
            .first();

            for (const [productId, stock] of Object.entries(sessionData.quantity)) {
                
                if (productId === 'quick') continue;
                // decrement product stock
                const product = await Product.query().findById(productId).patch({
                    quantity: Product.raw('quantity - ?', [stock]),
                });
                // await product.$query().patch({
                //     quantity: product.quantity - stock,
                // });

                // Check stock alert
                if (minStock) {
                    const prod = await Product.query()
                        .where('id', productId )
                        .select('quantity', 'name')
                        .first();

                    if ( prod.quantity < minStock.value ) {
                        // try {
                        //     await broadcast('EventsNotification', {
                        //         message: `Stock named ${prod.name} is running out!`,
                        //         created_at: new Date().toISOString(),
                        //     }, req.user.id);
                        // } catch (error) {
                        //     console.error('Broadcast error:', error);
                        // }
                    }
                }
            }

            // try {
            //     await broadcast('StockReduced', sessionData.quantity);
            // } catch (error) {
            //     console.error('Broadcast error:', error);
            // }

            return res.status(200).json({ status: true, message: 'Transaction completed!' });
        }

        return res.status(200).json({ status: false });

    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ status: false, message: 'An error occurred', error: error.message });
    }
})
// Route 3 : Get logged in user details - login required
router.get('/view-order/:id', fetchuser, async(req, res) =>{
    try 
    {
        let orderID = req.params.id;
        let order = await Order.query().where('id', orderID ).withGraphFetched('cashier').first();
        const cashier = order.cashier;
        
        let session = await CashierSession.query().where('session_id', order.session_id ).where('order_id', order.id ).first().select('data');
        let data = JSON.parse(session.data)
        const products = await Product.query().whereIn( 'id', data.products );
        console.log(products)
        // return res.json({products});
        const pairs = {};
        products.forEach( product => {
            pairs[product.id] = product;
        });

        return res.json({
            status: true,
            order,
            products: pairs,
            session,
            cashier
        });

    } catch (e) {
        error.message = e.message;
        console.log(error.message);

        return res.json({
            status: false,
            order:{},
            products: [],
            session: [],
        }) 

    }
    }
);

module.exports=router 