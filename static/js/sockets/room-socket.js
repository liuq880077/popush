var app = app || {};

(function() {

/* OK: */
var onSet = function(data) {
  /* if 'data' has 'err', the message belongs to 'join', */
  /* and then throw it. */
  app.room.onSet(data);
};

var room, listeners = {
  /* OK: */
  chat: function(data) {
    room.onChat(data.name, data.name == app.currentUser.name ? 'self' : '',
      data.text, data.time);
  },
  
  /* OK: */
  deleted: function() {
    app.showMessageBox('info', 'deleted');
    room.close();
  },
  
  /* TODO: members */
  unshared: function(data) {
    if(data.name == app.currentUser.name) {
      room.exit();
      app.showMessageBox('info', 'you unshared', 1);
    } else {
      room.onSystemChat(data.name, 'unshared', data.time);
      /* TODO: */
      room.members.remove(data.name);
    }
  },

  /* TODO: members */
  shared: function(data) {
    room.onSystemChat(data.name, 'gotshared', data.time);
    /* TODO: */
    room.members.add(data);
    /* memberlistdoc.setonline(data.name, false); */
    room.members.sort();
  },
  
  moved: function(data) {
    if(!data.newPath) { return; }
    room.docModel.set({path: data.newPath});
    room.onMoved();
    room.onSystemChat((strings['moved to'] || 'moved to')
      + room.docModel.json.shownName, '', data.time);
  },
  
  run: function(data){
    room.onSystemChat(data.name, 'runsaprogram', data.time);
    room.onRun();
  },
  
  debug: function(data) {
    room.onSystemChat(data.name, 'startdebug', data.time);
    room.onDebug(data || {});
  },
  
  running: function(data) { room.onRunning(data || {}); },
  
  waiting: function(data) { room.onWaiting(data || {}); },

  stdout: function(data) { room.onConOut(data.data); },

  stdin: function(data) { room.onConOut(data.data, 'stdin'); },

  stderr: function(data) { room.onConOut(data.data, 'stderr'); },
  
  /* all above: OK: */
  
  /* TODO:  all below*/
  
  exit: function(data) {
    return;
  },
  
  /* OK: */
  join: function(data) {
    if(data.err) {
      app.showMessageBox('error', data.err);
      room.close();
    } else {
      room.onSystemChat(data.name, 'join', data.time);
      room.onJoin(data);
    }
  },
  
  /* OK: */
  leave: function(data) {
    this.onSystemChat(data.name, 'leave', data.time);
    room.onLeave(data);
  },
  
  ok: function(data) {
    return;
  };
  
  bpsok: function(data) {
    return;
  };

  bps: function(data) {
    return;
  };
  
  change: function(data) {
    return;
  };
  
};

var startListen = function(room1) {
  room = room1 || this;
  var socket = app.socket, ls = listeners;
  for(var i in ls) { socket.on(i, ls[i]); }
};

var stopListen = function() {
  var socket = app.socket;
  for(var i in ls) { socket.removeListener(i); }
  room = null;
};

var emit = function(m, d, d1) {
  switch(m) {
  case 'join':  d = {path: d}; break;
  case 'stdin': d = {data: d}; break;
  case 'chat':  d = {text: d}; break;
  case 'kill':  d = undefined; break; /* TODO: ack whether it's ok */
  case 'run':   d = {version: d, type: d1}; break;
  case 'step': case 'next': case 'finish': case 'resume':
    d = { }; break;
  case 'bps': break;
   
  }
  app.socket.emit(m, d);
};

app.init || (app.init = {});

(function() {
  var _init = false;
  app.init.roomSocket = function() {
    if(_init) { return; }
    _init = true;
    app.socket.on('set', onSet);
    
    app.room || app.init.room();
    app.room.startListen = startListen;
    app.room.stopListen = stopListen;
    app.room.socket = emit;
  };
})();

})();
