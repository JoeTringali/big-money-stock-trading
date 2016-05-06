require('../models/cusipModel');
var http = require('http');
var mongoose = require('mongoose');
var Cusip = mongoose.model('Cusip');
var util = require('util');
var TICKER_SEARCH_STRING = "/webxpress/get_quote?QUOTE_TYPE=&SID_VALUE_ID=";
var TICKER_SEARCH_STRING_LENGTH = TICKER_SEARCH_STRING.length;

exports.putTickers = function(req, res)
{
	var newCusips = [];
	var updatedCusips = [];

	var saveCusip = function(cusip, callback)
	{
		var options = [];
		Cusip.findOneAndUpdate(
		{
			"_id.cusip": cusip._id.cusip,
		},
		{
			$set:
			{
				"value.ticker": cusip.value.ticker
			}
		},
		options,
		function(err, results)
		{
			if (!err)
			{
				// console.log(cusip);
				updatedCusips.push(cusip);
			}
			process.nextTick(function()
			{
				callback();
			});
		});
	};

	var saveCusips = function(cusips)
	{
		var cusip;
		if (cusips.length > 0)
		{
			cusip = cusips.pop();
			saveCusip(cusip, function()
			{
				saveCusips(cusips);
			});
		}
		else
		{
			res.json(updatedCusips);
		}
	};
	
	var findTicker = function(cusip, callback)
	{
		var handleGetResponse = function(getResponse)
		{
			var str = '';
			getResponse.on('data', function(chunk)
			{
				str += chunk;
			});
			getResponse.on('end', function()
			{
				cusip.value.ticker = "";
				var start = str.indexOf(TICKER_SEARCH_STRING);
				var end;
				var ticker;
				if (start >= 0)
				{
					start += TICKER_SEARCH_STRING_LENGTH;
					end = str.indexOf('\"', start);
					if (end >= 0)
					{
						cusip.value.ticker = str.substring(start, end);
						console.log(cusip.value.ticker);
					}
				}
				newCusips.push(cusip);
				process.nextTick(function()
				{
					callback();
				});
			});
		};

		var getOptions =
		{
			host: 'quotes.fidelity.com',
			path: util.format('/mmnet/SymLookup.phtml?reqforlookup=REQUESTFORLOOKUP&productid=mmnet&isLoggedIn=mmnet&rows=50&for=stock&by=cusip&criteria=%s&submit=Search', cusip._id.cusip),
			method: 'GET'
		};

		http.request(getOptions, function(getResponse)
		{
			handleGetResponse(getResponse);
		}).end();
	};

	var findTickers = function(cusips)
	{
		var cusip;
		if (cusips.length > 0)
		{
			cusip = cusips.pop();
			findTicker(cusip, function()
			{
				findTickers(cusips);
			});
		}
		else
		{
			saveCusips(newCusips);
		}
	};
	
	Cusip.find({ "value.ticker": null }).limit(10).exec(function(err, dbCusips)
	{
		if (err) { return console.log(err); }
		findTickers(dbCusips);
		console.log("CUSIP tickers updated");
	});
};
