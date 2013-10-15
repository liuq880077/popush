var app = app || {};

function onLogin(data) {
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
		$('#ownedfile').show();
		$('#ownedfileex').hide();
		$('#sharedfile').removeClass('active');
		$('#share-manage-link').hide();
		$('#big-one').animate({height:'40px', padding:'0', 'margin-bottom':'20px'}, 'fast');
		$('#nav-head').fadeIn('fast');
		$('#login').hide();
		$('#editor').hide();
		$('#filecontrol').fadeIn('fast');
		$('#nav-user-name').text(data.user.name);
		$('#nav-avatar').attr('src', data.user.avatar);
		app.currentUser = data.user;
		$.cookie('sid', data.sid, {expires:7});

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
}
	
function onRegister(data) {
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
}

function main_socket() {
	app.socket.on('login', function(data){
		onLogin(data);
	});
	app.socket.on('register', function(data){
		view.onRegister(data);
	});
}
