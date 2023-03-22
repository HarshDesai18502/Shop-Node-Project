const { validationResult } = require('express-validator');
const fileHelper = require('../utils/file');

const Product = require('../models/product');

// For Add-Product Page
const getAddProduct = (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }

  return res.render('admin/add-product', {
    isLoggedIn: req.session.isLoggedIn,
    oldInput: '',
    errorMessage: null,
    validationErrors: []
  });
};

// To Create a Product
const postAddProduct = (req, res, next) => {
  const { productName: title, price, description } = req.body;
  const image = req.file;

  if (!image) {
    return res.status(422).render('admin/add-product', {
      isLoggedIn: req.session.isLoggedIn,
      errorMessage: 'Attached file is not image',
      oldInput: {
        title,
        price,
        description
      },
      validationErrors: []
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/add-product', {
      isLoggedIn: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        title,
        price,
        description: req.body.description
      },
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    title,
    imageUrl,
    price,
    description,
    userId: req.user
  });
  return product
    .save()
    .then(() => res.redirect('/admin/products'))
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// For getting all the products on Admin-side
const getAdminProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render('admin/products', {
        prods: products,
        title: 'Admin Products',
        isLoggedIn: req.session.isLoggedIn
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// To get update product page
const getUpdateMenu = (req, res, next) => {
  const { productId } = req.body;

  Product.findById(productId)
    .then((product) => {
      res.render('admin/edit-product', {
        prods: product,
        isLoggedIn: req.session.isLoggedIn,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// To update Product
const updateProduct = async (req, res, next) => {
  const { productId, productName: title, price, description } = req.body;

  const image = req.file;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      isLoggedIn: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      prods: {
        title,
        price,
        description,
        _id: productId
      },
      validationErrors: errors.array()
    });
  }

  return Product.findById(productId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      const a = product;
      a.title = title;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        a.imageUrl = image.path;
      }
      a.price = price;
      a.description = description;
      return product.save().then(() => {
        res.redirect('/admin/products');
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// To delete a Product
const deleteProduct = (req, res, next) => {
  const {productId} = req.body;
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return next(new Error('Product not Found'));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: productId, userId: req.user._id });
    })

    .then(() => {
      res.redirect('/admin/products');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

module.exports = {getAddProduct,postAddProduct,getAdminProducts,getUpdateMenu,updateProduct,deleteProduct};
