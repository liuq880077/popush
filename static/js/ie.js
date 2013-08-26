function getElementsByClassName(classname) {
	var d=document;
	var e=d.getElementsByTagName('*');
	var c=new RegExp('\\b'+classname+'\\b');
	var r=[];

	for(var i=0,l=e.length;i<l;i++){
		var cn=e[i].className;
		if(c.test(cn)){
			r.push(e[i]);
		}
	}
	return r;
}

if(typeof document.getElementsByClassName !='function') {
	document.getElementsByClassName = getElementsByClassName;
}
