(function()
{
	var app = angular.module("BigMoneyStockTrading");
	
	var aboutController = function($scope, $routeParams, services)
	{
		$scope.activeView = ($routeParams.activeView || "").toLowerCase();
				
		var onError = function(response)
		{
			$scope.error = response;
		};
	};
	app.controller('aboutController', aboutController);
}());
