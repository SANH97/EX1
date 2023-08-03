var express = require('express');
var router = express.Router();

var db = require('../libs/mysql');

router.get('/', function(req,res){
    db.query('SELECT * FROM product ',function(err,products,fields){
        if(err)return done(err);
        res.render( 'home',{products:products});
    });
});


module.exports = router;