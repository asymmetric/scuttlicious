// del.icio.us post 0.4
// Created by Patrick H. Lauke aka redux - http://www.splintered.co.uk - April 2005
// scuttlicious
// modified by Kai Mai - http://www.kai-mai.com - Oct 2005.

// global variables

var scuttlicious_post_stringbundle;

var scuttlicious_chrome_url = "chrome://scuttlicious/";

const scuttlicious_preferences = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");

function scuttlicious_post_dialog_init() {

    var username='';
    var password='';


    try {
        if (scuttlicious_preferences.prefHasUserValue('scuttlicious.post.username')) {
            username=scuttlicious_preferences.getCharPref('scuttlicious.post.username');
            if (scuttlicious_preferences.getBoolPref('scuttlicious.post.use_password_manager')==true) {
                password = scuttlicious_getPassword(username);
                document.getElementById('scuttlicious-post-dialog-password').setAttribute('value',password);
                document.getElementById('scuttlicious-post-dialog-use_password_manager').setAttribute('checked',true);
            }
        }
    } catch (ex) {
        scuttlicious_preferences.setBoolPref('scuttlicious.post.use_password_manager',false);
    }


    var description=window.arguments[1]; // this is passed to the dialog by the scuttlicious_post_submit() function in context.js
    var url=window.arguments[0];
    /*
    dump("scuttlicious_ post_url " + url);
    dump("\nscuttlicious_ post_description " + description);
    dump("\n");
    */

    // set the values in the dialog
    document.getElementById('scuttlicious-post-dialog-username').setAttribute('value',username);

    document.getElementById('scuttlicious-post-dialog-url').setAttribute('value',url);
    document.getElementById('scuttlicious-post-dialog-description').setAttribute('value',description);

    scuttlicious_loadPrivacyPref();
    scuttlicious_autofillServiceURL();
}

function scuttlicious_loadPrivacyPref(){
    var privacy = -1;

    try{
        privacy = scuttlicious_preferences.getIntPref("scuttlicious_privacy_preference");
        dump("stored privacy value scuttlicious_loadPrivacyPref: " + privacy + "\n");
    }catch(e){
        dump("exception in scuttlicious_loadPrivacyPref: " + e + "\n");
        privacy = -1;
    }
    document.getElementById('scuttlicious-privacy-preference').selectedIndex = privacy;
    document.getElementById('scuttlicious-privacy-code').selectedIndex = privacy;
}


function scuttlicious_get_privacy_level(privacyGroup){
    var selectedPrivacy = privacyGroup.selectedIndex;

//  dump("selectedPrivacy " + selectedPrivacy + "\n");

    return selectedPrivacy;

    /*
    if(!selectedPrivacy)
        return 0;
    //dump("selectedPrivacy.id: " + selectedPrivacy.id + "\n");
    if(selectedPrivacy.id == 'scuttlicious-privacy-code-watched_list')
        return 1;
    if(selectedPrivacy.id == 'scuttlicious-privacy-code-private')
        return 2;

    return 0;
            */
}

