var app = app || {};

(function () {
	'use strict';

	app.LoginView = Backbone.View.extend({

		el: '#login',

		events: {
			'keypress #login-inputName': 'loginOnEnter',
			'keypress #login-inputPassword': 'loginOnEnter',
			'click #login-submit': 'login',
		},

		/* 由登陆视图切换到注册视图 */
		registerview: function() {
			if(app.viewswitchLock)
				return;
			app.viewswitchLock = true;
			$('#login .blink').fadeOut('fast');
			$('#login-message').slideUp();
			$('#login-padding').slideDown('fast', function(){
				$('#register').show();
				$('#register .blink').fadeIn('fast');
				$('#login').hide();
				$('#register-inputName').val('');
				$('#register-inputPassword').val('');
				$('#register-confirmPassword').val('');
				$('#register-message').hide();
				$('#register-padding').fadeIn('fast', function(){
					$('#register-inputName').focus();
					app.viewswitchLock = false;
				});
				app.resize();
			});
		},
		
		login: function() {
			var name = $('#login-inputName').val();
			var pass = $('#login-inputPassword').val();
			if(name == '') {
				app.showmessage('login-message', 'pleaseinput', 'error');
				return;
			}
			if(app.loginLock)
				return;
			app.loginLock = true;
			app.loading('#login-control');
			app.socket.emit('login', {
				name: name,
				password: pass,
			});
		},
		
		loginOnEnter: function(e) {
			if(e.which == 13 && app.loadDone)
				this.login();
		},
		
	});
  
  app.init || (app.init = {});

  app.init.loginView = function() {
    app.views['login'] || (app.views['login'] = new app.LoginView());
  };
  
})();
