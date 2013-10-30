/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Members = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.User,

		// We keep the Todos in sequential order, despite being saved by unordered
		// GUID in the database. This generates the next order number for new items.
		nextOrder: function () {
			if (!this.length) {
				return 1;
			}
			return this.last().get('order') + 1;
		},

		comparator: function (member) {
			var value = "";
			if (!member.owner)
				value += "1";
			else
				value += "0";
			if (!member.online)
				value += '1';
			else
				value += "0";
			return value + member.get('name');
		},
		
		isset: function(a) {
			return typeof(a) != "undefined" && a !== null;
		},
		
		update: function (data) {
			var col = this;
			col.each(function(m){m.trigger('remove');col.remove(m);});
			for (var i = 0; i < data.length; ++i) {
				var d = data[i];
				col.add({
					name: col.isset(d.name) ? d.name : '',
					avatar: col.isset(d.avatar) ? d.avatar : '',
					online: col.isset(d.online) ? d.online : false,
					owner: col.isset(d.owner) ? d.owner : false
				});
			}
		},
		
		updatedoc: function (doc) {
			var col = this;
			col.each(function(m){m.trigger('remove');col.remove(m);});
			this.add({name: col.isset(doc.owner.name)?doc.owner.name:'',
					  avatar: col.isset(doc.owner.avatar)?doc.owner.avatar:'',
					  online: col.isset(doc.owner.online)?doc.owner.online:false,
					  owner: true});
			for(var i=0; i<doc.members.length; i++) {
				var user = doc.members[i];
				this.add({name:col.isset(user.name)?user.name:'',
				          avatar:col.isset(user.avatar)?user.avatar:'',
				          online:col.isset(user.online)?user.online:'',
				          owner:false});
			}
		},
	});
  app.init || (app.init = {});

  app.init.members = function() {
    app.collections['members'] || (app.collections['members'] = new app.Members());
    app.collections['cooperators'] || (app.collections['cooperators'] = new app.Members());
    app.collections['shares'] || (app.collections['shares'] = new app.Members());
  };

})();
