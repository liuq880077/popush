var runLock = false;
var debugLock = false;
var waiting = false;

var runable = true;
//可运行的文件后缀名
var runableext = [
	'c', 'cpp', 'js', 'py', 'pl', 'rb', 'lua', 'java'
];

var debugable = true;
//可调式的文件后缀
var debugableext = [
	'c', 'cpp'
];

var cursors = {};

var docobj;

var lock = false;
var doc;
var q = [];
var timer = null;

//后缀
var ext;

var bq = [];
var bps = "";
var runningline = -1;

var consoleopen = false;

var old_text;
var old_bps;

q._push = q.push;
q.push = function(element) {
	this._push(element);
	setsaving();
}

q._shift = q.shift;
q.shift = function() {
	var r = this._shift();
	if(this.length == 0 && bufferfrom == -1){ // buffertext == "") {
		setsaved();
	}
	return r;
}

/* 返回当前文件是否能运行 */
function runenabled(){
	return (runable && !debugLock && (!issaving || runLock));
}

/* 返回当前文件是否能调试 */
function debugenabled(){
	return (debugable && !runLock && (!issaving || debugLock));
}

/* 设置运行和调试状态
 * 若可运行则显示运行框，否则隐藏
 * 若可调式则显示调试框，否则隐藏 */
function setrunanddebugstate(){
	$('#editor-run').removeClass('disabled');
	$('#editor-debug').removeClass('disabled');
	if(!runenabled())
		$('#editor-run').addClass('disabled');
	if(!debugenabled())
		$('#editor-debug').addClass('disabled');
}

var savetimestamp;
var issaving = false;
var savetimeout = 500;

/* 保存文件 */
function setsaving(){
	$('#current-doc-state').addClass('red');
	$('#current-doc-state').text(strings['saving...']);
	$('#editor-back').attr('title', '');
	$('#editor-back').popover({
		html: true,
		content: strings['unsaved'],
		placement: 'right',
		trigger: 'hover',
		container: 'body'
	});
	savetimestamp = 0;
	issaving = true;
	setrunanddebugstate();
}

/* 保存后操作 */
function setsaved(){
	savetimestamp = new Date().getTime();
	//5ms后调用setsavedthen
	setTimeout('setsavedthen(' + savetimestamp + ')', savetimeout);
	savetimeout = 500;
}

function setsavedthen(timestamp){
	if(savetimestamp == timestamp) {
		$('#current-doc-state').removeClass('red');
		$('#current-doc-state').text(strings['saved']);
		$('#editor-back').popover('destroy');
		$('#editor-back').attr('title', strings['back']);
		issaving = false;
		setrunanddebugstate();
	}
}

/* 给定后缀，判断是否为可运行文件类型 */
function isrunable(ext) {
	for(var i=0; i<runableext.length; i++) {
		if(runableext[i] == ext)
			return true;
	}
	return false;
}

/* 给定后缀，判断是否为可调试文件类型 */
function isdebugable(ext) {
	for(var i=0; i<debugableext.length; i++) {
		if(debugableext[i] == ext)
			return true;
	}
	return false;
}

function newcursor(content) {
	var cursor = $(
		'<div class="cursor">' +
			'<div class="cursor-not-so-inner">' +
				'<div class="cursor-inner">' +
					'<div class="cursor-inner-inner">' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>'
		).get(0);
	$(cursor).find('.cursor-inner').popover({
		html: true,
		content: '<b>' + content + '</b>',
		placement: 'bottom',
		trigger: 'hover'
	});
	return cursor;
}

function sendbreak(from, to, text){
	var req = {version:doc.version, from:from, to:to, text:text};
	if(bq.length == 0){
		socket.emit('bps', req);
	}
	bq.push(req);
}

/* 向cm的第n行添加断点 */
function addbreakpointat(cm, n){
	var addlen = n - bps.length;
	if (addlen > 0){
		var addtext = "";
		for (var i = bps.length; i < n-1; i++){
			addtext += "0";
		}
		addtext += "1";
		//bps += addtext;
		sendbreak(bps.length, bps.length, addtext);
	}
	else{
		//bps = bps.substr(0, n) + "1" + bps.substr(n+1);
		sendbreak(n, n+1, "1");
	}

	var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
	cm.setGutterMarker(n, 'breakpoints', element);
}

/* 删除cm第n行的断点 */
function removebreakpointat(cm, n){
	var info = cm.lineInfo(n);
	if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
		cm.setGutterMarker(n, 'breakpoints', null);
		//bps = bps.substr(0, n) + "0" + bps.substr(n+1);
		sendbreak(n, n+1, "0");
		return true;
	}
	return false;
}

/* 判断cm的第n行是否有断点 */
function havebreakat (cm, n) {
	var info = cm.lineInfo(n);
	if (info && info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
		return "1";
	}
	return "0";
}

/* 输入：文件名后缀
 * 检查该文件是否能运行，是否能调试，并复制给runable 和debugable */
function checkrunanddebug(ext) {
	if(app.Package.ENABLE_RUN) {
		runable = isrunable(ext);
	}
	if(app.Package.ENABLE_DEBUG) {
		debugable = isdebugable(ext);
		if(debugable) {
			gutterclick = function(cm, n) {
				if(debugLock && !waiting)
					return;
				if (!removebreakpointat(cm, n)){
					addbreakpointat(cm, n);
				}
			};
		} else {
			gutterclick = function(cm, n) { };
		}
		removeallbreakpoints();
	}
	setrunanddebugstate();
}

function runtoline(n) {
	if(runningline >= 0) {
		editor.removeLineClass(runningline, '*', 'running');
		editor.setGutterMarker(runningline, 'runat', null);
	}
	if(n >= 0) {
		editor.addLineClass(n, '*', 'running');
		editor.setGutterMarker(n, 'runat', $('<div><img src="images/arrow.png" width="16" height="16" style="min-width:16px;min-width:16px;" /></div>').get(0));
		editor.scrollIntoView({line:n, ch:0});
	}
	runningline = n;
}

