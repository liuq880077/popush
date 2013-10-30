/*global Backbone, jQuery, _, ENTER_KEY */
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
//			this.listenTo(this.collection, 'reset', this.addAll);
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
			}
			this.$('#share-message').hide();
			app.isShare = false;
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
				app.showmessage('share-message', 'inputusername', 'error');
				return;
			}
			var that = this, isOK = app.Lock.attach({
				loading: '#share-buttons',
				error: function(data) {
					app.showmessage('share-message', data.err, 'error');
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
			var selected = userlist.getselection();   //需要改
			if(!selected) {
				app.showmessage('share-message', 'selectuser', 'error');
				return;
			}
			if(app.operationLock)
				return;
			app.operationLock = true;
			app.loading('share-buttons');
			app.socket.emit('unshare', {
				path: app.sharemodel.get('path'),
				name: selected.get('name')
			});
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
