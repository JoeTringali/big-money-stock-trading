(function()
{
	var app = angular.module("BigMoneyStockTrading");
	
	var cusipController = function($scope, $routeParams, services)
	{
		$scope.orderByField = "value." + $routeParams.field;
		if ($routeParams.order === "-")
		{
			$scope.reverseSort = true;			
		}
		else
		{
			$scope.reverseSort = false;			
		}
		$scope.activeView = "";
		$scope.page = 1;false
		$scope.setPage = function(p)
		{
			$scope.page = p;
		};
		var rowsPerPage = 100;
		$scope.rowsPerPage = rowsPerPage;
		$scope.Math = window.Math;
				
		var onCusip = function(data)
		{
			var filers = data;
			$scope.filers = filers;
			var cusip = filers[0];
			$scope.cusip = cusip;
			var rowCount = filers.length;
			$scope.rowCount = rowCount;
			var pageCount = -1 * (Math.floor(-1 * rowCount / rowsPerPage));
			$scope.pageCount = pageCount;
			var pageRange = [];
			for (var i = 0; i < pageCount; i++)
			{
				pageRange.push(i + 1);
			}
			$scope.pageRange = pageRange;
		};
		
		var onError = function(response)
		{
			$scope.error = response;
		};
		
		services.getCusip($routeParams.id, $routeParams.field, $routeParams.order)
			.then(onCusip, onError);
	
	};
	app.controller('cusipController', cusipController);
}());
