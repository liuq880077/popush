var app = app || {};

(function() {

/* 修改默认Backbone回调，添加wait = true */
(function() {
	/* backup */
	var _save 	= Backbone.Model.prototype.save
	, _destroy 	= Backbone.Model.prototype.destroy
	, _create 	= Backbone.Collection.prototype.create
	;

	/* 设置option.wait */
	Backbone.Model.prototype.save = function(key, val, options) {
	    /* typeof null === 'object' */
		var attr = key;
		if (typeof key !== 'object') { 
			(attr = {})[key] = val;
		} else { 
			options = val; 
		}
		options || (options = {});
		options.wait = (options.wait !== false);
		_save.call(this, attr, options);
	};
	
	Backbone.Model.prototype.destroy = function(options) {
		options || (options = {});
		options.wait = (options.wait !== false);
		_destroy.call(this, options);
	};
	
	Backbone.Collection.prototype.create = function(model, options) {
		options || (options = {});
		options.wait = (options.wait !== false);
		_create.call(this, model, options);
	}
})();

/* 设置 file model的sync方式 为socket.emit */
var syncFile = function(method, model, options) {
	if (!(app.Lock.attach(options))) { 
		return false; 
	}
	if (options.virtual === true) { 
		return; 
	}
	var m, d = { path: model.get('path') };
	
	//消息处理
	switch(method) {
	case 'read': 
		m = 'doc'; 
		break;
	case 'patch': 
	case 'update': 
		m = 'move';
		d = { path: options.oldPath, newPath: model.get('path'), };
		break;
	case 'create': 
		m = 'new'; 
		d.type = model.get('type'); 
		break;
	case 'delete': 
		m = 'delete'; 
		break;
	}
	app.socket.emit(m, d);
};

var syncFiles = (function() {
	var method = 'reset', success = null, dealDoc = function(data) {
		/* socket.on('doc', success: ); */
		if (!data || !data.doc) { 
			return; 
		}
		if (data.doc.type && data.doc.type != 'dir') {
			//不是目录，则尝试进入文件
			app.Lock.remove();
			app.room.tryEnter(new app.File(data.doc), '#no-file');
			data.notRemove = true;
		} else {
			//进入目录
			var ms = data.doc.members;
			if (ms) {
				var ds = data.doc.docs, i;
				if (ds && ds.length) { 
					for(i = ds.length; --i >= 0; ) { 
						ds[i].members = ms; 
						ds[i].owner = data.doc.owner;
					}
				}
   		     	(ms = _.clone(ms)).unshift(data.doc.owner);
   		   	} else { 
   		   		ms = app.currentUser;
   	   		}
      
			if (typeof success == 'function') { 
				success(data.doc.docs || data.doc); 
			}
			
			//更新合作成员列表
			app.collections['members'][method](ms);
			app.collections['cooperators'][method](ms);
    	}
	};
	
	return function(m, c, options) {
		if (m !== 'read') { 
			return; 
		}
		var newSuccess = options.success;
		options.success = dealDoc;
		if (!(app.Lock.attach(options))) { 
			return false; 
		}
		success = newSuccess;
		method = options.reset ? 'reset' : 'set';
		if (options.virtual === true) { 
			return; 
		}
		app.socket.emit('doc', {path: c.path});
	};
})();

app.init || (app.init = {});
app.init.fileSync = function() {
	app.File.prototype.sync = syncFile;
	app.Files.prototype.sync = syncFiles;
}

app.init_suf || (app.init_suf = {});
(function() {
	var _init = false;
	app.init_suf.fileSync = function() {
		if(_init) { 
			return; 
		}
		_init = true;
		app.init_suf.mainSocket();
		/* 初始化文件相关事件同步收发 */
		var detach = app.Lock.detach;
		app.socket.on('new', detach);
		app.socket.on('delete', detach);
		app.socket.on('move', detach);
		app.socket.on('doc', detach);
		app.socket.on('share', detach);
		app.socket.on('unshare', detach);
	};
})();

})();
