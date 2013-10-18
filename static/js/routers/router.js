var app = app || {};

(function(){
  var Router = Backbone.Router.extend({
    routes: {
      '': 'login',
      'login': 'login',
      'register': 'register',
      /* TODO: */
      '/gdh1995': 'enter',
    },

    login: function () {
      /* TODO: */
    },
    
    register: function() {
      /* TODO: */
    },
    
    enter: function (dir) {
      /* require login. */
      if(app.userVerify ()) {
        app.views['files'].go(dir);
      }
    },
    
  });

  app.router = new Router();

  Backbone.history.start({
    root: PAGE_ROOT,
  });

})();