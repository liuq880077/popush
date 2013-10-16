var app = app || {};

(function () {
	/* 'use strict'; */

	/**
	  User Model
	  ----------
	  */

	app.user = Backbone.Model.extend({
		defaults: {
			name: '',
			avatar: 'images/character.png',
			online: false,
			owner: false,
		},

		update: function(data, opt) {
			this.save(data, opt);
		}
	});
  
})();
