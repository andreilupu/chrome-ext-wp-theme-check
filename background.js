chrome.runtime.onMessage.addListener(function (msg, sender) {
	// First, validate the message's structure
	if ( msg.enable_popup ) {
		// Enable the page-action for the requesting tab
		chrome.pageAction.show(sender.tab.id);

		// add the icon
		chrome.pageAction.setIcon({path: "pixelgrade_btn.png", tabId: sender.tab.id});

		// enable the popup
		chrome.pageAction.setPopup({tabId: sender.tab.id, popup: "popup.html"});
	}
});
