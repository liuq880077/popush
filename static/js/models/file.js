/* File Model */
/* File Model has 'path', 'type', 'owner', 'members',
       'createTime', 'modifyTime', and 'permission' attributes.
 */
var app = app || {}; 

(function() {

  var ext2icon = {
    'c': 'c',
    'clj': 'clj',
    'coffee': 'coffee',
    'cpp': 'cpp',
    'cs': 'cs',
    'css': 'css',
    'go': 'go',
    'h': 'h',
    'htm': 'htm',
    'html': 'html',
    'hpp': 'hpp',
    'java': 'java',
    'js': 'js',
    'json': 'json',
    'lisp': 'lisp',
    'lua': 'lua',
    'md': 'md',
    'pas': 'pas',
    'php': 'php',
    'pl': 'pl',
    'py': 'py',
    'rb': 'rb',
    'sql': 'sql',
    'tex': 'tex',
    'vbs': 'vbs',
    'xml': 'xml',
  };

  app.File = Backbone.Model.extend({
    idAttribute: 'createTime',
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
      permission: 'private',
    },

    initialize: function() {
      if (!this.isNew()) {
        this.setShow();
      }
      this.on('change', app.File.prototype.setShow);
    },

    setShow: function() {
      var a = this.attributes,
        p = a.path,
        t = a.modifyTime || a.createTime,
        s = p.split('/');
      this.attributes.owner.name = s[1];
      var o = {
        shared: (a.members.length >= 1),
        name: s[s.length - 1],
        time: new Date(t).toLocaleJSON(),
        belongSelf: (s[1] == app.currentUser.name),
        inRoot: s.length <= 3,
        owner: {
          name: s[1],
          avatar: this.attributes.owner.avatar
        },
      }
      o.pic = 'images/ext/' + (a.type == 'dir' ? 'dict': (ext2icon[o.name.match(app.fileExtReg)[2]] || 'file')) + '.png';
      o.shownName = (o.belongSelf || !o.inRoot) ? o.name: o.name + '@' + s[1];
      o.shownPath = o.belongSelf ? p: ('/shared@' + app.currentUser.name + '/'
       + (o.inRoot ? o.shownName: (s[2] + '@' + s[1] + '/' + s.slice(3).join('/'))));
      this.json = o;
      return this;
    },
  });

  app.File.encode = function(path, shared) {
    if (!path || path.charAt(0) != '/') return '';
    if (path.length == 1) {
      return '/' + app.currentUser.name;
    }
    var s = path.split('/');
    if (s[1] == app.currentUser.name) {
      return (s.length != 2 || shared !== true) ? path: ('/shared@' + s[1]);
    } else {
      var p = '/shared@' + app.currentUser.name;
      if (s.length <= 2) {
        return p;
      }
      p += '/' + s[2] + '@' + s[1];
      return (s.length <= 3) ? p: (p + '/' + s.slice(3).join('/'));
    }
  };

  app.File.decode = function(shownPath) {
    if (typeof shownPath == null) {
      return '';
    }
    var p = window.decodeURI(shownPath).replace(/\\/g, '/'), s;
    if (p.charAt(0) != '/') {
      return '';
    }
    if (p.substring(0, 8) == '/shared@') {
      s = p.substring(8);
      var i = s.indexOf('/');
      if (i <= -1 || i == s.length - 1) {
        p = '/' + app.currentUser.name;
      } else {
        s = s.substring(i + 1).split('/');
        i = s[0].split('@');
        if (!i[0] || !i[1]) {
          return '';
        }
        s[0] = '/' + i[1] + '/' + i[0];
        p = s.join('/');
      }
    }
    if (p.length <= 1) {
      p = '/' + app.currentUser.name;
    }
     else if (p.charAt(s = p.length - 1) == '/') {
      p = p.substring(0, s);
    }
    return p;
  };
})();
