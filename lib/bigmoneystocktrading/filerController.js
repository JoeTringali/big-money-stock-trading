(function()
{
	var app = angular.module("BigMoneyStockTrading");
	
	var filerController = function($scope, $routeParams, services)
	{
		$scope.orderByField = "value";
		$scope.reverseSort = true;
		$scope.activeView = "";
		$scope.page = 1;
		$scope.setPage = function(p)
		{
			$scope.page = p;
		};
		var rowsPerPage = 100;
		$scope.rowsPerPage = rowsPerPage;
		$scope.Math = window.Math;
				
		var onFiler = function(data)
		{
			var filer = data[0];
			$scope.filer = filer;
			var rowCount = filer.informationTable.infoTable.length;
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
		
		services.getFiler($routeParams.id)
			.then(onFiler, onError);
	
	};
	app.controller('filerController', filerController);
}());
