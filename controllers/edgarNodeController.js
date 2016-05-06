require('../models/filingModel');
var http = require('http');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var InfoTable = mongoose.model('InfoTable');
var Filing = mongoose.model('Filing');
var url = require('url');
var util = require('util');

var parseFiling = function(req, res, edgarResponse)
{
	var str = '';
	edgarResponse.on('data', function(chunk)
	{
		str += chunk;
	});
	
	edgarResponse.on('end', function()
	{
		var $ = cheerio.load(str);
		var newInfoTables = [];
		var infoTable;
		var element;
		var tableValueSumAsInt = 0;
		$('infoTable, ns1\\:infoTable').each(function()
		{
			element = $(this);
			var shrsOrPrnAmtElement = element.children('shrsOrPrnAmt, ns1\\:shrsOrPrnAmt').first();
			/* @@@ var votingAuthority = element.children('votingAuthority, ns1\\:votingAuthority').first(); */
			var nameOfIssuerElement = element.children('nameOfIssuer, ns1\\:nameOfIssuer').first();
			var valueAsInt = parseInt(element.children('value, ns1\\:value').first().text(), 10);
			tableValueSumAsInt += valueAsInt;
			infoTable = new InfoTable(
			{
					nameOfIssuer: nameOfIssuerElement.text().trim(),
					nameOfIssuerLC: nameOfIssuerElement.text().toLowerCase().trim(),
					titleOfClass: element.children('titleOfClass, ns1\\:titleOfClass').first().text(),
					cusip: element.children('cusip, ns1\\:cusip').first().text().toUpperCase(),
					value: valueAsInt
					/* @@@ ,
					shrsOrPrnAmt:
					{
						sshPrnamt: parseInt(shrsOrPrnAmtElement.children('sshPrnamt, ns1\\:sshPrnamt').first().text(), 10),
						sshPrnamtType: shrsOrPrnAmtElement.children('sshPrnamtType, ns1\\:sshPrnamtType').first().text()
					},
					investmentDiscretion: element.children('investmentDiscretion, ns1\\:investmentDiscretion').first().text(),
					votingAuthority:
					{
						Sole: parseInt(votingAuthority.children('Sole, ns1\\:Sole').first().text(), 10),
						Shared: parseInt(votingAuthority.children('Shared, ns1\\:Shared').first().text(), 10),
						None: parseInt(votingAuthority.children('None, ns1\\:None').first().text(), 10)
					} */
			});
			newInfoTables.push(infoTable);
		});
		var tableValueTotalAsInt = parseInt($('tableValueTotal, ns1\\:tableValueTotal').first().text(),10);
		if (isNaN(tableValueTotalAsInt))
		{
			tableValueTotalAsInt = 0;
		}
		var reportCalendarOrQuarterAsText = $('reportCalendarOrQuarter, ns1\\:reportCalendarOrQuarter').first().text();
		var dateParts = reportCalendarOrQuarterAsText.split("-");
		var reportCalendarOrQuarterAsDate = new Date(dateParts[2], parseInt(dateParts[0], 10) - 1, dateParts[1]);
		var periodOfReportAsText = $('periodOfReport, ns1\\:periodOfReport').first().text();
		dateParts = periodOfReportAsText.split("-");
		var periodOfReportAsDate = new Date(dateParts[2], parseInt(dateParts[0], 10) - 1, dateParts[1]);
		var filingManagerElement = $('filingManager, ns1\\:filingManager').first();
		var nameElement = filingManagerElement.children('name, ns1\\:name').first();
		var addressElement = filingManagerElement.children('address, ns1\\:address');
		var filing = new Filing(
		{
			url: req.query.id,
			submissionType: $('submissionType, ns1\\:submissionType').first().text(),
			cik: $('cik, ns1\\:cik').first().text().toUpperCase(),
			periodOfReport: periodOfReportAsDate,
			reportCalendarOrQuarter: reportCalendarOrQuarterAsDate,
			filingManager:
			{
				name: nameElement.text().trim(),
				nameLC: nameElement.text().toLowerCase().trim(),
				address:
				{
					street1: addressElement.children('ns1\\:street1, street1, com\\:street1').first().text(),
					street2: addressElement.children('ns1\\:street2, street2, com\\:street2').first().text(),
					city: addressElement.children('ns1\\:city, city, com\\:city').first().text(),
					stateOrCountry: addressElement.children('ns1\\:stateOrCountry, stateOrCountry, com\\:stateOrCountry').first().text(),
					zipCode: addressElement.children('ns1\\:zipCode, zipCode, com\\:zipCode').first().text()
				}
			},
			form13FFileNumber: $('form13FFileNumber, ns1\\:form13FFileNumber').first().text(),
			tableValueTotal : tableValueTotalAsInt,
			tableValueSum : tableValueSumAsInt,
			informationTable:
			{
				infoTable: newInfoTables
			}
		});
		if (tableValueSumAsInt > (500 * filing.tableValueTotal))
		{
			var filingInfoTable = filing.informationTable.infoTable;
			var length = filingInfoTable.length;
			var filingInfoTableEntry;
			for (var i = 0; i < length; i++)
			{
				filingInfoTableEntry = filingInfoTable[i];
				filingInfoTableEntry.value = Math.round(filingInfoTableEntry.value / 1000);
			}
		}
		res.json( filing );
	});
};

