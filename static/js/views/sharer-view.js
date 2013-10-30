/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {

	app.SharerView = Backbone.View.extend({
		tagName: 'li',
		// Cache the template function for a single item.
		template: _.template($('#sharer-template').html()),
		
		// The DOM events specific to an item.
		events: {
			'click a': 'select'
		},
		
		// The TodoView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Todo** and a **TodoView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'remove', this.remove);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		// Re-render the titles of the todo item.
		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		
		select: function () {
			app.views['shares'].$el.find('li').removeClass('active');
			this.$el.addClass('active');
			app.views['shares'].selected = this.model;
		},
	});
})(jQuery);
