/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Members = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.User,

		comparator: function (member) {
			var value = "";
			if (!member.owner)
				value += "1";
			else 
				value += "0"
			if (!member.online)
				value += '1';
			else
				value += "0";
			return value + member.get('name');
		},
    
	});

  app.init || (app.init = {});

  app.init.members = function() {
    app.collections['members'] || (app.collections['members'] = new app.Members());
  };
  
})();
