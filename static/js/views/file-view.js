/* need Backbone, _, app */
var app = app || {};

(function () {
  var $ = Backbone.$;
  
  var ext2icon = {
    'c':		'c',
    'clj':		'clj',
    'coffee':	'coffee',
    'cpp':		'cpp',
    'cs':		'cs',
    'css':		'css',
    'go':		'go',
    'h':		'h',
    'htm':		'htm',
    'html':		'html',
    'hpp':		'hpp',
    'java':		'java',
    'js':		'js',
    'json':		'json',
    'lisp':		'lisp',
    'lua':		'lua',
    'md':		'md', //
    'pas':		'pas', //
    'php':		'php',
    'pl':		'pl',
    'py':		'py',
    'rb':		'rb',
    'sql':		'sql',
    'tex':		'tex',
    'vbs':		'vbs',
    'xml':		'xml'
  };
  
	/**
    File Item View
    */
    
	/* The DOM element for a file item... */
	app.FileView = Backbone.View.extend({
		/* ... is a container tag. */
		tagName:  'tr',

		/* Cache the template function for a single item. */
		template: _.template($('#file-template').html(), null, {variable: 'model'}),

		/* The DOM events specific to an item. */
		events: {
			'click a.file-go-enter': function() { window.location.href = '#' + this.model.get('path'); },
			'click a.file-go-share': 'share',
			'click a.file-go-delete': 'del',
			'click a.file-go-rename': 'rename',
		},

		initialize: function (opt) {
      opt || (opt = {});
      if(opt.noinit) { return this; }
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},
    
    getpic: function(model) {
      var s = 'images/ext/';
      if (model.type == 'dir') {
        s += 'dict';
      } else {
        s += (ext2icon[model.name.substring(model.name.lastIndexOf('.')+1)] || 'file');
      }
      s += '.png';
      return s;
    };
    
		/* Re-render the item. */
		render: function () {
      var model = this.model.toJSON();
      model.pic = this.getpic(model);
      model.inRoot = (model.path.split('/').length <= 3);
      model.owner = model.owner.toJSON();
      model.belongSelf = (app.currentUser.get("name") == model.owner.name);
      this.$el.html(this.template(model));
      return this;
		},

    share: function () {
      /* var modal = $('#share'), model = this.model.toJSON();
      modal.modal('show'); */
      /* // TODO: enter 'share' page through router. */
      /* var sharemv = app.views.shareManage || (app.views.shareManage = new app.ShareManageView);
      sharemv.show(this.model); */
    }

    del: function () {
      var modal = $('#delete'), model = this.model.toJSON();
      modal.find('.folder').text(strings[(model.type=='dir') ? 'folder' : 'file']);
      modal.find('#delete-name').text(model.name);
      modal.modal('show');
      var confirm = modal.find('#confirmDeleteBtn');
      confirm.unbind();
      confirm.bind('click', function(){
        if(app.operationLock)
          return;
        app.operationLock = true;
        loading('delete-buttons');
        socket.emit('delete', {
          path: model.path;
        });
      });
    }

    rename: function () {
      var modal = $('#rename'), model = this.model.toJSON();
      modal.find('#rename-inputName').val(model.name);
      modal.find('.control-group').removeClass('error');
      modal.find('.help-inline').text('');
      modal.modal('show');
      var confirm = modal.find('#confirmRenameBtn');
      confirm.unbind();
      confirm.bind('click', function(){
        var name = $.trim(modal.find('#rename-inputName').val());
        if(name == '') {
          showmessageindialog('rename', 'inputfilename');
          return;
        }
        if(/[\*\\\|:\"\/\<\>\?\@]/.test(name)) {
          showmessageindialog('rename', 'filenameinvalid');
          return;
        }
        if(name == model.name) {
          modal.modal('hide');
          return;
        }
        
        if(app.operationLock)
          return;
        app.operationLock = true;
        loading('rename-buttons');
        /* TODO: */ movehandler = renamedone;
        socket.emit('move', {
          path: model.path,
          newPath: model.path.replace(/(.*\/)?(.*)/,  '$1' + name,
        });
      });
    }
    
  });
  
})();
