// ==UserScript==
// @name            Mock Paginate
// @description     Adds the appearance of pages to threads by only showing one section of comments at a time.
// @namespace       github.com/davidmear/mefiscripts
// @version         1.0
// @include         https://metafilter.com/*
// @include         https://*.metafilter.com/*
// ==/UserScript==



//================================//
//            Options             //
//================================//

//  How many comments should each page display.
    var commentsPerPage = 100;

//  How many pages should be listed before switching to a condensed page list.
    var maxListedPages = 10;

//  How many next and previous pages to display in a condensed list.
    var condensedPad = 2;

//  If new comments are loaded on a later page, bounce the last page in the list.
    var bounceOnLoad = true;

//  Display a page list at the top of the comments.
    var showTopControls = true;

//  Display a page list at the bottom of the comments.
    var showBottomControls = true;

//  Always display page lists, even with zero comments.
    var alwaysShowControls = false;

//  Display page lists if there is only one page.
    var showSinglePageControls = true;

//  Text elements and styling.
    var ui = {
        prevButton: "« Prev",
        nextButton: "Next »",
        separator: "  |  ",
        ellipses: " ... ",
        currentL: "<b>[",
        currentR: "]</b>",
        pageL: "",
        pageR: "",
        comma: ", ",
    }

//  CSS for the page list boxes.
    var controlsStyle = "width: 100%; margin: 0 0 2em;";

//  CSS for each individual page link, as well as the Prev and Next buttons.
    var pageLinksStyle = "font-size: 100%; display: inline-block; position: relative; padding: 1px 3px; margin: -1px -3px;";

//  CSS for other text elements.
    var textStyle = "font-size: 100%;";



//================================//
//           Variables            //
//================================//

// Status
var currentPage = 0;
var totalPages;
var linkedCommentOnPage;
var linkedComment;
var storedHash = "";

// References
var allComments;
var commentAnchors;
var afterCommentsElement;
var newCommentsMessage;
var newCommentsObserver;
var triangleContainer;
var postCommentCount;

// Controls
var topControls;
var bottomControls;

//================================//
//             Setup              //
//================================//

function setup() {
    browserAdjustments();
    
    maxListedPages = parseInt(maxListedPages) <= 0? 1 : parseInt(maxListedPages) || 10;
    commentsPerPage = parseInt(commentsPerPage) <= 0? 1 : parseInt(commentsPerPage) || 100;
    condensedPad = parseInt(condensedPad) || 0;
    showBottomControls = showBottomControls || !showTopControls;
    
    allComments = [].slice.call(document.getElementsByClassName("comments")); // Gets a list of all the comment divs
    if (allComments.length == 0) {
        // Not on a thread page.
        return;
    }
    
    findPostCommentCount();
    
    newCommentsMessage = document.getElementById("newcommentsmsg");
    if (newCommentsMessage) {
        newCommentsObserver = new MutationObserver(newCommentsChange);
        newCommentsObserver.observe(newCommentsMessage, {attributes:true});
    }
    
    var topCommentsElement = allComments[0];
    afterCommentsElement = trimNonComments();
    if (!afterCommentsElement) {
        afterCommentsElement = topCommentsElement;
    }
    totalPages = Math.ceil(allComments.length / commentsPerPage);
    
    prepareAll();
    createControls(topCommentsElement);
    updateControls();
    
    if (window.location.hash) {
        hashChanged();
    }
    window.addEventListener("hashchange", hashChanged, false);
    
};

function trimNonComments() {
    var n;
    var last = -1;
    var trimmedComments = [];
    // Special case for IRL;
    var irl = window.location.hostname == "irl.metafilter.com";
    var nodeCheck = irl? 2 : 1;
    for (var i = 0; i < allComments.length; i++) {
        if (allComments[i].id != "prevDiv" && allComments[i].id != "prevDiv2" && allComments[i].childNodes) {
            n = allComments[i].childNodes[allComments[i].childNodes.length - nodeCheck];
            if (n && n.firstChild && n.firstChild.nodeValue == "posted by ") {
                // This is a comment.
                trimmedComments.push(allComments[i]);
                last = i;
            }
        }
    }
    try {
        if (irl) {
            if (last == -1) {
                last = document.getElementsByName("commentpreview")[0].previousElementSibling;
            } else {
                last = allComments[last].nextElementSibling.nextElementSibling.nextElementSibling;
            }
        } else if (last < allComments.length - 2 && allComments[last + 1].id == "newcommentsmsg") {
            last = allComments[last + 2];
        } else if (last < allComments.length - 1) {
            last = allComments[last + 1];
        } else {
            throw "Last comment found was " + last;
        }
    } catch (e) {
        last = null;
        console.log("Failed to find Next / Prev threads div. " + e);
    }
    allComments = trimmedComments;
    return last;
}

