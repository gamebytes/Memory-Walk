define(function() {

	var Utils = {}, App, $, G5;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Utils.initialize = function() {

		App = require("app");
		$ = App.$;
		G5 = App.G5;

		$(window).on("resize", function() {
			var $dialog = $("#dialog:visible");

			if ($dialog.length) {
				$dialog.css({
					left: ($(window).width() >> 1) - ($dialog.width() >> 1),
					top: ($(window).height() >> 1) - ($dialog.height() >> 1)
				});
			}
		});

		$("body").on("click", ".button-dialog-cancel", function() {
			$("#dialog, #modal").hide();
		});

		$("body").on("click", ".button-dialog-ok", function() {
			Utils.dialog.callback();
			$("#dialog, #modal").hide();
		});
	};

	/* ========================== */
	/* ====== LOCALSTORAGE ====== */
	/* ========================== */

	Utils.localStorage = function(key, value, encrypted) {
		if (key !== undefined && value !== undefined) {
			// Phonegap hack ?
			window.localStorage.removeItem(key);
			window.localStorage.setItem(key, JSON.stringify(value));
		} else if (key !== undefined) {
			return JSON.parse(window.localStorage.getItem(key));
		}
	};


	/* ==================== */
	/* ====== DIALOG ====== */
	/* ==================== */

	Utils.dialog = function() {

	};


	/* ==================== */
	/* ====== PROMPT ====== */
	/* ==================== */

	Utils.prompt = function(title, description, defaultValue, callback) {

		var $dialog = $("#dialog"),
			$modal = $("#modal"),
			$description = $("<div class='description'>" + description + "</div>"),
		    $input = $("<input type='text' class='input-dialog input-dialog-prompt' value='" + defaultValue + "'>"),
		    $btn_container = $("<div class='button-dialog-container'>"),
		    $btn_ok = $("<a class='button-small button-dialog button-dialog-ok'>Ok</a>"),
		    $btn_cancel = $("<a class='button-small button-dialog button-dialog-cancel'>Cancel</a>");

		$btn_container.append($btn_ok, $btn_cancel);

		if (!$dialog.length) {
			$dialog = $("<div id='dialog'>");
			$dialog.append("<div class='title'>", "<div class='content'>");
			$("body").append($dialog);
		}

		if (!$modal.length) {
			$modal = $("<div id='modal'>");
			$("body").append($modal);
		}

		$dialog.find(".title").html(title);
		$dialog.find(".content").html("").append($description, $input, $btn_container);

		$modal.show();
		$dialog.css({ visibility: "hidden" }).show();
		$dialog.css({
			left: ($(window).width() >> 1) - ($dialog.width() >> 1),
			top: ($(window).height() >> 1) - ($dialog.height() >> 1),
			visibility: "visible" 
		});

		Utils.dialog.callback = function() {
			callback($input.val());
		};

		$input.focus();
	};

	/* ========================== */
	/* ====== DRAW PATTERN ====== */
	/* ========================== */

	Utils.drawPattern = (function() {

		var

		rotate = function(ctx, cx, cy, deg) {
			ctx.translate(cx, cy);
			ctx.rotate(G5.DEG2RAD*deg);
			ctx.translate(-cx, -cy);
		},

		draw = function(ctx, pattern, x, y, s, rot) {
			ctx.save();
			ctx.translate(x, y);
			if (rot) { rotate(ctx, s >> 1, s >> 1, rot); }
			ctx.drawImage(App.Images[pattern], 0, 0, s, s);
			ctx.restore();
		};

		return draw;
	}());

	/* ==================== */
	/* ====== NATIVE ====== */
	/* ==================== */

	String.prototype.capitalize = function() {
		return this.substr(0, 1).toUpperCase() + this.substr(1);
	};

	return Utils;
});;