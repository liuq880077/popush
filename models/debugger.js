module.exports = Debugger;

var MAX_BREAK_TIMES = 1024;
var MAX_OUT_LENGTH = 10240;

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var util = require('util');
var fs = require('fs');
var prefix = 'tmp';
var cwd = process.cwd();

var A = '../../bin/a';
var GDB = '../../bin/gdb';

var _bad = ['56', '57', '58', '62', '112'];

function Debugger(name, type, src){
    if (!(this instanceof Debugger)) return new Debugger(type, src);
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
					{cmd:'gcc', args:['-g', '-o', that.name + '.out', that.name]},
					{cmd:'mkfifo', args:[that.name + '.stdin', that.name + '.stdout', that.name + '.stderr']},
					{cmd:A, args:['2', GDB, that.name + '.out'], start:true},
				];
				break;
			case 'cpp':
				that.script = [
					{cmd:'g++', args:['-g', '-o', that.name + '.out', that.name]},
					{cmd:'mkfifo', args:[that.name + '.stdin', that.name + '.stdout', that.name + '.stderr']},
					{cmd:A, args:['2', GDB, that.name + '.out'], start:true},
				];
				break;
		}
	}else if(process.platform == 'darwin'){
		switch(type){
			case 'c':
				that.script = [
					{cmd:'gcc', args:['-g', '-o', that.name + '.out', that.name]},
					{cmd:'mkfifo', args:[that.name + '.stdin', that.name + '.stdout', that.name + '.stderr']},
					{cmd:'gdb', args:[that.name + '.out'], start:true},
				];
				break;
			case 'cpp':
				that.script = [
					{cmd:'g++', args:['-g', '-o', that.name + '.out', that.name]},
					{cmd:'mkfifo', args:[that.name + '.stdin', that.name + '.stdout', that.name + '.stderr']},
					{cmd:'gdb', args:[that.name + '.out'], start:true},
				];
				break;
		}
	}
	else{
		switch(type){
			case 'c':
				that.script = [
					{cmd:'gcc', args:['-g', '-o', that.name + '.out', that.name]},
					{cmd:'gdb', args:[that.name + '.out'], start:true},
				];
				break;
			case 'cpp':
				that.script = [
					{cmd:'g++', args:['-g', '-o', that.name + '.out', that.name]},
					{cmd:'gdb', args:[that.name + '.out'], start:true},
				];
				break;
		}
	}
};

util.inherits(Debugger, require('events').EventEmitter);

Debugger.prototype.ready = function(){
	return this.script ? true : false;
}

Debugger.prototype._acquire = function(){
	if(this.lock){
		return false;
	}
	return this.lock = true;
};

Debugger.prototype._release = function(){
	delete this.lock;
};

Debugger.prototype._test = function(){
	return this.lock ? true : false;
};

Debugger.prototype._run = function(){
	var that = this;
	that.state = 'running';
	that.emit('running');
};

Debugger.prototype.interact = function(input, callback){
	var that = this;
	that.child.stdin.write(input + '\n');
	if(callback){
		that.proxy = function(data){
			delete that.proxy;
			callback(data);
		};	
	}
};

Debugger.prototype._stop = function(){
	if(this.child && this.state != 'killing'){
		this.state = 'killing';
		this.child.kill('SIGTERM');
	}
};

Debugger.prototype.kill = function(){
	this.err = {signal:'SIGKILL'};
	this._stop();
}

Debugger.prototype.start = function(callback){
	if(!this.ready){
		return callback({err:'not supported'});
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
					delete that.child;
					that.state = 'cleaning';
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
							that.state = 'starting';
						}
						var output = '';
						that.child.stdout.on('data', function(data){
							data = data.toString();
							if(s.filter){
								data = s.filter(data);
							}
							output += data;
							if(s.start){
								var i = data.indexOf('(gdb) ');
								if(i >= 0 && i + 6 == data.length){
									output = output.substr(0, output.indexOf('(gdb) '));
									if(output.substr(-1) == '\n'){
										output = output.substr(0, output.length - 1);
									}
									// console.log('\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
									// console.log(output);
									// console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n');
									if(that.state == 'starting'){
										that.bt = 0;
										that.state = 'ready';
										that.emit('ready');
									}else if(that.state == 'running'){
										if(output.indexOf('exited with code') >= 0 ||
											output.indexOf('exited normally') >= 0){
											if(output.indexOf('normally') >= 0){
												that.err = {code:0};
											}else{
												that.err = {code:parseInt(output.substr(-3, 2))};
											}
											return that._stop();
										}else if(output.indexOf('\nCatchpoint') >= 0){
											that.err = {signal:'SIGKILL'};
											return that._stop();
										}else if(output.indexOf('\nProgram terminated') >= 0){
											that.err = {signal:'SIGKILL'};
											return that._stop();
										}else{
											if(that.bt++ > MAX_BREAK_TIMES){
												return that._stop();
											};
											that.state = 'waiting';
											if(output.indexOf('\nValue returned') >= 0){
												output = output.substr(0, output.lastIndexOf('\n'));
											}
											if(output.length > 0){
												output = output.substr(output.lastIndexOf('\n') + 1);
												if(output.indexOf('\t') > 0){
													output = output.substr(0, output.indexOf('\t'));
													that.line = parseInt(output);
												}else{
													output = output.substr(0, output.indexOf(' '));
													that.line = output;	
												}
											}
											that.emit('waiting', that.line);
										}
									}else if(that.state == 'killing'){
									}else if(that.proxy){
										that.proxy(output);
									}
									output = '';
								}
							}else{
								that.emit('stdout', data);
							}
						});
						that.child.stderr.on('data', function(data){
							data = data.toString();
							if(s.filter){
								data = s.filter(data);
							}
							if(!s.start){
								that.emit('stderr', data);
							}
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
							if(that.script.length > 0 && that.state != 'killing'){
								return step();
							}
							return clean({code:code});
						});
					}
				};
				return step();
		});
	});
};

