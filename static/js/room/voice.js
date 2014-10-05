var app = app || {};

/* 房间语音控制器 */
app.Room && _.extend(app.Room.prototype, {

	/* 离开聊天室 */
	leaveVoiceRoom: function() {
		while(window.userArray.length > 0){
			$(window.audioArray[window.userArray.shift()]).remove();
		}
		while(window.peerUserArray.length > 0){
			var peerUName = window.peerUserArray.shift();
			if(window.peerArray[peerUName]){
				window.peerArray[peerUName].myOnRemoteStream = function (stream){
					stream.mediaElement.muted = true;
					return;
				};
			}
		}
		if(!window.joinedARoom){
			return;
		}
		$('#voice-on').removeClass('active');
		window.voiceConnection.myLocalStream.stop();
		window.voiceConnection.leave();
		delete window.voiceConnection;
  	},
   
   	/* 进入并初始化聊天室 */ 
	openVoice: function() {
		if(app.novoice)
			return;
		window.voiceon = !window.voiceon;
		if(window.voiceon) {
			if(window.joinedARoom){
				return;
			}
			$('#voice-on').addClass('active');
			try{
				var username = $('#nav-user-name').html();
				var dataRef = new Firebase('https://popush.firebaseIO.com/' + this.docData.id);
				var that = this;
				dataRef.once('value',function(snapShot){
					delete dataRef;
					if (snapShot.val() == null){
						var connection = new RTCMultiConnection(that.docData.id);
						window.voiceConnection = connection;
						connection.session = "audio-only";
						connection.autoCloseEntireSession = true;
	
						connection.onstream = function (stream) {
							if ((stream.type == 'remote') && (stream.extra.username != username)) {
								stream.mediaElement.style.display = "none";
								stream.mediaElement.muted = false;
								stream.mediaElement.play();
								document.body.appendChild(stream.mediaElement);
								window.userArray.push(stream.extra.username);
								window.audioArray[stream.extra.username] = stream.mediaElement;
							}
						};
						connection.onUserLeft = function(userid, extra, ejected) {
							$(window.audioArray[extra.username]).remove();
							if(window.peerArray[extra.username]){
								window.peerArray[extra.username].myOnRemoteStream = function (stream){
									stream.mediaElement.muted = true;
									return;
								};
							}
						};
						connection.connect();
						
						connection.open({
							extra: {
								username: username
							},
							interval: 1000
						});
					}
					else{
						var connection = new RTCMultiConnection(that.docData.id);
						window.voiceConnection = connection;
						connection.session = "audio-only";
						connection.autoCloseEntireSession = true;
						
						connection.onNewSession = function (session){
							if(window.joinedARoom){
								return;
							}
							connection.join(session, {
								username: username
							});
						};
						connection.onstream = function (stream) {
							if ((stream.type == 'remote') && (stream.extra.username != username)) {
								stream.mediaElement.style.display = "none";
								stream.mediaElement.muted = false;
								stream.mediaElement.play();
								window.userArray.push(stream.extra.username);
								window.audioArray[stream.extra.username] = stream.mediaElement;
								document.body.appendChild(stream.mediaElement);
							}
						};
						connection.onUserLeft = function(userid, extra, ejected) {
							if(ejected){
								$('#voice-on').removeClass('active');
								while(window.userArray.length > 0){
									$(window.audioArray[window.userArray.shift()]).remove();
								}
								while(window.peerUserArray.length > 0){
									var peerUName = window.peerUserArray.shift();
									if(window.peerArray[peerUName]){
										window.peerArray[peerUName].myOnRemoteStream = function (stream){
											stream.mediaElement.muted = true;
											return;
										};
									}
								}
								delete window.voiceConnection;
								window.voiceon = !window.voiceon;
							}
							else{
								$(window.audioArray[extra.username]).remove();
								if(window.peerArray[extra.username]){
									window.peerArray[extra.username].myOnRemoteStream = function (stream){
										stream.mediaElement.muted = true;
										return;
									};
								}
							}
						};
						connection.connect();
					}
				});
			}
			catch(err){
				alert(err);
			}
		} else {
			this.leaveVoiceRoom();
		}
  	},	
  	
});
