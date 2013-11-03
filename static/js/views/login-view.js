var app = app || {};

(function () {
  'use strict';

  app.LoginView = Backbone.View.extend({
    el: '#login',

    events: {
      'keypress #login-inputName': 'loginOnEnter',
      'keypress #login-inputPassword': 'loginOnEnter',
      'click #login-submit': 'login'
    },
        
    login: function() {
      var name = $('#login-inputName').val(), in_pw = $('#login-inputPassword');
      var pass = in_pw.val();
      in_pw.val('');
      if(!name || !pass) {
        app.showMessageBar('login-message', 'pleaseinput', 'error');
      } else if(app.Lock.attach({ loading: '#login-control',
        error: function(data) { app.showMessageBar('#login-message', data.err, 'error'); },
      })) {
        app.socket.emit('login', {
          name: name,
          password: pass,
        });
      }
    },
    
    loginOnEnter: function(e) {
      if(e.which == 13) { this.login(); }
    },
    
    show: function() {
      $('#login-inputPassword').val('');
      $('#login-message').slideUp();
      $('#login-padding').slideUp('fast');
      $('#login-inputName').focus();
    },
    
  });
  app.init || (app.init = {});

  app.init.loginView = function() {
    app.views['login'] || (app.views['login'] = new app.LoginView());
  };
  
})();


