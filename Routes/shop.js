const express = require('express');

const router = express.Router();

const {getIndexPage,getProducts,getProduct,postCartDeleteProduct,getOrders,createOrder,getInvoice, postCart, getCart} = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');


router.get('/',getIndexPage);

router.get('/products',getProducts);

router.get('/cart', isAuth , getCart);

router.post('/cart',isAuth ,postCart);

router.get('/products/:productId',getProduct);

router.post('/cart-delete-item', isAuth ,postCartDeleteProduct);

router.get('/orders', isAuth, getOrders);

router.post('/create-order',isAuth, createOrder);

router.get('/orders/:orderId', isAuth, getInvoice);

module.exports = router;