const express = require("express");
const router = express.Router();

const productController = require("../controller/productController");

// Create Product
router.post(
  "/",
  productController.createProduct
);

// Get All Products
router.get(
  "/",
  productController.getProducts
);

// Get Product By ID
router.get(
  "/:itemid",
  productController.getProductById
);

// Update Product
router.put(
  "/:itemid",
  productController.updateProduct
);

// Deactivate Product
router.delete(
  "/:itemid",
  productController.deleteProduct
);

module.exports = router;