/* 删除所有断点 */
function removeallbreakpoints() {
	for (var i = 0; i < bps.length; i++){
		if (bps[i] == "1"){
			var info = editor.lineInfo(i);
			if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
				editor.setGutterMarker(i, 'breakpoints', null);
			}
		}
	}
	bps.replace("1", "0");
}

/* 初始化断点 */
function initbreakpoints(bpsstr) {
	bps = bpsstr;
	for (var i = bpsstr.length; i < editor.lineCount(); i++){
		bps += "0";
	}
	for (var i = 0; i < bps.length; i++){
		if (bps[i] == "1"){
			var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
			editor.setGutterMarker(i, 'breakpoints', element);
		}
	}
}

var oldscrolltop = 0;

function openeditor(o) {
	if(operationLock)
		return;
	operationLock = true;
	filelist.loading();
	docobj = o;
	socket.emit('join', {
		path: o.path
	});
}

function closeeditor() {

	$('#editor').hide();
	$('#filecontrol').show();
	$('#footer').show();

	socket.emit('leave', {
	});

	refreshfilelist(function(){;}, function(){
		$("body").animate({scrollTop: oldscrolltop});
	});

	leaveVoiceRoom();
}

function chat() {
	var text = $('#chat-input').val();
	if(text == '')
		return;

	socket.emit('chat', {
		text: text
	});
	$('#chat-input').val('');
}

function stdin() {
	if(debugLock && waiting)
		return;

	var text = $('#console-input').val();

	if(runLock || debugLock) {
		socket.emit('stdin', {
			data: text + '\n'
		});
	} else {
		appendtoconsole(text + '\n', 'stdin');
	}

	$('#console-input').val('');
}

function saveevent(cm) {
	if(savetimestamp != 0)
		setsavedthen(savetimestamp);
	savetimestamp = 0;
}

/* 向聊天框添加内容 */
function appendtochatbox(name, type, content, time) {
	$('#chat-show-inner').append(
		'<p class="chat-element"><span class="chat-name ' + type +
		'">' + name + '&nbsp;&nbsp;' + time.toTimeString().substr(0, 8) + '</span><br />' + content + '</p>'
		);
	var o = $('#chat-show').get(0);
	o.scrollTop = o.scrollHeight;
}

/* 向控制台添加内容
 * content: 添加内容
 * type: class类型 */
function appendtoconsole(content, type) {
	if(type) {
		type = ' class="' + type + '"';
	} else {
		type = '';
	}
	$('#console-inner').append(
		'<span' + type + '">' + htmlescape(content) + '</span>'
	);
	var o = $('#console-inner').get(0);
	o.scrollTop = o.scrollHeight;
}

$(function() {

	expressionlist.renameExpression = function(id) {
		this.doneall();
		if(debugLock && !waiting)
			return;
		var input = this.elements[id].elem.find('input');
		var span = this.elements[id].elem.find('.title');
		var expression = span.text();
		span.hide();
		input.val($.trim(expression));
		input.show();
		input.focus();
		input.select();
		this.seteditingelem(id);
	};

	expressionlist.renameExpressionDone = function(id) {
		var input = this.elements[id].elem.find('input');
		var span = this.elements[id].elem.find('span');
		var expression = $.trim(input.val());
		
		if(debugLock && !waiting) {
			if(!this.elements[id].notnew) {
				this.elements[id].elem.remove();
				delete this.elements[id];
			} else {
				input.hide();
				span.show();
			}
		} else {
			if(this.elements[id].notnew) {
				socket.emit('rm-expr', {
					expr: this.elements[id].expression
				});
			}
			
			if(expression != '') {
				socket.emit('add-expr', {
					expr: expression
				});
			}

			this.elements[id].elem.remove();
			delete this.elements[id];
		}
		this.seteditingelem(null);
	};

	expressionlist.removeExpression = function(id) {
		this.doneall();
		socket.emit('rm-expr', {
			expr: this.elements[id].expression
		});
	};

});

socket.on('add-expr', function(data) {
	if(data.expr) {
		expressionlist.addExpression(data.expr);
		expressionlist.setValue(data.expr, data.val);
	}
});

socket.on('rm-expr', function(data) {
	expressionlist.removeElementByExpression(data.expr);
});

/* 收到"chat"命令
 * 在chatroom中添加新内容 */
socket.on('chat', function(data) {
	var text = htmlescape(data.text);

	var time = new Date(data.time);
	
	appendtochatbox(data.name, (data.name == currentUser.name?'self':''), text, time);
});

socket.on('deleted', function(data) {
	closeeditor();
	showmessagebox('info', 'deleted', 1);
});

socket.on('unshared', function(data) {
	if(data.name == currentUser.name) {
		closeeditor();
		showmessagebox('info', 'you unshared', 1);
	} else {
		memberlistdoc.remove(data.name);
		appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['unshared'], new Date(data.time));
	}
});

socket.on('shared', function(data) {
	memberlistdoc.add(data);
	memberlistdoc.setonline(data.name, false);
	memberlistdoc.sort();
	appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['gotshared'], new Date(data.time));
});

socket.on('moved', function(data) {
	var thepath = data.newPath.split('/');
	thepath.shift();
	var thename;
	var realname;
	if(dirMode == 'owned') {
		realname = thename = thepath.pop();
		currentDir = thepath;
	} else {
		var name = currentDir.shift();
		if(thepath.length == 2) {
			thename = thepath[1] + '@' + thepath[0];
			realname = thepath[1];
			currentDir = [];
		} else {
			realname = thename = thepath.pop();
			thepath.unshift(thepath.shift() + '/' + thepath.shift());
			currentDir = thepath;
		}
		currentDir.unshift(name);
	}
	var filepart = realname.split('.');
	
	ext = filepart[filepart.length - 1];
	changelanguage(ext);
	checkrunanddebug(ext);
	
	appendtochatbox(strings['systemmessage'], 'system', strings['movedto'] + thename, new Date(data.time));
	$('#current-doc').html(htmlescape(thename));
});

