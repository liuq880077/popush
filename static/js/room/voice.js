var app = app || {};

app.Room && _.extend(app.Room.prototype, {
  leaveVoiceRoom: function() {
    var voice = this.voice;
    while(voice.userArray.length > 0){
      $(voice.audioArray[voice.userArray.shift()]).remove();
    }
    while(voice.peerUserArray.length > 0){
      var peerUName = voice.peerUserArray.shift();
      if(voice.peerArray[peerUName]){
        voice.peerArray[peerUName].myOnRemoteStream = function (stream){
          stream.mediaElement.muted = true;
          return;
        };
      }
    }
    if(!voice.joinedARoom){ return; }
    voice.voiceConnection.myLocalStream.stop();
    voice.voiceConnection.leave();
    delete voice.voiceConnection;
  },
    
  openVoice: function() {
    var voice = this.voice;
    if(app.noVoice || voice.voiceLock) { return; }
    voice.voiceLock = true;
    voice.voiceOn = !voice.voiceOn;
    if(voice.voiceOn) {
      if(voice.joinedARoom) { return; }
      this.view.$('#voice-on').addClass('active');
      try {
  var uName = app.currentUser.name, room = this,
    dataRef = new Firebase('https://popush.firebaseIO.com/' + room.docData.id);
  dataRef.once('value', function(snapShot) {
    delete dataRef;
    if (snapShot.val() == null){
      var connection = new RTCMultiConnection(room.docData.id);
      voice.voiceConnection = connection;
      connection.session = "audio-only";
      connection.autoCloseEntireSession = true;

      connection.onstream = function (stream) {
        if((stream.type == 'remote') && (stream.extra.username != uName)) {
          stream.mediaElement.style.display = "none";
          stream.mediaElement.muted = false;
          stream.mediaElement.play();
          (document.body || document.getElementById('body')).appendChild(stream.mediaElement);
          voice.userArray.push(stream.extra.username);
          voice.audioArray[stream.extra.username] = stream.mediaElement;
        }
      };
      connection.onUserLeft = function(userid, extra, ejected) {
        $(voice.audioArray[extra.username]).remove();
        if(voice.peerArray[extra.username]) {
          voice.peerArray[extra.username].myOnRemoteStream = function (stream) {
            stream.mediaElement.muted = true;
            return;
          };
        }
      };
      connection.connect();
      
      connection.open({ extra: { username: uName, }, interval: 1000, });
    }
    else{
      var connection = new RTCMultiConnection(room.docData.id);
      voice.voiceConnection = connection;
      connection.session = "audio-only";
      connection.autoCloseEntireSession = true;
      
      connection.onNewSession = function (session){
        if(voice.joinedARoom){ return; }
        connection.join(session, { username: uName, });
      };
      connection.onstream = function (stream) {
        if ((stream.type == 'remote') && (stream.extra.username != username)) {
          stream.mediaElement.style.display = "none";
          stream.mediaElement.muted = false;
          stream.mediaElement.play();
          voice.userArray.push(stream.extra.username);
          voice.audioArray[stream.extra.username] = stream.mediaElement;
          (document.body || document.getElementById('body')).appendChild(stream.mediaElement);
        }
      };
      connection.onUserLeft = function(userid, extra, ejected) {
        if(ejected){
          room.view.$('#voice-on').removeClass('active');
          while(voice.userArray.length > 0){
            $(voice.audioArray[window.userArray.shift()]).remove();
          }
          while(voice.peerUserArray.length > 0){
            var peerUName = voice.peerUserArray.shift();
            if(voice.peerArray[peerUName]){
              voice.peerArray[peerUName].myOnRemoteStream = function (stream){
                stream.mediaElement.muted = true;
                return;
              };
            }
          }
          delete voice.voiceConnection;
          voice.voiceOn = !voice.voiceOn;
        }
        else{
          $(voice.audioArray[extra.username]).remove();
          if(voice.peerArray[extra.username]){
            voice.peerArray[extra.username].myOnRemoteStream = function (stream){
              stream.mediaElement.muted = true;
              return;
            };
          }
        }
      };
      connection.connect();
    }
  });
      } catch(err) {
        app.showMessageBox('error', err, 2500);
      }
    } else {
      this.leaveVoiceRoom();
    }
  },
  
});
