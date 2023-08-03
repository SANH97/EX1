var express = require('express');
var router = express.Router();
var db = require('../libs/mysql');

router.get('/' , function(req, res){
    db.query('SELECT cart.cart_id, product.product_id,product.product_name,cart.product_count,product.product_img,product.product_detail,product.product_price FROM cart LEFT JOIN product ON cart.product_id = product.product_id'
     ,function (err, cart, fields) {
        if(cart.length===0){
            res.send(`<script type="text/javascript">
            alert("비어있습니다.");
            document.location.href="/";</script> `);
        }
        else res.render('cart/index', { cartList : cart  } );
    });
});

router.get('/delete/:id',function(req,res){
    db.query('DELETE FROM cart where cart_id = ?',[req.params.id],function(err){    
        res.send(`<script type="text/javascript">
          alert("삭제완료");
          document.location.href="/cart";</script> `);
    });
});

module.exports = router;