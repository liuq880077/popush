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
    
    refetch: function() {
      this.go(app.currentDir);
    },
    
    /**
      [dir] accept: real/shown dirs, and dirs shown on other accounts' page.
      */
    go: function(dir) {
      if(dir == null || dir.charAt(0) != '/') { return false; }
      
      var s, shared = false, name = app.currentUser.name;
      dir = window.decodeURI(dir).replace(/\\/g, '/');
      if(dir.substring(0, 8) == '/shared@') {
        s = dir.substring(8);
        var i = s.indexOf('/');
        if(i <= -1 || i == s.length - 1) {
          dir = '/' + name;
          shared = true;
        } else {
          s = s.substring(i + 1).split('/');
          var s0 = s[0].split('@');
          if(!s0[0] || !s0[1]) { return false; }
          s[0] = '/' + s0[1] + '/' + s0[0];
          dir = s.join('/');
        }
      }
      if(dir.substring(s = dir.length - 1) == '/') {
        dir = dir.substring(0, s);
      }
      
      if(app.docLock) { return false; }
      app.docLock = true;
      
      s = dir.split('/');
      if(s[1] == app.currentUser.name && !shared) {
        shared = app.FilesView.Mode.BelongSelf;
        s = dir;
      } else {
        shared = app.FilesView.Mode.Shared;
        var s0 = s;
        s = '/shared@' + name;
        if(s0.length >= 3) {
          s += '/' + s0[2] + '@' + s0[1]
            + (s0.length == 3 ? '' :'/' + s0.slice(3).join('/'));
        }
      }
      app.currentShownDir = s;
      if(app.currentDir == dir) {
        app.docLock = Backbone.Collection.prototype.set;
      } else {
        app.docLock = Backbone.Collection.prototype.reset;
        app.currentDir = dir;
      }
      if(this.mode != shared) {
        this.mode = shared;
        /* fix a bug that occurs when 'mode' is the only one to be changed. */
        this.renewList();
      }
      
      app.socket.emit('doc', {path: dir});
      
      /* if "on('doc')" takes more than 1s, show the loading icon. */
      var that = this;
      window.setTimeout(function(){
        if(app.docLock) {
          app.docLock.waiting = that.$noFile;
          app.loading(app.docLock.waiting);
          /*
            fix an error caused by bad web access or 'F12:Debug':
            'app.loading' may be called after this function's first
              'app.removeLoading', and before 'app.docLock' is set to 'false'.
            */
          window.setTimeout(function(){
            if(app.docLock && app.docLock.waiting && !app.docLock.receive) {
              var back = app.docLock;
              app.docLock = false;
              if(back) {
                app.removeLoading(back.waiting);
                delete back.waiting;
                delete back.receive;
              }
            }
          }, 2500);
        }
      }, 500);
    },
        
    initialize: function (opt) {
      this.$tableHeadCol3 = this.$('table .head .col3');
      this.$noFile = this.$('#no-file');
      this.$table = this.$('#file-list-table');
      this.$dir = this.$('#current-dir');
      this.$tabOwnedEx = Backbone.$('#ownedfileex');
      this.$tabShared = Backbone.$('#sharedfile');
      this.$newfile = Backbone.$('#newfile');
      
      var p = this.$tabOwned = Backbone.$('#ownedfile');
      p.find('.dropdown-menu a').bind('click', {
        context: this,
      }, this.newFile);
      
      opt || (opt = {});
      if(opt.noinit) { return this; }
      
      this.ItemView = opt.ItemView || app.FileView;
      this.mode = opt.mode || app.FileView.Mode.BelongSelf;
      
      this.listenTo(this.collection, 'add', this.addOne);
      this.listenTo(this.collection, 'remove', this.remove);
      this.listenTo(this.collection, 'reset', this.renewList);
    },
    
    addOne: function(model) {
      if(model.json.belongSelf != this.mode) { return this; }
      if(this.collection.length >= 1) {
        this.$noFile.hide();
      }
      var v = model.view;
      if(v) {
        /* in theory, this branch will not be executed. just in case. */
        v.render();
        if(v.$el.is(':hidden')) {
          this.$table.append(v.el);
          v.delegateEvents();
        }
      } else {
        model.view = new this.ItemView({model: model});
        this.$table.append(model.view.render().el);
      }
      return this;
    },
    
    remove: function() {
      if(this.collection.length <= 0) {
        this.$noFile.show();
      }
      return this;
    },
    
    renewList: function (collection, opt) {
      /*
        Both ways are OK, but the second can stop those event-listeners,
        although it's a little slower.
        */
      /* this.$('.file-item').remove(); */
      opt || (opt = {});
      _.each(opt.previousModels, function(m) { m.trigger('remove'); });
      
      this.render();
      var els = [], isMine = (this.mode == app.FilesView.Mode.BelongSelf);
      _.each(this.collection.models, function(model){
        if(isMine == model.json.belongSelf) {
          if(model.view) {
            model.view.$el.show();
          } else {
            model.view = new this.ItemView({model: model});
            els.push(model.view.render().el);
          }
        } else {
          model.view && (model.view.$el.hide());
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
      
      var s0 = app.currentShownDir, s1 = '', s2 = '', arr = s0.split('/');
      for(var i = 0, l = arr.length, v; i < l; i++) {
        if(v = arr.shift()) {
          s2 += '/' + v;
          s1 += '/<a href="#index'+encodeURI(s2)+'" class="file-go">'+_.escape(v)+"</a>";
        }
      }
      this.$dir.html(s1);
      
      return this;
    },
    
    newFile: function(event) {
      var that = event.data.context, type = $(event.target).attr('new-type');
      if(that.mode != app.FilesView.Mode.BelongSelf) { return; }
      
      var modal = that.$newfile;
      modal.find('#newfile-label').text(
        strings[type == 'dir' ? 'newfolder' : 'newfile']
      );
      app.showInputModal(modal, '');
      
      var confirm = modal.find('.modal-confirm');
      confirm.unbind();
      confirm.bind('click', function() {
        var name = Backbone.$.trim(modal.find('#newfile-input').val()),
          err = false;
        if(!name) {
          err = 'inputfilename';
        }
        if(app.fileNameReg.test(name)) {
          err = 'filenameinvalid';
        }
        if(name.length > 32) {
          err = 'filenamelength';
        }
        if(err) {
          app.showMessageInDialog('#newfile', 'inputfilename');
          return;
        }
        if(app.operationLock)
          return;
        app.operationLock = modal.find('.modal-buttons');
        app.operationLock.newType = type;
        app.loading(app.operationLock);
        app.socket.emit('new', {
          type: type,
          path: app.currentDir + '/' + name,
        });
      });
    },
    
  }, {
    Mode: {
      BelongSelf: 1,
      Shared: 2,
    },
    
  });
  
})();
