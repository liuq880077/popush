var app = app || {};

(function () {
	app.AccountView = Backbone.View.extend({
		el:'#nav-head',

		events:{
			'click #btn_changepassword':'changepasswordopen',
			'click #btn_changeavatar':'changeavatar'
		},

		initialize:function(){
			this.template =  _.template($('#nav-head').html()),
			this.listenTo(this.model, 'change', this.render);
			
			var that = this;
			$('#changepassword-old').bind('keydown',function(){app.pressenter(arguments[0],that.changepassword)});
			$('#changepassword-new').bind('keydown',function(){app.pressenter(arguments[0],that.changepassword)});
			$('#changepassword-confirm').bind('keydown',function(){app.pressenter(arguments[0],that.changepassword)});
		},

		changepassword:function(){
			if(app.operationLock)
          				return;
          	var old = $('#changepassword-old').val();
			var pass = $('#changepassword-new').val();
			var confirm = $('#changepassword-confirm').val();
			$('#changepassword .control-group').removeClass('error');
			$('#changepassword .help-inline').text('');
			if(pass != confirm) {
				app.showMessageInDialog('#changepassword', 'doesntmatch', 2);
				return;
			}
			if(app.operationLock)
				return;
			app.operationLock = true;
			app.loading('#changepassword-buttons');
			app.socket.emit('password', {
				password: old,
				newPassword: pass
			});
		},
		changepasswordopen:function(){
			var modal = $('#changepassword');
			app.showInputModal(modal);
			
			var confirm = modal.find('.modal-confirm');
			confirm.unbind();
      		confirm.bind('click', this.changepassword);
      		
		},
		changeavatar:function(){
		},
		render:function(){
			this.el.html(this.template(this.model.toJSON()));
			return this;
		},
	});

})();
