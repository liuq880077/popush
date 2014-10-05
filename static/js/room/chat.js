var app = app || {};

/* 房间聊天控制器 */
app.Room && _.extend(app.Room.prototype, {

	//聊天发送
	chat: function(text) { 
		this.socket('chat', text); 
	},
  	
  	//聊天收到处理
	onChat: function(name, type, content, time) {
    	this.view.toChatBox(name, type, content, time);
  	},

	//系统信息  
	onSystemChat: function(name, content, time) {
		content || (content = '');
		this.view.toChatBox(strings['systemmessage'] || 'System message', 'system',
		name + '&nbsp;' + (strings[content] || content), time);
    	;
	},
  
  	//控制台输入
	stdin: function(text) { 
		this.socket('sdtin', text); 
	},
  	
  	//控制台输出
	onConOut: function(data, type) { 
		this.view.toConsole(data, type); 
	},
    
});

