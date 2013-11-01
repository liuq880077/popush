var app = app || {};

/* this closure is NOT necessary */
(function() {

/* modify default options of some Backbone's functions */
(function() {
  /* backup */
  var _save = Backbone.Model.prototype.save
    , _destroy = Backbone.Model.prototype.destroy
    , _create = Backbone.Collection.prototype.create
    ;

  /* set the default value of "options.wait" = true */
  Backbone.Model.prototype.save = function(key, val, options) {
    /* typeof null === 'object' */
    var attr = key;
    if (typeof key !== 'object') { (attr = {})[key] = val;}
    else { options = val; }
    options || (options = {});
    options.wait = (options.wait !== false);
    _save.call(this, attr, options);
  };

  Backbone.Model.prototype.destroy = function(options) {
    options || (options = {});
    options.wait = (options.wait !== false);
    _destroy.call(this, options);
  };

  Backbone.Collection.prototype.create = function(model, options) {
    options || (options = {});
    options.wait = (options.wait !== false);
    _create.call(this, model, options);
  }
})();

/* new sync */
app.File.prototype.sync = function(method, model, options) {
  if( !(app.Lock.attach(options)) ) { return false; }
  var m, d = {path: model.get('path')};
  switch(method) {
  case 'read': m = 'doc'; break;
  case 'patch': case 'update': m = 'move';
    d = { path: options.oldPath, newPath: model.get('path'), };
    break;
  case 'create': m = 'new'; d.type = model.get('type'); break;
  case 'delete': m = 'delete'; break;
  }
  app.socket.emit(m, d);
};

(function() {
  var dealDoc = function(data) {
    if(!data || !data.doc) { return; }
    if(data.doc.type && data.doc.type != 'dir') {
      app.room.tryEnter(new app.File(data.doc), '#no-file');
    } else {
      var a = data.doc.members;
      if(a) {
        var b = data.doc.docs, i;
        if(b && b.length) { for(i = b.length; --i >= 0; ) { b[i].members = a; }}
        if(data.doc.owner) { (a = _.clone(a)).unshift(data.doc.owner); }
      } else { a = app.currentUser; }
      
      if(typeof success == 'function') { success(data.doc.docs || data.doc); }
      app.collections['members'][method](a);
    }
  };
  
  var success = null, method = 'reset';
    
  app.Files.prototype.sync = function(m, c, options) {
    if(m !== 'read') { return; }
    success = options.success;
    method = options.reset ? 'reset' : 'set';
    options.success = dealDoc;
    if(!(app.Lock.attach(options))) { return false; }
    app.socket.emit('doc', {path: c.path});
  };
})();

app.init || (app.init = {});

(function() {
  var _init = false;
  app.init.fileSync = function() {
    if(_init) { return; }
    _init = true;
    /* setup */
    var detach = app.Lock.detach;
    app.socket.on('new', detach);
    app.socket.on('delete', detach);
    app.socket.on('move', detach);
    app.socket.on('doc', detach);
    app.socket.on('share', detach);
    app.socket.on('unshare', detach);
  };
})();

})();
