var app = app || {};

(function() {

var onLogin = function(data) {
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
    $('#big-one').animate({height:'40px', padding:'0', 'margin-bottom':'20px'}, 'fast');
    $('#nav-head').fadeIn('fast');
    $('#login').hide();
    $('#editor').hide();
    
    $('#nav-user-name').text(data.user.name);
    $('#nav-avatar').attr('src', data.user.avatar);
    data.user.owner = data.user.online = true;
    app.currentUser = data.user;
    app.collections['members'].update([data.user]);
    
    $.cookie('sid', data.sid, {expires:7});

    var fc = app.collections['files'], name = data.user.name;
    $('#filecontrol').fadeIn('fast');
    $('#ownedfileex>a').attr('href', '#index/' + name);
    $('#sharedfile>a').attr('href', '#index/shared@' + name);
    fc.path = '/' + name;
    app.collections['files'].reset(data.user.docs);
    app.collections['files'].trigger('sync');
    delete data.user.docs; /* avoid bad memory. */

//    socket.emit('share', {
//		path: '/asdfasd/d',
//		name: 'fafafafa'
//	});

    /* window.location.href = '#/' + data.user.name; */
  }
  app.cleanLoading();
  app.loginLock = false;
};
  
var onRegister = function(data) {
  if(data.err){
    app.showmessage('register-message', data.err, 'error');
  }else{
    app.showmessage('register-message', 'registerok');
    $('#register-inputName').val('');
    $('#register-inputPassword').val('');
    $('#register-confirmPassword').val('');
  }
  app.removeLoading('#register-control');
  app.registerLock = false; 
};

var onDownload = function(data) {
	alert(data);
};

app.init || (app.init = {});

(function() {
  var _init = false;
  app.init.mainSocket = function() {
    if(_init) { return; }
    _init = true;
    app.socket.on('login', onLogin);
    app.socket.on('register', onRegister);
    app.socket.on('download', onDownload);
  };
})();

})();
