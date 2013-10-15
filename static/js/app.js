/*global $ */
/*jshint unused:false */
var app = app || {};

app.socket = io.connect(SOCKET_IO)
app.loadDone = false;
app.failed = false;
app.loadings = {};
app.firstconnect = true;
app.viewswitchLock = false;
app.loginLock = false;
app.registerLock = false;
app.operationLock = false;
app.views = {};
app.collections = {};

app.setCookie = function(c_name, value, expiredays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + expiredays);
	document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString());
}

app.getCookie = function(c_name) {
	if (document.cookie.length > 0) {
		c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
	    	c_start = c_start + c_name.length + 1;
	    	c_end = document.cookie.indexOf(";", c_start);
	    	if (c_end == -1) 
				c_end = document.cookie.length;
	    	return unescape(document.cookie.substring(c_start, c_end));
	    } 
	}
	return "";
}

app.loadfailed = function(){
	if(app.loadDone)
		return;
	app.failed = true;
	$('#loading-init').remove();
	app.showmessage('login-message', 'loadfailed');
}

app.loading = function(id){
	if(app.loadings[id])
		return;
	var o = $('#' + id);
	o.after('<p id="' + id + '-loading" align="center" style="margin:1px 0 2px 0"><img src="images/loading.gif"/></p>');
	o.hide();
	app.loadings[id] = {self: o, loading: $('#' + id + '-loading')};
}

app.removeloading = function(id){
	if(!app.loadings[id])
		return;
	app.loadings[id].self.show();
	app.loadings[id].loading.remove();
	delete app.loadings[id];
}

app.cleanloading = function(){
	for(var k in app.loadings) {
		app.removeloading(k);
	}
}

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
}

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
}

app.resize = function() {
	var w;
	var h = $(window).height();
	if(h < 100)
		h = 100;	
	w = $('#login-box').parent('*').width();
	$('#login-box').css('left', ((w-420)/2-30) + 'px');
	w = $('#register-box').parent('*').width();
	$('#register-box').css('left', ((w-420)/2-30) + 'px');
}

$(function () {
	'use strict';

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
});

$(document).ready(function() {
	setTimeout('app.loadfailed()', 10000);
	app.checkCookie();

	$('[localization]').html(function(index, old) {
		if(strings[old])
			return strings[old];
		return old;
	});
	
	$('[title]').attr('title', function(index, old) {
		if(strings[old])
			return strings[old];
		return old;
	});
	
	main_socket();
	
	$('body').show();
	$('#login-inputName').focus();
	
	app.resize();
	$(window).resize(app.resize);
	app.views['login'] = new app.LoginView;
	app.views['register'] = new app.RegisterView;
	app.views['members'] = new app.MemberlistView;
});

