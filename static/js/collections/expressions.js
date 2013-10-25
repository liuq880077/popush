/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Expressions = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.expression,

		// We keep the Todos in sequential order, despite being saved by unordered
		// GUID in the database. This generates the next order number for new items.
		nextOrder: function () {
			if (!this.length) {
				return 1;
			}
			return this.last().get('order') + 1;
		},

		comparator: function (expression) {
			return expression.get('order');
		}
		
	});

})();