Debugger.prototype.addBreakPoint = function(line, callback){
	var that = this;
	if((that.state == 'waiting' || that.state == 'ready') && that._acquire()){
		that.interact('b ' + line, function(data){
			that._release();
			if(!data){
				return callback();
			}
			data = data.substr(data.lastIndexOf(' ') + 1);
			line = parseInt(data.substr(0, data.length - 1));
			callback(line);
		});
	}else{
		return callback();
	}
};

Debugger.prototype.removeBreakPoint = function(line, callback){
	var that = this;
	if((that.state == 'waiting' || that.state == 'ready') && that._acquire()){
		that.interact('clear ' + line, function(data){
			that._release();
			if(!data){
				return callback();
			}
			callback(line);
		});
	}else{
		return callback();
	}
};

Debugger.prototype.print = function(expr, callback){
	var that = this;
	if((that.state == 'waiting' || that.state == 'ready') && that._acquire()){
		that.interact('p ' + expr, function(data){
			that._release();
			if(!data){
				return callback();
			}
			callback(data.substr(data.indexOf(' = ') + 3));
		});
	}else{
		return callback();
	}
};

Debugger.prototype.step = function(){
	var that = this;
	if(that.state == 'waiting' && !that._test()){
		that.interact('s');
		that._run();
	}
};

Debugger.prototype.next = function(){
	var that = this;
	if(that.state == 'waiting' && !that._test()){
		that.interact('n');
		that._run();
	}
};

Debugger.prototype.finish = function(){
	var that = this;
	if(that.state == 'waiting' && !that._test()){
		that.interact('fin');
		that._run();
	}
};

Debugger.prototype.resume = function(){
	var that = this;
	if(that.state == 'waiting' && !that._test()){
		that.interact('c');
		that._run();
	}
};

Debugger.prototype.run = function(){
	var that = this;
	if(that.state == 'ready' && that._acquire()){
		var i = 0;
		function step(){
			if(i == _bad.length){
				that._release();
				var s = 'r';
				if(process.platform == 'linux' || process.platform == 'darwin'){
					that.stdin = fs.createWriteStream(that.path + '.stdin');
					that.outLength = 0;
					that.stdout = fs.createReadStream(that.path + '.stdout');
					that.stdout.on('data', function(data){
						data = data.toString();
						that.outLength += data.length;
						if(that.outLength > MAX_OUT_LENGTH){
							that.err = {signal:'SIGKILL'};
							return that._stop();
						}
						that.emit('stdout', data.toString());
					});
					that.stderr = fs.createReadStream(that.path + '.stderr');
					that.stderr.on('data', function(data){
						data = data.toString();
						that.outLength += data.length;
						if(that.outLength > MAX_OUT_LENGTH){
							that.err = {signal:'SIGKILL'};
							return that._stop();
						}
						that.emit('stderr', data.toString());
					});
					s += ' < ' + that.name + '.stdin';
					s += ' 1> ' + that.name + '.stdout';
					s += ' 2> ' + that.name + '.stderr';
				}else{
				
				}
				that.interact(s);
				return that._run();
			}
			that.interact('cat syscall ' + _bad[i], function(data){
				++i;
				return step();
			});
		}
		step();
	}
};

Debugger.prototype.input = function(data, callback){
	if(!this.stdin){
		return callback('no stdin');
	}
	if(!this.stdin.write(data, function(){
		return callback(null);
	})){
		return callback('buffer full');
	}
}