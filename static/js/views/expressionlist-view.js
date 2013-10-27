/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	app.ExpressionlistView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#varlist-table',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'click #adde': 'addExpression',
		},

		editingelem: null,
		
		initialize: function () {
			this.listenTo(this.collection, 'add', this.addExpression);
			this.listenTo(this.collection, 'reset', this.addAll);
		},

		clear: function() {
			this.$el.html(
				'<tr class="new"><td class="col1">&nbsp;</td>' +
				'<td id="adde" class="col2" title="' +
					strings['addexpression'] + '"><i class="icon-plus"></i></td>' +
				'<td class="col3"></td></tr>'
				);
		},

		seteditingelem: function(elem) {
			editingelem = elem;
		},

		addExpression: function(m) {
			var view = null;
			var elem = null;
			if(m === undefined) {
				m = new app.expression({expression: '', notnew: false});				
				view = new app.ExpressionView({ model: m });
				elem = view.render().$el;
				elem.find('span').hide();
				this.$el.find('.new').before(elem);
				elem.find('input').focus();
			}
			else {
				view = new app.ExpressionView({ model: m });
				elem = view.render().$el;
				elem.find('input').hide();
				elem.find('span').text(expression);
				this.$el.find('.new').before(elem);
			}
		},

		doneall: function() {
			if(this.editingelem) {
				this.editingelem.renameExpressionDone();
				this.editingelem = null;
			}
		},

		findElementByExpression: function(expression) {
			this.collection.each(function(model){
				if(model.get('expression') == expression) {
					return model;
				}
			});
		},
		
		removeElement: function(model) {
			if(editingelem.model == model)
				editingelem = null;
			model.destroy();
		},

		removeElementByExpression: function(expression) {
			this.collection.each(function(model){
				if(model.get('expression') == expression) {
					this.removeElement(model);
					return;
				}
			});
		},
		
		geteditingelem: function() {
			return editingelem;
		},
		
		setValue: function(expression, value) {
			var v = this.findElementByExpression(expression);
			if(!v)
				return;
			var elem = v.$el;
			if(value !== null)
				elem.find('.col3').text(value);
			else
				elem.find('.col3').html('<span style="color:red">undefined</span>');
		},

		// Add all items in the **Todos** collection at once.
		addAll: function (collection, opts) {
      /*
        Both ways are OK, but the second can stop those event-listeners,
        although it's a little slower.
        */
			/* this.$el.html(''); */
      		this.clear();
		    _.each(opts.previousModels, function(m) { m.trigger('remove'); });
			app.collections['expressions'].each(this.addOne, this);
		},

	});
	
  app.init || (app.init = {});

  app.init.expressionsView = function() {
    if(app.views['expressions']) { return; }
    app.collections['expressions'] || app.init.expressions();
    app.views['expressions'] = new app.ExpressionlistView({
      collection: app.collections['expressions'],
    });
  };
  
})(jQuery);
