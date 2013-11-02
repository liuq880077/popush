var app = app || {};

app.Room && _.extend(app.Room.prototype, {

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
  
  newCursor: function(content) {
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
  },
  
  /* TODO: */
  saveEvent: function(cm) {
    if(this.timestamp != 0) { this.view.setSaved2(this.timestamp); }
    this.timestamp = 0;
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
				if(room.q.length == 0){
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
