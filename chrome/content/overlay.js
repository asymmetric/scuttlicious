/**
 * del.icio.us post 0.4
 * Created by Patrick H. Lauke aka redux - http://www.splintered.co.uk - April 2005
 * scuttlicious
 * modified by Kai Mai - http://www.kai-mai.com - Oct 2005.
 * scuttlicious
 * created by asymmetric
 */


// global variables

var scuttlicious_post_url;
var scuttlicious_post_description;

// add listener to context menu popping up
function scuttlicious_post_init(e) {
    var menu = document.getElementById("contentAreaContextMenu");
    menu.addEventListener("popupshowing",scuttlicious_post_context,false);
    return;
}

// context menu popped up. check if the context is for a link or for the page
function scuttlicious_post_context(e) {
    if(gContextMenu.onLink) {
        document.getElementById("scuttlicious-post-context-page").hidden = true;
        document.getElementById("scuttlicious-post-context-link").hidden = false;
        var link =  gContextMenu.target
        scuttlicious_post_url = makeURLAbsolute(document.commandDispatcher.focusedWindow.document.location,link.getAttribute('href'));
        scuttlicious_post_description = gContextMenu.linkText();
    } else {
        document.getElementById("scuttlicious-post-context-page").hidden = false;
        document.getElementById("scuttlicious-post-context-link").hidden = true;
        // scuttlicious_post_url = window.content.document.URL;
        scuttlicious_post_url = window.content.document.location.href;
        scuttlicious_post_description = window.content.document.title;
    }
    return;
}

// toolbar button was clicked
function scuttlicious_post_toolbar() {
    scuttlicious_post_url = window.content.document.location.href;
    scuttlicious_post_description = window.content.document.title;
    scuttlicious_post_submit();
}

// actual function to open dialog, invoked by context menu items
function scuttlicious_post_submit() {
/*
    dump("scuttlicious_post_url " + scuttlicious_post_url);
    dump("\nscuttlicious_post_description " + scuttlicious_post_description);
    dump("\n");
    */
    window.openDialog("chrome://scuttlicious/content/dialogs/submit.xul", 'scuttlicious_submit', "centerscreen",scuttlicious_post_url,scuttlicious_post_description);
}

window.addEventListener("load", scuttlicious_post_init, false);
