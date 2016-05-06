require('../models/cusipCikHoldingModel');
var http = require('http');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var CusipCikHolding = mongoose.model('CusipCikHolding');

exports.getCusips = function(req, res)
{
	var params = req.params;
	var id = params.id;
	var field = params.field;
	var order = params.order;
	if (field === "totalValueDifference")
	{
		if (order === "-")
		{
			CusipCikHolding.aggregate([
			{
				$match: { "_id.cusip": id }
			},
			{
				$sort: { "value.totalValueDifference": -1 }
			}
			],
			function(err, results)
			{
				if (err) { return console.log(err); }
				return res.json(results);
			});
		}
		else
		{
			CusipCikHolding.aggregate([
			{
				$match: { "_id.cusip": id }
			},
			{
				$sort: { "value.totalValueDifference": 1 }
			}
			],
			function(err, results)
			{
				if (err) { return console.log(err); }
				return res.json(results);
			});
		}
	}
	else if (field === "currentValue")
	{
		CusipCikHolding.aggregate([
		{
			$match: { "_id.cusip": id }
		},
		{
			$sort: { "value.currentValue": -1 }
		}
		],
		function(err, results)
		{
			if (err) { return console.log(err); }
			return res.json(results);
		});
	}
	else if (field === "previousValue")
	{
		CusipCikHolding.aggregate([
		{
			$match: { "_id.cusip": id }
		},
		{
			$sort: { "value.currentValue": 1 }
		}
		],
		function(err, results)
		{
			if (err) { return console.log(err); }
			return res.json(results);
		});
	}
};

exports.postCusips = function(req, res)
{
	var o = {};
	o.map = function()
	{
		var _id = this._id;
		emit(
		{
			cusip: _id.cusip
		},
		{
			nameOfIssuer: null,
			nameOfIssuerLC: null,
			ticker: null
		});
	};
	o.reduce = function(keys, values)
	{
		var length = values.length;
		var reducedValueNameOfIssuer = null;
		var reducedValueNameOfIssuerLC = null;
		var reducedValueTicker = null;
		var valuesCurrentValues;
		var valuesCurrentNameOfIssuer;
		var valuesCurrentNameOfIssuerLC;
		var valuesCurrentTicker;
		for (var i = 0; i < length; i++)
		{
			valuesCurrentValues = values[i];
			valuesCurrentNameOfIssuer = valuesCurrentValues.nameOfIssuer;
			valuesCurrentNameOfIssuerLC = valuesCurrentValues.nameOfIssuerLC;
			valuesCurrentTicker = valuesCurrentValues.ticker;
			if (reducedValueNameOfIssuerLC === null ||
				(valuesCurrentNameOfIssuerLC !== null &&
				reducedValueNameOfIssuerLC !== null && valuesCurrentNameOfIssuerLC > reducedValueNameOfIssuerLC))
			{
				reducedValueNameOfIssuerLC = valuesCurrentNameOfIssuerLC;
			}
			if (reducedValueNameOfIssuer === null ||
				(valuesCurrentNameOfIssuer !== null &&
				reducedValueNameOfIssuer !== null && valuesCurrentNameOfIssuer > reducedValueNameOfIssuer))
			{
				reducedValueNameOfIssuer = valuesCurrentNameOfIssuer;
			}
			if (reducedValueTicker === null ||
				(valuesCurrentTicker !== null &&
				reducedValueTicker !== null && valuesCurrentTicker > reducedValueTicker))
			{
				reducedValueTicker = valuesCurrentTicker;
			}
		}
		var reducedValue =
		{
			nameOfIssuer: reducedValueNameOfIssuer,
			nameOfIssuerLC: reducedValueNameOfIssuerLC,
			ticker: reducedValueTicker
		};
		return reducedValue;
	};
	o.out = {reduce: "cusips"};
	o.query = {};
	res.json({}).end();
	CusipCikHolding.mapReduce(o, function(err, results)
	{
		if (err) { return console.log(err); }
	}).then(function(results, stats)
	{
		console.log(stats);
	});
};

