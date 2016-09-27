var routes = require('express').Router();
var faker = require('faker');
var async = require('async');
var Category = require('../models/category');
var Product = require('../models/product');

routes.post('/search',function(req,res,next){
  console.log(req.body.search_term);
  Product.search({
    query_string:{query:req.body.search_term}
  },
  function(err,result){
  if(err) return next(err);
  res.json(result);
});
});

routes.get('/:name',function(req,res,next){
  async.waterfall([
    function(callback){
      Category.findOne({name:req.params.name},function(err,category){
        if(err) return next(err);

        callback(null,category);
      });

    },
    function(category,callback){
      for(var i=0;i<30;i++){
        var product = new Product();
        product.category = category._id;
        product.name = faker.commerce.productName();
        product.price = faker.commerce.price();
        product.image = faker.image.image();
        product.save();

      }

    }
  ]);
  res.json('success');
});

module.exports = routes;
