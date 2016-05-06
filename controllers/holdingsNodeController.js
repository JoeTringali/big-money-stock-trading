var http = require('http');
var mongoose = require('mongoose');
var Holding = mongoose.model('Holding');
var util = require('util');
var TICKER_SEARCH_STRING = "/webxpress/get_quote?QUOTE_TYPE=&SID_VALUE_ID=";
var TICKER_SEARCH_STRING_LENGTH = TICKER_SEARCH_STRING.length;

exports.getHoldings = function(req, res)
{
	var params = req.params;
	var field = params.field;
	var order = params.order;
	var sortClause = order + field;
	var query;
	if (field === "totalSshPrnamtDifference" || field === "totalValueDifference")
	{
		if (order === "-")
		{
			query = Holding.find(
			{
				"value.totalValueDifference": { $gt: 0 }
			}).sort({"value.totalValueDifference": -1});
		}
		else
		{
			query = Holding.find(
			{
				"value.totalValueDifference": { $lt: 0 }
			}).sort({"value.totalValueDifference": 1});
		}
	}
	else if (field === "totalCurrentSshPrnamt" || field === "totalCurrentValue")
	{
		query = Holding.find({}).sort({"value.totalCurrentValue": -1});
	}
	query.limit(100).exec(function(err, holdings)
	{
		if (!err)
		{
			res.json(holdings);
		}
	});
};

exports.put = function(req, res)
{
	res.json({}).end();
	var saveHolding = function(holding, callback)
	{
		var options = [];
		var holdingValue = holding.value;
		Holding.findOneAndUpdate(
		{
			"_id.cusip": holding._id.cusip,
		},
		{
			$set:
			{
				"value.totalValueDifference": holdingValue.totalCurrentValue - holdingValue.totalPreviousValue,
				// @@@ "value.totalSshPrnamtDifference": holdingValue.totalCurrentSshPrnamt - holdingValue.totalPreviousSshPrnamt,
				"value.totalFilingsDifference": holdingValue.totalCurrentFilings - holdingValue.totalPreviousFilings
			}
		},
		options,
		function(err, results)
		{
			process.nextTick(function()
			{
				callback();
			});
		});
	};

	var saveHoldings = function(holdings)
	{
		var holding;
		if (holdings.length > 0)
		{
			holding = holdings.pop();
			saveHolding(holding, function()
			{
				saveHoldings(holdings);
			});
		}
		else
		{
			console.log("Holdings updated");

		}
	};
	
	Holding.find({ totalValueDifference: { $exists: false } }).exec(function(err, holdings)
	{
		saveHoldings(holdings);
	});
};

exports.getTotals = function(req, res)
{
	Holding.aggregate([
		{ $group:
			{
				_id:
				{
					cusips: "all"
				},
				totalCurrentValue: { $sum: "$value.totalCurrentValue" },
				// @@@ totalCurrentSshPrnamt: { $sum: "$value.totalCurrentSshPrnamt" },
				totalPreviousValue: { $sum: "$value.totalPreviousValue" },
				// @@@ totalPreviousSshPrnamt: { $sum: "$value.totalPreviousSshPrnamt" },
				totalValueDifference: { $sum: "$value.totalValueDifference" },
				// @@@ totalSshPrnamtDifference: { $sum: "$value.totalSshPrnamtDifference" }
			}
		}],
		function(err, results)
		{
			if (err) { return console.log(err); }
			res.json(results);
		});
};