function prepareAll() {
    var display;
    
    commentAnchors = [];
    for (var i = 0; i < allComments.length; i++) {
        
        if (i >= currentPage * commentsPerPage && i < (currentPage + 1) * commentsPerPage) {
            display = "";
        } else {
            display = "none";
        }
        
        setCommentVisibility(i, display);
        
        if (allComments[i].previousElementSibling) {
            commentAnchors[i] = allComments[i].previousElementSibling.name;
        }
    
    };
    
    refreshFlow();
}


//================================//
//            Updates             //
//================================//

var newCommentsChange = function(changes) {
    for(var change of changes) {
        if (change.type == 'attributes' && change.attributeName == "style") {
            if (newCommentsMessage.style.display == "none") {
                // The new comments message div has its visibility changed when: 1) New comments are loaded and 2) The user clicks show comments.
                
                var previousComments = allComments.length;
                
                if (previousComments == 0) {
                    var firstComment = document.getElementsByClassName("comments")[0];
                    firstComment.parentNode.insertBefore(topControls.indexDiv, firstComment);
                }
                
                allComments = [].slice.call(document.getElementsByClassName("comments"));
                
                trimNonComments();
                                
                totalPages = Math.ceil(allComments.length / commentsPerPage);
                
                prepareNewComments(previousComments);
                
                createNewPageControls();
                updateControls();
                updatePostCommentCount();
                
                if (allComments.length > previousComments && currentPage < totalPages - 1) {
                    if (bounceOnLoad) {
                        bounceLastPage();
                    }
                }
                
                if (previousComments <= commentsPerPage && !showSinglePageControls) {
                    // Controls newly visible.
                    refreshFlow();
                }
                
                if (window.location.hash.substring(0, 7) == "#inline") {
                    restoreHash();
                }
                
                return;
            } else {
                return;
            }
        }
    }
}

function prepareNewComments(previousComments) {
    var display;
    
    for (var i = previousComments; i < allComments.length; i++) {
        
        if (i >= currentPage * commentsPerPage && i < (currentPage + 1) * commentsPerPage) {
            display = "";
        } else {
            display = "none";
        }
        
        setCommentVisibility(i, display);
        
        if (allComments[i].previousElementSibling) {
            commentAnchors[i] = allComments[i].previousElementSibling.name;
        }
    
    };
}

function setCommentVisibility(i, show) {
    try {
        // Toggle the comment visibility
        allComments[i].style.display = show; // Comment
        allComments[i].nextElementSibling.style.display = show; // First <br /> after comment
        allComments[i].nextElementSibling.nextElementSibling.style.display = show; // Second <br /> after comment
    } catch (e) {
        console.log("Setting comment " + i + " - " + e);
    }
}

function refreshFlow() {
    window.dispatchEvent(new Event('resize')); // Try to force reflow
}

function changePage(newPage, changeHash) {
    if (newPage >= 0 && newPage < totalPages && newPage != currentPage) {
        
        removePageGrey();
        
        var i;
        
        // Hide current page
        for (i = currentPage * commentsPerPage; i < Math.min((currentPage + 1) * commentsPerPage, allComments.length); i++) {
            setCommentVisibility(i, "none");
        }
        
        // Change page
        currentPage = newPage;
        
        // Show new page
        for (i = currentPage * commentsPerPage; i < Math.min((currentPage + 1) * commentsPerPage, allComments.length); i++) {
            setCommentVisibility(i, "");
        }
        
        updateControls();
        
        checkForLinkedComment();
        
        refreshFlow();
        
        // Jump to the top
        if (showTopControls) {
            topControls.indexDiv.previousElementSibling.scrollIntoView(true);
        } else {
            allComments[currentPage * commentsPerPage].previousElementSibling.scrollIntoView(true);
        }
        
        if (changeHash) {
          updateHash();
        }
        
        return true;
        
    }
    return false;
}