exports.postHoldings = function(req, res)
{
	res.json({}).end();
	var o = {};
	o.map = function()
	{
		var _id = this._id;
		var value = this.value;
		emit(
		{
			cusip: _id.cusip
		},
		{
			nameOfIssuer: value.nameOfIssuer,
			nameOfIssuerLC: value.nameOfIssuerLC,
			titleOfClass: value.titleOfClass,
			totalCurrentValue: value.currentValue,
			// @@@ totalCurrentSshPrnamt: value.currentSshPrnamt,
			totalPreviousValue: value.previousValue,
			// @@@ totalPreviousSshPrnamt: value.previousSshPrnamt,
			totalCurrentFilings: 1,
			totalPreviousFilings: value.previousValue === null ? 0 : 1
		});
	};
	o.reduce = function(keys, values)
	{
		var length = values.length;
		var reducedValueMaxCurrentValue = null;
		var reducedValueNameOfIssuer = null;
		var reducedValueNameOfIssuerLC = null;
		var reducedValueTitleOfClass = null;
		var reducedValueTotalCurrentValue = 0;
		// @@@ var reducedValueTotalCurrentSshPrnamt = 0;
		var reducedValueTotalPreviousValue = 0;
		// @@@ var reducedValueTotalPreviousSshPrnamt = 0;
		var reducedValueTotalCurrentFilings = 0;
		var reducedValueTotalPreviousFilings = 0;
		var valuesCurrentValues;
		var valuesCurrentMaxCurrentValue;
		var valuesCurrentValuesTotalPreviousValue;
		// @@@ var valuesCurrentValuesTotalPreviousSshPrnamt;
		for (var i = 0; i < length; i++)
		{
			valuesCurrentValues = values[i];
			valuesCurrentMaxCurrentValue = valuesCurrentValues.maxCurrentValue;
			valuesCurrentValuesTotalPreviousValue = valuesCurrentValues.totalPreviousValue;
			// @@@ valuesCurrentValuesTotalPreviousSshPrnamt = valuesCurrentValues.totalPreviousSshPrnamt;
			if (reducedValueMaxCurrentValue === null || 
				(reducedValueMaxCurrentValue !== null &&
				valuesCurrentMaxCurrentValue !== null &&
				valuesCurrentMaxCurrentValue > reducedValueMaxCurrentValue))
			{
				reducedValueNameOfIssuer = valuesCurrentValues.nameOfIssuer;
				reducedValueNameOfIssuerLC = valuesCurrentValues.nameOfIssuerLC;
				reducedValueTitleOfClass = valuesCurrentValues.titleOfClass;
				reducedValueMaxCurrentValue = valuesCurrentMaxCurrentValue;
			}
			reducedValueTotalCurrentValue += valuesCurrentValues.totalCurrentValue;
			// @@@ reducedValueTotalCurrentSshPrnamt += valuesCurrentValues.totalCurrentSshPrnamt;
			if (valuesCurrentValuesTotalPreviousValue === null)
			{
				reducedValueTotalPreviousValue += 0;
			}
			else
			{
				reducedValueTotalPreviousValue += valuesCurrentValuesTotalPreviousValue;
			}
			/* @@@
			if (valuesCurrentValuesTotalPreviousSshPrnamt === null)
			{
				reducedValueTotalPreviousSshPrnamt += 0;
			}
			else
			{
				reducedValueTotalPreviousSshPrnamt += valuesCurrentValuesTotalPreviousSshPrnamt;
			}
			*/
			reducedValueTotalCurrentFilings += valuesCurrentValues.totalCurrentFilings;
			reducedValueTotalPreviousFilings += valuesCurrentValues.totalPreviousFilings;
		}
		var reducedValue =
		{
			nameOfIssuer: reducedValueNameOfIssuer,
			nameOfIssuerLC: reducedValueNameOfIssuerLC,
			titleOfClass: reducedValueTitleOfClass,
			totalCurrentValue: reducedValueTotalCurrentValue,
			// @@@ totalCurrentSshPrnamt: reducedValueTotalCurrentSshPrnamt,
			totalPreviousValue : reducedValueTotalPreviousValue,
			// @@@ totalPreviousSshPrnamt: reducedValueTotalPreviousSshPrnamt,
			totalCurrentFilings: reducedValueTotalCurrentFilings,
			totalPreviousFilings: reducedValueTotalPreviousFilings
		};
		return reducedValue;
	};
	o.out = {replace: "holdings"};
	o.query = {};
	res.json({}).end();
	CusipCikHolding.mapReduce(o, function(err, results)
	{
		if (err) { return console.log(err); }
	}).then(function(results, stats)
	{
		console.log(stats);
	});
};
