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
    
    
    app.currentShownDir = app.currentDir = '/' + data.user.name;
    $('#ownedfileex>a').attr('href', '#index/' + data.user.name);
    $('#sharedfile>a').attr('href', '#index/shared@' + data.user.name);
    app.collections['files'].reset(data.user.docs);
    delete data.user.docs; /* avoid bad memory. */

    
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

var onDoc = function(data) {
  if(!app.docLock) { return; }
  app.docLock.receive = true;
  app.removeLoading(app.docLock.waiting);
  if(data.err){
    app.showMessageBox('error', 'wrong path', 1);
  } else if(data.doc) {
    var a = data.doc.members;
    if(a) {
      var b = data.doc.docs, i;
      if(b && b.length) {
        for(i = b.length; --i >= 0; ) {
          b[i].members = a;
        }
      }
      if(data.doc.owner) {
        a = _.clone(a);
        a.unshift(data.doc.owner);
      }
    } else {
      a = app.currentUser;
    }
    if(typeof app.docLock == 'function') {
      app.docLock.call(app.collections['files'], data.doc.docs || data.doc);
      app.docLock.call(app.collections['members'], a);
    } else {
      app.showMessageBox('error', 'error', 1);
    }
  }
  var back = app.docLock;
  app.docLock = false;
  /*
    fix an error caused by bad web access or 'F12:Debug':
    'app.loading' may be called after this function's first 'app.removeLoading',
      and before 'app.docLock' is set to 'false'.
    */
  if(back) {
    app.removeLoading(back.waiting);
    delete back.waiting;
    delete back.receive;
  }
};

var onDelete = function(data) {
  app.removeLoading(app.operationLock);
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
  app.removeLoading(app.operationLock);
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
  app.removeLoading(app.operationLock);
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