/* 离开语音聊天室 */
function leaveVoiceRoom(){
	while(window.userArray.length > 0){
		$(window.audioArray[window.userArray.shift()]).remove();
	}
	while(window.peerUserArray.length > 0){
		var peerUName = window.peerUserArray.shift();
		if(window.peerArray[peerUName]){
			window.peerArray[peerUName].myOnRemoteStream = function (stream){
				stream.mediaElement.muted = true;
				return;
			};
		}
	}
	if(!window.joinedARoom){
		return;
	}
	$('#voice-on').removeClass('active');
	window.voiceConnection.myLocalStream.stop();
	window.voiceConnection.leave();
	delete window.voiceConnection;
}

function voice() {
	if(novoice)
		return;
	if(window.voiceLock){
		return;
	}
	window.voiceLock = true;
	window.voiceon = !window.voiceon;
	if(window.voiceon) {
		if(window.joinedARoom){
			return;
		}
		$('#voice-on').addClass('active');
		try{
			var username = $('#nav-user-name').html();
			var dataRef = new Firebase('https://popush.firebaseIO.com/' + doc.id);
			dataRef.once('value',function(snapShot){
				delete dataRef;
				if (snapShot.val() == null){
					var connection = new RTCMultiConnection(doc.id);
					window.voiceConnection = connection;
					connection.session = "audio-only";
					connection.autoCloseEntireSession = true;

					connection.onstream = function (stream) {
						if ((stream.type == 'remote') && (stream.extra.username != username)) {
							stream.mediaElement.style.display = "none";
							stream.mediaElement.muted = false;
							stream.mediaElement.play();
							document.body.appendChild(stream.mediaElement);
							window.userArray.push(stream.extra.username);
							window.audioArray[stream.extra.username] = stream.mediaElement;
						}
					};
					connection.onUserLeft = function(userid, extra, ejected) {
						$(window.audioArray[extra.username]).remove();
						if(window.peerArray[extra.username]){
							window.peerArray[extra.username].myOnRemoteStream = function (stream){
								stream.mediaElement.muted = true;
								return;
							};
						}
					};
					connection.connect();
					
					connection.open({
						extra: {
							username: username
						},
						interval: 1000
					});
				}
				else{
					var connection = new RTCMultiConnection(doc.id);
					window.voiceConnection = connection;
					connection.session = "audio-only";
					connection.autoCloseEntireSession = true;
					
					connection.onNewSession = function (session){
						if(window.joinedARoom){
							return;
						}
						connection.join(session, {
							username: username
						});
					};
					connection.onstream = function (stream) {
						if ((stream.type == 'remote') && (stream.extra.username != username)) {
							stream.mediaElement.style.display = "none";
							stream.mediaElement.muted = false;
							stream.mediaElement.play();
							window.userArray.push(stream.extra.username);
							window.audioArray[stream.extra.username] = stream.mediaElement;
							document.body.appendChild(stream.mediaElement);
						}
					};
					connection.onUserLeft = function(userid, extra, ejected) {
						if(ejected){
							$('#voice-on').removeClass('active');
							while(window.userArray.length > 0){
								$(window.audioArray[window.userArray.shift()]).remove();
							}
							while(window.peerUserArray.length > 0){
								var peerUName = window.peerUserArray.shift();
								if(window.peerArray[peerUName]){
									window.peerArray[peerUName].myOnRemoteStream = function (stream){
										stream.mediaElement.muted = true;
										return;
									};
								}
							}
							delete window.voiceConnection;
							window.voiceon = !window.voiceon;
						}
						else{
							$(window.audioArray[extra.username]).remove();
							if(window.peerArray[extra.username]){
								window.peerArray[extra.username].myOnRemoteStream = function (stream){
									stream.mediaElement.muted = true;
									return;
								};
							}
						}
					};
					connection.connect();
				}
			});
		}
		catch(err){
			alert(err);
		}
	} else {
		leaveVoiceRoom();
	}
}

/* 运行文件 */
function run() {
	if(!runenabled())
		return;
	if(operationLock)
		return;
	operationLock = true;
	if(runLock) {
		socket.emit('kill');
	} else {
		socket.emit('run', {
			version: doc.version,
			type: ext
		});
	}
}

/* 设置运行时的界面 */
function setrun() {
	runLock = true;
	$('#editor-run').html('<i class="icon-stop"></i>');
	$('#editor-run').attr('title', strings['kill-title']);
	$('#console-inner').html('');
	$('#console-input').val('');
	$('#editor-debug').addClass('disabled');
	$('#console-title').text(strings['console']);
	openconsole();
}

/* 调试 */
function debug() {
	if(!debugenabled())
		return;
	if(operationLock)
		return;
	operationLock = true;
	if(debugLock) {
		socket.emit('kill');
	} else {
		socket.emit('debug', {
			version: doc.version,
			type: ext
		});
	}
}

/* 设置调试的界面 */
function setdebug() {
	debugLock = true;
	$('#editor-debug').html('<i class="icon-eye-close"></i>');
	$('#editor-debug').attr('title', strings['stop-debug-title']);
	$('#console-inner').html('');
	$('#console-input').val('');
	$('#editor-run').addClass('disabled');
	$('#console-title').text(strings['console']);
	openconsole();
}

/////////////////////// debug //////////////////////////////////
function debugstep() {
	if(debugLock && waiting) {
		socket.emit('step', {
		});
	}
}

