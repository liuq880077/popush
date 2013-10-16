var app = app || {};

(function(){

  /**
    File Model
    ----------
    File model has 'name', 'type', 'shared', 'showname', 'owner', 'members' attributes.
    */
  app.File = Backbone.Model.extend({
    /* Default attributes for the file item. */
    defaults: function(){
      return {
        name: "popush",
        type: "doc", /* "doc" or "dir" */
        shared: false,
        showname: "popush",
        owner: new User(),
        members: [],
        path: "",
        /* TODO: need attention IE 6/7 */
        time: new Date().toJSON().substring(0,19).replace('T', ' ');
      };
    },

    initialize: function(){
    }

  });
  
})();
