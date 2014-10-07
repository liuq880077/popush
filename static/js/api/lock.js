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
  msg: {}, handle: 0, success: null, error: null, fail: null,
    
  begin: function() {
    var l = _lock;
    if(!(l.lock)) { return false; }
    l.handle = window.setTimeout(l.addLoading, l.t1);
    return true;
  },
  
  addLoading: function() {
    var l = _lock;
    if(l.lock) {
      app.loading(l.el);
      if(app.Package.ALLOW_MISS) {
        l.handle = window.setTimeout(app.Lock.fail, l.t2);
      }
    }
  },
  
  stop: function() {
    var l = _lock;
    window.clearTimeout(l.handle);
    l.lock = false;
    l.handle = 0;
    app.removeLoading(l.el);
    l.success = l.fail = l.error = l.el = null;
    l.msg = {};
  },
  
  callback: function(method, data) {
    var l = _lock, msg = {msg: l.msg}, f = l[method];
    app.removeLoading(l.el);
    (typeof data == 'object') || (data = {data: data});
    (typeof f === 'function') && f.call(msg, data);
    if(data.notRemove === true) {
      app.loading(l.el);
    } else {
      l.stop();
    }
  },
};

app.Lock = {
  isLocking: function() { return _lock.lock; },
  
  getMessage: function() { return _lock.msg; },
  
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
      if(options.tbegin != null) { timeBegin = options.tbegin + 0; }
      else { timeBegin = 500; }
    }
    if(timeEnd == undefined) {
      if(options.tbegin != null) { timeEnd = options.tend + 0; }
      else { timeEnd = timeBegin + 2000; }
    }
    if(timeEnd < 0) {
      timeEnd = 2147483647;
    }
    if(timeBegin >= 0 && timeEnd > timeBegin) {
      var l = _lock;
      if(l.lock)
        return false; /* necessary */
      l.lock = true;
      options || (options = {});
      l.el = selector;
      l.t1 = timeBegin;
      l.t2 = timeEnd - timeBegin;
      l.success = options.success;
      l.fail = options.fail;
      l.error = options.error;
      l.msg = options.data;
      return l.begin();
    }
    return false;
  },
  
  detach: function(data) {
	_lock.callback((data && data.err) ? 'error' : 'success', data);
  },
  
  remove: function() {
    _lock.stop();
  },
  
  removeLoading: function() {
    app.removeLoading(_lock.el);
  },
  
  addLoading: function() {
    app.loading(_lock.el);
  },
  
  fail: function() {
	_lock.callback('fail');
  },
  
  error: function(data) {
	_lock.callback('error', data);
  },
  
  success: function(data) {
	_lock.callback('success', data);
  },
  
};

})();