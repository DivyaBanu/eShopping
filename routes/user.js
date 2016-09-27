var routes = require('express').Router();
var  User = require('../models/user');
var passport = require('passport');
var passportConf = require('../config/passport');
var Cart= require('../models/cart');
var async = require('async');

routes.get("/login",function(req,res){
  res.render('accounts/login',{message:req.flash('loginMessage')});
});

routes.post('/login',passport.authenticate('local-login',{

  successRedirect:'/profile',
  failureRedirect:'/login',
  failureFlash:true
}));

routes.get('/profile',function(req,res,next){
  User.findById({_id:req.user._id},function(err,user){
    if(err)return next(err);
    res.render('accounts/profile',{user:user})
  });
});

routes.get("/logout",function(req,res){
  if(req.user) return res.redirect('/profile');
  req.logout();
  res.redirect("/");
})

routes.get("/signup",function(req,res){
  res.render('accounts/signup',{
    errors: req.flash('errors')
  });

});
routes.post("/signup",function(req,res,next){
async.waterfall([

  function(callback){

    var user = new User();
    user.profile.name=req.body.name;
    user.email=req.body.email;
    user.password=req.body.password;
    user.profile.picture = user.gravatar();
    User.findOne({email:req.body.email},function(err,existingUser){
      if(existingUser){
        req.flash('errors','User already exists');
        return res.redirect('/signup');
      }
      else{
        user.save(function(err,user){
          if(err) return next(err);
          callback(null,user);
});
}
});
  },

  function(user){
    var cart = new Cart();
    cart.owner = user._id;
    cart.save(function(err){
      if(err)return next(err);
      req.login(user,function(err){
        if(err) return nect(err);
        res.redirect('/profile');

    });
  });
  }
]);
});

routes.get("/updateProfile",function(req,res){
  res.render('accounts/updateProfile',{message:req.flash('success')});
});

routes.post("/updateProfile",function(req,res,next){
  User.findOne({_id:req.user._id},function(err,user){
    if(err) return next(err);

    if(req.body.name) user.profile.name = req.body.name;
    if(req.body.address) user.address = req.body.address;

    user.save(function(err){
      if(err)return next(err);
      req.flash('success','User Profile updated successfully');
      return res.redirect('/profile');
    });
  });
});

module.exports = routes;
