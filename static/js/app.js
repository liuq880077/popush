var app = app || {};
app.editor = {};
(function() {

/* global variables */
_.defaults(app, {
  socket: io.connect(app.Package.SOCKET_IO),
  loadDone: false,
  failed: false,
  firstconnect: true,
  viewswitchLock: false,
  loginLock: false,
  registerLock: false,
  isShare: false,
  views: {},
  collections: {},
  currentUser: null,
  docLock: false,
  fileNameReg: /[\*\\\|:\"\'\/\<\>\?\@]/,
  fileExtReg: /(.*[\/\.])?\s*(\S+$)/,
  router: null,
  sharemodel: null,
  /* for Room */
  noVoice: false,
  inRoom: false,
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

app.showmessage = function(id, stringid, type){
  var o = $('#' + id);
  o.removeClass('alert-error alert-success alert-info');
  if(type && type != 'warning')
    o.addClass('alert-' + type);
  (stringid == null) && (stringid = 'inner error');
  $('#' + id + ' span').html(strings[stringid] || stringid);
  o.slideDown();
};

app.showInputModal = function(modal, val) {
  modal.find('.control-group').removeClass('error').find('input').val('');
  modal.find('.help-inline').text('');
  var i = modal.find('.modal-input').val(val || '');
  modal.modal('show').on('shown', function() {
    var ok = modal.find('.modal-confirm');
    i.focus().on('keydown', function(e){
      var k = e.keyCode || e.which;
      if(k == 13) { ok && ok.click(); }
      else if(k == 27) { modal.modal('hide'); }
    });
  });
};

(function() {
  var modal = $('#messagedialog'), $title = modal.find('#messagedialogLabel'),
    $content = modal.find('#messagedialogContent');
  
  app.showMessageBox = function(title, content, timeout) {
    (title == null) && (title = 'error');
    (content == null) && (content = 'inner error');
    $title.html(strings[title] || title);
    $content.html(strings[content] || content);
    timeout || (timeout = 1000);
    modal.modal('show');
    window.setTimeout(function() { modal.modal('hide'); }, timeout);
  };
})();

app.showMessageInDialog = function (selector, stringid, index) {
  var modal = $(selector),
    eq = (index === undefined) ? '' : (':eq(' + index + ')');
  modal.find('.control-group' + eq).addClass('error');
  (stringid == null) && (stringid = 'inner error');
  modal.find('.help-inline' + eq).text(strings[stringid] || stringid);
}

app.setCookie = function(c_name, value, expiredays) {
  $.cookie(c_name, value, {expires: expiredays});
};

app.getCookie = function(c_name) {
  return(window.unescape($.cookie(c_name) || ''));
};

/* 检查关于语言选项的cookie, 设置strings=strings_en/strings_cn */
app.checkCookie = function(){
  var language = app.getCookie('language');
  if(language == 'cn') {
    strings = strings_cn;
  }
  else if(language == 'en') {
    strings = strings_en;
  }
  else {
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
  
  var map = {}, i;
  for(i in strings_old) {
    map[strings_old[i]] = strings[i];
  }
  var fromMap = function(index, old) {
    return map[old] || old;
  }
  $('[title]').attr('title', fromMap);
  $('[localization]').html(fromMap);
  delete map;
};

app.isFullScreen = function(cm) {
	return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
};

app.winHeight = function() {
	return window.innerHeight || (document.documentElement || document.body).clientHeight;
};

app.resize = function() {
	var w;
	var h = $(window).height();
	if(h < 100)
		h = 100;
/*	var cbh = h-$('#member-list-doc').height()-138;
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
*/	
	$('#file-list .span10').css('min-height', (h-235) + 'px');
	
	w = $('#login-box').parent('*').width();
	$('#login-box').css('left', ((w-420)/2-30) + 'px');
	w = $('#register-box').parent('*').width();
	$('#register-box').css('left', ((w-420)/2-30) + 'px');
/*	$('#fullscreentip').css('left', (($(window).width()-$('#fullscreentip').width())/2) + 'px');

	$('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');

	app.editor.refresh();
*/
};

app.Path = {
  encode: function(path, shared) {
    if(!path || path.charAt(0) != '/') return '';
    if(path.length == 1) { return '/' + app.currentUser.name; }
    var s = path.split('/');
    if(s[1] == app.currentUser.name) {
      return (s.length != 2 || shared !== true) ? path : ('/shared@' + s[1]);
    } else {
      var p = '/shared@' + app.currentUser.name;
      if(s.length <= 2) { return p; }
      p += '/' + s[2] + '@' + s[1];
      return (s.length <= 3) ? p : (p + '/' + s.slice(3).join('/'));
    }
  },
  
  decode: function(shownPath) {
    if(typeof shownPath == null) { return ''; }
    var p = window.decodeURI(shownPath).replace(/\\/g, '/'), s;
    if(p.charAt(0) != '/') { return ''; }
    
    if(p.substring(0, 8) == '/shared@') {
      s = p.substring(8);
      var i = s.indexOf('/');
      if(i <= -1 || i == s.length - 1) {
        p = '/' + app.currentUser.name;
      } else {
        s = s.substring(i + 1).split('/');
        i = s[0].split('@');
        if(!i[0] || !i[1]) { return ''; }
        s[0] = '/' + i[1] + '/' + i[0];
        p = s.join('/');
      }
    }
    if(p.length <= 1) { p = '/' + app.currentUser.name; }
    else if(p.charAt(s = p.length - 1) == '/') { p = p.substring(0, s); }
    return p;
  },
};

app.socket.on('version', function(data){
  if(data.version != app.Package.VERSION) {
    window.location.reload('Refresh');
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


app.loadfailed = function(){
  if(app.loadDone)
    return;
  app.failed = true;
  $('#loading-init').remove();
  app.showmessage('login-message', 'loadfailed');
};

$(document).ready(function() {
  
  window.setTimeout(app.loadfailed, 5000);

  app.checkCookie();
  var getLanguageString = function(index, old) {
    return strings[old] || old;
  };
  $('[localization]').html(getLanguageString);
  $('[title]').attr('title', getLanguageString);
  
  
  $('body').show();
  app.resize();
  $(window).resize(app.resize);
  $('#login-inputName').focus();
      
  var funcs = app.init;
  for(var i in funcs) {
    if(funcs.hasOwnProperty(i) && typeof funcs[i] == 'function') {
      funcs[i].call(app);
    }
  }
  delete app.init; /* not necessary */
  
  /* TODO: remove this, and use a router. */
  $('.container-fluid').on('click', 'a.file-go', function(e) {
    var h = $(e.target).attr('href');
    if(h.substring(0, 7) == '#index/') {
      app.views['files'].go(h.substring(6));
    }
  });
  
  app.resize();
  $(window).resize(app.resize);

});

})();
