var app = app || {};

app.Room && _.extend(app.Room.prototype, {
  /* OK: */
  initBreaks: function(str) {
    if(!this.debugable) { return; }
    for(var i = 0, l = str.length, cm = this.view.editor, el; i < l; i++) {
      if(str[i] == "1") { this.view.setBreak(cm, i, true); }
    }
    this.bps = str + app.stringFill('0', cm.lineCount() - l);
  },
  
  /* OK: */
  removeAllBreaks: function() {
    var old = this.bps;
    this.bps.replace(/1/g, '0');
    this.view.removeAllBreaks(old);
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
  
  /* OK: */
  sendBreak: function(from, to, text) {
    var req = {version: this.docData.version, from: from, to: to, text: text};
    if(this.bq.length == 0) { this.socket('bps', req); }
    this.bq.push(req);
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
  
  havebreakat: function (cm, n) {
	var info = cm.lineInfo(n);
	if (info && info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
		return "1";
	}
	return "0";
  },

  
});

