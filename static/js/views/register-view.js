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
			var name = $('#register-inputName').val()
        , in_pw1 = $('#register-inputPassword')
        , in_pw2 = $('#register-confirmPassword')
        ;
      var pass = in_pw1.val();
			var confirm = in_pw2.val();
      in_pw1.val('');
      in_pw2.val('');
      
      var id = '#register-message', str = '';
			if(!/^[A-Za-z0-9]*$/.test(name)) {
        str = 'name invalid';
			} else if(name.length < 6 || name.length > 20) {
				str = 'namelength';
			} else if(pass.length > 32){
        str = 'passlength';
      } else if(pass != confirm) {
        str = 'doesntmatch';
      }
      if(str) {
        app.showMessageBar(id, str);
      } else if(app.Lock.attach({
        loading: '#register-control',
        error: function(data) { app.showMessageBar(id, data.err, 'error');},
        success: function() { app.showMessageBar(id, 'registerok'); },
      })) {
        app.socket.emit('register', {
          name:name,
          password:pass,
          avatar: app.User.prototype.defaults.avatar,
        });
      }      
		},

		registerOnEnter: function(e) {
			if(e.which == 13) { this.register(); }
		},
    
    show: function() {
      $('#register-inputPassword').val('');
      $('#register-confirmPassword').val('');
      $('#register-message').slideUp();
      $('#register-padding').slideDown('fast');
      $('#register-inputName').focus();
    },
				
	});
  app.init || (app.init = {});

  app.init.registerView = function() {
    if(app.views['register']) { return; }
    app.views['register'] = new app.RegisterView();
  };

})();
