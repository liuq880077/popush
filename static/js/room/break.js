var app = app || {};

/* 房间断点控制器 */
app.Room && _.extend(app.Room.prototype, {
  
  	// 初始化断点
	initBreaks: function(str) {
    	if(!this.debugable) { return; }
    	for (var i = 0, l = str.length, cm = this.view.editor, el; i < l; i++) {
	    	if(str[i] == "1") { this.view.setBreak(cm, i, true); }
    	}
    	this.bps = str + app.stringFill('0', cm.lineCount() - l);
  	},

	// 删除断点  
	removeAllBreaks: function() {
		var old = this.bps;
		this.bps.replace(/1/g, '0');
		this.view.removeAllBreaks(old);
	},

	// 删除指定断点
	removebreakpointat: function(cm, n){
		var info = cm.lineInfo(n);
		if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
			cm.setGutterMarker(n, 'breakpoints', null);
			this.sendBreak(n, n+1, "0");
			return true;
		}
		return false;
  	},

	// 添加指定断点
	addbreakpointat: function(cm, n){
		var addlen = n - this.bps.length;
		if (addlen > 0){
			var addtext = "";
			for (var i = this.bps.length; i < n-1; i++){
				addtext += "0";
			}
			addtext += "1";
			this.sendBreak(this.bps.length, this.bps.length, addtext);
		}
		else{
			this.sendBreak(n, n+1, "1");
		}

		var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
		cm.setGutterMarker(n, 'breakpoints', element);
	},

	// 请求发送断点  
	sendBreak: function(from, to, text) {
		var req = {version: this.docData.version, from: from, to: to, text: text};
		if(this.bq.length == 0) { 
			this.socket('bps', req); 
		}
		this.bq.push(req);
	},

	// 发送断点处理 
	onSetBreak: function(cm, n) {
		if(this.debugLock && !this.waiting) { return; }
		var info = cm.lineInfo(n);
    	if(info.getterMarkers && info.getterMarkers['breakpoints']) {
    		this.sendBreak(n, n + 1, '0');
      		this.view.setBreak(cm, n, false);
	    } else {
    		var oldl = this.bps.length;
      		if(n <= oldl) { 
      			this.sendBreak(n, n + 1, '1'); 
      		} else {
        		this.sendBreak(oldl, oldl, app.stringFill('0', n - 1 - oldl) + '1');
      		}
      		this.view.setBreak(cm, n, true);
    	}
  	},
  
  	// 判断是否指定处有断点
	havebreakat: function (cm, n) {
		var info = cm.lineInfo(n);
		if (info && info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
			return "1";
		}
		return "0";
	},
  
});

