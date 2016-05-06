var http = require('http');
var filingsPort = process.env.BIG_MONEY_STOCK_TRADING_PORT || process.env.PORT || 3000;

var postOptions =
{
	host: 'localhost',
	port: filingsPort,
	path: '/edgar/filings',
	method: 'POST'
};

var handlePostResponse = function(postResponse)
{
	var str = '';
	postResponse.on('data', function(chunk)
	{
		str += chunk;
	});
	postResponse.on('end', function()
	{
		console.log(str);
	});
};

http.request(postOptions, function(postResponse)
{
	handlePostResponse(postResponse);
}).end();
