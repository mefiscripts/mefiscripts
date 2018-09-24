Bookmarklets installable as "javascript:" bookmarks.

To install, drag the link to your bookmarks bar.

| Script | Description |
| --- | --- |
| [Is Linked][1] | Prompts the user for a link, then checks the comments in a thread to see if it has already been posted. Offers to jump to the comment if the link is found. |
| [GraphFi][2] | A visualization/navigation tool. It displays a chart indicating the number of times a comment has been favorited and the reply/quoting relationships between comments. It also inserts anchor links and replies into the comment feed to assist with 'threading'.<br><br>GraphFi was written by Charlie DeTar and is republished here to help with hosting. Here's the [original site](https://marks.tirl.org/) and [original source code](https://github.com/yourcelf/marksism). |

[1]: javascript:(function(){if(!iL){var iL={}};iL.a=prompt("Link:","");iL.b=0;iL.c=window.location.pathname;iL.d=document.getElementsByClassName("comments");for(var id in iL.d){try{iL.e=iL.d[id].innerHTML.toString()}catch(e){continue}if(iL.e.indexOf(iL.a)!=-1){iL.b=1;iL.f=iL.e.match(new RegExp(iL.c+"#\\d+","g")).pop();iL.g=iL.e.lastIndexOf(iL.f)+iL.c.length;iL.h=iL.e.substring(iL.g,iL.g+iL.f.length-iL.c.length);break}};if(iL.b==1){if(window.confirm("Looks like that was posted. Click OK to see where.")){window.location.hash=iL.h}}else if(iL.a){alert("Doesn't look like that exact link has been posted!")}})();
[2]: javascript:void((function(){var s=document.createElement("script");s.type="text/javascript";s.src="https://mefiscripts.github.io/mefiscripts/bookmarklets/graphfi.js";document.getElementsByTagName("head")[0].appendChild(s);})())
