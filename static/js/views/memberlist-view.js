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
		
		isdoc: 0,

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
			if (this.isdoc == 1)
				view.template = _.template($('#member-doc-template').html());
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
						model.trigger('remove');
						this.remove(model);
					}
				});
		},

		setonline: function (name, isonline) {
				this.collection.each(function(model){
					if (model.get('name')==name)
					{
						model.set({online: isonline});
						$('#avatar-' + name).addClass('online');
					}
				});
		},
		
		setalloffline: function() {
			this.collection.each(function(model){
				model.set('online',false);
				$('#avatar-' + model.get('name')).removeClass('online');
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
  app.init || (app.init = {});

  app.init.membersView = function() {
    if(app.views['members']) { return; }
    app.collections['members'] || app.init.members();
    app.views['members'] = new app.MemberlistView({
      collection: app.collections['members'],
    });
    if(app.views['cooperators']) { return; }
    app.collections['cooperators'] || app.init.members();
    app.views['cooperators'] = new app.MemberlistView({
      collection: app.collections['cooperators'],
      el: '#member-list-doc'
    });
    app.views['cooperators'].isdoc = 1;
  };
})(jQuery);
