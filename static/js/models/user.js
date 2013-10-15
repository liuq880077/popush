/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Model
	// ----------

	// Our basic **Todo** model has `title`, `order`, and `completed` attributes.
	app.user = Backbone.Model.extend({
		// Default attributes for the todo
		// and ensure that each todo created has `title` and `completed` keys.
		defaults: {
			name: '',
			avatar: '',
			online: false,
			owner: false,
		},

		// Toggle the `completed` state of this todo item.
		update: function(data) {
			this.save({
				name: data.name,
				avatar: data.avatar,
				online: data.online,
				owner: data.owner
			});
		}
	});
})();
