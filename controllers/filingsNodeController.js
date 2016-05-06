require('../models/cusipCikHoldingModel');
require('../models/holdingModel');
var http = require('http');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var Filing = mongoose.model('Filing');
var CusipCikHolding = mongoose.model('CusipCikHolding');
var Holding = mongoose.model('Holding');
var DATE_RANGE = 184 + 45;
var MAX_TABLE_VALUE_TOTAL = 2000000000;

exports.getFilings = function(req, res)
{
	var date = new Date();
	var dateOffset = (24 * 60 * 60 * 1000) * DATE_RANGE;
	date.setTime(date.getTime() - dateOffset);
	Filing.find({ periodOfReport: { $gte: date }}).sort({ periodOfReport: -1, 'filingManager.nameLC': 1 }).exec(function(err, filings)
	{
		if (err) { return console.log(err); }
		return res.json(filings);
	});
};

exports.deleteFilings = function(req, res)
{
	res.json({}).end();
	var deleteDuplicateFiling = function(filing, callback)
	{
		var filingCik = filing._id.cik;
		var filingPeriodOfReport = filing._id.periodOfReport;
		if (typeof(filingCik) !== "undefined")
		{
			Filing.remove(
					{
						cik: filingCik,
						periodOfReport: filingPeriodOfReport,
						url: {"$lt": filing.url}
					}).sort(
					{
						url: -1
					}).exec(function(err, filings)
					{
						if (err) { return console.log(err); }
						process.nextTick(function()
						{
							callback();
						});
					});			
		}
		else
		{
			process.nextTick(function()
			{
				callback();
			});
		}
	};
	var deleteDuplicateFilings = function(filings)
	{
		var filing;
		if (filings.length > 0)
		{
			filing = filings.pop();
			deleteDuplicateFiling(filing, function()
			{
				deleteDuplicateFilings(filings);
			});
		}
		else
		{
			console.log("Duplicate filings deleted");
		}
	};
	var date = new Date();
	var dateOffset = (24 * 60 * 60 * 1000) * DATE_RANGE;
	date.setTime(date.getTime() - dateOffset);
	Filing.remove({ periodOfReport: { $lt: date }}).sort({ periodOfReport: -1, 'filingManager.nameLC': 1 }).exec(function(err, filings)
	{
		if (err) { return console.log(err); }
		Filing.aggregate([
			{
				$group:
				{
					_id :
					{
						cik:"$cik",
						periodOfReport:"$periodOfReport"
					},
					duplicateCount: { $sum: 1 },
					url: { $max: "$url"}
				}
			},
			{
				$sort:
				{
					duplicateCount:-1
				}
			},
			{
				$match:
				{
					duplicateCount:
					{
						$gt:1
					}
				}
			}
		],
		function(err, filings)
		{
			if (err) { return console.log(err); }
			deleteDuplicateFilings(filings);
		});
	});
};

