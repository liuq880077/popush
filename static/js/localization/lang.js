var app = app || {};
app.init || (app.init = {});
var strings = strings || {};

(function() {
  var _init = false;
  app.init.lang = function() {
    if(_init) { return; } else { _init = true; }
    
    app.languages.set($.cookie('language') || 'zh-CN');
    var t = _.template($('lang-btn-template').html(), null, 'o'), arr = [];
    for(var i in app.languages) {
      arr.push(t({key: i, name: app.languages[i].Name}));
    }
    $('#language-panel').html(arr.join('')).on('click', 'button', function(e) {
      app.setLanguage($(e.target).attr('lang'));
    });
  };

})();

  app.languages.set = function(langName) {
    var oldl = strings, newl = app.languages[langName];
    if(!langName || !newl) { return false; }
    
    strings = newl;
    $.cookie('language', lang,  {expires: 30});
    if(oldl.Name) {
      var m = {}, i;
      for(i in oldl) { m[oldl[i]] = newl[i]; }
      delete m[old.Name]; /* it may be faster with this - just a try */
    } else {
      var m = newl;
    }
    var fromMap = function(i, o) { return m[o] || o; } /* i: index, o: old */
    $('[title]').attr('title', fromMap);
    $('[localization]').html(fromMap);
    
    if(oldl.Name) { delete m; }
    return true;
  };