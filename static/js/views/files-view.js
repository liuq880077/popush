/* need Backbone, _, app */
var app = app || {};

(function () {
  'use strict';
  
  /**
    Files Collection View
    */
    
  /* The DOM element. */
  app.FilesView = Backbone.View.extend({
  
    el: '#filecontrol',
        
    /**
      [dir] accept: real/shown dirs, and dirs shown on other accounts' page.
      */
    go: function(dir) {
      var name = app.currentUser.name,
        mode = (dir.substring(1, 8 + name.length) == 'shared@' + name)
          ? app.FilesView.Mode.Shared : app.FilesView.Mode.BelongSelf;
      dir = app.File.decode(dir);
      if(!dir) { return; }
      
      var that = this;
      this.collection.fetch({
        path: dir,
        loading: this.$noFile,
        mode: mode,
        success: function() {
          if(mode != that.mode) {
            that.renewList(null, {mode: mode});
          }
        },
      });
    },
        
    initialize: function (opt) {
      var el = this.$el;
      this.$tableHeadCol3 = el.find('table .head .col3');
      this.$noFile = el.find('#no-file');
      this.$table = el.find('#file-list-table');
      this.$dir = el.find('#current-dir');
      this.$tabOwnedEx = el.find('#ownedfileex');
      this.$tabShared = el.find('#sharedfile');
      this.$uploadfile = el.find('#uploadfile');
      
      (this.$tabOwned = el.find('#ownedfile')).find('.dropdown-menu a')
        .bind('click', { context: this }, newFile);
      
      opt || (opt = {});
      if(opt.noinit) { return this; }
      
      this.ItemView = opt.ItemView || app.FileView;
      this.mode = opt.mode || app.FileView.Mode.BelongSelf;
      
      this.listenTo(this.collection, 'add', this.addOne);
      this.listenTo(this.collection, 'remove', this.remove);
      this.listenTo(this.collection, 'reset', this.renewList);
      this.listenTo(this.collection, 'sync', this.afterSync);
      /**
        refuse to listenTo sort, because it may be called when creating a model,
        and the view is undefined. Besides, 'sort' will cause the table dom
        renew every time 'set' is called
      */
      /* this.listenTo(this.collection, 'sort', this.sort); */
    },
    
    afterSync: function(m, d, opts) {
      opts && opts.mode && (this.mode = opts.mode);
      this.shownPath = app.File.encode(this.collection.path
        , this.mode == app.FilesView.Mode.Shared);
      this.render();
    },
    
    addOne: function(model) {
      if(this.collection.length == 1) { this.$noFile.hide(); }
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
      if(this.collection.length <= 0) { this.$noFile.show(); }
      return this;
    },
    
    renewList: function (c, opts) {
      /*
        Both ways are OK, but the second can stop those event-listeners,
        although it's a little slower.
        */
      /* this.$('.file-item').remove(); */
      opts || (opts = {});
      if(opts.previousModels) {
        _.each(opts.previousModels, function(m) { m.trigger('remove'); });
      }
      /* this.render(opts); */
      var els = [], mode = (opts.mode || this.mode),
        isMine = (mode == app.FilesView.Mode.BelongSelf);
      _.each(this.collection.models, function(model) {
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
        
    render: function(opts) {
      var mode = (opts && opts.mode) || this.mode;
      if(mode == app.FilesView.Mode.BelongSelf) {
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
      
      var s0 = this.shownPath, s1 = '', s2 = '', arr = s0.split('/');
      for(var i = 0, l = arr.length, v; i < l; i++) {
        if(v = arr.shift()) {
          s2 += '/' + v;
          s1 += '/<a href="#index'+encodeURI(s2)+'" class="file-go">'+_.escape(v)+"</a>";
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
  
  var upload = function(event) {
    var fileinput = this.$uploadfile[0];
    var that = this;
    this.$uploadfile.off().on('change', function() {
      if(fileinput.files.length <= 0) { return; }
      var file = fileinput.files[0], filepath = fileinput.value;
      
      /* for ie and ff */
      var pos = filepath.lastIndexOf('/');
      var pos2 = filepath.lastIndexOf('\\'); 
      (pos < pos2) && (pos = pos2);
      
      var path = that.collection.path + '/' + filepath.substring(pos+1);
     /*  if  that.collection.findWhere({path: path}); */
      
      /* fileinput.outerHTML += ''; */
      fileinput.value = '';
      
      if (file.type.match(app.uploadType)) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var text = reader.result, type = 'doc';
          if(app.Lock.attach({
            success: function(data) {
              data.path = path;
              data.type = type;
              that.collection.add(data);
              app.showMessageBox('newfile', 'createfilesuccess');
            },
          })) {
            app.socket.emit('upload', {path: path, type: type, text: text});
          }   
        }
        reader.readAsText(file);
      } else {
        app.showMessageBox('error', 'can not upload');
      }
    });
    this.$uploadfile.click();
  }
  
  var downzip = function(event) {
    var paths = app.collections['files'].path;
    var modes = (paths.split('/').length != 2);
    app.socket.emit('downzip', {path: paths, mode: modes});
  }
  
  var newFile = function(event) {
    var that = event.data.context, type = $(event.target).attr('new-type');
    if(that.mode != app.FilesView.Mode.BelongSelf) { return; }
    if (type == 'up') {
      upload.call(that, event);
      return;
    }
    if (type == 'down') {
      downzip.call(that, event);
      return;
    }
    var modal = Backbone.$('#newfile');
    modal.find('#newfile-label').text(
      strings[type == 'dir' ? 'newfolder' : 'newfile']
    );
    app.showInputModal(modal);
    modal.on('shown', function() {
      modal.off('shown');
      var input = modal.find('.modal-input'), cnfm = modal.find('.modal-confirm');
      modal.on('hide', function() { input.off(); cnfm.off(); modal.off('hide'); });
      input.on('input', function() {
        var name = Backbone.$.trim(input.val()), err = false;
        if(!name) { err = 'inputfilename'; }
        if(app.fileNameReg.test(name)) { err = 'filenameinvalid'; }
        if(name.length > 32) { err = 'filenamelength'; }
        if(err) {
          if(name) { app.showMessageInDialog(modal, err); }
          cnfm.attr('disabled', 'disabled');
        } else {
          modal.find('.help-inline').text('');
          modal.find('.form-group').removeClass('error');
          cnfm.removeAttr('disabled');
        }
      });
      cnfm.attr('disabled', 'disabled').on('click', function() {
        if(cnfm.attr('disabled') !== undefined) { return; }
        var name = Backbone.$.trim(modal.find('#newfile-input').val());
        that.collection.create({type:type,path:that.collection.path+'/'+name}, {
          loading: modal.find('.modal-buttons'),
          error: function(m, data) { app.showMessageInDialog(modal,data.err); },
          success: function() {
            modal.modal('hide');
            if(type == 'dir') {
              app.showMessageBox('newfolder', 'createfoldersuccess');
            } else {
              app.showMessageBox('newfile', 'createfilesuccess');
            }
          },
        });
      });
    });
  };
  
  app.init || (app.init = {});

  app.init.filesView = function() {
    if(app.views['files']) { return; }
    app.collections['files'] || app.init.files();
    app.views['files'] = new app.FilesView({
      collection: app.collections['files'],
      mode: app.FilesView.Mode.BelongSelf,
    });
  };
  
})();
