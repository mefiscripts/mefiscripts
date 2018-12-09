// ==UserScript==
// @name         Mefi Spoiler
// @namespace    https://github.com/emanuelfeld
// @version      0.1
// @description  Adds a comments spoiler shortcut
// @author       Emanuel Feld
// @include      http://*.metafilter.com/*
// @include      https://*.metafilter.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let toolBar = document.getElementsByClassName('html-shortcuts-toolbar');

    if (toolBar.length > 0) {
        let spoilerButton = document.createElement('button');
        spoilerButton.className = 'html-shortcut-button';
        spoilerButton.type = 'button';
        spoilerButton.addEventListener('click', function () {
            let replyArea = document.getElementById('comment');
            if (replyArea.value) {
                replyArea.value += '\n<details><summary>Spoiler</summary>spoiler text\n</details>';
            } else {
                replyArea.value = '<details><summary>Spoiler</summary>spoiler text\n</details>';
            }
        });

        let spoilerLabel = document.createElement('span');
        spoilerLabel.className = 'label';
        spoilerLabel.textContent = 'Spoiler';

        spoilerButton.appendChild(spoilerLabel);
        toolBar[0].appendChild(spoilerButton);
    }
})();
