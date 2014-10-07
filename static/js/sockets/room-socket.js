var app = app || {};

/* socket 房间事件监听 */
(function() {

/* 进入房间事件 */
var onSet = function(data) {
	//房间进出控制器
	app.room.onSet.call(app.room, data);
};

/* 初始化监听事件对象 */
var room, listeners = {

	/* 聊天事件 */
	chat: function(data) {
		room.onChat(data.name, data.name == app.currentUser.name ? 'self' : '',
		data.text, data.time);
	},
  
  	/* 文件删除事件 */
	deleted: function() {
		app.showMessageBox('info', 'deleted');
		room.close();
	},
  
  	/* 解除共享事件 */
	unshared: function(data) {
		if(data.name == app.currentUser.name) {
			room.view.exit();
			app.showMessageBox('info', 'you unshared', 1);
		} else {
			room.view.toChatBox(strings['systemmessage'], 'system', strings['unshared'] + '&nbsp;' + data.err.code, data.time);
			app.collections['cooperators'].each(function(m){
				if (m.get('name') == data.name) {
					app.collections['cooperators'].remove(m);
				}
			});
		}
	},

	/* 增添共享事件 */
	shared: function(data) {
		room.view.toChatBox(strings['systemmessage'], 'system', strings['shared'] + '&nbsp;' + data.err.code, data.time);
		app.collections['cooperators'].add(data);
		app.views['cooperators'].setonline(data.name, false);
	},

	/* 文件被移动 */  
	moved: function(data) {
		if(!data.newPath) { return; }
		room.docModel.set({path: data.newPath});
		room.onMoved();
		room.view.toChatBox(strings['systemmessage'], 'system', strings['movedto'] + '&nbsp;', data.time);
	},
  
  	/* 运行事件 */
	run: function(data){
		room.view.toChatBox(strings['systemmessage'], 'system', strings['runsaprogram'] + '&nbsp;', new Date(data.time));
		room.onRun();
	},
  
  	/* 开始调试事件 */
	debug: function(data) {
		room.view.toChatBox(strings['systemmessage'], 'system', strings['startdebug'] + '&nbsp;', new Date(data.time));
		room.onDebug(data || {});
	},
  
  	/* 正在运行事件 */
	running: function(data) { 
		room.onRunning(data || {}); 
	},
  
  	/* 断点停留事件 */
	waiting: function(data) { 
		room.onWaiting(data || {}); 
	},

	/* 程序输出事件 */
	stdout: function(data) { 
		room.onConOut(data.data); 
	},

	/* 程序输入事件 */
	stdin: function(data) { 
		room.onConOut(data.data, 'stdin'); 
	},

	/* 程序错误输出事件 */
	stderr: function(data) { 
		room.onConOut(data.data, 'stderr'); 
	},

	/* 程序退出事件 */  
	exit: function(data) {
		room.operationLock = false;

		// 信息输出
		if(data.err.code !== undefined)
			room.view.toChatBox(strings['systemmessage'], 'system', strings['programfinish'] + '&nbsp;' + data.err.code, new Date(data.time));
		else
			room.view.toChatBox(strings['systemmessage'], 'system', strings['programkilledby'] + '&nbsp;' + data.err.signal, new Date(data.time));
		
		//运行返回
		if (room.runLock) {
			$('#editor-run').html('<span class="glyphicon glyphicon-play"></span>');
			$('#editor-run').attr('title', strings['run-title']);
			room.runLock = false;
		}
		
		//调试结束
		if (room.debugLock) {
			//设置断点
			room.view.editor.setValue(room.old_text);
			room.removeAllBreaks();
			room.initBreaks(room.old_bps);

			var editordoc = room.view.editor.getDoc();
			var hist = editordoc.getHistory();
			hist.done.pop();
			editordoc.setHistory(hist);

			room.view.editor.setOption('readOnly', false);	
			if (room.q.length > 0){
				room.socket('change', room.q[0]);
			}
			$('#editor-debug').html('<span class="glyphicon glyphicon-eye-open"></span>');
			$('#editor-debug').attr('title', strings['debug-title']);
			room.view.runTo(-1);
			app.collections['expressions'].each(function(model){
				model.set({'value': null});
			});
			room.debugLock = false;
		}
		room.setrunanddebugstate();
		$('#console-title').text(strings['console'] + strings['finished']);
    	return;
  	},

	// 合作者加入房间
	join: function(data) {
		if(data.err) {
			app.showMessageBox('error', data.err);
			room.close();
		} else {
			room.onSystemChat(data.name, 'join', data.time);
			room.onJoin(data);
		}
	},
  
  	// 合作者离开房间
	leave: function(data) {
		room.onSystemChat(data.name, 'leave', data.time);
		room.onLeave(data);
	},
  
  	// 保存成功事件
	ok: function(data) {
		var chg = room.shift();
		if(!chg)
			return;
		room.docData.text = room.docData.text.substr(0, chg.from) + chg.text + room.docData.text.substr(chg.to);
		room.docData.version++;
		room.docData.version = room.docData.version % 65536;
		for(var i = 0; i < room.q.length; i++){
			room.q[i].version++;
			room.q[i].version = room.q[i].version % 65536;
		}
		for(var i = 0; i < room.bq.length; i++){
			room.bq[i].version++;
			room.bq[i].version = room.bq[i].version % 65536;
		}
		if(room.q.length > 0){
			room.socket('change', room.q[0]);
		}
		if (room.bq.length > 0){
			room.socket('bps', room.bq[0]);
		}
	    return;
	},
  
  	/* 加入断点成功事件 */
	bpsok: function(data) {
		var chg = room.bq.shift();
		if (!chg)
			return;
		room.bps = room.bps.substr(0, chg.from) + chg.text + room.bps.substr(chg.to);
		if(room.debugLock)
			room.old_bps = room.old_bps.substr(0, chg.from) + chg.text + room.old_bps.substr(chg.to);
		room.docData.version++;
		room.docData.version = room.docData.version % 65536;
		for(var i = 0; i < room.q.length; i++){
			room.q[i].version++;
			room.q[i].version = room.q[i].version % 65536;
		}
		for(var i = 0; i < room.bq.length; i++){
			room.bq[i].version++;
			room.bq[i].version = room.bq[i].version % 65536;
		}
		if(room.q.length > 0){
			room.socket('change', room.q[0]);
		}
		if (room.bq.length > 0){
			room.socket('bps', room.bq[0]);
		}
    	return;
  	},	
	
	// 断点加入事件
	bps: function(data) {
		var tfrom = data.from;
		var tto = data.to;
		var ttext = data.text;
		for (var i = 0; i < room.bq.length; i++){
			if (room.bq[i].to <= tfrom){
				tfrom += room.bq[i].text.length + room.bq[i].from - room.bq[i].to;
				tto += room.bq[i].text.length + room.bq[i].from - room.bq[i].to;
			}
			else if (room.bq[i].to <= tto && room.bq[i].from <= tfrom){
				var tdlen = tto - room.bq[i].to;
				room.bq[i].to = tfrom;
				tfrom = room.bq[i].from + room.bq[i].text.length;
				tto = tfrom + tdlen;
			}
			else if (room.bq[i].to <= tto && room.bq[i].from > tfrom){
				tto = tto + room.bq[i].text.length + room.bq[i].from - room.bq[i].to;
				ttext = room.bq[i].text + ttext;
				room.bq[i].from = tfrom;
				room.bq[i].to = tfrom;					
			}
			else if (room.bq[i].to > tto && room.bq[i].from <= tfrom){
				var bqlen = room.bq[i].text.length;
				//q[i].to = q[i].to + ttext.length + tfrom - tto;
				room.bq[i].to = room.bq[i].to + ttext.length + tfrom - tto;
				room.bq[i].text = room.bq[i].text + ttext;
				tfrom = room.bq[i].from + bqlen;
				tto = tfrom;
			}
			else if (room.bq[i].to > tto && room.bq[i].from <= tto){
				var bqdlen = room.bq[i].to - tto;
				tto = room.bq[i].from;
				room.bq[i].from = tfrom + ttext.length;
				room.bq[i].to = room.bq[i].from + bqdlen;
			}
			else if (room.bq[i].from > tto){
				room.bq[i].from += ttext.length + tfrom - tto;
				room.bq[i].to += ttext.length + tfrom - tto;
			}
			room.bq[i].version++;
			room.bq[i].version = room.bq[i].version % 65536;
		}
		for (var i = 0; i < room.q.length; i++){
			room.q[i].version++;
			room.q[i].version = room.q[i].version % 65536;
		}
		room.bps = room.bps.substr(0, data.from) + data.text + room.bps.substr(data.to);
		if(room.debugLock)
			room.old_bps = room.old_bps.substr(0, data.from) + data.text + room.old_bps.substr(data.to);
		if (data.to == data.from + 1){
			if (data.text == "1"){
				var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
				room.view.editor.setGutterMarker(data.from, 'breakpoints', element);
			}
			else if (data.text == "0"){
				var info = room.view.editor.lineInfo(data.from);
				if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
					room.view.editor.setGutterMarker(data.from, 'breakpoints', null);
				}
			}
		}
		room.docData.version++;
		room.docData.version = room.docData.version % 65536;
		if(room.bq.length > 0){
			room.socket('bps', room.bq[0]);
		}
    	return;
	},	
  	
  	/* 加入表达式事件 */
	"add-expr": function(data) {
		if(data.expr) {
			app.collections['expressions'].add({expression: data.expr, value: data.val});
		}
	},

	/* 删除表达式事件 */
    "rm-expr": function(data) {
		app.views['expressions'].removeElementByExpression(data.expr);
	},
	
	/* 文本修改事件 */
	change: function(data) {
		room.lock = true;
		var tfrom = data.from;
		var tto = data.to;
		var ttext = data.text;
		for (var i = 0; i < room.q.length; i++){
			if (room.q[i].to <= tfrom){
				tfrom += room.q[i].text.length + room.q[i].from - room.q[i].to;
				tto += room.q[i].text.length + room.q[i].from - room.q[i].to;
			}
			else if (room.q[i].to <= tto && room.q[i].from <= tfrom){
				var tdlen = tto - room.q[i].to;
				room.q[i].to = tfrom;
				tfrom = room.q[i].from + room.q[i].text.length;
				tto = tfrom + tdlen;
			}
			else if (room.q[i].to <= tto && room.q[i].from > tfrom){
				tto = tto + room.q[i].text.length + room.q[i].from - room.q[i].to;
				ttext = room.q[i].text + ttext;
				room.q[i].from = tfrom;
				room.q[i].to = tfrom;					
			}
			else if (room.q[i].to > tto && room.q[i].from <= tfrom){
				var qlen = room.q[i].text.length;
				//q[i].to = q[i].to + ttext.length + tfrom - tto;
				room.q[i].to = room.q[i].to + ttext.length + tfrom - tto;
				room.q[i].text = room.q[i].text + ttext;
				tfrom = room.q[i].from + qlen;
				tto = tfrom;
			}
			else if (room.q[i].to > tto && room.q[i].from <= tto){
				var qdlen = room.q[i].to - tto;
				tto = room.q[i].from;
				room.q[i].from = tfrom + ttext.length;
				room.q[i].to = room.q[i].from + qdlen;
			}
			else if (room.q[i].from > tto){
				room.q[i].from += ttext.length + tfrom - tto;
				room.q[i].to += ttext.length + tfrom - tto;
			}
			room.q[i].version++;
			room.q[i].version = room.q[i].version % 65536;
		}	
		for (var i = 0; i < room.bq.length; i++){
			room.bq[i].version++;
			room.bq[i].version = room.bq[i].version % 65536;
		}
		if (room.bufferfrom != -1){
			if (room.bufferto == -1){
				if (room.bufferfrom <= tfrom){
					tfrom += room.buffertext.length;
					tto += room.buffertext.length;
				}
				else if (room.bufferfrom <= tto){
					tto += room.buffertext.length;
					ttext = room.buffertext + ttext;
					room.bufferfrom = tfrom;
				}
				else {
					room.bufferfrom += ttext.length + tfrom - tto;
				}
			}
			else{
				if (room.bufferto <= tfrom){
					tfrom += room.bufferfrom - room.bufferto;
					tto += room.bufferfrom - room.bufferto;
				}
				else if (room.bufferto <= tto && room.bufferfrom <= tfrom){
					var tdlen = tto - room.bufferto;
					room.bufferto = tfrom;
					tfrom = room.bufferfrom;
					tto = tfrom + tdlen;
				}
				else if (room.bufferto <= tto && room.bufferfrom > tfrom){
					tto = tto + room.bufferfrom - room.bufferto;
					room.bufferfrom = -1;
					room.bufferto = -1;					
				}
				else if (room.bufferto > tto && room.bufferfrom <= tfrom){
					room.bufferto = room.bufferto + ttext.length + tfrom - tto;
					room.buffertext = room.buffertext + ttext;
					tfrom = room.bufferfrom;
					tto = tfrom;
				}
				else if (room.bufferto > tto && room.bufferfrom <= tto){
					var qdlen = room.bufferto - tto;
					tto = room.bufferfrom;
					room.bufferfrom = tfrom + ttext.length;
					room.bufferto = room.bufferfrom + qdlen;
				}
				else if (room.bufferfrom > tto){
					room.bufferfrom += ttext.length + tfrom - tto;
					room.bufferto += ttext.length + tfrom - tto;
				}
			}
		}
		var delta = tfrom + ttext.length - tto;
		var editorDoc = room.view.editor.getDoc();
		var hist = editorDoc.getHistory();
		var donefrom = new Array(hist.done.length);
		var doneto = new Array(hist.done.length);
		for (var i = 0; i < hist.done.length; i++) {
			donefrom[i] = room.view.editor.indexFromPos(hist.done[i].changes[0].from);
			doneto[i] = room.view.editor.indexFromPos(hist.done[i].changes[0].to);
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
				hist.done[i].changes[0].to = room.view.editor.posFromIndex(tfrom);
				//doneto[i] = tfrom;
			}
			else if (doneto[i] <= tto && donefrom[i] > tfrom){
				hist.done[i].changes[0].from = room.view.editor.posFromIndex(tfrom);
				hist.done[i].changes[0].to = room.view.editor.posFromIndex(tfrom);					
			}
		}
		for (var i = 0; i < hist.undone.length; i++){
			if (undoneto[i] <= tfrom){
			}
			else if (undoneto[i] <= tto && undonefrom[i] <= tfrom){
				hist.undone[i].changes[0].to = room.view.editor.posFromIndex(tfrom);
				//undoneto[i] = tfrom;
			}
			else if (undoneto[i] <= tto && undonefrom[i] > tfrom){
				hist.undone[i].changes[0].from = room.view.editor.posFromIndex(tfrom);
				hist.undone[i].changes[0].to = room.view.editor.posFromIndex(tfrom);					
			}
		}
		room.view.editor.replaceRange(ttext, room.view.editor.posFromIndex(tfrom), room.view.editor.posFromIndex(tto));
		for (var i = 0; i < hist.done.length; i++){
			if (doneto[i] <= tfrom){
			}
			else if (doneto[i] <= tto && donefrom[i] <= tfrom){					
			}
			else if (doneto[i] <= tto && donefrom[i] > tfrom){		
			}
			else if (doneto[i] > tto && donefrom[i] <= tfrom){
				hist.done[i].changes[0].to = room.view.editor.posFromIndex(doneto[i] + delta);
			}				
			else if (doneto[i] > tto && donefrom[i] <= tto){
				hist.done[i].changes[0].from = room.view.editor.posFromIndex(tfrom + ttext.length);
				hist.done[i].changes[0].to = room.view.editor.posFromIndex(donefrom[i] + doneto[i] - tto);
			}
			else if (donefrom[i] > tto){
				hist.done[i].changes[0].from = room.view.editor.posFromIndex(donefrom[i] + ttext.length + tfrom - tto);
				hist.done[i].changes[0].to = room.view.editor.posFromIndex(doneto[i] + ttext.length + tfrom - tto);
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
				hist.undone[i].changes[0].to = room.view.editor.posFromIndex(undoneto[i] + delta);
			}				
			else if (undoneto[i] > tto && undonefrom[i] <= tto){
				hist.undone[i].changes[0].from = room.view.editor.posFromIndex(tfrom + ttext.length);
				hist.undone[i].changes[0].to = room.view.editor.posFromIndex(undonefrom[i] + undoneto[i] - tto);
			}
			else if (undonefrom[i] > tto){
				hist.undone[i].changes[0].from = room.view.editor.posFromIndex(undonefrom[i] + ttext.length + tfrom - tto);
				hist.undone[i].changes[0].to = room.view.editor.posFromIndex(undoneto[i] + ttext.length + tfrom - tto);
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
		room.docData.text = room.docData.text.substr(0, data.from) + data.text + room.docData.text.substr(data.to);
		room.docData.version++;
		room.docData.version = room.docData.version % 65536;
		if(room.q.length > 0){
			room.socket('change', room.q[0]);
		}
		
		var pos = room.view.editor.posFromIndex(data.from + data.text.length);
		room.cursors[data.name].pos = data.from + data.text.length;
		room.view.editor.addWidget(pos, room.cursors[data.name].element, false);
	    return;
	},
	  
};

/* 开始监听 */
var startListen = function(room1) {
	room = room1 || this;
	var socket = app.socket, ls = listeners;
	for(var i in ls) { 
		socket.on(i, ls[i]); 
	}
};

/* 结束监听 */
var stopListen = function() {
	var socket = app.socket, ls = listeners;
	for(var i in ls) { 
		socket.removeListener(i, ls[i]); 
	}
	room = null;
};			    

/* 处理发送消息 */
var emit = function(m, d) {
	switch(m) {
		case 'join':  d = {path: d}; break;
		case 'stdin': d = {data: d}; break;
		case 'chat':  d = {text: d}; break;
		case 'kill':  d = null; break; /* TODO: ack whether it's ok */
		case 'run':   break;
		case 'step': case 'next': case 'finish': case 'resume':
    		d = { }; break;
		case 'bps': break;
	}
	if (d != null)
		app.socket.emit(m, d);
	else
  		app.socket.emit(m);
};

app.init_suf || (app.init_suf = {});

/* 初始化room socket监听 */
(function() {
	var _init = false;
	app.init_suf.roomSocket = function() {
		if(_init) { 
			return; 
		} else { 
			_init = true; 
		}
		app.init_suf.mainSocket();
		app.socket.on('set', app.Lock.detach);
    
		app.room || app.init.room();
		app.room.startListen = startListen;
		app.room.stopListen = stopListen;
		app.room.socket = emit;
	};
})();

})();
