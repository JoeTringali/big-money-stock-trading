
/**
 * Module dependencies.
 */

var express = require('express')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , user = require('./routes/user')
  , tests = require('./routes/tests')
  , cusipCikHoldings = require('./controllers/cusipCikHoldingsNodeController')
  , edgar = require('./controllers/edgarNodeController')
  , filings = require('./controllers/filingsNodeController')
  , cusips = require('./controllers/cusipsNodeController')
  , holdings = require('./controllers/holdingsNodeController')
  , http = require('http')
  , path = require('path');

var db = mongoose.connect(process.env.BIG_MONEY_STOCK_TRADING_MONGODB_SERVER+"dbBigMoneyStockTrading");
require('./models/cusipCikHoldingModel');
require('./models/filingModel');
require('./models/holdingModel');
require('./models/cusipModel');

var seo = require('seo');

var app = express();
	 
// all environments
app.set('port', process.env.BIG_MONEY_STOCK_TRADING_PORT || process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/lib', express.static(path.join(__dirname, 'lib')));

app.use(new seo({
	cacheDirectory: path.resolve(process.cwd(), '.seo-cache'),
	routes: require('./routes/seo-routes'),
	requestURL: 'http://www.bigmoneystocktrading.com'
}).init());

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}


app.get("/bigmoneystocktrading.appcache", function(req, res)
{
	res.header("Content-Type", "text/cache-manifest");
	res.end("CACHE MANIFEST");
});
app.get('/about/:activeView', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.redirect("/#" + req.url);
});
app.get('/main/:activeView', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.redirect("/#" + req.url);
});
app.get('/filerView/:id', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.redirect("/#" + req.url);
});
app.get('/cusipView/:id/:field/:order', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.redirect("/#" + req.url);
});
app.get('/', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendfile('./public/index.html', { root: __dirname });
});
app.get('/users', user.list);
app.get('/edgar/filings', edgar.getFilings);
app.post('/edgar/filings', edgar.postFilings);
app.post('/edgar/filings/batch', edgar.postFilingsBatch);
app.put('/edgar/filings', edgar.putFilings);
app.get('/filings', filings.getFilings);
app.del('/filings', filings.deleteFilings);
app.put('/filings', filings.put);
app.get('/filings/filers', filings.getFilers);
app.get('/filings/filers/:id', filings.getFilers);
app.post('/filings/cusipcikholdings', filings.postCusipCikHoldings);
app.post('/cusipcikholdings/cusips', cusipCikHoldings.postCusips);
app.post('/cusipcikholdings/holdings', cusipCikHoldings.postHoldings);
app.get('/cusipcikholdings/cusips/:id/:field/:order', cusipCikHoldings.getCusips);
app.put('/cusips/tickers', cusips.putTickers);
app.get('/holdings/:field/:order', holdings.getHoldings);
app.put('/holdings', holdings.put);
app.get('/holdings/totals', holdings.getTotals);

app.get('/tests/edgarpostfilings', tests.getedgarpostfilings);

//app.all('/*', function(req, res, next) {
//    res.sendfile('./public/index.html', { root: __dirname });
//});

function redirectUnmatched(req, res)
{
	res.redirect("/");
}

app.use(redirectUnmatched);

http.createServer(app).listen(app.get('port'), function(){
  console.log('mongoDB Server: ' + process.env.BIG_MONEY_STOCK_TRADING_MONGODB_SERVER);
  console.log('Express server listening on port ' + app.get('port'));
});

http.createServer(app).listen(process.env.BIG_MONEY_STOCK_TRADING_PROXY_PORT, function(){
  console.log('Express proxy server listening on port ' + process.env.BIG_MONEY_STOCK_TRADING_PROXY_PORT);
});
