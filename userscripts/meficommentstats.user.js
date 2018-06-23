// ==UserScript==
// @name         MeFi Comment Audit
// @namespace    https://github.com/emanuelfeld
// @version      0.3
// @description  How much are you and others commenting in a thread?
// @author       Emanuel Feld
// @include      http://*.metafilter.com/*
// @include      https://*.metafilter.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict'

  let onThreadPage = document.location.href.match(/metafilter\.com\/[0-9]+\//);
  let loggedInModern = document.getElementsByClassName('profile').length > 0;
  let loggedInClassic = document.getElementById('navoften') !== null;

  let authorId;

  let userCommentCount = {};
  let userCharLength = {};

  let threadCommentCount = 0;
  let threadCharLength = 0;
  let threadCommenterCount = 0;
  let threadOtherCommenterCount = 0;

  let statsDiv = document.createElement('div');

  function getCharLength (el) {
    return el.textContent.lastIndexOf('posted by');
  }

  function getUserId (el) {
    return el.href.split('/').pop();
  }

  function calculatePercentage (num, den) {
    return Math.round(num / den * 100) || 0;
  }

  function updateStatistics (commentIndex = 0) {
    let comments = document.querySelectorAll('div.comments');
    let commentAuthors = document.querySelectorAll('div.comments > .smallcopy > a:first-child');

    if (!userCommentCount.hasOwnProperty(authorId)) {
      userCommentCount[authorId] = 0;
      userCharLength[authorId] = 0;
    }

    for (let i = commentIndex; i < commentAuthors.length; i++) {
      try {
        let userId = getUserId(commentAuthors[i]);
        let commentLength = getCharLength(comments[i]);

        threadCommentCount += 1;
        threadCharLength += commentLength;

        if (userCommentCount.hasOwnProperty(userId)) {
          userCommentCount[userId] += 1;
          userCharLength[userId] += commentLength;
        } else {
          userCommentCount[userId] = 1;
          userCharLength[userId] = commentLength;
        }
      } catch (e) {
        // non-author link because mefi's css is funky
      }
    }

    threadCommenterCount = Object.keys(userCommentCount).length;
    threadOtherCommenterCount = threadCommenterCount - 1;

    let authorCommenterPercentage;

    if (userCommentCount[authorId] === 0) {
      authorCommenterPercentage = 0;
    } else {
      authorCommenterPercentage = calculatePercentage(1, threadCommenterCount);
    }

    let authorCommentCountPercentage = calculatePercentage(userCommentCount[authorId], threadCommentCount);
    let authorCharLengthPercentage = calculatePercentage(userCharLength[authorId], threadCharLength);

    let userCommentCountText = userCommentCount[authorId] === 1 ? 'comment' : 'comments';
    let threadCommenterCountText = threadOtherCommenterCount === 1 ? 'person has' : 'people have';

    statsDiv.innerHTML = `
    <p>
      You have contributed ${userCommentCount[authorId]} ${userCommentCountText} to this thread.
      That's ${authorCommentCountPercentage}% of all comments by count and ${authorCharLengthPercentage}% by length.
    </p>
    <p>
      ${threadOtherCommenterCount} other ${threadCommenterCountText} commented.
      You make up ${authorCommenterPercentage}% of all commenters.
    </p>`;
  }

  if (onThreadPage && (loggedInModern || loggedInClassic)) {
    if (loggedInClassic) {
      authorId = getUserId(document.querySelector('.mefimessages > a'));
    } else if (loggedInModern) {
      authorId = getUserId(document.querySelector('.profile > a'));
    }

    let stillActive = document.getElementById('comment') !== null;

    if (stillActive) {
      document.getElementById('commentnote').prepend(statsDiv);
      updateStatistics(0);

      let target = document.getElementById('newcommentsmsg');
      new MutationObserver(function (mutations) {
        mutations.forEach(function (mutationRecord) {
          let newDiv = document.getElementById('newcommentsmsg');
          if (newDiv.style.display === 'none') {
            updateStatistics(threadCommentCount);
          }
        })
      }).observe(target, {
        attributes: true,
        attributeFilter: ['style']
      });
    } else {
      Array.from(document.getElementsByClassName('comments')).slice(-1)[0].prepend(statsDiv);
      updateStatistics(0);
    }
  }
})()
