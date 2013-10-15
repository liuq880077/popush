/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	app.MemberlistView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#member-list',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		poptemplate: _.template($('#member-popover-template').html()),
		
		initialize: function () {
			this.listenTo(app.collections['members'], 'add', this.addOne);
			this.listenTo(app.collections['members'], 'reset', this.addAll);

			// Suppresses 'add' events with {reset: true} and prevents the app view 
			// from being re-rendered for every model. Only renders when the 'reset'
			// event is triggered at the end of the fetch.
			app.collections['members'].fetch({reset: true});
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function (user) {
			var view = new app.MemberView({ model: user });
			var text = view.render().el;
			$('#member-list').append(view.render().el);
			$('#member-avatar-' + user.get('name')).popover({
				html: true,
				content: this.poptemplate(user.toJSON()),
				placement: 'bottom',
				trigger: 'hover'
			});
		},

		// Add all items in the **Todos** collection at once.
		addAll: function () {
			this.$('#member-list').html('');
			app.collections['members'].each(this.addOne, this);
		},

	});
})(jQuery);
