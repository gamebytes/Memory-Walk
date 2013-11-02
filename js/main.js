require.config({

	baseUrl: "js",

	shim: {

		"canvg": {
			exports: "canvg",
			deps: [
				"libs/canvg/rgbcolor",
				"libs/canvg/StackBlur"
			]
		},

		"underscore": { exports: "_" }
		// "threejs": { exports: "THREE" },
		//"jquery-transit": ["jquery"]
	},

	paths: {

		"G5": "libs/g5",
		"jquery": "libs/jquery",
		"underscore": "libs/underscore",
		"fastclick": "libs/fastclick",
		"canvg": "libs/canvg/canvg",
		"toDataURL": "plugins/toDataURL"

		// "threejs": "libs/three",
		// "templates": "../templates",
		
		// Plugins
		// "text": "plugins/text",
		//"jquery-transit": "plugins/jquery.transit"
	},

	// urlArgs: "t=" + new Date().getTime(),
	waitSeconds: 15
});

require(["app"], function(App) {

	if (App.isPhoneGap) {
		require(["libs/cordova"], function() {
			document.addEventListener("deviceready", App.initialize);
		});

		return;
	}

	App.initialize();
});