
const target = '.pane.left .ember-view.btn.organization-pill:visible';
const addon = '#juniper-addon:visible';
const api_url = "https://junipereducation.zendesk.com/api/v2/search.json?&page=1&query=#### type:organization&sort_order=desc&sort_by=created_at";


$( document ).ready(function() {

    //observe for a url change. ie; user has switched to another organisations record.
    let previousUrl = '';
    const observer = new MutationObserver(function(mutations) {
      if (location.href !== previousUrl) { //url has changed, wait intil the element is created
          previousUrl = location.href;
          console.log(`URL changed to ${location.href}`);
          waitForEl(target, handleParsing, 5, 300); 
        }
    });
    const config = {subtree: true, childList: true};
    observer.observe(document, config);
    
});


//wait until the element is created or timeout after 1.5 seconds
function waitForEl(selector, callback, maxtries = false, interval = 100) {
  const poller = setInterval(() => {
    const el = jQuery(selector)
    const retry = maxtries === false || maxtries-- > 0
    if (retry && el.length < 1) return
    clearInterval(poller)
    callback(el || null)
  }, interval)
}



function handleParsing() {
    console.log("running url parser")
    if ($(target).length == 1 && $(addon).length == 0) { //check to make sure the target element exists and we havent already added the addon
        console.log("found target but no addon");

        let content = $(target).text(); //grab the text that contains the organisation ID

        //return if no content found or content doesn't have organisation ID
        if (content === undefined || !content.includes("#")) return;

        let organisation_id = content.match(/#(\d+)/)[1]; //use regex to get the organisation ID in num format
        
        if (organisation_id === undefined) return; //check we got org ID 

        let url = api_url.replace("####",organisation_id); //create the url needed to get the website URL

        $.get(url, function( organisation ) { //send the get request to zendesks api (lucky we have access to this search api)
          console.log(organisation);  
          if (organisation["results"][0]["organization_fields"].website_url) { //make sure the org has a website
              
              //hacky way to bypass cors and get the html of the site to retrieve the secure login link
              $.getJSON('https://api.allorigins.win/get?url=' + encodeURIComponent(organisation["results"][0]["organization_fields"].website_url), function (data) {
                  var elements = data.contents;
                  var found = $('a[href*=".secure-primarysite.net/"]', elements); //create an "element" with the html response and grab the secure link
                  console.log(found[0].href);
                  
                  //get the url's to build the widget
                  let live_url = organisation["results"][0]["organization_fields"].website_url;
                  let secure_url = found[0].href;
                  let stage_url = found[0].href.replace("secure-","stage-");
                  createWidget(stage_url, secure_url, live_url);
              });
          }
        });
    }
}



//create a simple widget and inject it into zendesk
function createWidget(stage, secure, live) {
    const container = $('.ember-view > .app_container:visible');
    container.prepend('<div id="juniper-addon"></div>'); //create the initial container for the links
    $(addon).append('<a class="helper" href="' + secure + '" target="_blank" style=""> secure link</a>');
    $(addon).append('<a class="helper" href="' + stage + '" target="_blank" style=""> stage link</a>');
    $(addon).append('<a class="helper" href="' + live + '" target="_blank" style=""> live link</a>');
    
    $("#juniper-addon .helper").css("display","block");
    $("#juniper-addon .helper").css("margin","5px");
    $("#juniper-addon .helper").css("background","green");
    $("#juniper-addon .helper").css("border-radius","25px");
    $("#juniper-addon .helper").css("padding","8px");
    $("#juniper-addon .helper").css("font-weight","900");
    $("#juniper-addon .helper").css("color","white");
    $("#juniper-addon .helper").css("width","100px");
    $("#juniper-addon .helper").css("text-align","center");
}

