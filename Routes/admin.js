const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const {
  getAddProduct,
  postAddProduct,
  getAdminProducts,
  getUpdateMenu,
  updateProduct,
  deleteProduct
} = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

router.post(
  '/product',
  isAuth,
  [
    body('productName').isString().trim().withMessage('Enter correct Title'),
    body('price').isFloat().withMessage('Price should be a floating number.'),
    body('description')
      .isLength({ min: 3, max: 400 })
      .trim()
      .withMessage('Description should contain atlease 3 characters.')
  ],
  postAddProduct
);

router.get('/products', isAuth, getAdminProducts);

router.get('/add-product', isAuth, getAddProduct);

router.post('/products/edit', isAuth, getUpdateMenu);

router.post(
  '/edit',
  isAuth,
  [
    body('productName').isString().trim().withMessage('Enter correct Title'),
    body('price').isFloat().withMessage('Price should be a floating number.'),
    body('description')
      .isLength({ min: 3, max: 400 })
      .trim()
      .withMessage('Description should contain atlease 3 characters.')
  ],
  updateProduct
);

router.post('/delete', isAuth, deleteProduct);

module.exports = router;
