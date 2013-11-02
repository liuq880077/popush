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

		initialize: function () {	//需要改
			this.listenTo(this.collection, 'add', this.addOne);
			this.listenTo(this.collection, 'reset', this.addAll);
			this.listenTo(this.collection, 'destroy', this.remove);
      this.refreshStep = 0;
		},
		
		addOne: function(m) {
			var view = new app.SharerView({ model: m });
			var text = view.render().$el;
			this.$el.find("#share-user-list").append(text);
		},

		addOnEnter: function(e) {
			if (e.which === 13) {
        this.share();
			}
		},

		/* 在"共享管理"pop-up框中点击增加按钮触发的js函数，socket.emit('share') */
		share: function (){
			var name = this.$el.find('#share-inputName').val();
			if(name == '') {
				app.showMessageBar('#share-message', 'inputusername', 'error');
			} else if(this.beginRefresh()) {
				app.socket.emit('share', {
					path: this.shareModel.get('path'),
					name: name,
				});
			}
      this.$('#share-inputName').val('').focus();
		},
		
    beginRefresh: function() {
      var that = this;
      that.refreshStep = 1;
			return app.Lock.attach({
				loading: this.$('#share-buttons'),
				error: function(data) {
					app.showMessageBar('#share-message', data.err, 'error');
				},
				success: function(data) { that.refreshUser(data); },
			});
    },
    
		refreshUser: function(data) {
      if(this.refreshStep == 1) {
        app.socket.emit('doc', {
          path: this.shareModel.get('path'),
        });
        this.refreshStep = 2;
        data.notRemove = true; // not remove because it will be still locked;
      } else if(this.refreshStep == 2) {
				this.collection.update(data.doc.members);  //需要改
				this.shareModel.set('members', data.doc.members);
        this.$('#share-message').hide();
        this.refreshStep = 0;
      }
		},
    
		/* 在"共享管理"pop-up框中点击删除按钮触发的js函数，socket.emit('unshare') */
		unshare: function() {
			if(!this.selected) {
				app.showMessageBar('#share-message', 'selectuser', 'error');
			} else if(this.beginRefresh()) {
				app.socket.emit('unshare', {
					path: this.shareModel.get('path'),
					name: this.selected.get('name')
				});
			}
		},
		
    addAll: function (c, opts) {
      opts || (opts = {});
      if(opts.previousModels) {
        _.each(opts.previousModels, function(m) { m.trigger('remove'); });
      }
    },
	});
	
  app.init || (app.init = {});

  app.init.sharesView = function() {
    if(app.views['shares']) { return; }
    app.collections['shares'] || app.init.shares();
    app.views['shares'] = new app.SharerlistView({
      collection: app.collections['shares'],
    });
  };
  
})();
