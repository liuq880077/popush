/* need Backbone, _, app */
var app = app || {};

(function () {
  'use strict';
  
  var $ = Backbone.$;
  
  /**
    Files Collection View
    */
    
  /* The DOM element. */
  app.FilesView = Backbone.View.extend({
    /* ... is a contauber tag. */

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
      this.$tabShared = Backbone.$('#sharedfile');
      
      opt || (opt = {});
      if(opt.noinit) { return this; }
      
      this.ItemView = opt.ItemView || app.FileView;
      this.mode = opt.mode || app.FileView.Mode.BelongSelf;
      
      this.listenTo(this.collection, 'add', this.addOne);
      this.listenTo(this.collection, 'reset', this.renewList);
    },
    
    addOne: function(model) {
      model.view = new this.ItemView({model: model});
      this.$table.append(model.view.render().el);
      return this;
    },
    
    renewList: function () {
      this.$('.file-item').remove();
      var els = [], isMine = (this.mode == app.FilesView.Mode.Shared);
      _.each(this.collection.models, function(model){
        if(isMine ^ model.json.belongSelf) {
          model.view || (model.view = new this.ItemView({model: model}));
          els.push(model.view.render().el);
        }
      }, this);
      this.$table.append(els);
      return this;
    },
    
    render: function() {
      if(this.mode == app.FilesView.Mode.BelongSelf) {
        this.$tableHeadCol3.addClass('owner');
        this.$tabOwned.addClass('active');
        this.$tabShared.removeClass('active');
        var showOwner = false;
      } else {
        this.$tableHeadCol3.removeClass('owner');
        this.$tabShared.addClass('active');
        this.$tabOwned.removeClass('active');
        var showOwner = true;
      }
      
      if(this.collection.length <= 0) { this.$noFile.show(); }
      else { this.$noFile.hide(); }
      
      var s0 = app.currentDirString, s1 = '', s2 = '', arr = s0.split('/');
      for(var i = 0, l = arr.length, v; i < l; i++) {
        if(v = arr.shift()) {
          s2 += '/' + v;
          s1 += '/<a href="#'+encodeURI(s2)+'">'+_.escape(v)+"</a>\n";
        }
      }
      this.$dir.html(s1);
      
      return this;
    },
    
    show: function() {
      this.render();
      this.$el.show();
      return this;
    },
    
  }, {
    Mode: {
      BelongSelf: 1,
      Shared: 2,
    },
    
  });
  
})();
