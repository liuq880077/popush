module.exports = Lock;

function Lock(){
    if (!(this instanceof Lock)) return new Lock();
    this.lockTable = {};
};

Lock.prototype.acquire = function(id, callback){
    if(!this.lockTable[id]){
        this.lockTable[id] = new Array();
        callback();
    }
    else{
        this.lockTable[id].push(callback);
    }
};

Lock.prototype.release = function(id){
    if(this.lockTable[id]){
        if(this.lockTable[id].length == 0){
            delete this.lockTable[id];
        }
        else{
            this.LockTable[id].shift()();
        }
    }else{
        console.log("release unexisted lock: " + id);
    }
};

Lock.prototype.test = function(id){
	return this.lockTable[id] ? true : false;
};