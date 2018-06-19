// ==UserScript==
// @name         MeFi Comment Audit
// @namespace    https://github.com/emanuelfeld
// @version      0.1
// @description  How much are you and others commenting in a thread?
// @author       Emanuel Feld
// @include      http://*.metafilter.com/*
// @include      https://*.metafilter.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict'

  let loggedInModern = document.getElementsByClassName('profile').length > 0;
  let loggedInClassic = document.getElementById('navoften') !== null;
  let stillActive = document.getElementById('comment') !== null;

  let userCommentCount = {};
  let userCommentLength = {};

  let threadCommentCount = 0;
  let threadCommentLength = 0;
  let threadCommenterCount = 0;
  let threadOtherCommenterCount = 0;

  let statsDiv = document.createElement('div');
  statsDiv.id = 'userscript-thread-comment-statistics';

  function getCommentLength (el) {
    let text = el.textContent;
    let textLength = text.lastIndexOf('posted by');
    return textLength;
  }

  function getUserId (el) {
    return el.href.split('/').pop();
  }

  function updateStatistics (commentIndex = 0) {
    const comments = Array.from(document.querySelectorAll('div.comments')).slice(0, -2);
    let commentAuthors = Array.from(document.querySelectorAll('.smallcopy > a:first-child'));
    let authorId = getUserId(commentAuthors.pop());
    commentAuthors = commentAuthors.slice(1);

    for (let i = commentIndex; i < comments.length; i++) {
      try {
        let userId = getUserId(commentAuthors[i]);
        let commentLength = getCommentLength(comments[i]);

        threadCommentCount += 1;
        threadCommentLength += commentLength;

        if (userCommentCount.hasOwnProperty(userId)) {
          userCommentCount[userId] += 1;
          userCommentLength[userId] += commentLength;
        } else {
          userCommentCount[userId] = 1;
          userCommentLength[userId] = commentLength;
        }
      } catch (e) {
        // non-author link because mefi's css is funky
      }
    }

    threadCommenterCount = Object.keys(userCommentCount).length;
    let authorCommenterPercentage;

    if (!userCommentCount.hasOwnProperty(authorId)) {
      userCommentCount[authorId] = 0;
      userCommentLength[authorId] = 0;
      authorCommenterPercentage = 0;
      threadOtherCommenterCount = threadCommenterCount;
    } else {
      authorCommenterPercentage = Math.round(1 / threadCommenterCount * 100) || 0;
      threadOtherCommenterCount = threadCommenterCount - 1;
    }

    let authorCommentCountPercentage = Math.round(userCommentCount[authorId] / threadCommentCount * 100) || 0;
    let authorCommentLengthPercentage = Math.round(userCommentLength[authorId] / threadCommentLength * 100) || 0;

    let userCommentCountText = userCommentCount[authorId] === 1 ? 'comment' : 'comments';
    let threadCommenterCountText = threadOtherCommenterCount === 1 ? 'person has' : 'people have';
    statsDiv.innerHTML = `
    <p>
      You have contributed ${userCommentCount[authorId]} ${userCommentCountText} to this thread.
      That's ${authorCommentCountPercentage}% of all comments by count and ${authorCommentLengthPercentage}% by length.
    </p>
    <p>
      ${threadOtherCommenterCount} other ${threadCommenterCountText} commented.
      You make up ${authorCommenterPercentage}% of all commenters.
    </p>`;
  }

  if ((loggedInModern || loggedInClassic) && stillActive) {
    document.getElementById('commentnote').prepend(statsDiv);

    updateStatistics(0);

  // monitor for new comments
    let observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutationRecord) {
        let newDiv = document.getElementById('newcommentsmsg');
        if (newDiv.style.display === 'none') {
          updateStatistics(threadCommentCount);
        }
      })
    })

    let target = document.getElementById('newcommentsmsg');
    observer.observe(target, { attributes: true, attributeFilter: ['style'] });
  }
})()
