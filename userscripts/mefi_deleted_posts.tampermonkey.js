// ==UserScript==
// @name            MeFi Deleted Posts
// @namespace       https://github.com/mefiscripts/mefiscripts
// @description     Shows deleted posts on Metafilter section indexes
// @version         0.2.2
// @require         https://code.jquery.com/jquery-1.12.4.min.js#sha256-ZosEbRLbNQzLpnKIkEdrPv7lOy9C27hHQ+Xp8a4MxAQ=
// @include         https://*.metafilter.com/*
// @exclude         http://music.metafilter.com/
// ==/UserScript==

(function() {
    mdp_log("initializing Metafilter Deleted Scripts");

    var debug = 1;
    var deletedbar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAgCAYAAADaDrJgAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A%2FwD'+
        '%2FoL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9gKEBI1LdBckgEAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAO'+
        '0lEQVQoz2NkYGBg%2BH%2FmzH8GKGA0MWFEEYApYGLAAhjRVeIGMJXINLXMJKx9YN2JzY5BGJ6MdEsMRAMAp8dakMN66%2FQAAAAASUVORK5CYII%3D';

    var threadlist = [];
    var threadinfo = {};

    $("a.more").each ( function() {
        var url = $(this).attr('href');
        mdp_log("Checking " + url);
        var matches = url.match(/(http:\/\/([^\.]*\.)?metafilter\.com)?\/(\d+)\//i);
        if (matches && matches.length > 1) {
            var threadid = parseInt(matches[3]);
            mdp_log("Adding " + threadid + " to list of seen threads");
            var anon = $(this).parent().html().indexOf("/user/17564");

            threadlist.push(threadid);
            threadinfo[threadid] = { obj: $(this),
                                    anon: (anon != -1) };
        }
    } );

    // Second pass, find the deleted threads and do the needful
    var lastthread = 0;
    for (var i=0; i<threadlist.length; ++i) {
        var threadid = threadlist[i];

        if (!threadinfo[threadid] || threadinfo[threadid].anon) continue;
        var thread = threadinfo[threadid].obj;

        if ((lastthread > 0) && (threadid < lastthread - 1)) {
            // the H2 is the real first line of a post
            var post = thread.parents("div.copy.post").prev("h2");
            for (var j = lastthread - 1; j > threadid; --j) {
                if (threadinfo[j]) continue;

                mdp_handle_deleted( j, post );
            }
        }

        lastthread = threadid;
    }
    /*
     * mdp_handle_deleted
     *
     * Given a thread id and the sibling to insert before, does the right thing for
     * a deleted thread
     */
    function mdp_handle_deleted( threadid, nextSibling ) {
        mdp_log("Thread " + threadid + " was deleted. Retrieving...");
        nextSibling.before(mdp_placeholder(threadid));
        $("#deletedpost_" + threadid + " span.smallcopy").css('color', '#f99');

        mdp_getcontent(threadid);
    }
    function mdp_placeholder(threadid) {
        return '<div class="deletedpost copy post" id="deletedpost_' + threadid + '">' +
            '<span class="smallcopy">' +
            'Getting deleted thread: <a href="/' + threadid + '/">' + threadid + '</a>' +
            '</span></div><br>';
    }
    function mdp_getcontent(threadid) {
        $.get('/' + threadid + '/', function(data, textStatus) {
            mdp_log("Got data for " + threadid + ": " + data.length + " bytes");

            var [title, stamp] = mdp_deletedpost_title_and_stamp(data);
            mdp_log("Got title:", title);
            mdp_log("Got stamp:", stamp);

            // Get the post content
            var post = mdp_clean_post_text(data);
            mdp_log("Got post text:",post);

            // Get the footer
            var foot = $(data).find('.postbyline').html().split('[')[0];
            mdp_log("Got foot text: '" + foot + "'");

            var reason = $(data).find('p.reason').html();
            mdp_log("Got reason text: '" + reason + "'");

            var content = {
                'title':   title,
                'content': post,
                'foot':    foot,
                'url':     '/' + threadid + '/',
                'stamp':   stamp,
                'reason':  reason,
            };

            // Show it
            mdp_replace(threadid, content);

            // Cache it
            var contentSrc = "";
            if (content.toSource)
                contentSrc = content.toSource();
            else if (JSON && JSON.stringify)
                contentSrc = JSON.stringify(content);
            else
                return;

            mdp_setValue('content_' + document.domain + '_' + threadid, contentSrc);
        }, "html");
    }
    function mdp_deletedpost_title_and_stamp(data) {
        var post = $(data).find('.post');
        var title = $(data).find(".posttitle").html().split('<br>')[0];
        var stamp = $(data).find(".posttitle").html().split('<br>')[1];
        stamp = $(stamp).find('span').text();
        return [title,stamp];
    }
    function mdp_clean_post_text(data) {
        var post = $(data).find(".copy");
        $(post).remove('.postbyline').find('span').remove();
        $(post).find('br').remove();
        if ($('.miseparator')) {
            $(post).find('.miseperator')
                .replaceWith('<span class="smallcopy">' +
                             '[<a href="/' + threadid + '/">more inside</a>]' +
                             '</span><br>');
        }
        return $(post).html();
    }
    /*
     * mdp_replace
     *
     * Given a thread id and a content hash, replaces the content of the deleted
     * post empty div with the "right" stuff.
     */
    function mdp_replace(threadid, content) {
        // Make the footer look a little more like the normal page
        footer = content.foot + " at " + content.stamp;
        mdp_log("footer:", footer);
        if (content.foot.match(/ \((\d* (comments?|answers?)) total\)/)) {
            content.foot = content.foot.replace(
                / \(\d* (comments?|answers?) total\)[\s\S]*/,
                ' at ' + content.stamp + ' - ' +
                '<a href="' + content.url + '">' +
                RegExp.$1 + '</a>'
            );
        }

        // Build the post and insert it into the dom
        var postcontent = '<div class="deletedpost_show">' + content.content +
            '<span class="smallcopy">' + footer + '</span>' +
            '<br><br>' +
            '<span class="smallcopy">' + content.reason + '</span></div>' +
            '<div class="deletedpost_hide">Deleted thread: <a href="' + content.url + '">' + threadid + '</a></div>';

        var titleline = mdp_deletedpost_title(content);

        $("#deletedpost_" + threadid)
            .empty().append(titleline)
            .append(postcontent)
            .css( {
            background: 'transparent url(' + deletedbar + ') repeat-y left',
            color: '#f99',
            padding: '0.5em 0.5em 0.5em 1em'
        } )
            .find("span.smallcopy").css('color', '#f99');

        // Add the hide button
        $("#deletedpost_" + threadid)
            .append('<div class="smallcopy hidebutton">Hide</div>')
            .hover(
            function() {
                var t = $(this);
                var b = $(this).children('.hidebutton');
                var hidey = t.offset().top - 5;
                var hidex = t.offset().left - b.width() - 9;
                b.show().css({
                    'left': hidex + 'px',
                    'top': hidey + 'px',
                    'height': (t.height() - 10) + 'px'
                });
            },
            function() {
                $(this).children('.hidebutton').hide();
            }
        )
            .children('.hidebutton')
            .css({
            'color': '#ccc',
            'position': 'absolute',
            'font-size': '80%',
            'padding': '5px',
            'cursor': 'pointer'
        })
            .hide()
            .click( function() {
            $(".deletedpost").each( function() {
                $(this).children('.deletedpost_posttitle').toggle();
                $(this).children('.deletedpost_show').toggle();
                $(this).children('.deletedpost_hide').toggle();
                if ($(this).children('.hidebutton').html() == "Hide") {
                    $(this).children('.hidebutton').hide().html("Show");
                    mdp_setValue("hideall", 1);
                } else {
                    $(this).children('.hidebutton').hide().html("Hide");
                    mdp_setValue("hideall", 0);
                }
            } );
        });

        // Show or hide?
        var hide = mdp_getValue("hideall");
        if (hide) {
            $("#deletedpost_" + threadid + ' .deletedpost_posttitle').hide();
            $("#deletedpost_" + threadid + ' .deletedpost_show').hide();
            $("#deletedpost_" + threadid + ' .hidebutton').html("Show");
        } else {
            $("#deletedpost_" + threadid + ' .deletedpost_hide').hide();
        }
    }
    function mdp_deletedpost_title(content) {
        return '<a href="'+content.url+'" class="deletedpost_posttitle" style="text-decoration: none">' +
            '<h2 class="front" style="margin-left: 0;' +
            'margin-top: 0; font-family: Arial,sans-serif!important; color: #f99;">' +
            content.title +
            '</h2></a>';
        // $('h2', {
        //     class: 'deletedpost_posttitle front',
        //     style: "margin-left: 0; margin-top: 0; font-family: Arial,sans-serif!important;",
        //     html:  content.title
        // });
    }
    function mdp_log(...t) {
        if(debug)
            console.log.apply("MDP:",t);
    }
    /*
     * get/set helper functions
     */
    function mdp_getValue(key) {
        if (unsafeWindow.localStorage) {
            return unsafeWindow.localStorage["mdp_" + key];
        } else if (GM_getValue) {
            return GM_getValue("mdp_" + key);
        } else {
            // TODO - Retrieve a cookie
        }
    }
    function mdp_setValue(key, value) {
        if (unsafeWindow.localStorage) {
            unsafeWindow.localStorage["mdp_" + key] = value;
        } else if (GM_setValue) {
            GM_setValue("mdp_" + key, value);
        } else {
            // TODO - Write a cookie
        }
    }
})();