var app = app || {};

/* socket 逻辑事件监听 */
(function() {

// 版本更新事件
var onVersion = function(data) {
	if (data.version != app.Package.VERSION) {
		window.location.reload(true);
	}
	if (app.Lock.getMessage() === 'pageIsLoading') { 
		app.Lock.detach(); 
	}
	else { 
		app.Lock.fail(); 
	}
	app.cleanLoading();

	// 重新登录请求
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

/* 重新登录事件 */
var onLogin = function(data) {
	if(data == null) { 
		app.Lock.remove(); 
		return; 
	}
  
	app.Lock.removeLoading();
	if(data.err){
		app.isLogined = false;
		if(data.err == 'expired') {
			$.removeCookie('sid');
    	}
    	app.Lock.detach(data);
	} else {
		$.cookie('sid', data.sid, {expires: 7});
    	
    	/*更新页面*/
		$('#nav-user-name').text(data.user.name);
		$('#nav-avatar').attr('src', data.user.avatar);
		data.user.owner = data.user.online = true;
		app.currentUser = data.user;
    
		$('#ownedfileex>a').attr('href', '#index/' + name);
		$('#sharedfile>a').attr('href', '#index/shared@' + name);
		app.views.files.$tabOwnedEx.find('a.file-go').attr('href', '#index/' + data.user.name);
		app.views.files.$tabShared.find('a.file-go').attr('href', '#index/shared@' + data.user.name);

		/*更新URL*/
		app.isLogined = true;
		window.location.href = '#index//';

		/*更新文件列表*/
		app.Lock.detach(data);
		app.collections['files'].fetch({
			path: '/' + data.user.name,
			success: function() { 
				app.views['files'].renewList(); 
			},
			virtual: true,
    	});
    	
    	/*释放资源*/
	    data.doc = data.user;
		delete data.user;
		app.Lock.detach(data);
		delete data.doc.docs;
	}
};

/* 下载事件处理 */
var onDownload = function(data) {
	// 新建HTTP头并使用HTML5 API存储下载文件
	var blob = new Blob([data.text], {type: "text/plain;charset=utf-8"});
	saveAs(blob, data.name);
};

/* 打包下载事件处理 */
var onDownzip = function(data) {
	paths = [];
	root = data.path;
	
	//打包根目录
	paths[root] = new JSZip();
	data = data.file;
	
	//依次加入文件列表
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
	
	//转换为HTTP Request
	var content = paths[root].generate();
	$('#downloada').attr('href', "data:application/zip;base64," + content);
	var names = root.split('/');
	$('#downloada').attr('download', names[names.length - 1] + '.zip');
	
	//伪造点击事件，使用HTML5 a.download 下载
	var evt = document.createEvent("MouseEvents");
	evt.initEvent("click", true, true);
	document.getElementById('downloada').dispatchEvent(evt);
};

app.init || (app.init = {});

/* 初始化socket逻辑事件监听 */
(function() {
	var _init = false;
	app.init.mainSocket = function() {
	    if (_init) { 
	    	return; 
		} else { 
    		_init = true; 
    	}
    
    	var socket = app.socket;
    	socket.on('connect', function() { app.socket.emit('version', {}); } );
    	socket.on('disconnect', function() { app.isLogined = false; } );
    	socket.on('version', onVersion);
    	socket.on('login', onLogin);
    	socket.on('register', app.Lock.detach);
    	socket.on('avatar', app.Lock.detach);
    	socket.on('password', app.Lock.detach);
    	socket.on('download', onDownload);
    	socket.on('downzip', onDownzip);
	};
  
})();

})();