function debugnext() {
	if(debugLock && waiting) {
		socket.emit('next', {
		});
	}
}

function debugfinish() {
	if(debugLock && waiting) {
		socket.emit('finish', {
		});
	}
}

function debugcontinue() {
	if(debugLock && waiting) {
		socket.emit('resume', {
		});
	}
}

////////////////////// console /////////////////////////////////
function toggleconsole() {
	if(consoleopen) {
		closeconsole();
	} else {
		openconsole();
	}
}

function closeconsole() {
	if(!consoleopen)
		return;
	consoleopen = false;
	$('#under-editor').hide();
	$('#editor-console').removeClass('active');
	resize();
}

function openconsole() {
	if(!consoleopen) {
		consoleopen = true;
		$('#under-editor').show();
		$('#editor-console').addClass('active');
		resize();
	}
	$('#console-input').focus();
}

/////////////////////// other //////////////////////////////////
function resize() {
	var w;
	var h = $(window).height();
	if(h < 100)
		h = 100;
	var cbh = h-$('#member-list-doc').height()-138;
	var cbhexp = cbh > 100 ? 0 : 100 - cbh;
	if(cbh < 100)
		cbh = 100;
	$('#chat-show').css('height', cbh + 'px');
	$('#chatbox').css('height', (h-83+cbhexp) + 'px');
	w = $('#editormain').parent().width();
	$('#editormain').css('width', w);
	var underh = h > 636 ? 212 : h/3;
	if(!consoleopen)
		underh = 0;
	$('#under-editor').css('height', underh + 'px');
	$('#console').css('width', (w-w/3-2) + 'px');
	$('#varlist').css('width', (w/3-1) + 'px');
	$('#console').css('height', (underh-12) + 'px');
	$('#varlist').css('height', (underh-12) + 'px');
	$('#varlistreal').css('height', (underh-42) + 'px');
	$('#console-inner').css('height', (underh-81) + 'px');
	$('#console-input').css('width', (w-w/3-14) + 'px');
	if(!isFullScreen(editor))
		$('.CodeMirror').css('height', (h-underh-$('#over-editor').height()-90) + 'px');

	w = $('#chat-show').width();
	if(w != 0)
		$('#chat-input').css('width', (w-70) + 'px');
	
	$('#file-list .span10').css('min-height', (h-235) + 'px');
	
	w = $('#login-box').parent('*').width();
	$('#login-box').css('left', ((w-420)/2-30) + 'px');
	w = $('#register-box').parent('*').width();
	$('#register-box').css('left', ((w-420)/2-30) + 'px');
	$('#fullscreentip').css('left', (($(window).width()-$('#fullscreentip').width())/2) + 'px');

	$('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');

	editor.refresh();
}

///////////////////// websocket & callback //////////////////////
socket.on('run', function(data){
	appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;&nbsp;' + strings['runsaprogram'], new Date(data.time));
	setrun();
	operationLock = false;
});

socket.on('debug', function(data){
	appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;&nbsp;' + strings['startdebug'], new Date(data.time));
	
	setdebug();

	editor.setOption('readOnly', true);
	old_text = editor.getValue();
	old_bps = bps;
	editor.setValue(data.text);
	removeallbreakpoints();
	initbreakpoints(data.bps);

	var editordoc = editor.getDoc();
	var hist = editordoc.getHistory();
	hist.done.pop();
	editordoc.setHistory(hist);

	operationLock = false;
});

socket.on('running', function(data){
	if(!debugLock)
		return;
	waiting = false;
	runtoline(-1);
	$('.debugandwait').addClass('disabled');
	$('#console-title').text(strings['console']);
});

socket.on('waiting', function(data){
	if(!debugLock)
		return;
	waiting = true;
	if(typeof data.line === 'number'){
		runtoline(data.line - 1);
	}else{
		runtoline(-1);
	}
	for(var k in data.exprs) {
		expressionlist.setValue(k, data.exprs[k]);
	}
	$('.debugandwait').removeClass('disabled');
	if(typeof data.line === 'number')
		$('#console-title').text(strings['console'] + strings['waiting']);
	else if(data.line !== null)
		$('#console-title').text(strings['console'] + strings['waiting'] + '[' + data.line + ']');
	else
		$('#console-title').text(strings['console'] + strings['waiting'] + strings['nosource']);
});

socket.on('stdout', function(data){
	appendtoconsole(data.data);
});

socket.on('stdin', function(data){
	appendtoconsole(data.data, 'stdin');
});

socket.on('stderr', function(data){
	appendtoconsole(data.data, 'stderr');
});

/* exit debugging */
socket.on('exit', function(data){
	operationLock = false;

	if(data.err.code !== undefined)
		appendtochatbox(strings['systemmessage'], 'system', strings['programfinish'] + '&nbsp;' + data.err.code, new Date(data.time));
	else
		appendtochatbox(strings['systemmessage'], 'system', strings['programkilledby'] + '&nbsp;' + data.err.signal, new Date(data.time));

	if(runLock) {
		$('#editor-run').html('<i class="icon-play"></i>');
		$('#editor-run').attr('title', strings['run-title']);
		runLock = false;
	}
	if(debugLock) {
		editor.setValue(old_text);
		removeallbreakpoints();
		initbreakpoints(old_bps);

		var editordoc = editor.getDoc();
		var hist = editordoc.getHistory();
		hist.done.pop();
		editordoc.setHistory(hist);

		editor.setOption('readOnly', false);	
		if(q.length > 0){
			socket.emit('change', q[0]);
		}
		$('#editor-debug').html('<i class="icon-eye-open"></i>');
		$('#editor-debug').attr('title', strings['debug-title']);
		runtoline(-1);
		for(var k in expressionlist.elements) {
			expressionlist.setValue(expressionlist.elements[k].expression, null);
		}
		debugLock = false;
	}
	setrunanddebugstate();
	$('#console-title').text(strings['console'] + strings['finished']);
});

