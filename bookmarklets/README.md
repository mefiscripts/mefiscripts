Bookmarklets installable as "javascript:" bookmarks.

To install, drag the link to your bookmarks bar.

| Script | Description |
| --- | --- |
| [Is Linked](javascript:(function(){if(!iL){var iL={}};iL.a=prompt("Link:","");iL.b=0;iL.c=window.location.pathname;iL.d=document.getElementsByClassName("comments");for(var id in iL.d){try{iL.e=iL.d[id].innerHTML.toString()}catch(e){continue}if(iL.e.indexOf(iL.a)!=-1){iL.b=1;iL.f=iL.e.match(new RegExp(iL.c+"#\\d+","g")).pop();iL.g=iL.e.lastIndexOf(iL.f)+iL.c.length;iL.h=iL.e.substring(iL.g,iL.g+iL.f.length-iL.c.length);break}};if(iL.b==1){if(window.confirm("Looks like that was posted. Click OK to see where.")){window.location.hash=iL.h}}else if(iL.a){alert("Doesn't look like that exact link has been posted!")}})();)|Prompts the user for a link, then checks the comments in a thread to see if it has already been posted. Offers to jump to the comment if the link is found.
