/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	app.RegisterView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#register',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'keypress #register-inputName': 'registerOnEnter',
			'keypress #register-inputPassword': 'registerOnEnter',
			'keypress #register-confirmPassword': 'registerOnEnter',
			'click #register-submit': 'register',
			'click #login-view': 'loginview'
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function () {
			var view = this;
			app.socket.on('register', function(data){
				view.onRegister(data);
			});
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
			app.loading('register-control');
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
		
		onRegister: function(data) {
			if(data.err){
				app.showmessage('register-message', data.err, 'error');
			}else{
				app.showmessage('register-message', 'registerok');
				$('#register-inputName').val('');
				$('#register-inputPassword').val('');
				$('#register-confirmPassword').val('');
			}
			app.removeloading('register-control');
			app.registerLock = false;	
		},
		
	});
})(jQuery);
