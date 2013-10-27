var app = app || {};

(function() {
var Room = function() {
  _.extend(this, {
    runLock: false,
    debugLock: false,
    operationLock: false,
    waiting: false,
	chatstate: false,
    runable: true,
    debugable: false,
    cursors: {},
    docModel: null,
    lock: false,
    docData: null,
    q: [],
    timer: null,
    ext: '',
    bq: [],
    bps: '',
    consoleOpened: false,
    old_text: '',
    old_bps: null,
    
    timestamp: 0,
    isSaving: false,
    saveTimeout: 500,
    buffertimeout: app.Package.SAVE_TIME_OUT,
    buffertext: "",
	bufferfrom: -1,
	bufferto: -1,

    voice: {
      userArray: [],
      audioArray: [],
      peerUserArray: [],
      peerArray: [],
      joinedARoom: false,
      voiceConnection: null,
      voiceLock: false,
      voiceOn: false,
    },
    
  }, Room.prototype);
  return this;
};

/**
  the following function (this.stringFill) are learnt from:
  http://blog.163.com/huangkui_009@126/blog/static/5227269420127140374565/
    Posted on 2009-09-22 by amberlife.
  param: ch: char to fill with;
  return a new string with 'length' 'ch's, such as 100 '0's.
  */
app.stringFill = function (ch, length) {
  for(var a = length, r = [], s = ch; a; s += s) {
    if (a % 2) { 
    	r.push(s);
    	a = (a-1) / 2; 
    }
    else {
    	r.push(s); 
    	a = a / 2;
    }
  }
  delete s;
  return r.join('');
};

_.extend(Room.prototype, {

  /* OK: */
  push: function(item) {
    this.q.push(item);
    this.view.setSaving();
  },
  
  /* OK: */
  shift: function() {
    var r = this.q.shift();
    if(this.q.length == 0 && this.bufferfrom == -1) { this.view.setSaved(); }
    return r;
  },
  
  appendtochatbox: function(name, type, content, time) {
	$('#chat-show-inner').append(
		'<p class="chat-element"><span class="chat-name ' + type +
		'">' + name + '&nbsp;&nbsp;' + time.toTimeString().substr(0, 8) + '</span><br />' + content + '</p>'
		);
	var o = $('#chat-show').get(0);
	o.scrollTop = o.scrollHeight;
  },

  changelanguage : function(language) {
		if(app.languageMap[language]) {
			if(app.modeMap[language])
				this.view.editor.setOption('mode', app.modeMap[language]);
			else
				this.view.editor.setOption('mode', this.view.languageMap[language]);
			CodeMirror.autoLoadMode(this.view.editor, app.languageMap[language]);
		} else {
			this.view.editor.setOption('mode', 'text/plain');
			CodeMirror.autoLoadMode(this.view.editor, '');
		}
  },
  
  isrunable: function(ext) {
	for(var i=0; i<app.RunableExt.length; i++) {
		if(app.RunableExt[i] == ext)
			return true;
	}
	return false;
  },

  isdebugable: function(ext) {
	for(var i=0; i<app.DebugableExt.length; i++) {
		if(app.DebugableExt[i] == ext)
			return true;
	}
	return false;
  },
  
  removebreakpointat: function(cm, n){
	var info = cm.lineInfo(n);
	if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
		cm.setGutterMarker(n, 'breakpoints', null);
		//bps = bps.substr(0, n) + "0" + bps.substr(n+1);
		this.sendBreak(n, n+1, "0");
		return true;
	}
	return false;
  },

  addbreakpointat: function(cm, n){
	var addlen = n - this.bps.length;
	if (addlen > 0){
		var addtext = "";
		for (var i = this.bps.length; i < n-1; i++){
			addtext += "0";
		}
		addtext += "1";
		//bps += addtext;
		this.sendBreak(this.bps.length, this.bps.length, addtext);
	}
	else{
		//bps = bps.substr(0, n) + "1" + bps.substr(n+1);
		this.sendBreak(n, n+1, "1");
	}

	var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
	cm.setGutterMarker(n, 'breakpoints', element);
  },

  setrunanddebugstate: function(){
	$('#editor-run').removeClass('disabled');
	$('#editor-debug').removeClass('disabled');
	if(!this.runEnabled())
		$('#editor-run').addClass('disabled');
	if(!this.debugEnabled())
		$('#editor-debug').addClass('disabled');
  },
  
  checkrunanddebug: function(ext) {
		if(app.Package.ENABLE_RUN) {
			this.runable = this.isrunable(ext);
		}
		if(app.Package.ENABLE_DEBUG) {
			this.debugable = this.isdebugable(ext);
			if(this.debugable) {
				this.view.gutterclick = function(cm, n) {
					if(this.debugLock && !this.waiting)
						return;
					if (!this.removebreakpointat(cm, n)){
						this.addbreakpointat(cm, n);
					}
				};
			} else {
				this.view.gutterclick = function(cm, n) { };
			}
			this.removeAllBreaks();
		}
		this.setrunanddebugstate();
	},

  /* TODO: try merge this */
  runEnabled: function() {
    return (this.runable && !this.debugLock && (!this.isSaving || this.runLock));
  },

  /* TODO: try merge this */
  debugEnabled: function() {
    return (this.debugable && !this.runLock && (!this.isSaving || this.debugLock));
  },

  /* OK: */
  sendBreak: function(from, to, text) {
    var req = {version: this.docData.version, from: from, to: to, text: text};
    if(this.bq.length == 0) { this.socket('bps', req); }
    this.bq.push(req);
  },
  
  /* TODO: merge it */
  /* haveBreakAt: function(cm, n) {
    var info = cm.lineInfo(n);
    return !!(info && info.gutterMarkers && info.gutterMarkers["breakpoints"]);
  }, */
  
  /* OK: */
  removeAllBreaks: function() {
    var old = this.bps;
    this.bps.replace(/1/g, '0');
    this.view.removeAllBreaks(old);
  },

  /* OK: */
  initBreaks: function(str) {
    if(!this.debugable) { return; }
    for(var i = 0, l = str.length, cm = this.view.editor, el; i < l; i++) {
      if(str[i] != "1") { this.view.setBreak(cm, i, true); }
    }
    this.bps = str + app.stringFill('0', cm.lineCount() - l);
  },
  
  /* OK: */
  onSetBreak: function(cm, n) {
    if(this.debugLock && !this.waiting) { return; }
    var info = cm.lineInfo(n);
    if(info.getterMarkers && info.getterMarkers['breakpoints']) {
      this.sendBreak(n, n + 1, '0');
      this.view.setBreak(cm, n, false);
    } else {
      var oldl = this.bps.length;
      if(n <= oldl) { this.sendBreak(n, n + 1, '1'); }
      else {
        this.sendBreak(oldl, oldl, app.stringFill('0', n - 1 - oldl) + '1');
      }
      this.view.setBreak(cm, n, true);
    }
  },
  
  /* OK: File name changed */
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
      } else { delete this.view.gutterClick; }
      this.debugable = newDa;
    }
    this.removeAllBreaks();
    this.view.setRunState();
  },
  
  /* OK: */
  chat: function(text) { this.socket('chat', text); },
  
  /* OK: */
  onChat: function(name, type, content, time) {
    this.view.toChatBox(name, type, content, time);
  },
  
  /* OK: */
  onSystemChat: function(name, content, time) {
    content || (content = '');
    this.view.toChatBox(strings['systemmessage'] || 'System message', 'system',
      name + '&nbsp;' + (strings[content] || content), time);
    ;
  },
  
  /* OK: */
  stdin: function(text) { this.socket('sdtin', text); },
  
  /* OK: */
  onConOut: function(data, type) { this.view.toConsole(data, type); },
  
  /* OK: */
  onRun: function() { this.runLock = true; this.view.setRun(); },

  /* OK: TODO: merge */
  onDebug: function(data) {
    this.onDebug2(data.text, data.bps);
    this.operationLock = false;
  },
  
  /* OK: */
  onDebug2: function(text, bps) {
    this.debugLock = true;
    this.view.onDebug(text);
    this.oldBps = bps;
    this.removeAllBreaks();
    this.initBreaks(bps);
  },
  
  /* OK: */
  onRunning: function(data) {
    if(!this.debugLock) { return; }
    this.waiting = false;
    this.view.onRunning();
  },
  
  /* OK: TODO: expressionList */
  onWaiting: function(data) {
    if(!this.debugLock) { return; }
    this.waiting = true;
    this.view.onWaiting(data);
    for(var k in data.exprs) { this.app.views['expressions'].setValue(k, data.exprs[k]); }
  },
  
  /** --------- Members ----------- */
  
  /* TODO: cursors */
  setCursor: function(name, el) {
    var c = this.cursors;
    if(!name || !c) { return; }
    if(c[name] && c[name].element) {
      $(c[name].element).remove();
    }
    if(el) { c[name] = el; }
    else { delete c[name]; }
  },
  
  /* TODO: members & cursors*/
  onJoin: function(data) {
    /* TODO: members */
    app.views['cooperators'].setonline(data.name, true);
    this.setCursor(name, { pos: 0,
      element: room.newCursor(data.name),
    });
  },
  
  /* TODO: members */
  onLeave: function() {
    app.views.setonline(data.name, false);
    this.setCursor(data.name, null);
  },
  
  /* TODO: */
  saveEvent: function(cm) {
    if(this.timestamp != 0) { this.view.setSaved2(this.timestamp); }
    this.timestamp = 0;
  },
  
  run: function() {
    if(!this.runEnabled())
      return;
    if(this.operationLock)
      return;
    this.operationLock = true;
    if(this.runLock) {
      this.socket('kill');
    } else {
      this.socket('run', this.docData.version, this.ext);
    }
  },
  
  debug: function() {
    if(!this.debugEnabled() || this.operationLock) { return; }
    this.operationLock = true;
    if(this.debugLock) { this.socket('kill'); }
    else {
      this.socket('debug', this.docData.version, this.ext);
    }
  },
  
  sendBuffer: function() {
  	if (this.bufferfrom != -1) {
		if (this.bufferto == -1){
			var req = {version:this.docData.version, from:this.bufferfrom, to:this.bufferfrom, text:this.buffertext};
			if(this.q.length == 0){
				this.socket('change', req);
			}
			this.push(req);
			this.buffertext = "";
			this.bufferfrom = -1;
		}
		else {
			var req = {version:this.docData.version, from:this.bufferfrom, to:this.bufferto, text:this.buffertext};
			if(this.q.length == 0){
				this.socket('change', req);
			}
			this.push(req);
			this.bufferfrom = -1;
			this.bufferto = -1;
		}
		this.buffertimeout = app.Package.SAVE_TIME_OUT;
	}
  },
  
  save: function(){
	this.view.setSaving();
	if (this.timer != null){
		clearTimeout(this.timer);
	}
	var that = this;
	this.timer = setTimeout(function() {
		that.sendBuffer();
	}, this.buffertimeout);
  },

  register: function() {
  },
  
  tryEnter: function(model, loading) {
    var re = app.Lock.attach({
      loading: loading,
      fail: function(data) { app.showMessageBox('error', data && data.err); },
      error: function(data) { app.showMessageBox('error', data.err); },
      success: function() { app.router.navigate('#edit/'); },
    });
    this.docModel = model;
    re && this.socket('join', model.get('path'));
  },
  
  onSet: function(data) {
    /* app.room.init(data); */
	app.Lock.remove();
    this.view.enter(data);
    this.timestamp = 1;
    this.view.setSaved2(this.timestamp);
    
    this.q.length = 0;
    this.bq.length = 0;
    this.lock = false;
	var docobj = this.docModel.json;
	docobj.members = this.docModel.get('members');
    $('#editor-run').html('<i class="icon-play"></i>').attr('title',
      strings['run-title'] || 'run');
    this.runLock = false;
    this.debugLock = false;
    this.waiting = false;

    $('#current-doc').html(_.escape(docobj.shownName));
    $('#chat-input').val('');
    $('#chat-show-inner').text('');
    $('#editor').show();
    $('#filecontrol').hide();
    $('#footer').hide();
    var filepart = docobj.name.split('.');
    this.ext = filepart[filepart.length - 1];
    this.changelanguage(this.ext);
    this.checkrunanddebug(this.ext);

    this.view.editor.refresh();
    
    if(this.docModel.get('path').split('/').length == 3) {
      app.collections['cooperators'].updatedoc(docobj);
    }
    app.views['cooperators'].setalloffline();
    app.views['cooperators'].setonline(app.currentUser.name, true);

    for(var k in this.cursors) {
      $(this.cursors[k].element).remove();
    }

    this.cursors = {};
    
    this.view.oldscrolltop = $('body').scrollTop();
    
    window.voiceon = false;
    window.voiceLock = false;
    window.userArray = [];
    window.audioArray = {};
    window.joinedARoom = false;
    window.peerArray = {};
    window.peerUserArray = [];

    $('#voice-on').removeClass('active');
    
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
      var cursor = newcursor(i);
      if(this.cursors[i] && this.cursors[i].element)
        $(this.cursors[i].element).remove();
      this.cursors[i] = { element:cursor, pos:0 };
    }

