var app = app || {};

app.Room && _.extend(app.Room.prototype, {
  debugStep: function() {
    if(this.debugLock && this.waiting) { this.socket('step'); }
  },
  
  debugNext: function() {
    if(this.debugLock && this.waiting) { this.socket('next'); }
  },

  debugfinish: function() {
    if(debugLock && waiting) { this.socket('finish'); }
  },

  debugcontinue: function() {
    if(this.debugLock && this.waiting) { this.socket('resume'); }
  },
  
 
  
});
