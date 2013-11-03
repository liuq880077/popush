/*共享文件列表视图中的文件共享者视图*/
var app = app || {};
(function () {
    app.SharerView = Backbone.View.extend({
        tagName: 'li',
        template: _.template($('#sharer-template').html()),
        events: {
            'click a': 'select'
        },
        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },
        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
		/*共享者被选中*/
        select: function () {
            app.views['shares'].$el.find('li').removeClass('active');
            this.$el.addClass('active');
            app.views['shares'].selected = this.model;
        },
    });
})();