function checkForLinkedComment() {
    if (!triangleContainer) {
        var triangle = document.getElementById("triangle");
        if (triangle) {
            triangleContainer = document.createElement("div");
            triangleContainer.style.cssText = "display:inline-block; position:absolute; left:0; top:0;";
            triangle.parentNode.insertBefore(triangleContainer, triangle);
            triangleContainer.appendChild(triangle);
        }
    }
    if (triangleContainer) {
        triangleContainer.style.display = "none";
    }
    linkedCommentOnPage = false;
    for (var i = currentPage * commentsPerPage; i < Math.min((currentPage + 1) * commentsPerPage, allComments.length); i++) {
        if (commentAnchors[i] == linkedComment) {
            linkedCommentOnPage = true;
        }
    }
    if (triangleContainer && linkedCommentOnPage) {
        triangleContainer.style.display = "inline-block";
    }
}

function jumpToComment(commentAnchor) {
    for (var i = 0; i < allComments.length; i++) {
        if (commentAnchors[i] == commentAnchor) {
            linkedComment = commentAnchors[i];
            if (!changePage(Math.floor(i / commentsPerPage), false)) {
                refreshFlow();
            }
            allComments[i].previousElementSibling.scrollIntoView(true);
        }
    }
}

function updateHash() {
    if (linkedCommentOnPage) {
        window.location.hash = linkedComment;
    } else {
        window.location.hash = pageHash();
    }
}

function pageHash() {
    return "p" + (currentPage + 1);
}

function hashChanged() {
    if (window.location.hash) {
        if (window.location.hash.substring(0, 2) == "#p") {
            // Custom page hash
            changePage(parseInt(window.location.hash.substring(2)) - 1, true);
            // This is triggered by the user changing pages, but changePage() ignores it because newPage == currentPage
        } else {
            // Check if it's a Metafilter comment link
            jumpToComment(window.location.hash.substring(1));
            checkForLinkedComment();
        }
    } else {
        changePage(0, false);
        if (history.replaceState) {
            history.replaceState(null, null, window.location.href.split("#")[0] + "#" + pageHash());
        } else {
            updateHash();
        }
    }
    storedHash = window.location.hash.substring(1);
}

function restoreHash() {
    if (history.replaceState) {
        history.replaceState(null, null, window.location.href.split("#")[0] + "#" + storedHash);
    } else {
        window.location.hash = storedHash;
    }
}

function findPostCommentCount() {
    try {
        var byline = document.getElementsByClassName("smallcopy postbyline")[0];
        if (byline) {
            for (var i = 0; i < byline.childNodes.length; i++) {
                if (byline.childNodes[i].nodeValue) {
                    if (byline.childNodes[i].nodeValue.indexOf("total)") >= 0) {
                        postCommentCount = byline.childNodes[i];
                        return;
                    }
                }
            }
        }
        // Fallback for music's byline which is only class "smallcopy"
        var smallcopyElements = document.getElementsByClassName("smallcopy");
        for (var j = 0; j < smallcopyElements.length; j++) {
            byline = smallcopyElements[j];
            for (i = 0; i < byline.childNodes.length; i++) {
                if (byline.childNodes[i].nodeValue) {
                    if (byline.childNodes[i].nodeValue.indexOf("comments total)") >= 0) {
                        postCommentCount = byline.childNodes[i];
                        return;
                    }
                }
            }
        }
    } catch (e) {
        console.log("Failed to find post comment count. " + e);
    }
}

function updatePostCommentCount() {
    if (!postCommentCount) {
        findPostCommentCount();
    }
    if (postCommentCount) {
        postCommentCount.nodeValue = postCommentCount.nodeValue.replace(/\d+/, allComments.length);
    }
}

//================================//
//            Controls            //
//================================//

function createControls(topCommentsElement) {
    if (showTopControls) {
        topControls = new Controls(topCommentsElement, "paginationControlsTop");
    }
    if (showBottomControls) {
        bottomControls = new Controls(afterCommentsElement, "paginationControlsBottom");
    }
}

function updateControls() {
    if (showTopControls) {
        topControls.updateControls();
    }
    if (showBottomControls) {
        bottomControls.updateControls();
    }
}

function createNewPageControls() {
    if (showTopControls) {
        topControls.createNewPageControls();
    }
    if (showBottomControls) {
        bottomControls.createNewPageControls();
    }
}

