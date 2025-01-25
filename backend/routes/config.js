const express = require("express");
const Setting = require('../models/Setting');
const router = express.Router();
const fetchuser = require('../middlewares/loggedIn')

let error = { status : false, message:'Something went wrong!' }
  
router.post('/update-stock-alert', fetchuser, async (req,res) => {
    try {  
        const alert = await Setting.query().where('key', "STOCK_ALERT").where('user_id', req.body.myID ).first();
        if(alert) {
            await Setting.query().where('user_id', req.body.myID).where('key', 'STOCK_ALERT').patch({
                value: req.body.stock
            });
            return res.json({status:true, message:"Stock alert updated!"});
        } 
        await Setting.query().insert({
            user_id: req.body.myID,
            key: "STOCK_ALERT",
            value: req.body.stock  
        });

        return res.json({status:true, message:"Stock alert created!" });

    } catch (e) {
        console.log("exception occured: ",e)
        error.message = e.message
        return res.status(400).json(error)        
    }
});

module.exports = router