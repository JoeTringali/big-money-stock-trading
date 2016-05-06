(function()
{
	var app = angular.module('BigMoneyStockTrading', ["ngRoute"]);
	
	app.config(function($routeProvider, $locationProvider)
	{
		$routeProvider
			.when("/about/:activeView",
			{
				templateUrl: "about.html",
				controller: "aboutController"
			})
			.when("/main/:activeView",
			{
				templateUrl: "main.html",
				controller: "mainController"
			})
			.when("/filerView/:id",
			{
				templateUrl: "filer.html",
				controller: "filerController"
			})
			.when("/cusipView/:id/:field/:order",
			{
				templateUrl: "cusip.html",
				controller: "cusipController"
			})
			.otherwise({redirectTo:"/about/about"});
		$locationProvider.html5Mode(true);
	});		
}());
