var app = app || {};

(function () {
	'use strict';

	app.Expressions = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Expression,
	});

  app.init || (app.init = {});

  app.init.expressions = function() {
    app.collections['expressions'] || (app.collections['expressions'] = new app.Expressions());
  };

})();
