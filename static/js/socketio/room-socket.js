var app = app || {};

(function() {
	
function onJoin(data) {
	if(data.err) {
		showmessageindialog('openeditor', data.err);
		$('#editor').slideUp('fast');
		$('#filecontrol').slideDown('fast');
	} else {
		memberlistdoc.setonline(data.name, true);
		memberlistdoc.sort();
		appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['join'], new Date(data.time));
		var cursor = newcursor(data.name);
		if(cursors[data.name] && cursors[data.name].element)
			$(cursors[data.name].element).remove();
		cursors[data.name] = { element:cursor, pos:0 };
	}
}

app.room_socket = function() {
  app.socket.on('join', onJoin);
};

})();
