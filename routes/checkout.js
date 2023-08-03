var express = require('express');
var router = express.Router();
var db = require('../libs/mysql');

const { Iamporter, IamporterError } = require('iamporter');
const iamporter = new Iamporter({
    apiKey: '1431486776108814', // REST API 키
    secret: 'A3BKcEBcMl4kHY4GgMfRxcgi1YOUxJ96rE066sqI6XEGzVwVHYHOA4xIcspo14Rh4GeiBD2TMAKRKOm9' // REST API secret
});

router.get('/' , function(req, res){
  user = req.user
  db.query('SELECT cart.cart_id, product.product_id,product.product_name,cart.product_count,product.product_img,product.product_detail,product.product_price FROM cart LEFT JOIN product ON cart.product_id = product.product_id'
     ,function (err, cart, fields) {
        db.query('SELECT * FROM address where user_id=? '
        ,[user.user_id], function (err, address) {
            if (err) res.send('err');
            else res.render('checkout/index', { cartList : cart , addresses : address} ); 
        });
     })
});

router.get('/address' , function(req, res){
  db.query('SELECT * FROM address where user_id=? ', [req.user.user_id],function (err, address, fields) {
    if(address.length===0)res.render('checkout/address',{address:""});
    else res.render('checkout/address',{address: address[0]});
    
  });
});

router.post('/address' , function(req, res){
  var post =req.body;
  db.query('SELECT * FROM address where user_id=? ', [req.user.user_id],function (err, address, fields) {
    if(address.length===0){
      db.query('insert into address(user_id,name,zipcode,address,address_detail,tel,req)values(?,?,?,?,?,?,?)'
      ,[req.user.user_id,post.name,post.zipcode,post.address,post.address_detail,post.tel,post.req], function (err, results) {
          if (err) res.send('err');
          else res.redirect('/checkout');  
      });
    }
    else {  
      db.query('update address set name=?,zipcode=?,address=?,address_detail=?,tel=?,req=? where user_id=?'
				,[post.name,post.zipcode,post.address,post.address_detail,post.tel,post.req,req.user.user_id], function (err, results) {
          if (err) res.send('err');
          else res.redirect('/checkout');  
        });
    }
  });
});

//결제
router.get('/success', function(req,res){
  res.render('checkout/success');
});

router.get('/complete',async function (req,res){
  var payData = await iamporter.findByImpUid(req.query.imp_uid);
  var data= payData.data;
  await db.query('insert into totalOrder(user_id,price,name,zipcode,address,tel) values(?,?,?,?,?,?) '
  ,[req.user.user_id,data.amount,data.buyer_name,data.buyer_postcode,data.buyer_addr,data.buyer_tel], 
  function (err, results) {
    db.query('DELETE FROM cart where user_id=?',[req.user.user_id]
    ,function(err,results){
      if (err) res.send('err');
      else  res.redirect('/checkout/success');
    });
  });
});

router.get('/search', function(req,res){
  res.render('checkout/search');
});

router.get('/search/list', function(req,res){
  db.query('select user_id from user where email=?',[req.query.email], function (err, results, fields) {
      var id=results[0].user_id;
      db.query('SELECT * FROM totalOrder where user_id=? ',[id], function (err, checkoutList, fields) {
          res.render('checkout/list', { checkoutList : checkoutList } );
      });
  });
});
module.exports = router;