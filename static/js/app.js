var app = app || {};
var strings = strings || {};

/* global variables */
_.defaults(app, {
  socket: io.connect(app.Package.SOCKET_IO),
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
  editor: {},
  noVoice: false,
  inRoom: false,
});

/* check if the user has logged in. */
/* if not, it will go to '#login'. */
app.loginVerify = function() {
  if(app.loginLock == false && app.currentUser) {
    return true;
  } else {
    windows.setTimeout(function () {
      window.location.href = '#login';
    }, 5);
    return false;
  }
};

app.showMessageBar = function(id, stringid, type){
  var o = $(id);
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

/* 
app.setCookie = function(c_name, value, expiredays) {
  $.cookie(c_name, value, {expires: expiredays});
};

app.getCookie = function(c_name) {
  return(window.unescape($.cookie(c_name) || ''));
};
 */

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

$(document).ready(function() {
  var funcs = app.init;
  for(var i in funcs) {
    if(funcs.hasOwnProperty(i) && typeof funcs[i] === 'function') {
      funcs[i].call(app);
    }
  }
  delete funcs;
  delete app.init; /* now it's no use to run it again*/
    
  $('body').show();
  
  app.resize();
  $(window).resize(function() {
    /* app.resize is only a pointer */
    (typeof app.resize === 'function') && app.resize();
  });
  
  var isOK = app.Lock.attach() {
    loading: '#login-control',
    tbegin: 2000,
    tend: 5000,
    data: 'pageIsLoading',
    fail: function() {
      app.failed = true;
      app.showMessageBar('login-message', 'loadfailed');
    },
  }
  if(isOK) {
    app.socket.emit('connect', { });
  }
  app.Lock.detach();
});
