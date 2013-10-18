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
    
    
    app.currentDir = '/' + data.user.name;
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
  app.removeloading('#register-control');
  app.registerLock = false; 
};

var onDoc = function(data) {
  if(app.docWaitingLock && app.docWaitingLock.length) {
    app.removeloading(app.docWaitingLock);
  }
  if(data.err){
    /* filelisterror(); */
    app.showMessageBox('error', 'wrong path', 1);
  } else if(data.doc) {
    if(data.doc.members) {
      var a = data.doc.members;
      for(var b = data.doc.docs, i = b.length; --i >= 0; ) {
        b[i].members = a;
      }
      a.unshift(data.doc.owner);
    } else {
      var a = app.currentUser;
    }
    if(typeof app.docLock != 'function') {
      app.docLock = Backbone.Collection.prototype.reset;
    }
    app.docLock.call(app.collections['files'], data.doc.docs || data.doc);
    app.collections['members'].reset(a);
  }
  app.docLock = false;
  app.docWaitingLock = false;
};

var onDelete = function(data) {
  if(app.operationLock && app.operationLock.length) {
    app.removeloading(app.operationLock);
  }
  $('#delete').modal('hide');
  if(data.err){
    app.showMessageBox('delete', data.err, 1);
    app.operationLock = false;
  } else {
    app.operationLock = false;
    /* TODO: use router. */
    app.views['files'].refetch();
  }
}

var onMove = function(data) {
  if(app.operationLock && app.operationLock.length) {
    app.removeloading(app.operationLock);
  }
  if(data.err){
    app.showMessageInDialog('#rename', data.err, 0);
    app.operationLock = false;
  } else {
    $('#rename').modal('hide');
    app.operationLock = false;
    /* Another way: use router. */
    app.views['files'].refetch();
  }
};

var onNewFile = function(data) {
  if(app.operationLock && app.operationLock.length) {
    app.removeloading(app.operationLock);
  }
  if(data.err){
    app.showMessageInDialog('#newfile', data.err);
    app.operationLock = false;
  } else {
    $('#newfile').modal('hide');
    if(app.operationLock.newType == 'dir') {
      app.showMessageBox('newfolder', 'createfoldersuccess', 1);
    } else {
      app.showMessageBox('newfile', 'createfilesuccess', 1);
    }
    delete app.operationLock.newType;
    app.operationLock = false;
    /* Another way: use router. */
    app.views['files'].refetch();
  }
};

app.main_socket = function() {
  app.socket.on('login', onLogin);
  app.socket.on('register', onRegister);
  app.socket.on('doc', onDoc);
  app.socket.on('delete', onDelete);
  app.socket.on('move', onMove);
  app.socket.on('new', onNewFile);
};

})();