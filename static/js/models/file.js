var app = app || {};

(function(){
  
  var ext2icon = {
    'c':    'c',
    'clj':    'clj',
    'coffee': 'coffee',
    'cpp':    'cpp',
    'cs':   'cs',
    'css':    'css',
    'go':   'go',
    'h':    'h',
    'htm':    'htm',
    'html':   'html',
    'hpp':    'hpp',
    'java':   'java',
    'js':   'js',
    'json':   'json',
    'lisp':   'lisp',
    'lua':    'lua',
    'md':   'md',
    'pas':    'pas',
    'php':    'php',
    'pl':   'pl',
    'py':   'py',
    'rb':   'rb',
    'sql':    'sql',
    'tex':    'tex',
    'vbs':    'vbs',
    'xml':    'xml',
  };
  
  /**
    File Model
    ----------
    File model has 'path', 'type', 'owner', 'members',
       'createTime', 'modifyTime', and 'permission' attributes.
    */
  app.File = Backbone.Model.extend({
    idAttribute: 'createTime',
  
    /* Default attributes for the file item. */
    defaults: {
      path: '',
      type: 'doc',
      owner: {
        avatar: 'images/character.png',
        name: '',
      },
      members: [],
      createTime: null, /* it must be null, so that model.isNew() === true */
      modifyTime: new Date().getTime(),
      /* not used: */
      permission: 'private',
      /* docs: [], */
    },

    initialize: function() {
      if(!this.isNew()) {this.setShow(); }
      this.on('change', app.File.prototype.setShow);
    },
        
    setShow: function() {
      var p = this.attributes.path, t = this.attributes.modifyTime,
        s = p.split('/');
      /* fix a bug when 'owner' is not set in onDoc's data. */
      this.attributes.owner.name = s[1];

      var o = {
        /* path: this.attributes.path, */
        /* type: this.attributes.type, */
        shared: (this.attributes.members.length >= 1),
        name: s[s.length - 1],
        time: new Date(t).toLocaleJSON(),
        belongSelf: (s[1] == app.currentUser.name),
        inRoot: s.length <= 3,
        owner: {name: s[1], avatar: this.attributes.owner.avatar},
      }
      o.pic = 'images/ext/' + (this.attributes.type == 'dir' ? 'dict'
        : (ext2icon[o.name.match(app.fileExtReg)[2]] || 'file')) + '.png';
      o.shownName = (o.belongSelf || !o.inRoot) ? o.name : o.name + '@' + s[1];
      o.shownPath = o.belongSelf ? p : ('/shared@' + app.currentUser.name + '/'
        + ( o.inRoot ? o.shownName
        : (s[2] + '@' + s[1] + '/' + s.slice(3).join('/')) )
      );
      this.json = o;
      return this;
    },

  });
  
})();
