module.exports = DocBuffer;

var Buffers = require('buffers');

function DocBuffer(str){
    if (!(this instanceof DocBuffer)) return new DocBuffer(str);
    this.buffers = Buffers();
    this.buffers.push(new Buffer(str || '', 'ucs2'));
};

DocBuffer.prototype.update = function(from, to, text, callback){
    from = from * 2;
    to = to * 2;
    if(from > to || from < 0 || to > this.buffers.length){
    	return callback("invalid");
    }
    this.buffers.splice(from, to - from, new Buffer(text, 'ucs2'));
    callback(null);
};

DocBuffer.prototype.toString = function(){
    return this.buffers.toString('ucs2');
};

DocBuffer.prototype.length = function(){
	return this.buffers.length / 2;
};