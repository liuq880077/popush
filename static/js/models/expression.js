var app = app || {};

(function () {
	/* 'use strict'; */

	app.Expression = Backbone.Model.extend({
		defaults: {
			expression: ' ',
			value: null,
			notnew: true,
		},
    
	});
  
})();
