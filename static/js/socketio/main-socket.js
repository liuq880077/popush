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
		app.currentUser = data.user;
		$.cookie('sid', data.sid, {expires:7});

		$('#filecontrol').fadeIn('fast');
    
		var users = [];
		users.push(data.user);
		app.collections['members'].update(users);
    
    app.currentDirString = '/' + data.user.name;
    app.collections['files'].reset(data.user.docs);
    delete data.user.docs; /* avoid bad memory. */
    app.views['files'].show();

    $('#ownedfile>a').attr('href', '#/' + data.user.name);
    $('#sharedfile>a').attr('href', '#/shared@' + data.user.name).bind();
    
    window.location.href = '#/' + data.user.name;
    
    
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

app.main_socket = function() {
	app.socket.on('login', onLogin);
	app.socket.on('register', onRegister);
  //app.socket.on('login');
}

})();