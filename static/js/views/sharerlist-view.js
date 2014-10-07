/*文件共享者列表视图*/
var app = app || {};
(function ($) {
    app.SharerlistView = Backbone.View.extend({
        el: '#share',
        selected: null,
        events: {
            'keypress #share-inputName': 'addOnEnter',
            'click #share-confirm': 'share',
            'click #share-remove': 'unshare',
        },
        initialize: function () {
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
            this.listenTo(this.collection, 'destroy', this.remove);
            this.refreshStep = 0;
        },
        /*添加一个共享者*/
        addOne: function (m) {
            var view = new app.SharerView({
                model: m
            });
            var text = view.render().$el;
            this.$el.find("#share-user-list").append(text);
        },
        /*监听键盘事件，敲击回车则触发共享事件*/
        addOnEnter: function (e) {
            if (e.which === 13) {
                this.share();
            }
        },
        share: function () {
            var name = this.$el.find('#share-inputName').val();
            if (name == '') {
                app.showMessageBar('#share-message', 'inputusername', 'error');
            } else if (this.beginRefresh()) {
                app.socket.emit('share', {
                    path: this.shareModel.get('path'),
                    name: name,
                });
            }
            this.$('#share-inputName').val('').focus();
        },
        beginRefresh: function () {
            var that = this;
            that.refreshStep = 1;
            return app.Lock.attach({
                loading: this.$('#share-buttons'),
                error: function (data) {
                    app.showMessageBar('#share-message', data.err, 'error');
                },
                success: function (data) {
                    that.refreshUser(data);
                },
            });
        },
        refreshUser: function (data) {
            if (this.refreshStep == 1) {
                app.socket.emit('doc', {
                    path: this.shareModel.get('path'),
                });
                this.refreshStep = 2;
                data.notRemove = true;
            } else if (this.refreshStep == 2) {
                this.collection.update(data.doc.members);
                this.shareModel.set('members', data.doc.members);
                this.$('#share-message').hide();
                this.refreshStep = 0;
            }
        },
        /*取消共享*/
        unshare: function () {
            if (!this.selected) {
                app.showMessageBar('#share-message', 'selectuser', 'error');
            } else if (this.beginRefresh()) {
                app.socket.emit('unshare', {
                    path: this.shareModel.get('path'),
                    name: this.selected.get('name')
                });
            }
        },
        addAll: function (c, opts) {
            opts || (opts = {});
            if (opts.previousModels) {
                _.each(opts.previousModels,
				function (m) {
				    m.trigger('remove');
				});
            }
        },
    });
    app.init || (app.init = {});
    app.init.sharesView = function () {
        if (app.views['shares']) {
            return;
        }
        app.collections['shares'] || app.init.shares();
        app.views['shares'] = new app.SharerlistView({
            collection: app.collections['shares'],
        });
    };
})();