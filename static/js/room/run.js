var app = app || {};

/* 房间代码运行控制器 */
app.Room && _.extend(app.Room.prototype, {
	
	//判断是否可运行
	isrunable: function(ext) {
		for(var i=0; i<app.RunableExt.length; i++) {
			if(app.RunableExt[i] == ext)
				return true;
		}
		return false;
  	},

	//判断是否可调试
	isdebugable: function(ext) {
		for(var i=0; i<app.DebugableExt.length; i++) {
			if(app.DebugableExt[i] == ext)
				return true;
		}
		return false;
  	},
  
  	//设置运行调试状态
  	setrunanddebugstate: function(){
		$('#editor-run').removeClass('disabled');
		$('#editor-debug').removeClass('disabled');
		if(!this.runEnabled())
			$('#editor-run').addClass('disabled');
		if(!this.debugEnabled())
			$('#editor-debug').addClass('disabled');
  	},	
  	
  	/* 确认是否可以运行调试 */
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
  
  	//是否当前在运行
	runEnabled: function() {
		return (this.runable && !this.debugLock && (!this.isSaving || this.runLock));
	},

	//是否当前在调试
	debugEnabled: function() {
		return (this.debugable && !this.runLock && (!this.isSaving || this.debugLock));
	},

	//处理运行事件
	onRun: function() { 
		this.runLock = true; 
		this.view.setRun(); 
	},

	//处理调试事件
	onDebug: function(data) {
		this.onDebug2(data.text, data.bps);
	    this.operationLock = false;
	},	
  
  	//处理调试事件2
	onDebug2: function(text, bps) {
    	this.debugLock = true;
    	this.view.setDebug(text);
    	this.old_bps = bps;
    	this.removeAllBreaks();
    	this.initBreaks(bps);
	},	
  	
	//处理正在运行事件
	onRunning: function(data) {
		if(!this.debugLock) { return; }
		this.waiting = false;
		this.view.onRunning();
	},
  
  	//处理调试断点停留事件
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
  
  	//处理运行开始事件
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
  	
  	//处理正在调试事件
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

