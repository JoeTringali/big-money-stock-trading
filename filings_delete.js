var http = require('http');
var filingsPort = process.env.BIG_MONEY_STOCK_TRADING_PORT || process.env.PORT || 3000;

var deleteOptions =
{
	host: 'localhost',
	port: filingsPort,
	path: '/filings',
	method: 'DELETE'
};

var handleDeleteResponse = function(deleteResponse)
{
	var str = '';
	deleteResponse.on('data', function(chunk)
	{
		str += chunk;
	});
	deleteResponse.on('end', function()
	{
		console.log(str);
	});
};

http.request(deleteOptions, function(deleteResponse)
{
	handleDeleteResponse(deleteResponse);
}).end();