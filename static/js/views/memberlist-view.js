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
			this.listenTo(this.collection, 'add', this.addOne);
			this.listenTo(this.collection, 'reset', this.addAll);
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function (user) {
			var view = new app.MemberView({ model: user });
			var text = view.render().$el;
			this.$el.append(text);
			text.find('.member-avatar').popover({
				html: true,
				content: this.poptemplate(user.toJSON()),
				placement: 'bottom',
				trigger: 'hover',
			});
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		remove: function (name) {
				this.collection.each(function(model){
					if (model.get('name') == name) {
						model.destroy();
					}
				});
		},

		setonline: function (name, isonline) {
				if(isonline)
					$('#avatar-' + name).addClass('online');
				else
					$('#avatar-' + name).removeClass('online');
				this.collection.each(function(model){
					model.set({online: isonline});
				});
		},

		// Add all items in the **Todos** collection at once.
		addAll: function (collection, opts) {
      /*
        Both ways are OK, but the second can stop those event-listeners,
        although it's a little slower.
        */
			/* this.$el.html(''); */
      _.each(opts.previousModels, function(m) { m.trigger('remove'); });
      
			app.collections['members'].each(this.addOne, this);
		},

	});
})(jQuery);
