// routes/discountRoutes.js
const express = require('express')
const router = express.Router()
const DiscountController = require('../controllers/DiscountController')

// POST - Apply discount
router.post('/apply', DiscountController.applyDiscount)



// GET - Get ALL days for a room
router.get('/room/:roomId', DiscountController.getRoomDiscountDetails)


module.exports = router