function removePageGrey() {
    if (showTopControls) {
        topControls.removePageGrey();
    }
    if (showBottomControls) {
        bottomControls.removePageGrey();
    }
}

function bounceLastPage() {
    // Top controls should never be visible when this happens.
    if (showBottomControls) {
        bounceElement(bottomControls.pageLinks[totalPages - 1]);
    }
}


function Controls(locationElement, id) {
    this.indexDiv;
    this.indexSpan;
    this.prevLink;
    this.nextLink;
    this.prevGrey;
    this.nextGrey;
    this.prevGreyed = false;
    this.nextGreyed = false;
    this.pageLinks = [];
    this.pageLinksEnd;
    this.pageCommas = [];
    this.pageGrey;
    this.pageEllipses = [];
    
    this.createControls(locationElement, id);
}

Controls.prototype.updateControls = function() {
    if (alwaysShowControls) {
        this.indexDiv.style.display = "";
    } else if (totalPages < 2 && !showSinglePageControls || allComments.length == 0) {
        this.indexDiv.style.display = "none";
    } else {
        this.indexDiv.style.display = "";
    }
    if (this.indexSpan.contains(this.pageLinks[currentPage])) {
        this.indexSpan.insertBefore(this.pageGrey, this.pageLinks[currentPage]);
        this.pageGrey.innerHTML = ui.currentL + (currentPage + 1) + ui.currentR;
        this.pageLinks[currentPage].remove(true);
    }
    
    if (totalPages > maxListedPages) {
        this.indexSpan.insertBefore(this.pageEllipses[0], this.pageCommas[0].nextSibling);
        if (currentPage == totalPages - 1) {
            this.indexSpan.insertBefore(this.pageEllipses[1], this.pageGrey);
        } else {
            this.indexSpan.insertBefore(this.pageEllipses[1], this.pageLinks[totalPages - 1]);
        }
        
        // Reduce padding to enforce maxListedPages
        
        var adjustedPad = Math.min(condensedPad, Math.max(0, parseInt((maxListedPages - 3) / 2)));
        
        var lowPage = Math.min(currentPage - adjustedPad, totalPages - 1 - adjustedPad * 2);
        var highPage = Math.max(currentPage + adjustedPad, adjustedPad * 2);
        for (var i = 1; i < totalPages - 1; i++) {
            if (i >= lowPage && i <= highPage) {
                this.pageLinks[i].style.display = "";
                this.pageCommas[i].style.display = "";
            } else {
                this.pageLinks[i].style.display = "none";
                this.pageCommas[i].style.display = "none";
            }
        }
        
        if (highPage + 1 >= totalPages - 1) {
            this.pageEllipses[1].remove(true);
        }
        if (lowPage - 1 <= 0) {
            this.pageEllipses[0].remove(true);
        }
    }
    
    if (currentPage == 0) {
        if (!this.prevGreyed) {
            this.indexSpan.insertBefore(this.prevGrey, this.prevLink);
            this.prevLink.remove(true);
            this.prevGreyed = true;
        }
    } else {
        if (this.prevGreyed) {
            this.indexSpan.insertBefore(this.prevLink, this.prevGrey);
            this.prevGrey.remove(true);
            this.prevGreyed = false;
        }
    }
    if (currentPage == totalPages - 1 || totalPages == 0) {
        if (!this.nextGreyed) {
            this.indexSpan.insertBefore(this.nextGrey, this.nextLink);
            this.nextLink.remove(true);
            this.nextGreyed = true;
        }
    } else {
        if (this.nextGreyed) {
            this.indexSpan.insertBefore(this.nextLink, this.nextGrey);
            this.nextGrey.remove();
            this.nextGreyed = false;
        }
    }
}

