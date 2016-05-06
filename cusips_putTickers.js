var http = require('http');
var filingsPort = process.env.BIG_MONEY_STOCK_TRADING_PORT || process.env.PORT || 3000;

var putOptions =
{
	host: 'localhost',
	port: filingsPort,
	path: '/cusips/tickers',
	method: 'PUT'
};

var handlePutResponse = function(putResponse)
{
	var str = '';
	putResponse.on('data', function(chunk)
	{
		str += chunk;
	});
	putResponse.on('end', function()
	{
		console.log(str);
	});
	putResponse.on('error', function(e)
	{
		console.log(e);
	});
};

http.request(putOptions, function(putResponse)
{
	handlePutResponse(putResponse);
}).end();
