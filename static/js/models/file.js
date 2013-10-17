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
    File model has 'name', 'type', 'shared', 'showname', 'owner', 'members' attributes.
    */
  app.File = Backbone.Model.extend({
    /* Default attributes for the file item. */
    defaults: {
      path: '/user/a.file',
      type: 'doc',
      members: [],
      owner: {
        avatar: 'images/file.png',
        name: 'user',
      },
      createTime: new Date().getTime(),
      modifyTime: new Date().getTime(),
      /* not used: */
      permission: 'private',
      /* docs: [], */
    },

    event: {
      'change': 'setShow',
    },
    
    initialize: function() {
      this.setShow();
    },
    
    setShow: function() {
      var p = this.attributes.path, o = {}, t = this.attributes.createTime,
        s = p.split('/');
      o.shared = (this.attributes.members.length >= 1);
      o.name = s[s.length - 1];
      o.pic = 'images/ext/'
        + (this.attributes.type == 'dir' ? 'dict'
          : (ext2icon[o.name.match(/(.*\.)?\s*(\S*$)/)[2]] || 'file'))
        + '.png';
      o.time = ((t instanceof Date) ? t : new Date(t)).toLocaleJSON();
      o.owner = this.attributes.owner;
      o.belongSelf = (o.owner.name == app.currentUser.name);
      o.inRoot = s.length <= 3;
      o.shownName = (o.belongSelf || !o.inRoot) ? o.name : o.name + '@' + o.owner.name;
      this.json = o;
      return this;
    },

  });
  
})();
