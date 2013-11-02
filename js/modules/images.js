define([
	"jquery",
	"G5",
	"canvg"
], function($, G5, canvg) {

	var Images = {

		initOrder: 1,

		svg: [
			"img/svg/arrow.svg",
			"img/svg/flash.svg",
			"img/svg/overlap.svg",
			"img/svg/checkpoint.svg",
			"img/svg/checkpoint_active.svg",
			"img/svg/teleport.svg",
			"img/svg/bridge_horizontal.svg",
			"img/svg/bridge_vertical.svg"
		],

		SVGSupport: false, // G5.Support.svg()

		// Optimal Tile Resolution
		OTR: Math.min(
			window.screen.width,
			window.screen.height
		) / 7

	}, App, bfr = new G5.Buffer(Images.OTR, Images.OTR);

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Images.initialize = function() {

		App = require("app");

		var fileName = "",
		    cache = App.Utils.localStorage("cache");

		Images.svg.forEach(function(v) {

			fileName = v.match(/([^\/]+)(?=\.\w+$)/)[0];

			if (Images.SVGSupport) { Images[fileName] = new G5.Image(App.baseDir+v); }

			else {

				if (cache[v]) { Images[fileName] = new G5.Image(cache[v]); return true; }

				$.ajax({
					type: "GET",
					url: App.baseDir+v,
					async: false,

					success: function(data) {
						bfr.clearRect(0, 0, bfr.canvas.width, bfr.canvas.height);
						bfr.drawSvg(data, 0, 0, bfr.canvas.width, bfr.canvas.height);

						cache = App.Utils.localStorage("cache");
						cache[v] = bfr.canvas.toDataURL();
						App.Utils.localStorage("cache", cache);

						Images[fileName] = new G5.Image(cache[v]);
					}
				});
			}
		});
	};

	return Images;
});;