文档结构说明
/static/css						css文件夹
	bootstrap.min.css			bootstrap3.0的css
	codemirror.css				codemirror的css
	popush.css					popush的css
	youregon.ttf				popush标题字体
/static/fonts					bootstrap3.0图标,bootstrap.min.css引用到
/static/images					图片文件夹					
/static/index.html				index.html
/static/js						js文件夹
	app.js						全局js,管理MVC
	conf.js						配置说明
	router.js					Backbone框架Router
	loadmore.js					codemirror的动态加载文件
	/models						Backbone框架Model
		expression.js			调试窗口表达式模型
		file.js					文件模型
		user.js					用户模型
	/collections				Backbone框架Collection
		expressions.js			表达式集合
		files.js				文件集合
		members.js				用户集合
	/views						Backbone框架View
		login-view.js			登录视图
		register-view.js		注册视图
		file-view.js			单个文件管理视图
		files-view.js			文件管理视图
		member-view.js			单个成员显示视图
		memberlist-view.js		共享成员显示视图
		sharer-view.js			分享管理单个分享用户视图
		sharerlist-view.js		分享管理视图
		account-view.js			用户账户视图
		room-view.js			编辑页面视图
		expression-view.js		单个调试表达式视图
		expressionlist-view.js	调试表达式视图
	/room						编辑页面相关js
		data.js					room的定义和常量
		break.js				断点
		chat.js					文字聊天
		voice.js				语音聊天
		editor.js				编辑器
		room.js					进出逻辑
		run.js					运行和调试
	/sockets					socket事件监听
		file-sync.js			Backbone.Model.prototype底层sync机制的重载
		main-socket.js			socket文件页面事件监听
		room-socket.js			socket编辑页面事件监听
	/api						API相关js
		ie.js					IE浏览器相关js
		lock.js					socket通讯中lock的整合
	/lib						外部js依耐项
	/localization				语言切换相关js
		lang.js
		en-US.js
		zh-CN.js
	


