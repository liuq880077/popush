var app = app || {};

(function () {
	'use strict';

	app.ExpressionView = Backbone.View.extend({
		tagName:  'tr id="express-elem" onmouseover="$(this).find(\'a\').show()" onmouseout="$(this).find(\'a\').hide()"',

		template: _.template($('#expression-template').html()),
		

		events: {
			'click .title': 'renameExpression',
			'keypress #te': 'renameTry',
			'blur #te': 'doneall',
		},
		
		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'remove', this.remove);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			if (this.model.get('value')==null || this.model.get('value')=='') {
				this.$el.find('.col3').html('<span style="color:red">undefined</span>');
			}
			this.$el.find('input').hide();
			return this;
		},
		
		renameTry: function(e) {
			if(e.keyCode==13)
				this.renameExpressionDone();
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
})();
