/* need Backbone, _, app */
var app = app || {};

(function () {
  'use strict';
    
/**
  Room View
  */
  
/* The DOM element for a file item... */
app.RoomView = Backbone.View.extend({
  el: '#editor',

  TChat:  _.template($('#chat-template').html(), null, {variable: 'd'}),

  initialize: function(opt) {
    opt || (opt = {});
    if(opt.noinit) { return this; }
    var e = this.$el, m = {
      $docState:'#current-doc-state',
      $btnRun:    '#editor-run',
      $btnDebug:  '#editor-debug',
      $btnHome:   '#editor-back',
      $btnCon:    '#editor-console',
      $under:   '#under-editor',
      $con:     'console',
      $conTitle:'#console-title',
      $conIn:   '#console-input',
      $conBox:  '#console-inner',
      $members:   '#member-list-doc',
      $chatIn:    '#chat-input',
      $chatSend:  '#chat-send',
      $chatBox:   '#chat-show-inner',
      $chatShow:  '#chat-show',
      $chatPanel: '#chatbox',
      $vars:    '#varlist',
      $varsReal:'#varlistreal',
      $varsBtns:'.debugandwait',
      $mainBox:   '#editormain-inner',
      $main:      '#editormain',
      $tip:       'fullscreentip',
    };
    for(var i in m) { this[i] = e.find(m[i]); }
  },
  
  events: {
    'shown': 'enter',
    'hide': 'exit',
    'click #chat-send': 'chat',
    'keydown #console-input':function(e) {
      ((e.keyCode || e.which) == 13) && this.stdin();
    },
    'keydown #chat-input': function(e) {
      ((e.keyCode || e.which) == 13) && this.chat();
    },
  },
  
  setShownName: function() {
    this.$('#current-doc').html(this.room.docModel.json.shownName);
  },
  
  enter: function(data) {
    this.oldscrolltop = $('body').scrollTop();
    this.listenTo(this.room.docModel, 'change', this.setShownName);
    this.setShownName();
    var that = this;
    this.editor.on("gutterClick", function(cm, n) {
      if(typeof that.gutterClick == 'function') { that.gutterclick(cm, n); }
    });
	
  },
    
  exit: function() {
    this.leaveVoiceRoom();
    $("body").animate({scrollTop: this.oldscrolltop});
    this.stopListening();
  },
  
  /* OK: */
  setBreak: function(cm, n, add) {
    add && (add = $('<div><img src="images/breakpoint.png" /></div>')[0]);
    cm.setGutterMarker(n, 'breakpoints', add || null);
  },
  
  /* OK: */
  removeAllBreaks: function(bps) {
    for(var i = 0, l = bps.length, cm = this.editor, info; i < l; i++) {
      if(b[i] != '0') {
        info = cm.lineInfo(i);
        if (info.gutterMarkers && info.gutterMarkers['breakpoints']) {
          cm.setGutterMarker(i, 'breakpoints', null);
        }
      }
    }
  },

  /* OK: TODO: merge 'runEnabled' */
  setRunState: function() {
    if(this.room.runEnabled()) { this.$btnRun.removeAttr('disabled'); }
    else { this.$btnRun.attr('disabled', 'disabled'); }
    if(this.room.debugEnabled()) { this.$btnDebug.removeAttr('disabled'); }
    else { this.$btnDebug.attr('disabled', 'disabled'); }
  },
    
  /* OK: */
  setConsole: function(opened) {
    opened = !!opened;
    if(this.consoleOpened != opened) {
      this.consoleOpened = opened;
      if(opened) {
        this.$under.show();
        this.$btnCon.addClass('active');
      } else {
        this.$under.hide();
        this.$btnCon.removeClass('active');
      }
      this.resize();
    }
    if(opened) { this.$conIn.focus(); }
  },
  
  /* OK: */
  setRun: function () {
    this.$conBox.html('');
    this.$conIn.val('');
    this.$btnRun.attr('title', strings['kill-title'] || 'kill'
      )[0].childNodes[0].className = 'icon-stop';
    this.$btnDebug.addClass('disabled');
    this.$conTitle.text(strings['console'] || 'console');
    this.setConsole(true);
  },

  /* OK: */
  setDebug: function(text) {
    this.editor.setOption('readOnly', true);
    this.$conBox.html('');
    this.$conIn.val('');
    this.$btnDebug.attr('title', strings['stop-debug-title'] || 'stop debug'
      )[0].childNodes[0].className = 'icon-eye-close';
    this.$btnRun.addClass('disabled');
    this.$conTitle.text(strings['console']);
    this.setConsole(true);
    this.room.oldText = this.editor.getValue();
    this.editor.setValue(text);
    this.popHistory();
  },
  
  /* OK: */
  popHistory: function() {
		var editordoc = this.editor.getDoc(), hist = editordoc.getHistory();
		hist.done.pop();
		editordoc.setHistory(hist);
  },
  
  /* OK: */
  onRunning: function() {
    this.runTo(-1);
    this.$varsBtns.addClass('disabled');
    this.$conTitle.text(strings['console'] || 'console');
  },
  
  /* OK: */
  onWaiting: function(data) {
    this.runTo((typeof data.line == 'number') ? (data.line - 1) : -1);
    this.$varsBtns.removeClass('disabled');
    this.$conTitle.text( strings['console'] + strings['waiting'] + (
      (typeof data.line == 'number') ? '' : (
        (data.line) ? ('[' + data.line + ']') : strings['nosource']
      ) 
    ));
  },
  
  /* OK: */
  runTo: function(n) {
    if(this.runningLine >= 0) {
      Panel.editor.removeLineClass(this.runningLine, '*', 'running');
      Panel.editor.setGutterMarker(this.running, 'runat', null);
    }
    if(n >= 0) {
      Panel.editor.addLineClass(n, '*', 'running');
      Panel.editor.setGutterMarker(n, 'runat', $('<div><img src="images/arrow.png" width="16" height="16" style="min-width:16px;min-width:16px;" /></div>').get(0));
      Panel.editor.scrollIntoView({line: n, ch: 0});
    }
    this.runningline = n;
  },
  
  /* OK: */
  stdin: function(text) {
    if(this.room.debugLock && this.room.waiting) { return; }
    var text = this.$conIn.val();
    if(this.room.runLock || this.room.debugLock) {
      this.room.stdin(text + '\n');
    } else {
      this.toConsole(text + '\n', 'stdin');
    }
    this.$conIn.val('');
  },
  
  /* OK: */
  chat: function() {
    var t = this.$chatIn.val();
    (t) && this.room.chat(t);
    this.$chatIn.val('');
  },
   
  /* OK: */
  toChatBox: function(name, type, content, time) {
    this.$chatBox.append(this.TChat({n: name, ty: type, t: time, c: content}));
    var p = this.$chatShow[0];
    p.scrollTop = p.scrollHeight;
  },
  
  /* OK: */
  toConsole: function(content, type) {
    type = (type) ? ('<span class="' + type + '">') : '<span>';
    this.$conBox.append(type + _.escape(content || '') + '</span>');
    var o =  this.$conBox[0];
    o.scrollTop = o.scrollHeight;
  },

  setSaving: function() {
    this.$docState.text(strings['saving...'] || 'saving...').addClass('red');
    this.$btnHome.attr('title', '').popover({
      html: true, content: strings['unsaved'] || 'unsaved',
      placement: 'right', trigger: 'hover', container: 'body',
    });
    this.room.timestamp = 0;
    this.room.isSaving = true;
    this.setRunState();
  },
  
  setSaved: function() {
    this.room.timestamp = new Date().getTime();
    window.setTimeout(function() {
      this.setSaved2(this.room.timestamp);
    }, this.room.saveTimeout);
    this.room.saveTimeout = 500;
  },

  setSaved2: function(stamp) {
    if(this.room.timestamp == stamp) {
      this.room.isSaving = false;
      this.$docState.removeClass('red').text(strings['saved'] || 'saved');
      this.$btnHome.popover('destroy').attr('title', strings['back'] || 'back');
      this.setRunState();
    }
  },
  
  newCursor: function(content) {
    var cur = $(
      '<div class="cursor">' +
        '<div class="cursor-not-so-inner">' +
          '<div class="cursor-inner">' +
            '<div class="cursor-inner-inner">' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>');
    cur.find('.cursor-inner').popover({
      html: true,
      content: '<b>' + content + '</b>',
      placement: 'bottom',
      trigger: 'hover',
    });
    return cur[0];
  },
  
  
  
  stopVoice: function() {
    /* TODO: add other commands */
    this.$('#voice-on').removeClass('active');
  },
  
  resize: function() {
    var w, h = $(window).height(), o = this, cbh, cbhexp, underh;
    (h < 100) && (h = 100);
    cbh = h - o.$members.height() - 138;
    cbhexp = cbh > 100 ? 0 : 100 - cbh;
    (cbh < 100) && (cbh = 100);
    o.$chatShow.css('height', cbh + 'px');
    o.$chatPanel.css('height', (h - 83 + cbhexp) + 'px');
    w = o.$main.parent().width();
    o.$main.css('width', w + 'px');
    underh = h > 636 ? 212 : h / 3;
    (o.consoleOpened) || (underh = 0);
    o.$under.css('height', underh + 'px');
    o.$con.css({
      width: (w - w / 3 - 2) + 'px',
      height: (underh - 12) + 'px',
    });
    o.$vars.css({
      width: (w / 3 - 1) + 'px',
      height: (underh - 12) + 'px',
    });
    o.varsReal.css('height', (underh - 42) + 'px');
    o.conIn.css({
      height: (underh - 81) + 'px',
      width: (w - w / 3 - 14) + 'px',
    });
    if(!this.isFullScreen(editor))
      this.$('.CodeMirror').css('height',
        (h - underh - this.$('#over-editor').height() - 90) + 'px');

    w = o.$chatShow.width();
    if(w != 0) { o.$chatIn.css('width', (w - 70) + 'px'); }
    o.$tip.css('left', (
      ( $(window).width() - o.$tip.width() ) / 2
    ) + 'px');
    o.$mainBox.css('left', ( -$(window).scrollLeft() ) + 'px');

    editor.refresh();
  },
  
  
});
    
  app.init || (app.init = {});

  app.init.roomView = function() {
    if(app.views['room']) { return; }
    app.room || app.init.room();
    var view = app.views['room'] = new app.RoomView();
    view.room = app.room;
    app.room.view = view;
    /* TODO: move to other place */
    
    view.editor = CodeMirror.fromTextArea($('#editor-textarea').get(0), {
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 4,
      indentWithTabs: true,
      extraKeys: {
        'Esc': function(cm) {
          if(view.isFullScreen(cm)) { view.setFullScreen(cm, false); }
          view.resize();
        },
        'Ctrl-S': function() { view.room.saveEvent(); },
      },
      gutters: ["runat", "CodeMirror-linenumbers", "breakpoints"],
    });
  };
    
})();
