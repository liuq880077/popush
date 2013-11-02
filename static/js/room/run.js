var app = app || {};

app.Room && _.extend(app.Room.prototype, {

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
				var that = this;
				this.view.gutterclick = function(cm, n) {
					if(that.debugLock && !that.waiting)
						return;
					if (!that.removebreakpointat(cm, n)){
						that.addbreakpointat(cm, n);
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
  onRun: function() { this.runLock = true; this.view.setRun(); },

  /* OK: TODO: merge */
  onDebug: function(data) {
    this.onDebug2(data.text, data.bps);
    this.operationLock = false;
  },
  
  /* OK: */
  onDebug2: function(text, bps) {
    this.debugLock = true;
    this.view.setDebug(text);
    this.old_bps = bps;
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
    app.collections['expressions'].reset();
    for(var k in data.exprs)
    {
    	app.collections['expressions'].add({expression: k, value: data.exprs[k]}); 
    }
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
		var that = this;
		this.socket('run', {
			version: that.docData.version,
			type: that.ext
		});
	}
  },
  
  debug: function() {
	if(!this.debugEnabled())
		return;
	if(this.operationLock)
		return;
	this.operationLock = true;
	if(this.debugLock) {
		this.socket('kill');
	} else {
		var that = this;
		this.socket('debug', {
			version: that.docData.version,
			type: that.ext
		});
	}  
  },
  
});

