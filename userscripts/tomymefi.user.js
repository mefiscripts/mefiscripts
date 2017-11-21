// ==UserScript==
// @name         MyMefi Redirect
// @namespace    https://github.com/emanuelfeld
// @version      0.1
// @description  Redirect from the Metafilter homepage to MyMefi when logged in
// @author       Emanuel Feld
// @match        https://www.metafilter.com/
// @match        https://www.metafilter.com/?*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var loggedInModern = document.getElementsByClassName('profile').length > 0;
    var loggedInClassic = document.getElementById('navoften') !== null;
    if (loggedInModern || loggedInClassic) {
        document.location = 'https://www.metafilter.com/home/mymefi';
    }
})();
