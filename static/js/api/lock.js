var app = app || {};

(function() {
  var loadings = {};
  
  app.loading = function(id){
    if(!id || loadings[id])
      return;
    var o = $(id), display = o.css('display'),
      p = $('<p class="app-loading"><img src="images/loading.gif" /></p>');
    o.hide().after(p);
    loadings[id] = {self: o, loading: p, display: display};
  };

  app.removeLoading = function(id){
    if(!id || !loadings[id])
      return;
    loadings[id].loading.remove();
    loadings[id].self.css('display', loadings[id].display);
    delete loadings[id];
  };

  app.cleanLoading = function(){
    for(var k in loadings) {
      app.removeLoading(k);
    }
  };
  
})();

/* Class Lock */
(function() {
var _lock = {
  lock: false, el: null, t1: 500, t2: 2000,
  msg: {}, handle: 0, success: null, fail: null,
    
  begin: function() {
    var l = _lock;
    if(l.lock) {
      return false;
    } else {
      l.lock = true;
      l.handle = window.setTimeout(l.add, l.t1);
      return true;
    }
  },
  
  add: function() {
    var l = _lock;
    if(l.lock) {
      app.loading(l.el);
      if(app.Package.ALLOW_MISS) {
        l.handle = window.setTimeout(function() {
          var f = l.fail;
          l.remove();
          if(typeof f === 'function') {
            f();
          }
        }, l.t2);
      }
    }
  },
  
  remove: function() {
    var l = _lock;
    window.clearTimeout(l.handle);
    l.lock = false;
    l.handle = 0;
    app.removeLoading(l.el);
    l.success = l.fail = l.el = null;
    l.msg = {};
  },
  
};

app.Lock = {
  isLocking: function() {
    return _lock.lock;
  },
  
  attach: function(selector, timeShowLoading, timeEnd, options) {
    var timeBegin = timeShowLoading;
    if(!options) {
      if(typeof timeEnd === 'object') {
        options = timeEnd;
        timeEnd = undefined;
      } else if(typeof timeBegin === 'object') {
        options = timeBegin;
        timeBegin = undefined;
      } else if(typeof selector === 'object'){
        options = selector;
        selector = options.loading;
      }
    }
    if(timeBegin == undefined) {
      if(options.tbegin >= 0) { timeBegin = options.tbegin + 0; }
      else { timeBegin = 500; }
    }
    if(timeEnd == undefined) {
      if(options.tend >= 0) { timeEnd = options.tend + 0; }
      else { timeEnd = timeBegin + 2000; }
    }
    if(timeEnd < 0) {
      timeEnd = 2147483647;
    }
    if(timeBegin < 0 || (timeEnd <= timeBegin)) {
      return false;
    }
    
    var l = _lock;
    if(l.lock)
      return false; /* necessary */
    options || (options = {});
    l.el = selector;
    l.t1 = timeBegin;
    l.t2 = timeEnd - timeBegin;
    l.success = options.success;
    l.fail = options.fail;
    l.error = options.error;
    l.msg = options.data;
    return l.begin();
  },
  
  remove: function() {
    _lock.remove();
  },
  
  removeLoading: function () {
    app.removeLoading(_lock.el);
  },
  
  getMessage: function() {
    return _lock.msg;
  },
  
  success: function() {
    if(typeof _lock.success === 'function') {
      _lock.success.apply(this, arguments);
    }
  },
  
  error: function() {
    if(typeof _lock.error === 'function') {
      _lock.error.apply(this, arguments);
    }
  },
  
  fail: function() {
    if(typeof _lock.fail === 'function') {
      _lock.fail.apply(this, arguments);
    }
  },
  
};

})();