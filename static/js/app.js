var app = app || {};
app.editor = {};
(function() {

/* global variables */
_.extend(app, {
  socket: io.connect(SOCKET_IO),
  loadDone: false,
  failed: false,
  firstconnect: true,
  viewswitchLock: false,
  loginLock: false,
  registerLock: false,
  operationLock: false,
  views: {},
  collections: {},
  currentUser: null,
  currentDir: '',
  currentShownDir: '',
  docLock: false,
  fileNameReg: /[\*\\\|:\"\'\/\<\>\?\@]/,
  router: null,
});

/* check if the user has logged in. */
/* if not, it will go to '#login'. */
app.userVerify = function() {
  if(app.loginLock == false && app.currentUser) {
    return true;
  } else {
    window.location.href = '#login';
    return false;
  }
};

app.setCookie = function(c_name, value, expiredays) {
  $.cookie(c_name, value, {expires: expiredays});
};

app.getCookie = function(c_name) {
  return(window.unescape($.cookie(c_name) || ''));
};

app.loadfailed = function(){
  if(app.loadDone)
    return;
  app.failed = true;
  $('#loading-init').remove();
  app.showmessage('login-message', 'loadfailed');
};

(function() {
  var loadings = {};
  
  app.loading = function(id){
    if(!id || loadings[id])
      return;
    var o = $(id), display = o.css('display'),
      p = $('<p class="app-loading"><img src="images/loading.gif"/></p>');
    o.hide().after(p);
    loadings[id] = {self: o, loading: p, display: display};
  };

  app.removeLoading = function(id){
    if(!id || !loadings[id])
      return;
    loadings[id].self.css('display', loadings[id].display);
    loadings[id].loading.remove();
    delete loadings[id];
  };

  app.cleanLoading = function(){
    for(var k in loadings) {
      app.removeLoading(k);
    }
  };
})();

app.showInputModal = function(modal, val) {
  modal.find('.control-group').removeClass('error');
  modal.find('.help-inline').text('');
  var i = modal.find('.modal-input').val(val || '');
  modal.modal('show').on('shown', function(){
    modal.off('shown');
    var ok = modal.find('.modal-confirm');
    i.focus().bind('keypress', function(e){
			if(e.which == 13)
				ok.click();
    });
  });
};

app.showmessage = function(id, stringid, type){
  var o = $('#' + id);
  o.removeClass('alert-error');
  o.removeClass('alert-success');
  o.removeClass('alert-info');
  if(type && type != '' && type != 'warning')
    o.addClass('alert-' + type);
  if(strings[stringid])
    $('#' + id + ' span').html(strings[stringid]);
  else
    $('#' + id + ' span').html(stringid);
  o.slideDown();
};

(function() {
  var dlg = $('#messagedialog'), t;
  
  app.showMessageBox = function(title, content, timeout) {
    dlg.find('#messagedialogLabel').html(strings[title] || title);
    dlg.find('#messagedialogContent').html(strings[content] || content);
    dlg.modal('show');
    t = setTimeout(function() { dlg.modal('hide'); }, timeout*1000);
  };
})();

app.showMessageInDialog = function (selector, stringid, index) {
  var dlg = $(selector),
    eq = (index === undefined) ? '' : (':eq(' + index + ')');
  dlg.find('.control-group' + eq).addClass('error');
  dlg.find('.help-inline' + eq).text(strings[stringid] || stringid);
}

app.htmlescape = function(text) {
	return text.
		replace(/&/gm, '&amp;').
		replace(/</gm, '&lt;').
		replace(/>/gm, '&gt;').
		replace(/ /gm, '&nbsp;').
		replace(/\n/gm, '<br />');
}

/* 检查关于语言选项的cookie, 设置strings=strings_en/strings_cn */
app.checkCookie = function(){
  var language = app.getCookie('language')
  if (language == 'cn') {
    strings = strings_cn;
  }
  else if (language == 'en') {
    strings = strings_en;
  }
  else {
    /*language=prompt('Please enter your language("cn" or "en"):',"");
    if (language!=null && language!="") {
      setCookie('language',language,365);
      window.location.href = "index.html";
    }*/
    app.setCookie('language','cn',365);
    strings = strings_cn;
  }
};

/* 点击"中英切换"按钮触发的js函数，中文版本/英文版本之间切换 */
app.changeLanguage = function() {
  if (strings === strings_cn) {
    app.setCookie('language','en',365);
    strings_old = strings;
    strings = strings_en;
  }
  else {
    app.setCookie('language','cn',365);
    strings_old = strings;
    strings = strings_cn;
  }
  
  $('[title]').attr('title', function(index, old) {
    for(var name in strings_old) {
      if(strings_old[name] == old)
        return strings[name];
    }
    return old;
  });
  
  $('[localization]').html(function(index, old) {
    for(var name in strings_old) {
      if(strings_old[name] == old)
        return strings[name];
    }
    return old;
  }); 
};

app.isFullScreen = function(cm) {
	return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
};

app.winHeight = function() {
	return window.innerHeight || (document.documentElement || document.body).clientHeight;
};

app.setFullScreen = function(cm, full) {
	var wrap = cm.getWrapperElement();
	if (full) {
		$('#editormain').css('position', 'static');
		$('#editormain-inner').css('position', 'static');
		$('#fullscreentip').fadeIn();
		setTimeout('$(\'#fullscreentip\').fadeOut();', 1000);
		wrap.className += " CodeMirror-fullscreen";
		wrap.style.height = winHeight() + "px";
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
};

app.resize = function() {
	var w;
	var h = $(window).height();
	if(h < 100)
		h = 100;
	var cbh = h-$('#member-list-doc').height()-138;
	var cbhexp = cbh > 100 ? 0 : 100 - cbh;
	if(cbh < 100)
		cbh = 100;
	$('#chat-show').css('height', cbh + 'px');
	$('#chatbox').css('height', (h-83+cbhexp) + 'px');
	w = $('#editormain').parent().width();
	$('#editormain').css('width', w);
	var underh = h > 636 ? 212 : h/3;
	if(!consoleopen)
		underh = 0;
	$('#under-editor').css('height', underh + 'px');
	$('#console').css('width', (w-w/3-2) + 'px');
	$('#varlist').css('width', (w/3-1) + 'px');
	$('#console').css('height', (underh-12) + 'px');
	$('#varlist').css('height', (underh-12) + 'px');
	$('#varlistreal').css('height', (underh-42) + 'px');
	$('#console-inner').css('height', (underh-81) + 'px');
	$('#console-input').css('width', (w-w/3-14) + 'px');
	if(!app.isFullScreen(app.editor))
		$('.CodeMirror').css('height', (h-underh-$('#over-editor').height()-90) + 'px');

	w = $('#chat-show').width();
	if(w != 0)
		$('#chat-input').css('width', (w-70) + 'px');
	
	$('#file-list .span10').css('min-height', (h-235) + 'px');
	
	w = $('#login-box').parent('*').width();
	$('#login-box').css('left', ((w-420)/2-30) + 'px');
	w = $('#register-box').parent('*').width();
	$('#register-box').css('left', ((w-420)/2-30) + 'px');
	$('#fullscreentip').css('left', (($(window).width()-$('#fullscreentip').width())/2) + 'px');

	$('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');

	app.editor.refresh();
};

app.docobj = {};

(function () {
  
  app.socket.on('version', function(data){
    if(data.version != VERSION) {
      location.reload('Refresh');
    }
    if(app.failed)
      return;
    if(!app.firstconnect) {
      //back to login
    }
    app.firstconnect = false;
    $('#loading-init').remove();
    app.cleanLoading();
    if($.cookie('sid')){
      app.socket.emit('relogin', {sid:$.cookie('sid')});
      app.loading('#login-control');
      app.loginLock = true;
    } else {
      $('#login-control').fadeIn('fast');
    }
    app.loadDone = true;
  });

  app.socket.on('connect', function(){
    app.socket.emit('version', {
    });
  });
})();

$(document).ready(function() {
  window.setTimeout(app.loadfailed, 10000);

  app.checkCookie();
  var getLanguageString = function(index, old) {
    return strings[old] || old;
  };
  $('[localization]').html(getLanguageString);
  $('[title]').attr('title', getLanguageString);
  
  $('body').show();
  $('#login-inputName').focus();
  
  app.views['login'] = new app.LoginView;
  app.views['register'] = new app.RegisterView;
  
  var temp;
  temp = app.collections['files'] = new app.Files();
  app.views['files'] = new app.FilesView({
    collection: temp,
    mode: app.FilesView.Mode.BelongSelf,
  });
  
  temp = app.collections['members'] = new app.Members();
  app.views['members'] = new app.MemberlistView({collection: temp});
  
  temp = app.collections['cooperators'] = new app.Members();
  app.views['cooperators'] = new app.MemberlistView({collection: temp});

  temp = app.collections['expressions'] = new app.Expressions();
  app.views['expressions'] = new app.ExpressionlistView({collection: temp});

  app.main_socket();
 
  /* TODO: remove this, and use a router. */
  $('.container-fluid').on('click', 'a.file-go', function(e) {
    var h = $(e.target).attr('href');
    if(h.substring(0, 7) == '#index/') {
      app.views['files'].go(h.substring(6));
    }
  });
  
	expressionlist = expressionList('#varlist-table');

	CodeMirror.on(window, "resize", function() {
		var showing = document.getElementsByClassName("CodeMirror-fullscreen")[0];
		if (!showing) return;
		showing.CodeMirror.getWrapperElement().style.height = winHeight() + "px";
	});

	app.editor = CodeMirror.fromTextArea($('#editor-textarea').get(0), {
		lineNumbers: true,
		lineWrapping: true,
		indentUnit: 4,
		indentWithTabs: true,
		extraKeys: {
			"Esc": function(cm) {
				if (isFullScreen(cm)) setFullScreen(cm, false);
				resize();
			},
			"Ctrl-S": saveevent
		},
		gutters: ["runat", "CodeMirror-linenumbers", "breakpoints"]
	});
	
	app.editor.on("gutterClick", function(cm, n) {
		gutterclick(cm, n);
	});
	
	gutterclick = function(cm, n) {};
	
	registereditorevent();
	if(!ENABLE_RUN) {
		$('#editor-run').remove();
		if(!ENABLE_DEBUG) {
			$('#editor-console').remove();
		}
	}

	if(!ENABLE_DEBUG) {
		$('#editor-debug').remove();
	}
	
	var Browser = {};
	var ua = navigator.userAgent.toLowerCase();	
	var s;
	(s = ua.match(/msie ([\d.]+)/)) ? Browser.ie = s[1] :
	(s = ua.match(/firefox\/([\d.]+)/)) ? Browser.firefox = s[1] :
	(s = ua.match(/chrome\/([\d.]+)/)) ? Browser.chrome = s[1] :
	(s = ua.match(/opera.([\d.]+)/)) ? Browser.opera = s[1] :
	(s = ua.match(/version\/([\d.]+).*safari/)) ? Browser.safari = s[1] : 0;

	if((!Browser.chrome || parseInt(Browser.chrome) < 18) &&
		(!Browser.opera || parseInt(Browser.opera) < 12)) {
		novoice = true;
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

  app.resize();
  $(window).resize(app.resize);
	$(window).scroll(function() {
		$('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');
	});
});

})();
