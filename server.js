var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('express-flash');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var ejs = require('ejs');
var engine = require('ejs-mate');
var config = require('./config/config');
var User = require('./models/user');
var mainRoutes = require('./routes/main');
var useRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');
var Category = require('./models/category');
var apiRoutes = require('./api/api');
var cartLen = require('./middlewares/middleware');

var app = express();





mongoose.connect(config.database,function(err){
  if(err){
  console.log(err);
} else{
  console.log('connected to database');
}

});

app.use(express.static(__dirname +'/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
  resave:true,
  saveUninitialized:true,
  secret:config.secretKey,
  store:new MongoStore({url:config.database, autoReconnect:true})
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(cartLen);

app.use(function(req,res,next){
  res.locals.user = req.user;
  next();
})

app.use(function(req,res,next){
  Category.find({},function(err,categories){
    if(err) return next(err);
    res.locals.categories = categories;
    next();
  });
});
app.engine('ejs',engine);
app.set('view engine','ejs');
app.use(mainRoutes);
app.use(useRoutes);
app.use(adminRoutes);
app.use('/api',apiRoutes);



app.listen(config.port,function(err){
  if(err) throw error;
  console.log('Invalid Port'+config.port);
});
