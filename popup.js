var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-38467412-3']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


// when the document is ready, check for data
document.addEventListener('DOMContentLoaded', function () {
	// ...query for the active tab...
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function (tabs) {
		// ...and send a request for the DOM info...
		chrome.tabs.sendMessage(
			tabs[0].id,
			{subject: 'get_data'});
	});
});

// if we get a response, display the info
chrome.extension.onMessage.addListener(function (msg, call) {

	if ( msg.wp_version ) {
		document.getElementById('wp_version').textContent = msg.wp_version;
	}

	if ( msg.theme_details ) {
		var style_css = msg.theme_details;
		var splits = style_css.split("\n");
		var author_name,
			theme_name,
			version,
			info = {};

		for ( var line in splits) {
			var pattern = new RegExp("version", "i"),
				match_version = pattern.test(splits[line]);

			if (match_version) {
				version = splits[line].split(':');
				document.getElementById('theme_version').textContent = version[1];
				continue;
			}

			var theme_pattern = new RegExp("theme name", "i"),
				match_theme_name = theme_pattern.test(splits[line]);

			if (match_theme_name) {
				theme_name = splits[line].split(':');
				info.theme_name = theme_name[1];

				document.getElementById('theme_name').textContent = theme_name[1];
				continue;
			}

			var author_pattern = new RegExp("author:", "i"),
				match_author_name = author_pattern.test(splits[line]);

			if (match_author_name) {
				author_name = splits[line].split(':');
				document.getElementById('author_name').textContent = author_name[1];
				continue;
			}

			var author_uri_pattern = new RegExp("author uri", "i"),
				match_author_uri = author_uri_pattern.test(splits[line]);

			if (match_author_uri) {
				var author_uri = splits[line].split(':', 3),
					this_author = document.getElementById("author_name"),
					this_link = document.createElement('a');

				author_uri = author_uri[1].replace(" ", '') + ":" + author_uri[2];
				this_link.innerHTML = this_author.innerHTML;

				this_author.addEventListener('click', function (e) {
					chrome.tabs.create({url: author_uri});
					window.close();
				}, false);
			}
		}
	}
});