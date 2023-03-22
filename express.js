const express = require('express');
const bodyParser = require('body-parser');

// const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
// eslint-disable-next-line import/no-extraneous-dependencies
const dotenv = require('dotenv');

const session = require('express-session');
const mongoose = require('mongoose');

const MongoDBStore = require('connect-mongodb-session')(session);
// const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const adminRoutes = require('./Routes/admin');
const shopRoutes = require('./Routes/shop');
const authRoutes = require('./Routes/auth');

const errorController = require('./controllers/error');
const User = require('./models/user');
const logger = require('./logger');


dotenv.config();

const app = express();
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});
// const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().toISOString()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(helmet());
app.use(morgan('tiny'));

const corsOptions = {
  origin: ['https://example.com', 'https://example2.com'],
  OptionSuccessStatus: 200
};

app.use(cors(corsOptions));

app.set('view engine', 'ejs');

app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use(express.static('public'));
app.use('/images', express.static('images'));

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store
  })
);

// app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  return User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      return next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});

// app.use((req,res,next) => {
//   res.locals.isLoggedIn = req.session.isLoggedIn;
//   res.locals.csrfToken = req.csrfToken();
//   next();
// })

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);

app.use(errorController.pageNotFound);

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  res.redirect('/500');
});

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    app.listen(process.env.PORT);
  })
  .catch(() =>
    logger.customerLogger.log('error', 'Error while connecting to database')
  );
