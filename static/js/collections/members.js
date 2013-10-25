/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Members = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.User,

		comparator: function (member) {
			var value = "00";
			if (!member.owner)
				value[0] = '1';
			if (!member.online)
				value[1] = '1';
			return value + member.get('name');
		},
    
	});

  app.init || (app.init = {});

  app.init.members = function() {
    app.collections['members'] || (app.collections['members'] = new app.Members());
  };
  
})();
