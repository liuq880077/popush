/* need Backbone, _, app */
var app = app || {};

(function () {
  var $ = Backbone.$;
  
	/**
    Files Collection View
    */
    
	/* The DOM element. */
	app.FilesView = Backbone.View.extend({
		/* ... is a contauber tag. */
		tagName:  'table',

    template: _.template($('#file-list-template').html(), null, {variable: 'that'}),
    
		/* The DOM events. */
		events: {
		},

		initialize: function (opt) {
      opt || (opt = {});
      if(opt.noinit) { return this; }
      
      this.ItemView = opt.ItemView || app.FileView;
      
			this.listenTo(this.collection, 'add', this.addOne);
			this.listenTo(this.collection, 'reset', this.renew);
			/* this.listenTo(this.collection, 'all', this.render); */
		},
    
    addOne: function(model) {
      model.view = new this.ItemView({model: c[i]});
      this.$el.append(model.view.render().el);
      return this;
    },
    
    renew: function () {
			this.$el.html(this.template({}));
      this.$headCol3 = this.$('.col3');
      this.$noFile = this.$('#no-file');
      this.render();
      
      var els = [];
			this.collection.models.each(function(model){
        model.view = new this.ItemView({model: c[i]});
        els.push(model.view.render().el);
      });
      this.$el.append(els);
      return this;
		},
    
    Mode: {
      BelongSelf: 1,
      Shared: 2,
    },
    
		/* Re-render the item. */
		render: function() {
      if(this.$headCol3 && this.mode == app.FileView.Mode.Shared) {
        this.$headCol3.removeClass('owner').html(strings['state']);
      } else {
        this.$headCol3.addClass('owner').html(strings['owner']);
      }
      if(this.$noFile && this.collection.length <= 0) {
        this.$noFile.show();
      } else {
        this.$noFile.hide();
      }
      return this;
		},
    
    show: function() {
      this.renew();
      return this;
    },
    
  });
  
})();
