var app = app || {};

(function() {

/* global variables */
_.extend(app, {
  socket: io.connect(SOCKET_IO),
  loadDone: false,
  failed: false,
  loadings: {},
  firstconnect: true,
  viewswitchLock: false,
  loginLock: false,
  registerLock: false,
  operationLock: false,
  views: {},
  collections: {},
  currentUser: '',
  currentDir: [],
  currentDirString: '',
  docLock: false,
  docWaitingLock: false,
});


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

app.loading = function(id){
  if(app.loadings[id])
    return;
  var o = $('#' + id);
  o.after('<p id="' + id + '-loading" align="center" style="margin:1px 0 2px 0"><img src="images/loading.gif"/></p>');
  o.hide();
  app.loadings[id] = {self: o, loading: $('#' + id + '-loading')};
};

app.removeloading = function(id){
  if(!app.loadings[id])
    return;
  app.loadings[id].self.show();
  app.loadings[id].loading.remove();
  delete app.loadings[id];
};

app.cleanloading = function(){
  for(var k in app.loadings) {
    app.removeloading(k);
  }
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
  var dialog = $('#messagedialog'), t;
  app.showmessagebox = function(title, content, timeout) {
    dialog.find('#messagedialogLabel').html(strings[title] || title);
    dialog.find('#messagedialogContent').html(strings[content] || content);
    dialog.modal('show');
    t = setTimeout(function() {
      dialog.modal('hide');
    }, timeout*1000);
  };
  
})();

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
  var language=app.getCookie('language')
  if (language == 'cn') {
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

app.resize = function() {
  var w;
  var h = $(window).height();
  if(h < 100)
    h = 100;  
  w = $('#login-box').parent('*').width();
  $('#login-box').css('left', ((w-420)/2-30) + 'px');
  w = $('#register-box').parent('*').width();
  $('#register-box').css('left', ((w-420)/2-30) + 'px');
};

app.getDirString = function() {
  if(dirMode == 'owned')
    return '/' + currentDir.join('/');
  else {
    var name = currentDir.shift();
    var r = '/' + currentDir.join('/');
    if(currentDir.length == 0) {
      r = '/' + name;
    }
    currentDir.unshift(name);
    return r;
  }
};

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
    app.cleanloading();
    if($.cookie('sid')){
      app.socket.emit('relogin', {sid:$.cookie('sid')});
      app.loading('login-control');
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
  app.resize();
  $(window).resize(app.resize);
  
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
  
  app.main_socket();
  
  /* 
  app.socket.emit('login', {
    name: 'gdh1995',
    password: 'gdh1995',
  }); */
});

})();