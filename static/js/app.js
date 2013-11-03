var app = app || {};	//全局区域，管理MVC
var strings = strings || {};	//中英语言映射

/* 全局变量 */
_.defaults(app, {
	socket: io.connect(app.Package.SOCKET_IO),	//socket
	currentUser: null,							//用户信息
	isLogined: false,							//是否登录
	views: {},									//视图
	collections: {},							//集合
	fileNameReg: /[\*\\\|:\"\'\/\<\>\?\@]/,		//文件正则匹配
	fileExtReg: /(.*[\/\.])?\s*(\S+$)/,			//文件拓展匹配
	uploadType: /text|javascript/,				//上传类型
	router: null,								//路由
	resize: null, 								//调整大小函数
	/* 房间 */
	noVoice: false,								//支持语音
	inRoom: false,								//房间状态
});

/* 显示信息栏 */
app.showMessageBar = function(id, stringid, type) {
	var o = $(id);
	o.removeClass('alert-danger alert-success alert-info');
	(type == 'error') && (type = 'danger background-opacity');
	if(type && type != 'warning')
		o.addClass('alert-' + type);
	else
	o.addClass('alert-warning');
	(stringid == null) && (stringid = 'inner error');
	o.find('span').html(strings[stringid] || stringid);
	o.slideDown();
};

/* 显示输入模态对话框 */
app.showInputModal = function(modal, val) {
	modal.find('.form-group').removeClass('danger').find('input').val('');
	modal.find('.help-inline').text('');
	var i = modal.find('.modal-input').val(val || '');
	modal.modal('show').on('shown', function() {
		var ok = modal.find('.modal-confirm');
		i.focus().on('keydown', function(e) {
			var k = e.keyCode || e.which;
			if(k == 13) { 
				ok && ok.click();
			} 
			else if(k == 27) { 
				modal.modal('hide');
			}
    	});
  	});
};

/* 显示定时提示信息对话框 */
(function() {
	var modal = $('#messagedialog'), 
		$title = modal.find('#messagedialogLabel'),
    	$content = modal.find('#messagedialogContent');
  
	app.showMessageBox = function(title, content, timeout) {
		(title == null) && (title = 'error');
		(content == null) && (content = 'inner error');
		$title.html(strings[title] || title);
		$content.html(strings[content] || content);
		timeout || (timeout = 1000);
		modal.modal('show');
		window.setTimeout(function() { modal.modal('hide'); }, timeout);
	};
})();

/* 显示提示信息对话框 */
app.showMessageInDialog = function (selector, stringid, index) {
	var modal = $(selector),
	eq = (index == null) ? '' : (':eq(' + index + ')');
	modal.find('.form-group' + eq).addClass('danger');
	(stringid == null) && (stringid = 'inner error');
	modal.find('.help-inline' + eq).text(strings[stringid] || stringid);
}

/* 调整mainpage布局大小 */
app.resize = function() {
	var w;
	var h = $(window).height();
	if(h < 100)
		h = 100;
	var cbh = h-$('#member-list-doc').height()-158;
	w = $('#login-box').parent('*').width();
	$('#login-box').css('left', ((w-420)/2-30) + 'px');
	w = $('#register-box').parent('*').width();
	$('#register-box').css('left', ((w-420)/2-30) + 'px');
	
	var bottomHeight = document.getElementById("footer").clientHeight;
	var bigoneHeight = document.getElementById("big-one").clientHeight;
	$("#login").css("margin-bottom", bottomHeight + 20);
	$("#register").css("margin-bottom", bottomHeight + 20);
	$("#popush-info").css("margin-bottom", bottomHeight + 20);
	$("#filecontrol").css("margin-bottom", bottomHeight + 10);
	var marT = (bigoneHeight + 20) > 192 ? (bigoneHeight + 20) : 192;
	$("#login").css("margin-top", marT);
	$("#register").css("margin-top", marT);
	$("#popush-info").css("margin-top", bigoneHeight + 20);
	var topHeight = document.getElementById("nav-head").clientHeight;
	$('#filecontrol').css("margin-top", topHeight - 5);
	$('#editor').css("margin-top", topHeight + 5);
	$('#fullscreentip').css('left', (($(window).width()-$('#fullscreentip').width())/2) + 'px');
};

/* 登出 */
app.logout = function() {
	app.isLogined = false;
	$.removeCookie('sid');
	app.socket.emit('logout', { });
	window.location.href = '#login';
};

/* 初始化 */
$(document).ready(function() {
	//初始化锁
	app.Lock.attach({
		loading: '#login-control',
		tbegin: 0,
		tend: -1,
		data: 'pageIsLoading',
		fail: function() {
			app.failed = true;
			app.showMessageBar('login-message', 'loadfailed');
		},
	});

	$('body').show();
  
	//初始化视图、路由和集合
	var funcs = app.init;
	for(var i in funcs) {
		if(funcs.hasOwnProperty(i) && typeof funcs[i] === 'function') {
			funcs[i].call(app);
		}
	}
	delete funcs;
	delete app.init; /* now it's no use to run it again*/

	//初始化URL历史
	Backbone.history.start({ root: app.Package.ROUTE_ROOT });

	//设置页面调整回调函数
	$(window).resize(function() {
    	(typeof app.resize === 'function') && app.resize();
	});
});