/* 新用户加入协同编程 */
socket.on('join', function(data){
	if(data.err) {
		showmessageindialog('openeditor', data.err);
		$('#editor').slideUp('fast');
		$('#filecontrol').slideDown('fast');
	} else {
		memberlistdoc.setonline(data.name, true);
		memberlistdoc.sort();
		appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['join'], new Date(data.time));
		var cursor = newcursor(data.name);
		if(cursors[data.name] && cursors[data.name].element)
			$(cursors[data.name].element).remove();
		cursors[data.name] = { element:cursor, pos:0 };
	}
});

/* 某用户离开 */
socket.on('leave', function(data){
	memberlistdoc.setonline(data.name, false);
	memberlistdoc.sort();
	appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['leave'], new Date(data.time));
	if(cursors[data.name]) {
		if(cursors[data.name].element)
			$(cursors[data.name].element).remove();
		delete cursors[data.name];
	}
});

socket.on('set', function(data){
	
	savetimestamp = 1;
	setsavedthen(1);

	q.length = 0;
	bq.length = 0;
	lock = false;

	$('#editor-run').html('<i class="icon-play"></i>');
	$('#editor-run').attr('title', strings['run-title']);
	runLock = false;
	debugLock = false;
	waiting = false;

	$('#current-doc').html(htmlescape(docobj.shownName));
	$('#chat-input').val('');
	$('#chat-show-inner').text('');
	$('#editor').show();
	$('#filecontrol').hide();
	$('#footer').hide();
	var filepart = docobj.name.split('.');
	ext = filepart[filepart.length - 1];
	changelanguage(ext);
	checkrunanddebug(ext);

	editor.refresh();
	
	if(currentDir.length == 1) {
		memberlistdoc.fromdoc(docobj);
	}
	memberlistdoc.setalloffline();
	memberlistdoc.setonline(currentUser.name, true);

	for(var k in cursors) {
		$(cursors[k].element).remove();
	}

	cursors = {};
	
	oldscrolltop = $('body').scrollTop();
	
	window.voiceon = false;
	window.voiceLock = false;
	window.userArray = [];
	window.audioArray = {};
	window.joinedARoom = false;
	window.peerArray = {};
	window.peerUserArray = [];

	$('#voice-on').removeClass('active');
	
	operationLock = false;

	lock = true;
	doc = data;
	editor.setValue(doc.text);
	editor.clearHistory();
	editor.setOption('readOnly', false);
	initbreakpoints(data.bps);
	for(var i in data.users) {
		memberlistdoc.setonline(i, true);
		if(i == currentUser.name)
			continue;
		var cursor = newcursor(i);
		if(cursors[i] && cursors[i].element)
			$(cursors[i].element).remove();
		cursors[i] = { element:cursor, pos:0 };
	}
	memberlistdoc.sort();

	filelist.removeloading();
	$('#console-inner').html('');
	closeconsole();
	expressionlist.clear();
	for(var k in data.exprs) {
		expressionlist.addExpression(k);
		expressionlist.setValue(k, data.exprs[k]);
	}
	
	$('#console-title').text(strings['console']);
	
	resize();
	$('body').scrollTop(99999);
	
	if(data.running) {
		setrun();
	}
	if(data.debugging) {
		setdebug();
		editor.setOption('readOnly', true);
		old_text = data.text;
		old_bps = data.bps;
		if(data.state == 'waiting') {
			waiting = true;
			runtoline(data.line - 1);
			$('.debugandwait').removeClass('disabled');
			if(data.line !== null)
				$('#console-title').text(strings['console'] + strings['waiting']);
			else
				$('#console-title').text(strings['console'] + strings['waiting'] + strings['nosource']);
		}
	}
	setrunanddebugstate();

	delete data.running;
	delete data.debugging;
	delete data.state;
});

socket.on('ok', function(data){
	var chg = q.shift();
	if(!chg)
		return;
	doc.text = doc.text.substr(0, chg.from) + chg.text + doc.text.substr(chg.to);
	doc.version++;
	doc.version = doc.version % 65536;
	for(var i = 0; i < q.length; i++){
		q[i].version++;
		q[i].version = q[i].version % 65536;
	}
	for(var i = 0; i < bq.length; i++){
		bq[i].version++;
		bq[i].version = bq[i].version % 65536;
	}
	if(q.length > 0){
		socket.emit('change', q[0]);
	}
	if (bq.length > 0){
		socket.emit('bps', bq[0]);
	}
});

socket.on('bpsok', function(data){
	var chg = bq.shift();
	if (!chg)
		return;
	bps = bps.substr(0, chg.from) + chg.text + bps.substr(chg.to);
	if(debugLock)
		old_bps = old_bps.substr(0, chg.from) + chg.text + old_bps.substr(chg.to);
	doc.version++;
	doc.version = doc.version % 65536;
	for(var i = 0; i < q.length; i++){
		q[i].version++;
		q[i].version = q[i].version % 65536;
	}
	for(var i = 0; i < bq.length; i++){
		bq[i].version++;
		bq[i].version = bq[i].version % 65536;
	}
	if(q.length > 0){
		socket.emit('change', q[0]);
	}
	if (bq.length > 0){
		socket.emit('bps', bq[0]);
	}
});

