var app = app || {};

(function() {

var onVersion = function(data) {
  if(data.version != app.Package.VERSION) {
    window.location.reload(true);
  }
  if(app.Lock.getMessage() === 'pageIsLoading') { app.Lock.detach(); }
  else { app.Lock.fail(); }
  app.cleanLoading();
  
  var sid = $.cookie('sid'), go = function() {
    var hash = window.location.hash.substring(1);
    window.location.href = '#' + (hash || 'login');
  };
  if(sid && app.Lock.attach({ fail: go, error: go, })) {
    app.socket.emit('relogin', {sid: sid});
    return;
  }
  go();
};

var onLogin = function(data) {
  if(data == null) { app.Lock.remove(); return; }
  
  app.Lock.removeLoading();
  if(data.err){
    app.isLogined = false;
    if(data.err == 'expired') {
      $.removeCookie('sid');
    }
    app.Lock.detach(data);
  } else {
    $.cookie('sid', data.sid, {expires: 7});
    
    $('#nav-user-name').text(data.user.name);
    $('#nav-avatar').attr('src', data.user.avatar);
    data.user.owner = data.user.online = true;
    app.currentUser = data.user;
    
    $('#ownedfileex>a').attr('href', '#index/' + name);
    $('#sharedfile>a').attr('href', '#index/shared@' + name);
    app.views.files.$tabOwnedEx.find('a.file-go').attr('href', '#index/' + data.user.name);
    app.views.files.$tabShared.find('a.file-go').attr('href', '#index/shared@' + data.user.name);
    
    app.isLogined = true;
    window.location.href = '#index//';
    
    app.Lock.detach(data);
    app.collections['files'].fetch({
      path: '/' + data.user.name,
      success: function() { app.views['files'].renewList(); },
      virtual: true,
    });
    data.doc = data.user;
    delete data.user;
    app.Lock.detach(data);
    delete data.doc.docs; /* avoid bad memory. */
  }
};

var onDownload = function(data) {
	var blob = new Blob([data.text], {type: "text/plain;charset=utf-8"});
	saveAs(blob, data.name);
};

var onDownzip = function(data) {
	paths = [];
	root = data.path;
	paths[root] = new JSZip();
	data = data.file;
	for (var i = 0; i < data.length; ++i) {
		var sts = data[i].path.split('/');
		var parent = '';
		for (var j = 1; j < sts.length - 1; ++j)
			parent += '/' + sts[j];
		if (parent.substring(0, root.length) != root)
			paths[parent] = paths[root].folder('share@'+app.currentUser.name+parent);
		if (data[i].type == 'dir') {
			paths[data[i].path] = paths[parent].folder(sts[sts.length - 1]);
		} else {
			paths[parent].file(sts[sts.length - 1], data[i].text);
		}
	}
	var content = paths[root].generate();
	$('#downloada').attr('href', "data:application/zip;base64," + content);
	var names = root.split('/');
	$('#downloada').attr('download', names[names.length - 1] + '.zip');
	
	var evt = document.createEvent("MouseEvents");
	evt.initEvent("click", true, true);
	document.getElementById('downloada').dispatchEvent(evt);
};

app.init || (app.init = {});

(function() {
  var _init = false;
  app.init.mainSocket = function() {
    if(_init) { return; } else { _init = true; }
    
    var socket = app.socket;
    socket.on('connect', function() { app.socket.emit('version', {}); } );
    socket.on('disconnect', function() { app.isLogined = false; } );
    socket.on('version', onVersion);
    socket.on('login', onLogin);
    socket.on('register', app.Lock.detach);
    socket.on('password', app.Lock.detach);
    socket.on('download', onDownload);
    socket.on('downzip', onDownzip);
  };
  
})();

})();
