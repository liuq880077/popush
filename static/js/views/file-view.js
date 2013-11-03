/*文件列表中每个文件的视图*/
var app = app || {};
(function () {
    'use strict';
    app.FileView = Backbone.View.extend({
        tagName: 'tr',
        className: 'file-item',
        template: _.template($('#file-template').html(), null, {
            variable: 'model'
        }),
        events: {
            'click a.file-go': 'go',
            'click a.file-go-share': 'share',
            'click a.file-go-delete': 'del',
            'click a.file-go-rename': 'rename',
            'click a.file-go-download': 'download',
        },
        initialize: function (opt) {
            opt || (opt = {});
            if (opt.noinit) {
                return this;
            }
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
            this.listenTo(this.model, 'destroy', this.remove);
        },
        render: function () {
            this.$el.html(this.template(this.model.json));
            return this;
        },
        go: function (e) {
            if (this.model.get('type') == 'dir') {
                this.model.collection.fetch({
                    path: this.model.get('path'),
                    loading: this.$('.col1 > *'),
                    mode: (this.model.json.belongSelf ? app.FilesView.Mode.BelongSelf : app.FilesView.Mode.Shared),
                });
            }
            else {
                app.room.tryEnter(this.model, this.$('.col1 > *'));
            }
        },
		/*分享文件或文件夹*/
        share: function () {
            app.views.shares.shareModel = this.model;
            app.collections['shares'].set(this.model.get('members'));
            $('#share').modal('show');
        },
		/*删除文件或文件夹*/
        del: function () {
            if (!(this.model.json.belongSelf)) {
                return;
            }
            var modal = $('#delete'),
			model = this.model;
            modal.find('.folder').text(strings[(model.get('type') == 'dir') ? 'folder' : 'file']);
            modal.find('#delete-name').text(model.json.name);
            modal.modal('show').on('shown',
			function () {
			    modal.off('shown');
			    var cnfm = modal.find('.modal-confirm');
			    modal.on('hide',
				function () {
				    cnfm.off();
				    modal.off('hide');
				});
			    cnfm.on('click',
				function () {
				    model.destroy({
				        loading: modal.find('.modal-buttons'),
				        success: function () {
				            modal.modal('hide');
				        },
				        error: function (m, data) {
				            app.showMessageBox('delete', data.err);
				        },
				    });
				});
			});
        },
		/*重命名文件或文件夹*/
        rename: function () {
            if (!(this.model.json.belongSelf)) {
                return;
            }
            var modal = $('#rename'),
			model = this.model;
            app.showInputModal(modal, model.json.name);
            modal.on('shown',
			function () {
			    modal.off('shown');
			    var input = modal.find('.modal-input'),
				cnfm = modal.find('.modal-confirm');
			    modal.on('hide',
				function () {
				    input.off();
				    cnfm.off();
				    modal.off('hide');
				});
			    input.on('input',
				function () {
				    var name = Backbone.$.trim(input.val()),
					err = false;
				    if (!name) {
				        err = 'inputfilename';
				    }
				    if (app.fileNameReg.test(name)) {
				        err = 'filenameinvalid';
				    }
				    if (name.length > 32) {
				        err = 'filenamelength';
				    }
				    if (err) {
				        if (name) {
				            app.showMessageInDialog(modal, err);
				        }
				        cnfm.attr('disabled', 'disabled');
				    } else {
				        modal.find('.help-inline').text('');
				        modal.find('.form-group').removeClass('error');
				        cnfm.removeAttr('disabled');
				    }
				});
			    cnfm.on('click',
				function () {
				    if (cnfm.attr('disabled') !== undefined) {
				        return;
				    }
				    var name = Backbone.$.trim(input.val()),
					err = false;
				    if (name == model.json.name) {
				        modal.modal('hide');
				        return;
				    }
				    model.save({
				        path: model.get('path').replace(/(.*\/)?(.*)/, '$1' + name),
				    },
					{
					    oldPath: model.get('path'),
					    error: function (m, data) {
					        app.showMessageInDialog(modal, data.err);
					    },
					    success: function () {
					        modal.modal('hide');
					    },
					    loading: modal.find('.modal-buttons'),
					});
				});
			});
        },
		/*下载文件或文件夹*/
        download: function () {
            if (this.model.get('type') == 'doc')
                app.socket.emit('download', {
                    path: this.model.get('path')
                });
            else
                app.socket.emit('downzip', {
                    path: this.model.get('path'),
                    mode: 1
                });
        },
    });
})();