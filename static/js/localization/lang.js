var app = app || {};
app.init || (app.init = {});
app.languages || (app.languages = {});
var strings = strings || {};

(function() {
  var _init = false;
  app.init.lang = function() {
    if(_init) { return; } else { _init = true; }
    
    app.languages.set($.cookie('language') || 'zh-CN');
    var t = _.template($('#lang-btn-template').html(), null, {variable: 'o'}), arr = [];
    for(var i in app.languages) {
      if(i !== 'set') { arr.push(t({key: i, name: app.languages[i].Name})); }
    }
    $('#language-panel').html(arr.join('')).on('click', 'button', function(e) {
      app.languages.set($(e.target).attr('lang'));
    });
  };

})();

app.languages.set = function(langId) {
  var oldl = strings, newl = app.languages[langId];
  if(!langId || !newl) { return false; }
  
  strings = newl;
  $.cookie('language', langId,  {expires: 30});
  if(oldl.Name) {
    var m = {}, i;
    for(i in oldl) { m[oldl[i]] = newl[i]; }
    delete m[oldl.Name]; /* it may be faster with this - just a try */
  } else {
    var m = newl;
  }
  var fromMap = function(i, o) { return m[o] || o; } /* i: index, o: old */
  $('[title]').attr('title', fromMap);
  $('[localization]').html(fromMap);
  
  if(oldl.Name) { delete m; }
  return true;
};