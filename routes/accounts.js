var express = require('express');
var router = express.Router();
var db = require('../libs/mysql');
var passwordhash = require('../libs/passwordHash');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function (user, done){
  console.log('serializeUser',user);
  done(null, user);
});

passport.deserializeUser(function (user, done){
  var result = user;
  result.password = "";
  console.log('deserializeUser',user);
  done(null, result);
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField : 'password',
  passReqToCallback : true
  },function (req, email, password, done){  
    db.query('SELECT * FROM user WHERE email=? AND password=?',[email,passwordhash(password)],function(err,results,fields){
      if(err)throw err;
      if(!results){
        return done(null,false,{
          message:'incorrect'
        });
      }else return done(null,results[0]);
    });
  }
));

//회원가입
router.get('/join',function(req,res){ 
  res.render('accounts/join');
});

router.post('/join',function(req,res){  
  var post = req.body;
  db.query('SELECT * FROM user WHERE email = ?', [post.email], function(err, results, fields){
    var email = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+/;//이메일 유효성 검사
    if (err) throw err;
    if (results.length > 0){ //아이디 중복 확인
      res.send(`<script type="text/javascript">
        alert("이미 존재하는 아이디 입니다.");
        document.location.href="/accounts/join";</script> `);
    }else if(post.password !== post.password1){ //비밀번호 동일성 확인
      res.send(`<script type="text/javascript">
      alert("입력된 비밀번호가 서로 다릅니다.");
      document.location.href="/accounts/join";</script> `);
    }else if(email.test(post.email)==false){ //이메일 형식 확인
      res.send(`<script type="text/javascript">
      alert("이메일 형식이 아닙니다.");
      document.location.href="/accounts/join";</script> `);
    }else{ 
      var password =passwordhash(post.password);
      db.query('INSERT INTO user(email,password,username,tel)values(?,?,?,?)',
      [post.email,password,post.username,post.tel], function (err, results) {
        if(err)throw err;
      });
      res.send(`<script type="text/javascript">
        alert("회원가입 성공.");
        document.location.href="/accounts/login";</script> `);
    }
  });
});
//로그인
router.get('/login',function(req,res){
  res.render('accounts/login');
});

router.post('/login', 
passport.authenticate('local',{ 
  failureRedirect: '/accounts/login',   
  failureFlash: true 
}),  
function(req,res){
  res.send('<script>alert("로그인 성공");location.href="/";</script>');
});

router.get('/logout', function(req, res){
  req.logout(function(err){
    if(err)throw err;
    res.redirect('/');
  });
});

module.exports= router; 