// routes/discountRoutes.js
const express = require('express')
const router = express.Router()
const DiscountController = require('../controllers/DiscountController')

// POST - Apply discount
router.post('/apply', DiscountController.applyDiscount)






module.exports = router