function scuttlicious_post_dialog_accept() {
    // general stuff
    //var api_url='http://del.icio.us/api/';
    //var api_url='http://scuttle.org/api/';

    var bundle=document.getElementById('scuttlicious-post-stringbundle');

    // get values entered in the form
    var username=encodeURIComponent(document.getElementById('scuttlicious-post-dialog-username').value);
    var password=encodeURIComponent(document.getElementById('scuttlicious-post-dialog-password').value);
    var url=encodeURIComponent(document.getElementById('scuttlicious-post-dialog-url').value);
    var description=encodeURIComponent(document.getElementById('scuttlicious-post-dialog-description').value);
    var extended=encodeURIComponent(document.getElementById('scuttlicious-post-dialog-extended').value);

    var tags=document.getElementById('scuttlicious-post-dialog-tags').value;
    // on the web interface, users use "," as the delimeter, but for the API, the delimeter is " "
    tags = tags.replace(/,/g," ");
//  dump(tags + "\n");

    tags = encodeURIComponent(tags);

    var service_url=document.getElementById('scuttlicious-post-dialog-service-url').value;
//  dump(service_url + "\n");


    service_url = encodeURI(service_url);
//  dump(service_url + "\n");



    // handle the login saving stuff first
    const preferencesService = scuttlicious_preferences;

    preferencesService.setCharPref('scuttlicious.post.username',username);
    preferencesService.setCharPref('scuttlicious_host', service_url);
    preferencesService.setIntPref('scuttlicious_privacy_preference', scuttlicious_get_privacy_level(document.getElementById('scuttlicious-privacy-preference')));

    var api_dir = "api";
    var base_api_url = scuttlicious_getServiceURL() + "/" + api_dir;
    var api_url = base_api_url + "/posts_add.php?";

    if (document.getElementById('scuttlicious-post-dialog-use_password_manager').checked==true) {
        scuttlicious_savePassword(username,password,true);
        preferencesService.setBoolPref('scuttlicious.post.use_password_manager',true);
    } else {
        scuttlicious_savePassword(username,'',false);
        preferencesService.setBoolPref('scuttlicious.post.use_password_manager',false);
    }

    // minimal sanity check
    if ((username=='')||(password=='')) {
        alert(bundle.getString('supplylogin'));
        document.getElementById('scuttlicious-post-dialog-tabbox').selectedIndex=1;
        return false;
    } else {

        // temporarily disable accept/cancel buttons and show the progressmeter deck (so user knows something's happening)
        document.getElementById('scuttlicious-post-dialog-deck').selectedIndex=1;

        document.getElementById('scuttlicious-post-dialog').setAttribute('wait-cursor',true);
        document.getElementById('delicios-post-dialog-accept').disabled=true;
        document.getElementById('delicios-post-dialog-cancel').disabled=false;

        // work out the correct ISO datestamp (no need for timezone offset, we're using UTC throughout)
        var d = new Date();
        var isodatestamp = scuttlicious_post_pad0(d.getUTCFullYear(),4)+'-'+scuttlicious_post_pad0((d.getUTCMonth()+1),2)+'-'+scuttlicious_post_pad0(d.getUTCDate(),2)+'T'+scuttlicious_post_pad0(d.getUTCHours(),2)+':'+scuttlicious_post_pad0(d.getUTCMinutes(),2)+':'+scuttlicious_post_pad0(d.getUTCSeconds(),2)+'Z';
        // clean up - destroy created instance (necessary?)
        delete d;
        // build the entire query string
        //var querystring = api_url+'posts/add?url='+url+'&description='+description+'&extended='+extended+'&tags='+tags+'&dt='+isodatestamp;
        //var querystring = api_url+'posts_add.php?url='+url+'&description='+description+'&extended='+extended+'&tags='+tags+'&dt='+isodatestamp;
        var privacy = scuttlicious_get_privacy_level(document.getElementById('scuttlicious-privacy-code'));

        if(privacy<0)
            privacy = 0;

        var querystring = api_url+'url='+url+'&description='+description+'&extended='+extended+'&tags='+tags+'&status='+privacy;

        dump("\n");
        dump(querystring);
        dump("\n");

        // start a new XMLHttpRequest
        var xmlhttp = new XMLHttpRequest();
        var status = false;

        // open the connection as synchronous, sending username/password as part of the HTTPAuth
        xmlhttp.open("GET",querystring,false,username,password);

        try {
            xmlhttp.send(null);
        } catch(e) {
            alert(bundle.getString('statusconnectionerror') + "\n" +
            //bundle.getString('status_access_url') + "  " + base_api_url + "\n" +
            bundle.getString('status_xml_url')  + "  " + api_url);
            scuttlicious_reset_dialog();
            return false;
        }


        try {
            dump("xmlhttp.status is " + xmlhttp.status + "\n");
            dump("xmlhttp.responseXML is " + xmlhttp.responseXML + "\n");

            switch(xmlhttp.status) {
                case 503:
                    alert(bundle.getString('statusthrottled'));
                    break;
                case 401:
                case 403:
                    alert(bundle.getString('statusauthenticationfailed'));
                    break;
                case 200:
                    status=true;
                default:
                    if(!scuttlicious_isAddBookmarkSuccessful(xmlhttp)){
                        alert(bundle.getString("statusadderror"));
                        status=false;
                    }
                    break;
            }
        } catch (e) {
            alert(bundle.getString('statusconnectionerror') + "\n" +
                //bundle.getString('status_access_url') + "  " + base_api_url + "\n" +
                bundle.getString('status_xml_url')  + "  " + api_url);
                status = false;

        }
        scuttlicious_reset_dialog();

        return status;

    }


}


