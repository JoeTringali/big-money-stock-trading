(function()
{
	var services = function($http)
	{
		var getHottest = function()
		{
			return $http.get("/holdings/totalValueDifference/-")
						.then(function(response)
						{
							return response.data;
						});
		};
		var getColdest = function()
		{
			return $http.get("/holdings/totalValueDifference/+")
						.then(function(response)
						{
							return response.data;
						});
		};
		var getConsensus = function()
		{
			return $http.get("/holdings/totalCurrentValue/-")
						.then(function(response)
						{
							return response.data;
						});
		};
		var getTotals = function()
		{
			return $http.get("/holdings/totals")
						.then(function(response)
						{
							return response.data;
						});
		};
		var getFilers = function()
		{
			return $http.get("/filings/filers")
			.then(function(response)
					{
						return response.data;
					});
		};
		var getFiler = function(id)
		{
			return $http.get("/filings/filers/" + id)
			.then(function(response)
					{
						return response.data;
					});
		};
		var getCusip = function(id, field, order)
		{
			return $http.get("/cusipcikholdings/cusips/" + id + "/" + field + "/" + order)
			.then(function(response)
					{
						return response.data;
					});
		};
		return {
			getHottest: getHottest,
			getColdest: getColdest,
			getConsensus: getConsensus,
			getTotals: getTotals,
			getFilers: getFilers,
			getFiler: getFiler,
			getCusip: getCusip
		};
	};
	
	var module = angular.module("BigMoneyStockTrading");
	module.factory("services", services);
}());