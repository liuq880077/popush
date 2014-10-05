module.exports = UserDAO;
var db = require('./db.js');
var crypto = require('crypto');
var Lock = require('./lock.js');
var lock = new Lock();

function UserDAO(){
	if(!(this instanceof UserDAO)){
		return new UserDAO();
	}
	this.innerError = false;
}

function md5(str){
	return crypto.createHash('md5').update(str).digest('hex');
};

function xor(str1, str2){
	var buf1 = new Buffer(str1, 'hex');
	var buf2 = new Buffer(str2, 'hex');
	var buf = new Buffer(16);
	for(var i = 0; i < 16; i++)
		buf[i] = buf1[i] ^ buf2[i];
	return buf.toString('hex');
};

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

function validateName(str){
	var re = /^[A-Za-z0-9]*$/;
	return str.length >= 6 && str.length <= 20 && re.test(str);
};

UserDAO.prototype.register = function(name, password, avatar, group, callback){
	
	if(!validateName(name)){
		return callback("name invalid");
	}

	if(password.length > 32){
		return callback("password too long");
	}

	lock.acquire(name, function(){
		db.user.findOne({name:name}, {_id:1}, function(err, user){
			if(err){
				lock.release(name);
				return callback("inner error");
			}
			if(user){
				lock.release(name);
				return callback("name exists");
			}
			db.user.insert({
				name:name,
				password:md5(xor(md5(name), md5(password))),
				avatar:avatar,
				state:"normal",
				group:group,
				docs:[],
				createTime: new Date().getTime()
			}, 
			function(err, newUser){
				if(err){
					lock.release(name);
					return callback("inner error");
				}
				else if(!newUser){
					lock.release(name);
					return callback("inner error");
				}
				else{
					lock.release(name);
					return callback(null);
				}
			});
		});
	});
};

UserDAO.prototype.getUserByName = function(name,callback){
	db.user.findOne({name:name}, {name:1, avatar:1, _id:0}, function(err,user){
		if (err){
			return callback("innerError");
		}
		else if(!user){
			return callback("unauthorized");
		}
		return callback(null,user);
	});
};

UserDAO.prototype.login = function(name, password, ip, callback){
	var that = this;
	db.user.findOne({name:name}, function(err, user){
		if(err){
			return callback("inner error");
		}
		if(!user){
			return callback("unauthorized");
		}
		if(md5(xor(md5(name), md5(password))) == user.password){
			delete user.password;
			db.user.update({_id:user._id}, {
				$set:{
					loginTime:new Date().getTime(),
					loginIP:ip
				}
			}, function(err){
				if(err){
					return callback("inner error");
				}
				db.doc.find({_id : {$in:user.docs}}, {revisions:0,_id:0}, function(err, docs){
					if (err){
						return callback("inner error");
					}
					if (docs.length == 0){
						docs = [];
						user.docs = docs;
						return callback(null,user);
					}
					else{
						var counter = 0;
						function t(doc){
							db.user.findOne({_id:doc.owner},{name:1,_id:0,avatar:1},function(err,trueowner){
								if (err){
									that.innerError = true;
								}
								doc.owner = trueowner;
								db.user.find({_id:{$in:doc.members}},{name:1,_id:0,avatar:1},function(err,members){
									if (err){
										that.innerError = true;
									}
									doc.members = members;
									counter++;
									if (counter == docs.length){
										user.docs = docs;
										return callback(null ,user);
									}
								});
							});
						}
						for (i in docs){
							if (that.innerError){
								that.innerError = false;
								return callback("inner error");
							}
							t(docs[i]);
						}
					}
				});
			});
		}else{
			return callback("unauthorized");
		}
	});
};

UserDAO.prototype.updateAvatar = function(userId, avatar, callback){
	lock.acquire(userId, function(){
		db.user.findOne({_id:userId}, function(err, user){
			if(err){
				lock.release(userId);
				return callback("inner error");
			}	
			if(!user){
				lock.release(userId);
				return callback("unauthorized");
			}
			db.user.update({_id:userId}, {
				$set:{
					avatar:avatar
				}
			}, function(err){
				if(err){
					lock.release(userId);
					return callback("inner error");
				}
				lock.release(userId);
				return callback(null);
			});
		});
	});
};

UserDAO.prototype.updatePassword = function(userId, password, newPassword, callback){
	lock.acquire(userId, function(){
		db.user.findOne({_id:userId},function(err, user){
			if(err){
				lock.release(userId);
				return callback("inner error");
			}
			if(!user){
				lock.release(userId);
				return callback("unauthorized");
			}
			if(md5(xor(md5(user.name), md5(password))) == user.password){
				db.user.update({_id:userId},{
					$set:{
						password:md5(xor(md5(user.name), md5(newPassword)))
					}
				}, function(err){
					if (err){
						lock.release(userId);
						return callback("inner error");
					}
					lock.release(userId);
					return callback(null);
				});
			}
			else{
				lock.release(userId);
				return callback("password incorrect");
			}
		});
	});
};