var parseFilings = function(req, res, edgarResponse)
{
	var str = '';
	edgarResponse.on('data', function(chunk)
	{
		str += chunk;
	});
	
	edgarResponse.on('end', function()
	{
		var filings = [];
		var $ = cheerio.load(str);
		var entry;
		var href;
		var pos;
		$('entry').each(function()
		{
			entry = $(this);
			href = entry.find('link').attr('href');
			pos = href.lastIndexOf("-index.htm");
			if (pos > -1)
			{
				filings.push({ url: href.substring(0, pos) + ".txt" });
			}
		});
		res.json( filings );
	});
};

exports.getFilings = function(req, res)
{
	var id = req.query.id;
	if (typeof(id) === "undefined")
	{
		var filingsOptions =
		{
			host: 'www.sec.gov',
			path: '/cgi-bin/browse-edgar?action=getcurrent&type=13F&company=&dateb=&owner=include&start=0&count=100&output=atom'
		};
		http.request(filingsOptions, function(edgarResponse)
		{
			parseFilings(req, res, edgarResponse);
		}).end();
	}
	else
	{
		var parsedUrl = url.parse(id);
		var filingOptions =
		{
			host: parsedUrl.host,
			path: parsedUrl.pathname
		};
		http.request(filingOptions, function(edgarResponse)
		{
			parseFiling(req, res, edgarResponse);
		}).end();
	}
};

exports.postFilings = function(req, res)
{
	var newFilings = [];
	var addedFilings = [];
	var saveFiling = function(filing, callback)
	{
		var newFiling = new Filing({ url: filing.url });
		newFiling.save(function(err, results)
		{
			if (!err)
			{
				addedFilings.push(newFiling);
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
			res.json(addedFilings);
		}
	};
	
	var findFiling = function(filing, callback)
	{
		Filing.findOne({ url: filing.url },function(err, dbFiling)
		{
			if (!dbFiling)
			{
				newFilings.push(filing);
			}
			process.nextTick(function()
			{
				callback();
			});
		});
	};
	
	var findFilings = function(filings)
	{
		var filing;
		if (filings.length > 0)
		{
			filing = filings.pop();
			findFiling(filing, function()
			{
				findFilings(filings);
			});
		}
		else
		{
			saveFilings(newFilings);
		}
	};
	
	var handleGetResponse = function(getResponse)
	{
		var str = '';
		getResponse.on('data', function(chunk)
		{
			str += chunk;
		});
		getResponse.on('end', function()
		{
			var filings = JSON.parse(str);
			findFilings(filings);
		});
	};

	var getOptions =
	{
		host: 'localhost',
		port: process.env.BIG_MONEY_STOCK_TRADING_PROXY_PORT,
		path: '/edgar/filings',
		method: 'GET'
	};

	http.request(getOptions, function(getResponse)
	{
		handleGetResponse(getResponse);
	}).end();
};


exports.postFilingsBatch = function(req, res)
{
	var newFilings = [];
	var addedFilings = [];

	var saveFiling = function(filing, callback)
	{
		var newFiling = new Filing({ url: filing.url });
		newFiling.save(function(err, results)
		{
			if (!err)
			{
				addedFilings.push(newFiling);
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
			res.json(addedFilings);
		}
	};
	
	var findFiling = function(filing, callback)
	{
		Filing.findOne({ url: filing.url },function(err, dbFiling)
		{
			if (!dbFiling)
			{
				newFilings.push(filing);
			}
			process.nextTick(function()
			{
				callback();
			});
		});
	};
	
	var findFilings = function(filings)
	{
		var filing;
		if (filings.length > 0)
		{
			filing = filings.pop();
			findFiling(filing, function()
			{
				findFilings(filings);
			});
		}
		else
		{
			saveFilings(newFilings);
		}
	};

	var filings = [];
	var body = req.body;
	var bodyLength = body.length;
	var newFiling;
	for (var i = 0; i < bodyLength; i++)
	{
		newFiling = new Filing({ url: body[i].url });
		filings.push(newFiling);
	}
	findFilings(filings);
};

exports.putFilings = function(req, res)
{
	var newFilings = [];
	var updatedFilings = [];

	var saveFiling = function(filing, callback)
	{
		var options = [];
		Filing.findOneAndUpdate(
		{
			url: filing.url,
		},
		{
			$set:
			{
				submissionType: filing.submissionType,
				cik: filing.cik.toUpperCase(),
				periodOfReport: filing.periodOfReport,
				reportCalendarOrQuarter: filing.reportCalendarOrQuarter,
				filingManager: filing.filingManager,
				form13FFileNumber: filing.form13FFileNumber,
				tableValueTotal: filing.tableValueTotal,
				informationTable: filing.informationTable
			}
		},
		options,
		function(err, results)
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
			res.json(updatedFilings);
		}
	};
	
	var findFiling = function(filing, callback)
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
				var filing = JSON.parse(str);
				newFilings.push(filing);
				process.nextTick(function()
				{
					callback();
				});
			});
		};

		var getOptions =
		{
			host: 'localhost',
			port: process.env.BIG_MONEY_STOCK_TRADING_PROXY_PORT,
			path: util.format('/edgar/filings?id=%s', filing.url),
			method: 'GET'
		};

		http.request(getOptions, function(getResponse)
		{
			handleGetResponse(getResponse);
		}).end();
	};

	var findFilings = function(filings)
	{
		var filing;
		if (filings.length > 0)
		{
			filing = filings.pop();
			findFiling(filing, function()
			{
				findFilings(filings);
			});
		}
		else
		{
			saveFilings(newFilings);
		}
	};
	
	Filing.find({ cik: { $exists: false } }).limit(10).exec(function(err, dbFilings)
	{
		findFilings(dbFilings);
	});

};
