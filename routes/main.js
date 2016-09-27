var routes = require('express').Router();
var Product = require('../models/product');
var Cart = require('../models/cart');
var stripe  = require('stripe')('sk_test_JUNakoTDu8G9Pqbpbg9GMBFF');

function pagination(req,res,next){
  var perPage = 9;
  var page = req.params.page;

  Product.find()
  .skip(perPage * page)
  .limit(perPage)
  .populate('category')
  .exec(function(err,products){
    Product.count().exec(function(err,count){
      if(err) return next(err);
      res.render('main/productMain',{products:products,
      pages:count/perPage});
    });
  });
}


Product.createMapping(function(err,mapping){
  if(err){
    console.log("error creating Mapping");
    console.log(err);
  }else{
    console.log("Mapping Created");
    console.log(mapping);
  }
});

var stream = Product.synchronize();
var count = 0;

stream.on('data',function(){
  count++;
});

stream.on('close',function(){
  console.log("Indexed" + count + "documents");
});

stream.on('error',function(err){
  console.log(err);
});

routes.get('/cart',function(req,res,next){
  Cart
  .findOne({owner:req.user._id})
  .populate('items.item')
  .exec(function(err,foundCart){
    if(err) return next(err);

    res.render('main/cart',{
      foundCart:foundCart,
      message: req.flash('remove')
    });
  });
});


routes.post('/remove',function(req,res,next){
  Cart
  .findOne({owner:req.user._id},function(err,foundCart){
    foundCart.items.pull(String(req.body.item));

    foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
    foundCart.save(function(err,Cart){
      if(err) return next(err);
      req.flash('remove',"Successfully removed from cart");
      res.redirect('/cart');
    });
  });
});


routes.post('/search',function(req,res){
  res.redirect('/search/?q='+req.body.q);

});

routes.get('/search',function(req,res,next){
  if(req.query.q){
    Product.search({
      query_string:{query:req.query.q}
    },
    function(err,result){
        if(err) return next(err);
        var data = result.hits.hits.map(function(hit){
          return hit;

        });
        res.render('main/searchResult',{
          query:req.query.q,
          data:data
        });
    });
  }
});


routes.get('/',function(req,res,next){
  if(req.user){
    pagination(req,res,next);
  }else{
    res.render('main/home');
  }

});

routes.get('/page/:page',function(req,res,next){
  pagination(req,res,next);
})


routes.get('/products/:id',function(req,res,next){
  Product
  .find({category:req.params.id})
  .populate('category')
  .exec(function(err,products){
    if(err) return next(err);
    res.render('main/category',{products:products});
  });
});

routes.get('/product/:id',function(req,res,next){
  Product.findOne({_id:req.params.id},function(err,product){
    if(err) return next(err);
    res.render('main/product',{product:product});
  });

});

routes.post('/product/:product_id',function(req,res,next){
  Cart.findOne({owner:req.user.id},function(err,cart){
    cart.items.push({
      item:req.body.product_id,
      price:parseFloat(req.body.priceValue),
      quantity:parseInt(req.body.quantity)
    });

    cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);

    cart.save(function(err){
      if(err) return next(err);
      return res.redirect('/cart');
    });

  });
});

routes.post('/payment',function(req,res,next){
  var stripeToken = req.body.stripeToken;
  var currentCharges = Math.round(req.body.stripeMoney * 100);
  stripe.customers.create({
    source:stripeToken,
  }).then(function(customer){
    return stripe.charges.create({
      amount:currentCharges,
      currency:'usd',
      customer:customer.id
    });

  });
});
module.exports = routes;