socket.on('bps', function(data){
	var tfrom = data.from;
	var tto = data.to;
	var ttext = data.text;
	for (var i = 0; i < bq.length; i++){
		if (bq[i].to <= tfrom){
			tfrom += bq[i].text.length + bq[i].from - bq[i].to;
			tto += bq[i].text.length + bq[i].from - bq[i].to;
		}
		else if (bq[i].to <= tto && bq[i].from <= tfrom){
			var tdlen = tto - bq[i].to;
			bq[i].to = tfrom;
			tfrom = bq[i].from + bq[i].text.length;
			tto = tfrom + tdlen;
		}
		else if (bq[i].to <= tto && bq[i].from > tfrom){
			tto = tto + bq[i].text.length + bq[i].from - bq[i].to;
			ttext = bq[i].text + ttext;
			bq[i].from = tfrom;
			bq[i].to = tfrom;					
		}
		else if (bq[i].to > tto && bq[i].from <= tfrom){
			var bqlen = bq[i].text.length;
			//q[i].to = q[i].to + ttext.length + tfrom - tto;
			bq[i].to = bq[i].to + ttext.length + tfrom - tto;
			bq[i].text = bq[i].text + ttext;
			tfrom = bq[i].from + bqlen;
			tto = tfrom;
		}
		else if (bq[i].to > tto && bq[i].from <= tto){
			var bqdlen = bq[i].to - tto;
			tto = bq[i].from;
			bq[i].from = tfrom + ttext.length;
			bq[i].to = bq[i].from + bqdlen;
		}
		else if (bq[i].from > tto){
			bq[i].from += ttext.length + tfrom - tto;
			bq[i].to += ttext.length + tfrom - tto;
		}
		bq[i].version++;
		bq[i].version = bq[i].version % 65536;
	}
	for (var i = 0; i < q.length; i++){
		q[i].version++;
		q[i].version = q[i].version % 65536;
	}
	bps = bps.substr(0, data.from) + data.text + bps.substr(data.to);
	if(debugLock)
		old_bps = old_bps.substr(0, data.from) + data.text + old_bps.substr(data.to);
	if (data.to == data.from + 1){
		if (data.text == "1"){
			var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
			editor.setGutterMarker(data.from, 'breakpoints', element);
		}
		else if (data.text == "0"){
			var info = editor.lineInfo(data.from);
			if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
				editor.setGutterMarker(data.from, 'breakpoints', null);
			}
		}
	}
	doc.version++;
	doc.version = doc.version % 65536;
	if(bq.length > 0){
		socket.emit('bps', bq[0]);
	}
});

