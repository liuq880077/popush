var app = app || {};

(function () {
	'use strict';

	app.RegisterView = Backbone.View.extend({

		el: '#register',

		events: {
			'keypress #register-inputName': 'registerOnEnter',
			'keypress #register-inputPassword': 'registerOnEnter',
			'keypress #register-confirmPassword': 'registerOnEnter',
			'click #register-submit': 'register',
		},
		
		register: function () {
			var name = $('#register-inputName').val();
			var pass = $('#register-inputPassword').val();
			var confirm = $('#register-confirmPassword').val();
			if(!/^[A-Za-z0-9]*$/.test(name)) {
				app.showmessage('register-message', 'name invalid');
				return;
			}
			if(name.length < 6 || name.length > 20) {
				app.showmessage('register-message', 'namelength');
				return;
			}
			if(pass.length > 32){
				app.showmessage('register-message', 'passlength');
				return;
			}
			if(pass != confirm) {
				app.showmessage('register-message', 'doesntmatch');
				return;
			}
			if(app.registerLock)
				return;
			app.registerLock = true;
			app.loading('#register-control');
			app.socket.emit('register', {
				name:name,
				password:pass,
				avatar:'images/character.png'
			});			
		},

		registerOnEnter: function(e) {
			if(e.which == 13 && app.loadDone)
				this.register();
		},
		
		loginview: function() {
			if(app.viewswitchLock)
				return;
			app.viewswitchLock = true;
			$('#register .blink').fadeOut('fast');
			$('#register-message').slideUp();
			$('#register-padding').fadeOut('fast', function(){
				$('#login').show();
				$('#login .blink').fadeIn('fast');
				$('#register').hide();
				$('#login-inputName').val('');
				$('#login-inputPassword').val('');
				$('#login-message').hide();
				$('#login-padding').slideUp('fast', function(){
					$('#login-inputName').focus();
					app.viewswitchLock = false;
				});
				app.resize();
			});	
		},
				
	});
  
  app.init || (app.init = {});

  app.init.registerView = function() {
    app.views['register'] || (app.views['register'] = new app.RegisterView());
  };
  
})();
