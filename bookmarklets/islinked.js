/*

Prompts the user for a link, then checks the comments in a thread to see if it has already been posted.
Offers to jump to the comment if the link is found.

Minified bookmarklet:

javascript:(function(){if(!iL){var iL={}};iL.a=prompt("Link:","");iL.b=0;iL.c=window.location.pathname;iL.d=document.getElementsByClassName("comments");for(var id in iL.d){try{iL.e=iL.d[id].innerHTML.toString()}catch(e){continue}if(iL.e.indexOf(iL.a)!=-1){iL.b=1;iL.f=iL.e.match(new RegExp(iL.c+"#\\d+","g")).pop();iL.g=iL.e.lastIndexOf(iL.f)+iL.c.length;iL.h=iL.e.substring(iL.g,iL.g+iL.f.length-iL.c.length);break}};if(iL.b==1){if(window.confirm("Looks like that was posted. Click OK to see where.")){window.location.hash=iL.h}}else if(iL.a){alert("Doesn't look like that exact link has been posted!")}})();

*/


//================================================================

// Full source:


javascript:(function(){
    if (!isLink) {var isLink = {}};

    isLink.link = prompt("Link:", ""); // User entered link.
    isLink.found = 0;
    isLink.post = window.location.pathname;
    isLink.comments = document.getElementsByClassName("comments");

    for (var id in isLink.comments) {
        // Check each comment.
        
        try {
            isLink.commentText = isLink.comments[id].innerHTML.toString();
        } catch (e) {
            continue;
        }
        
        if (isLink.commentText.indexOf(isLink.link) != -1) {
    
            isLink.found = 1;
            // Found the link in this comment!
            
            //
            // Get the anchor for the comment where the link was found.
            //
            
            isLink.byLine = isLink.commentText.match(new RegExp(isLink.post + "#\\d+", "g")).pop();
            // Finds every instance of a comment anchor link (in the format "/123456/Post-title#1234567").
            // Pops the last one, which will be the link in the comment's byline.
            
            isLink.by = isLink.commentText.lastIndexOf(isLink.byLine) + isLink.post.length;
            // Finds the index of the byline link, then the length of the post's URL (/123456/Post-title) to get to the anchor.
            
            isLink.where = isLink.commentText.substring(isLink.by, isLink.by + isLink.byLine.length - isLink.post.length);
            // Grabs the comment anchor (#1234567).
            
            break;
        }
    };

    if (isLink.found == 1) {
        if (window.confirm("Looks like that was posted. Click OK to see where.")) {
            window.location.hash = isLink.where;
            // Jump to the comment.
        };
    } else if (isLink.link) {
        // Only show this if the user actually entered a link.
        alert("Doesn't look like that exact link has been posted!");
    }

})();