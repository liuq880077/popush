/* Members Collection */
/* model: app.User */
var app = app || {}; 

(function() {
	'use strict';

	app.Members = Backbone.Collection.extend({

		model: app.User,

		comparator: function(member) {
			var a = member.attributes;
			var value = "";
			if (!a.owner)
			 value += "1";
			else
			 value += "0";
			if (!a.online)
			 value += '1';
			else
			 value += "0";
			return value + a.name;
		},

		update: function(data) {
			var col = this;
			col.reset();
			for (var i = 0, d; i < data.length; ++i) {
				d = data[i];
				col.add({
					name: d.name,
					avatar: d.avatar,
					online: d.online || false,
					owner: d.owner || false,
				});
			}
		},

		updatedoc: function(doc) {
			var col = this;
			col['reset']({
				name: doc.owner.name,
				avatar: doc.owner.name == app.currentUser.name ? app.currentUser.avatar: doc.owner.avatar,
				online: doc.owner.online || false,
				owner: true,
			});
			for (var i = 0; i < doc.members.length; i++) {
				var user = doc.members[i];
				this.add({
					name: user.name,
					avatar: user.avatar,
					online: user.online || false,
					owner: false,
				});
			}
		},
	});

	app.init || (app.init = {});

	app.init.members = function() {
		app.collections['members'] || (app.collections['members'] = new app.Members());
	};
	app.init.cooperators = function() {
		app.collections['cooperators'] || (app.collections['cooperators'] = new app.Members());
	};
	app.init.shares = function() {
		app.collections['shares'] || (app.collections['shares'] = new app.Members());
	};
	
})();
