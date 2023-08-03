var express = require('express');
var path = require('path');
var bodyparser = require('body-parser');
var cookieParser = require('cookie-parser');

var session = require('express-session');
var MySqlStore= require('express-mysql-session')(session);
var passport = require('passport');

require('dotenv').config();


var admin = require('./routes/admin');
var accounts = require('./routes/accounts');
var home = require('./routes/home');
var products = require('./routes/products');
var cart = require('./routes/cart');
var checkout = require('./routes/checkout');

var db = {
  host:process.env.DB_HOST,
  port:process.env.DB_PORT,
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database:process.env.DB_DATABASE
}

//express사용
var app = express();

//session세팅
app.use(session({
  secret:'keyboard cat',
  resave:false,
  saveUninitialized:true,
  cookie: {
    maxAge: 2000 * 60* 60 //지속시간 2시간
  },
  store: new MySqlStore(db)
}));

// 미들웨어 셋팅
app.use(bodyparser.urlencoded({extended:true})); //url형식의 데이터 전달을 의미
app.use(bodyparser.json()); //json형태로 파싱
app.use(cookieParser());

//view 설정
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs');


//passport 적용
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  //지역변수 사용
  app.locals.isLogin = req.isAuthenticated();
  app.locals.userData = req.user; 
  next();
});

app.use('/admin', admin);
app.use('/accounts',accounts);
app.use('/',home);
app.use('/products', products);
app.use('/cart',cart);
app.use('/checkout', checkout);
//이미지 불러오기
app.use('/uploads', express.static('uploads'));

//서버가동
app.listen(3000,function(){
  console.log('3000 start');
});



