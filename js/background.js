browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch(request.method) {

    case 'bn_gbifID':
      browser.tabs.query({active : true, currentWindow : true}, (tabs) => {
        fetch("https://api.bionomia.net/occurrence/" + request.params.gbifID + ".jsonld")
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            browser.tabs.sendMessage(tabs[0].id, { method : "bn_occurrence", params : { data: data } });
            sendResponse();
          })
          .catch((error) => {
            browser.tabs.sendMessage(tabs[0].id, { method : "bn_occurrence", params : { data: { message: "error"} } });
            sendResponse();
          });
      });
    break;

    default:
      sendResponse({});
  }
  return true;
});

browser.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  browser.tabs.sendMessage(details.tabId, { method : "bn_flush" });
});