Controls.prototype.createControls = function(locationElement, id) {
    
    this.indexDiv = document.createElement("div");
    this.indexDiv.className = "comments";
    this.indexDiv.id = id;
    this.indexDiv.style.marginTop = 0;
    this.indexSpan = document.createElement("span");
    this.indexSpan.className = "whitesmallcopy";
    this.indexSpan.style.cssText = controlsStyle;
    
    this.prevLink = document.createElement("a");
    this.prevLink.style.cssText = pageLinksStyle;
    this.prevLink.appendChild(newInnerSpan(ui.prevButton, ""));
    this.prevLink.onclick = function(){changePage(currentPage - 1, true)};
    this.prevLink.style.cursor = "pointer";
    this.prevGrey = newInnerSpan(ui.prevButton, "");
    this.prevGrey.style.cssText = pageLinksStyle;
    
    this.indexSpan.appendChild(this.prevLink);
    
    this.nextLink = document.createElement("a");
    this.nextLink.style.cssText = pageLinksStyle;
    this.nextLink.appendChild(newInnerSpan(ui.nextButton, ""));
    this.nextLink.onclick = function(){changePage(currentPage + 1, true)};
    this.nextLink.style.cursor = "pointer";
    this.nextGrey = newInnerSpan(ui.nextButton, "");
    this.nextGrey.style.cssText = pageLinksStyle;
    
    this.indexSpan.appendChild(newInnerSpan(ui.separator, textStyle));
    
    this.pageLinksEnd = newInnerSpan(ui.separator, textStyle);
    this.indexSpan.appendChild(this.pageLinksEnd);
    
    for (var i = 0; i < totalPages; i++) {
        this.createPageButton(i);
    }
    this.pageGrey = document.createElement("span");
    this.pageGrey.style.cssText = pageLinksStyle;
    this.pageGrey.innerHTML = ui.currentL + "1" + ui.currentRight;
    
    this.pageEllipses = [];
    this.pageEllipses[0] = newInnerSpan(ui.ellipses, textStyle);
    this.pageEllipses[1] = newInnerSpan(ui.ellipses, textStyle);
    
    this.indexSpan.appendChild(this.nextLink);
    
    this.indexDiv.appendChild(this.indexSpan);
    
    locationElement.parentNode.insertBefore(this.indexDiv, locationElement);
}

Controls.prototype.removePageGrey = function() {
    this.indexSpan.insertBefore(this.pageLinks[currentPage], this.pageGrey);
    this.pageGrey.remove(true);
}

Controls.prototype.createNewPageControls = function() {
    var i = this.pageLinks.length;
    if (this.pageLinks.length > 0 && this.pageLinks.length < totalPages) {
        this.pageCommas[i - 1] = document.createElement("span");
        this.pageCommas[i - 1].style.cssText = textStyle;
        this.pageCommas[i - 1].innerHTML = ui.comma;
        this.indexSpan.insertBefore(this.pageCommas[i - 1], this.pageLinksEnd);
    }
    while (this.pageLinks.length < totalPages) {
        this.createPageButton(i);
        i++;
    }
}

Controls.prototype.createPageButton = function(i) {
    this.pageLinks[i] = document.createElement("a");
    this.pageLinks[i].style.cssText = pageLinksStyle;
    var pageButtonText = document.createElement("span");
    pageButtonText.innerHTML = ui.pageL + (i + 1) + ui.pageR;
    this.pageLinks[i].appendChild(pageButtonText);
    this.pageLinks[i].onclick = this.createPageFunction(i);
    this.pageLinks[i].style.cursor = "pointer";
    this.indexSpan.insertBefore(this.pageLinks[i], this.pageLinksEnd);
    if (i < totalPages - 1) {
        this.pageCommas[i] = document.createElement("span");
        this.pageCommas[i].style.cssText = textStyle;
        this.pageCommas[i].innerHTML = ui.comma;
        this.indexSpan.insertBefore(this.pageCommas[i], this.pageLinksEnd);
    }
}

Controls.prototype.createPageFunction = function(i) {
    return function() {changePage(i, true)};
}

//================================//
//        Helper Functions        //
//================================//

function newInnerSpan(innerHTML, css) {
    var innerSpan = document.createElement("span");
    innerSpan.style.cssText = css;
    innerSpan.innerHTML = innerHTML;
    return innerSpan;
}

function bounceElement(element) {
    var y = 0;
    var yv = -0.6;
    var step = 0;
    var i = setInterval(frame, 5);
    function frame() {
        if (step >= 400) {
            clearInterval(i);
            element.style.top = 0;
        } else {
            step++;
            y += yv;
            yv = yv + 0.015;
            if (y > 0) {
                y = -y;
                yv = -yv * 0.6;
            }
            element.style.top = y + 'px';
        }
    }
}

function browserAdjustments() {
    // For IE - Need to actually test.
    /*
    if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };*/
}

setup();
