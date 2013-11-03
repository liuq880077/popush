/*个人账户信息管理视图*/
var app = app || {};
(function () {
    app.AccountView = Backbone.View.extend({
        el: '#nav-head',
        events: {
            'click #btn_changepassword': 'changepasswordopen',
            'click #btn_changeavatar': 'changeavataropen',
            'click .go-logout': 'logout',
        },
        initialize: function () {
            var that = this;
            var keyd = function (e) {
                if (e.which == 13) {
                    that.changepassword();
                }
            }
            $('#changepassword-old').on('keydown', keyd);
            $('#changepassword-new').on('keydown', keyd);
            $('#changepassword-confirm').on('keydown', keyd);
        },
        /*登出*/
        logout: function () {
            app.logout();
        },
        /*修改密码*/
        changepassword: function () {
            var old = $('#changepassword-old').val();
            var pass = $('#changepassword-new').val();
            var confirm = $('#changepassword-confirm').val();
            $('#changepassword .form-group').removeClass('error');
            $('#changepassword .help-inline').text('');
            if (pass != confirm) {
                app.showMessageInDialog('#changepassword', 'doesntmatch', 2);
                return;
            }
            if (app.Lock.attach({
                loading: '#changepassword-buttons',
                error: function (data) {
					app.showMessageInDialog('#changepassword', data.err, 0);
            },
                success: function () {
					$('#changepassword').modal('hide');
					app.showMessageBox('changepassword', 'changepassworddone');
            },
            })) {
                app.socket.emit('password', {
                    password: old,
                    newPassword: pass,
                });
            }
        },
        /*打开修改密码对话框*/
        changepasswordopen: function () {
            var modal = $('#changepassword');
            app.showInputModal(modal);
            var confirm = modal.find('.modal-confirm');
            confirm.off();
            confirm.on('click', this.changepassword);
        },
        /*打开修改头像对话框*/
        changeavataropen: function () {
            var modal = $('#changeavatar');
            app.showInputModal(modal);
            $('#changeavatar-img').attr('src', app.currentUser.avatar);
            var confirm = modal.find('#changeavatar-input');
            confirm.off();
            confirm.on('change', this.changeavatar);
        },
        /*修改头像*/
        changeavatar: function () {
            var inputfile = $('#changeavatar-input')[0];
            var file = inputfile.files[0];
            var reader = new FileReader();
            reader.onloadend = function () {
                if (reader.error) {
                    app.showMessageBar('#changeavatar-message', reader.error, 'error');
                } else {
                    var s = reader.result;
                    var t = s.substr(s.indexOf('base64') + 7);
                    if (t.length > 0x100000) {
                        app.showMessageBar('#changeavatar-message', 'too large', 'error');
                    }
                    if (app.Lock.attach({
                        success: function (data) {
							app.currentUser.avatar = data.url;
							$('#changeavatar-img').attr('src', data.url);
							$('#nav-avatar').attr('src', data.url);
							app.collections['members'].at(0).set({
                        avatar: data.url
                    });
							app.collections['cooperators'].at(0).set({
                        avatar: data.url
                    });
                    },
                        error: function (data) {
							app.showMessageBar('#changeavatar-message', data.err, 'error');
                    }
                    })) {
                        app.socket.emit('avatar', {
                            type: file.type,
                            avatar: t,
                        });
                    }
                }
            };
            reader.readAsDataURL(file);
        },
    });
    app.init || (app.init = {});
    app.init.accountView = function () {
        if (app.views['account']) {
            return;
        };
        app.views['account'] = new app.AccountView();
    };
})();