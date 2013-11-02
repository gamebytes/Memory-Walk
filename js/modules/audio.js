define([
	"jquery",
	"G5"
], function($, G5, Audio) {

	var Audio = {

		initOrder: 1,

	}, App;

	Audio.bgm = [
		"audio/bgm/paniq - Lovelorn.ogg",
		"audio/bgm/paniq - Mechanics of Love.ogg",
		"audio/bgm/paniq - Animagenry.ogg"
	];

	Audio.sfx = [
		"audio/sfx/intro.ogg",
		"audio/sfx/step.ogg",
		"audio/sfx/flash.ogg",
		"audio/sfx/select.ogg",
		"audio/sfx/teleport.ogg",
		"audio/sfx/wrong.ogg",
		"audio/sfx/levelComplete01.ogg",
		"audio/sfx/levelComplete02.ogg",
		"audio/sfx/partComplete01.ogg",
		"audio/sfx/partComplete02.ogg",
		"audio/sfx/click.ogg"
	];

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Audio.initialize = function() {
		
		App = require("app");

		if (App.isPhoneGap) {

			window.Media.prototype._play = window.Media.prototype.play;
			window.Media.prototype.play = function() {
				if (!App.settings["sound-effects"]) { return; }
				// this.stop();
				// this.seekTo(0);
				this._play();
			};

		} else {

			window.Audio.prototype._play = window.Audio.prototype.play;
			window.Audio.prototype.play = function() {
				if (!App.settings["sound-effects"]) { return; }
				this.pause();
				try { this.currentTime = 0; } catch(e) {}
				this._play();
			};
		}

		var filename;

		// Initialize sfx
		Audio.sfx.forEach(function(v) {
			filename = v.match(/[^\/]*(?=\.[^.]+($|\?))/)[0];
			Audio.sfx[filename] = new (App.isPhoneGap ? Media : G5.Audio)(App.baseDir + v);
		});

		// Initialize bgm
		Audio.bgm.forEach(function(v) {
			filename = v.match(/[^\/]*(?=\.[^.]+($|\?))/)[0];

			if (App.isPhoneGap) {
				Audio.bgm[filename] = new Media(App.baseDir + v, function() {

					this.setVolume(0.5);

				}, null, function(status) {

					if (status == 4) { Audio.cycleBGM(); }

				});
			} else {
				Audio.bgm[filename] = new G5.Audio(App.baseDir + v);
				Audio.bgm[filename].addEventListener("ended", Audio.cycleBGM);
				Audio.bgm[filename].volume = 0.5;
			}
		});
	};

	/* ====================== */
	/* ====== CYCLEBGM ====== */
	/* ====================== */

	Audio.cycleBGM = function() {
		var current = Audio.cycleBGM.current,
		    audio = Audio.bgm.map(function(v) { return v.match(/[^\/]*(?=\.[^.]+($|\?))/)[0]; }),
		    next = _.without(_.shuffle(audio), current)[0];
		
		Audio.cycleBGM.current = next;
		Audio.bgm[next].play();

		$("#song").html(next);
		$("#now_playing").fadeIn().delay(5000).fadeOut();
	};

	return Audio;
});