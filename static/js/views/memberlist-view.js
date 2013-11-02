var app = app || {};

(function () {
	'use strict';
  
	app.MemberlistView = Backbone.View.extend({
		el: '#member-list',
		
		isdoc: 0,
    
		events: {
		},

		poptemplate: _.template($('#member-popover-template').html()),
		
		initialize: function () {
			this.listenTo(this.collection, 'add', this.addOne);
			this.listenTo(this.collection, 'reset', this.addAll);
		},

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
						if (isonline)
							$('#avatar-' + name).addClass('online');
						else
							$('#avatar-' + name).removeClass('online');
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
		    _.each(opts.previousModels, function(m) { 
		    	m.trigger('remove'); 
		    });      
			this.collection.each(this.addOne, this);
		},

	});
  app.init || (app.init = {});

  app.init.membersView = function() {
    if(app.views['members']) { return; }
    app.collections['members'] || app.init.members();
    app.views['members'] = new app.MemberlistView({
      collection: app.collections['members'],
    });
  };
  app.init.cooperatorsView = function() {
    if(app.views['cooperators']) { return; }
    app.collections['cooperators'] || app.init.cooperators();
    app.views['cooperators'] = new app.MemberlistView({
      collection: app.collections['cooperators'],
      el: '#member-list-doc'
    });
    app.views['cooperators'].isdoc = 1;
  };
})();