exports.postCusipCikHoldings = function(req, res)
{
	var o = {};
	o.map = function()
	{
		var padCusip = function(cusip)
		{
			var pad = "000000000";
			var padLength = pad.length;
			var paddedCusip;
			var length = cusip.length;
			if (length >= 9)
			{
				paddedCusip = cusip;
			}
			else
			{
				paddedCusip = pad.substring(0, padLength - length) + cusip;
			}
			return paddedCusip;
		};
		var filingManager = this.filingManager;
		var infoTable = this.informationTable.infoTable;
		var length = infoTable.length;
		var thisPeriodOfReport;
		var thisInfoTable;
		for (var i = 0; i < length; i++)
		{
			thisPeriodOfReport = this.periodOfReport;
			thisPeriodOfReport.setUTCHours(0);
			thisPeriodOfReport.setUTCMinutes(0);
			thisPeriodOfReport.setUTCSeconds(0);
			thisPeriodOfReport.setUTCMilliseconds(0);
			thisInfoTable = infoTable[i];
			emit(
				{
					cusip: padCusip(thisInfoTable.cusip),
					cik: this.cik
				},
				{
					nameOfIssuer: thisInfoTable.nameOfIssuer,
					nameOfIssuerLC: thisInfoTable.nameOfIssuerLC,
					titleOfClass: thisInfoTable.titleOfClass,
					filingManagerName: filingManager.name,
					filingManagerNameLC: filingManager.nameLC,
					currentPeriodOfReport: thisPeriodOfReport,
					currentValue: thisInfoTable.value,
					// @@@ currentSshPrnamt: thisInfoTable.shrsOrPrnAmt.sshPrnamt,
					previousPeriodOfReport: null,
					previousValue: 0,
					// @@@ previousSshPrnamt: 0,
					totalValueDifference: thisInfoTable.value,
					maxCurrentValue: Math.abs(parseInt(thisInfoTable.value))
				});
		}
	};
	o.reduce = function(keys, values)
	{
		var length = values.length;
		var reducedValueNameOfIssuer = null;
		var reducedValueNameOfIssuerLC = null;
		var reducedValueTitleOfClass = null;
		var reducedValueFilingManagerName = null;
		var reducedValueFilingManagerNameLC = null;
		var reducedValueCurrentPeriodOfReport = null;
		var reducedValuePreviousPeriodOfReport = null;
		var reducedValueCurrentValue = null;
		var reducedValueMaxCurrentValue = null;
		var reducedValuePreviousValue = null;
		// @@@ var reducedValueCurrentSshPrnamt = null;
		// @@@ var reducedValuePreviousSshPrnamt = null;
		var valuesCurrentPeriodOfReport;
		var valuesCurrentValue;
		var valuesCurrentMaxCurrentValue;
		// @@@ var valuesCurrentSshPrnamt;
		var valuesCurrentValues;
		var valuesCurrentNameOfIssuer;
		var valuesCurrentNameOfIssuerLC;
		var valuesCurrentTitleOfClass;
		var valuesCurrentFilingManagerName;
		var valuesCurrentFilingManagerNameLC;
		for (var i = 0; i < length; i++)
		{
			valuesCurrentValues = values[i];
			valuesCurrentPeriodOfReport = valuesCurrentValues.currentPeriodOfReport;
			valuesCurrentValue = valuesCurrentValues.currentValue;
			valuesCurrentMaxCurrentValue = valuesCurrentValues.maxCurrentValue;
			// @@@ valuesCurrentSshPrnamt = valuesCurrentValues.currentSshPrnamt;
			if (reducedValueCurrentPeriodOfReport === null)
			{
				reducedValueCurrentPeriodOfReport = valuesCurrentPeriodOfReport;
				reducedValueCurrentValue = valuesCurrentValue;
				// @@@ reducedValueCurrentSshPrnamt = valuesCurrentSshPrnamt;
				reducedValueMaxCurrentValue = valuesCurrentMaxCurrentValue;
			}
			else if (valuesCurrentPeriodOfReport > reducedValueCurrentPeriodOfReport)
			{
				reducedValuePreviousPeriodOfReport = reducedValueCurrentPeriodOfReport;
				reducedValuePreviousValue = reducedValueCurrentValue;
				// @@@ reducedValuePreviousSshPrnamt = reducedValueCurrentSshPrnamt;
				reducedValueCurrentPeriodOfReport = valuesCurrentPeriodOfReport;
				reducedValueCurrentValue = valuesCurrentValue;
				// @@@ reducedValueCurrentSshPrnamt = valuesCurrentSshPrnamt;
			}
			else if (valuesCurrentPeriodOfReport < reducedValueCurrentPeriodOfReport &&
					valuesCurrentPeriodOfReport > reducedValuePreviousPeriodOfReport)
			{
				reducedValuePreviousPeriodOfReport = valuesCurrentPeriodOfReport;
				reducedValuePreviousValue = valuesCurrentValue;
				// @@@ reducedValuePreviousSshPrnamt = valuesCurrentSshPrnamt;
			}
			else
			{
				reducedValueCurrentValue += valuesCurrentValue;
				// @@@ reducedValueCurrentSshPrnamt += valuesCurrentSshPrnamt;
			}
			valuesCurrentNameOfIssuer = valuesCurrentValues.nameOfIssuer;
			valuesCurrentNameOfIssuerLC = valuesCurrentValues.nameOfIssuerLC;
			valuesCurrentTitleOfClass = valuesCurrentValues.titleOfClass;
			valuesCurrentFilingManagerName = valuesCurrentValues.filingManagerName;
			valuesCurrentFilingManagerNameLC = valuesCurrentValues.filingManagerNameLC;
			if (valuesCurrentMaxCurrentValue > reducedValueMaxCurrentValue)
			{
				reducedValueMaxCurrentValue = valuesCurrentMaxCurrentValue;
			}
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
			if (reducedValueTitleOfClass === null ||
				(valuesCurrentTitleOfClass !== null &&
				reducedValueTitleOfClass !== null && valuesCurrentTitleOfClass > reducedValueTitleOfClass))
			{
				reducedValueTitleOfClass = valuesCurrentTitleOfClass;
			}
			if (reducedValueFilingManagerName === null ||
					(valuesCurrentFilingManagerName !== null &&
					reducedValueFilingManagerName !== null && valuesCurrentFilingManagerName > reducedValueFilingManagerName))
			{
				reducedValueFilingManagerName = valuesCurrentFilingManagerName;
			}
			if (reducedValueFilingManagerNameLC === null ||
					(valuesCurrentFilingManagerNameLC !== null &&
					reducedValueFilingManagerNameLC !== null && valuesCurrentFilingManagerNameLC > reducedValueFilingManagerNameLC))
			{
				reducedValueFilingManagerNameLC = valuesCurrentFilingManagerNameLC;
			}
		}
		if (reducedValuePreviousValue === null)
		{
			reducedValuePreviousValue = 0;
		}
		/* @@@
		if (reducedValuePreviousSshPrnamt === null)
		{
			reducedValuePreviousSshPrnamt = 0;
		}
		*/
		var reducedValue =
		{
			nameOfIssuer: reducedValueNameOfIssuer,
			nameOfIssuerLC: reducedValueNameOfIssuerLC,
			titleOfClass: reducedValueTitleOfClass,
			filingManagerName: reducedValueFilingManagerName,
			filingManagerNameLC: reducedValueFilingManagerNameLC,
			currentPeriodOfReport: reducedValueCurrentPeriodOfReport,
			currentValue: reducedValueCurrentValue,
			// @@@ currentSshPrnamt: reducedValueCurrentSshPrnamt,
			previousPeriodOfReport: reducedValuePreviousPeriodOfReport,
			previousValue: reducedValuePreviousValue,
			// @@@ previousSshPrnamt: reducedValuePreviousSshPrnamt,
			totalValueDifference: reducedValueCurrentValue - reducedValuePreviousValue
		};
		return reducedValue;
	};
	o.out = {replace: "cusipCikHoldings"};
	var date = new Date();
	var dateOffset = (24 * 60 * 60 * 1000) * DATE_RANGE;
	date.setTime(date.getTime() - dateOffset);
	o.query = { periodOfReport: { $gte: date } };
	res.json({}).end();
	Filing.mapReduce(o, function(err, results)
	{
		if (err) { return console.log(err); }
	}).then(function(results, stats)
	{
		console.log(stats);
	});
};


