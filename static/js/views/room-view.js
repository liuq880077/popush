/*编程页面视图*/
var app = app || {};
(function () {
    'use strict';
    app.RoomView = Backbone.View.extend({
        el: '#editor',
        TChat: _.template($('#chat-template').html(), null, {
            variable: 'd'
        }),
        initialize: function (opt) {
            opt || (opt = {});
            if (opt.noinit) {
                return this;
            }
            var e = this.$el,
			m = {
			    $docState: '#current-doc-state',
			    $btnRun: '#editor-run',
			    $btnDebug: '#editor-debug',
			    $btnHome: '#editor-back',
			    $btnCon: '#editor-console',
			    $under: '#under-editor',
			    $con: '#console',
			    $conTitle: '#console-title',
			    $conIn: '#console-input',
			    $conBox: '#console-inner',
			    $members: '#member-list-doc',
			    $chatIn: '#chat-input',
			    $chatSend: '#chat-send',
			    $chatBox: '#chat-show-inner',
			    $chatShow: '#chat-show',
			    $chatPanel: '#chatbox',
			    $vars: '#varlist',
			    $varsReal: '#varlistreal',
			    $varsBtns: '.debugandwait',
			    $mainBox: '#editormain-inner',
			    $main: '#editormain',
			    $tip: '#fullscreentip',
			};
            for (var i in m) {
                this[i] = e.find(m[i]);
            }
        },
        events: {
            'shown': 'enter',
            'hide': 'exit',
            'click #chat-send': 'chat',
            'click #editor-run': 'run',
            'click #editor-debug': 'debug',
            'click #editor-console': 'toggleConsole',
            'click #editor-full': 'setConsoleFull',
            'click #toggle-chat': 'togglechat',
            'click #debugstep': 'debugstep',
            'click #debugnext': 'debugnext',
            'click #debugfinish': 'debugfinish',
            'click #debugcontinue': 'debugcontinue',
            'click #voice-on': 'voice',
            'keydown #console-input': function (e) {
                ((e.keyCode || e.which) == 13) && this.stdin();
            },
            'keydown #chat-input': function (e) {
                ((e.keyCode || e.which) == 13) && this.chat();
            },
        },
        /*语音*/
        voice: function () {
            this.room.openVoice();
        },
        /*离开编程页面*/
        closeeditor: function () {
            app.socket.emit('leave', {});
            this.room.stopListen();
            $("body").animate({
                scrollTop: this.oldscrolltop
            });
            this.room.leaveVoiceRoom();
            app.resize = this.resize_old;
        },
        debugstep: function () {
            if (this.room.debugLock && this.room.waiting) {
                this.room.socket('step', {});
            }
        },
        debugnext: function () {
            if (this.room.debugLock && this.room.waiting) {
                this.room.socket('next', {});
            }
        },
        /*调试结束*/
        debugfinish: function () {
            if (this.room.debugLock && this.room.waiting) {
                this.room.socket('finish', {});
            }
        },
        debugcontinue: function () {
            if (this.room.debugLock && this.room.waiting) {
                this.room.socket('resume', {});
            }
        },
        /*开关聊天框*/
        togglechat: function () {
            if (app.viewswitchLock)
                return;
            if (this.room.chatstate) {
                $('#editormain').parent().removeClass('col-xs-12');
                $('#editormain').parent().addClass('col-xs-9');
                $('#chatbox').show();
                $('#toggle-chat').html('<span class="glyphicon glyphicon-forward"></span>');
                $('#toggle-chat').attr('title', strings['hide-title']);
            } else {
                $('#chatbox').hide();
                $('#editormain').parent().removeClass('col-xs-9');
                $('#editormain').parent().addClass('col-xs-12');
                $('#toggle-chat').html('<span class="glyphicon glyphicon-backward"></span>');
                $('#toggle-chat').attr('title', strings['show-title']);
            }
            var o = $('#chat-show').get(0);
            o.scrollTop = o.scrollHeight;
            this.editor.refresh();
            this.resize();
            this.room.chatstate = !this.room.chatstate;
        },
        /*设置代码编辑框全屏*/
        setFullScreen: function (cm, full) {
            var wrap = cm.getWrapperElement();
            if (full) {
                $('#editormain').css('position', 'static');
                $('#editormain-inner').css('position', 'static');
                $('#fullscreentip').fadeIn();
                setTimeout('$(\'#fullscreentip\').fadeOut();', 1000);
                wrap.className += " CodeMirror-fullscreen";
                wrap.style.height = $(window).height() + "px";
                document.documentElement.style.overflow = "hidden";
            } else {
                $('#editormain').css('position', 'fixed');
                $('#editormain-inner').css('position', 'relative');
                $('#fullscreentip').hide();
                wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
                wrap.style.height = "";
                document.documentElement.style.overflow = "";
            }
            cm.refresh();
            cm.focus();
        },
        setConsoleFull: function () {
            this.setFullScreen(this.editor, true);
        },
        /*开关控制台*/
        toggleConsole: function () {
            this.setConsole(!this.consoleOpened);
        },
        /*运行代码*/
        run: function () {
            this.room.run();
        },
        /*调试代码*/
        debug: function () {
            this.room.debug();
        },
        setShownName: function () {
            this.$('#current-doc').html(this.room.docModel.json.shownName);
        },
        enter: function (data) {
            this.oldscrolltop = $('body').scrollTop();
            this.listenTo(this.room.docModel, 'change', this.setShownName);
            this.setShownName();
            var that = this;
            this.editor.on("gutterClick",
			function (cm, n) {
			    if (typeof that.gutterClick == 'function') {
			        that.gutterclick(cm, n);
			    }
			});
        },
        exit: function () {
            this.room.leaveVoiceRoom();
            $("body").animate({
                scrollTop: this.oldscrolltop
            });
            this.stopListening();
        },
		/*设置断点*/
        setBreak: function (cm, n, add) {
            add && (add = $('<div><img src="images/breakpoint.png" /></div>')[0]);
            cm.setGutterMarker(n, 'breakpoints', add || null);
        },
		/*清除所有断点*/
        removeAllBreaks: function (bps) {
            for (var i = 0, l = bps.length, cm = this.editor, info; i < l; i++) {
                if (bps[i] != '0') {
                    info = cm.lineInfo(i);
                    if (info.gutterMarkers && info.gutterMarkers['breakpoints']) {
                        cm.setGutterMarker(i, 'breakpoints', null);
                    }
                }
            }
        },
        setRunState: function () {
            if (this.room.runEnabled()) {
                this.$btnRun.removeClass('disabled');
            }
            else {
                this.$btnRun.addClass('disabled');
            }
            if (this.room.debugEnabled()) {
                this.$btnDebug.removeClass('disabled');
            }
            else {
                this.$btnDebug.addClass('disabled');
            }
        },
        setConsole: function (opened) {
            opened = !!opened;
            if (this.consoleOpened != opened) {
                this.consoleOpened = opened;
                if (opened) {
                    this.$under.show();
                    this.$btnCon.addClass('active');
                } else {
                    this.$under.hide();
                    this.$btnCon.removeClass('active');
                }
                this.resize();
            }
            if (opened) {
                this.$conIn.focus();
            }
        },
        setRun: function () {
            this.$conBox.html('');
            this.$conIn.val('');
            this.$btnRun.attr('title', strings['kill-title'] || 'kill')[0].childNodes[0].className = 'glyphicon glyphicon-stop';
            this.$btnDebug.addClass('disabled');
            this.$conTitle.text(strings['console'] || 'console');
            this.setConsole(true);
        },
        setDebug: function (text) {
            this.editor.setOption('readOnly', true);
            this.$conBox.html('');
            this.$conIn.val('');
            this.$btnDebug.attr('title', strings['stop-debug-title'] || 'stop debug')[0].childNodes[0].className = 'glyphicon glyphicon-eye-close';
            this.$btnRun.addClass('disabled');
            this.$conTitle.text(strings['console']);
            this.setConsole(true);
            this.room.old_text = this.editor.getValue();
            this.editor.setValue(text);
            this.popHistory();
        },
        popHistory: function () {
            var editordoc = this.editor.getDoc(),
			hist = editordoc.getHistory();
            hist.done.pop();
            editordoc.setHistory(hist);
        },
        onRunning: function () {
            this.runTo(-1);
            this.$varsBtns.addClass('disabled');
            this.$conTitle.text(strings['console'] || 'console');
        },
        onWaiting: function (data) {
            this.runTo((typeof data.line == 'number') ? (data.line - 1) : -1);
            this.$varsBtns.removeClass('disabled');
            this.$conTitle.text(strings['console'] + strings['waiting'] + ((typeof data.line == 'number') ? '' : ((data.line) ? ('[' + data.line + ']') : strings['nosource'])));
        },
        runTo: function (n) {
            if (this.runningLine >= 0) {
                this.editor.removeLineClass(this.runningLine, '*', 'running');
                this.editor.setGutterMarker(this.runningLine, 'runat', null);
            }
            if (n >= 0) {
                this.editor.addLineClass(n, '*', 'running');
                this.editor.setGutterMarker(n, 'runat', $('<div><img src="images/arrow.png" width="16" height="16" style="min-width:16px;min-width:16px;" /></div>').get(0));
                this.editor.scrollIntoView({
                    line: n,
                    ch: 0
                });
            }
            this.runningLine = n;
        },
        stdin: function (text) {
            if (this.room.debugLock && this.room.waiting) {
                return;
            }
            var text = this.$conIn.val();
            if (this.room.runLock || this.room.debugLock) {
                this.room.stdin(text + '\n');
            } else {
                this.toConsole(text + '\n', 'stdin');
            }
            this.$conIn.val('');
        },
        chat: function () {
            var t = this.$chatIn.val(); (t) && this.room.chat(t);
            this.$chatIn.val('');
        },
        toChatBox: function (name, type, content, time) {
            time = new Date(time);
            $('#chat-show-inner').append('<p class="chat-element"><span class="chat-name ' + type + '">' + name + '&nbsp;&nbsp;' + time.toTimeString().substr(0, 8) + '</span><br />' + content + '</p>');
            var o = $('#chat-show').get(0);
            o.scrollTop = o.scrollHeight;
        },
        toConsole: function (content, type) {
            type = (type) ? ('<span class="' + type + '">') : '<span>';
            this.$conBox.append(type + _.escape(content || '').replace(/ /g, '&nbsp;').replace(/\n/gm, '<br />') + '</span>');
            var o = this.$conBox[0];
            o.scrollTop = o.scrollHeight;
        },
        setSaving: function () {
            this.$docState.text(strings['saving...'] || 'saving...').addClass('red');
            this.$btnHome.attr('title', '').popover({
                html: true,
                content: strings['unsaved'] || 'unsaved',
                placement: 'right',
                trigger: 'hover',
                container: 'body',
            });
            this.room.timestamp = 0;
            this.room.isSaving = true;
            this.setRunState();
        },
        setSaved: function () {
            this.room.timestamp = new Date().getTime();
            var that = this;
            window.setTimeout(function () {
                that.setSaved2(that.room.timestamp);
            },
			that.room.saveTimeout);
            this.room.saveTimeout = 500;
        },
        setSaved2: function (stamp) {
            if (this.room.timestamp == stamp) {
                this.room.isSaving = false;
                this.$docState.removeClass('red').text(strings['saved'] || 'saved');
                this.setRunState();
            }
        },
        newCursor: function (content) {
            var cur = $('<div class="cursor">' + '<div class="cursor-not-so-inner">' + '<div class="cursor-inner">' + '<div class="cursor-inner-inner">' + '</div>' + '</div>' + '</div>' + '</div>');
            cur.find('.cursor-inner').popover({
                html: true,
                content: '<b>' + content + '</b>',
                placement: 'bottom',
                trigger: 'hover',
            });
            return cur[0];
        },
        isFullScreen: function (cm) {
            return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
        },
        resize: function () {
            var w,
			h = $(window).height(),
			o = this,
			cbh,
			cbhexp,
			underh; (h < 100) && (h = 100);
            cbh = h - o.$members.height() - 138;
            cbhexp = cbh > 100 ? 0 : 100 - cbh; (cbh < 100) && (cbh = 100);
            o.$chatShow.css('height', cbh - 27 + 'px');
            o.$chatPanel.css('height', (h - 110 + cbhexp) + 'px');
            w = o.$main.parent().width();
            o.$main.css('width', w + 'px');
            underh = h > 636 ? 212 : h / 3; (o.consoleOpened) || (underh = 0);
            o.$under.css('height', underh + 'px');
            o.$con.css({
                width: (w - w / 3 - 2) + 'px',
                height: (underh - 12) + 'px',
            });
            o.$vars.css({
                width: (w / 3 - 1) + 'px',
                height: (underh - 12) + 'px',
            });
            o.$varsReal.css('height', (underh - 42) + 'px');
            o.$conBox.css({
                height: (underh - 81) + 'px',
            });
            o.$conIn.css({
                width: (w - w / 3 - 5) + 'px',
            });
            if (!this.isFullScreen(this.editor))
                this.$('.CodeMirror').css('height', (h - underh - this.$('#over-editor').height() - 110) + 'px');
            w = o.$chatShow.width();
            if (w != 0) {
                o.$chatIn.css('width', (w - 70) + 'px');
            }
            o.$tip.css('left', (($(window).width() - o.$tip.width()) / 2) + 'px');
            o.$mainBox.css('left', (-$(window).scrollLeft()) + 'px');
            this.editor.refresh();
        },
        changelanguage: function (language) {
            if (app.languageMap[language]) {
                if (app.modeMap[language])
                    this.editor.setOption('mode', app.modeMap[language]);
                else
                    this.editor.setOption('mode', this.languageMap[language]);
                CodeMirror.autoLoadMode(this.editor, app.languageMap[language]);
            } else {
                this.editor.setOption('mode', 'text/plain');
                CodeMirror.autoLoadMode(this.editor, '');
            }
        },
    });
    app.init || (app.init = {});
    app.init.roomView = function () {
        if (app.views['room']) {
            return;
        }
        app.room || app.init.room();
        var view = app.views['room'] = new app.RoomView();
        view.room = app.room;
        app.room.view = view;
        var Browser = {};
        var ua = navigator.userAgent.toLowerCase();
        var s; (s = ua.match(/msie ([\d.]+)/)) ? Browser.ie = s[1] : (s = ua.match(/firefox\/([\d.]+)/)) ? Browser.firefox = s[1] : (s = ua.match(/chrome\/([\d.]+)/)) ? Browser.chrome = s[1] : (s = ua.match(/opera.([\d.]+)/)) ? Browser.opera = s[1] : (s = ua.match(/version\/([\d.]+).*safari/)) ? Browser.safari = s[1] : 0;
        if ((!Browser.chrome || parseInt(Browser.chrome) < 18) && (!Browser.opera || parseInt(Browser.opera) < 12)) {
            app.novoice = true;
            $('#voice-on').addClass('disabled');
            $('#voice-on').removeAttr('title');
            $('#voice-on').popover({
                html: true,
                content: strings['novoice'],
                placement: 'left',
                trigger: 'hover',
                container: 'body'
            });
        }
        view.editor = CodeMirror.fromTextArea($('#editor-textarea').get(0), {
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 4,
            indentWithTabs: true,
            extraKeys: {
                "Esc": function (cm) {
                    if (view.isFullScreen(cm))
                        view.setFullScreen(cm, false);
                    view.resize();
                },
                "Ctrl-S": view.room.saveevent
            },
            gutters: ["runat", "CodeMirror-linenumbers", "breakpoints"]
        });
        view.gutterclick = function (cm, n) { };
        view.editor.on("gutterClick",
		function (cm, n) {
		    view.gutterclick(cm, n);
		});
        view.room.registereditorevent();
        if (!app.Package.ENABLE_RUN) {
            $('#editor-run').remove();
            if (!ENABLE_DEBUG) {
                $('#editor-console').remove();
            }
        }
        if (!app.Package.ENABLE_DEBUG) {
            $('#editor-debug').remove();
        }
    };
})();