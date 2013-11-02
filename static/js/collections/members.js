/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Members = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.User,

		comparator: function (member) {
			var value = (member.owner) ? '0' : '1';
			if (member.online)
				value += '0';
			else
				value += "1";
			return value + member.get('name');
		},
		
		update: function (data) {
			var col = this;
			col.reset();
			for (var i = 0, d; i < data.length; ++i) {
				d = data[i];
				col.add({
					name:   d.name || '',
					avatar: d.avatar || '',
					online: d.online || false,
					owner: d.owner || false
				});
			}
		},
		
		updatedoc: function (doc) {
			var col = this;
			col['reset']([{name: col.isset(doc.owner.name)?doc.owner.name:'',
					  avatar: col.isset(doc.owner.avatar)?doc.owner.avatar:'',
					  online: col.isset(doc.owner.online)?doc.owner.online:false,
					  owner: true}]);
			for(var i=0; i<doc.members.length; i++) {
				var user = doc.members[i];
				this.add({name:   user.name   || '',
          avatar: user.avatar || '',
          online: user.online || '',
          owner:  false
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
