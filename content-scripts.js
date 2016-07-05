var WordPressThemeChecker = (function() {

	function init() {
		//Check for indicators of WordPress use
		if (/<meta name="generator" content="WordPress [0-9\.]+/i.test(document.getElementsByTagName('head')[0].innerHTML)) {
			chrome.extension.sendMessage({'enable_popup': document.getElementsByTagName('head')[0].innerHTML.match(/<meta name="generator" content="WordPress ([0-9\.]+)/i)[1]});
		} else if ((/<link rel=["']stylesheet["'].*href=["'][a-z0-9\:\\\\\/\-_.~]*\/wp-content\//i.test(document.getElementsByTagName('head')[0].innerHTML))
			&& (!/<meta name="generator" content="WordPress\.com"/i.test(document.getElementsByTagName('head')[0].innerHTML))) {
			chrome.extension.sendMessage({'enable_popup': 'Unknown'});
		}

		// If the popup gets enabled by the background, we need to listen some commands
		listen_tabs();
	}

	// wait for commands
	function listen_tabs() {
		chrome.runtime.onMessage.addListener(function (msg, call) {
			// First, validate the message's structure
			if ( msg.subject == "get_data" ) {
				get_data();
			}
		});
	}

	function get_data() {
		// check if this document has a wp theme
		var style_path = false,
			links = document.querySelectorAll("link[href*='/themes/']");

		if (links.length > 0) {
			var style_element = links[0],
				style_href = style_element.getAttribute('href');

			style_path = get_theme_style_css(style_href);
		}

		if (style_path === false) {
			var scripts = document.querySelectorAll("script[src*='/themes/']");

			if (scripts.length > 0) {
				var style_element = scripts[0],
					style_href = style_element.getAttribute('src');

				style_path = get_theme_style_css(style_href);
			}
		}
		if (style_path !== false) {
			xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", style_path, true);
			xmlhttp.setRequestHeader("Cache-Control", "max-age=0");
			xmlhttp.onreadystatechange = function (ev) {
				if (xmlhttp.readyState === 4) {
					if (xmlhttp.status === 200) {
						var comments = xmlhttp.responseText.match(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm);
						comments.forEach(function ( line, count) {
							if ( line.indexOf('Theme Name') !== -1 ) {
								chrome.extension.sendMessage({'theme_details': line}, function (res) {});
							}
							return false;
						});
					}
				}
			};
			xmlhttp.send();
		}

		if (/<meta name="generator" content="WordPress [0-9\.]+/i.test(document.getElementsByTagName('head')[0].innerHTML)) {
			chrome.extension.sendMessage({'wp_version': document.getElementsByTagName('head')[0].innerHTML.match(/<meta name="generator" content="WordPress ([0-9\.]+)/i)[1]});
		}
	}

	var get_theme_style_css = function (href) {

		var theme_name = '';
		if (typeof href !== 'undefined') {

			var splits = href.split('wp-content/themes/');

			if (splits.length > 1) {
				theme_name = splits[1];
				theme_name = theme_name.split('/');
				theme_name = theme_name[0];
			}

			if (typeof theme_name !== 'undefined') {
				return splits[0] + 'wp-content/themes/' + theme_name + '/style.css';
			}

			return false;
		}
	};

	return {
		init: init
	}
})();

WordPressThemeChecker.init();

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number|NaN}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer iff v1 < v2</li>
 *    <li>a positive integer iff v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
function versionCompare(v1, v2, options) {
	var lexicographical = options && options.lexicographical,
		zeroExtend = options && options.zeroExtend,
		v1parts = v1.split('.'),
		v2parts = v2.split('.');

	function isValidPart(x) {
		return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
	}

	if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
		return NaN;
	}

	if (zeroExtend) {
		while (v1parts.length < v2parts.length) v1parts.push("0");
		while (v2parts.length < v1parts.length) v2parts.push("0");
	}

	if (!lexicographical) {
		v1parts = v1parts.map(Number);
		v2parts = v2parts.map(Number);
	}

	for (var i = 0; i < v1parts.length; ++i) {
		if (v2parts.length == i) {
			return 1;
		}

		if (v1parts[i] == v2parts[i]) {
			continue;
		}
		else if (v1parts[i] > v2parts[i]) {
			return 1;
		}
		else {
			return -1;
		}
	}

	if (v1parts.length != v2parts.length) {
		return -1;
	}

	return 0;
}