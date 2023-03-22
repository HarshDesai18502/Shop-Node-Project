const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const logger = require('../logger');

const ITEMS_PER_PAGE = 1;

// To get Index Page
const getIndexPage = (req, res) => {
  res.render('shop/index', {
    title: 'Shop',
    isLoggedIn: req.session.isLoggedIn
  });
};

// To get all the products
const getProducts = (req, res, next) => {
  const page = +req.query.page || 1;

  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        title: 'Products',
        isLoggedIn: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  logger.customerLogger.log('info', 'user successfully fetched products');
};

// To get a Single Product
const getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)

    .then((product) => {
      res.render('shop/view-product', {
        prods: product,
        isLoggedIn: req.session.isLoggedIn
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// For cart
const getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    // .execPopulate()
    .then((user1) => {
      const products = user1.cart.items;

      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products,
        isLoggedIn: req.session.isLoggedIn
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const postCart = (req, res) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
    .then((product1) => req.user.addToCart(product1))
    .then(() => {
      res.redirect('/cart');
    });
};

const postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
    .removeFromCart(prodId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const getOrders = (req, res) => {
  Order.find({ 'user.userId': req.user._id }).then((orders) => {
    res.render('shop/order', {
      orders,
      isLoggedIn: req.session.isLoggedIn
    });
  });
};

const createOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user1) => {
      const products = user1.cart.items.map((i) => ({
        product: { ...i.productId._doc }
      }));

      const order = new Order({
        products,
        user: {
          email: req.user.email,
          userId: req.user
        }
      });
      return order.save();
    })
    .then(() => {
      req.user.clearCart();
      res.redirect('/orders');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const getInvoice = (req, res, next) => {
  const { orderId } = req.params;

  Order.findById(orderId)
    // eslint-disable-next-line consistent-return
    .then((order) => {
      if (!order) {
        return next(new Error('No order found'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }

      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachement; filename="${invoiceName}"`
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      });
      pdfDoc.text('-----------------');
      let total = 0;
      order.products.forEach((prod) => {
        total += prod.product.price;
        pdfDoc.text(`${prod.product.title}  ${prod.product.price}`);
      });
      pdfDoc.text('-----------------');
      pdfDoc.text(`Total:${total}`);

      pdfDoc.end();
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

module.exports = {getIndexPage,getProducts,getProduct,getCart,postCart,postCartDeleteProduct,getOrders,createOrder,getInvoice};
