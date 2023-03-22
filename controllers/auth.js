const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER,
    pass: process.env.PASSWORD
  }
});

const getLogin = (req, res) => {
  res.render('auth/login', {
    isLoggedIn: req.session.isLoggedIn,
    errorMessage: req.flash('error'),
    oldInput: {
      email: '',
      password: ''
    }
  });
};

const postLogin = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    // eslint-disable-next-line consistent-return
    .then((user) => {
      if (!user) {
        req.flash('error', 'Invalid username or password.');
        res.render('auth/login', {
          isLoggedIn: req.session.isLoggedIn,
          errorMessage: req.flash('error'),
          oldInput: {
            email: req.body.email,
            password: req.body.password
          }
        });
      }

      bcrypt
        .compare(password, user.password)
        .then((flag) => {
          if (flag) {
            req.session.user = user;
            req.session.isLoggedIn = true;
            return req.session.save(() => {
              res.redirect('/');
            });
          }
          req.flash('error', 'Invalid username or password.');
          return res.render('auth/login', {
            isLoggedIn: req.session.isLoggedIn,
            errorMessage: req.flash('error'),
            oldInput: {
              email: req.body.email,
              password: req.body.password
            }
          });
        })
        .catch(() => {
          res.redirect('/login');
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const postLogout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const getSignUpPage = (req, res) => {
  res.render('auth/signUp', {
    isLoggedIn: req.session.isLoggedIn,
    errorMessage: req.flash('error'),
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

// eslint-disable-next-line consistent-return
const postSignUp = async (req, res, next) => {
  const { email } = req.body;
  const { password } = req.body;
  const { confirmPassword } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signUp', {
      isLoggedIn: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password,
        confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(async () => {
      res.redirect('/login');
      await transporter.sendMail({
        to: [email],
        from: 'harshdesai18502@gmail.com',
        subject: 'SignUp succeeded!',
        html: '<h1>You successfully signed up</h1>'
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const getResetPasswordPage = (req, res) => {
  res.render('auth/reset', {
    isLoggedIn: req.session.isLoggedIn,
    errorMessage: req.flash('error')
  });
};

const postReset = (req, res, next) => {
  // eslint-disable-next-line consistent-return
  crypto.randomBytes(32, (err, buff) => {
    if (err) {
      return res.redirect('/reset-password');
    }
    const token = buff.toString('hex');

    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('reset-password');
        }
        const a = user;
        a.resetToken = token;
        a.resetTokenExipration = Date.now() + 3600000;
        return user.save();
      })
      .then(async () => {
        res.redirect('/');

        await transporter.sendMail({
          from: '"E-commerce" <shop@example.com>', // sender address
          to: req.body.email, // list of receivers
          subject: 'Password Reset', // Subject line
          text: "This is to reset your account's password.", // plain text body
          html: `<p>You requested a password Reset.</p>
            <p>Click this <a href="http://localhost:3000/reset-password/${token}">link</a> to reset the password.</p>`
        });
      })
      .catch(() => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

const getUpdatePassword = (req, res, next) => {
  const { token } = req.params;

  User.findOne({ resetToken: token, resetTokenExipration: { $gt: Date.now() } })
    .then((user) => {
      res.render('auth/update-password', {
        isLoggedIn: req.session.isLoggedIn,
        userId: user._id.toString(),
        token
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const postUpdatePassword = (req, res, next) => {
  const id = req.body.userId;
  const { password, token } = req.body;

  User.findOne({
    resetToken: token,
    resetTokenExipration: { $gt: Date.now() },
    _id: id
  })
    .then((user) =>
      bcrypt.hash(password, 12).then((hashedPassword) => {
        const a = user;
        a.password = hashedPassword;
        a.resetToken = undefined;
        a.resetTokenExipration = undefined;
        return user.save();
      })
    )
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  res.redirect('/');
};

module.exports = {getLogin,postLogin,postLogout,getSignUpPage,postSignUp,getResetPasswordPage,postReset,getUpdatePassword,postUpdatePassword};
