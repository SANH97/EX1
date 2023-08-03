var express = require('express');
var router = express.Router();
var db = require('../libs/mysql');

var adminRequired = require('../libs/adminRequired');

var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

//이미지 저장되는 위치 설정
var path = require('path');
var uploadDir = path.join( __dirname , '../uploads' ); // 루트의 uploads위치에 저장한다.
var fs = require('fs');

//multer 셋팅
var multer  = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, 'products-' + Date.now() + '.'+ file.mimetype.split('/')[1]);
    }
  });

const upload = multer({ storage: storage });

router.get('/products', function (req,res){ 
  db.query(`SELECT * FROM product`,function(err,products,fields){
      if(err){return done(err);}
      else{
          if(products.length>0){
              // 페이지당 게시물 수
              var page_size = 5;
              // limit 변수
              var no = '';
              //전체 게시물의 숫자 : 쿼리문 결과수
              var totalPageCount = products.length;
              if(totalPageCount < 0){
                totalPageCount = 0;
              }
              //현제 페이지
              var curPage = req.query.page;
              //현재페이지가 0 보다 작으면
              if (curPage <= 0 || curPage== undefined || typeof curPage=='undefined'||curPage==null){
                  curPage =1;
                  no = 0;
              }else{
                  no = (curPage - 1) * page_size;
              }
              var totalPage = Math.ceil(totalPageCount / page_size);// 전체 페이지수
              var startPage = 1; // 시작 페이지
              var endPage = (startPage + totalPage) - 1; //마지막 페이지
              
              var page_date = {
                  "curPage": curPage,
                  "totalPage": totalPage,
                  "startPage": startPage,
                  "endPage": endPage
              };
              db.query(`SELECT * FROM product LIMIT ${no}, ${page_size} `, function(err, products){
                  if(!err){
                      res.render('admin/products',{products : products, pasing : page_date});
                    }
              });
          }else{
              res.render('admin/products',{products:[]});
          }
      }
  });
});

//게시글 작성
router.get('/products/write', adminRequired ,csrfProtection, function(req,res){
  //수정할 때에도 같은 form을 사용하기 위해 빈 변수( product )를 넣어서 에러를 피해준다.
  res.render( 'admin/form' , { product : "", csrfToken : req.csrfToken() }); 
});

router.post('/products/write', adminRequired, upload.single('thumbnail'),csrfProtection,function(req,res){
  var filename= (req.file) ? req.file.filename : "";
  var post = req.body;
  db.query('SELECT category_id FROM product_category where name=? ', [post.genre],function (err, results, fields) {
      db.query('insert into product(product_name,product_detail,product_img,product_price,product_stock,category_id)values(?,?,?,?,?,?)'
      ,[post.name,post.detail,filename,post.price,post.stock,results[0].category_id], function (err, results) {
          if (err) res.send('err');
          else res.redirect('/admin/products');  
      });
  });
});

//상세페이지 
router.get('/products/detail/:id'  ,adminRequired,function(req, res){
   db.query('SELECT * FROM product where product_id=? ', [req.params.id],function (err, products, fields) { 
      db.query('SELECT * FROM comments where product_id=? ', [req.params.id],function (err, comments, fields) {    
          res.render('admin/productsDetail', { product: products[0] ,comments:comments });
      });
  }); 
});

//댓글관리
router.post('/products/detail/:id', function(req,res){
  var content= req.body.content;
  db.query('insert into comments(product_id,user_id,content)values(?,?,?) ',[req.params.id,req.user.user_id,content],function(err,results, fields) {
      if(err)res.send('err');
      else res.redirect('/admin/products/detail/'+req.params.id);
  });
});

//수정페이지
router.get('/products/edit/:id', adminRequired, csrfProtection, function(req, res){
  //기존에 페이지 value안에 값을 셋팅하기 위해
  db.query('SELECT * FROM product where product_id=? ', [req.params.id],function (err, products, fields) {
      res.render('admin/form', { product : products[0], csrfToken : req.csrfToken() });
      });
});

router.post('/products/edit/:id', adminRequired, upload.single('thumbnail'), csrfProtection,  function(req, res){
  db.query('SELECT * FROM product where product_id=? ', [req.params.id],function (err, results, fields) {
      var product = results[0];
      if(req.file && product.product_img){  //요청중에 파일이 존재 할시 이전이미지 지운다.
          fs.unlinkSync( uploadDir + '/' + product.product_img );
      }
      var post = req.body;
      var filename= (req.file) ? req.file.filename : product.product_img;
      db.query('update product set product_name=?,product_detail=?, product_img=?,product_price=? where product_id=?'
      ,[post.name,post.detail,filename,post.price,req.params.id], function (err, results) {
          if (err) res.send('err');
          else res.redirect('/admin/products/detail/' + req.params.id ); 
      });
  });
});

//상품삭제
router.get('/products/delete/:id', function(req, res){
  db.query('DELETE FROM product where product_id = ?',[req.params.id],function(err){    
      res.redirect('/admin/products');
  });
});

//댓글삭제
router.get('/comment/delete/:id', function(req, res){
  comments_id=req.params.id
  db.query('SELECT product_id FROM comments where comments_id = ?',[comments_id],function(err,id){  
      db.query('DELETE FROM comments where comments_id = ?',[comments_id],function(err){ 
          res.redirect('/admin/products/detail/'+id[0].product_id);
      });
  });
});
//주문리스트
router.get('/order', function(req,res){
   db.query('SELECT * FROM totalOrder ', function (err, orderList, fields) {
       res.render( 'admin/orderList' , 
           { orderList : orderList });
  });
});

router.get('/order/edit/:id', function(req,res){
  db.query('SELECT * FROM totalOrder where order_id=? ',[req.params.id], function (err, order, fields) {
      res.render( 'admin/orderForm' , 
          { order : order[0] }
      );
  });
});

router.post('/order/edit/:id', adminRequired, function(req,res){
  var status = req.body.status
  db.query('update totalOrder set status=?where order_id=?'
  ,[status,req.params.id], function (err, results) {
      if (err) res.send('err')
      else  res.redirect('/admin/order');
    });   
});
module.exports = router;