socket.on('change', function(data){
	lock = true;
	var tfrom = data.from;
	var tto = data.to;
	var ttext = data.text;
	for (var i = 0; i < q.length; i++){
		if (q[i].to <= tfrom){
			tfrom += q[i].text.length + q[i].from - q[i].to;
			tto += q[i].text.length + q[i].from - q[i].to;
		}
		else if (q[i].to <= tto && q[i].from <= tfrom){
			var tdlen = tto - q[i].to;
			q[i].to = tfrom;
			tfrom = q[i].from + q[i].text.length;
			tto = tfrom + tdlen;
		}
		else if (q[i].to <= tto && q[i].from > tfrom){
			tto = tto + q[i].text.length + q[i].from - q[i].to;
			ttext = q[i].text + ttext;
			q[i].from = tfrom;
			q[i].to = tfrom;					
		}
		else if (q[i].to > tto && q[i].from <= tfrom){
			var qlen = q[i].text.length;
			//q[i].to = q[i].to + ttext.length + tfrom - tto;
			q[i].to = q[i].to + ttext.length + tfrom - tto;
			q[i].text = q[i].text + ttext;
			tfrom = q[i].from + qlen;
			tto = tfrom;
		}
		else if (q[i].to > tto && q[i].from <= tto){
			var qdlen = q[i].to - tto;
			tto = q[i].from;
			q[i].from = tfrom + ttext.length;
			q[i].to = q[i].from + qdlen;
		}
		else if (q[i].from > tto){
			q[i].from += ttext.length + tfrom - tto;
			q[i].to += ttext.length + tfrom - tto;
		}
		q[i].version++;
		q[i].version = q[i].version % 65536;
	}
	for (var i = 0; i < bq.length; i++){
		bq[i].version++;
		bq[i].version = bq[i].version % 65536;
	}
	if (bufferfrom != -1){
		if (bufferto == -1){
			if (bufferfrom <= tfrom){
				tfrom += buffertext.length;
				tto += buffertext.length;
			}
			else if (bufferfrom <= tto){
				tto += buffertext.length;
				ttext = buffertext + ttext;
				bufferfrom = tfrom;
			}
			else {
				bufferfrom += ttext.length + tfrom - tto;
			}
		}
		else{
			if (bufferto <= tfrom){
				tfrom += bufferfrom - bufferto;
				tto += bufferfrom - bufferto;
			}
			else if (bufferto <= tto && bufferfrom <= tfrom){
				var tdlen = tto - bufferto;
				bufferto = tfrom;
				tfrom = bufferfrom;
				tto = tfrom + tdlen;
			}
			else if (bufferto <= tto && bufferfrom > tfrom){
				tto = tto + bufferfrom - bufferto;
				bufferfrom = -1;
				bufferto = -1;					
			}
			else if (bufferto > tto && bufferfrom <= tfrom){
				bufferto = bufferto + ttext.length + tfrom - tto;
				buffertext = buffertext + ttext;
				tfrom = bufferfrom;
				tto = tfrom;
			}
			else if (bufferto > tto && bufferfrom <= tto){
				var qdlen = bufferto - tto;
				tto = bufferfrom;
				bufferfrom = tfrom + ttext.length;
				bufferto = bufferfrom + qdlen;
			}
			else if (bufferfrom > tto){
				bufferfrom += ttext.length + tfrom - tto;
				bufferto += ttext.length + tfrom - tto;
			}
		}
	}
	var delta = tfrom + ttext.length - tto;
	var editorDoc = editor.getDoc();
	var hist = editorDoc.getHistory();
	var donefrom = new Array(hist.done.length);
	var doneto = new Array(hist.done.length);
	for (var i = 0; i < hist.done.length; i++) {
		donefrom[i] = editor.indexFromPos(hist.done[i].changes[0].from);
		doneto[i] = editor.indexFromPos(hist.done[i].changes[0].to);
	}
	var undonefrom = new Array(hist.undone.length);
	var undoneto = new Array(hist.undone.length);
	for (var i = 0; i < hist.undone.length; i++) {
		undonefrom[i] = editorDoc.indexFromPos(hist.undone[i].changes[0].from);
		undoneto[i] = editorDoc.indexFromPos(hist.undone[i].changes[0].to);
	}
	for (var i = 0; i < hist.done.length; i++){
		if (doneto[i] <= tfrom){
		}
		else if (doneto[i] <= tto && donefrom[i] <= tfrom){
			hist.done[i].changes[0].to = editor.posFromIndex(tfrom);
			//doneto[i] = tfrom;
		}
		else if (doneto[i] <= tto && donefrom[i] > tfrom){
			hist.done[i].changes[0].from = editor.posFromIndex(tfrom);
			hist.done[i].changes[0].to = editor.posFromIndex(tfrom);					
		}
	}
	for (var i = 0; i < hist.undone.length; i++){
		if (undoneto[i] <= tfrom){
		}
		else if (undoneto[i] <= tto && undonefrom[i] <= tfrom){
			hist.undone[i].changes[0].to = editor.posFromIndex(tfrom);
			//undoneto[i] = tfrom;
		}
		else if (undoneto[i] <= tto && undonefrom[i] > tfrom){
			hist.undone[i].changes[0].from = editor.posFromIndex(tfrom);
			hist.undone[i].changes[0].to = editor.posFromIndex(tfrom);					
		}
	}
	//var cursor = editorDoc.getCursor();
	//var curfrom = editor.indexFromPos(cursor);
	editor.replaceRange(ttext, editor.posFromIndex(tfrom), editor.posFromIndex(tto));
	//if (curfrom == tfrom){
	//	editorDoc.setCursor(cursor);
	//}
	for (var i = 0; i < hist.done.length; i++){
		if (doneto[i] <= tfrom){
		}
		else if (doneto[i] <= tto && donefrom[i] <= tfrom){					
		}
		else if (doneto[i] <= tto && donefrom[i] > tfrom){		
		}
		else if (doneto[i] > tto && donefrom[i] <= tfrom){
			hist.done[i].changes[0].to = editor.posFromIndex(doneto[i] + delta);
			/*var arr = ttext.split("\n");
			hist.done[i].changes[0].text[hist.done[i].changes[0].text.length-1] += arr[0];
			arr.shift();
			if (arr.length > 0)
				hist.done[i].changes[0].text = hist.done[i].changes[0].text.concat(arr);*/
		}				
		else if (doneto[i] > tto && donefrom[i] <= tto){
			hist.done[i].changes[0].from = editor.posFromIndex(tfrom + ttext.length);
			hist.done[i].changes[0].to = editor.posFromIndex(donefrom[i] + doneto[i] - tto);
		}
		else if (donefrom[i] > tto){
			hist.done[i].changes[0].from = editor.posFromIndex(donefrom[i] + ttext.length + tfrom - tto);
			hist.done[i].changes[0].to = editor.posFromIndex(doneto[i] + ttext.length + tfrom - tto);
		}
	}
	for (var i = 0; i < hist.undone.length; i++){
		if (undoneto[i] <= tfrom){
		}
		else if (undoneto[i] <= tto && undonefrom[i] <= tfrom){					
		}
		else if (undoneto[i] <= tto && undonefrom[i] > tfrom){		
		}
		else if (undoneto[i] > tto && undonefrom[i] <= tfrom){
			hist.undone[i].changes[0].to = editor.posFromIndex(undoneto[i] + delta);
			/*var arr = ttext.split("\n");
			hist.undone[i].changes[0].text[hist.undone[i].changes[0].text.length-1] += arr[0];
			arr.shift();
			if (arr.length > 0)
				hist.undone[i].changes[0].text = hist.undone[i].changes[0].text.concat(arr);*/
		}				
		else if (undoneto[i] > tto && undonefrom[i] <= tto){
			hist.undone[i].changes[0].from = editor.posFromIndex(tfrom + ttext.length);
			hist.undone[i].changes[0].to = editor.posFromIndex(undonefrom[i] + undoneto[i] - tto);
		}
		else if (undonefrom[i] > tto){
			hist.undone[i].changes[0].from = editor.posFromIndex(undonefrom[i] + ttext.length + tfrom - tto);
			hist.undone[i].changes[0].to = editor.posFromIndex(undoneto[i] + ttext.length + tfrom - tto);
		}
	}
	for (var i = 0; i < hist.done.length; i++){
		hist.done[i].anchorAfter = hist.done[i].changes[0].from;
		hist.done[i].anchorBefore = hist.done[i].changes[0].from;
		hist.done[i].headAfter = hist.done[i].changes[0].from;
		hist.done[i].headBefore = hist.done[i].changes[0].from;
	}
	for (var i = 0; i < hist.undone.length; i++){
		hist.undone[i].anchorAfter = hist.undone[i].changes[0].from;
		hist.undone[i].anchorBefore = hist.undone[i].changes[0].from;
		hist.undone[i].headAfter = hist.undone[i].changes[0].from;
		hist.undone[i].headBefore = hist.undone[i].changes[0].from;
	}
	editorDoc.setHistory(hist);
	doc.text = doc.text.substr(0, data.from) + data.text + doc.text.substr(data.to);
	doc.version++;
	doc.version = doc.version % 65536;
	if(q.length > 0){
		socket.emit('change', q[0]);
	}
	
	var pos = editor.posFromIndex(data.from + data.text.length);
	cursors[data.name].pos = data.from + data.text.length;
	editor.addWidget(pos, cursors[data.name].element, false);
});

