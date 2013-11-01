var app = app || {};

(function(){
  var Router = Backbone.Router.extend({
    routes: {
      '': 'login',
      'login': 'login',
      'register': 'register',
      'index/*filepath':'index'
    },

    login: function () {
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
    
    register: function() {
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
    
    index: function(filepath){
      if(app.loginVerify()) {
    	alert(filepath);
    	$('#login-message').hide();
    	$('#big-one').animate({height:'40px', padding:'0', 'margin-bottom':'20px'}, 'fast');
    	$('#nav-head').fadeIn('fast');
    	$('#login').hide();
    	$('#editor').hide();
    	$('#filecontrol').fadeIn('fast');
        app.views['files'].go('/'+filepath);
      }
    },
    
  });
  
  app.init.router = function() {
    if(app.router) { return; }
    
    app.router = new Router();
    Backbone.history.start({
      root: app.Package.PAGE_ROOT,
    });
  };
})();