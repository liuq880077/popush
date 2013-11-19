/* Page Router */
var app = app || {}; 

(function() {
  var Page = app.Page = function(opts) {
    this.shown = false;
    _.extend(this, opts);
    return this;
  };
  Page.prototype.show = function() { this.el.show(); };
  Page.prototype.hide = function() { this.el.hide(); };
  Page.prototype.fadeIn = function() { this.el.fadeIn('fast'); };
  Page.prototype.fadeOut = function() { this.el.fadeOut('fast'); };
  
  var PageRouter = Backbone.Router.extend({
    routes: {
      'login': function() { this.analy('login'); },
      'register': function() { this.analy('register'); },
      'index/*filepath': function(arg1) { this.analy('index', arg1); },
      '/*filepath': function(arg1) { this.analy('index', arg1); },
      'edit/': function(arg1) { this.analy('edit'); },
    },
    
    pages: {
      login: new Page({
        el: '#login',
        depend: ['_head1', '_footer', '_ads'],
        logined: 0,
        force: true,
        show: function() {
          this.el.show();
          app.views.login.show();
        },
        hide: function() {
          this.el.find('#login-padding').slideDown();
          this.el.hide();
        },
      }),

      register: new Page({
        el: '#register',
        depend: ['_head1', '_footer', '_ads'],
        force: true,
        show: function() {
          this.el.show();
          app.views.register.show();
        },
        hide: function() {
          this.el.find('#register-padding').slideUp();
          this.el.hide();
        },
      }),

      index: new Page({
        el: '#filecontrol',
        depend: ['_head2', '_footer'],
        logined: true,
        force: true,
        show: function(arg1) {
          if (arg1 != '/') {
            var refresh = function() {
              app.views.files.go('/' + arg1);
            };
            if (this.shown) {
              refresh();
            } else {
              this.el.fadeIn('fast', refresh);
            }
          } else {
            this.el.fadeIn('fast');
          }
        },
      }),
      
      edit: new Page({
        el: '#editor',
        depend: ['_head2'],
        logined: true,
        show: Page.prototype.fadeIn,
        hide: function() {
          app.views.room.closeeditor();
          this.el.hide();
        },
      }),
      
      // dependency
      _head1: new Page ({ el: '#big-one' }),
      _head2: new Page ({ el: '#nav-head' }),
      _footer: new Page ({ el: '#footer' }),
      _ads: new Page ({ el: '#popush-info' }),
    },

    analy: function(name) {
      if (this.routeLock) {
        return;
      } else {
        this.routeLock = true;
      }
      var page = this.pages[name];
      if (page.shown && !(page.force)) {
        return;
      }
      var show = function(page) {
        if (page.logined && !(app.isLogined)) {
          return;
        }
        if (! (page.shown) || page.force) {
          page.show();
        }
      };
      var pages = this.pages, arr1 = [];
      var recurse = function(p1) {
        arr1.push(p1);
        var a = pages[p1].depend;
        if (a) {
          for (var i = a.length; i--;) {
            if (arr1.indexOf(a[i]) == -1) {
              recurse(a[i]);
            }
          }
        }
      };
      recurse(name);

      var i, j, p;
      for (i = arr1.length, j = 0; i--; ) {
        p = pages[arr1[i]];
        if (p.logined && !(app.isLogined)) { j = -1; break; }
        else if (p.logined === 0 && app.isLogined) { j = 1; break; }
      }
      if (j === -1) {
        window.setTimeout(function() { window.location.href = '#login'; }, 10);
      } else if (j === 1) {
        window.setTimeout(function() { window.location.href = '#index//'; }, 10);
      } else {
      for (var h in pages) {
        if (pages[h].shown && (arr1.indexOf(h) == -1)) {
          pages[h].hide();
          pages[h].shown = false;
        }
      }
      for (i = arr1.length, j = 0; i--; ) {
        p = pages[arr1[i]];
        if (!(p.shown) || p.force) { p.show(arguments[1]); p.shown = true; j = 1; }
      }
      if ((j === 1) && (typeof app.resize === 'function')) { app.resize(); }
      }
      this.routeLock = false;

    },

    initialize: function() {
      var pages = this.pages, j;
      for (var i in pages) {
        j = pages[i];
        if (j.el) {
          j.el = $(j.el);
          j.shown = !(j.el.is(':hidden'));
        }
      }
      this.routeLock = false;
    }
  });

  app.init.router = function() { 
    (app.router) || (app.router = new PageRouter());
  };
})();
