var app = app || {};

(function() {

/* 房间进出逻辑控制器 */
app.Room && _.extend(app.Room.prototype, {

	// 重载数组操作
	push: function(item) {
		this.q.push(item);
		this.view.setSaving();
	},
  
	shift: function() {
		var r = this.q.shift();
		if (this.q.length == 0 && this.bufferfrom == -1) { 
			this.view.setSaved(); 
		}
		return r;
	},

	/* 处理文件移动 */
	onMoved: function() {
		var ext = this.ext = this.docModel.json.name.match(app.fileExtReg)[2],
		editor = this.view.editor;
		editor.setOption('mode', app.modeMap[ext] || app.languageMap[ext]
		|| 'text/plain');
		CodeMirror.autoLoadMode(editor, app.languageMap[ext] || '');
    
		this.runable = app.Package.ENABLE_RUN && (!!app.RunableExt[ext]);
		var newDa = app.Package.ENABLE_DEBUG && (!!app.DebugableExt[ext]);
		if(newDa != this.debugable) {
			if(newDa) {
				var that = this;
				this.view.gutterClick = function() { that.onSetBreak(); }
			} else { 
				delete this.view.gutterClick; 
			}
		    this.debugable = newDa;
		}
		this.removeAllBreaks();
		this.view.setRunState();
	},
  
  	/* 处理合作者加入 */
	onJoin: function(data) {
		app.views['cooperators'].setonline(data.name, true);
		var that = this;
		this.setCursor(data.name, { 
			pos: 0,
			element: that.newCursor(data.name),
		});
	},

	/* 处理合作者离开 */  
	onLeave: function(data) {
		app.views['cooperators'].setonline(data.name, false);
		this.setCursor(data.name, null);
	},
  
  	/* 申请进入房间处理 */
	tryEnter: function(model, loading) {
	    var that = this;
    	if(app.Lock.attach({
			loading: loading,
			tend: 5000,
			fail: function(data) { 
				app.showMessageBox('error', data && data.err); 
			},
      		error: function(data) { 
      			app.showMessageBox('error', data.err); 
      		},
      		success: function(data) { 
      			window.location.href = '#edit/'; that.onSet(data); 
      		},
    	})) {
      		this.docModel = model;
      		this.socket('join', model.get('path'));
    	}
	},
	
  	/* 进入房间处理初始化 */
	onSet: function(data) {
    	app.Lock.remove();
    	data.notRemove = true;
		
		//初始化视图
    	$('#editor-back').attr('href', '#index' + app.views.files.shownPath);
    	this.view.enter(data);
    	this.timestamp = 1;
    	this.view.setSaved2(this.timestamp);
    	
    	//初始化数据
    	this.q.length = 0;
    	this.bq.length = 0;
    	this.lock = false;
    	var docobj = this.docModel.json;
    	docobj.members = this.docModel.get('members');
    	$('#editor-run').html('<span class="glyphicon glyphicon-play"></span>').attr('title',
    	  strings['run-title'] || 'run');
    	this.runLock = false;
    	this.debugLock = false;
    	this.waiting = false;
	
    	$('#current-doc').html(_.escape(docobj.shownName));
    	$('#chat-input').val('');
    	$('#chat-show-inner').text('');
    	$('#footer').hide();
    	var filepart = docobj.name.split('.');
    	this.ext = filepart[filepart.length - 1];
    	this.view.changelanguage(this.ext);
    	this.checkrunanddebug(this.ext);
	
    	this.view.editor.refresh();
 
 		//初始化成员和鼠标   	
		app.collections['cooperators'].updatedoc(docobj);
	    app.views['cooperators'].setalloffline();
    	app.views['cooperators'].setonline(app.currentUser.name, true);
    	for(var k in this.cursors) {
			$(this.cursors[k].element).remove();
    	}
	
    	this.cursors = {};
    
		this.view.oldscrolltop = $('body').scrollTop();
    
    	//初始化声音
		window.voiceon = false;
		window.voiceLock = false;
		window.userArray = [];
		window.audioArray = {};
		window.joinedARoom = false;
		window.peerArray = {};
		window.peerUserArray = [];

		$('#voice-on').removeClass('active');
    
    	//初始化编辑器
		this.operationLock = false;

		this.lock = true;
		this.docData = data;
		this.view.editor.setValue(this.docData.text);
		this.view.editor.clearHistory();
		this.view.editor.setOption('readOnly', false);
		this.initBreaks(data.bps);
		for(var i in data.users) {
			app.views['cooperators'].setonline(i, true);
			if(i == app.currentUser.name)
    		    continue;
    		var cursor = this.newCursor(i);
    		if(this.cursors[i] && this.cursors[i].element)
    		    $(this.cursors[i].element).remove();
    		this.cursors[i] = { element:cursor, pos:0 };
    	}

		//初始化控制台
	    $('#console-inner').html('');
	    this.view.setConsole(false);
	    app.collections['expressions'].each(function(model){
	    	model.destroy();
	    });
	    app.views['expressions'].clear();
	    for(var k in data.exprs) {
	        app.collections['expressions'].add({expression: k, value: data.exprs[k], notnew: true});
	    }
	    
	    $('#console-title').text(strings['console']);
	    
	    //调整大小
		this.view.resize_old = app.resize;
		var that = this;
		app.resize = function() {
			var showing = document.getElementsByClassName("CodeMirror-fullscreen")[0];
			that.view.resize();
			if (!showing) return;
			showing.CodeMirror.getWrapperElement().style.height =  $(window).height() + "px";
		}
        
		$('body').scrollTop(32767);
    
		if(data.running) {
			this.view.setRun();
		}
		if(data.debugging) {
			this.view.setDebug();
			this.view.editor.setOption('readOnly', true);
			this.old_text = data.text;
			this.old_bps = data.bps;
			if(data.state == 'waiting') {
				this.waiting = true;
				this.view.runTo(data.line - 1);
				$('.debugandwait').removeClass('disabled');
				if(data.line !== null)
          			$('#console-title').text(strings['console'] + strings['waiting']);
        		else
          			$('#console-title').text(strings['console'] + strings['waiting'] + strings['nosource']);
      		}
    	}
    	this.setrunanddebugstate();
    
	    this.startListen();
    
    	delete data.running;
    	delete data.debugging;
    	delete data.state;
  	},	
  
});

})();