var buffertext = "";
var bufferfrom = -1;
var bufferto = -1;
var buffertimeout = SAVE_TIME_OUT;

/* 发送前端修改内容到后台
 * bufferfrom:修改内容的起始位置
 * bufferto:修改内容的终止位置
 * buffertext:修改内容
 * buffertimeout:发送buffer等待时间，超过这个时间没有输入则发送buffer */

function sendbuffer(){
	if (bufferfrom != -1) {
		if (bufferto == -1){
			var req = {version:doc.version, from:bufferfrom, to:bufferfrom, text:buffertext};
			if(q.length == 0){
				socket.emit('change', req);
			}
			q.push(req);
			buffertext = "";
			bufferfrom = -1;
		}
		else {
			var req = {version:doc.version, from:bufferfrom, to:bufferto, text:buffertext};
			if(q.length == 0){
				socket.emit('change', req);
			}
			q.push(req);
			bufferfrom = -1;
			bufferto = -1;
		}
		buffertimeout = SAVE_TIME_OUT;
	}
}

/* 保存修改内容 */
function save(){
	setsaving();
	if (timer != null){
		clearTimeout(timer);
	}
	timer = setTimeout("sendbuffer()", buffertimeout);
}

function registereditorevent() {
	
	CodeMirror.on(editor.getDoc(), 'change', function(editorDoc, chg){

		//console.log(chg);

		if(debugLock){
			return true;
		}

		if(lock){
			lock = false;
			return true;
		}

		var cfrom = editor.indexFromPos(chg.from);
		var cto = editor.indexFromPos(chg.to);
		var removetext = "";
		for (var i = 0; i < chg.removed.length - 1; i++){
			removetext += chg.removed[i] + '\n';
		}
		removetext += chg.removed[chg.removed.length - 1];
		cto = cfrom + removetext.length;
		var cattext = "";
		for (var i = 0; i < chg.text.length - 1; i++){
			cattext += chg.text[i] + '\n';
		}
		cattext += chg.text[chg.text.length - 1];

		var delta = cfrom + cattext.length - cto;

		for (var k in cursors){
			if (cto <= cursors[k].pos){
				cursors[k].pos += delta;
				editor.addWidget(editor.posFromIndex(cursors[k].pos), cursors[k].element, false);
			}
			else if (cfrom < cursors[k].pos) {
				cursors[k].pos = cfrom + cattext.length;
				editor.addWidget(editor.posFromIndex(cursors[k].pos), cursors[k].element, false);
			}
		}
		
		/*if (cfrom == cto && 
			(cfrom == bufferfrom + buffertext.length || bufferfrom == -1)
			&& cattext.length == 1 && 
			((cattext[0] >= 'a' && cattext[0] <= 'z') || (cattext[0] >= 'A' && cattext[0] <= 'Z') ||
			(cattext[0] >= '0' && cattext[0] <= '9'))){
			if (bufferfrom == -1){
				buffertext = cattext;
				bufferfrom = cfrom;
			}
			else {
				buffertext += cattext;
			}
			save();
			return;
		}*/
		var bfrom = chg.from.line;
		var bto = chg.to.line;

		if (chg.text.length != (bto-bfrom+1)){
			sendbuffer();
			var req = {version:doc.version, from:cfrom, to:cto, text:cattext};
			if(q.length == 0){
				socket.emit('change', req);
			}
			q.push(req);
			var btext = "";
			for (var i = 0; i < chg.text.length; i++){
				btext += havebreakat(editor, bfrom + i);
			}
			/*
			if (chg.text[0] == "")
				btext = havebreakat(editor, bfrom);
			//var btext = "";
			for (var i = 0; i < chg.text.length - 2; i++){
				btext += "0";
			}
			btext[btext.length-1] = bps[bto];*/
			sendbreak(bfrom, bto+1, btext);
			return;
		}
		if (chg.text.length > 1){
			buffertimeout = buffertimeout / 2;
		}
		if (bufferto == -1 && cfrom == cto &&
			(cfrom ==  bufferfrom + buffertext.length ||  bufferfrom == -1)){
			if (bufferfrom == -1){
				buffertext = cattext;
				bufferfrom = cfrom;
			}
			else {
				buffertext += cattext;
			}
			save();
			return;
		}
		else if (bufferto == -1 && chg.origin == "+delete" &&
			bufferfrom != -1 && cto == bufferfrom + buffertext.length && cfrom >= bufferfrom){
			buffertext = buffertext.substr(0, cfrom - bufferfrom);
			if (buffertext.length == 0){
				bufferfrom = -1;
				if(q.length == 0){
					setsaved();
				}
				return;
			}
			save();
			return;
		}
		else if (chg.origin == "+delete" &&
			bufferfrom == -1){
			bufferfrom = cfrom;
			bufferto = cto;
			buffertext = "";
			save();
			return;
		}
		else if (bufferto != -1 && chg.origin == "+delete" &&
			cto == bufferfrom){
			bufferfrom = cfrom;
			save();
			return;
		}
		else if (bufferfrom != -1) {
			if (bufferto == -1){
				var req = {version:doc.version, from:bufferfrom, to:bufferfrom, text:buffertext};
				if(q.length == 0){
					socket.emit('change', req);
				}
				q.push(req);
				buffertext = "";
				bufferfrom = -1;
			}
			else {
				var req = {version:doc.version, from:bufferfrom, to:bufferto, text:buffertext};
				if(q.length == 0){
					socket.emit('change', req);
				}
				q.push(req);
				bufferfrom = -1;
				bufferto = -1;
			}
		}
		
		var req = {version:doc.version, from:cfrom, to:cto, text:cattext};
		if(q.length == 0){
			socket.emit('change', req);
		}
		q.push(req);
		
	});
}
