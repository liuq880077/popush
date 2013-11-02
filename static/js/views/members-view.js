var app = app || {};

(function () {
	'use strict';
  
	app.MembersView = Backbone.View.extend({
		el: '#member-list',

		poptemplate: _.template($('#member-popover-template').html()),
		
		initialize: function () {
			this.listenTo(app.collections['members'], 'add', this.addOne);
			this.listenTo(app.collections['members'], 'reset', this.addAll);
		},

		addOne: function (user) {
			var view = new app.MemberView({ model: user });
			this.$el.append(view.render().el);
			view.$('.member-avatar').popover({
				html: true,
				content: this.poptemplate(user.toJSON()),
				placement: 'bottom',
				trigger: 'hover',
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
		addAll: function (collection, opts) {
      /*
        Both ways are OK, but the second can stop those event-listeners,
        although it's a little slower.
        */
			/* this.$el.html(''); */
	      opts || (opts = {});
	      if(opts.previousModels) {
	        _.each(opts.previousModels, function(m) { m.trigger('remove'); });
	      }
      
		},

	});

  app.init || (app.init = {});

  app.init.membersView = function() {
    if(app.views['members']) { return; }
    app.collections['members'] || app.init.members();
    app.views['members'] = new app.MembersView({
      collection: app.collections['members'],
    });
    if(app.views['cooperators']) { return; }
    app.collections['cooperators'] || app.init.members();
    app.views['cooperators'] = new app.MembersView({
      collection: app.collections['cooperators'],
    });
  };
  
})();
