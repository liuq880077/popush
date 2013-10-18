/* need Backbone, _, app */
var app = app || {};

(function () {
  'use strict';
    
  /**
    File Item View
    */
    
  /* The DOM element for a file item... */
  app.FileView = Backbone.View.extend({
    /* ... is a container tag. */
    tagName:  'tr',
    
    className: 'file-item',

    /* Cache the template function for a single item. */
    template: _.template($('#file-template').html(), null, {variable: 'model'}),

    /* The DOM events specific to an item. */
    events: {
      /* 'click a.file-go-enter': function() {
        app.views['files'].go(this.model.json.shownPath);
      }, */
      'click a.file-go-share': 'share',
      'click a.file-go-delete': 'del',
      'click a.file-go-rename': 'rename',
    },

    initialize: function (opt) {
      opt || (opt = {});
      if(opt.noinit) { return this; }
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'remove', this.remove);
      this.listenTo(this.model, 'destroy', this.remove);
    },
    
    /* Re-render the item. */
    render: function () {
      /* TODO: make model */
      this.$el.html(this.template(this.model.json));
      return this;
    },

    share: function () {
      $('#share').modal('show');
      app.views['shareManage'].show(this.modal);
    },

    del: function () {
      if(!(this.model.json.belongSelf)) { return; }
      var modal = $('#delete'), model = this.model;
      modal.find('.folder').text(strings[(model.get('type')=='dir') ? 'folder' : 'file']);
      modal.find('#delete-name').text(model.json.name);
      modal.modal('show');
      var confirm = modal.find('.modal-confirm');
      confirm.unbind();
      confirm.bind('click', function(){
        if(app.operationLock)
          return;
        app.operationLock = modal.find('.modal-buttons');
        app.loading(app.operationLock);
        app.socket.emit('delete', {
          path: model.get('path'),
        });
      });
    },

    rename: function () {
      if(!(this.model.json.belongSelf)) { return; }
      var modal = $('#rename'), model = this.model;
      app.showInputModal(modal, model.json.name);
      
      var confirm = modal.find('.modal-confirm');
      confirm.unbind();
      confirm.bind('click', function(){
        var name = Backbone.$.trim(modal.find('.modal-input').val());
        if(!name) {
          app.showMessageInDialog('#rename', 'inputfilename');
          return;
        }
        if(app.fileNameReg.test(name)) {
          app.showMessageInDialog('#rename', 'filenameinvalid');
          return;
        }
        if(name == model.json.name) {
          modal.modal('hide');
          return;
        }
        
        if(app.operationLock)
          return;
        app.operationLock = modal.find('.modal-buttons');
        app.loading(app.operationLock);
        app.socket.emit('move', {
          path: model.get('path'),
          newPath: model.get('path').replace(/(.*\/)?(.*)/, '$1' + name),
        });
      });
    },
    
  });
  
})();
