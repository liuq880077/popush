/* need Backbone, _, app */
var app = app || {};

(function () {
  /* 'use strict'; */
  
  /**
    Files Collection View
    */
    
  /* The DOM element. */
  app.FilesView = Backbone.View.extend({
  
    el: '#file-list > .span10',
    
    go: function(dir) {
      if(dir == null || dir.charAt(0) != '/') { return false; }
      
      var s, rootShared = false;
      dir = window.decodeURI(dir);
      if(dir.substring(0, 8) == '/shared@') {
        s = dir.substring(8);
        var i = s.indexOf('/');
        if(i <= -1 || i == s.length - 1) {
          dir = '/' + s;
          rootShared = true;
        } else {
          s = s.substring(i + 1).split('/');
          var s0 = s[0].split('@');
          if(!s0[0] || !s0[1]) { return false; }
          
          s[0] = '/' + s0[1] + '/' + s0[0];
          dir = s.join('/');
        }
      } else {
        s = app.currentUser.name;
        if(dir.substring(1, s.length + 1) != s) {
          dir = '/' + s + dir;
        }
      }
      if(dir.substring(s = dir.length - 1) == '/') {
        dir = dir.substring(0, s);
      }
      
      if(app.docLock) { return false; }
			app.docLock = true;
      
      s = dir.split('/');
      if(s[1] == app.currentUser.name && !rootShared) {
        this.mode = app.FilesView.Mode.BelongSelf;
        s = dir;
      } else {
        this.mode = app.FilesView.Mode.Shared;
        if(s.length >= 3) {
          s = '/shared@' + app.currentUser.name
            + '/' + s[2] + '@' + s[1] + '/' + s.slice(3).join('/');
        } else {
          /* Here, if compiled, we can visit others */
          /* [2013-10-17] But it's denied by the server.  */
          s = '/shared@' + s[1];
        }
      }
      if(app.currentDirString == s) {
        app.docLock = Backbone.Collection.prototype.set;
      } else {
        app.docLock = Backbone.Collection.prototype.reset;
        app.currentDirString = s;
        this.collection.reset();
      }
      
      app.socket.emit('doc', {path: dir});
      
      var that = this;
      setTimeout(function(){
        if(app.docLock) {
          app.docWaitingLock = that.$noFile.attr('id');
          app.loading(app.docWaitingLock);
        }
      }, 1000);
    },
    
   /* refresh: function(str) {
      var arr = str.split('/').slice(1);
      app.currentDir = arr.slice(1);
      app.currentDirString = str;
      if(str.substring(0, 8) == '/shared@') {
        str = '/' + app.currentUser.name + str;
      }
      socket.emit('doc', str);
    }, */
    
    initialize: function (opt) {
      this.$tableHeadCol3 = this.$('table .head .col3');
      this.$noFile = this.$('#no-file');
      this.$table = this.$('#file-list-table');
      this.$dir = this.$('#current-dir');
      this.$tabOwned = Backbone.$('#ownedfile');
      this.$tabOwnedEx = Backbone.$('#ownedfileex');
      this.$tabShared = Backbone.$('#sharedfile');
      
      opt || (opt = {});
      if(opt.noinit) { return this; }
      
      this.ItemView = opt.ItemView || app.FileView;
      this.mode = opt.mode || app.FileView.Mode.BelongSelf;
      
      this.listenTo(this.collection, 'add', this.addOne);
      this.listenTo(this.collection, 'reset', this.renewList);
    },
    
    addOne: function(model) {
      if(!(model.view)) {
        model.view = new this.ItemView({model: model});
        this.$table.append(model.view.render().el);
      } else {
        model.view.render();
      }
      return this;
    },
    
    renewList: function (collection, opts) {
      /*
        Both ways are OK, but the second can stop those event-listeners,
        although it's a little slower.
        */
      /* this.$('.file-item').remove(); */
      _.each(opts.previousModels, function(m) { m.trigger('remove'); });
      
      this.render();
      var els = [], isMine = (this.mode == app.FilesView.Mode.BelongSelf);
      _.each(this.collection.models, function(model){
        if(isMine == model.json.belongSelf) {
          model.view || (model.view = new this.ItemView({model: model}));
          els.push(model.view.render().el);
        }
      }, this);
      this.$table.append(els);
      return this;
    },
    
    render: function() {
      if(this.mode == app.FilesView.Mode.BelongSelf) {
        this.$tableHeadCol3.removeClass('owner').html(strings['state']);
        this.$tabShared.removeClass('active');
        this.$tabOwned.addClass('active').show();
        this.$tabOwnedEx.hide();
        var showOwner = false;
      } else {
        this.$tableHeadCol3.addClass('owner').html(strings['owner']);
        this.$tabOwned.removeClass('active').hide();
        this.$tabShared.addClass('active');
        this.$tabOwnedEx.show();
        var showOwner = true;
      }
      
      if(this.collection.length <= 0) { this.$noFile.show(); }
      else { this.$noFile.hide(); }
      
      var s0 = app.currentDirString, s1 = '', s2 = '', arr = s0.split('/');
      for(var i = 0, l = arr.length, v; i < l; i++) {
        if(v = arr.shift()) {
          s2 += '/' + v;
          s1 += '/<a href="#'+encodeURI(s2)+'">'+_.escape(v)+"</a>";
        }
      }
      this.$dir.html(s1);
      
      return this;
    },
    
    
  }, {
    Mode: {
      BelongSelf: 1,
      Shared: 2,
    },
    
  });
  
})();
