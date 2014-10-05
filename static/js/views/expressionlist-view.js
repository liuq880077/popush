/*调试框中的表达式列表视图*/
var app = app || {};
(function () {
    'use strict';
    app.ExpressionlistView = Backbone.View.extend({
        el: '#varlist-table',
        events: {
            'click #adde': 'addExp',
        },
        editingelem: null,
        initialize: function () {
            this.listenTo(this.collection, 'add', this.addExpression);
            this.listenTo(this.collection, 'reset', this.addAll);
        },
        addExp: function () {
            this.addExpression();
        },
        clear: function () {
            this.$el.html('<tr class="new"><td class="col1">&nbsp;</td>' + '<td id="adde" class="col2" title="' +
			strings['addexpression'] + '"><span class="glyphicon glyphicon-plus"></span></td>' + '<td class="col3"></td></tr>');
        },
        seteditingelem: function (elem) {
            this.editingelem = elem;
        },
        addExpression: function (m) {
            var view = null;
            var elem = null;
            if (m === undefined) {
                m = new app.Expression({
                    expression: '',
                    notnew: false
                });
                this.editingelem = view = new app.ExpressionView({
                    model: m
                });
                elem = view.render().$el;
                elem.find('span').hide();
                elem.find('input').show();
                elem.find('.col3').html('');
                this.$el.find('.new').before(elem);
                elem.find('input').focus();
            }
            else {
                view = new app.ExpressionView({
                    model: m
                });
                elem = view.render().$el;
                this.$el.find('.new').before(elem);
            }
        },
        doneall: function () {
            if (this.editingelem) {
                this.editingelem.renameExpressionDone();
                this.editingelem = null;
            }
        },
        findElementByExpression: function (expression) {
            var that = null;
            this.collection.each(function (model) {
                if (model.get('expression') == expression) {
                    that = model;
                }
            });
            return that;
        },
        removeElement: function (model) {
            if (this.editingelem.model == model)
                this.editingelem = null;
            model.trigger('remove');
            this.collection.remove(model);
        },
        removeElementByExpression: function (expression) {
            var that = this;
            this.collection.each(function (model) {
                if (model.get('expression') == expression) {
                    that.removeElement(model);
                    return;
                }
            });
        },
        geteditingelem: function () {
            return this.editingelem;
        },
        addAll: function (collection, opts) {
            this.clear();
            _.each(opts.previousModels,
			function (m) {
			    m.trigger('remove');
			});
        },
    });
    app.init || (app.init = {});
    app.init.expressionsView = function () {
        if (app.views['expressions']) {
            return;
        }
        app.collections['expressions'] || app.init.expressions();
        app.views['expressions'] = new app.ExpressionlistView({
            collection: app.collections['expressions'],
        });
    };
})();