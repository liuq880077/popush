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

    $('#filecontrol').fadeIn('fast');
    
    
    app.currentDirString = '/' + data.user.name;
    app.collections['files'].reset(data.user.docs);
    delete data.user.docs; /* avoid bad memory. */

    $('#ownedfileex>a').attr('href', '#/' + data.user.name);
    $('#sharedfile>a').attr('href', '#/shared@' + data.user.name).bind();
    
    /* window.location.href = '#/' + data.user.name; */
  }
  app.cleanloading();
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
  app.removeloading('register-control');
  app.registerLock = false; 
};

var onDoc = function(data) {
  if(app.docWaitingLock) {
    app.removeloading(app.docWaitingLock);
    app.docWaitingLock = false;
  }
  if(data.err){
    /* filelisterror(); */
    app.showmessagebox('error', 'wrong path', 1);
  } else {
    if(data.doc) {
      if(typeof app.docLock == 'function') {
        app.docLock.call(app.collections['files'], data.doc.docs || data.doc);
      } else {
        app.collections['files'].reset(data.doc.docs || data.doc);
      }
      if(data.doc.members) {
        var a = data.doc.members;
        /* var l = a.length, n = app.currentUser.name, i = 0; */
        /* for(; i < l; i++) {
          if(a[i] && a[i].name == n) {
            a[i].online = a[i].owner = true;
            break;
          }
        } */
        a.unshift(data.doc.owner);
        app.collections['members'].reset(a);
      } else if(app.views['files'].mode == app.FilesView.Mode.BelongSelf) {
        app.collections['members'].reset(app.currentUser);
      }
    }
  }
  app.docLock = false;
}

app.main_socket = function() {
  app.socket.on('login', onLogin);
  app.socket.on('register', onRegister);
  app.socket.on('doc', onDoc);
}

})();