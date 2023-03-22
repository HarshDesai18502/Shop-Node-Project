const express = require('express');
const { check, body } = require('express-validator');

const router = express.Router();

const {
  getLogin,
  postLogin,
  postLogout,
  getSignUpPage,
  postSignUp,
  postReset,
  getResetPasswordPage,
  getUpdatePassword,
  postUpdatePassword
} = require('../controllers/auth');
const User = require('../models/user');

router.get('/login', getLogin);

router.post('/login', postLogin);

router.get('/logout', postLogout);

router.get('/signup', getSignUpPage);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please Enter Valid Email.')
      .custom((value) =>
        User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            throw new Error('User Already Exist, select a different Email.');
          }
        })
      ),
    body('password')
      .isLength({ min: 5 })
      .withMessage('Passwprd must be minimum of 5 characters.'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password and Confirm password should be same.');
      }
      return true;
    })
  ],
  postSignUp
);

router.get('/reset-password', getResetPasswordPage);

router.post('/reset-password', postReset);

router.get('/reset-password/:token', getUpdatePassword);

router.post('/update-password', postUpdatePassword);

module.exports = router;
