var app = app || {};

(function() {

app.Room && _.extend(app.Room.prototype, {

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

  /* TODO: merge it */
  /* haveBreakAt: function(cm, n) {
    var info = cm.lineInfo(n);
    return !!(info && info.gutterMarkers && info.gutterMarkers["breakpoints"]);
  }, */
  
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
  
  /** --------- Members ----------- */
  
  /* TODO: members & cursors*/
  onJoin: function(data) {
    /* TODO: members */
    app.views['cooperators'].setonline(data.name, true);
    var that = this;
    this.setCursor(data.name, { pos: 0,
      element: that.newCursor(data.name),
    });
  },
  
  /* TODO: members */
  onLeave: function(data) {
	app.views['cooperators'].setonline(data.name, false);
    this.setCursor(data.name, null);
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
    $('#editor-run').html('<span class="glyphicon glyphicon-play"></span>').attr('title',
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
    this.view.changelanguage(this.ext);
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
      var cursor = this.newCursor(i);
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
    app.views['expressions'].clear();
    for(var k in data.exprs) {
      app.collections['expressions'].add({expression: k, value: data.exprs[k], notnew: true});
    }
    
    $('#console-title').text(strings['console']);
    
    
    this.view.resize();
    $('body').scrollTop(99999);
    
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

