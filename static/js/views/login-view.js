/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	app.LoginView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#login',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'keypress #login-inputName': 'loginOnEnter',
			'keypress #login-inputPassword': 'loginOnEnter',
			'click #register-view': 'registerview',
			'click #login-submit': 'login'
		},
		
		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function () {
			var view = this;
			app.socket.on('login', function(data){
				view.onLogin(data);
			});
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
			app.loading('login-control');
			app.socket.emit('login', {
				name:$('#login-inputName').val(),
				password:$('#login-inputPassword').val()
			});
		},
		
		loginOnEnter: function(e) {
			if(e.which == 13 && app.loadDone)
				this.login();
		},
		
		onLogin: function(data) {
				if(data.err){
					if(data.err == 'expired') {
						$.removeCookie('sid');
					} else {
						app.showmessage('login-message', data.err, 'error');
					}
				}else{
					app.operationLock = false;
					$('#login-inputName').val('');
					$('#login-inputPassword').val('');
					$('#login-message').hide();
					$('#ownedfile').show();
					$('#ownedfileex').hide();
					$('#sharedfile').removeClass('active');
					$('#share-manage-link').hide();
					$('#big-one').animate({height:'40px', padding:'0', 'margin-bottom':'20px'}, 'fast');
					$('#nav-head').fadeIn('fast');
					$('#login').hide();
					$('#editor').hide();
					$('#filecontrol').fadeIn('fast');
					$('#nav-user-name').text(data.user.name);
					$('#nav-avatar').attr('src', data.user.avatar);
					app.currentUser = data.user;

					$.cookie('sid', data.sid, {expires:7});
		
//					app.dirMode = 'owned';
//					docshowfilter = allselffilter;

//					currentDir = [data.user.name];
//					currentDirString = getdirstring();
//					$('#current-dir').html(getdirlink());
//					filelist.setmode(3);
//					filelist.formdocs(data.user.docs, docshowfilter);
		
//					memberlist.clear();
//					memberlist.add(data.user);
				}

				app.cleanloading();
				app.loginLock = false;
		},

	});
})(jQuery);
