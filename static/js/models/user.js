var app = app || {};

(function () {
	'use strict';

	/**
	  User Model
	  */
	app.User = Backbone.Model.extend({
    idAttribute: 'name',
    
		defaults: {
			name: '',
			avatar: 'images/character.png',
			online: false,
			owner: false,
		},
    
	});
  
})();
