(function()
{
	var app = angular.module("BigMoneyStockTrading");
	
	var mainController = function($scope, $routeParams, services)
	{
		$scope.activeView = ($routeParams.activeView || "").toLowerCase();
		
		var onHottest = function(data)
		{
			$scope.hottestHoldings = data;
			var length = $scope.hottestHoldings.length;
			for (var i = 0; i < length; i++)
			{
				$scope.hottestHoldings[i].value.rank = i + 1;
			}
		};
		
		var onColdest = function(data)
		{
			$scope.coldestHoldings = data;
			var length = $scope.coldestHoldings.length;
			for (var i = 0; i < length; i++)
			{
				$scope.coldestHoldings[i].value.rank = i + 1;
			}
		};
		
		var onConsensus = function(data)
		{
			$scope.consensusHoldings = data;
			var length = $scope.consensusHoldings.length;
			for (var i = 0; i < length; i++)
			{
				$scope.consensusHoldings[i].value.rank = i + 1;
			}
		};
		
		var onTotals = function(data)
		{
			$scope.holdingsTotals = data[0];
		};
		
		var onFilers = function(data)
		{
			$scope.page = 1;
			$scope.setPage = function(p)
			{
				$scope.page = p;
			};
			var rowsPerPage = 100;
			$scope.rowsPerPage = rowsPerPage;
			$scope.Math = window.Math;
			var filers = data;
			$scope.filers = filers;
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
		
		var activeView = $scope.activeView;
		if (activeView === "hottest")
		{
			services.getHottest($routeParams.field, $routeParams.order)
				.then(onHottest, onError);
		}
		else if (activeView === "coldest")
		{
			services.getColdest($routeParams.field, $routeParams.order)
				.then(onColdest, onError);
		}
		else if (activeView === "consensus")
		{
			services.getConsensus($routeParams.field, $routeParams.order)
				.then(onConsensus, onError);
			services.getTotals()
				.then(onTotals, onError);
		}
		else if (activeView === "filers")
		{
			services.getFilers()
				.then(onFilers, onError);
		}
	};
	app.controller('mainController', mainController);
}());
