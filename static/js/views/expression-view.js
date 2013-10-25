/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	app.ExpressionView = Backbone.View.extend({
		// Cache the template function for a single item.
		template: _.template($('#expression-template').html()),
		
		// The DOM events specific to an item.
		events: {
			'click .title': 'renameExpression',
			'keypress #te': 'renameTry',
			'blur #te': 'doneall',
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

		renameTry: function(e) {
			if(e.keyCode==13)
				renameExpressionDone();
		},
		
		doneall: function() {
			app.views['expressions'].doneall();			
		},
		
		removeExpression: function() {
			this.doneall();
			app.socket.emit('rm-expr', {
				expr: this.model.expression
			});
		},

	    renameExpression: function() {
			this.doneall();
			if(app.debugLock && !app.waiting)
				return;
			var input = this.$el.find('input');
			var span = this.$el.find('.title');
			var expression = span.text();
			span.hide();
			input.val($.trim(expression));
			input.show();
			input.focus();
			input.select();
			app.views['expressions'].seteditingelem(this);
		},

		renameExpressionDone : function() {
			var input = this.$el.find('input');
			var span = this.$el.find('span');
			var expression = $.trim(input.val());
		
			if(app.debugLock && !app.waiting) {
				if(!this.model.notnew) {
					this.model.destroy();
				} else {
					input.hide();
					span.show();
				}
			} else {
				if(this.model.notnew) {
					app.socket.emit('rm-expr', {
						expr: this.model.expression
					});
				}
				
				if(expression != '') {
					app.socket.emit('add-expr', {
						expr: expression
					});
				}
				this.model.destroy();
			}
			app.views['expressions'].seteditingelem(null);
		},
		// Remove the item, destroy the model from *localStorage* and delete its view.
		//clear: function () {
//			this.model.destroy();
		//}
	});
})(jQuery);
