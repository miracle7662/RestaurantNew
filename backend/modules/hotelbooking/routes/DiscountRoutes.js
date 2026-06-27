// routes/discountRoutes.js
const express = require('express')
const router = express.Router()
const DiscountController = require('../controllers/DiscountController')

// POST - Apply discount
router.post('/apply', DiscountController.applyDiscount)

// GET - Get discount details (with filters)

// GET - Get discount summary

// GET - Get ALL days for a room
router.get('/room/:roomId', DiscountController.getRoomDiscountDetails)

// GET - Get discount by ID

// DELETE - Remove discount
router.delete('/:detailId', DiscountController.removeDiscount)

module.exports = router