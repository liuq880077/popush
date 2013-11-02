var app = app || {};

app.Room && _.extend(app.Room.prototype, {

  /* OK: */
  chat: function(text) { this.socket('chat', text); },
  
  /* OK: */
  onChat: function(name, type, content, time) {
    this.view.toChatBox(name, type, content, time);
  },
  
  /* OK: */
  onSystemChat: function(name, content, time) {
    content || (content = '');
    this.view.toChatBox(strings['systemmessage'] || 'System message', 'system',
      name + '&nbsp;' + (strings[content] || content), time);
    ;
  },
  
    /* OK: */
  stdin: function(text) { this.socket('sdtin', text); },
  
  /* OK: */
  onConOut: function(data, type) { this.view.toConsole(data, type); },
    
});

