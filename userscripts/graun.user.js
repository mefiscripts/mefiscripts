// ==UserScript== 
// Based on a script in Mark Pilgram's upcoming "Dive into Greasemonkey",
// based off another script based off that
// I love my nerdy friends SO MUCH
// @name          Guardian of the MeFi Galaxy
// @namespace    https://github.com/jessamynwest
// @description  turns Grauniad into Guardian
// @author       Jessamyn West
// @include        https://metafilter.com/*
// @include        https://*.metafilter.com/*
// ==/UserScript==

(function() {
    var replacements, regex, key, textnodes, node, s; 

    replacements = { 
        "Grauniad": "Guardian",
        "Graun": "Guardian"
    }; 

    regex = {}; 
    for (key in replacements) { 
        regex[key] = new RegExp(key, 'g'); 
    } 

    textnodes = document.evaluate( "//body//text()", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null); 

    for (var i = 0; i < textnodes.snapshotLength; i++) { 
        node = textnodes.snapshotItem(i); 
        s = node.data; 
        for (key in replacements) { 
            s = s.replace(regex[key], replacements[key]); 
        } 
        node.data = s; 
    } 

})();
