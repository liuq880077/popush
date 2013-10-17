(function() {
var d=document;

if(typeof document.getElementsByClassName !='function') {
  d.getElementsByClassName = function(classname) {
    var e=this.getElementsByTagName('*'), c=new RegExp('\\b'+classname+'\\b'), r=[];
    for(var i = 0, l = e.length; i < l; i++){
      if(c.test(e[i].className)){
        r.push(e[i]);
      }
    }
    return r;
  };
}

/* To get time with locat settings. */
Date.prototype.toLocaleJSON = function() {
  var t = this,
    y = t.getFullYear(),
    M = t.getMonth() + 1,
    d = t.getDate(),
    h = t.getHours(),
    m = t.getMinutes(),
    s = t.getSeconds();
  return y + '/' + (M < 10 ? '0' + M : M) + '/' + (d < 10 ? '0' + d : d) + ' ' +
    (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

})();