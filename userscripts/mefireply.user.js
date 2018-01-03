// ==UserScript==
// @name         MefiReply
// @namespace    https://github.com/emanuelfeld
// @version      0.2
// @description  Adds anchor to quote-reply and link back to original comments. Select the text you want quoted or just click 'reply' to include everything.
// @author       Emanuel Feld
// @include      http://*.metafilter.com/*
// @include      https://*.metafilter.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let loggedInModern = document.getElementsByClassName('profile').length > 0;
    let loggedInClassic = document.getElementById('navoften') !== null;
    let replyArea = document.getElementById('comment');

    // run only if logged in and thread not archived
    if ((loggedInModern || loggedInClassic) && replyArea) {
        run();
    }

    function run () {
        let pageLocation = location.protocol + '//' + location.host + location.pathname;

        let host = location.host;
        if (host.indexOf('www.') === 0) {
            host = host.slice(4);
        }

        let site = host.split('.')[0];

        appendReplyLinks(site, pageLocation);

        // monitor for new comments
        let observer = new MutationObserver(function(mutations) {
            mutations.forEach(function (mutationRecord) {
              let newDiv = document.getElementById('newcommentsmsg');
              if (newDiv.style.display === 'none') {
                appendReplyLinks(site, pageLocation);
              }
            });
        });

        let target = document.getElementById('newcommentsmsg');
        observer.observe(target, { attributes : true, attributeFilter : ['style'] });
    }

    // check if element actually is a post comment
    function isComment (element, site) {
        return (['metafilter', 'projects', 'music', 'irl', 'metatalk'].indexOf(site) > -1 &&
                    element.id === '' &&
                    element.querySelector('.whitesmallcopy') === null) ||
                (['ask', 'fanfare'].indexOf(site) > -1 && element.id.indexOf('c') === 0);
    }

    // add a reply link to each comment
    function appendReplyLinks (site, pageLocation) {
        let comments = document.querySelectorAll('div.comments');

        for (let i = 0; i < comments.length; i++) {
            if (isComment(comments[i], site)) {
                let commentMetaLinks = comments[i].querySelectorAll('.smallcopy > a');
                let commentUsername = commentMetaLinks[0].textContent;
                let commentAnchor = commentMetaLinks[1].href;

                // skip a link if replying to mod
                if (commentMetaLinks[1].href.indexOf('faq.metafilter.com') > -1) {
                  commentAnchor = commentMetaLinks[2].href;
                }

                let commentId = commentAnchor.split('#')[1];

                if (document.getElementById('mefiReply' + commentId) === null) {
                    let replySpan = document.createElement('span');
                    replySpan.id = 'reply' + commentAnchor.split('#')[1];
                    replySpan.innerHTML = '[<a id="mefiReply' + commentId + '" style="font-weight: normal;" href="' +
                                            pageLocation + '#comment">reply</a>]';
                    replySpan.querySelector('a').addEventListener ('click', function () {
                            addReply(commentUsername, commentId, commentAnchor);
                          }, false);
                    comments[i].querySelector('.smallcopy').appendChild(replySpan);
                 }
            }
        }
    }

    // return the selected text if any, otherwise null
    function getSelectedText () {
        let selection = window.getSelection();
        let selectedText = selection.toString().trim();

        if (selectedText.length && selection.isCollapsed === false) {
            return selectedText;
        } else {
            return null;
        }
    }

    // add text to comment box
    function addReply (username, id, anchor) {
        let quoteText;
        try {
            quoteText = document.getElementById('c' + id).textContent;
        } catch (e) {
            quoteText = document.querySelector('[name="' + id + '"]')
                                  .nextElementSibling.textContent;
        }
        quoteText = quoteText.split('posted by').slice(0, -1).join().trim();

        let selectedText = getSelectedText();

        // quote selected text instead if it's in full comment
        if (selectedText && quoteText.indexOf(selectedText) > -1) {
            quoteText = selectedText;
        }

        let replyText = '<a href="' + anchor + '">> ' + username + ':</a>\r\n<em>"' + quoteText + '"</em>\r\n\r\n';

        let replyArea = document.getElementById('comment');
        replyArea.value = replyArea.value.trim();
        if (replyArea.value.length !== 0) {
            replyArea.value += '\r\n\r\n' + replyText;
        } else {
            replyArea.value = replyText;
        }
    }

})();
