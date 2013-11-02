/*global Backbone */
var app = app || {};

(function () {
  'use strict';

  app.Files = Backbone.Collection.extend({
    // Reference to this collection's model.
    model: app.File,
        
    comparator: function(a, b) {
      a = a.attributes;
      b = b.attributes;
      return ((a.type < b.type) ? -1 : ( (a.type > b.type) ? 1
        : ( (a.path < a.path) ? -1 : (a.path > b.path) )
        )) + 0;
    },
    
    fetch: function(opts) {
      var _fetch = Backbone.Collection.prototype.fetch;
      if(opts.path) {
        opts.reset = (opts.path != this.path);
        var oldPath = this.path, err = opts.error, fail = opts.fail, that=this;
        this.path = opts.path;
        opts.error = function() {
          that.path = oldPath;
          if(typeof err == 'function') { err.apply(that, arguments); }
        };
        opts.fail = function() {
          that.path = oldPath;
          if(typeof fail == 'function') { fail.apply(that, arguments); }
        };
      }
      _fetch.call(this, opts);
    },
        
  });
  
  app.init || (app.init = {});

  app.init.files = function() {
    app.collections['files'] || (app.collections['files'] = new app.Files());
  };
  
})();
