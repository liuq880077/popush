var app = app || {};

(function () {
	'use strict';

	app.MemberView = Backbone.View.extend({
		template: _.template($('#member-template').html()),

		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'remove', this.remove);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
    
	});
  
})();
