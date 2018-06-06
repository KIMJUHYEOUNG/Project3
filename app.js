var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var searchRouter = require('./routes/result');
var accountRouter = require('./routes/account');
var itemsRouter = require('./routes/items');
var basketRouter = require('./routes/basket');
var orderRouter = require('./routes/order');
var sellerRouter = require('./routes/seller');
var shippingRouter = require('./routes/shipping');
var adminRouter = require('./routes/admin');
var signupRouter = require('./routes/signup');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/result', searchRouter);
app.use('/account', accountRouter);
app.use('/items', itemsRouter);
app.use('/basket', basketRouter);
app.use('/order', orderRouter);
app.use('/seller', sellerRouter);
app.use('/shipping', shippingRouter);
app.use('/admin', adminRouter);
app.use('/signup', signupRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
