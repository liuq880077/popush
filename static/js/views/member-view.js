/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	app.MemberView = Backbone.View.extend({
		// Cache the template function for a single item.
		template: _.template($('#member-template').html()),
		
		// The DOM events specific to an item.
		events: {
		},
		
		// The TodoView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Todo** and a **TodoView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function () {
//			this.listenTo(this.model, 'change', this.online);
			this.listenTo(this.model, 'remove', this.remove);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		// Re-render the titles of the todo item.
		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		
		// Remove the item, destroy the model from *localStorage* and delete its view.
		//clear: function () {
//			this.model.destroy();
		//}
	});
})(jQuery);
