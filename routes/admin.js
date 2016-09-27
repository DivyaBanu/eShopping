var routes = require('express').Router();
var Category = require('../models/category');

routes.get("/addCategory",function(req,res){
  res.render("admin/addCategory",{message:req.flash('success')});
});

routes.post("/addCategory",function(req,res,next){
  var category = new Category();
  category.name = req.body.name;
  category.save(function(err){
    if(err) return next(err);
    req.flash('success','Category added successfully');
    res.redirect('/addCategory');
  });
});

module.exports = routes;