exports.getFilers = function(req, res)
{
	var id = req.params.id;
	if (typeof(id) === "undefined")
	{
		Filing.aggregate([
			{ $match: { "filingManager.nameLC": { $exists: true }, cik: { $ne: ""}, "informationTable.infoTable.cusip": { $exists: true } } },
			{ $project: { _id:0, filingManager: 1, cik:1 } },
			{
				$group:
				{
					_id:
					{
						filingManagerNameLC: "$filingManager.nameLC",
						cik: "$cik"
					},
					filingManagerName: { $max: "$filingManager.name" }
				}
			},
			{
				$sort:
				{
					"_id.filingManagerNameLC": 1
				}
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
		Filing.find({ cik : id }).sort({ periodOfReport: -1 }).limit(1).exec(function(err, results)
		{
			if (err) { return console.log(err); }
			var key = function(holding)
			{
				return holding.nameOfIssuer + "|" +
					holding.titleOfClass + "|" +
					holding.cusip; /* @@@  + "|" +
					holding.shrsOrPrnAmt.sshPrnamtType; */
			};
			var dict = {};
			var result = results[0];
			var infoTable = result.informationTable.infoTable;
			var length = infoTable.length;
			var holding;
			var dictHolding;
			var keyHolding;
			for (var i = 0; i < length; i++)
			{
				holding = infoTable[i];
				keyHolding = key(holding);
				dictHolding = dict[keyHolding];
				if (typeof(dictHolding) !== "undefined" &&
					dictHolding.nameOfIssuer === holding.nameOfIssuer &&
					dictHolding.titleOfClass === holding.titleOfClass &&
					dictHolding.cusip === holding.cusip)
				{
					dictHolding.value += holding.value;
				}
				else
				{
					dict[keyHolding] = holding;
				}
			}
			infoTable = [];
			for (var k in dict)
			{
				if (dict.hasOwnProperty(k))
				{
					infoTable.push(dict[k]);
				}
			}
			results[0].informationTable.infoTable = infoTable;
			return res.json(results);
		});
				
	}
};

exports.put = function(req, res)
{
	var updatedFilings = [];
	var saveFiling = function(filing, callback)
	{
		filing.tableValueTotal = Math.round(filing.tableValueTotal / 1000.0);
		var infoTable = filing.informationTable.infoTable;
		var length = infoTable.length;
		var value;
		var thisInfoTable;
		for (var i = 0; i < length; i++)
		{
			thisInfoTable = infoTable[i];
			thisInfoTable.value = Math.round(thisInfoTable.value / 1000.0);
		}
		filing.save(function(err, results)
		{
			if (!err)
			{
				updatedFilings.push(filing);
			}
			process.nextTick(function()
			{
				callback();
			});
		});
	};

	var saveFilings = function(filings)
	{
		var filing;
		if (filings.length > 0)
		{
			filing = filings.pop();
			saveFiling(filing, function()
			{
				saveFilings(filings);
			});
		}
		else
		{
			console.log("Filings updated");
			res.json(updatedFilings).end();
		}
	};
	
	Filing.find({ tableValueTotal: { $gt: MAX_TABLE_VALUE_TOTAL } }).exec(function(err, filings)
	{
		saveFilings(filings);
	});
};
