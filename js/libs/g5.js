/*!
 G5-JS v.0.1.2 (https://github.com/elias94xx/G5-JS)
 Copyright 2012-2013 Elias Schütt <contact@elias-schuett.de>
 Open source under the MIT or CC-BY-SA license.
*/

/*jslint continue: true, eqeq: true, unparam: true, ass: true, es5: true, forin: true, nomen: true, plusplus: true, regexp: true, todo: true, white: true, passfail: false, browser: true, maxerr: 1000 */

;(function(window, undefined) {

	"use strict";

	var G5 = {},
	    API = {},

	    input = {
	    	key: {},
	    	mouse: {},
	    	callbacks: { down: [], up: [] }
	    },

	    display = [],
	    logic = [];


	/* ====================== */
	/* ====== G5.ready ====== */
	/* ====================== */

	G5.ready = API.ready = function(callback) {

		window.addEventListener("load", callback, false);
	};


	/* ===================== */
	/* ====== G5.loop ====== */
	/* ===================== */

	G5.loop = (function() {

		var delta = 1,
		    last = new Date().getTime(),
		    request_id = null,
		    timeout_id = null,
		    running = false;

		// window.requestAnimationFrame polyfill
		(function() {
			var lastTime = 0, vendors = ["ms", "moz", "webkit", "o"], x;

			for (x = 0; x < vendors.length && !window.requestAnimationFrame; x++) {
				window.requestAnimationFrame = window[vendors[x]+"RequestAnimationFrame"];
				window.cancelAnimationFrame = window[vendors[x]+"CancelAnimationFrame"] || window[vendors[x]+"CancelRequestAnimationFrame"];
			}

			if (!window.requestAnimationFrame) {
				window.requestAnimationFrame = function(callback) {
					var currTime = new Date().getTime(),
						timeToCall = Math.max(0, 16 - (currTime - lastTime)),
						id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);

					lastTime = currTime + timeToCall;
					return id;
				};
			}

			if (!window.cancelAnimationFrame)
			{ window.cancelAnimationFrame = function(id) { clearTimeout(id); }; }
		}());

		function request() {
			var i, ii, l, ll;
			request_id = window.requestAnimationFrame(request);

			for (i = 0, l = display.length; i < l; i++) {
				if (!display[i]) { continue; }
				
				for (ii = 0, ll = display[i].length; ii < ll; ii++) {
					display[i][ii]();
				}
			}
		}

		function timeout() {
			timeout_id = window.setTimeout(timeout, 1000/60);

			var current = new Date().getTime(), i, l;
			delta = current - last;
			delta = delta / (1000/60) > 2 ? 1 : delta / (1000/60);
			last = current;

			for (i = 0, l = logic.length; i < l; i++) {
				if (!logic[i]) { continue; }
				logic[i](delta);
			}
		}

		G5.start = API.start = function() {
			if (!running) {
				running = true;
				request_id = window.requestAnimationFrame(request);
				timeout_id = window.setTimeout(timeout, 1000/60);
			}
		};

		G5.stop = API.stop = function() {
			if (running) {
				window.cancelAnimationFrame(request_id);
				window.clearTimeout(timeout_id);
				running = false;
			}
		};

		G5.toggle = API.toggle = function() {
			running = !running;
			if (running) {
				request_id = window.requestAnimationFrame(request);
				timeout_id = window.setTimeout(timeout, 1000/60);
			} else {
				window.cancelAnimationFrame(request_id);
				window.clearTimeout(timeout_id);
			}

			return running;
		};

		G5.running = API.running = function() { return running; };

		G5.step = API.step = function(n) {
			var i, ii, l, ll;

			for (n = n || 1; n > 0; n--) {
				for (i = 0, l = display.length; i < l; i++) {
					if (!display[i]) { continue; }
					
					for (ii = 0, ll = display[i].length; ii < ll; ii++) {
						display[i][ii]();
					}
				}

				for (i = 0, l = logic.length; i < l; i++) {
					if (!logic[i]) { continue; }
					logic[i](delta);
				}
			}
		};

		G5.draw = API.draw = function(fn, zIndex) {
			zIndex = zIndex || 0;
			if (!display[zIndex]) { display[zIndex] = []; }

			display[zIndex].push(fn);
			return { type: "display", index: display[zIndex].length-1, zIndex: zIndex };
		};

		G5.update = API.update = function(fn) {
			logic.push(fn);
			return { type: "logic", index: logic.length-1 };
		};

		G5.detach = API.detach = function() {
			var i, l, ref;

			for (i = 0, l = arguments.length; i < l; i++) {
				ref = arguments[i];

				if (ref.type == "display") {
					display[ref.zIndex].splice(ref.index, 1);
				} else if (ref.type == "logic") {
					logic.splice(ref.index, 1);
				}
			}
		};
	}());


	/* ====================== */
	/* ====== G5.Scene ====== */
	/* ====================== */

	G5.Scene = API.Scene = function(w, h, context, opts) {

		if (this instanceof G5.Scene == false) { throw new Error("Object constructor cannot be called as a function"); }
		opts = typeof context == "object" ? context : opts || {};

		var canvas = document.createElement("canvas"),
		    parent = opts.parent || document.body,
		    context = canvas.getContext(context || "2d"),
		    webgl = canvas.getContext("experimental-webgl");

		canvas.width = w;
		canvas.height = h;

		if (webgl) { context.viewport(0, 0, canvas.width, canvas.height); }

		// Object.defineProperty(context, "zIndex", {
		// 	set: function(val) {
		// 		context.canvas.style.zIndex = val;
		// 	}
		// });

		parent.appendChild(canvas);
		return context;
	};


	/* ======================= */
	/* ====== G5.Buffer ====== */
	/* ======================= */

	G5.Buffer = API.Buffer = function(w, h, context) {

		if (this instanceof G5.Buffer == false) { throw new Error("Object constructor cannot be called as a function"); }

		var canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;

		return canvas.getContext(context || "2d");
	};


	/* ====================== */
	/* ====== G5.Image ====== */
	/* ====================== */

	G5.Image = API.Image = function(src, callback) {

		if (this instanceof G5.Image == false) { throw new Error("Object constructor cannot be called as a function"); }

		var img = new Image();
		img.src = src;

		if (typeof callback == "function") { img.src.addEventListener("load", callback, false); }

		return img;
	};


	/* ====================== */
	/* ====== G5.Audio ====== */
	/* ====================== */

	G5.Audio = API.Audio = function(src, callback) {

		if (this instanceof G5.Audio == false) { throw new Error("Object constructor cannot be called as a function"); }

		var audio = new Audio();
		audio.src = src;

		if (typeof callback == "function") { audio.src.addEventListener("loadedmetadata", callback, false); }

		return audio;
	};


	/* ======================= */
	/* ====== G5.Ticker ====== */
	/* ======================= */

	G5.Ticker = API.Ticker = function(fn, ms) {

		ms = ms || 1000;

		var callback = typeof fn == "function" ? fn : undefined,
		    running = false,
		    timeout_id,
		    timeout_calls,
		    time_start,
		    time_current,
		    instance;

		function timeout() {
			if (callback) { callback(timeout_calls); }

			if (timeout_calls !== undefined) {
				if (timeout_calls == 0) {
					running = false;
					timeout_calls = undefined;
					return;
				}

				timeout_calls--;
				if (timeout_calls == 0) { return; }
			}

			time_start = new Date().getTime();
			timeout_id = window.setTimeout(timeout, ms);
		}

		function start(n) {
			if (typeof n == "number") { timeout_calls = n; }
			else { timeout_calls = undefined; }

			running = true;
			time_start = time_current = new Date().getTime();
			timeout_id = window.setTimeout(timeout, ms);

			return instance;
		}

		function stop(n) {
			if (typeof n == "number") { timeout_calls = n; }
			else {
				running = false;
				timeout_calls = undefined;
				window.clearTimeout(timeout_id);
			}
		}

		function status() {
			if (running) { time_current = new Date().getTime(); }
			var diff = time_current - time_start;
			return Math.min(1, diff / ms);
		}

		instance = {
			start: start,
			stop: stop,
			status: status
		};

		return instance;
	};

	G5.animate = API.animate = (function() {

		var easing_functions = {
			"linear": function(p) { return p; },
			"ease-out": function(p) { return Math.sin(p*Math.PI/2); },
			"ease-in": function(p) { return 1-Math.cos(p*Math.PI/2); },
			"ease-in-out": function(p) { return (Math.sin((p-0.5)*Math.PI)+1)/2; },
			"ease-out-back": function(p) { return Math.sin(p*Math.PI/2)+(0.4*(1-p))*p; }
		},

		Constructor = function(props) {
			var prop, _this = this;

			for (prop in props) { this[prop] = props[prop]; }
			for (prop in this.props) {
				if (this.isArray) {
					this.target.forEach(function(v, i) {
						v = _this.prefix ? _this.target[i][_this.prefix] : _this.target[i];
						_this.defaults[i] = _this.defaults[i] || {};
						_this.defaults[i][prop] = v[prop];
					});

					continue;
				}

				this.defaults[prop] = this.target[prop];
			}

			this.backwards = this.opts.backwards;
			this.loops = this.opts.loops || Number(this.opts.alternate || 0) || 0;
			if (this.opts.loops && this.opts.alternate) { this.loops = this.loops*2+1; }

			this.easing = this.easing || this.opts.easing;
			this.duration = this.duration || this.opts.duration || 1000;
			this.callback = this.callback || this.opts.callback;
			this.interval = window.setInterval(this.loop.bind(this), 1000 / 60);
		};

		Constructor.prototype.loop = function() {

			var _this = this,
			    now = new Date().getTime(),
			    diff = now - this.start,
			    progress = easing_functions[this.easing](diff/this.duration),
			    prop;

			if (this.backwards) { progress = 1 - progress; }
			if (diff >= this.duration) { progress = Number(!this.backwards); }

			if (this.opts.step) {
				if (this.isArray) {
					this.target.forEach(function(v, i) {
						_this.opts.step(
							v,
							_this.defaults[i],
							progress
						);
					});
				} else {
					this.opts.step(
						this.target,
						this.defaults,
						progress
					);
				}
			} else {
				for (prop in this.props) {
					if (this.isArray) {
						this.target.forEach(function(v, i) {
							v = _this.prefix ? _this.target[i][_this.prefix] : _this.target[i];
							v[prop] = _this.defaults[i][prop] + (_this.props[prop]-_this.defaults[i][prop]) * progress;
						});
					} else {
						this.target[prop] = this.defaults[prop] + (this.props[prop]-this.defaults[prop]) * progress;
					}
				}
			}

			if (diff >= this.duration) {

				if (this.loops == 0) {
					window.clearInterval(this.interval);
					if (this.callback) { this.callback(); }
				}

				if (this.opts.alternate) {
					this.start = now;
					this.backwards = !this.backwards;
					this.loops--;
				}
			}
		};

		function animate(target, arg2, arg3, arg4, arg5, arg6) {

			var isArray = G5.type_of(target) == "array",

			instance = new Constructor({
				target:   target,
				isArray:  isArray,
				props:    typeof arg2 == "object" ? arg2 : arg3,
				prefix:   typeof arg2 == "string" ? arg2 : undefined,
				easing:   typeof arg4 == "string" ? arg4 : typeof arg5 == "string" ? arg5 : "ease-in-out",
				duration: [].filter.call(arguments, function(v) { return typeof v == "number"; }).pop(),
				callback: [].filter.call(arguments, function(v) { return typeof v == "function"; }).pop(),
				opts:     typeof arguments[arguments.length-1] == "object" ? arguments[arguments.length-1] : {},
				defaults: isArray ? [] : {},
				start:    new Date().getTime()
			});
		}

		return animate;
	}());

	G5.Animation = API.Animation = function(duration) {

		var easing_functions = {
			"linear": function(p) { return p; },
			"ease-out": function(p) { return Math.sin(p*Math.PI/2); },
			"ease-in": function(p) { return 1-Math.cos(p*Math.PI/2); },
			"ease-in-out": function(p) { return (Math.sin((p-0.5)*Math.PI)+1)/2; }
		},

		time_start,
		time_current,
		running = false,
		backwards = false,

		easing = "linear",
		loops = 0,
		callback,
		opts = {},
		instance;

		[].forEach.call(arguments, function(v) {
			switch(typeof v) {
				case "string": easing = v; break;
				case "function": callback = v; break;
				case "object": opts = v; break;
			}
		});

		opts.loops = opts.loops || 0;
		backwards = opts.reverse || opts.backwards;

		function start() {
			running = true;
			time_current = new Date().getTime();
			time_start = time_current;

			return instance;
		}

		function stop() {
			progress();
			running = false;
			return instance;
		}

		function reset(fullreset) {
			loops = 0;
			instance.complete = false;
			time_start = fullreset ? undefined : new Date().getTime();
			return instance;
		}

		function progress() {

			if (instance.complete) { return backwards ? 0 : 1; }
			if (running) { time_current = new Date().getTime(); }

			var diff = time_current - time_start,
			    progress = Math.max(Math.min(easing_functions[easing](diff/duration), 1), 0);

			if (backwards) { progress = 1 - progress; }

			if (diff >= duration) {
				if (opts.alternate) { backwards = !backwards; loops++; }
				if (opts.alternate || opts.auto_reset) { time_start = time_current; }
				if (opts.loops == loops) { instance.complete = true; }
				if (instance.complete && callback) { callback(); }
			}

			return progress;
		}

		instance = {
			start: start,
			stop: stop,
			reset: reset,
			toString: progress
		};

		return instance;
	};


	/* ======================= */
	/* ====== G5.listen ====== */
	/* ======================= */

	G5.listen = (function() {

		var table = "abcdefghijklmnopqrstuvwxyz0123456789",
		    special_keys = {

				// Mouse action
				"[mouse_left]": "left",
				"[mouse_middle]": "middle",
				"[mouse_right]": "right",

				// Whitespace
				"[enter]": 13,
				"[space]": 32,
				"[tab]": 9,

				// Arrow keys
				"[left]": 37,
				"[right]": 39,
				"[up]": 38,
				"[down]": 40,

				// Misc
				"[esc]": 27
			};

		function listener(e) {

			var code  = e.keyCode || e.which,
				// delta = (e.wheelData || e.delta || e.detail) < 0 ? -1 : 1,
				type  = e.type.replace(/(down|up)/g, ""),
				state = e.type.replace(/(key|mouse|touch)/g, ""),
				chr = String.fromCharCode(code).toLowerCase(),
				callbacks, i, last_status;

			// Filter touch events
			if (state == "start") { state = "down"; }
			else if (["end", "cancel"].indexOf("state") != -1) { state = "up"; }

			// Find special char name
			if (table.indexOf(chr) == -1) {
				for (i in special_keys) {
					if (special_keys[i] == code) {
						chr = i.substring(1, i.length-1);
					}
				}
			}

			if (type == "mouse") { code = [undefined, "left", "middle", "right"][code]; }
			if (!input[type] || !input[type][code]) { return; }

			// Don't fire the event repeatedly
			if (!input[type][code]) { input[type][code] = {}; }

			last_status = input[type][code].status;
			input[type][code].status = state == "down";

			if (last_status === true && last_status === (state == "down")) { return; }

			if (!input[type][code].callbacks) { return; }
			callbacks = input[type][code].callbacks[state];

			callbacks.forEach(function(v) { input.callbacks[state][v](chr, e); });
		}

		document.addEventListener("keydown", listener, false);
		document.addEventListener("keyup", listener, false);

		document.addEventListener("mousedown", listener, false);
		document.addEventListener("mouseup", listener, false);
		document.addEventListener("contextmenu", listener, false);

		// TODO: add touch and scroll support
		// document.addEventListener("mousewheel", listener, false);
		// document.addEventListener("DOMMouseScroll", listener, false);

		G5.is_keydown = API.is_keydown = function(key) {
			var chr, i;

			if (table.indexOf(key.toLowerCase()) == -1) {
				for (i in special_keys) {
					chr = i.substring(1, i.length-1);
					if (key == i || key == chr) { key = special_keys[i]; }
				}
			} else { key = key.toUpperCase().charCodeAt(0); }

			return input.key[key] ? input.key[key].status : false;
		};

		G5.is_mousedown = API.is_mousedown = function(btn) {
			return input.mouse[btn] ? input.mouse[btn].status : false;
		};

		// TODO save callbacks only once and refer to them
		G5.listen = API.listen = function(data, down, up, reg) {

			data = data.toLowerCase().replace(/\s/g, "");
			reg = reg !== undefined ? reg : true;

			var types = { key: [], mouse: [] }, t,

				ref = {
			    	down: { key: [], mouse: [] },
			    	up: { key: [], mouse: [] }
			    },

			    reg_func = function(v) {
					if (!input[t][v]) {
						input[t][v] = {
							callbacks: { up: [], down: [] },
							status: false
						};
					}

					if (down !== undefined) {
						input[t][v].callbacks.down.push(input.callbacks.down.length-1);
						ref.down[t][v] = input.callbacks.down.length-1;
					}

					if (up !== undefined) {
						input[t][v].callbacks.up.push(input.callbacks.up.length-1);
						ref.up[t][v] = input.callbacks.up.length-1;
					}
				};

			// Ranges
			(data.match(/[a-z]-[a-z]|[0-9]-[0-9]/g) || []).forEach(function(v) {
				t = table.substring(table.indexOf(v[0]), table.indexOf(v[2])+1);
				t.split("").forEach(function(value) { types.key.push(value.toUpperCase().charCodeAt(0)); });
			});

			// Special keys
			(data.match(/\[[a-z_0-9]+\]/g) || []).forEach(function(v) {
				if (v.indexOf("mouse") != -1)
				{ types.mouse.push(special_keys[v]); }
				else
				{ types.key.push(special_keys[v]); }
			});

			// Single keys
			((data.replace(/\[[a-z_0-9]+\]|[a-z]-[a-z]|[0-9]-[0-9]/g, "") || "").split("") || []).forEach(function(v) {
				types.key.push(v.toUpperCase().charCodeAt(0));
			});

			// Don't register the callbacks, just return a reference for G5.ignore
			if (!reg) { return types; }

			if (down !== undefined) { input.callbacks.down.push(down); }
			if (up !== undefined) { input.callbacks.up.push(up); }

			for (t in types) { types[t].forEach(reg_func); }

			return ref;
		};

		G5.ignore = API.ignore = function(data) {
			var status, type, btn,

			clear_func = function(v) {
				input[type][v].callbacks = { down: [], up: [] };
			};

			if (typeof data == "object") {
				for (status in data) {
					for (type in data[status]) {
						for (btn in data[status][type]) {
							input[type][btn].callbacks[status].splice(data[status][type][btn], 1);
						}
					}
				}
			} else if (typeof data == "string") {
				data = API.listen(data, null, null, false);
				for (type in data) {
					data[type].forEach(clear_func);
				}
			}
		};
	}());


	/* ======================== */
	/* ====== G5.Vector2 ====== */
	/* ======================== */

	G5.Vector2 = API.Vector2 = function(x, y) {
		this.x = !isNaN(x) ? x : null;
		this.y = !isNaN(y) ? y : null;
	};

	G5.Vector2.prototype = {
		add: function(v) {
			this.x += v.x;
			this.y += v.y;
		},

		subtract: function(v) {
			this.x -= v.x;
			this.y -= v.y;
		},

		divide: function(v) {
			this.x /= v.x;
			this.y /= v.y;
		},

		multiply: function(v) {
			this.x *= v.x;
			this.y *= v.y;
		},

		dot: function(v) {
			return this.x * v.x + this.y * v.y;
		},

		scale: function(s) {
			this.x *= s;
			this.y *= s;
		},

		diff: function(v) {
			v = v || { x: 0, y: 0 };

			var diff = {
				x: v.x - this.x,
				y: v.y - this.y
			};

			return diff;
		},

		slope: function(v) {
			var diff = this.diff(v || null);
			return diff.y / diff.x;
		},

		angle: function(v) {
			var diff = this.diff(v || null);
			return Math.atan2(diff.y, diff.x);
		},

		length: function(v) {
			var diff = v ? this.diff(v) : this;
			return Math.sqrt(diff.x*diff.x + diff.y*diff.y);
		},

		getX: function(v, y) {
			var diff = this.diff(v || null),
				slope = diff.x / diff.y;

			return slope * y;
		},

		getY: function(v, x) {
			var diff = this.diff(v),
				slope = diff.y / diff.x;

			return slope * x;
		},

		clone: function() {
			return new G5.Vector2(this.x, this.y);
		}
	};


	/* ============================ */
	/* ====== G5.Spritesheet ====== */
	/* ============================ */

	G5.Spritesheet = API.Spritesheet = function(src, w, h, callback, global_opts) {

		global_opts = global_opts || {};
		global_opts.instance = global_opts.instance || {};

		var instance = {
		    self: this,
		    src: src,
		    callback: callback,

		    w: w || global_opts.instance.w,
		    h: h || global_opts.instance.h,

		    state: global_opts.instance.state || { mirror: false },
		    states: global_opts.instance.states || {},
		    counter: global_opts.instance.counter || {},

		    bfr: new G5.Buffer(w, h),
		    src_type: src && src.tagName ? src.tagName.toLowerCase() : "string"

		}, api;

		function dye() {

			var bfr = instance.bfr,
			    src = instance.src,
			    color = global_opts.color,
			    rgb = [], hex, pixelArray, imgObj,
			    x, y, w, h, i, r, g, b, avg;

			bfr.canvas.width = src.width;
			bfr.canvas.height = src.height;
			bfr.drawImage(src, 0, 0);

			imgObj = bfr.getImageData(0, 0, src.width, src.height);
			pixelArray = imgObj.data;

			// HEX
			if ((hex = color.match(/^#?(([0-9a-fA-F]{3}){1,2})$/)) !== undefined) {

				hex = hex[1];

				if (hex.length == 3) {
					rgb = [
						parseInt(hex[0]+hex[0], 16),
						parseInt(hex[1]+hex[1], 16),
						parseInt(hex[2]+hex[2], 16)
					];

				} else if (hex.length == 6) {
					rgb = [
						parseInt(hex[0]+hex[1], 16),
						parseInt(hex[2]+hex[3], 16),
						parseInt(hex[5]+hex[6], 16)
					];
				}

			// RGB
			} else if (color.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])(, ?|$)){3}$/)) {
				rgb = color.split(",").map(function(n) { return parseInt(n, 10); });

			} else { rgb = [0,0,0]; }

			for (y = 0, h = src.height; y < h; y++) {
				for (x = 0, w = src.width; x < w; x++) {
					i = (y*w+x)*4;
					r = pixelArray[i];
					g = pixelArray[i+1];
					b = pixelArray[i+2];
					avg = Math.round((r+g+b)/3);

					pixelArray[i] = avg*(1+(rgb[0]/255));
					pixelArray[i+1] = avg*(1+(rgb[1]/255));
					pixelArray[i+2] = avg*(1+(rgb[2]/255));
				}
			}
			
			bfr.putImageData(imgObj, 0, 0);

			instance.src = new Image();
			instance.src.src = bfr.canvas.toDataURL();

			instance.src.addEventListener("load", function() {
				if (instance.callback) { instance.callback.call(api); }
			}, false);

			bfr.canvas.width = w;
			bfr.canvas.height = h;
		}

		function slice(state, x, y, w, h, opts) {

			var bfr = instance.bfr,
			    src = instance.src,
			    img;

			if (opts.offset) {
				x += opts.offset.x;
				y += opts.offset.y;
			}

			bfr.clearRect(0, 0, w, h);
			bfr.drawImage(src, x, y, w, h, 0, 0, w, h);

			img = new Image();
			img.src = bfr.canvas.toDataURL();
			instance.states[state].frames.push(img);

			if (opts.mirror) {
				bfr.save();

				if (opts.mirror == "vertical" || opts.mirror === true) {
					bfr.translate(w, 0);
					bfr.scale(-1, 1);
				} else if (opts.mirror == "horizontal") {
					bfr.translate(0, h);
					bfr.scale(1, -1);
				}

				bfr.clearRect(0, 0, w, h);
				bfr.drawImage(src, x, y, w, h, 0, 0, w, h);
				bfr.restore();
				
				img = new Image();
				img.src = bfr.canvas.toDataURL();
				instance.states[state].frames_m.push(img);
			}
		}

		function animate(state, opts) {
			return function(axis, to, duration) {

				var i, l, x, y;
				instance.states[state].duration = duration;

				for (i = 1, l = to+1; i < l; i++) {

					x = axis == "x" ? i * w : instance.states[state].base.x * w;
					y = axis == "y" ? i * h : instance.states[state].base.y * h;

					slice(state, x, y, w, h, opts);
				}
			};
		}

		function addState(state, x, y, opts) {

			opts = opts || {};

			instance.states[state] = {
				base: { x: x, y: y },
				frames: [],
				frames_m: [],
				counter: {
					duration: 0,
					frame: 0
				}
			};

			instance.counter[state] = {
				frame: 0,
				duration: 0
			};

			slice(state, x*w, y*h, w, h, opts);
			return { animate: animate.call(instance, state, opts) };
		}

		function mirror(bool) {
			instance.state.mirror = bool !== undefined ? bool : !instance.state.mirror;
		}

		function setState(state, opts) {
			opts = opts || {};

			if (state !== undefined) { instance.state.name = state; }
			if (opts.mirror !== undefined) { instance.state.mirror = opts.mirror; }

			instance.state.reverse = opts.reverse;
			instance.state.frame = opts.frame || undefined;
			instance.state.next = opts.next;
		}

		function getState(state, opts) {
			opts = opts || {};

			var counter = instance.counter[state || instance.state.name], frame, img;
			if (!counter) { return new G5.Buffer(1, 1).canvas; }

			state = instance.states[state || instance.state.name];
			frame = instance.state.frame || opts.frame || counter.frame;
			img = opts.mirror || instance.state.mirror ? state.frames_m[frame] : state.frames[frame];

			if (state.duration && counter.duration < state.duration) {
				counter.duration++;
			} else {
				if (state.duration) { counter.duration = 0; }
				if (state.reverse || opts.reverse) {
					counter.frame--;
					if (counter.frame < 0) { counter.frame = state.frames.length-1; }
				} else { counter.frame = (counter.frame+1) % state.frames.length; }

				if (counter.frame == 0) {
					if (typeof instance.state.next == "function") {
						instance.state.next.call(instance);
						instance.state.next = undefined;
					} else if (typeof instance.state.next == "string") {
						setState(instance.state.next);
					}
				}
			}

			return img;
		}

		function getInstance() {
			return new G5.Spritesheet(null, null, null, null, {
				instance: {
					w: instance.w,
					h: instance.h,
					state: JSON.parse(JSON.stringify(instance.state)),
					states: instance.states,
					counter: JSON.parse(JSON.stringify(instance.counter))
				}
			});
		}

		// Setup src and callback if it's a total new instance
		if (Object.keys(global_opts.instance).length == 0) {
			if (instance.src_type == "canvas" || instance.src_type == "string") {

				src = instance.src_type == "canvas" ? src.toDataURL() : src;
				instance.src = new Image();

				if (instance.src_type == "string" && !global_opts.cache) { src += "?t=" + new Date().getTime(); }
				instance.src.src = src;
			}

			instance.src.addEventListener("load", function() {
				if (global_opts.color) { dye(); }
				else if (instance.callback) { instance.callback.call(api); }
			}, false);
		}

		api = {
			addState: addState,
			setState: setState,
			getState: getState,
			getInstance: getInstance,
			mirror: mirror
		};

		return api;
	};


	/* ========================== */
	/* ====== G5.Collision ====== */
	/* ========================== */

	G5.Collision = API.Collision = (function() {

		function AABB_response(x0, y0, w0, h0, x1, y1, w1, h1) {

			return function() {
			
				var a = {
					half: {
						x: (w0 / 2),
						y: (h0 / 2)
					},
					
					center:  {
						x: x0 + (w0 / 2),
						y: y0 + (h0 / 2)
					}
				},

				b = {
					half: {
						x: (w1 / 2),
						y: (h1 / 2)
					},
					
					center: {
						x: x1 + (w1 / 2),
						y: y1 + (h1 / 2)
					}
				},

				d = {
					x: a.center.x - b.center.x,
					y: a.center.y - b.center.y
				},

				md = {
					x: a.half.x + b.half.x,
					y: a.half.y + b.half.y

				}, depth = {};

				if (Math.abs(d.x) >= md.x || Math.abs(d.y) >= md.y) {
					depth.x = 0;
					depth.y = 0;
				} else {
					depth.x = d.x > 0 ? md.x - d.x : -md.x - d.x;
					depth.y = d.y > 0 ? md.y - d.y : -md.y - d.y;
				}

				if (Math.abs(depth.x) > Math.abs(depth.y)) { depth.x = 0; }
				else if (Math.abs(depth.y) > Math.abs(depth.x)) { depth.y = 0; }

				return depth;
			};
		}

		function AABB(x0, y0, w0, h0, x1, y1, w1, h1) {
			if (x0 + w0 > x1 && x0 < x1 + w1 &&
				y0 + h0 > y1 && y0 < y1 + h1) {
				return { fix: AABB_response.apply(null, arguments) };
			}

			return false;
		}

		var api = {
			AABB: AABB
		};

		return api;
	}());


	/* ========================= */
	/* ====== G5.Geometry ====== */
	/* ========================= */

	G5.Geometry = API.Geometry = (function() {

		function triangle(ctx, bx, by, r, n) {
			var step = (Math.PI*2) / n, x, y;
			ctx.moveTo(bx + (r*Math.cos(step*(n-1))), by + (r*Math.sin(step*(n-1))));

			for (var i = 0; i < n; i++) {
				x = r * Math.cos(step*i);
				y = r * Math.sin(step*i);

				ctx.lineTo(bx + x, by + y);
			}
		}

		function rectangle(ctx, x, y, w, h, r1, r2, r3, r4) {
			if (r1 === undefined) {
				ctx.moveTo(x, y);
				ctx.lineTo(x + w, y);
				ctx.lineTo(x + w, y + h);
				ctx.lineTo(x, y + h);
				ctx.lineTo(x, y);
			} else {
				r2 = r2 === undefined ? r1 : r2;
				r3 = r3 === undefined ? r1 : r3;
				r4 = r4 === undefined ? r2 : r4;
				r4 = r4 === undefined ? r1 : r4;
		
				ctx.moveTo(x, y + r1);
				ctx.quadraticCurveTo(x, y, x + r1, y);
				ctx.lineTo(x + w - r2, y);
				ctx.quadraticCurveTo(x + w, y, x + w, y + r2);
				ctx.lineTo(x + w, y + h - r3);
				ctx.quadraticCurveTo(x + w, y + h, x + w - r3, y + h);
				ctx.lineTo(x + r4, y + h);
				ctx.quadraticCurveTo(x, y + h, x, y + h - r4);
				ctx.lineTo(x, y+r1);
			}
		}

		function ellipse(ctx, x, y, w, h) {

			x-= w/2;
			y -= h/2;

			var kappa = .5522848,
			    ox = (w / 2) * kappa, // control point offset horizontal
			    oy = (h / 2) * kappa, // control point offset vertical
			    xe = x + w,           // x-end
			    ye = y + h,           // y-end
			    xm = x + w / 2,       // x-middle
			    ym = y + h / 2;       // y-middle

			ctx.moveTo(x, ym);
			ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
			ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
			ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
			ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		}

		var api = {
			triangle: triangle,
			rectangle: rectangle,
			ellipse: ellipse
		};

		return api;

	}());


	/* ======================== */
	/* ====== G5.preload ====== */
	/* ======================== */

	G5.preload = API.preload = function(data, callback, opts) {
		data = typeof data == "object" ? data : [data];
		opts = opts || {};

		var count = 0,
		    objects = [],

		    container_exists = document.querySelector("div[data-role=preload]"),
		    container = container_exists || document.createElement("div"),

		    audio_load = function() { this.complete = true; },
		    matches, audio, img, check;

		if (!container_exists) {
			container.style.display = "none";
			container.setAttribute("data-role", "preload");
		}

		data.forEach(function(v) {

			// Images
			matches = v.toLowerCase().match(/^[^.]*\.(png|jpg|jpeg|gif|tif|bmp|svg|ico|tga)$/);

			if (matches) {
				img = new Image();
				img.src = v;
				objects.push(img);
				container.appendChild(img);
			}

			// Audio
			matches = v.toLowerCase().match(/^[^.]*\.(aiff|wav|mp3|wma|midi|ogg)$/);

			if (matches) {
				audio = document.createElement("audio");
				audio.src = v;
				audio.addEventListener("canplaythrough", audio_load, false);
				objects.push(audio);
				container.appendChild(audio);
			}
		});

		if (!container_exists) { document.body.appendChild(container); }

		check = window.setInterval(function() {
			var old_count = count, i, l;

			for (i = 0, l = objects.length; i < l; i++) { if (objects[i].complete === true) { count++; } }
			if (opts.step && old_count < count) { opts.step(((100 / objects.length) * count) / 100); }

			if (callback && count >= objects.length) {
				window.clearInterval(check);
				callback();
			}
		}, opts.ms || 1000 / 60);
	};


	/* ======================== */
	/* ====== G5.include ====== */
	/* ======================== */

	G5.include = API.include = function(paths, callback) {
		paths = typeof paths == "object" ? paths : [paths];

		var loadCount = 0, script,
		    script_load = function() { if (++loadCount == paths.length) { callback(); } };

		paths.forEach(function(v) {
			script = document.createElement("script");
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", v + "?t=" + new Date().getTime());
			document.getElementsByTagName("head")[0].appendChild(script);

			if (callback) { script.onload = script_load; }
		});
	};


	/* ======================== */
	/* ====== G5.support ====== */
	/* ======================== */

	G5.Support = API.Support = (function() {

		var check = {}, canvas = document.createElement("canvas");

		check.canvas       = function() { return !!canvas.getContext; };
		check.toDataURL    = function() { return check.canvas() && new G5.Scene(10, 10).canvas.toDataURL().indexOf("data:image/png") != -1 };
		check.websocket    = function() { return !!window.WebSocket; };
		check.webworker    = function() { return !!window.Worker; };
		check.audio        = function() { return !!window.Audio; };
		check.audioContext = function() { return !!window.webkitAudioContext; };
		check.svg          = function() { return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") };

		check.webgl = function() {
			try { return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))); }
			catch(e) { return false; }
		};

		return check;
	}());


	/* =========================== */
	/* ====== G5.fullscreen ====== */
	/* =========================== */

	G5.fullscreen = API.fullscreen = (function() {

		var opts, elem, style, suffix, is_fullscreen, webgl, ratio_w, ratio_h, size,

		resizeFunc = function() {
			is_fullscreen = document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen;
			webgl = elem.getContext ? elem.getContext("experimental-webgl") : false;

			if (is_fullscreen) {
				if (opts.aspect) {
					ratio_w = elem.offsetWidth/elem.offsetHeight;
					ratio_h = elem.offsetHeight/elem.offsetWidth;

					if (window.innerWidth < window.innerHeight) {
						style.width = window.innerWidth + suffix;
						style.height = window.innerWidth * ratio_w + suffix;
					} else {
						style.width = window.innerHeight * ratio_w + suffix;
						style.height = window.innerHeight + suffix;
					}
				} else {
					style.width = window.innerWidth + suffix;
					style.height = window.innerHeight + suffix;
				}

			} else if (elem.getAttribute("data-defaultSize")) {
				size = elem.getAttribute("data-defaultSize").split(";");
				style.width = size[0];
				style.height = size[1];
			}

			if (webgl) { webgl.viewport(0, 0, style.width, style.height); }

		};

		return function(element, options) {		

			elem = typeof element == "string" ? document.querySelector(element) : element || document.body;
			opts = options || {};

			is_fullscreen = document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen;

			if (opts.resize == "attribute") {
				style = elem;
				suffix = "";
			} else {	
				style = elem.style;
				suffix = "px";
			}

			if (!is_fullscreen) {
				if (elem.requestFullscreen) { elem.requestFullscreen(); }
				else if (elem.mozRequestFullScreen) { elem.mozRequestFullScreen(); }
				else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); }
			} else {
				if (document.cancelFullScreen) { document.cancelFullScreen(); }
				else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
				else if (document.webkitCancelFullScreen) { document.webkitCancelFullScreen(); }
			}

			if (opts.resize && !elem.getAttribute("data-defaultSize")) {
				elem.setAttribute("data-defaultSize", style.width + ";" + style.height);
				elem.addEventListener("fullscreenchange", resizeFunc, false);
				elem.addEventListener("mozfullscreenchange", resizeFunc, false);
				elem.addEventListener("webkitfullscreenchange", resizeFunc, false);

			} else if (!opts.resize) {
				elem.removeAttribute("data-defaultSize");
				elem.removeEventListener("fullscreenchange", resizeFunc, false);
				elem.removeEventListener("mozfullscreenchange", resizeFunc, false);
				elem.removeEventListener("webkitfullscreenchange", resizeFunc, false);
			}
		};
	}());


	/* ======================= */
	/* ====== G5.Cookie ====== */
	/* ======================= */

	G5.Cookie = API.Cookie = {
		set: function(name, value, days) {
			var date, expires;

			if (days) {
				date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));

				expires = "; expires="+date.toGMTString();
			} else { expires = ""; }

			document.cookie = name + "=" + value + expires + "; path=" + location.pathname;
		},

		unset: function(name) { G5.Cookie.set(name, "", -1); },

		get: function(name) {
			var search = new RegExp(name + "=([^;]*);"),
				result = search.exec(document.cookie);

			return result ? result[1] : null;
		}
	};


	/* ====================== */
	/* ====== G5.$_GET ====== */
	/* ====================== */

	G5.$_GET = API.$_GET = (function() {
		var $_GET = {},
		    params = location.search.substr(1).split("&"),
		    pair, i, l;

		for (i = 0, l = params.length; i < l; i++) {
			pair = params[i].split("=");
			$_GET[pair[0]] = pair[1];
		}

		return $_GET;
	}());


	/* ======================== */
	/* ====== MISC UTILS ====== */
	/* ======================== */

	G5.rand = API.rand = function(min, max, toFloat) {
		var random = Math.random() * (max-min) + min;
		return toFloat ? random : Math.round(random);
	};

	G5.clamp = API.clamp = function(val, min, max) {
		return Math.max(Math.min(val, max), min);
	};

	G5.translateRange = API.translateRange = function(val, a0, b0, a1, b1) {
		return ((val-a0)/(b0-a0)) * (b1-a1) + a1
	};

	G5.shift = API.shift = function(val, min, max) {
		return val >= 0 ? val % (max+1) : (max+1) + val;
	};

	G5.type_of = API.type_of = function(v) {
		return Object.prototype.toString.call(v).replace(/.* ([a-zA-Z]+)\]/g, "$1").toLowerCase();
	};


	/* ======================= */
	/* ====== CONSTANTS ====== */
	/* ======================= */

	G5.DEG2RAD = API.DEG2RAD = (Math.PI / 180);
	G5.RAD2DEG = API.RAD2DEG = (180 / Math.PI);


	/* ====================== */
	/* ====== COMPLETE ====== */
	/* ====================== */

	if (typeof define === "function" && define.amd)
	{ define("G5", function() { return API; }); }
	else
	{ window.G5 = API; }

}(window));