var app = app || {};

(function () {
  app.AccountView = Backbone.View.extend({
    el:'#nav-head',

    events:{
      'click #btn_changepassword':'changepasswordopen',
      'click #btn_changeavatar':'changeavatar',
      'click .go-logout': 'logout',
    },

    initialize:function(){
      this.template =  _.template($('#nav-head').html()),
      this.listenTo(this.model, 'change', this.render);
      
      var that = this;
      var keyd = function(e) {
        if(e.which == 13) { that.changepassword(); }
      }
      $('#changepassword-old').on('keydown', keyd);
      $('#changepassword-new').on('keydown', keyd);
      $('#changepassword-confirm').on('keydown', keyd);
    },
    
    changepassword:function(){
      var old = $('#changepassword-old').val();
      var pass = $('#changepassword-new').val();
      var confirm = $('#changepassword-confirm').val();
      $('#changepassword .form-group').removeClass('error');
      $('#changepassword .help-inline').text('');
      if(pass != confirm) {
        app.showMessageInDialog('#changepassword', 'doesntmatch', 2);
        return;
      }
      if(app.Lock.attach({
        loading: '#changepassword-buttons',
        error: function() { app.showMessageInDialog('#changepassword', data.err, 0); },
        success: function() {
          $('#changepassword').modal('hide');
          app.showMessageBox('changepassword', 'changepassworddone', 1);
        },
      })) {
        app.socket.emit('password', {
          password: old,
          newPassword: pass,
        });
      }
    },
    
    changepasswordopen:function(){
      var modal = $('#changepassword');
      app.showInputModal(modal);
      
      var confirm = modal.find('.modal-confirm');
      confirm.off();
      confirm.on('click', this.changepassword);
    },
    
    changeavatar: function() {
      var reader = new FileReader(); 
      reader.onloadend = function() {
        if (reader.error) {
          app.showMessageBar('#changeavatar-message', reader.error, 'error');
        } else {
          var s = reader.result;
          var t = s.substr(s.indexOf('base64') + 7);
          if(t.length > 0x100000) {
            app.showMessageBar('#changeavatar-message', 'too large', 'error');
          }
          if(app.Lock.attach({
            
          })) {
            socket.emit('avatar', {
              type: file.type,
              avatar: t,
            });
          }
        }
      };
      reader.readAsDataURL(app.currentUser.avatar);
    },
    
    render:function(){
      this.el.html(this.template(this.model.toJSON()));
      return this;
    },
  });

})();