function scuttlicious_autofillPassword(username) {
    if (document.getElementById('scuttlicious-post-dialog-use_password_manager').checked==true) {
        password = scuttlicious_getPassword(username);
        document.getElementById('scuttlicious-post-dialog-password').setAttribute('value',password);
    }
}

// helper function to pad numbers to required length (http://www.propix.hu/www/Clock/Clock.html)
function scuttlicious_post_pad0(string, newlength) {
  var pad = '';
  var len = newlength-String(string).length;
  var i;
  for (i = 0; i<len; i++) {
    pad += '0';
  }
  return pad+string;
}

function scuttlicious_savePassword(username,password,save) {
    var url = scuttlicious_chrome_url;

    if ("@mozilla.org/passwordmanager;1" in Components.classes) {
        var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"].createInstance();
        if (passwordManager) {
            passwordManager = passwordManager.QueryInterface(Components.interfaces.nsIPasswordManager);
            if (save) {
                try{
                    passwordManager.addUser(url, username, password);
                    } catch (e) { }
            } else {
                try{
                    passwordManager.removeUser(url, username);
                } catch (e) { }
            }
        }
    }
    else if ("@mozilla.org/login-manager;1" in Components.classes) {
        var passwordManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init");

        if (passwordManager) {
            if (save) {
                try{
                    // Find users for this extension
                    var logins = passwordManager.findLogins({}, url, url, null);
                    // remove the older one
                    for (var i = 0; i < logins.length; i++) {
                        if (logins[i].username == username) {
                            passwordManager.removeLogin(logins[i]);
                            break;
                        }
                    }
                    // Add the new login info
                    var authLoginInfo = new nsLoginInfo(url, url, null, username, password, "", "");
                    passwordManager.addLogin(authLoginInfo);
                } catch (e) { }
            } else {
                try{
                    // Find users for this extension
                    var logins = passwordManager.findLogins({}, url, url, null);

                    for (var i = 0; i < logins.length; i++) {
                        if (logins[i].username == username) {
                            passwordManager.removeLogin(logins[i]);
                            break;
                        }
                    }

                } catch (e) { }
            }
        }
    }
}

function scuttlicious_getPassword(username) {
  var url = scuttlicious_chrome_url;
  if ("@mozilla.org/passwordmanager;1" in Components.classes) {
      // Password Manager exists so this is not Firefox 3 (could be Firefox 2, Netscape, SeaMonkey, etc).
      var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"].createInstance(Components.interfaces.nsIPasswordManagerInternal);
      var host = {value:""};
      var user =  {value:""};
      var password = {value:""};
      passwordManager.findPasswordEntry(url, username, "", host, user, password);
      return password.value
  }
  else if ("@mozilla.org/login-manager;1" in Components.classes) {
      // Login Manager exists so this is Firefox 3
      var passwordManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
      var password = ""
      try {
          var logins = passwordManager.findLogins({}, url, url, null);

          for (var i = 0; i < logins.length; i++) {
              if (logins[i].username == username) {
                  password = logins[i].password;
                  break;
              }
          }
      } catch(e){ }
      return password;
  }

  return ""
}


function scuttlicious_autofillServiceURL() {
    var url = scuttlicious_getServiceURL();
    document.getElementById('scuttlicious-post-dialog-service-url').setAttribute('value',url);

}

function scuttlicious_getServiceURL() {
    var url = "http://www.scuttle.org/";
    if(scuttlicious_preferences.prefHasUserValue("scuttlicious_host"))
        url = decodeURI(scuttlicious_preferences.getCharPref("scuttlicious_host"));
    return url;
}

function scuttlicious_isAddBookmarkSuccessful(xmlhttp){
    var dom = xmlhttp.responseXML

    var entries = dom.getElementsByTagName("result");

    if(!entries)
        return false;

    var node = entries[0];

    if(!node)
        return false;

    var result = node.getAttribute("code");

    return result == "done";
}

function scuttlicious_reset_dialog(){
    document.getElementById('scuttlicious-post-dialog').removeAttribute('wait-cursor');
    document.getElementById('scuttlicious-post-dialog-deck').selectedIndex=0;
    document.getElementById('scuttlicious-post-dialog-progress').hidden=true;
    document.getElementById('delicios-post-dialog-accept').disabled=false;
    document.getElementById('delicios-post-dialog-cancel').disabled=false;

}