//    filelist.removeloading();
    $('#console-inner').html('');
    this.view.setConsole(false);
    app.collections['expressions'].each(function(model){
    	model.destroy();
    });
    for(var k in data.exprs) {
      app.collections['expressions'].add({expression: k, notnew: true});
      app.views['expressions'].setValue(k, data.exprs[k]);
    }
    
    $('#console-title').text(strings['console']);
    
    
    this.view.resize();
    $('body').scrollTop(99999);
    
    if(data.running) {
      this.view.setRun();
    }
    if(data.debugging) {
      this.setDebug();
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
  
  havebreakat: function (cm, n) {
	var info = cm.lineInfo(n);
	if (info && info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
		return "1";
	}
	return "0";
  },
  
  registereditorevent: function() {
	var editor = this.view.editor;
	var room = this;
	CodeMirror.on(editor.getDoc(), 'change', function(editorDoc, chg){

		//console.log(chg);

		if(room.debugLock){
			return true;
		}

		if(room.lock){
			room.lock = false;
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

		for (var k in room.cursors){
			if (cto <= room.cursors[k].pos){
				room.cursors[k].pos += delta;
				editor.addWidget(editor.posFromIndex(room.cursors[k].pos), room.cursors[k].element, false);
			}
			else if (cfrom < room.cursors[k].pos) {
				room.cursors[k].pos = cfrom + cattext.length;
				editor.addWidget(editor.posFromIndex(room.cursors[k].pos), room.cursors[k].element, false);
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
			room.sendBuffer();
			var req = {version:room.docData.version, from:cfrom, to:cto, text:cattext};
			if(room.q.length == 0){
				room.socket('change', req);
			}
			room.push(req);
			var btext = "";
			for (var i = 0; i < chg.text.length; i++){
				btext += room.havebreakat(editor, bfrom + i);
			}
			/*
			if (chg.text[0] == "")
				btext = havebreakat(editor, bfrom);
			//var btext = "";
			for (var i = 0; i < chg.text.length - 2; i++){
				btext += "0";
			}
			btext[btext.length-1] = bps[bto];*/
			room.sendBreak(bfrom, bto+1, btext);
			return;
		}
		if (chg.text.length > 1){
			room.buffertimeout = room.buffertimeout / 2;
		}
		if (room.bufferto == -1 && cfrom == cto &&
			(cfrom ==  room.bufferfrom + room.buffertext.length ||  room.bufferfrom == -1)){
			if (room.bufferfrom == -1){
				room.buffertext = cattext;
				room.bufferfrom = cfrom;
			}
			else {
				room.buffertext += cattext;
			}
			room.save();
			return;
		}
		else if (room.bufferto == -1 && chg.origin == "+delete" &&
			room.bufferfrom != -1 && cto == room.bufferfrom + room.buffertext.length && cfrom >= room.bufferfrom){
			room.buffertext = room.buffertext.substr(0, cfrom - room.bufferfrom);
			if (room.buffertext.length == 0){
				room.bufferfrom = -1;
				if(room.q.length == 0){
					room.view.setsaved();
				}
				return;
			}
			room.save();
			return;
		}
		else if (chg.origin == "+delete" &&
			room.bufferfrom == -1){
			room.bufferfrom = cfrom;
			room.bufferto = cto;
			room.buffertext = "";
			room.save();
			return;
		}
		else if (room.bufferto != -1 && chg.origin == "+delete" &&
			cto == room.bufferfrom){
			room.bufferfrom = cfrom;
			room.save();
			return;
		}
		else if (room.bufferfrom != -1) {
			if (room.bufferto == -1){
				var req = {version:room.docData.version, from:room.bufferfrom, to:room.bufferfrom, text:room.buffertext};
				if(room.q.length == 0){
					room.socket('change', req);
				}
				room.push(req);
				room.buffertext = "";
				room.bufferfrom = -1;
			}
			else {
				var req = {version:room.docData.version, from:room.bufferfrom, to:room.bufferto, text:room.buffertext};
				if(q.length == 0){
					room.socket('change', req);
				}
				room.push(req);
				room.bufferfrom = -1;
				room.bufferto = -1;
			}
		}
		
		var req = {version:room.docData.version, from:cfrom, to:cto, text:cattext};
		if(room.q.length == 0){
			room.socket('change', req);
		}
		room.push(req);
		
	});
  }

});


app.languageMap = { 
  'c':      'clike',
  'clj':    'clojure',
  'coffee': 'coffeescript',
  'cpp':    'clike',
  'cs':     'clike',
  'css':    'css',
  'go':     'go',
  'h':      'clike',
  'htm':    'htmlmixed',
  'html':   'htmlmixed',
  'hpp':    'clike',
  'java':   'clike',
  'js':     'javascript',
  'json':   'javascript',
  'lisp':   'commonlisp',
  'lua':    'lua',
  'md':     'markdown',
  'pas':    'pascal',
  'php':    'php',
  'pl':     'perl',
  'py':     'python',
  'rb':     'ruby',
  'sql':    'sql',
  'tex':    'stex',
  'vbs':    'vb',
  'xml':    'xml',
};

app.modeMap = {
  'c':      'text/x-csrc',
  'clj':    'text/x-clojure',
  'coffee': 'text/x-coffeescript',
  'cpp':    'text/x-c++src',
  'cs':     'text/x-csharp',
  'css':    'text/css',
  'go':     'text/x-go',
  'h':      'text/x-csrc',
  'htm':    'text/html',
  'html':   'text/html',
  'hpp':    'text/x-c++src',
  'java':   'text/x-java',
  'js':     'text/javascript',
  'json':   'application/json',
  'lisp':   'text/x-common-lisp',
  'lua':    'text/x-lua',
  'md':     'text/x-markdown',
  'pas':    'text/x-pascal',
  'php':    'application/x-httpd-php',
  'pl':     'text/x-perl',
  'py':     'text/x-python',
  'rb':     'text/x-ruby',
  'sql':    'text/x-sql',
  'tex':    'text/x-latex',
  'vbs':    'text/x-vb',
  'xml':    'application/xml',
};

app.RunableExt = ['c','cpp', 'js', 'py', 'pl','rb','lua', 'java'];
app.DebugableExt = ['c', 'cpp'];

app.Room = Room;

app.init || (app.init = {});

app.init.room = function() {
  app.room || (app.room = new app.Room());
};

})();


