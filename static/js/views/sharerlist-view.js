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
		},
		
		addOne: function(m) {
			var view = new app.SharerView({ model: m });
			var text = view.render().$el;
			this.$el.find("#share-user-list").append(text);
		},

		sharedone: function(data) {
			if(!data.err){
				app.collections['shares'].update(data.doc.members);  //需要改
				app.sharemodel.set('members', data.doc.members);
			}
			this.$('#share-message').hide();
			app.isShare = false;
			app.operationLock = false;
			app.sharemodel = null;
		},

		addOnEnter: function(e) {
			if (e.which !== 13) {
				return;
			}
			if(app.loadDone)
				this.share();
		},

		/* 在"共享管理"pop-up框中点击增加按钮触发的js函数，socket.emit('share') */
		share: function (){
			var name = this.$el.find('#share-inputName').val();
			if(name == '') {
				app.showMessageBar('#share-message', 'inputusername', 'error');
				return;
			}
			var that = this, isOK = app.Lock.attach({
				loading: '#share-buttons',
				error: function(data) {
					app.showMessageBar('#share-message', data.err, 'error');
				},
				success: function(data) {
					app.Lock.remove();
					that.refreshUser(data);
				},
			});
			
			if(isOK) {
				app.socket.emit('share', {
					path: app.sharemodel.get('path'),
					name: name,
				});
			}
//			this.$('#share-inputName').val('');
		},
		
		refreshUser: function(data) {
			app.isShare = true;
			data.notRemove = true; // not remove because it will be still locked;
			app.socket.emit('doc', {
				path: app.sharemodel.get('path'),
			});
		},

		/* 在"共享管理"pop-up框中点击删除按钮触发的js函数，socket.emit('unshare') */
		unshare: function() {
			if (app.isShare)
				return;
			if(!this.selected) {
				app.showMessageBar('#share-message', 'selectuser', 'error');
				return;
			}
			if(app.operationLock)
				return;
			app.operationLock = true;
			var that = this, isOK = app.Lock.attach({
				loading: '#share-buttons',
				error: function(data) {
					app.showMessageBar('#share-message', data.err, 'error');
				},
				success: function(data) {
					app.Lock.remove();
					that.refreshUser(data);
				},
			});
			if (isOK) {
				app.socket.emit('unshare', {
					path: app.sharemodel.get('path'),
					name: that.selected.get('name')
				});
			}
		},
		
	    addAll: function (c, opts) {
      /*
        Both ways are OK, but the second can stop those event-listeners,
        although it's a little slower.
        */
      /* this.$('.file-item').remove(); */
	      opts || (opts = {});
	      if(opts.previousModels) {
	        _.each(opts.previousModels, function(m) { m.trigger('remove'); });
	      }
	    }
	});
	
  app.init || (app.init = {});

  app.init.sharesView = function() {
    if(app.views['shares']) { return; }
    app.collections['shares'] || app.init.members();
    app.views['shares'] = new app.SharerlistView({
      collection: app.collections['shares'],
    });
  };
  
})();
