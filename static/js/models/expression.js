var app = app || {};

(function () {
	/* 'use strict'; */

	/**
	  Expression Model
	  ----------
	  */

	app.expression = Backbone.Model.extend({
		defaults: {
			expression: '',
			value: null,
			notnew: true,
		},

		update: Backbone.Model.prototype.save,
    
	});
  
})();
