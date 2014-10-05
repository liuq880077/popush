module.exports = Runner;

var MAX_OUT_LENGTH = 10240;

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var util = require('util');
var fs = require('fs');
var cwd = process.cwd();
var prefix = 'tmp';

var A = '../../bin/a';
var NODE = '../../bin/node';
var PYTHON = '../../bin/python';
var PERL = '../../bin/perl';
var RUBY = '../../bin/ruby';
var LUA = '../../bin/lua';
var JAVA = '../../bin/jre/bin/java';

function Runner(name, type, src){
    if (!(this instanceof Runner)) return new Runner(type, src);
	var that = this;
	that.name = name;
	that.src = src;
	that.dir = prefix + '/' + new Date().getTime().toString();
	that.path = that.dir + '/' + that.name;
	that.clean = 'rm -rf ' + that.dir;
	if(process.platform == 'linux'){
		switch(type){
			case 'c':
				that.script = [
					{cmd:'gcc', args:['-o', that.name + '.out', that.name]},
					{cmd:A, args:['0', that.name + '.out'], start:true}
				];
				break;
			case 'cpp':
				that.script = [
					{cmd:'g++', args:['-o', that.name + '.out', that.name]},
					{cmd:A, args:['0', that.name + '.out'], start:true}
				];
				break;
			case 'js':
				that.script  = [
					{cmd:A, args:['1', NODE, that.name], start:true, filter:function(data){
						return data.replace(new RegExp(cwd + '/' + that.dir + '/', 'gm'), '');
					}}
				];
				break;
			case 'py':
				that.script = [
					{cmd:A, args:['0', PYTHON, that.name], start:true}
				];
				break;
			case 'pl':
				that.script = [
					{cmd:A, args:['0', PERL, that.name], start:true}
				];
				break;
			case 'rb':
				that.script = [
					{cmd:A, args:['1', RUBY, that.name], start:true}
				];
				break;
			case 'lua':
				that.script = [
					{cmd:A, args:['0', LUA, that.name], start:true, filter:function(data){
						return data.replace(new RegExp(LUA, 'gm'), 'lua');
					}}
				];
				break;
			case 'java':
				that.class = that.name.substr(0, that.name.lastIndexOf('.'));
				that.script = [
					{cmd:'javac', args:[that.name]},
					{cmd:A, args:['1', JAVA, that.class], start:true, filter:function(data){
						return data.replace(new RegExp(JAVA, 'gm'), 'java');
					}}
				];
				break;
		}
	}else{
		switch(type){
			case 'c':
				that.script = [
					{cmd:'gcc', args:['-o', that.name + '.out', that.name]},
					{cmd:'./' + that.name + '.out', args:[], start:true}
				];
				break;
			case 'cpp':
				that.script = [
					{cmd:'g++', args:['-o', that.name + '.out', that.name]},
					{cmd:'./' + that.name + '.out', args:[], start:true}
				];
				break;
			case 'js':
				that.script  = [
					{cmd:'node', args:[that.name], start:true, filter:function(data){
						return data.replace(new RegExp(cwd + '/' + that.dir + '/', 'gm'), '');
					}}
				];
				break;
			case 'py':
				that.script = [
					{cmd:'python', args:[that.name], start:true}
				];
				break;
			case 'pl':
				that.script = [
					{cmd:'perl', args:[that.name], start:true}
				];
				break;
			case 'rb':
				that.script = [
					{cmd:'ruby', args:[that.name], start:true}
				];
				break;
			case 'lua':
				that.script = [
					{cmd:'lua', args:[that.name], start:true
					/* , filter:function(data){return data.replace(new RegExp(LUA, 'gm'), 'lua');} */
					}
				];
				break;
			case 'java':
				that.class = that.name.substr(0, that.name.lastIndexOf('.'));
				that.script = [
					{cmd:'javac', args:[that.name]},
					{cmd:'java', args:[that.class], start:true}
				];
				break;
		}
	}
};

util.inherits(Runner, require('events').EventEmitter);

Runner.prototype.ready = function(){
	return this.script ? true : false;
}

Runner.prototype.run = function(callback){
	if(!this.ready()){
		return callback({err:'not supported'});
	}
	if(typeof this.script === 'function'){
		return this.script(callback);
	}
	var that = this;
	fs.mkdir(that.dir, function(err){
		if(err){
			return callback({err:err});
		}
		fs.writeFile(that.path, that.src, function(err){
			if(err){
				return callback({err:err});
			}

			function clean(err){
				exec(that.clean, function(){});
				if(that.err){
					err = that.err;
				}
				callback({err:err});
			}

			function step(){
				if(that.script.length > 0){
					var s = that.script.shift();
					that.child = spawn(s.cmd, s.args, {cwd:that.dir});
					if(s.start){
						that.emit('start');
						that.outLength = 0;
					}
					that.child.stdout.on('data', function(data){
						data = data.toString();
						if(s.start){
							that.outLength += data.length;
							if(that.outLength > MAX_OUT_LENGTH){
								return that.kill();
							}
						}
						that.emit('stdout', data);
					});
					that.child.stderr.on('data', function(data){
						data = data.toString();
						if(s.start){
							that.outLength += data.length;
							if(that.outLength > MAX_OUT_LENGTH){
								return that.kill();
							}
						}
						if(s.filter){
							data = s.filter(data);
						}
						that.emit('stderr', data);
					});
					that.child.on('error', function(err){
						return clean(err);
					});
					that.child.on('exit', function(code, signal){
						that.child = null;
						if(signal){
							return clean({signal:signal});
						}
						if(code){
							return clean({code:code});
						}
						if(that.script.length > 0){
							return step();
						}
						return clean({code:code});
					});
				}
			};
			return step();
		});
	})
};

Runner.prototype.input = function(data, callback) {
	if(!this.child){
		return callback('no stdin');
	}
	if(!this.child.stdin.write(data, function(){
		return callback(null);	
	})){
		return callback('buffer full');
	}
};

Runner.prototype.kill = function(){
	if(this.child){
		this.err = {signal:'SIGKILL'};
		this.child.kill('SIGTERM');
	}
};