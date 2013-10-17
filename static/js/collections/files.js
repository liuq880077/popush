/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Files = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.File,
		
		update: Backbone.Collection.prototype.set,
    
	});

})();
