/*
 * redditlive - Real-time reddit posts in javascript + websockets
 * Author: Darren Whitlen (www.darrenwhitlen.com)
 */
var redditlive = function () {
		function e(a) {
			var b = Array.prototype.slice.call(arguments, 1),
				d;
			for (d in c[a]) {
				c[a][d].apply(window, b)
			}
		}
		function d() {
			b.on("post", function (a) {
				e("post", a)
			})
		}
		var a = this,
			b, c = {};
		return {
			subscribe: function (a) {
				if (typeof a === "string") {
					a = [a]
				}
				b.emit("subscribe", {
					sub: a
				})
			},
			connect: function () {
				b = this.io.connect("http://live.reddit.woksbox.net:80", {
					transports: ["websocket", "jsonp-polling"]
				});
				d();
				b.on("connect", function () {
					e("connect")
				});
				b.on("disconnect", function () {
					e("disconnect")
				})
			},
			on: function (a, b) {
				if (typeof b !== "function") {
					return
				}
				if (typeof c[a] === "undefined") {
					c[a] = []
				}
				c[a].push(b)
			}
		}
	}();
(function () {
	(function (a, b) {
		var c = a;
		c.version = "0.8.7";
		c.protocol = 1;
		c.transports = [];
		c.j = [];
		c.sockets = {};
		c.connect = function (a, d) {
			var e = c.util.parseUri(a),
				f, g;
			if (b && b.location) {
				e.protocol = e.protocol || b.location.protocol.slice(0, -1);
				e.host = e.host || (b.document ? b.document.domain : b.location.hostname);
				e.port = e.port || b.location.port
			}
			f = c.util.uniqueUri(e);
			var h = {
				host: e.host,
				secure: "https" == e.protocol,
				port: e.port || ("https" == e.protocol ? 443 : 80),
				query: e.query || ""
			};
			c.util.merge(h, d);
			if (h["force new connection"] || !c.sockets[f]) {
				g = new c.Socket(h)
			}
			if (!h["force new connection"] && g) {
				c.sockets[f] = g
			}
			g = g || c.sockets[f];
			return g.of(e.path.length > 1 ? e.path : "")
		}
	})("object" === typeof module ? module.exports : this.io = {}, window);
	(function (a, b) {
		var c = a.util = {};
		var d = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
		var e = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
		c.parseUri = function (a) {
			var b = d.exec(a || ""),
				c = {},
				f = 14;
			while (f--) {
				c[e[f]] = b[f] || ""
			}
			return c
		};
		c.uniqueUri = function (a) {
			var c = a.protocol,
				d = a.host,
				e = a.port;
			if ("document" in b) {
				d = d || document.domain;
				e = e || (c == "https" && document.location.protocol !== "https:" ? 443 : document.location.port)
			} else {
				d = d || "localhost";
				if (!e && c == "https") {
					e = 443
				}
			}
			return (c || "http") + "://" + d + ":" + (e || 80)
		};
		c.query = function (a, b) {
			var d = c.chunkQuery(a || ""),
				e = [];
			c.merge(d, c.chunkQuery(b || ""));
			for (var f in d) {
				if (d.hasOwnProperty(f)) {
					e.push(f + "=" + d[f])
				}
			}
			return e.length ? "?" + e.join("&") : ""
		};
		c.chunkQuery = function (a) {
			var b = {},
				c = a.split("&"),
				d = 0,
				e = c.length,
				f;
			for (; d < e; ++d) {
				f = c[d].split("=");
				if (f[0]) {
					b[f[0]] = decodeURIComponent(f[1])
				}
			}
			return b
		};
		var f = false;
		c.load = function (a) {
			if ("document" in b && document.readyState === "complete" || f) {
				return a()
			}
			c.on(b, "load", a, false)
		};
		c.on = function (a, b, c, d) {
			if (a.attachEvent) {
				a.attachEvent("on" + b, c)
			} else if (a.addEventListener) {
				a.addEventListener(b, c, d)
			}
		};
		c.request = function (a) {
			if (a && "undefined" != typeof XDomainRequest) {
				return new XDomainRequest
			}
			if ("undefined" != typeof XMLHttpRequest && (!a || c.ua.hasCORS)) {
				return new XMLHttpRequest
			}
			if (!a) {
				try {
					return new ActiveXObject("Microsoft.XMLHTTP")
				} catch (b) {}
			}
			return null
		};
		if ("undefined" != typeof window) {
			c.load(function () {
				f = true
			})
		}
		c.defer = function (a) {
			if (!c.ua.webkit || "undefined" != typeof importScripts) {
				return a()
			}
			c.load(function () {
				setTimeout(a, 100)
			})
		};
		c.merge = function g(a, b, d, e) {
			var f = e || [],
				g = typeof d == "undefined" ? 2 : d,
				h;
			for (h in b) {
				if (b.hasOwnProperty(h) && c.indexOf(f, h) < 0) {
					if (typeof a[h] !== "object" || !g) {
						a[h] = b[h];
						f.push(b[h])
					} else {
						c.merge(a[h], b[h], g - 1, f)
					}
				}
			}
			return a
		};
		c.mixin = function (a, b) {
			c.merge(a.prototype, b.prototype)
		};
		c.inherit = function (a, b) {
			function c() {}
			c.prototype = b.prototype;
			a.prototype = new c
		};
		c.isArray = Array.isArray ||
		function (a) {
			return Object.prototype.toString.call(a) === "[object Array]"
		};
		c.intersect = function (a, b) {
			var d = [],
				e = a.length > b.length ? a : b,
				f = a.length > b.length ? b : a;
			for (var g = 0, h = f.length; g < h; g++) {
				if (~c.indexOf(e, f[g])) d.push(f[g])
			}
			return d
		};
		c.indexOf = function (a, b, c) {
			if (Array.prototype.indexOf) {
				return Array.prototype.indexOf.call(a, b, c)
			}
			for (var d = a.length, c = c < 0 ? c + d < 0 ? 0 : c + d : c || 0; c < d && a[c] !== b; c++) {}
			return d <= c ? -1 : c
		};
		c.toArray = function (a) {
			var b = [];
			for (var c = 0, d = a.length; c < d; c++) b.push(a[c]);
			return b
		};
		c.ua = {};
		c.ua.hasCORS = "undefined" != typeof XMLHttpRequest &&
		function () {
			try {
				var a = new XMLHttpRequest
			} catch (b) {
				return false
			}
			return a.withCredentials != undefined
		}();
		c.ua.webkit = "undefined" != typeof navigator && /webkit/i.test(navigator.userAgent)
	})("undefined" != typeof this.io ? this.io : module.exports, window);
	(function (a, b) {
		function c() {}
		a.EventEmitter = c;
		c.prototype.on = function (a, c) {
			if (!this.$events) {
				this.$events = {}
			}
			if (!this.$events[a]) {
				this.$events[a] = c
			} else if (b.util.isArray(this.$events[a])) {
				this.$events[a].push(c)
			} else {
				this.$events[a] = [this.$events[a], c]
			}
			return this
		};
		c.prototype.addListener = c.prototype.on;
		c.prototype.once = function (a, b) {
			function d() {
				c.removeListener(a, d);
				b.apply(this, arguments)
			}
			var c = this;
			d.listener = b;
			this.on(a, d);
			return this
		};
		c.prototype.removeListener = function (a, c) {
			if (this.$events && this.$events[a]) {
				var d = this.$events[a];
				if (b.util.isArray(d)) {
					var e = -1;
					for (var f = 0, g = d.length; f < g; f++) {
						if (d[f] === c || d[f].listener && d[f].listener === c) {
							e = f;
							break
						}
					}
					if (e < 0) {
						return this
					}
					d.splice(e, 1);
					if (!d.length) {
						delete this.$events[a]
					}
				} else if (d === c || d.listener && d.listener === c) {
					delete this.$events[a]
				}
			}
			return this
		};
		c.prototype.removeAllListeners = function (a) {
			if (this.$events && this.$events[a]) {
				this.$events[a] = null
			}
			return this
		};
		c.prototype.listeners = function (a) {
			if (!this.$events) {
				this.$events = {}
			}
			if (!this.$events[a]) {
				this.$events[a] = []
			}
			if (!b.util.isArray(this.$events[a])) {
				this.$events[a] = [this.$events[a]]
			}
			return this.$events[a]
		};
		c.prototype.emit = function (a) {
			if (!this.$events) {
				return false
			}
			var c = this.$events[a];
			if (!c) {
				return false
			}
			var d = Array.prototype.slice.call(arguments, 1);
			if ("function" == typeof c) {
				c.apply(this, d)
			} else if (b.util.isArray(c)) {
				var e = c.slice();
				for (var f = 0, g = e.length; f < g; f++) {
					e[f].apply(this, d)
				}
			} else {
				return false
			}
			return true
		}
	})("undefined" != typeof this.io ? this.io : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports);
	(function (exports, nativeJSON) {
		function str(a, b) {
			var c, d, e, f, g = gap,
				h, i = b[a];
			if (i instanceof Date) {
				i = date(a)
			}
			if (typeof rep === "function") {
				i = rep.call(b, a, i)
			}
			switch (typeof i) {
			case "string":
				return quote(i);
			case "number":
				return isFinite(i) ? String(i) : "null";
			case "boolean":
			case "null":
				return String(i);
			case "object":
				if (!i) {
					return "null"
				}
				gap += indent;
				h = [];
				if (Object.prototype.toString.apply(i) === "[object Array]") {
					f = i.length;
					for (c = 0; c < f; c += 1) {
						h[c] = str(c, i) || "null"
					}
					e = h.length === 0 ? "[]" : gap ? "[\n" + gap + h.join(",\n" + gap) + "\n" + g + "]" : "[" + h.join(",") + "]";
					gap = g;
					return e
				}
				if (rep && typeof rep === "object") {
					f = rep.length;
					for (c = 0; c < f; c += 1) {
						if (typeof rep[c] === "string") {
							d = rep[c];
							e = str(d, i);
							if (e) {
								h.push(quote(d) + (gap ? ": " : ":") + e)
							}
						}
					}
				} else {
					for (d in i) {
						if (Object.prototype.hasOwnProperty.call(i, d)) {
							e = str(d, i);
							if (e) {
								h.push(quote(d) + (gap ? ": " : ":") + e)
							}
						}
					}
				}
				e = h.length === 0 ? "{}" : gap ? "{\n" + gap + h.join(",\n" + gap) + "\n" + g + "}" : "{" + h.join(",") + "}";
				gap = g;
				return e
			}
		}
		function quote(a) {
			escapable.lastIndex = 0;
			return escapable.test(a) ? '"' + a.replace(escapable, function (a) {
				var b = meta[a];
				return typeof b === "string" ? b : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
			}) + '"' : '"' + a + '"'
		}
		function date(a, b) {
			return isFinite(a.valueOf()) ? a.getUTCFullYear() + "-" + f(a.getUTCMonth() + 1) + "-" + f(a.getUTCDate()) + "T" + f(a.getUTCHours()) + ":" + f(a.getUTCMinutes()) + ":" + f(a.getUTCSeconds()) + "Z" : null
		}
		function f(a) {
			return a < 10 ? "0" + a : a
		}
		"use strict";
		if (nativeJSON && nativeJSON.parse) {
			return exports.JSON = {
				parse: nativeJSON.parse,
				stringify: nativeJSON.stringify
			}
		}
		var JSON = exports.JSON = {};
		var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			gap, indent, meta = {
				"\b": "\\b",
				"\t": "\\t",
				"\n": "\\n",
				"\f": "\\f",
				"\r": "\\r",
				'"': '\\"',
				"\\": "\\\\"
			},
			rep;
		JSON.stringify = function (a, b, c) {
			var d;
			gap = "";
			indent = "";
			if (typeof c === "number") {
				for (d = 0; d < c; d += 1) {
					indent += " "
				}
			} else if (typeof c === "string") {
				indent = c
			}
			rep = b;
			if (b && typeof b !== "function" && (typeof b !== "object" || typeof b.length !== "number")) {
				throw new Error("JSON.stringify")
			}
			return str("", {
				"": a
			})
		};
		JSON.parse = function (text, reviver) {
			function walk(a, b) {
				var c, d, e = a[b];
				if (e && typeof e === "object") {
					for (c in e) {
						if (Object.prototype.hasOwnProperty.call(e, c)) {
							d = walk(e, c);
							if (d !== undefined) {
								e[c] = d
							} else {
								delete e[c]
							}
						}
					}
				}
				return reviver.call(a, b, e)
			}
			var j;
			text = String(text);
			cx.lastIndex = 0;
			if (cx.test(text)) {
				text = text.replace(cx, function (a) {
					return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
				})
			}
			if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
				j = eval("(" + text + ")");
				return typeof reviver === "function" ? walk({
					"": j
				}, "") : j
			}
			throw new SyntaxError("JSON.parse")
		}
	})("undefined" != typeof this.io ? this.io : module.exports, typeof JSON !== "undefined" ? JSON : undefined);
	(function (a, b) {
		var c = a.parser = {};
		var d = c.packets = ["disconnect", "connect", "heartbeat", "message", "json", "event", "ack", "error", "noop"];
		var e = c.reasons = ["transport not supported", "client not handshaken", "unauthorized"];
		var f = c.advice = ["reconnect"];
		var g = b.JSON,
			h = b.util.indexOf;
		c.encodePacket = function (a) {
			var b = h(d, a.type),
				c = a.id || "",
				i = a.endpoint || "",
				j = a.ack,
				k = null;
			switch (a.type) {
			case "error":
				var l = a.reason ? h(e, a.reason) : "",
					m = a.advice ? h(f, a.advice) : "";
				if (l !== "" || m !== "") k = l + (m !== "" ? "+" + m : "");
				break;
			case "message":
				if (a.data !== "") k = a.data;
				break;
			case "event":
				var n = {
					name: a.name
				};
				if (a.args && a.args.length) {
					n.args = a.args
				}
				k = g.stringify(n);
				break;
			case "json":
				k = g.stringify(a.data);
				break;
			case "connect":
				if (a.qs) k = a.qs;
				break;
			case "ack":
				k = a.ackId + (a.args && a.args.length ? "+" + g.stringify(a.args) : "");
				break
			}
			var o = [b, c + (j == "data" ? "+" : ""), i];
			if (k !== null && k !== undefined) o.push(k);
			return o.join(":")
		};
		c.encodePayload = function (a) {
			var b = "";
			if (a.length == 1) return a[0];
			for (var c = 0, d = a.length; c < d; c++) {
				var e = a[c];
				b += "ï¿½" + e.length + "ï¿½" + a[c]
			}
			return b
		};
		var i = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;
		c.decodePacket = function (a) {
			var b = a.match(i);
			if (!b) return {};
			var c = b[2] || "",
				a = b[5] || "",
				h = {
					type: d[b[1]],
					endpoint: b[4] || ""
				};
			if (c) {
				h.id = c;
				if (b[3]) h.ack = "data";
				else h.ack = true
			}
			switch (h.type) {
			case "error":
				var b = a.split("+");
				h.reason = e[b[0]] || "";
				h.advice = f[b[1]] || "";
				break;
			case "message":
				h.data = a || "";
				break;
			case "event":
				try {
					var j = g.parse(a);
					h.name = j.name;
					h.args = j.args
				} catch (k) {}
				h.args = h.args || [];
				break;
			case "json":
				try {
					h.data = g.parse(a)
				} catch (k) {}
				break;
			case "connect":
				h.qs = a || "";
				break;
			case "ack":
				var b = a.match(/^([0-9]+)(\+)?(.*)/);
				if (b) {
					h.ackId = b[1];
					h.args = [];
					if (b[3]) {
						try {
							h.args = b[3] ? g.parse(b[3]) : []
						} catch (k) {}
					}
				}
				break;
			case "disconnect":
			case "heartbeat":
				break
			}
			return h
		};
		c.decodePayload = function (a) {
			if (a.charAt(0) == "ï¿½") {
				var b = [];
				for (var d = 1, e = ""; d < a.length; d++) {
					if (a.charAt(d) == "ï¿½") {
						b.push(c.decodePacket(a.substr(d + 1).substr(0, e)));
						d += Number(e) + 1;
						e = ""
					} else {
						e += a.charAt(d)
					}
				}
				return b
			} else {
				return [c.decodePacket(a)]
			}
		}
	})("undefined" != typeof this.io ? this.io : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports);
	(function (a, b) {
		function c(a, b) {
			this.socket = a;
			this.sessid = b
		}
		a.Transport = c;
		b.util.mixin(c, b.EventEmitter);
		c.prototype.onData = function (a) {
			this.clearCloseTimeout();
			if (this.connected || this.connecting || this.reconnecting) {
				this.setCloseTimeout()
			}
			if (a !== "") {
				var c = b.parser.decodePayload(a);
				if (c && c.length) {
					for (var d = 0, e = c.length; d < e; d++) {
						this.onPacket(c[d])
					}
				}
			}
			return this
		};
		c.prototype.onPacket = function (a) {
			if (a.type == "heartbeat") {
				return this.onHeartbeat()
			}
			if (a.type == "connect" && a.endpoint == "") {
				this.onConnect()
			}
			this.socket.onPacket(a);
			return this
		};
		c.prototype.setCloseTimeout = function () {
			if (!this.closeTimeout) {
				var a = this;
				this.closeTimeout = setTimeout(function () {
					a.onDisconnect()
				}, this.socket.closeTimeout)
			}
		};
		c.prototype.onDisconnect = function () {
			if (this.close && this.open) this.close();
			this.clearTimeouts();
			this.socket.onDisconnect();
			return this
		};
		c.prototype.onConnect = function () {
			this.socket.onConnect();
			return this
		};
		c.prototype.clearCloseTimeout = function () {
			if (this.closeTimeout) {
				clearTimeout(this.closeTimeout);
				this.closeTimeout = null
			}
		};
		c.prototype.clearTimeouts = function () {
			this.clearCloseTimeout();
			if (this.reopenTimeout) {
				clearTimeout(this.reopenTimeout)
			}
		};
		c.prototype.packet = function (a) {
			this.send(b.parser.encodePacket(a))
		};
		c.prototype.onHeartbeat = function (a) {
			this.packet({
				type: "heartbeat"
			})
		};
		c.prototype.onOpen = function () {
			this.open = true;
			this.clearCloseTimeout();
			this.socket.onOpen()
		};
		c.prototype.onClose = function () {
			var a = this;
			this.open = false;
			this.socket.onClose();
			this.onDisconnect()
		};
		c.prototype.prepareUrl = function () {
			var a = this.socket.options;
			return this.scheme() + "://" + a.host + ":" + a.port + "/" + a.resource + "/" + b.protocol + "/" + this.name + "/" + this.sessid
		};
		c.prototype.ready = function (a, b) {
			b.call(this)
		}
	})("undefined" != typeof this.io ? this.io : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports);
	(function (a, b, c) {
		function e() {}
		function d(a) {
			this.options = {
				port: 80,
				secure: false,
				document: "document" in c ? document : false,
				resource: "socket.io",
				transports: b.transports,
				"connect timeout": 1e4,
				"try multiple transports": true,
				reconnect: true,
				"reconnection delay": 500,
				"reconnection limit": Infinity,
				"reopen delay": 3e3,
				"max reconnection attempts": 10,
				"sync disconnect on unload": true,
				"auto connect": true,
				"flash policy port": 10843
			};
			b.util.merge(this.options, a);
			this.connected = false;
			this.open = false;
			this.connecting = false;
			this.reconnecting = false;
			this.namespaces = {};
			this.buffer = [];
			this.doBuffer = false;
			if (this.options["sync disconnect on unload"] && (!this.isXDomain() || b.util.ua.hasCORS)) {
				var d = this;
				b.util.on(c, "beforeunload", function () {
					d.disconnectSync()
				}, false)
			}
			if (this.options["auto connect"]) {
				this.connect()
			}
		}
		a.Socket = d;
		b.util.mixin(d, b.EventEmitter);
		d.prototype.of = function (a) {
			if (!this.namespaces[a]) {
				this.namespaces[a] = new b.SocketNamespace(this, a);
				if (a !== "") {
					this.namespaces[a].packet({
						type: "connect"
					})
				}
			}
			return this.namespaces[a]
		};
		d.prototype.publish = function () {
			this.emit.apply(this, arguments);
			var a;
			for (var b in this.namespaces) {
				if (this.namespaces.hasOwnProperty(b)) {
					a = this.of(b);
					a.$emit.apply(a, arguments)
				}
			}
		};
		d.prototype.handshake = function (a) {
			function f(b) {
				if (b instanceof Error) {
					c.onError(b.message)
				} else {
					a.apply(null, b.split(":"))
				}
			}
			var c = this,
				d = this.options;
			var g = ["http" + (d.secure ? "s" : "") + ":/", d.host + ":" + d.port, d.resource, b.protocol, b.util.query(this.options.query, "t=" + +(new Date))].join("/");
			if (this.isXDomain() && !b.util.ua.hasCORS) {
				var h = document.getElementsByTagName("script")[0],
					i = document.createElement("script");
				i.src = g + "&jsonp=" + b.j.length;
				h.parentNode.insertBefore(i, h);
				b.j.push(function (a) {
					f(a);
					i.parentNode.removeChild(i)
				})
			} else {
				var j = b.util.request();
				j.open("GET", g, true);
				j.onreadystatechange = function () {
					if (j.readyState == 4) {
						j.onreadystatechange = e;
						if (j.status == 200) {
							f(j.responseText)
						} else {
							!c.reconnecting && c.onError(j.responseText)
						}
					}
				};
				j.send(null)
			}
		};
		d.prototype.getTransport = function (a) {
			var c = a || this.transports,
				d;
			for (var e = 0, f; f = c[e]; e++) {
				if (b.Transport[f] && b.Transport[f].check(this) && (!this.isXDomain() || b.Transport[f].xdomainCheck())) {
					return new b.Transport[f](this, this.sessionid)
				}
			}
			return null
		};
		d.prototype.connect = function (a) {
			if (this.connecting) {
				return this
			}
			var c = this;
			this.handshake(function (d, e, f, g) {
				function h(a) {
					if (c.transport) c.transport.clearTimeouts();
					c.transport = c.getTransport(a);
					if (!c.transport) return c.publish("connect_failed");
					c.transport.ready(c, function () {
						c.connecting = true;
						c.publish("connecting", c.transport.name);
						c.transport.open();
						if (c.options["connect timeout"]) {
							c.connectTimeoutTimer = setTimeout(function () {
								if (!c.connected) {
									c.connecting = false;
									if (c.options["try multiple transports"]) {
										if (!c.remainingTransports) {
											c.remainingTransports = c.transports.slice(0)
										}
										var a = c.remainingTransports;
										while (a.length > 0 && a.splice(0, 1)[0] != c.transport.name) {}
										if (a.length) {
											h(a)
										} else {
											c.publish("connect_failed")
										}
									}
								}
							}, c.options["connect timeout"])
						}
					})
				}
				c.sessionid = d;
				c.closeTimeout = f * 1e3;
				c.heartbeatTimeout = e * 1e3;
				c.transports = b.util.intersect(g.split(","), c.options.transports);
				h();
				c.once("connect", function () {
					clearTimeout(c.connectTimeoutTimer);
					a && typeof a == "function" && a()
				})
			});
			return this
		};
		d.prototype.packet = function (a) {
			if (this.connected && !this.doBuffer) {
				this.transport.packet(a)
			} else {
				this.buffer.push(a)
			}
			return this
		};
		d.prototype.setBuffer = function (a) {
			this.doBuffer = a;
			if (!a && this.connected && this.buffer.length) {
				this.transport.payload(this.buffer);
				this.buffer = []
			}
		};
		d.prototype.disconnect = function () {
			if (this.connected) {
				if (this.open) {
					this.of("").packet({
						type: "disconnect"
					})
				}
				this.onDisconnect("booted")
			}
			return this
		};
		d.prototype.disconnectSync = function () {
			var a = b.util.request(),
				c = this.resource + "/" + b.protocol + "/" + this.sessionid;
			a.open("GET", c, true);
			this.onDisconnect("booted")
		};
		d.prototype.isXDomain = function () {
			var a = c.location.port || ("https:" == c.location.protocol ? 443 : 80);
			return this.options.host !== c.location.hostname || this.options.port != a
		};
		d.prototype.onConnect = function () {
			if (!this.connected) {
				this.connected = true;
				this.connecting = false;
				if (!this.doBuffer) {
					this.setBuffer(false)
				}
				this.emit("connect")
			}
		};
		d.prototype.onOpen = function () {
			this.open = true
		};
		d.prototype.onClose = function () {
			this.open = false
		};
		d.prototype.onPacket = function (a) {
			this.of(a.endpoint).onPacket(a)
		};
		d.prototype.onError = function (a) {
			if (a && a.advice) {
				if (a.advice === "reconnect" && this.connected) {
					this.disconnect();
					this.reconnect()
				}
			}
			this.publish("error", a && a.reason ? a.reason : a)
		};
		d.prototype.onDisconnect = function (a) {
			var b = this.connected;
			this.connected = false;
			this.connecting = false;
			this.open = false;
			if (b) {
				this.transport.close();
				this.transport.clearTimeouts();
				this.publish("disconnect", a);
				if ("booted" != a && this.options.reconnect && !this.reconnecting) {
					this.reconnect()
				}
			}
		};
		d.prototype.reconnect = function () {
			function f() {
				if (!a.reconnecting) {
					return
				}
				if (a.connected) {
					return e()
				}
				if (a.connecting && a.reconnecting) {
					return a.reconnectionTimer = setTimeout(f, 1e3)
				}
				if (a.reconnectionAttempts++ >= b) {
					if (!a.redoTransports) {
						a.on("connect_failed", f);
						a.options["try multiple transports"] = true;
						a.transport = a.getTransport();
						a.redoTransports = true;
						a.connect()
					} else {
						a.publish("reconnect_failed");
						e()
					}
				} else {
					if (a.reconnectionDelay < d) {
						a.reconnectionDelay *= 2
					}
					a.connect();
					a.publish("reconnecting", a.reconnectionDelay, a.reconnectionAttempts);
					a.reconnectionTimer = setTimeout(f, a.reconnectionDelay)
				}
			}
			function e() {
				if (a.connected) {
					for (var b in a.namespaces) {
						if (a.namespaces.hasOwnProperty(b) && "" !== b) {
							a.namespaces[b].packet({
								type: "connect"
							})
						}
					}
					a.publish("reconnect", a.transport.name, a.reconnectionAttempts)
				}
				a.removeListener("connect_failed", f);
				a.removeListener("connect", f);
				a.reconnecting = false;
				delete a.reconnectionAttempts;
				delete a.reconnectionDelay;
				delete a.reconnectionTimer;
				delete a.redoTransports;
				a.options["try multiple transports"] = c
			}
			this.reconnecting = true;
			this.reconnectionAttempts = 0;
			this.reconnectionDelay = this.options["reconnection delay"];
			var a = this,
				b = this.options["max reconnection attempts"],
				c = this.options["try multiple transports"],
				d = this.options["reconnection limit"];
			this.options["try multiple transports"] = false;
			this.reconnectionTimer = setTimeout(f, this.reconnectionDelay);
			this.on("connect", f)
		}
	})("undefined" != typeof this.io ? this.io : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports, window);
	(function (a, b) {
		function d(a, b) {
			this.namespace = a;
			this.name = b
		}
		function c(a, b) {
			this.socket = a;
			this.name = b || "";
			this.flags = {};
			this.json = new d(this, "json");
			this.ackPackets = 0;
			this.acks = {}
		}
		a.SocketNamespace = c;
		b.util.mixin(c, b.EventEmitter);
		c.prototype.$emit = b.EventEmitter.prototype.emit;
		c.prototype.of = function () {
			return this.socket.of.apply(this.socket, arguments)
		};
		c.prototype.packet = function (a) {
			a.endpoint = this.name;
			this.socket.packet(a);
			this.flags = {};
			return this
		};
		c.prototype.send = function (a, b) {
			var c = {
				type: this.flags.json ? "json" : "message",
				data: a
			};
			if ("function" == typeof b) {
				c.id = ++this.ackPackets;
				c.ack = true;
				this.acks[c.id] = b
			}
			return this.packet(c)
		};
		c.prototype.emit = function (a) {
			var b = Array.prototype.slice.call(arguments, 1),
				c = b[b.length - 1],
				d = {
					type: "event",
					name: a
				};
			if ("function" == typeof c) {
				d.id = ++this.ackPackets;
				d.ack = "data";
				this.acks[d.id] = c;
				b = b.slice(0, b.length - 1)
			}
			d.args = b;
			return this.packet(d)
		};
		c.prototype.disconnect = function () {
			if (this.name === "") {
				this.socket.disconnect()
			} else {
				this.packet({
					type: "disconnect"
				});
				this.$emit("disconnect")
			}
			return this
		};
		c.prototype.onPacket = function (a) {
			function d() {
				c.packet({
					type: "ack",
					args: b.util.toArray(arguments),
					ackId: a.id
				})
			}
			var c = this;
			switch (a.type) {
			case "connect":
				this.$emit("connect");
				break;
			case "disconnect":
				if (this.name === "") {
					this.socket.onDisconnect(a.reason || "booted")
				} else {
					this.$emit("disconnect", a.reason)
				}
				break;
			case "message":
			case "json":
				var e = ["message", a.data];
				if (a.ack == "data") {
					e.push(d)
				} else if (a.ack) {
					this.packet({
						type: "ack",
						ackId: a.id
					})
				}
				this.$emit.apply(this, e);
				break;
			case "event":
				var e = [a.name].concat(a.args);
				if (a.ack == "data") e.push(d);
				this.$emit.apply(this, e);
				break;
			case "ack":
				if (this.acks[a.ackId]) {
					this.acks[a.ackId].apply(this, a.args);
					delete this.acks[a.ackId]
				}
				break;
			case "error":
				if (a.advice) {
					this.socket.onError(a)
				} else {
					if (a.reason == "unauthorized") {
						this.$emit("connect_failed", a.reason)
					} else {
						this.$emit("error", a.reason)
					}
				}
				break
			}
		};
		d.prototype.send = function () {
			this.namespace.flags[this.name] = true;
			this.namespace.send.apply(this.namespace, arguments)
		};
		d.prototype.emit = function () {
			this.namespace.flags[this.name] = true;
			this.namespace.emit.apply(this.namespace, arguments)
		}
	})("undefined" != typeof this.io ? this.io : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports);
	(function (a, b, c) {
		function d(a) {
			b.Transport.apply(this, arguments)
		}
		a.websocket = d;
		b.util.inherit(d, b.Transport);
		d.prototype.name = "websocket";
		d.prototype.open = function () {
			var a = b.util.query(this.socket.options.query),
				d = this,
				e;
			if (!e) {
				e = c.MozWebSocket || c.WebSocket
			}
			this.websocket = new e(this.prepareUrl() + a);
			this.websocket.onopen = function () {
				d.onOpen();
				d.socket.setBuffer(false)
			};
			this.websocket.onmessage = function (a) {
				d.onData(a.data)
			};
			this.websocket.onclose = function () {
				d.onClose();
				d.socket.setBuffer(true)
			};
			this.websocket.onerror = function (a) {
				d.onError(a)
			};
			return this
		};
		d.prototype.send = function (a) {
			this.websocket.send(a);
			return this
		};
		d.prototype.payload = function (a) {
			for (var b = 0, c = a.length; b < c; b++) {
				this.packet(a[b])
			}
			return this
		};
		d.prototype.close = function () {
			this.websocket.close();
			return this
		};
		d.prototype.onError = function (a) {
			this.socket.onError(a)
		};
		d.prototype.scheme = function () {
			return this.socket.options.secure ? "wss" : "ws"
		};
		d.check = function () {
			return "WebSocket" in c && !("__addTask" in WebSocket) || "MozWebSocket" in c
		};
		d.xdomainCheck = function () {
			return true
		};
		b.transports.push("websocket")
	})("undefined" != typeof this.io ? this.io.Transport : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports, window);
	(function (a, b, c) {
		function e() {}
		function d(a) {
			if (!a) return;
			b.Transport.apply(this, arguments);
			this.sendBuffer = []
		}
		a.XHR = d;
		b.util.inherit(d, b.Transport);
		d.prototype.open = function () {
			this.socket.setBuffer(false);
			this.onOpen();
			this.get();
			this.setCloseTimeout();
			return this
		};
		d.prototype.payload = function (a) {
			var c = [];
			for (var d = 0, e = a.length; d < e; d++) {
				c.push(b.parser.encodePacket(a[d]))
			}
			this.send(b.parser.encodePayload(c))
		};
		d.prototype.send = function (a) {
			this.post(a);
			return this
		};
		d.prototype.post = function (a) {
			function f() {
				this.onload = e;
				b.socket.setBuffer(false)
			}
			function d() {
				if (this.readyState == 4) {
					this.onreadystatechange = e;
					b.posting = false;
					if (this.status == 200) {
						b.socket.setBuffer(false)
					} else {
						b.onClose()
					}
				}
			}
			var b = this;
			this.socket.setBuffer(true);
			this.sendXHR = this.request("POST");
			if (c.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
				this.sendXHR.onload = this.sendXHR.onerror = f
			} else {
				this.sendXHR.onreadystatechange = d
			}
			this.sendXHR.send(a)
		};
		d.prototype.close = function () {
			this.onClose();
			return this
		};
		d.prototype.request = function (a) {
			var c = b.util.request(this.socket.isXDomain()),
				d = b.util.query(this.socket.options.query, "t=" + +(new Date));
			c.open(a || "GET", this.prepareUrl() + d, true);
			if (a == "POST") {
				try {
					if (c.setRequestHeader) {
						c.setRequestHeader("Content-type", "text/plain;charset=UTF-8")
					} else {
						c.contentType = "text/plain"
					}
				} catch (e) {}
			}
			return c
		};
		d.prototype.scheme = function () {
			return this.socket.options.secure ? "https" : "http"
		};
		d.check = function (a, c) {
			try {
				if (b.util.request(c)) {
					return true
				}
			} catch (d) {}
			return false
		};
		d.xdomainCheck = function () {
			return d.check(null, true)
		}
	})("undefined" != typeof this.io ? this.io.Transport : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports, window);
	(function (a, b) {
		function c(a) {
			b.Transport.XHR.apply(this, arguments)
		}
		a.htmlfile = c;
		b.util.inherit(c, b.Transport.XHR);
		c.prototype.name = "htmlfile";
		c.prototype.get = function () {
			this.doc = new ActiveXObject("htmlfile");
			this.doc.open();
			this.doc.write("<html></html>");
			this.doc.close();
			this.doc.parentWindow.s = this;
			var a = this.doc.createElement("div");
			a.className = "socketio";
			this.doc.body.appendChild(a);
			this.iframe = this.doc.createElement("iframe");
			a.appendChild(this.iframe);
			var c = this,
				d = b.util.query(this.socket.options.query, "t=" + +(new Date));
			this.iframe.src = this.prepareUrl() + d;
			b.util.on(window, "unload", function () {
				c.destroy()
			})
		};
		c.prototype._ = function (a, b) {
			this.onData(a);
			try {
				var c = b.getElementsByTagName("script")[0];
				c.parentNode.removeChild(c)
			} catch (d) {}
		};
		c.prototype.destroy = function () {
			if (this.iframe) {
				try {
					this.iframe.src = "about:blank"
				} catch (a) {}
				this.doc = null;
				this.iframe.parentNode.removeChild(this.iframe);
				this.iframe = null;
				CollectGarbage()
			}
		};
		c.prototype.close = function () {
			this.destroy();
			return b.Transport.XHR.prototype.close.call(this)
		};
		c.check = function () {
			if ("ActiveXObject" in window) {
				try {
					var a = new ActiveXObject("htmlfile");
					return a && b.Transport.XHR.check()
				} catch (c) {}
			}
			return false
		};
		c.xdomainCheck = function () {
			return false
		};
		b.transports.push("htmlfile")
	})("undefined" != typeof this.io ? this.io.Transport : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports);
	(function (a, b, c) {
		function e() {}
		function d() {
			b.Transport.XHR.apply(this, arguments)
		}
		a["xhr-polling"] = d;
		b.util.inherit(d, b.Transport.XHR);
		b.util.merge(d, b.Transport.XHR);
		d.prototype.name = "xhr-polling";
		d.prototype.open = function () {
			var a = this;
			b.Transport.XHR.prototype.open.call(a);
			return false
		};
		d.prototype.get = function () {
			function d() {
				this.onload = e;
				a.onData(this.responseText);
				a.get()
			}
			function b() {
				if (this.readyState == 4) {
					this.onreadystatechange = e;
					if (this.status == 200) {
						a.onData(this.responseText);
						a.get()
					} else {
						a.onClose()
					}
				}
			}
			if (!this.open) return;
			var a = this;
			this.xhr = this.request();
			if (c.XDomainRequest && this.xhr instanceof XDomainRequest) {
				this.xhr.onload = this.xhr.onerror = d
			} else {
				this.xhr.onreadystatechange = b
			}
			this.xhr.send(null)
		};
		d.prototype.onClose = function () {
			b.Transport.XHR.prototype.onClose.call(this);
			if (this.xhr) {
				this.xhr.onreadystatechange = this.xhr.onload = e;
				try {
					this.xhr.abort()
				} catch (a) {}
				this.xhr = null
			}
		};
		d.prototype.ready = function (a, c) {
			var d = this;
			b.util.defer(function () {
				c.call(d)
			})
		};
		b.transports.push("xhr-polling")
	})("undefined" != typeof this.io ? this.io.Transport : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports, window);
	(function (a, b, c) {
		function e(a) {
			b.Transport["xhr-polling"].apply(this, arguments);
			this.index = b.j.length;
			var c = this;
			b.j.push(function (a) {
				c._(a)
			})
		}
		var d = c.document && "MozAppearance" in c.document.documentElement.style;
		a["jsonp-polling"] = e;
		b.util.inherit(e, b.Transport["xhr-polling"]);
		e.prototype.name = "jsonp-polling";
		e.prototype.post = function (a) {
			function j() {
				if (c.iframe) {
					c.form.removeChild(c.iframe)
				}
				try {
					h = document.createElement('<iframe name="' + c.iframeId + '">')
				} catch (a) {
					h = document.createElement("iframe");
					h.name = c.iframeId
				}
				h.id = c.iframeId;
				c.form.appendChild(h);
				c.iframe = h
			}
			function i() {
				j();
				c.socket.setBuffer(false)
			}
			var c = this,
				d = b.util.query(this.socket.options.query, "t=" + +(new Date) + "&i=" + this.index);
			if (!this.form) {
				var e = document.createElement("form"),
					f = document.createElement("textarea"),
					g = this.iframeId = "socketio_iframe_" + this.index,
					h;
				e.className = "socketio";
				e.style.position = "absolute";
				e.style.top = "-1000px";
				e.style.left = "-1000px";
				e.target = g;
				e.method = "POST";
				e.setAttribute("accept-charset", "utf-8");
				f.name = "d";
				e.appendChild(f);
				document.body.appendChild(e);
				this.form = e;
				this.area = f
			}
			this.form.action = this.prepareUrl() + d;
			j();
			this.area.value = b.JSON.stringify(a);
			try {
				this.form.submit()
			} catch (k) {}
			if (this.iframe.attachEvent) {
				h.onreadystatechange = function () {
					if (c.iframe.readyState == "complete") {
						i()
					}
				}
			} else {
				this.iframe.onload = i
			}
			this.socket.setBuffer(true)
		};
		e.prototype.get = function () {
			var a = this,
				c = document.createElement("script"),
				e = b.util.query(this.socket.options.query, "t=" + +(new Date) + "&i=" + this.index);
			if (this.script) {
				this.script.parentNode.removeChild(this.script);
				this.script = null
			}
			c.async = true;
			c.src = this.prepareUrl() + e;
			c.onerror = function () {
				a.onClose()
			};
			var f = document.getElementsByTagName("script")[0];
			f.parentNode.insertBefore(c, f);
			this.script = c;
			if (d) {
				setTimeout(function () {
					var a = document.createElement("iframe");
					document.body.appendChild(a);
					document.body.removeChild(a)
				}, 100)
			}
		};
		e.prototype._ = function (a) {
			this.onData(a);
			if (this.open) {
				this.get()
			}
			return this
		};
		e.prototype.ready = function (a, c) {
			var e = this;
			if (!d) return c.call(this);
			b.util.load(function () {
				c.call(e)
			})
		};
		e.check = function () {
			return "document" in c
		};
		e.xdomainCheck = function () {
			return true
		};
		b.transports.push("jsonp-polling")
	})("undefined" != typeof this.io ? this.io.Transport : module.exports, "undefined" != typeof this.io ? this.io : module.parent.exports, window)
}).call(redditlive)