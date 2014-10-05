/* Expression Model */
/* Expression Model has 'expression', 'value', 'notnew' attributes.
 * expression: 调试时的表达式
 * value: 表达式的值
 * notnew: 判断是否是新加的
 */
var app = app || {};

(function () {

	app.Expression = Backbone.Model.extend({
		defaults: {
			expression: ' ',
			value: null,
			notnew: true,
		},
    
	});
  
})();

