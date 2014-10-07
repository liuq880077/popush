/* User Model */
/* User Model has 'name', 'avatar', 'online', 'owner' attributes.
 * name: 用户名
 * avatar: 用户头像路径
 * online: 表示用户是否在线
 * owner: 表示进入房间的文件是否是自己拥有的（还是别人共享的）
 */
var app = app || {};

(function () {
	'use strict';

	
	app.User = Backbone.Model.extend({
    idAttribute: 'name',
    
		defaults: {
			name: '',
			avatar: 'images/character.png',
			online: false,
			owner: false,
		},
    
	});
  
})();
