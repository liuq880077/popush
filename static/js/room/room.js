var app = app || {};
if(app.Room) { return; }

(function() {
var Room = function() {
  _.extend(this, {
    runLock: false,
    debugLock: false,
    operationLock: false,
    waiting: false,
    
    runable: true,
    debugable: false,
    cursors: {},
    docModel: null,
    lock: false,
    doc: null,
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
Room.stringFill = function (ch, length) {
  for(var a = length, r = [], s = ch; a; s += s) {
    if (a % 2) { r.push(s); a = (a-1) / 2; }
  }
  delete s;
  return r.join('');
};

Room.RunableExt: {'c':1,'cpp':1, 'js':1, 'py':1, 'pl':1,'rb':1,'lua':1, 'java':1},
Room.DebugableExt: {'c':1, 'cpp':1},

_.extend(Room.prototype, {

  /* OK: */
  push: function(item) {
    this.q.push(item);
    this.setSaving();
  },
  
  /* OK: */
  shift: function() {
    var r = this.q.shift();
    if(this.q.length == 0 && this.bufferfrom == -1) { this.setSaved(); }
    return r;
  },

  /* TODO: try merge this */
  runEnabled: function() {
    return (this.runable && !this.debugLock && (!this.isSaving || this.runLock));
  },

  /* TODO: try merge this */
  debugEnabled: function() {
    return (this.debugable && !this.runLock && (!this.isSaving || debugLock));
  },

  /* OK: */
  sendBreak: function(from, to, text) {
    var req = {version: this.doc.version, from: from, to: to, text: text};
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
    this.bps = str + Room.stringFill('0', cm.lineCount() - l);
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
        this.sendBreak(oldl, oldl, Room.stringFill('0', n - 1 - oldl) + '1');
      }
      this.view.setBreak(cm, n, true);
    }
  },
  
  /* OK: File name changed */
  onMoved: function() {
    var ext = this.ext = this.docModel.json.name.match(app.fileExtReg)[2],
      editor = this.view.editor;
    editor.setOption('mode', Room.modeMap[ext] || Room.languageMap[ext]
      || 'text/plain');
    CodeMirror.autoLoadMode(editor, Room.languageMap[ext] || '');
    
    this.runable = app.Package.ENABLE_RUN && (!!Room.RunableExt[ext]);
    var newDa = app.Package.ENABLE_DEBUG && (!!Room.DebugableExt[ext]);
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
    for(var k in data.exprs) { this.expressionList.setValue(k, data.exprs[k]); }
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
  }
  
  /* TODO: members & cursors*/
  onJoin: function(data) {
    /* TODO: members */
    room.members.setOnline(data.name, true);
    room.members.sort();
    this.setCursor(name, { pos: 0,
      element: room.newCursor(data.name),
    });
  },
  
  /* TODO: members */
  onLeave: function() {
    this.members.setonline(data.name, false);
    this.members.sort();
    this.setCursor(data.name, null);
  }
  
  /* TODO: */
  saveEvent: function(cm) {
    if(this.timestamp != 0) { this.setSaved2(this.timestamp); }
    this.timestamp = 0;
  },
  
  run: function() {
    if(!this.runenabled())
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
  },
  
  save: function() {
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
    this.view.enter(data);
    this.timestamp = 1;
    this.view.setSaved2(this.timestamp);
    
    this.q.length = 0;
    this.bq.length = 0;
    this.lock = false;

    $('#editor-run').html('<i class="icon-play"></i>').attr('title',
      strings['run-title'] || 'run');
    this.runLock = false;
    this.debugLock = false;
    this.waiting = false;

    $('#current-doc').html(htmlescape(docobj.showname));
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
  }
  
});


Room.languageMap = { 
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

Room.modeMap = {
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

app.Room = Room;

app.init || (app.init = {});

app.init.room = function() {
  app.room || (app.room = new app.Room());
  app.collections.members || (app.collections.members = new app.Members());
  app.room.members || (app.room.members = app.collections.members);
};

})();

