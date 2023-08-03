var express = require('express');
var router = express.Router();
var db = require('../libs/mysql');

router.get('/:id', function (req, res){
	var user =  req.user;
	db.query('SELECT * FROM product where product_id=? ', [req.params.id], function (err, products, fields) {
		db.query('SELECT * FROM comments where product_id=? ', [req.params.id],function (err, comments, fields) {
			if (err) { return done(err); }
			else { 
				res.render('products/detail', { products: products[0],comments:comments ,user:user}); 
			}
		});
	});
});

router.post('/:id', function (req, res) {
	if (!req.user) {
		res.send(
		`<script type="text/javascript">
		alert(" 로그인이 필요한 서비스입니다.");
		document.location.href="/";</script> `);
	}
	else{
		db.query('SELECT product_count FROM cart where product_id=? AND user_id=? ', [req.params.id,req.user.user_id], function (err, count, fields) {
			if (err) return done(err);
			else if (count.length===0){
				db.query('insert into cart(user_id,product_id,product_count)values(?,?,?)'
        ,[req.user.user_id,req.params.id,1], function (err, results) {
            if (err) res.send('err');
            else res.redirect('/');  
        });	
			}
			else {
				var product_count= count[0].product_count+1;
				db.query('update cart set product_count=? where product_id=? and user_id=?'
				,[product_count,req.params.id,req.user.user_id], function (err, results) {
						if (err) res.send('err');
						else res.redirect('/'); 
				});
			}
		});
	}
});

//댓글삭제
router.get('/comment/delete/:id', function(req, res){
  comments_id=req.params.id
  db.query('SELECT product_id FROM comments where comments_id = ?',[comments_id],function(err,id){  
      db.query('DELETE FROM comments where comments_id = ?',[comments_id],function(err){ 
          res.redirect('/products/'+id[0].product_id);
      });
  });
});

module.exports = router;

