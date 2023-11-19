(function(f) {
	if (typeof exports === "object" && typeof module !== "undefined") {
		module.exports = f();
	} else if (typeof define === "function" && define.amd) {
		define([], f);
	} else {
		var g;
		if (typeof window !== "undefined") {
			g = window;
		} else if (typeof global !== "undefined") {
			g = global;
		} else if (typeof self !== "undefined") {
			g = self;
		} else {
			g = this;
		}
		g.htmlparser2 = f();
	}
})(function() {
	var define, module, exports;
	return (function() {
		function r(e, n, t) {
			function o(i, f) {
				if (!n[i]) {
					if (!e[i]) {
						var c = "function" == typeof require && require;
						if (!f && c) return c(i, !0);
						if (u) return u(i, !0);
						var a = new Error("Cannot find module '" + i + "'");
						throw ((a.code = "MODULE_NOT_FOUND"), a);
					}
					var p = (n[i] = { exports: {} });
					e[i][0].call(
						p.exports,
						function(r) {
							var n = e[i][1][r];
							return o(n || r);
						},
						p,
						p.exports,
						r,
						e,
						n,
						t,
					);
				}
				return n[i].exports;
			}
			for (
				var u = "function" == typeof require && require, i = 0;
				i < t.length;
				i++
			)
				o(t[i]);
			return o;
		}
		return r;
	})()(
		{
			1: [function(require, module, exports) {}, {}],
			2: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					var objectCreate = Object.create || objectCreatePolyfill;
					var objectKeys = Object.keys || objectKeysPolyfill;
					var bind = Function.prototype.bind || functionBindPolyfill;

					function EventEmitter() {
						if (
							!this._events ||
							!Object.prototype.hasOwnProperty.call(this, "_events")
						) {
							this._events = objectCreate(null);
							this._eventsCount = 0;
						}

						this._maxListeners = this._maxListeners || undefined;
					}
					module.exports = EventEmitter;

					// Backwards-compat with node 0.10.x
					EventEmitter.EventEmitter = EventEmitter;

					EventEmitter.prototype._events = undefined;
					EventEmitter.prototype._maxListeners = undefined;

					// By default EventEmitters will print a warning if more than 10 listeners are
					// added to it. This is a useful default which helps finding memory leaks.
					var defaultMaxListeners = 10;

					var hasDefineProperty;
					try {
						var o = {};
						if (Object.defineProperty)
							Object.defineProperty(o, "x", { value: 0 });
						hasDefineProperty = o.x === 0;
					} catch (err) {
						hasDefineProperty = false;
					}
					if (hasDefineProperty) {
						Object.defineProperty(EventEmitter, "defaultMaxListeners", {
							enumerable: true,
							get: function() {
								return defaultMaxListeners;
							},
							set: function(arg) {
								// check whether the input is a positive number (whose value is zero or
								// greater and not a NaN).
								if (typeof arg !== "number" || arg < 0 || arg !== arg)
									throw new TypeError(
										'"defaultMaxListeners" must be a positive number',
									);
								defaultMaxListeners = arg;
							},
						});
					} else {
						EventEmitter.defaultMaxListeners = defaultMaxListeners;
					}

					// Obviously not all Emitters should be limited to 10. This function allows
					// that to be increased. Set to zero for unlimited.
					EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
						if (typeof n !== "number" || n < 0 || isNaN(n))
							throw new TypeError('"n" argument must be a positive number');
						this._maxListeners = n;
						return this;
					};

					function $getMaxListeners(that) {
						if (that._maxListeners === undefined)
							return EventEmitter.defaultMaxListeners;
						return that._maxListeners;
					}

					EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
						return $getMaxListeners(this);
					};

					// These standalone emit* functions are used to optimize calling of event
					// handlers for fast cases because emit() itself often has a variable number of
					// arguments and can be deoptimized because of that. These functions always have
					// the same number of arguments and thus do not get deoptimized, so the code
					// inside them can execute faster.
					function emitNone(handler, isFn, self) {
						if (isFn) handler.call(self);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].call(self);
						}
					}
					function emitOne(handler, isFn, self, arg1) {
						if (isFn) handler.call(self, arg1);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].call(self, arg1);
						}
					}
					function emitTwo(handler, isFn, self, arg1, arg2) {
						if (isFn) handler.call(self, arg1, arg2);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2);
						}
					}
					function emitThree(handler, isFn, self, arg1, arg2, arg3) {
						if (isFn) handler.call(self, arg1, arg2, arg3);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i)
								listeners[i].call(self, arg1, arg2, arg3);
						}
					}

					function emitMany(handler, isFn, self, args) {
						if (isFn) handler.apply(self, args);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].apply(self, args);
						}
					}

					EventEmitter.prototype.emit = function emit(type) {
						var er, handler, len, args, i, events;
						var doError = type === "error";

						events = this._events;
						if (events) doError = doError && events.error == null;
						else if (!doError) return false;

						// If there is no 'error' event listener then throw.
						if (doError) {
							if (arguments.length > 1) er = arguments[1];
							if (er instanceof Error) {
								throw er; // Unhandled 'error' event
							} else {
								// At least give some kind of context to the user
								var err = new Error('Unhandled "error" event. (' + er + ")");
								err.context = er;
								throw err;
							}
							return false;
						}

						handler = events[type];

						if (!handler) return false;

						var isFn = typeof handler === "function";
						len = arguments.length;
						switch (len) {
							// fast cases
							case 1:
								emitNone(handler, isFn, this);
								break;
							case 2:
								emitOne(handler, isFn, this, arguments[1]);
								break;
							case 3:
								emitTwo(handler, isFn, this, arguments[1], arguments[2]);
								break;
							case 4:
								emitThree(
									handler,
									isFn,
									this,
									arguments[1],
									arguments[2],
									arguments[3],
								);
								break;
							// slower
							default:
								args = new Array(len - 1);
								for (i = 1; i < len; i++) args[i - 1] = arguments[i];
								emitMany(handler, isFn, this, args);
						}

						return true;
					};

					function _addListener(target, type, listener, prepend) {
						var m;
						var events;
						var existing;

						if (typeof listener !== "function")
							throw new TypeError('"listener" argument must be a function');

						events = target._events;
						if (!events) {
							events = target._events = objectCreate(null);
							target._eventsCount = 0;
						} else {
							// To avoid recursion in the case that type === "newListener"! Before
							// adding it to the listeners, first emit "newListener".
							if (events.newListener) {
								target.emit(
									"newListener",
									type,
									listener.listener ? listener.listener : listener,
								);

								// Re-assign `events` because a newListener handler could have caused the
								// this._events to be assigned to a new object
								events = target._events;
							}
							existing = events[type];
						}

						if (!existing) {
							// Optimize the case of one listener. Don't need the extra array object.
							existing = events[type] = listener;
							++target._eventsCount;
						} else {
							if (typeof existing === "function") {
								// Adding the second element, need to change to array.
								existing = events[type] = prepend
									? [listener, existing]
									: [existing, listener];
							} else {
								// If we've already got an array, just append.
								if (prepend) {
									existing.unshift(listener);
								} else {
									existing.push(listener);
								}
							}

							// Check for listener leak
							if (!existing.warned) {
								m = $getMaxListeners(target);
								if (m && m > 0 && existing.length > m) {
									existing.warned = true;
									var w = new Error(
										"Possible EventEmitter memory leak detected. " +
											existing.length +
											' "' +
											String(type) +
											'" listeners ' +
											"added. Use emitter.setMaxListeners() to " +
											"increase limit.",
									);
									w.name = "MaxListenersExceededWarning";
									w.emitter = target;
									w.type = type;
									w.count = existing.length;
									if (typeof console === "object" && console.warn) {
										console.warn("%s: %s", w.name, w.message);
									}
								}
							}
						}

						return target;
					}

					EventEmitter.prototype.addListener = function addListener(
						type,
						listener,
					) {
						return _addListener(this, type, listener, false);
					};

					EventEmitter.prototype.on = EventEmitter.prototype.addListener;

					EventEmitter.prototype.prependListener = function prependListener(
						type,
						listener,
					) {
						return _addListener(this, type, listener, true);
					};

					function onceWrapper() {
						if (!this.fired) {
							this.target.removeListener(this.type, this.wrapFn);
							this.fired = true;
							switch (arguments.length) {
								case 0:
									return this.listener.call(this.target);
								case 1:
									return this.listener.call(this.target, arguments[0]);
								case 2:
									return this.listener.call(
										this.target,
										arguments[0],
										arguments[1],
									);
								case 3:
									return this.listener.call(
										this.target,
										arguments[0],
										arguments[1],
										arguments[2],
									);
								default:
									var args = new Array(arguments.length);
									for (var i = 0; i < args.length; ++i) args[i] = arguments[i];
									this.listener.apply(this.target, args);
							}
						}
					}

					function _onceWrap(target, type, listener) {
						var state = {
							fired: false,
							wrapFn: undefined,
							target: target,
							type: type,
							listener: listener,
						};
						var wrapped = bind.call(onceWrapper, state);
						wrapped.listener = listener;
						state.wrapFn = wrapped;
						return wrapped;
					}

					EventEmitter.prototype.once = function once(type, listener) {
						if (typeof listener !== "function")
							throw new TypeError('"listener" argument must be a function');
						this.on(type, _onceWrap(this, type, listener));
						return this;
					};

					EventEmitter.prototype.prependOnceListener = function prependOnceListener(
						type,
						listener,
					) {
						if (typeof listener !== "function")
							throw new TypeError('"listener" argument must be a function');
						this.prependListener(type, _onceWrap(this, type, listener));
						return this;
					};

					// Emits a 'removeListener' event if and only if the listener was removed.
					EventEmitter.prototype.removeListener = function removeListener(
						type,
						listener,
					) {
						var list, events, position, i, originalListener;

						if (typeof listener !== "function")
							throw new TypeError('"listener" argument must be a function');

						events = this._events;
						if (!events) return this;

						list = events[type];
						if (!list) return this;

						if (list === listener || list.listener === listener) {
							if (--this._eventsCount === 0) this._events = objectCreate(null);
							else {
								delete events[type];
								if (events.removeListener)
									this.emit("removeListener", type, list.listener || listener);
							}
						} else if (typeof list !== "function") {
							position = -1;

							for (i = list.length - 1; i >= 0; i--) {
								if (list[i] === listener || list[i].listener === listener) {
									originalListener = list[i].listener;
									position = i;
									break;
								}
							}

							if (position < 0) return this;

							if (position === 0) list.shift();
							else spliceOne(list, position);

							if (list.length === 1) events[type] = list[0];

							if (events.removeListener)
								this.emit("removeListener", type, originalListener || listener);
						}

						return this;
					};

					EventEmitter.prototype.removeAllListeners = function removeAllListeners(
						type,
					) {
						var listeners, events, i;

						events = this._events;
						if (!events) return this;

						// not listening for removeListener, no need to emit
						if (!events.removeListener) {
							if (arguments.length === 0) {
								this._events = objectCreate(null);
								this._eventsCount = 0;
							} else if (events[type]) {
								if (--this._eventsCount === 0)
									this._events = objectCreate(null);
								else delete events[type];
							}
							return this;
						}

						// emit removeListener for all listeners on all events
						if (arguments.length === 0) {
							var keys = objectKeys(events);
							var key;
							for (i = 0; i < keys.length; ++i) {
								key = keys[i];
								if (key === "removeListener") continue;
								this.removeAllListeners(key);
							}
							this.removeAllListeners("removeListener");
							this._events = objectCreate(null);
							this._eventsCount = 0;
							return this;
						}

						listeners = events[type];

						if (typeof listeners === "function") {
							this.removeListener(type, listeners);
						} else if (listeners) {
							// LIFO order
							for (i = listeners.length - 1; i >= 0; i--) {
								this.removeListener(type, listeners[i]);
							}
						}

						return this;
					};

					function _listeners(target, type, unwrap) {
						var events = target._events;

						if (!events) return [];

						var evlistener = events[type];
						if (!evlistener) return [];

						if (typeof evlistener === "function")
							return unwrap
								? [evlistener.listener || evlistener]
								: [evlistener];

						return unwrap
							? unwrapListeners(evlistener)
							: arrayClone(evlistener, evlistener.length);
					}

					EventEmitter.prototype.listeners = function listeners(type) {
						return _listeners(this, type, true);
					};

					EventEmitter.prototype.rawListeners = function rawListeners(type) {
						return _listeners(this, type, false);
					};

					EventEmitter.listenerCount = function(emitter, type) {
						if (typeof emitter.listenerCount === "function") {
							return emitter.listenerCount(type);
						} else {
							return listenerCount.call(emitter, type);
						}
					};

					EventEmitter.prototype.listenerCount = listenerCount;
					function listenerCount(type) {
						var events = this._events;

						if (events) {
							var evlistener = events[type];

							if (typeof evlistener === "function") {
								return 1;
							} else if (evlistener) {
								return evlistener.length;
							}
						}

						return 0;
					}

					EventEmitter.prototype.eventNames = function eventNames() {
						return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
					};

					// About 1.5x faster than the two-arg version of Array#splice().
					function spliceOne(list, index) {
						for (
							var i = index, k = i + 1, n = list.length;
							k < n;
							i += 1, k += 1
						)
							list[i] = list[k];
						list.pop();
					}

					function arrayClone(arr, n) {
						var copy = new Array(n);
						for (var i = 0; i < n; ++i) copy[i] = arr[i];
						return copy;
					}

					function unwrapListeners(arr) {
						var ret = new Array(arr.length);
						for (var i = 0; i < ret.length; ++i) {
							ret[i] = arr[i].listener || arr[i];
						}
						return ret;
					}

					function objectCreatePolyfill(proto) {
						var F = function() {};
						F.prototype = proto;
						return new F();
					}
					function objectKeysPolyfill(obj) {
						var keys = [];
						for (var k in obj)
							if (Object.prototype.hasOwnProperty.call(obj, k)) {
								keys.push(k);
							}
						return k;
					}
					function functionBindPolyfill(context) {
						var fn = this;
						return function() {
							return fn.apply(context, arguments);
						};
					}
				},
				{},
			],
			3: [
				function(require, module, exports) {
					"use strict";
					var __extends =
						(this && this.__extends) ||
						(function() {
							var extendStatics = function(d, b) {
								extendStatics =
									Object.setPrototypeOf ||
									({ __proto__: [] } instanceof Array &&
										function(d, b) {
											d.__proto__ = b;
										}) ||
									function(d, b) {
										for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
									};
								return extendStatics(d, b);
							};
							return function(d, b) {
								extendStatics(d, b);
								function __() {
									this.constructor = d;
								}
								d.prototype =
									b === null
										? Object.create(b)
										: ((__.prototype = b.prototype), new __());
							};
						})();
					var __spreadArrays =
						(this && this.__spreadArrays) ||
						function() {
							for (var s = 0, i = 0, il = arguments.length; i < il; i++)
								s += arguments[i].length;
							for (var r = Array(s), k = 0, i = 0; i < il; i++)
								for (
									var a = arguments[i], j = 0, jl = a.length;
									j < jl;
									j++, k++
								)
									r[k] = a[j];
							return r;
						};
					var __importDefault =
						(this && this.__importDefault) ||
						function(mod) {
							return mod && mod.__esModule ? mod : { default: mod };
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var MultiplexHandler_1 = __importDefault(
						require("./MultiplexHandler"),
					);
					var CollectingHandler = /** @class */ (function(_super) {
						__extends(CollectingHandler, _super);
						function CollectingHandler(cbs) {
							if (cbs === void 0) {
								cbs = {};
							}
							var _this =
								_super.call(this, function(name) {
									var _a;
									var args = [];
									for (var _i = 1; _i < arguments.length; _i++) {
										args[_i - 1] = arguments[_i];
									}
									_this.events.push(__spreadArrays([name], args));
									// @ts-ignore
									if (_this._cbs[name]) (_a = _this._cbs)[name].apply(_a, args);
								}) || this;
							_this._cbs = cbs;
							_this.events = [];
							return _this;
						}
						CollectingHandler.prototype.onreset = function() {
							this.events = [];
							if (this._cbs.onreset) this._cbs.onreset();
						};
						CollectingHandler.prototype.restart = function() {
							var _a;
							if (this._cbs.onreset) this._cbs.onreset();
							for (var i = 0; i < this.events.length; i++) {
								var _b = this.events[i],
									name_1 = _b[0],
									args = _b.slice(1);
								if (!this._cbs[name_1]) {
									continue;
								}
								// @ts-ignore
								(_a = this._cbs)[name_1].apply(_a, args);
							}
						};
						return CollectingHandler;
					})(MultiplexHandler_1.default);
					exports.CollectingHandler = CollectingHandler;
				},
				{ "./MultiplexHandler": 5 },
			],
			4: [
				function(require, module, exports) {
					"use strict";
					var __extends =
						(this && this.__extends) ||
						(function() {
							var extendStatics = function(d, b) {
								extendStatics =
									Object.setPrototypeOf ||
									({ __proto__: [] } instanceof Array &&
										function(d, b) {
											d.__proto__ = b;
										}) ||
									function(d, b) {
										for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
									};
								return extendStatics(d, b);
							};
							return function(d, b) {
								extendStatics(d, b);
								function __() {
									this.constructor = d;
								}
								d.prototype =
									b === null
										? Object.create(b)
										: ((__.prototype = b.prototype), new __());
							};
						})();
					var __importDefault =
						(this && this.__importDefault) ||
						function(mod) {
							return mod && mod.__esModule ? mod : { default: mod };
						};
					var __importStar =
						(this && this.__importStar) ||
						function(mod) {
							if (mod && mod.__esModule) return mod;
							var result = {};
							if (mod != null)
								for (var k in mod)
									if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
							result["default"] = mod;
							return result;
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var domhandler_1 = __importDefault(require("domhandler"));
					var DomUtils = __importStar(require("domutils"));
					var Parser_1 = require("./Parser");
					//TODO: Consume data as it is coming in
					var FeedHandler = /** @class */ (function(_super) {
						__extends(FeedHandler, _super);
						/**
						 *
						 * @param callback
						 * @param options
						 */
						function FeedHandler(callback, options) {
							var _this = this;
							if (typeof callback === "object" && callback !== null) {
								callback = undefined;
								options = callback;
							}
							_this = _super.call(this, callback, options) || this;
							return _this;
						}
						FeedHandler.prototype.onend = function() {
							var feed = {};
							var feedRoot = getOneElement(isValidFeed, this.dom);
							if (feedRoot) {
								if (feedRoot.name === "feed") {
									var childs = feedRoot.children;
									feed.type = "atom";
									addConditionally(feed, "id", "id", childs);
									addConditionally(feed, "title", "title", childs);
									var href = getAttribute(
										"href",
										getOneElement("link", childs),
									);
									if (href) {
										feed.link = href;
									}
									addConditionally(feed, "description", "subtitle", childs);
									var updated = fetch("updated", childs);
									if (updated) {
										feed.updated = new Date(updated);
									}
									addConditionally(feed, "author", "email", childs, true);
									feed.items = getElements("entry", childs).map(function(item) {
										var entry = {};
										var children = item.children;
										addConditionally(entry, "id", "id", children);
										addConditionally(entry, "title", "title", children);
										var href = getAttribute(
											"href",
											getOneElement("link", children),
										);
										if (href) {
											entry.link = href;
										}
										var description =
											fetch("summary", children) || fetch("content", children);
										if (description) {
											entry.description = description;
										}
										var pubDate = fetch("updated", children);
										if (pubDate) {
											entry.pubDate = new Date(pubDate);
										}
										return entry;
									});
								} else {
									var childs = getOneElement("channel", feedRoot.children)
										.children;
									feed.type = feedRoot.name.substr(0, 3);
									feed.id = "";
									addConditionally(feed, "title", "title", childs);
									addConditionally(feed, "link", "link", childs);
									addConditionally(feed, "description", "description", childs);
									var updated = fetch("lastBuildDate", childs);
									if (updated) {
										feed.updated = new Date(updated);
									}
									addConditionally(
										feed,
										"author",
										"managingEditor",
										childs,
										true,
									);
									feed.items = getElements("item", feedRoot.children).map(
										function(item) {
											var entry = {};
											var children = item.children;
											addConditionally(entry, "id", "guid", children);
											addConditionally(entry, "title", "title", children);
											addConditionally(entry, "link", "link", children);
											addConditionally(
												entry,
												"description",
												"description",
												children,
											);
											var pubDate = fetch("pubDate", children);
											if (pubDate) entry.pubDate = new Date(pubDate);
											return entry;
										},
									);
								}
							}
							this.feed = feed;
							this.handleCallback(
								feedRoot ? null : Error("couldn't find root of feed"),
							);
						};
						return FeedHandler;
					})(domhandler_1.default);
					exports.FeedHandler = FeedHandler;
					function getElements(what, where) {
						return DomUtils.getElementsByTagName(what, where, true);
					}
					function getOneElement(what, where) {
						return DomUtils.getElementsByTagName(what, where, true, 1)[0];
					}
					function fetch(what, where, recurse) {
						if (recurse === void 0) {
							recurse = false;
						}
						return DomUtils.getText(
							DomUtils.getElementsByTagName(what, where, recurse, 1),
						).trim();
					}
					function getAttribute(name, elem) {
						if (!elem) {
							return null;
						}
						var attribs = elem.attribs;
						return attribs[name];
					}
					function addConditionally(obj, prop, what, where, recurse) {
						if (recurse === void 0) {
							recurse = false;
						}
						var tmp = fetch(what, where, recurse);
						// @ts-ignore
						if (tmp) obj[prop] = tmp;
					}
					function isValidFeed(value) {
						return value === "rss" || value === "feed" || value === "rdf:RDF";
					}
					var defaultOptions = { xmlMode: true };
					/**
					 * Parse a feed.
					 *
					 * @param feed The feed that should be parsed, as a string.
					 * @param options Optionally, options for parsing. When using this option, you probably want to set `xmlMode` to `true`.
					 */
					function parseFeed(feed, options) {
						if (options === void 0) {
							options = defaultOptions;
						}
						var handler = new FeedHandler(options);
						new Parser_1.Parser(handler, options).end(feed);
						return handler.feed;
					}
					exports.parseFeed = parseFeed;
				},
				{ "./Parser": 6, "domhandler": 12, "domutils": 15 },
			],
			5: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					/**
					 * Calls a specific handler function for all events that are encountered.
					 *
					 * @param func — The function to multiplex all events to.
					 */
					var MultiplexHandler = /** @class */ (function() {
						function MultiplexHandler(func) {
							this._func = func;
						}
						/* Format: eventname: number of arguments */
						MultiplexHandler.prototype.onattribute = function(name, value) {
							this._func("onattribute", name, value);
						};
						MultiplexHandler.prototype.oncdatastart = function() {
							this._func("oncdatastart");
						};
						MultiplexHandler.prototype.oncdataend = function() {
							this._func("oncdataend");
						};
						MultiplexHandler.prototype.ontext = function(text) {
							this._func("ontext", text);
						};
						MultiplexHandler.prototype.onprocessinginstruction = function(
							name,
							value,
						) {
							this._func("onprocessinginstruction", name, value);
						};
						MultiplexHandler.prototype.oncomment = function(comment) {
							this._func("oncomment", comment);
						};
						MultiplexHandler.prototype.oncommentend = function() {
							this._func("oncommentend");
						};
						MultiplexHandler.prototype.onclosetag = function(name) {
							this._func("onclosetag", name);
						};
						MultiplexHandler.prototype.onopentag = function(name, attribs) {
							this._func("onopentag", name, attribs);
						};
						MultiplexHandler.prototype.onopentagname = function(name) {
							this._func("onopentagname", name);
						};
						MultiplexHandler.prototype.onerror = function(error) {
							this._func("onerror", error);
						};
						MultiplexHandler.prototype.onend = function() {
							this._func("onend");
						};
						MultiplexHandler.prototype.onparserinit = function(parser) {
							this._func("onparserinit", parser);
						};
						MultiplexHandler.prototype.onreset = function() {
							this._func("onreset");
						};
						return MultiplexHandler;
					})();
					exports.default = MultiplexHandler;
				},
				{},
			],
			6: [
				function(require, module, exports) {
					"use strict";
					var __extends =
						(this && this.__extends) ||
						(function() {
							var extendStatics = function(d, b) {
								extendStatics =
									Object.setPrototypeOf ||
									({ __proto__: [] } instanceof Array &&
										function(d, b) {
											d.__proto__ = b;
										}) ||
									function(d, b) {
										for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
									};
								return extendStatics(d, b);
							};
							return function(d, b) {
								extendStatics(d, b);
								function __() {
									this.constructor = d;
								}
								d.prototype =
									b === null
										? Object.create(b)
										: ((__.prototype = b.prototype), new __());
							};
						})();
					var __importDefault =
						(this && this.__importDefault) ||
						function(mod) {
							return mod && mod.__esModule ? mod : { default: mod };
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var Tokenizer_1 = __importDefault(require("./Tokenizer"));
					var events_1 = require("events");
					var formTags = new Set([
						"input",
						"option",
						"optgroup",
						"select",
						"button",
						"datalist",
						"textarea",
					]);
					var pTag = new Set(["p"]);
					var openImpliesClose = {
						tr: new Set(["tr", "th", "td"]),
						th: new Set(["th"]),
						td: new Set(["thead", "th", "td"]),
						body: new Set(["head", "link", "script"]),
						li: new Set(["li"]),
						p: pTag,
						h1: pTag,
						h2: pTag,
						h3: pTag,
						h4: pTag,
						h5: pTag,
						h6: pTag,
						select: formTags,
						input: formTags,
						output: formTags,
						button: formTags,
						datalist: formTags,
						textarea: formTags,
						option: new Set(["option"]),
						optgroup: new Set(["optgroup", "option"]),
						dd: new Set(["dt", "dd"]),
						dt: new Set(["dt", "dd"]),
						address: pTag,
						article: pTag,
						aside: pTag,
						blockquote: pTag,
						details: pTag,
						div: pTag,
						dl: pTag,
						fieldset: pTag,
						figcaption: pTag,
						figure: pTag,
						footer: pTag,
						form: pTag,
						header: pTag,
						hr: pTag,
						main: pTag,
						nav: pTag,
						ol: pTag,
						pre: pTag,
						section: pTag,
						table: pTag,
						ul: pTag,
						rt: new Set(["rt", "rp"]),
						rp: new Set(["rt", "rp"]),
						tbody: new Set(["thead", "tbody"]),
						tfoot: new Set(["thead", "tbody"]),
					};
					var voidElements = new Set([
						"area",
						"base",
						"basefont",
						"br",
						"col",
						"command",
						"embed",
						"frame",
						"hr",
						"img",
						"input",
						"isindex",
						"keygen",
						"link",
						"meta",
						"param",
						"source",
						"track",
						"wbr",
					]);
					var foreignContextElements = new Set(["math", "svg"]);
					var htmlIntegrationElements = new Set([
						"mi",
						"mo",
						"mn",
						"ms",
						"mtext",
						"annotation-xml",
						"foreignObject",
						"desc",
						"title",
					]);
					var reNameEnd = /\s|\//;
					var Parser = /** @class */ (function(_super) {
						__extends(Parser, _super);
						function Parser(cbs, options) {
							var _this = _super.call(this) || this;
							_this._tagname = "";
							_this._attribname = "";
							_this._attribvalue = "";
							_this._attribs = null;
							_this._stack = [];
							_this._foreignContext = [];
							_this.startIndex = 0;
							_this.endIndex = null;
							// Aliases for backwards compatibility
							_this.parseChunk = Parser.prototype.write;
							_this.done = Parser.prototype.end;
							_this._options = options || {};
							_this._cbs = cbs || {};
							_this._tagname = "";
							_this._attribname = "";
							_this._attribvalue = "";
							_this._attribs = null;
							_this._stack = [];
							_this._foreignContext = [];
							_this.startIndex = 0;
							_this.endIndex = null;
							_this._lowerCaseTagNames =
								"lowerCaseTags" in _this._options
									? !!_this._options.lowerCaseTags
									: !_this._options.xmlMode;
							_this._lowerCaseAttributeNames =
								"lowerCaseAttributeNames" in _this._options
									? !!_this._options.lowerCaseAttributeNames
									: !_this._options.xmlMode;
							_this._tokenizer = new (_this._options.Tokenizer ||
								Tokenizer_1.default)(_this._options, _this);
							if (_this._cbs.onparserinit) _this._cbs.onparserinit(_this);
							return _this;
						}
						Parser.prototype._updatePosition = function(initialOffset) {
							if (this.endIndex === null) {
								if (this._tokenizer._sectionStart <= initialOffset) {
									this.startIndex = 0;
								} else {
									this.startIndex =
										this._tokenizer._sectionStart - initialOffset;
								}
							} else this.startIndex = this.endIndex + 1;
							this.endIndex = this._tokenizer.getAbsoluteIndex();
						};
						//Tokenizer event handlers
						Parser.prototype.ontext = function(data) {
							this._updatePosition(1);
							// @ts-ignore
							this.endIndex--;
							if (this._cbs.ontext) this._cbs.ontext(data);
						};
						Parser.prototype.onopentagname = function(name) {
							if (this._lowerCaseTagNames) {
								name = name.toLowerCase();
							}
							this._tagname = name;
							if (!this._options.xmlMode && name in openImpliesClose) {
								for (
									var el = void 0;
									// @ts-ignore
									openImpliesClose[name].has(
										(el = this._stack[this._stack.length - 1]),
									);
									this.onclosetag(el)
								);
							}
							if (this._options.xmlMode || !voidElements.has(name)) {
								this._stack.push(name);
								if (foreignContextElements.has(name)) {
									this._foreignContext.push(true);
								} else if (htmlIntegrationElements.has(name)) {
									this._foreignContext.push(false);
								}
							}
							if (this._cbs.onopentagname) this._cbs.onopentagname(name);
							if (this._cbs.onopentag) this._attribs = {};
						};
						Parser.prototype.onopentagend = function() {
							this._updatePosition(1);
							if (this._attribs) {
								if (this._cbs.onopentag) {
									this._cbs.onopentag(this._tagname, this._attribs);
								}
								this._attribs = null;
							}
							if (
								!this._options.xmlMode &&
								this._cbs.onclosetag &&
								voidElements.has(this._tagname)
							) {
								this._cbs.onclosetag(this._tagname);
							}
							this._tagname = "";
						};
						Parser.prototype.onclosetag = function(name) {
							this._updatePosition(1);
							if (this._lowerCaseTagNames) {
								name = name.toLowerCase();
							}
							if (
								foreignContextElements.has(name) ||
								htmlIntegrationElements.has(name)
							) {
								this._foreignContext.pop();
							}
							if (
								this._stack.length &&
								(this._options.xmlMode || !voidElements.has(name))
							) {
								var pos = this._stack.lastIndexOf(name);
								if (pos !== -1) {
									if (this._cbs.onclosetag) {
										pos = this._stack.length - pos;
										// @ts-ignore
										while (pos--) this._cbs.onclosetag(this._stack.pop());
									} else this._stack.length = pos;
								} else if (name === "p" && !this._options.xmlMode) {
									this.onopentagname(name);
									this._closeCurrentTag();
								}
							} else if (
								!this._options.xmlMode &&
								(name === "br" || name === "p")
							) {
								this.onopentagname(name);
								this._closeCurrentTag();
							}
						};
						Parser.prototype.onselfclosingtag = function() {
							if (
								this._options.xmlMode ||
								this._options.recognizeSelfClosing ||
								this._foreignContext[this._foreignContext.length - 1]
							) {
								this._closeCurrentTag();
							} else {
								this.onopentagend();
							}
						};
						Parser.prototype._closeCurrentTag = function() {
							var name = this._tagname;
							this.onopentagend();
							//self-closing tags will be on the top of the stack
							//(cheaper check than in onclosetag)
							if (this._stack[this._stack.length - 1] === name) {
								if (this._cbs.onclosetag) {
									this._cbs.onclosetag(name);
								}
								this._stack.pop();
							}
						};
						Parser.prototype.onattribname = function(name) {
							if (this._lowerCaseAttributeNames) {
								name = name.toLowerCase();
							}
							this._attribname = name;
						};
						Parser.prototype.onattribdata = function(value) {
							this._attribvalue += value;
						};
						Parser.prototype.onattribend = function() {
							if (this._cbs.onattribute)
								this._cbs.onattribute(this._attribname, this._attribvalue);
							if (
								this._attribs &&
								!Object.prototype.hasOwnProperty.call(
									this._attribs,
									this._attribname,
								)
							) {
								this._attribs[this._attribname] = this._attribvalue;
							}
							this._attribname = "";
							this._attribvalue = "";
						};
						Parser.prototype._getInstructionName = function(value) {
							var idx = value.search(reNameEnd);
							var name = idx < 0 ? value : value.substr(0, idx);
							if (this._lowerCaseTagNames) {
								name = name.toLowerCase();
							}
							return name;
						};
						Parser.prototype.ondeclaration = function(value) {
							if (this._cbs.onprocessinginstruction) {
								var name_1 = this._getInstructionName(value);
								this._cbs.onprocessinginstruction("!" + name_1, "!" + value);
							}
						};
						Parser.prototype.onprocessinginstruction = function(value) {
							if (this._cbs.onprocessinginstruction) {
								var name_2 = this._getInstructionName(value);
								this._cbs.onprocessinginstruction("?" + name_2, "?" + value);
							}
						};
						Parser.prototype.oncomment = function(value) {
							this._updatePosition(4);
							if (this._cbs.oncomment) this._cbs.oncomment(value);
							if (this._cbs.oncommentend) this._cbs.oncommentend();
						};
						Parser.prototype.oncdata = function(value) {
							this._updatePosition(1);
							if (this._options.xmlMode || this._options.recognizeCDATA) {
								if (this._cbs.oncdatastart) this._cbs.oncdatastart();
								if (this._cbs.ontext) this._cbs.ontext(value);
								if (this._cbs.oncdataend) this._cbs.oncdataend();
							} else {
								this.oncomment("[CDATA[" + value + "]]");
							}
						};
						Parser.prototype.onerror = function(err) {
							if (this._cbs.onerror) this._cbs.onerror(err);
						};
						Parser.prototype.onend = function() {
							if (this._cbs.onclosetag) {
								for (
									var i = this._stack.length;
									i > 0;
									this._cbs.onclosetag(this._stack[--i])
								);
							}
							if (this._cbs.onend) this._cbs.onend();
						};
						//Resets the parser to a blank state, ready to parse a new HTML document
						Parser.prototype.reset = function() {
							if (this._cbs.onreset) this._cbs.onreset();
							this._tokenizer.reset();
							this._tagname = "";
							this._attribname = "";
							this._attribs = null;
							this._stack = [];
							if (this._cbs.onparserinit) this._cbs.onparserinit(this);
						};
						//Parses a complete HTML document and pushes it to the handler
						Parser.prototype.parseComplete = function(data) {
							this.reset();
							this.end(data);
						};
						Parser.prototype.write = function(chunk) {
							this._tokenizer.write(chunk);
						};
						Parser.prototype.end = function(chunk) {
							this._tokenizer.end(chunk);
						};
						Parser.prototype.pause = function() {
							this._tokenizer.pause();
						};
						Parser.prototype.resume = function() {
							this._tokenizer.resume();
						};
						return Parser;
					})(events_1.EventEmitter);
					exports.Parser = Parser;
				},
				{ "./Tokenizer": 7, "events": 2 },
			],
			7: [
				function(require, module, exports) {
					"use strict";
					var __importDefault =
						(this && this.__importDefault) ||
						function(mod) {
							return mod && mod.__esModule ? mod : { default: mod };
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var decode_codepoint_1 = __importDefault(
						require("entities/lib/decode_codepoint"),
					);
					var entities_json_1 = __importDefault(
						require("entities/lib/maps/entities.json"),
					);
					var legacy_json_1 = __importDefault(
						require("entities/lib/maps/legacy.json"),
					);
					var xml_json_1 = __importDefault(
						require("entities/lib/maps/xml.json"),
					);
					function whitespace(c) {
						return (
							c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r"
						);
					}
					function ifElseState(upper, SUCCESS, FAILURE) {
						var lower = upper.toLowerCase();
						if (upper === lower) {
							return function(t, c) {
								if (c === lower) {
									t._state = SUCCESS;
								} else {
									t._state = FAILURE;
									t._index--;
								}
							};
						} else {
							return function(t, c) {
								if (c === lower || c === upper) {
									t._state = SUCCESS;
								} else {
									t._state = FAILURE;
									t._index--;
								}
							};
						}
					}
					function consumeSpecialNameChar(upper, NEXT_STATE) {
						var lower = upper.toLowerCase();
						return function(t, c) {
							if (c === lower || c === upper) {
								t._state = NEXT_STATE;
							} else {
								t._state = 3 /* InTagName */;
								t._index--; //consume the token again
							}
						};
					}
					var stateBeforeCdata1 = ifElseState(
						"C",
						23 /* BeforeCdata2 */,
						16 /* InDeclaration */,
					);
					var stateBeforeCdata2 = ifElseState(
						"D",
						24 /* BeforeCdata3 */,
						16 /* InDeclaration */,
					);
					var stateBeforeCdata3 = ifElseState(
						"A",
						25 /* BeforeCdata4 */,
						16 /* InDeclaration */,
					);
					var stateBeforeCdata4 = ifElseState(
						"T",
						26 /* BeforeCdata5 */,
						16 /* InDeclaration */,
					);
					var stateBeforeCdata5 = ifElseState(
						"A",
						27 /* BeforeCdata6 */,
						16 /* InDeclaration */,
					);
					var stateBeforeScript1 = consumeSpecialNameChar(
						"R",
						34 /* BeforeScript2 */,
					);
					var stateBeforeScript2 = consumeSpecialNameChar(
						"I",
						35 /* BeforeScript3 */,
					);
					var stateBeforeScript3 = consumeSpecialNameChar(
						"P",
						36 /* BeforeScript4 */,
					);
					var stateBeforeScript4 = consumeSpecialNameChar(
						"T",
						37 /* BeforeScript5 */,
					);
					var stateAfterScript1 = ifElseState(
						"R",
						39 /* AfterScript2 */,
						1 /* Text */,
					);
					var stateAfterScript2 = ifElseState(
						"I",
						40 /* AfterScript3 */,
						1 /* Text */,
					);
					var stateAfterScript3 = ifElseState(
						"P",
						41 /* AfterScript4 */,
						1 /* Text */,
					);
					var stateAfterScript4 = ifElseState(
						"T",
						42 /* AfterScript5 */,
						1 /* Text */,
					);
					var stateBeforeStyle1 = consumeSpecialNameChar(
						"Y",
						44 /* BeforeStyle2 */,
					);
					var stateBeforeStyle2 = consumeSpecialNameChar(
						"L",
						45 /* BeforeStyle3 */,
					);
					var stateBeforeStyle3 = consumeSpecialNameChar(
						"E",
						46 /* BeforeStyle4 */,
					);
					var stateAfterStyle1 = ifElseState(
						"Y",
						48 /* AfterStyle2 */,
						1 /* Text */,
					);
					var stateAfterStyle2 = ifElseState(
						"L",
						49 /* AfterStyle3 */,
						1 /* Text */,
					);
					var stateAfterStyle3 = ifElseState(
						"E",
						50 /* AfterStyle4 */,
						1 /* Text */,
					);
					var stateBeforeEntity = ifElseState(
						"#",
						52 /* BeforeNumericEntity */,
						53 /* InNamedEntity */,
					);
					var stateBeforeNumericEntity = ifElseState(
						"X",
						55 /* InHexEntity */,
						54 /* InNumericEntity */,
					);
					var Tokenizer = /** @class */ (function() {
						function Tokenizer(options, cbs) {
							/** The current state the tokenizer is in. */
							this._state = 1 /* Text */;
							/** The read buffer. */
							this._buffer = "";
							/** The beginning of the section that is currently being read. */
							this._sectionStart = 0;
							/** The index within the buffer that we are currently looking at. */
							this._index = 0;
							/**
							 * Data that has already been processed will be removed from the buffer occasionally.
							 * `_bufferOffset` keeps track of how many characters have been removed, to make sure position information is accurate.
							 */
							this._bufferOffset = 0;
							/** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
							this._baseState = 1 /* Text */;
							/** For special parsing behavior inside of script and style tags. */
							this._special = 1 /* None */;
							/** Indicates whether the tokenizer has been paused. */
							this._running = true;
							/** Indicates whether the tokenizer has finished running / `.end` has been called. */
							this._ended = false;
							this._cbs = cbs;
							this._xmlMode = !!(options && options.xmlMode);
							this._decodeEntities = !!(options && options.decodeEntities);
						}
						Tokenizer.prototype.reset = function() {
							this._state = 1 /* Text */;
							this._buffer = "";
							this._sectionStart = 0;
							this._index = 0;
							this._bufferOffset = 0;
							this._baseState = 1 /* Text */;
							this._special = 1 /* None */;
							this._running = true;
							this._ended = false;
						};
						Tokenizer.prototype._stateText = function(c) {
							if (c === "<") {
								if (this._index > this._sectionStart) {
									this._cbs.ontext(this._getSection());
								}
								this._state = 2 /* BeforeTagName */;
								this._sectionStart = this._index;
							} else if (
								this._decodeEntities &&
								this._special === 1 /* None */ &&
								c === "&"
							) {
								if (this._index > this._sectionStart) {
									this._cbs.ontext(this._getSection());
								}
								this._baseState = 1 /* Text */;
								this._state = 51 /* BeforeEntity */;
								this._sectionStart = this._index;
							}
						};
						Tokenizer.prototype._stateBeforeTagName = function(c) {
							if (c === "/") {
								this._state = 5 /* BeforeClosingTagName */;
							} else if (c === "<") {
								this._cbs.ontext(this._getSection());
								this._sectionStart = this._index;
							} else if (
								c === ">" ||
								this._special !== 1 /* None */ ||
								whitespace(c)
							) {
								this._state = 1 /* Text */;
							} else if (c === "!") {
								this._state = 15 /* BeforeDeclaration */;
								this._sectionStart = this._index + 1;
							} else if (c === "?") {
								this._state = 17 /* InProcessingInstruction */;
								this._sectionStart = this._index + 1;
							} else {
								this._state =
									!this._xmlMode && (c === "s" || c === "S")
										? 31 /* BeforeSpecial */
										: 3 /* InTagName */;
								this._sectionStart = this._index;
							}
						};
						Tokenizer.prototype._stateInTagName = function(c) {
							if (c === "/" || c === ">" || whitespace(c)) {
								this._emitToken("onopentagname");
								this._state = 8 /* BeforeAttributeName */;
								this._index--;
							}
						};
						Tokenizer.prototype._stateBeforeCloseingTagName = function(c) {
							if (whitespace(c)) {
								// ignore
							} else if (c === ">") {
								this._state = 1 /* Text */;
							} else if (this._special !== 1 /* None */) {
								if (c === "s" || c === "S") {
									this._state = 32 /* BeforeSpecialEnd */;
								} else {
									this._state = 1 /* Text */;
									this._index--;
								}
							} else {
								this._state = 6 /* InClosingTagName */;
								this._sectionStart = this._index;
							}
						};
						Tokenizer.prototype._stateInCloseingTagName = function(c) {
							if (c === ">" || whitespace(c)) {
								this._emitToken("onclosetag");
								this._state = 7 /* AfterClosingTagName */;
								this._index--;
							}
						};
						Tokenizer.prototype._stateAfterCloseingTagName = function(c) {
							//skip everything until ">"
							if (c === ">") {
								this._state = 1 /* Text */;
								this._sectionStart = this._index + 1;
							}
						};
						Tokenizer.prototype._stateBeforeAttributeName = function(c) {
							if (c === ">") {
								this._cbs.onopentagend();
								this._state = 1 /* Text */;
								this._sectionStart = this._index + 1;
							} else if (c === "/") {
								this._state = 4 /* InSelfClosingTag */;
							} else if (!whitespace(c)) {
								this._state = 9 /* InAttributeName */;
								this._sectionStart = this._index;
							}
						};
						Tokenizer.prototype._stateInSelfClosingTag = function(c) {
							if (c === ">") {
								this._cbs.onselfclosingtag();
								this._state = 1 /* Text */;
								this._sectionStart = this._index + 1;
							} else if (!whitespace(c)) {
								this._state = 8 /* BeforeAttributeName */;
								this._index--;
							}
						};
						Tokenizer.prototype._stateInAttributeName = function(c) {
							if (c === "=" || c === "/" || c === ">" || whitespace(c)) {
								this._cbs.onattribname(this._getSection());
								this._sectionStart = -1;
								this._state = 10 /* AfterAttributeName */;
								this._index--;
							}
						};
						Tokenizer.prototype._stateAfterAttributeName = function(c) {
							if (c === "=") {
								this._state = 11 /* BeforeAttributeValue */;
							} else if (c === "/" || c === ">") {
								this._cbs.onattribend();
								this._state = 8 /* BeforeAttributeName */;
								this._index--;
							} else if (!whitespace(c)) {
								this._cbs.onattribend();
								this._state = 9 /* InAttributeName */;
								this._sectionStart = this._index;
							}
						};
						Tokenizer.prototype._stateBeforeAttributeValue = function(c) {
							if (c === '"') {
								this._state = 12 /* InAttributeValueDq */;
								this._sectionStart = this._index + 1;
							} else if (c === "'") {
								this._state = 13 /* InAttributeValueSq */;
								this._sectionStart = this._index + 1;
							} else if (!whitespace(c)) {
								this._state = 14 /* InAttributeValueNq */;
								this._sectionStart = this._index;
								this._index--; //reconsume token
							}
						};
						Tokenizer.prototype._stateInAttributeValueDoubleQuotes = function(
							c,
						) {
							if (c === '"') {
								this._emitToken("onattribdata");
								this._cbs.onattribend();
								this._state = 8 /* BeforeAttributeName */;
							} else if (this._decodeEntities && c === "&") {
								this._emitToken("onattribdata");
								this._baseState = this._state;
								this._state = 51 /* BeforeEntity */;
								this._sectionStart = this._index;
							}
						};
						Tokenizer.prototype._stateInAttributeValueSingleQuotes = function(
							c,
						) {
							if (c === "'") {
								this._emitToken("onattribdata");
								this._cbs.onattribend();
								this._state = 8 /* BeforeAttributeName */;
							} else if (this._decodeEntities && c === "&") {
								this._emitToken("onattribdata");
								this._baseState = this._state;
								this._state = 51 /* BeforeEntity */;
								this._sectionStart = this._index;
							}
						};
						Tokenizer.prototype._stateInAttributeValueNoQuotes = function(c) {
							if (whitespace(c) || c === ">") {
								this._emitToken("onattribdata");
								this._cbs.onattribend();
								this._state = 8 /* BeforeAttributeName */;
								this._index--;
							} else if (this._decodeEntities && c === "&") {
								this._emitToken("onattribdata");
								this._baseState = this._state;
								this._state = 51 /* BeforeEntity */;
								this._sectionStart = this._index;
							}
						};
						Tokenizer.prototype._stateBeforeDeclaration = function(c) {
							this._state =
								c === "["
									? 22 /* BeforeCdata1 */
									: c === "-"
									? 18 /* BeforeComment */
									: 16 /* InDeclaration */;
						};
						Tokenizer.prototype._stateInDeclaration = function(c) {
							if (c === ">") {
								this._cbs.ondeclaration(this._getSection());
								this._state = 1 /* Text */;
								this._sectionStart = this._index + 1;
							}
						};
						Tokenizer.prototype._stateInProcessingInstruction = function(c) {
							if (c === ">") {
								this._cbs.onprocessinginstruction(this._getSection());
								this._state = 1 /* Text */;
								this._sectionStart = this._index + 1;
							}
						};
						Tokenizer.prototype._stateBeforeComment = function(c) {
							if (c === "-") {
								this._state = 19 /* InComment */;
								this._sectionStart = this._index + 1;
							} else {
								this._state = 16 /* InDeclaration */;
							}
						};
						Tokenizer.prototype._stateInComment = function(c) {
							if (c === "-") this._state = 20 /* AfterComment1 */;
						};
						Tokenizer.prototype._stateAfterComment1 = function(c) {
							if (c === "-") {
								this._state = 21 /* AfterComment2 */;
							} else {
								this._state = 19 /* InComment */;
							}
						};
						Tokenizer.prototype._stateAfterComment2 = function(c) {
							if (c === ">") {
								//remove 2 trailing chars
								this._cbs.oncomment(
									this._buffer.substring(this._sectionStart, this._index - 2),
								);
								this._state = 1 /* Text */;
								this._sectionStart = this._index + 1;
							} else if (c !== "-") {
								this._state = 19 /* InComment */;
							}
							// else: stay in AFTER_COMMENT_2 (`--->`)
						};
						Tokenizer.prototype._stateBeforeCdata6 = function(c) {
							if (c === "[") {
								this._state = 28 /* InCdata */;
								this._sectionStart = this._index + 1;
							} else {
								this._state = 16 /* InDeclaration */;
								this._index--;
							}
						};
						Tokenizer.prototype._stateInCdata = function(c) {
							if (c === "]") this._state = 29 /* AfterCdata1 */;
						};
						Tokenizer.prototype._stateAfterCdata1 = function(c) {
							if (c === "]") this._state = 30 /* AfterCdata2 */;
							else this._state = 28 /* InCdata */;
						};
						Tokenizer.prototype._stateAfterCdata2 = function(c) {
							if (c === ">") {
								//remove 2 trailing chars
								this._cbs.oncdata(
									this._buffer.substring(this._sectionStart, this._index - 2),
								);
								this._state = 1 /* Text */;
								this._sectionStart = this._index + 1;
							} else if (c !== "]") {
								this._state = 28 /* InCdata */;
							}
							//else: stay in AFTER_CDATA_2 (`]]]>`)
						};
						Tokenizer.prototype._stateBeforeSpecial = function(c) {
							if (c === "c" || c === "C") {
								this._state = 33 /* BeforeScript1 */;
							} else if (c === "t" || c === "T") {
								this._state = 43 /* BeforeStyle1 */;
							} else {
								this._state = 3 /* InTagName */;
								this._index--; //consume the token again
							}
						};
						Tokenizer.prototype._stateBeforeSpecialEnd = function(c) {
							if (
								this._special === 2 /* Script */ &&
								(c === "c" || c === "C")
							) {
								this._state = 38 /* AfterScript1 */;
							} else if (
								this._special === 3 /* Style */ &&
								(c === "t" || c === "T")
							) {
								this._state = 47 /* AfterStyle1 */;
							} else this._state = 1 /* Text */;
						};
						Tokenizer.prototype._stateBeforeScript5 = function(c) {
							if (c === "/" || c === ">" || whitespace(c)) {
								this._special = 2 /* Script */;
							}
							this._state = 3 /* InTagName */;
							this._index--; //consume the token again
						};
						Tokenizer.prototype._stateAfterScript5 = function(c) {
							if (c === ">" || whitespace(c)) {
								this._special = 1 /* None */;
								this._state = 6 /* InClosingTagName */;
								this._sectionStart = this._index - 6;
								this._index--; //reconsume the token
							} else this._state = 1 /* Text */;
						};
						Tokenizer.prototype._stateBeforeStyle4 = function(c) {
							if (c === "/" || c === ">" || whitespace(c)) {
								this._special = 3 /* Style */;
							}
							this._state = 3 /* InTagName */;
							this._index--; //consume the token again
						};
						Tokenizer.prototype._stateAfterStyle4 = function(c) {
							if (c === ">" || whitespace(c)) {
								this._special = 1 /* None */;
								this._state = 6 /* InClosingTagName */;
								this._sectionStart = this._index - 5;
								this._index--; //reconsume the token
							} else this._state = 1 /* Text */;
						};
						//for entities terminated with a semicolon
						Tokenizer.prototype._parseNamedEntityStrict = function() {
							//offset = 1
							if (this._sectionStart + 1 < this._index) {
								var entity = this._buffer.substring(
										this._sectionStart + 1,
										this._index,
									),
									map = this._xmlMode
										? xml_json_1.default
										: entities_json_1.default;
								if (Object.prototype.hasOwnProperty.call(map, entity)) {
									// @ts-ignore
									this._emitPartial(map[entity]);
									this._sectionStart = this._index + 1;
								}
							}
						};
						//parses legacy entities (without trailing semicolon)
						Tokenizer.prototype._parseLegacyEntity = function() {
							var start = this._sectionStart + 1;
							var limit = this._index - start;
							if (limit > 6) limit = 6; // The max length of legacy entities is 6
							while (limit >= 2) {
								// The min length of legacy entities is 2
								var entity = this._buffer.substr(start, limit);
								if (
									Object.prototype.hasOwnProperty.call(
										legacy_json_1.default,
										entity,
									)
								) {
									// @ts-ignore
									this._emitPartial(legacy_json_1.default[entity]);
									this._sectionStart += limit + 1;
									return;
								} else {
									limit--;
								}
							}
						};
						Tokenizer.prototype._stateInNamedEntity = function(c) {
							if (c === ";") {
								this._parseNamedEntityStrict();
								if (this._sectionStart + 1 < this._index && !this._xmlMode) {
									this._parseLegacyEntity();
								}
								this._state = this._baseState;
							} else if (
								(c < "a" || c > "z") &&
								(c < "A" || c > "Z") &&
								(c < "0" || c > "9")
							) {
								if (this._xmlMode || this._sectionStart + 1 === this._index) {
									// ignore
								} else if (this._baseState !== 1 /* Text */) {
									if (c !== "=") {
										this._parseNamedEntityStrict();
									}
								} else {
									this._parseLegacyEntity();
								}
								this._state = this._baseState;
								this._index--;
							}
						};
						Tokenizer.prototype._decodeNumericEntity = function(offset, base) {
							var sectionStart = this._sectionStart + offset;
							if (sectionStart !== this._index) {
								//parse entity
								var entity = this._buffer.substring(sectionStart, this._index);
								var parsed = parseInt(entity, base);
								this._emitPartial(decode_codepoint_1.default(parsed));
								this._sectionStart = this._index;
							} else {
								this._sectionStart--;
							}
							this._state = this._baseState;
						};
						Tokenizer.prototype._stateInNumericEntity = function(c) {
							if (c === ";") {
								this._decodeNumericEntity(2, 10);
								this._sectionStart++;
							} else if (c < "0" || c > "9") {
								if (!this._xmlMode) {
									this._decodeNumericEntity(2, 10);
								} else {
									this._state = this._baseState;
								}
								this._index--;
							}
						};
						Tokenizer.prototype._stateInHexEntity = function(c) {
							if (c === ";") {
								this._decodeNumericEntity(3, 16);
								this._sectionStart++;
							} else if (
								(c < "a" || c > "f") &&
								(c < "A" || c > "F") &&
								(c < "0" || c > "9")
							) {
								if (!this._xmlMode) {
									this._decodeNumericEntity(3, 16);
								} else {
									this._state = this._baseState;
								}
								this._index--;
							}
						};
						Tokenizer.prototype._cleanup = function() {
							if (this._sectionStart < 0) {
								this._buffer = "";
								this._bufferOffset += this._index;
								this._index = 0;
							} else if (this._running) {
								if (this._state === 1 /* Text */) {
									if (this._sectionStart !== this._index) {
										this._cbs.ontext(this._buffer.substr(this._sectionStart));
									}
									this._buffer = "";
									this._bufferOffset += this._index;
									this._index = 0;
								} else if (this._sectionStart === this._index) {
									//the section just started
									this._buffer = "";
									this._bufferOffset += this._index;
									this._index = 0;
								} else {
									//remove everything unnecessary
									this._buffer = this._buffer.substr(this._sectionStart);
									this._index -= this._sectionStart;
									this._bufferOffset += this._sectionStart;
								}
								this._sectionStart = 0;
							}
						};
						//TODO make events conditional
						Tokenizer.prototype.write = function(chunk) {
							if (this._ended) this._cbs.onerror(Error(".write() after done!"));
							this._buffer += chunk;
							this._parse();
						};
						// Iterates through the buffer, calling the function corresponding to the current state.
						// States that are more likely to be hit are higher up, as a performance improvement.
						Tokenizer.prototype._parse = function() {
							while (this._index < this._buffer.length && this._running) {
								var c = this._buffer.charAt(this._index);
								if (this._state === 1 /* Text */) {
									this._stateText(c);
								} else if (this._state === 12 /* InAttributeValueDq */) {
									this._stateInAttributeValueDoubleQuotes(c);
								} else if (this._state === 9 /* InAttributeName */) {
									this._stateInAttributeName(c);
								} else if (this._state === 19 /* InComment */) {
									this._stateInComment(c);
								} else if (this._state === 8 /* BeforeAttributeName */) {
									this._stateBeforeAttributeName(c);
								} else if (this._state === 3 /* InTagName */) {
									this._stateInTagName(c);
								} else if (this._state === 6 /* InClosingTagName */) {
									this._stateInCloseingTagName(c);
								} else if (this._state === 2 /* BeforeTagName */) {
									this._stateBeforeTagName(c);
								} else if (this._state === 10 /* AfterAttributeName */) {
									this._stateAfterAttributeName(c);
								} else if (this._state === 13 /* InAttributeValueSq */) {
									this._stateInAttributeValueSingleQuotes(c);
								} else if (this._state === 11 /* BeforeAttributeValue */) {
									this._stateBeforeAttributeValue(c);
								} else if (this._state === 5 /* BeforeClosingTagName */) {
									this._stateBeforeCloseingTagName(c);
								} else if (this._state === 7 /* AfterClosingTagName */) {
									this._stateAfterCloseingTagName(c);
								} else if (this._state === 31 /* BeforeSpecial */) {
									this._stateBeforeSpecial(c);
								} else if (this._state === 20 /* AfterComment1 */) {
									this._stateAfterComment1(c);
								} else if (this._state === 14 /* InAttributeValueNq */) {
									this._stateInAttributeValueNoQuotes(c);
								} else if (this._state === 4 /* InSelfClosingTag */) {
									this._stateInSelfClosingTag(c);
								} else if (this._state === 16 /* InDeclaration */) {
									this._stateInDeclaration(c);
								} else if (this._state === 15 /* BeforeDeclaration */) {
									this._stateBeforeDeclaration(c);
								} else if (this._state === 21 /* AfterComment2 */) {
									this._stateAfterComment2(c);
								} else if (this._state === 18 /* BeforeComment */) {
									this._stateBeforeComment(c);
								} else if (this._state === 32 /* BeforeSpecialEnd */) {
									this._stateBeforeSpecialEnd(c);
								} else if (this._state === 38 /* AfterScript1 */) {
									stateAfterScript1(this, c);
								} else if (this._state === 39 /* AfterScript2 */) {
									stateAfterScript2(this, c);
								} else if (this._state === 40 /* AfterScript3 */) {
									stateAfterScript3(this, c);
								} else if (this._state === 33 /* BeforeScript1 */) {
									stateBeforeScript1(this, c);
								} else if (this._state === 34 /* BeforeScript2 */) {
									stateBeforeScript2(this, c);
								} else if (this._state === 35 /* BeforeScript3 */) {
									stateBeforeScript3(this, c);
								} else if (this._state === 36 /* BeforeScript4 */) {
									stateBeforeScript4(this, c);
								} else if (this._state === 37 /* BeforeScript5 */) {
									this._stateBeforeScript5(c);
								} else if (this._state === 41 /* AfterScript4 */) {
									stateAfterScript4(this, c);
								} else if (this._state === 42 /* AfterScript5 */) {
									this._stateAfterScript5(c);
								} else if (this._state === 43 /* BeforeStyle1 */) {
									stateBeforeStyle1(this, c);
								} else if (this._state === 28 /* InCdata */) {
									this._stateInCdata(c);
								} else if (this._state === 44 /* BeforeStyle2 */) {
									stateBeforeStyle2(this, c);
								} else if (this._state === 45 /* BeforeStyle3 */) {
									stateBeforeStyle3(this, c);
								} else if (this._state === 46 /* BeforeStyle4 */) {
									this._stateBeforeStyle4(c);
								} else if (this._state === 47 /* AfterStyle1 */) {
									stateAfterStyle1(this, c);
								} else if (this._state === 48 /* AfterStyle2 */) {
									stateAfterStyle2(this, c);
								} else if (this._state === 49 /* AfterStyle3 */) {
									stateAfterStyle3(this, c);
								} else if (this._state === 50 /* AfterStyle4 */) {
									this._stateAfterStyle4(c);
								} else if (this._state === 17 /* InProcessingInstruction */) {
									this._stateInProcessingInstruction(c);
								} else if (this._state === 53 /* InNamedEntity */) {
									this._stateInNamedEntity(c);
								} else if (this._state === 22 /* BeforeCdata1 */) {
									stateBeforeCdata1(this, c);
								} else if (this._state === 51 /* BeforeEntity */) {
									stateBeforeEntity(this, c);
								} else if (this._state === 23 /* BeforeCdata2 */) {
									stateBeforeCdata2(this, c);
								} else if (this._state === 24 /* BeforeCdata3 */) {
									stateBeforeCdata3(this, c);
								} else if (this._state === 29 /* AfterCdata1 */) {
									this._stateAfterCdata1(c);
								} else if (this._state === 30 /* AfterCdata2 */) {
									this._stateAfterCdata2(c);
								} else if (this._state === 25 /* BeforeCdata4 */) {
									stateBeforeCdata4(this, c);
								} else if (this._state === 26 /* BeforeCdata5 */) {
									stateBeforeCdata5(this, c);
								} else if (this._state === 27 /* BeforeCdata6 */) {
									this._stateBeforeCdata6(c);
								} else if (this._state === 55 /* InHexEntity */) {
									this._stateInHexEntity(c);
								} else if (this._state === 54 /* InNumericEntity */) {
									this._stateInNumericEntity(c);
								} else if (this._state === 52 /* BeforeNumericEntity */) {
									stateBeforeNumericEntity(this, c);
								} else {
									this._cbs.onerror(Error("unknown _state"), this._state);
								}
								this._index++;
							}
							this._cleanup();
						};
						Tokenizer.prototype.pause = function() {
							this._running = false;
						};
						Tokenizer.prototype.resume = function() {
							this._running = true;
							if (this._index < this._buffer.length) {
								this._parse();
							}
							if (this._ended) {
								this._finish();
							}
						};
						Tokenizer.prototype.end = function(chunk) {
							if (this._ended) this._cbs.onerror(Error(".end() after done!"));
							if (chunk) this.write(chunk);
							this._ended = true;
							if (this._running) this._finish();
						};
						Tokenizer.prototype._finish = function() {
							//if there is remaining data, emit it in a reasonable way
							if (this._sectionStart < this._index) {
								this._handleTrailingData();
							}
							this._cbs.onend();
						};
						Tokenizer.prototype._handleTrailingData = function() {
							var data = this._buffer.substr(this._sectionStart);
							if (
								this._state === 28 /* InCdata */ ||
								this._state === 29 /* AfterCdata1 */ ||
								this._state === 30 /* AfterCdata2 */
							) {
								this._cbs.oncdata(data);
							} else if (
								this._state === 19 /* InComment */ ||
								this._state === 20 /* AfterComment1 */ ||
								this._state === 21 /* AfterComment2 */
							) {
								this._cbs.oncomment(data);
							} else if (
								this._state === 53 /* InNamedEntity */ &&
								!this._xmlMode
							) {
								this._parseLegacyEntity();
								if (this._sectionStart < this._index) {
									this._state = this._baseState;
									this._handleTrailingData();
								}
							} else if (
								this._state === 54 /* InNumericEntity */ &&
								!this._xmlMode
							) {
								this._decodeNumericEntity(2, 10);
								if (this._sectionStart < this._index) {
									this._state = this._baseState;
									this._handleTrailingData();
								}
							} else if (
								this._state === 55 /* InHexEntity */ &&
								!this._xmlMode
							) {
								this._decodeNumericEntity(3, 16);
								if (this._sectionStart < this._index) {
									this._state = this._baseState;
									this._handleTrailingData();
								}
							} else if (
								this._state !== 3 /* InTagName */ &&
								this._state !== 8 /* BeforeAttributeName */ &&
								this._state !== 11 /* BeforeAttributeValue */ &&
								this._state !== 10 /* AfterAttributeName */ &&
								this._state !== 9 /* InAttributeName */ &&
								this._state !== 13 /* InAttributeValueSq */ &&
								this._state !== 12 /* InAttributeValueDq */ &&
								this._state !== 14 /* InAttributeValueNq */ &&
								this._state !== 6 /* InClosingTagName */
							) {
								this._cbs.ontext(data);
							}
							//else, ignore remaining data
							//TODO add a way to remove current tag
						};
						Tokenizer.prototype.getAbsoluteIndex = function() {
							return this._bufferOffset + this._index;
						};
						Tokenizer.prototype._getSection = function() {
							return this._buffer.substring(this._sectionStart, this._index);
						};
						Tokenizer.prototype._emitToken = function(name) {
							this._cbs[name](this._getSection());
							this._sectionStart = -1;
						};
						Tokenizer.prototype._emitPartial = function(value) {
							if (this._baseState !== 1 /* Text */) {
								this._cbs.onattribdata(value); //TODO implement the new event
							} else {
								this._cbs.ontext(value);
							}
						};
						return Tokenizer;
					})();
					exports.default = Tokenizer;
				},
				{
					"entities/lib/decode_codepoint": 23,
					"entities/lib/maps/entities.json": 27,
					"entities/lib/maps/legacy.json": 28,
					"entities/lib/maps/xml.json": 29,
				},
			],
			8: [
				function(require, module, exports) {
					"use strict";
					function __export(m) {
						for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
					}
					var __importStar =
						(this && this.__importStar) ||
						function(mod) {
							if (mod && mod.__esModule) return mod;
							var result = {};
							if (mod != null)
								for (var k in mod)
									if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
							result["default"] = mod;
							return result;
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var Parser_1 = require("./Parser");
					exports.Parser = Parser_1.Parser;
					var domhandler_1 = require("domhandler");
					exports.DomHandler = domhandler_1.DomHandler;
					exports.DefaultHandler = domhandler_1.DomHandler;
					// Helper methods
					/**
					 * Parses data, returns the resulting DOM.
					 *
					 * @param data The data that should be parsed.
					 * @param options Optional options for the parser and DOM builder.
					 */
					function parseDOM(data, options) {
						var handler = new domhandler_1.DomHandler(void 0, options);
						new Parser_1.Parser(handler, options).end(data);
						return handler.dom;
					}
					exports.parseDOM = parseDOM;
					/**
					 * Creates a parser instance, with an attached DOM handler.
					 *
					 * @param cb A callback that will be called once parsing has been completed.
					 * @param options Optional options for the parser and DOM builder.
					 * @param elementCb An optional callback that will be called every time a tag has been completed inside of the DOM.
					 */
					function createDomStream(cb, options, elementCb) {
						var handler = new domhandler_1.DomHandler(cb, options, elementCb);
						return new Parser_1.Parser(handler, options);
					}
					exports.createDomStream = createDomStream;
					var Tokenizer_1 = require("./Tokenizer");
					exports.Tokenizer = Tokenizer_1.default;
					var ElementType = __importStar(require("domelementtype"));
					exports.ElementType = ElementType;
					/**
					 * List of all events that the parser emits.
					 *
					 * Format: eventname: number of arguments.
					 */
					exports.EVENTS = {
						attribute: 2,
						cdatastart: 0,
						cdataend: 0,
						text: 1,
						processinginstruction: 2,
						comment: 1,
						commentend: 0,
						closetag: 1,
						opentag: 2,
						opentagname: 1,
						error: 1,
						end: 0,
					};
					/*
    All of the following exports exist for backwards-compatibility.
    They should probably be removed eventually.
*/
					__export(require("./FeedHandler"));
					__export(require("./WritableStream"));
					__export(require("./CollectingHandler"));
					var DomUtils = __importStar(require("domutils"));
					exports.DomUtils = DomUtils;
					var FeedHandler_1 = require("./FeedHandler");
					exports.RssHandler = FeedHandler_1.FeedHandler;
				},
				{
					"./CollectingHandler": 3,
					"./FeedHandler": 4,
					"./Parser": 6,
					"./Tokenizer": 7,
					"./WritableStream": 1,
					"domelementtype": 11,
					"domhandler": 12,
					"domutils": 15,
				},
			],
			9: [
				function(require, module, exports) {
					module.exports = {
						elementNames: {
							altglyph: "altGlyph",
							altglyphdef: "altGlyphDef",
							altglyphitem: "altGlyphItem",
							animatecolor: "animateColor",
							animatemotion: "animateMotion",
							animatetransform: "animateTransform",
							clippath: "clipPath",
							feblend: "feBlend",
							fecolormatrix: "feColorMatrix",
							fecomponenttransfer: "feComponentTransfer",
							fecomposite: "feComposite",
							feconvolvematrix: "feConvolveMatrix",
							fediffuselighting: "feDiffuseLighting",
							fedisplacementmap: "feDisplacementMap",
							fedistantlight: "feDistantLight",
							fedropshadow: "feDropShadow",
							feflood: "feFlood",
							fefunca: "feFuncA",
							fefuncb: "feFuncB",
							fefuncg: "feFuncG",
							fefuncr: "feFuncR",
							fegaussianblur: "feGaussianBlur",
							feimage: "feImage",
							femerge: "feMerge",
							femergenode: "feMergeNode",
							femorphology: "feMorphology",
							feoffset: "feOffset",
							fepointlight: "fePointLight",
							fespecularlighting: "feSpecularLighting",
							fespotlight: "feSpotLight",
							fetile: "feTile",
							feturbulence: "feTurbulence",
							foreignobject: "foreignObject",
							glyphref: "glyphRef",
							lineargradient: "linearGradient",
							radialgradient: "radialGradient",
							textpath: "textPath",
						},
						attributeNames: {
							definitionurl: "definitionURL",
							attributename: "attributeName",
							attributetype: "attributeType",
							basefrequency: "baseFrequency",
							baseprofile: "baseProfile",
							calcmode: "calcMode",
							clippathunits: "clipPathUnits",
							diffuseconstant: "diffuseConstant",
							edgemode: "edgeMode",
							filterunits: "filterUnits",
							glyphref: "glyphRef",
							gradienttransform: "gradientTransform",
							gradientunits: "gradientUnits",
							kernelmatrix: "kernelMatrix",
							kernelunitlength: "kernelUnitLength",
							keypoints: "keyPoints",
							keysplines: "keySplines",
							keytimes: "keyTimes",
							lengthadjust: "lengthAdjust",
							limitingconeangle: "limitingConeAngle",
							markerheight: "markerHeight",
							markerunits: "markerUnits",
							markerwidth: "markerWidth",
							maskcontentunits: "maskContentUnits",
							maskunits: "maskUnits",
							numoctaves: "numOctaves",
							pathlength: "pathLength",
							patterncontentunits: "patternContentUnits",
							patterntransform: "patternTransform",
							patternunits: "patternUnits",
							pointsatx: "pointsAtX",
							pointsaty: "pointsAtY",
							pointsatz: "pointsAtZ",
							preservealpha: "preserveAlpha",
							preserveaspectratio: "preserveAspectRatio",
							primitiveunits: "primitiveUnits",
							refx: "refX",
							refy: "refY",
							repeatcount: "repeatCount",
							repeatdur: "repeatDur",
							requiredextensions: "requiredExtensions",
							requiredfeatures: "requiredFeatures",
							specularconstant: "specularConstant",
							specularexponent: "specularExponent",
							spreadmethod: "spreadMethod",
							startoffset: "startOffset",
							stddeviation: "stdDeviation",
							stitchtiles: "stitchTiles",
							surfacescale: "surfaceScale",
							systemlanguage: "systemLanguage",
							tablevalues: "tableValues",
							targetx: "targetX",
							targety: "targetY",
							textlength: "textLength",
							viewbox: "viewBox",
							viewtarget: "viewTarget",
							xchannelselector: "xChannelSelector",
							ychannelselector: "yChannelSelector",
							zoomandpan: "zoomAndPan",
						},
					};
				},
				{},
			],
			10: [
				function(require, module, exports) {
					/*
  Module dependencies
*/
					var ElementType = require("domelementtype");
					var entities = require("entities");

					/* mixed-case SVG and MathML tags & attributes
   recognized by the HTML parser, see
   https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
*/
					var foreignNames = require("./foreignNames.json");
					foreignNames.elementNames.__proto__ = null; /* use as a simple dictionary */
					foreignNames.attributeNames.__proto__ = null;

					var unencodedElements = {
						__proto__: null,
						style: true,
						script: true,
						xmp: true,
						iframe: true,
						noembed: true,
						noframes: true,
						plaintext: true,
						noscript: true,
					};

					/*
  Format attributes
*/
					function formatAttrs(attributes, opts) {
						if (!attributes) return;

						var output = "";
						var value;

						// Loop through the attributes
						for (var key in attributes) {
							value = attributes[key];
							if (output) {
								output += " ";
							}

							if (opts.xmlMode === "foreign") {
								/* fix up mixed-case attribute names */
								key = foreignNames.attributeNames[key] || key;
							}
							output += key;
							if ((value !== null && value !== "") || opts.xmlMode) {
								output +=
									'="' +
									(opts.decodeEntities
										? entities.encodeXML(value)
										: value.replace(/\"/g, "&quot;")) +
									'"';
							}
						}

						return output;
					}

					/*
  Self-enclosing tags (stolen from node-htmlparser)
*/
					var singleTag = {
						__proto__: null,
						area: true,
						base: true,
						basefont: true,
						br: true,
						col: true,
						command: true,
						embed: true,
						frame: true,
						hr: true,
						img: true,
						input: true,
						isindex: true,
						keygen: true,
						link: true,
						meta: true,
						param: true,
						source: true,
						track: true,
						wbr: true,
					};

					var render = (module.exports = function(dom, opts) {
						if (!Array.isArray(dom) && !dom.cheerio) dom = [dom];
						opts = opts || {};

						var output = "";

						for (var i = 0; i < dom.length; i++) {
							var elem = dom[i];

							if (elem.type === "root") output += render(elem.children, opts);
							else if (ElementType.isTag(elem)) output += renderTag(elem, opts);
							else if (elem.type === ElementType.Directive)
								output += renderDirective(elem);
							else if (elem.type === ElementType.Comment)
								output += renderComment(elem);
							else if (elem.type === ElementType.CDATA)
								output += renderCdata(elem);
							else output += renderText(elem, opts);
						}

						return output;
					});

					var foreignModeIntegrationPoints = [
						"mi",
						"mo",
						"mn",
						"ms",
						"mtext",
						"annotation-xml",
						"foreignObject",
						"desc",
						"title",
					];

					function renderTag(elem, opts) {
						// Handle SVG / MathML in HTML
						if (opts.xmlMode === "foreign") {
							/* fix up mixed-case element names */
							elem.name = foreignNames.elementNames[elem.name] || elem.name;
							/* exit foreign mode at integration points */
							if (
								elem.parent &&
								foreignModeIntegrationPoints.indexOf(elem.parent.name) >= 0
							)
								opts = Object.assign({}, opts, { xmlMode: false });
						}
						if (!opts.xmlMode && ["svg", "math"].indexOf(elem.name) >= 0) {
							opts = Object.assign({}, opts, { xmlMode: "foreign" });
						}

						var tag = "<" + elem.name;
						var attribs = formatAttrs(elem.attribs, opts);

						if (attribs) {
							tag += " " + attribs;
						}

						if (
							opts.xmlMode &&
							(!elem.children || elem.children.length === 0)
						) {
							tag += "/>";
						} else {
							tag += ">";
							if (elem.children) {
								tag += render(elem.children, opts);
							}

							if (!singleTag[elem.name] || opts.xmlMode) {
								tag += "</" + elem.name + ">";
							}
						}

						return tag;
					}

					function renderDirective(elem) {
						return "<" + elem.data + ">";
					}

					function renderText(elem, opts) {
						var data = elem.data || "";

						// if entities weren't decoded, no need to encode them back
						if (
							opts.decodeEntities &&
							!(elem.parent && elem.parent.name in unencodedElements)
						) {
							data = entities.encodeXML(data);
						}

						return data;
					}

					function renderCdata(elem) {
						return "<![CDATA[" + elem.children[0].data + "]]>";
					}

					function renderComment(elem) {
						return "<!--" + elem.data + "-->";
					}
				},
				{ "./foreignNames.json": 9, "domelementtype": 11, "entities": 25 },
			],
			11: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					/**
					 * Tests whether an element is a tag or not.
					 *
					 * @param elem Element to test
					 */
					function isTag(elem) {
						return (
							elem.type === "tag" /* Tag */ ||
							elem.type === "script" /* Script */ ||
							elem.type === "style" /* Style */
						);
					}
					exports.isTag = isTag;
					// Exports for backwards compatibility
					exports.Text = "text" /* Text */; //Text
					exports.Directive = "directive" /* Directive */; //<? ... ?>
					exports.Comment = "comment" /* Comment */; //<!-- ... -->
					exports.Script = "script" /* Script */; //<script> tags
					exports.Style = "style" /* Style */; //<style> tags
					exports.Tag = "tag" /* Tag */; //Any tag
					exports.CDATA = "cdata" /* CDATA */; //<![CDATA[ ... ]]>
					exports.Doctype = "doctype" /* Doctype */;
				},
				{},
			],
			12: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					var node_1 = require("./node");
					exports.Node = node_1.Node;
					exports.Element = node_1.Element;
					exports.DataNode = node_1.DataNode;
					exports.NodeWithChildren = node_1.NodeWithChildren;
					var reWhitespace = /\s+/g;
					// Default options
					var defaultOpts = {
						normalizeWhitespace: false,
						withStartIndices: false,
						withEndIndices: false,
					};
					var DomHandler = /** @class */ (function() {
						/**
						 * Initiate a new DomHandler.
						 *
						 * @param callback Called once parsing has completed.
						 * @param options Settings for the handler.
						 * @param elementCB Callback whenever a tag is closed.
						 */
						function DomHandler(callback, options, elementCB) {
							/** The constructed DOM */
							this.dom = [];
							/** Indicated whether parsing has been completed. */
							this._done = false;
							/** Stack of open tags. */
							this._tagStack = [];
							/** A data node that is still being written to. */
							this._lastNode = null;
							/** Reference to the parser instance. Used for location information. */
							this._parser = null;
							// Make it possible to skip arguments, for backwards-compatibility
							if (typeof options === "function") {
								elementCB = options;
								options = defaultOpts;
							}
							if (typeof callback === "object") {
								options = callback;
								callback = undefined;
							}
							this._callback = callback || null;
							this._options = options || defaultOpts;
							this._elementCB = elementCB || null;
						}
						DomHandler.prototype.onparserinit = function(parser) {
							this._parser = parser;
						};
						// Resets the handler back to starting state
						DomHandler.prototype.onreset = function() {
							this.dom = [];
							this._done = false;
							this._tagStack = [];
							this._lastNode = null;
							this._parser = this._parser || null;
						};
						// Signals the handler that parsing is done
						DomHandler.prototype.onend = function() {
							if (this._done) return;
							this._done = true;
							this._parser = null;
							this.handleCallback(null);
						};
						DomHandler.prototype.onerror = function(error) {
							this.handleCallback(error);
						};
						DomHandler.prototype.onclosetag = function() {
							this._lastNode = null;
							// If(this._tagStack.pop().name !== name) this.handleCallback(Error("Tagname didn't match!"));
							var elem = this._tagStack.pop();
							if (!elem || !this._parser) {
								return;
							}
							if (this._options.withEndIndices) {
								elem.endIndex = this._parser.endIndex;
							}
							if (this._elementCB) this._elementCB(elem);
						};
						DomHandler.prototype.onopentag = function(name, attribs) {
							var element = new node_1.Element(name, attribs);
							this.addNode(element);
							this._tagStack.push(element);
						};
						DomHandler.prototype.ontext = function(data) {
							var normalize = this._options.normalizeWhitespace;
							var _lastNode = this._lastNode;
							if (_lastNode && _lastNode.type === "text" /* Text */) {
								if (normalize) {
									_lastNode.data = (_lastNode.data + data).replace(
										reWhitespace,
										" ",
									);
								} else {
									_lastNode.data += data;
								}
							} else {
								if (normalize) {
									data = data.replace(reWhitespace, " ");
								}
								var node = new node_1.DataNode("text" /* Text */, data);
								this.addNode(node);
								this._lastNode = node;
							}
						};
						DomHandler.prototype.oncomment = function(data) {
							if (
								this._lastNode &&
								this._lastNode.type === "comment" /* Comment */
							) {
								this._lastNode.data += data;
								return;
							}
							var node = new node_1.DataNode("comment" /* Comment */, data);
							this.addNode(node);
							this._lastNode = node;
						};
						DomHandler.prototype.oncommentend = function() {
							this._lastNode = null;
						};
						DomHandler.prototype.oncdatastart = function() {
							var text = new node_1.DataNode("text" /* Text */, "");
							var node = new node_1.NodeWithChildren("cdata" /* CDATA */, [
								text,
							]);
							this.addNode(node);
							text.parent = node;
							this._lastNode = text;
						};
						DomHandler.prototype.oncdataend = function() {
							this._lastNode = null;
						};
						DomHandler.prototype.onprocessinginstruction = function(
							name,
							data,
						) {
							var node = new node_1.ProcessingInstruction(name, data);
							this.addNode(node);
						};
						DomHandler.prototype.handleCallback = function(error) {
							if (typeof this._callback === "function") {
								this._callback(error, this.dom);
							} else if (error) {
								throw error;
							}
						};
						DomHandler.prototype.addNode = function(node) {
							var parent = this._tagStack[this._tagStack.length - 1];
							var siblings = parent ? parent.children : this.dom;
							var previousSibling = siblings[siblings.length - 1];
							if (this._parser) {
								if (this._options.withStartIndices) {
									node.startIndex = this._parser.startIndex;
								}
								if (this._options.withEndIndices) {
									node.endIndex = this._parser.endIndex;
								}
							}
							siblings.push(node);
							if (previousSibling) {
								node.prev = previousSibling;
								previousSibling.next = node;
							}
							if (parent) {
								node.parent = parent;
							}
							this._lastNode = null;
						};
						DomHandler.prototype.addDataNode = function(node) {
							this.addNode(node);
							this._lastNode = node;
						};
						return DomHandler;
					})();
					exports.DomHandler = DomHandler;
					exports.default = DomHandler;
				},
				{ "./node": 13 },
			],
			13: [
				function(require, module, exports) {
					"use strict";
					var __extends =
						(this && this.__extends) ||
						(function() {
							var extendStatics = function(d, b) {
								extendStatics =
									Object.setPrototypeOf ||
									({ __proto__: [] } instanceof Array &&
										function(d, b) {
											d.__proto__ = b;
										}) ||
									function(d, b) {
										for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
									};
								return extendStatics(d, b);
							};
							return function(d, b) {
								extendStatics(d, b);
								function __() {
									this.constructor = d;
								}
								d.prototype =
									b === null
										? Object.create(b)
										: ((__.prototype = b.prototype), new __());
							};
						})();
					Object.defineProperty(exports, "__esModule", { value: true });
					var nodeTypes = new Map([
						["tag" /* Tag */, 1],
						["script" /* Script */, 1],
						["style" /* Style */, 1],
						["directive" /* Directive */, 1],
						["text" /* Text */, 3],
						["cdata" /* CDATA */, 4],
						["comment" /* Comment */, 8],
					]);
					// This object will be used as the prototype for Nodes when creating a
					// DOM-Level-1-compliant structure.
					var Node = /** @class */ (function() {
						/**
						 *
						 * @param type The type of the node.
						 */
						function Node(type) {
							this.type = type;
							/** Parent of the node */
							this.parent = null;
							/** Previous sibling */
							this.prev = null;
							/** Next sibling */
							this.next = null;
							/** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
							this.startIndex = null;
							/** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
							this.endIndex = null;
						}
						Object.defineProperty(Node.prototype, "nodeType", {
							// Read-only aliases
							get: function() {
								return nodeTypes.get(this.type) || 1;
							},
							enumerable: true,
							configurable: true,
						});
						Object.defineProperty(Node.prototype, "parentNode", {
							// Read-write aliases for properties
							get: function() {
								return this.parent || null;
							},
							set: function(parent) {
								this.parent = parent;
							},
							enumerable: true,
							configurable: true,
						});
						Object.defineProperty(Node.prototype, "previousSibling", {
							get: function() {
								return this.prev || null;
							},
							set: function(prev) {
								this.prev = prev;
							},
							enumerable: true,
							configurable: true,
						});
						Object.defineProperty(Node.prototype, "nextSibling", {
							get: function() {
								return this.next || null;
							},
							set: function(next) {
								this.next = next;
							},
							enumerable: true,
							configurable: true,
						});
						return Node;
					})();
					exports.Node = Node;
					var DataNode = /** @class */ (function(_super) {
						__extends(DataNode, _super);
						/**
						 *
						 * @param type The type of the node
						 * @param data The content of the data node
						 */
						function DataNode(type, data) {
							var _this = _super.call(this, type) || this;
							_this.data = data;
							return _this;
						}
						Object.defineProperty(DataNode.prototype, "nodeValue", {
							get: function() {
								return this.data;
							},
							set: function(data) {
								this.data = data;
							},
							enumerable: true,
							configurable: true,
						});
						return DataNode;
					})(Node);
					exports.DataNode = DataNode;
					var ProcessingInstruction = /** @class */ (function(_super) {
						__extends(ProcessingInstruction, _super);
						function ProcessingInstruction(name, data) {
							var _this =
								_super.call(this, "directive" /* Directive */, data) || this;
							_this.name = name;
							return _this;
						}
						return ProcessingInstruction;
					})(DataNode);
					exports.ProcessingInstruction = ProcessingInstruction;
					var NodeWithChildren = /** @class */ (function(_super) {
						__extends(NodeWithChildren, _super);
						/**
						 *
						 * @param type Type of the node.
						 * @param children Children of the node. Only certain node types can have children.
						 */
						function NodeWithChildren(type, children) {
							var _this = _super.call(this, type) || this;
							_this.children = children;
							return _this;
						}
						Object.defineProperty(NodeWithChildren.prototype, "firstChild", {
							// Aliases
							get: function() {
								return this.children[0] || null;
							},
							enumerable: true,
							configurable: true,
						});
						Object.defineProperty(NodeWithChildren.prototype, "lastChild", {
							get: function() {
								return this.children[this.children.length - 1] || null;
							},
							enumerable: true,
							configurable: true,
						});
						Object.defineProperty(NodeWithChildren.prototype, "childNodes", {
							get: function() {
								return this.children;
							},
							set: function(children) {
								this.children = children;
							},
							enumerable: true,
							configurable: true,
						});
						return NodeWithChildren;
					})(Node);
					exports.NodeWithChildren = NodeWithChildren;
					var Element = /** @class */ (function(_super) {
						__extends(Element, _super);
						/**
						 *
						 * @param name Name of the tag, eg. `div`, `span`
						 * @param attribs Object mapping attribute names to attribute values
						 */
						function Element(name, attribs) {
							var _this =
								_super.call(
									this,
									name === "script"
										? "script" /* Script */
										: name === "style"
										? "style" /* Style */
										: "tag" /* Tag */,
									[],
								) || this;
							_this.name = name;
							_this.attribs = attribs;
							_this.attribs = attribs;
							return _this;
						}
						Object.defineProperty(Element.prototype, "tagName", {
							// DOM Level 1 aliases
							get: function() {
								return this.name;
							},
							set: function(name) {
								this.name = name;
							},
							enumerable: true,
							configurable: true,
						});
						return Element;
					})(NodeWithChildren);
					exports.Element = Element;
				},
				{},
			],
			14: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					var tagtypes_1 = require("./tagtypes");
					/**
					 * Given an array of nodes, remove any member that is contained by another.
					 *
					 * @param nodes — Nodes to filter.
					 */
					function removeSubsets(nodes) {
						var idx = nodes.length;
						// Check if each node (or one of its ancestors) is already contained in the
						// array.
						while (--idx >= 0) {
							var node = nodes[idx];
							// Remove the node if it is not unique.
							// We are going through the array from the end, so we only
							// have to check nodes that preceed the node under consideration in the array.
							if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
								nodes.splice(idx, 1);
								continue;
							}
							for (
								var ancestor = node.parent;
								ancestor;
								ancestor = ancestor.parent
							) {
								if (nodes.indexOf(ancestor) > -1) {
									nodes.splice(idx, 1);
									break;
								}
							}
						}
						return nodes;
					}
					exports.removeSubsets = removeSubsets;
					/***
					 * Compare the position of one node against another node in any other document.
					 * The return value is a bitmask with the following values:
					 *
					 * document order:
					 * > There is an ordering, document order, defined on all the nodes in the
					 * > document corresponding to the order in which the first character of the
					 * > XML representation of each node occurs in the XML representation of the
					 * > document after expansion of general entities. Thus, the document element
					 * > node will be the first node. Element nodes occur before their children.
					 * > Thus, document order orders element nodes in order of the occurrence of
					 * > their start-tag in the XML (after expansion of entities). The attribute
					 * > nodes of an element occur after the element and before its children. The
					 * > relative order of attribute nodes is implementation-dependent./
					 *
					 * Source:
					 * http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
					 * @argument nodaA The first node to use in the comparison
					 * @argument nodeB The second node to use in the comparison
					 *
					 * @return A bitmask describing the input nodes' relative position.
					 *
					 *        See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
					 *        a description of these values.
					 */
					function compareDocumentPosition(nodeA, nodeB) {
						var aParents = [];
						var bParents = [];
						if (nodeA === nodeB) {
							return 0;
						}
						var current = tagtypes_1.hasChildren(nodeA) ? nodeA : nodeA.parent;
						while (current) {
							aParents.unshift(current);
							current = current.parent;
						}
						current = tagtypes_1.hasChildren(nodeB) ? nodeB : nodeB.parent;
						while (current) {
							bParents.unshift(current);
							current = current.parent;
						}
						var idx = 0;
						while (aParents[idx] === bParents[idx]) {
							idx++;
						}
						if (idx === 0) {
							return 1 /* DISCONNECTED */;
						}
						var sharedParent = aParents[idx - 1];
						var siblings = sharedParent.children;
						var aSibling = aParents[idx];
						var bSibling = bParents[idx];
						if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
							if (sharedParent === nodeB) {
								return 4 /* FOLLOWING */ | 16 /* CONTAINED_BY */;
							}
							return 4 /* FOLLOWING */;
						} else {
							if (sharedParent === nodeA) {
								return 2 /* PRECEDING */ | 8 /* CONTAINS */;
							}
							return 2 /* PRECEDING */;
						}
					}
					exports.compareDocumentPosition = compareDocumentPosition;
					/***
					 * Sort an array of nodes based on their relative position in the document and
					 * remove any duplicate nodes. If the array contains nodes that do not belong
					 * to the same document, sort order is unspecified.
					 *
					 * @argument nodes Array of DOM nodes
					 * @returns collection of unique nodes, sorted in document order
					 */
					function uniqueSort(nodes) {
						nodes = nodes.filter(function(node, i, arr) {
							return !arr.includes(node, i + 1);
						});
						nodes.sort(function(a, b) {
							var relative = compareDocumentPosition(a, b);
							if (relative & 2 /* PRECEDING */) {
								return -1;
							} else if (relative & 4 /* FOLLOWING */) {
								return 1;
							}
							return 0;
						});
						return nodes;
					}
					exports.uniqueSort = uniqueSort;
				},
				{ "./tagtypes": 20 },
			],
			15: [
				function(require, module, exports) {
					"use strict";
					function __export(m) {
						for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
					}
					Object.defineProperty(exports, "__esModule", { value: true });
					__export(require("./stringify"));
					__export(require("./traversal"));
					__export(require("./manipulation"));
					__export(require("./querying"));
					__export(require("./legacy"));
					__export(require("./helpers"));
					__export(require("./tagtypes"));
				},
				{
					"./helpers": 14,
					"./legacy": 16,
					"./manipulation": 17,
					"./querying": 18,
					"./stringify": 19,
					"./tagtypes": 20,
					"./traversal": 21,
				},
			],
			16: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					var querying_1 = require("./querying");
					var tagtypes_1 = require("./tagtypes");
					function isTextNode(node) {
						return node.type === "text" /* Text */;
					}
					/* eslint-disable @typescript-eslint/camelcase */
					var Checks = {
						tag_name: function(name) {
							if (typeof name === "function") {
								return function(elem) {
									return tagtypes_1.isTag(elem) && name(elem.name);
								};
							} else if (name === "*") {
								return tagtypes_1.isTag;
							} else {
								return function(elem) {
									return tagtypes_1.isTag(elem) && elem.name === name;
								};
							}
						},
						tag_type: function(type) {
							if (typeof type === "function") {
								return function(elem) {
									return type(elem.type);
								};
							} else {
								return function(elem) {
									return elem.type === type;
								};
							}
						},
						tag_contains: function(data) {
							if (typeof data === "function") {
								return function(elem) {
									return isTextNode(elem) && data(elem.data);
								};
							} else {
								return function(elem) {
									return isTextNode(elem) && elem.data === data;
								};
							}
						},
					};
					/* eslint-enable @typescript-eslint/camelcase */
					function getAttribCheck(attrib, value) {
						if (typeof value === "function") {
							return function(elem) {
								return tagtypes_1.isTag(elem) && value(elem.attribs[attrib]);
							};
						} else {
							return function(elem) {
								return tagtypes_1.isTag(elem) && elem.attribs[attrib] === value;
							};
						}
					}
					function combineFuncs(a, b) {
						return function(elem) {
							return a(elem) || b(elem);
						};
					}
					function compileTest(options) {
						var funcs = Object.keys(options).map(function(key) {
							var value = options[key];
							// @ts-ignore
							return key in Checks
								? Checks[key](value)
								: getAttribCheck(key, value);
						});
						return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
					}
					function testElement(options, element) {
						var test = compileTest(options);
						return test ? test(element) : true;
					}
					exports.testElement = testElement;
					function getElements(options, element, recurse, limit) {
						if (limit === void 0) {
							limit = Infinity;
						}
						var test = compileTest(options);
						return test ? querying_1.filter(test, element, recurse, limit) : [];
					}
					exports.getElements = getElements;
					function getElementById(id, element, recurse) {
						if (recurse === void 0) {
							recurse = true;
						}
						if (!Array.isArray(element)) element = [element];
						return querying_1.findOne(
							getAttribCheck("id", id),
							element,
							recurse,
						);
					}
					exports.getElementById = getElementById;
					function getElementsByTagName(name, element, recurse, limit) {
						if (limit === void 0) {
							limit = Infinity;
						}
						return querying_1.filter(
							Checks.tag_name(name),
							element,
							recurse,
							limit,
						);
					}
					exports.getElementsByTagName = getElementsByTagName;
					function getElementsByTagType(type, element, recurse, limit) {
						if (recurse === void 0) {
							recurse = true;
						}
						if (limit === void 0) {
							limit = Infinity;
						}
						return querying_1.filter(
							Checks.tag_type(type),
							element,
							recurse,
							limit,
						);
					}
					exports.getElementsByTagType = getElementsByTagType;
				},
				{ "./querying": 18, "./tagtypes": 20 },
			],
			17: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					/***
					 * Remove an element from the dom
					 *
					 * @argument elem The element to be removed
					 */
					function removeElement(elem) {
						if (elem.prev) elem.prev.next = elem.next;
						if (elem.next) elem.next.prev = elem.prev;
						if (elem.parent) {
							var childs = elem.parent.children;
							childs.splice(childs.lastIndexOf(elem), 1);
						}
					}
					exports.removeElement = removeElement;
					/***
					 * Replace an element in the dom
					 *
					 * @argument elem The element to be replaced
					 * @argument replacement The element to be added
					 */
					function replaceElement(elem, replacement) {
						var prev = (replacement.prev = elem.prev);
						if (prev) {
							prev.next = replacement;
						}
						var next = (replacement.next = elem.next);
						if (next) {
							next.prev = replacement;
						}
						var parent = (replacement.parent = elem.parent);
						if (parent) {
							var childs = parent.children;
							childs[childs.lastIndexOf(elem)] = replacement;
						}
					}
					exports.replaceElement = replaceElement;
					/***
					 * Append a child to an element
					 *
					 * @argument elem The element to append to
					 * @argument child The element to be added as a child
					 */
					function appendChild(elem, child) {
						child.parent = elem;
						if (elem.children.push(child) !== 1) {
							var sibling = elem.children[elem.children.length - 2];
							sibling.next = child;
							child.prev = sibling;
							child.next = null;
						}
					}
					exports.appendChild = appendChild;
					/***
					 * Append an element after another
					 *
					 * @argument elem The element to append to
					 * @argument next The element be added
					 */
					function append(elem, next) {
						var parent = elem.parent,
							currNext = elem.next;
						next.next = currNext;
						next.prev = elem;
						elem.next = next;
						next.parent = parent;
						if (currNext) {
							currNext.prev = next;
							if (parent) {
								var childs = parent.children;
								childs.splice(childs.lastIndexOf(currNext), 0, next);
							}
						} else if (parent) {
							parent.children.push(next);
						}
					}
					exports.append = append;
					/***
					 * Prepend an element before another
					 *
					 * @argument elem The element to append to
					 * @argument prev The element be added
					 */
					function prepend(elem, prev) {
						var parent = elem.parent;
						if (parent) {
							var childs = parent.children;
							childs.splice(childs.lastIndexOf(elem), 0, prev);
						}
						if (elem.prev) {
							elem.prev.next = prev;
						}
						prev.parent = parent;
						prev.prev = elem.prev;
						prev.next = elem;
						elem.prev = prev;
					}
					exports.prepend = prepend;
				},
				{},
			],
			18: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					var tagtypes_1 = require("./tagtypes");
					function filter(test, element, recurse, limit) {
						if (recurse === void 0) {
							recurse = true;
						}
						if (limit === void 0) {
							limit = Infinity;
						}
						if (!Array.isArray(element)) element = [element];
						return find(test, element, recurse, limit);
					}
					exports.filter = filter;
					function find(test, elems, recurse, limit) {
						var result = [];
						for (var i = 0; i < elems.length; i++) {
							var elem = elems[i];
							if (test(elem)) {
								result.push(elem);
								if (--limit <= 0) break;
							}
							if (
								recurse &&
								tagtypes_1.hasChildren(elem) &&
								elem.children.length > 0
							) {
								var children = find(test, elem.children, recurse, limit);
								result = result.concat(children);
								limit -= children.length;
								if (limit <= 0) break;
							}
						}
						return result;
					}
					exports.find = find;
					function findOneChild(test, elems) {
						for (var i = 0; i < elems.length; i++) {
							if (test(elems[i])) return elems[i];
						}
						return null;
					}
					exports.findOneChild = findOneChild;
					function findOne(test, elems, recurse) {
						if (recurse === void 0) {
							recurse = true;
						}
						var elem = null;
						for (var i = 0; i < elems.length && !elem; i++) {
							var checked = elems[i];
							if (!tagtypes_1.isTag(checked)) {
								continue;
							} else if (test(checked)) {
								elem = checked;
							} else if (recurse && checked.children.length > 0) {
								elem = findOne(test, checked.children);
							}
						}
						return elem;
					}
					exports.findOne = findOne;
					function existsOne(test, elems) {
						for (var i = 0; i < elems.length; i++) {
							var checked = elems[i];
							if (
								tagtypes_1.isTag(checked) &&
								(test(checked) ||
									(checked.children.length > 0 &&
										existsOne(test, checked.children)))
							) {
								return true;
							}
						}
						return false;
					}
					exports.existsOne = existsOne;
					function findAll(test, rootElems) {
						var result = [];
						var stack = rootElems.slice();
						while (stack.length) {
							var elem = stack.shift();
							if (!elem || !tagtypes_1.isTag(elem)) continue;
							if (elem.children && elem.children.length > 0) {
								stack.unshift.apply(stack, elem.children);
							}
							if (test(elem)) result.push(elem);
						}
						return result;
					}
					exports.findAll = findAll;
				},
				{ "./tagtypes": 20 },
			],
			19: [
				function(require, module, exports) {
					"use strict";
					var __importDefault =
						(this && this.__importDefault) ||
						function(mod) {
							return mod && mod.__esModule ? mod : { default: mod };
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var tagtypes_1 = require("./tagtypes");
					var dom_serializer_1 = __importDefault(require("dom-serializer"));
					exports.getOuterHTML = dom_serializer_1.default;
					function getInnerHTML(node, options) {
						return tagtypes_1.hasChildren(node)
							? node.children
									.map(function(node) {
										return exports.getOuterHTML(node, options);
									})
									.join("")
							: "";
					}
					exports.getInnerHTML = getInnerHTML;
					function getText(node) {
						if (Array.isArray(node)) return node.map(getText).join("");
						if (tagtypes_1.isTag(node))
							return node.name === "br" ? "\n" : getText(node.children);
						if (tagtypes_1.isCDATA(node)) return getText(node.children);
						if (tagtypes_1.isText(node)) return node.data;
						return "";
					}
					exports.getText = getText;
				},
				{ "./tagtypes": 20, "dom-serializer": 10 },
			],
			20: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					var domelementtype_1 = require("domelementtype");
					function isTag(node) {
						return domelementtype_1.isTag(node);
					}
					exports.isTag = isTag;
					function isCDATA(node) {
						return "cdata" /* CDATA */ === node.type;
					}
					exports.isCDATA = isCDATA;
					function isText(node) {
						return node.type === "text" /* Text */;
					}
					exports.isText = isText;
					function isComment(node) {
						return node.type === "comment" /* Comment */;
					}
					exports.isComment = isComment;
					function hasChildren(node) {
						return Object.prototype.hasOwnProperty.call(node, "children");
					}
					exports.hasChildren = hasChildren;
				},
				{ domelementtype: 11 },
			],
			21: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					function getChildren(elem) {
						// @ts-ignore
						return elem.children || null;
					}
					exports.getChildren = getChildren;
					function getParent(elem) {
						return elem.parent || null;
					}
					exports.getParent = getParent;
					function getSiblings(elem) {
						var parent = getParent(elem);
						return parent ? getChildren(parent) : [elem];
					}
					exports.getSiblings = getSiblings;
					function getAttributeValue(elem, name) {
						return elem.attribs && elem.attribs[name];
					}
					exports.getAttributeValue = getAttributeValue;
					function hasAttrib(elem, name) {
						return !!getAttributeValue(elem, name);
					}
					exports.hasAttrib = hasAttrib;
					/***
					 * Returns the name property of an element
					 *
					 * @argument elem The element to get the name for
					 */
					function getName(elem) {
						return elem.name;
					}
					exports.getName = getName;
				},
				{},
			],
			22: [
				function(require, module, exports) {
					"use strict";
					var __importDefault =
						(this && this.__importDefault) ||
						function(mod) {
							return mod && mod.__esModule ? mod : { default: mod };
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var entities_json_1 = __importDefault(
						require("./maps/entities.json"),
					);
					var legacy_json_1 = __importDefault(require("./maps/legacy.json"));
					var xml_json_1 = __importDefault(require("./maps/xml.json"));
					var decode_codepoint_1 = __importDefault(
						require("./decode_codepoint"),
					);
					exports.decodeXML = getStrictDecoder(xml_json_1.default);
					exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
					function getStrictDecoder(map) {
						var keys = Object.keys(map).join("|");
						var replace = getReplacer(map);
						keys += "|#[xX][\\da-fA-F]+|#\\d+";
						var re = new RegExp("&(?:" + keys + ");", "g");
						return function(str) {
							return String(str).replace(re, replace);
						};
					}
					var sorter = function(a, b) {
						return a < b ? 1 : -1;
					};
					exports.decodeHTML = (function() {
						var legacy = Object.keys(legacy_json_1.default).sort(sorter);
						var keys = Object.keys(entities_json_1.default).sort(sorter);
						for (var i = 0, j = 0; i < keys.length; i++) {
							if (legacy[j] === keys[i]) {
								keys[i] += ";?";
								j++;
							} else {
								keys[i] += ";";
							}
						}
						var re = new RegExp(
							"&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)",
							"g",
						);
						var replace = getReplacer(entities_json_1.default);
						function replacer(str) {
							if (str.substr(-1) !== ";") str += ";";
							return replace(str);
						}
						//TODO consider creating a merged map
						return function(str) {
							return String(str).replace(re, replacer);
						};
					})();
					function getReplacer(map) {
						return function replace(str) {
							if (str.charAt(1) === "#") {
								if (str.charAt(2) === "X" || str.charAt(2) === "x") {
									return decode_codepoint_1.default(
										parseInt(str.substr(3), 16),
									);
								}
								return decode_codepoint_1.default(parseInt(str.substr(2), 10));
							}
							return map[str.slice(1, -1)];
						};
					}
				},
				{
					"./decode_codepoint": 23,
					"./maps/entities.json": 27,
					"./maps/legacy.json": 28,
					"./maps/xml.json": 29,
				},
			],
			23: [
				function(require, module, exports) {
					"use strict";
					var __importDefault =
						(this && this.__importDefault) ||
						function(mod) {
							return mod && mod.__esModule ? mod : { default: mod };
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var decode_json_1 = __importDefault(require("./maps/decode.json"));
					// modified version of https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
					function decodeCodePoint(codePoint) {
						if (
							(codePoint >= 0xd800 && codePoint <= 0xdfff) ||
							codePoint > 0x10ffff
						) {
							return "\uFFFD";
						}
						if (codePoint in decode_json_1.default) {
							// @ts-ignore
							codePoint = decode_json_1.default[codePoint];
						}
						var output = "";
						if (codePoint > 0xffff) {
							codePoint -= 0x10000;
							output += String.fromCharCode(
								((codePoint >>> 10) & 0x3ff) | 0xd800,
							);
							codePoint = 0xdc00 | (codePoint & 0x3ff);
						}
						output += String.fromCharCode(codePoint);
						return output;
					}
					exports.default = decodeCodePoint;
				},
				{ "./maps/decode.json": 26 },
			],
			24: [
				function(require, module, exports) {
					"use strict";
					var __importDefault =
						(this && this.__importDefault) ||
						function(mod) {
							return mod && mod.__esModule ? mod : { default: mod };
						};
					Object.defineProperty(exports, "__esModule", { value: true });
					var xml_json_1 = __importDefault(require("./maps/xml.json"));
					var inverseXML = getInverseObj(xml_json_1.default);
					var xmlReplacer = getInverseReplacer(inverseXML);
					exports.encodeXML = getInverse(inverseXML, xmlReplacer);
					var entities_json_1 = __importDefault(
						require("./maps/entities.json"),
					);
					var inverseHTML = getInverseObj(entities_json_1.default);
					var htmlReplacer = getInverseReplacer(inverseHTML);
					exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
					function getInverseObj(obj) {
						return Object.keys(obj)
							.sort()
							.reduce(function(inverse, name) {
								inverse[obj[name]] = "&" + name + ";";
								return inverse;
							}, {});
					}
					function getInverseReplacer(inverse) {
						var single = [];
						var multiple = [];
						Object.keys(inverse).forEach(function(k) {
							return k.length === 1
								? // Add value to single array
								  single.push("\\" + k)
								: // Add value to multiple array
								  multiple.push(k);
						});
						//TODO add ranges
						multiple.unshift("[" + single.join("") + "]");
						return new RegExp(multiple.join("|"), "g");
					}
					var reNonASCII = /[^\0-\x7F]/g;
					var reAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
					function singleCharReplacer(c) {
						return (
							"&#x" +
							c
								.charCodeAt(0)
								.toString(16)
								.toUpperCase() +
							";"
						);
					}
					// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
					function astralReplacer(c, _) {
						// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
						var high = c.charCodeAt(0);
						var low = c.charCodeAt(1);
						var codePoint = (high - 0xd800) * 0x400 + low - 0xdc00 + 0x10000;
						return "&#x" + codePoint.toString(16).toUpperCase() + ";";
					}
					function getInverse(inverse, re) {
						return function(data) {
							return data
								.replace(re, function(name) {
									return inverse[name];
								})
								.replace(reAstralSymbols, astralReplacer)
								.replace(reNonASCII, singleCharReplacer);
						};
					}
					var reXmlChars = getInverseReplacer(inverseXML);
					function escape(data) {
						return data
							.replace(reXmlChars, singleCharReplacer)
							.replace(reAstralSymbols, astralReplacer)
							.replace(reNonASCII, singleCharReplacer);
					}
					exports.escape = escape;
				},
				{ "./maps/entities.json": 27, "./maps/xml.json": 29 },
			],
			25: [
				function(require, module, exports) {
					"use strict";
					Object.defineProperty(exports, "__esModule", { value: true });
					var decode_1 = require("./decode");
					var encode_1 = require("./encode");
					function decode(data, level) {
						return (!level || level <= 0
							? decode_1.decodeXML
							: decode_1.decodeHTML)(data);
					}
					exports.decode = decode;
					function decodeStrict(data, level) {
						return (!level || level <= 0
							? decode_1.decodeXML
							: decode_1.decodeHTMLStrict)(data);
					}
					exports.decodeStrict = decodeStrict;
					function encode(data, level) {
						return (!level || level <= 0
							? encode_1.encodeXML
							: encode_1.encodeHTML)(data);
					}
					exports.encode = encode;
					var encode_2 = require("./encode");
					exports.encodeXML = encode_2.encodeXML;
					exports.encodeHTML = encode_2.encodeHTML;
					exports.escape = encode_2.escape;
					// Legacy aliases
					exports.encodeHTML4 = encode_2.encodeHTML;
					exports.encodeHTML5 = encode_2.encodeHTML;
					var decode_2 = require("./decode");
					exports.decodeXML = decode_2.decodeXML;
					exports.decodeHTML = decode_2.decodeHTML;
					exports.decodeHTMLStrict = decode_2.decodeHTMLStrict;
					// Legacy aliases
					exports.decodeHTML4 = decode_2.decodeHTML;
					exports.decodeHTML5 = decode_2.decodeHTML;
					exports.decodeHTML4Strict = decode_2.decodeHTMLStrict;
					exports.decodeHTML5Strict = decode_2.decodeHTMLStrict;
					exports.decodeXMLStrict = decode_2.decodeXML;
				},
				{ "./decode": 22, "./encode": 24 },
			],
			26: [
				function(require, module, exports) {
					module.exports = {
						"0": 65533,
						"128": 8364,
						"130": 8218,
						"131": 402,
						"132": 8222,
						"133": 8230,
						"134": 8224,
						"135": 8225,
						"136": 710,
						"137": 8240,
						"138": 352,
						"139": 8249,
						"140": 338,
						"142": 381,
						"145": 8216,
						"146": 8217,
						"147": 8220,
						"148": 8221,
						"149": 8226,
						"150": 8211,
						"151": 8212,
						"152": 732,
						"153": 8482,
						"154": 353,
						"155": 8250,
						"156": 339,
						"158": 382,
						"159": 376,
					};
				},
				{},
			],
			27: [
				function(require, module, exports) {
					module.exports = {
						Aacute: "\u00C1",
						aacute: "\u00E1",
						Abreve: "\u0102",
						abreve: "\u0103",
						ac: "\u223E",
						acd: "\u223F",
						acE: "\u223E\u0333",
						Acirc: "\u00C2",
						acirc: "\u00E2",
						acute: "\u00B4",
						Acy: "\u0410",
						acy: "\u0430",
						AElig: "\u00C6",
						aelig: "\u00E6",
						af: "\u2061",
						Afr: "\uD835\uDD04",
						afr: "\uD835\uDD1E",
						Agrave: "\u00C0",
						agrave: "\u00E0",
						alefsym: "\u2135",
						aleph: "\u2135",
						Alpha: "\u0391",
						alpha: "\u03B1",
						Amacr: "\u0100",
						amacr: "\u0101",
						amalg: "\u2A3F",
						amp: "&",
						AMP: "&",
						andand: "\u2A55",
						And: "\u2A53",
						and: "\u2227",
						andd: "\u2A5C",
						andslope: "\u2A58",
						andv: "\u2A5A",
						ang: "\u2220",
						ange: "\u29A4",
						angle: "\u2220",
						angmsdaa: "\u29A8",
						angmsdab: "\u29A9",
						angmsdac: "\u29AA",
						angmsdad: "\u29AB",
						angmsdae: "\u29AC",
						angmsdaf: "\u29AD",
						angmsdag: "\u29AE",
						angmsdah: "\u29AF",
						angmsd: "\u2221",
						angrt: "\u221F",
						angrtvb: "\u22BE",
						angrtvbd: "\u299D",
						angsph: "\u2222",
						angst: "\u00C5",
						angzarr: "\u237C",
						Aogon: "\u0104",
						aogon: "\u0105",
						Aopf: "\uD835\uDD38",
						aopf: "\uD835\uDD52",
						apacir: "\u2A6F",
						ap: "\u2248",
						apE: "\u2A70",
						ape: "\u224A",
						apid: "\u224B",
						apos: "'",
						ApplyFunction: "\u2061",
						approx: "\u2248",
						approxeq: "\u224A",
						Aring: "\u00C5",
						aring: "\u00E5",
						Ascr: "\uD835\uDC9C",
						ascr: "\uD835\uDCB6",
						Assign: "\u2254",
						ast: "*",
						asymp: "\u2248",
						asympeq: "\u224D",
						Atilde: "\u00C3",
						atilde: "\u00E3",
						Auml: "\u00C4",
						auml: "\u00E4",
						awconint: "\u2233",
						awint: "\u2A11",
						backcong: "\u224C",
						backepsilon: "\u03F6",
						backprime: "\u2035",
						backsim: "\u223D",
						backsimeq: "\u22CD",
						Backslash: "\u2216",
						Barv: "\u2AE7",
						barvee: "\u22BD",
						barwed: "\u2305",
						Barwed: "\u2306",
						barwedge: "\u2305",
						bbrk: "\u23B5",
						bbrktbrk: "\u23B6",
						bcong: "\u224C",
						Bcy: "\u0411",
						bcy: "\u0431",
						bdquo: "\u201E",
						becaus: "\u2235",
						because: "\u2235",
						Because: "\u2235",
						bemptyv: "\u29B0",
						bepsi: "\u03F6",
						bernou: "\u212C",
						Bernoullis: "\u212C",
						Beta: "\u0392",
						beta: "\u03B2",
						beth: "\u2136",
						between: "\u226C",
						Bfr: "\uD835\uDD05",
						bfr: "\uD835\uDD1F",
						bigcap: "\u22C2",
						bigcirc: "\u25EF",
						bigcup: "\u22C3",
						bigodot: "\u2A00",
						bigoplus: "\u2A01",
						bigotimes: "\u2A02",
						bigsqcup: "\u2A06",
						bigstar: "\u2605",
						bigtriangledown: "\u25BD",
						bigtriangleup: "\u25B3",
						biguplus: "\u2A04",
						bigvee: "\u22C1",
						bigwedge: "\u22C0",
						bkarow: "\u290D",
						blacklozenge: "\u29EB",
						blacksquare: "\u25AA",
						blacktriangle: "\u25B4",
						blacktriangledown: "\u25BE",
						blacktriangleleft: "\u25C2",
						blacktriangleright: "\u25B8",
						blank: "\u2423",
						blk12: "\u2592",
						blk14: "\u2591",
						blk34: "\u2593",
						block: "\u2588",
						bne: "=\u20E5",
						bnequiv: "\u2261\u20E5",
						bNot: "\u2AED",
						bnot: "\u2310",
						Bopf: "\uD835\uDD39",
						bopf: "\uD835\uDD53",
						bot: "\u22A5",
						bottom: "\u22A5",
						bowtie: "\u22C8",
						boxbox: "\u29C9",
						boxdl: "\u2510",
						boxdL: "\u2555",
						boxDl: "\u2556",
						boxDL: "\u2557",
						boxdr: "\u250C",
						boxdR: "\u2552",
						boxDr: "\u2553",
						boxDR: "\u2554",
						boxh: "\u2500",
						boxH: "\u2550",
						boxhd: "\u252C",
						boxHd: "\u2564",
						boxhD: "\u2565",
						boxHD: "\u2566",
						boxhu: "\u2534",
						boxHu: "\u2567",
						boxhU: "\u2568",
						boxHU: "\u2569",
						boxminus: "\u229F",
						boxplus: "\u229E",
						boxtimes: "\u22A0",
						boxul: "\u2518",
						boxuL: "\u255B",
						boxUl: "\u255C",
						boxUL: "\u255D",
						boxur: "\u2514",
						boxuR: "\u2558",
						boxUr: "\u2559",
						boxUR: "\u255A",
						boxv: "\u2502",
						boxV: "\u2551",
						boxvh: "\u253C",
						boxvH: "\u256A",
						boxVh: "\u256B",
						boxVH: "\u256C",
						boxvl: "\u2524",
						boxvL: "\u2561",
						boxVl: "\u2562",
						boxVL: "\u2563",
						boxvr: "\u251C",
						boxvR: "\u255E",
						boxVr: "\u255F",
						boxVR: "\u2560",
						bprime: "\u2035",
						breve: "\u02D8",
						Breve: "\u02D8",
						brvbar: "\u00A6",
						bscr: "\uD835\uDCB7",
						Bscr: "\u212C",
						bsemi: "\u204F",
						bsim: "\u223D",
						bsime: "\u22CD",
						bsolb: "\u29C5",
						bsol: "\\",
						bsolhsub: "\u27C8",
						bull: "\u2022",
						bullet: "\u2022",
						bump: "\u224E",
						bumpE: "\u2AAE",
						bumpe: "\u224F",
						Bumpeq: "\u224E",
						bumpeq: "\u224F",
						Cacute: "\u0106",
						cacute: "\u0107",
						capand: "\u2A44",
						capbrcup: "\u2A49",
						capcap: "\u2A4B",
						cap: "\u2229",
						Cap: "\u22D2",
						capcup: "\u2A47",
						capdot: "\u2A40",
						CapitalDifferentialD: "\u2145",
						caps: "\u2229\uFE00",
						caret: "\u2041",
						caron: "\u02C7",
						Cayleys: "\u212D",
						ccaps: "\u2A4D",
						Ccaron: "\u010C",
						ccaron: "\u010D",
						Ccedil: "\u00C7",
						ccedil: "\u00E7",
						Ccirc: "\u0108",
						ccirc: "\u0109",
						Cconint: "\u2230",
						ccups: "\u2A4C",
						ccupssm: "\u2A50",
						Cdot: "\u010A",
						cdot: "\u010B",
						cedil: "\u00B8",
						Cedilla: "\u00B8",
						cemptyv: "\u29B2",
						cent: "\u00A2",
						centerdot: "\u00B7",
						CenterDot: "\u00B7",
						cfr: "\uD835\uDD20",
						Cfr: "\u212D",
						CHcy: "\u0427",
						chcy: "\u0447",
						check: "\u2713",
						checkmark: "\u2713",
						Chi: "\u03A7",
						chi: "\u03C7",
						circ: "\u02C6",
						circeq: "\u2257",
						circlearrowleft: "\u21BA",
						circlearrowright: "\u21BB",
						circledast: "\u229B",
						circledcirc: "\u229A",
						circleddash: "\u229D",
						CircleDot: "\u2299",
						circledR: "\u00AE",
						circledS: "\u24C8",
						CircleMinus: "\u2296",
						CirclePlus: "\u2295",
						CircleTimes: "\u2297",
						cir: "\u25CB",
						cirE: "\u29C3",
						cire: "\u2257",
						cirfnint: "\u2A10",
						cirmid: "\u2AEF",
						cirscir: "\u29C2",
						ClockwiseContourIntegral: "\u2232",
						CloseCurlyDoubleQuote: "\u201D",
						CloseCurlyQuote: "\u2019",
						clubs: "\u2663",
						clubsuit: "\u2663",
						colon: ":",
						Colon: "\u2237",
						Colone: "\u2A74",
						colone: "\u2254",
						coloneq: "\u2254",
						comma: ",",
						commat: "@",
						comp: "\u2201",
						compfn: "\u2218",
						complement: "\u2201",
						complexes: "\u2102",
						cong: "\u2245",
						congdot: "\u2A6D",
						Congruent: "\u2261",
						conint: "\u222E",
						Conint: "\u222F",
						ContourIntegral: "\u222E",
						copf: "\uD835\uDD54",
						Copf: "\u2102",
						coprod: "\u2210",
						Coproduct: "\u2210",
						copy: "\u00A9",
						COPY: "\u00A9",
						copysr: "\u2117",
						CounterClockwiseContourIntegral: "\u2233",
						crarr: "\u21B5",
						cross: "\u2717",
						Cross: "\u2A2F",
						Cscr: "\uD835\uDC9E",
						cscr: "\uD835\uDCB8",
						csub: "\u2ACF",
						csube: "\u2AD1",
						csup: "\u2AD0",
						csupe: "\u2AD2",
						ctdot: "\u22EF",
						cudarrl: "\u2938",
						cudarrr: "\u2935",
						cuepr: "\u22DE",
						cuesc: "\u22DF",
						cularr: "\u21B6",
						cularrp: "\u293D",
						cupbrcap: "\u2A48",
						cupcap: "\u2A46",
						CupCap: "\u224D",
						cup: "\u222A",
						Cup: "\u22D3",
						cupcup: "\u2A4A",
						cupdot: "\u228D",
						cupor: "\u2A45",
						cups: "\u222A\uFE00",
						curarr: "\u21B7",
						curarrm: "\u293C",
						curlyeqprec: "\u22DE",
						curlyeqsucc: "\u22DF",
						curlyvee: "\u22CE",
						curlywedge: "\u22CF",
						curren: "\u00A4",
						curvearrowleft: "\u21B6",
						curvearrowright: "\u21B7",
						cuvee: "\u22CE",
						cuwed: "\u22CF",
						cwconint: "\u2232",
						cwint: "\u2231",
						cylcty: "\u232D",
						dagger: "\u2020",
						Dagger: "\u2021",
						daleth: "\u2138",
						darr: "\u2193",
						Darr: "\u21A1",
						dArr: "\u21D3",
						dash: "\u2010",
						Dashv: "\u2AE4",
						dashv: "\u22A3",
						dbkarow: "\u290F",
						dblac: "\u02DD",
						Dcaron: "\u010E",
						dcaron: "\u010F",
						Dcy: "\u0414",
						dcy: "\u0434",
						ddagger: "\u2021",
						ddarr: "\u21CA",
						DD: "\u2145",
						dd: "\u2146",
						DDotrahd: "\u2911",
						ddotseq: "\u2A77",
						deg: "\u00B0",
						Del: "\u2207",
						Delta: "\u0394",
						delta: "\u03B4",
						demptyv: "\u29B1",
						dfisht: "\u297F",
						Dfr: "\uD835\uDD07",
						dfr: "\uD835\uDD21",
						dHar: "\u2965",
						dharl: "\u21C3",
						dharr: "\u21C2",
						DiacriticalAcute: "\u00B4",
						DiacriticalDot: "\u02D9",
						DiacriticalDoubleAcute: "\u02DD",
						DiacriticalGrave: "`",
						DiacriticalTilde: "\u02DC",
						diam: "\u22C4",
						diamond: "\u22C4",
						Diamond: "\u22C4",
						diamondsuit: "\u2666",
						diams: "\u2666",
						die: "\u00A8",
						DifferentialD: "\u2146",
						digamma: "\u03DD",
						disin: "\u22F2",
						div: "\u00F7",
						divide: "\u00F7",
						divideontimes: "\u22C7",
						divonx: "\u22C7",
						DJcy: "\u0402",
						djcy: "\u0452",
						dlcorn: "\u231E",
						dlcrop: "\u230D",
						dollar: "$",
						Dopf: "\uD835\uDD3B",
						dopf: "\uD835\uDD55",
						Dot: "\u00A8",
						dot: "\u02D9",
						DotDot: "\u20DC",
						doteq: "\u2250",
						doteqdot: "\u2251",
						DotEqual: "\u2250",
						dotminus: "\u2238",
						dotplus: "\u2214",
						dotsquare: "\u22A1",
						doublebarwedge: "\u2306",
						DoubleContourIntegral: "\u222F",
						DoubleDot: "\u00A8",
						DoubleDownArrow: "\u21D3",
						DoubleLeftArrow: "\u21D0",
						DoubleLeftRightArrow: "\u21D4",
						DoubleLeftTee: "\u2AE4",
						DoubleLongLeftArrow: "\u27F8",
						DoubleLongLeftRightArrow: "\u27FA",
						DoubleLongRightArrow: "\u27F9",
						DoubleRightArrow: "\u21D2",
						DoubleRightTee: "\u22A8",
						DoubleUpArrow: "\u21D1",
						DoubleUpDownArrow: "\u21D5",
						DoubleVerticalBar: "\u2225",
						DownArrowBar: "\u2913",
						downarrow: "\u2193",
						DownArrow: "\u2193",
						Downarrow: "\u21D3",
						DownArrowUpArrow: "\u21F5",
						DownBreve: "\u0311",
						downdownarrows: "\u21CA",
						downharpoonleft: "\u21C3",
						downharpoonright: "\u21C2",
						DownLeftRightVector: "\u2950",
						DownLeftTeeVector: "\u295E",
						DownLeftVectorBar: "\u2956",
						DownLeftVector: "\u21BD",
						DownRightTeeVector: "\u295F",
						DownRightVectorBar: "\u2957",
						DownRightVector: "\u21C1",
						DownTeeArrow: "\u21A7",
						DownTee: "\u22A4",
						drbkarow: "\u2910",
						drcorn: "\u231F",
						drcrop: "\u230C",
						Dscr: "\uD835\uDC9F",
						dscr: "\uD835\uDCB9",
						DScy: "\u0405",
						dscy: "\u0455",
						dsol: "\u29F6",
						Dstrok: "\u0110",
						dstrok: "\u0111",
						dtdot: "\u22F1",
						dtri: "\u25BF",
						dtrif: "\u25BE",
						duarr: "\u21F5",
						duhar: "\u296F",
						dwangle: "\u29A6",
						DZcy: "\u040F",
						dzcy: "\u045F",
						dzigrarr: "\u27FF",
						Eacute: "\u00C9",
						eacute: "\u00E9",
						easter: "\u2A6E",
						Ecaron: "\u011A",
						ecaron: "\u011B",
						Ecirc: "\u00CA",
						ecirc: "\u00EA",
						ecir: "\u2256",
						ecolon: "\u2255",
						Ecy: "\u042D",
						ecy: "\u044D",
						eDDot: "\u2A77",
						Edot: "\u0116",
						edot: "\u0117",
						eDot: "\u2251",
						ee: "\u2147",
						efDot: "\u2252",
						Efr: "\uD835\uDD08",
						efr: "\uD835\uDD22",
						eg: "\u2A9A",
						Egrave: "\u00C8",
						egrave: "\u00E8",
						egs: "\u2A96",
						egsdot: "\u2A98",
						el: "\u2A99",
						Element: "\u2208",
						elinters: "\u23E7",
						ell: "\u2113",
						els: "\u2A95",
						elsdot: "\u2A97",
						Emacr: "\u0112",
						emacr: "\u0113",
						empty: "\u2205",
						emptyset: "\u2205",
						EmptySmallSquare: "\u25FB",
						emptyv: "\u2205",
						EmptyVerySmallSquare: "\u25AB",
						emsp13: "\u2004",
						emsp14: "\u2005",
						emsp: "\u2003",
						ENG: "\u014A",
						eng: "\u014B",
						ensp: "\u2002",
						Eogon: "\u0118",
						eogon: "\u0119",
						Eopf: "\uD835\uDD3C",
						eopf: "\uD835\uDD56",
						epar: "\u22D5",
						eparsl: "\u29E3",
						eplus: "\u2A71",
						epsi: "\u03B5",
						Epsilon: "\u0395",
						epsilon: "\u03B5",
						epsiv: "\u03F5",
						eqcirc: "\u2256",
						eqcolon: "\u2255",
						eqsim: "\u2242",
						eqslantgtr: "\u2A96",
						eqslantless: "\u2A95",
						Equal: "\u2A75",
						equals: "=",
						EqualTilde: "\u2242",
						equest: "\u225F",
						Equilibrium: "\u21CC",
						equiv: "\u2261",
						equivDD: "\u2A78",
						eqvparsl: "\u29E5",
						erarr: "\u2971",
						erDot: "\u2253",
						escr: "\u212F",
						Escr: "\u2130",
						esdot: "\u2250",
						Esim: "\u2A73",
						esim: "\u2242",
						Eta: "\u0397",
						eta: "\u03B7",
						ETH: "\u00D0",
						eth: "\u00F0",
						Euml: "\u00CB",
						euml: "\u00EB",
						euro: "\u20AC",
						excl: "!",
						exist: "\u2203",
						Exists: "\u2203",
						expectation: "\u2130",
						exponentiale: "\u2147",
						ExponentialE: "\u2147",
						fallingdotseq: "\u2252",
						Fcy: "\u0424",
						fcy: "\u0444",
						female: "\u2640",
						ffilig: "\uFB03",
						fflig: "\uFB00",
						ffllig: "\uFB04",
						Ffr: "\uD835\uDD09",
						ffr: "\uD835\uDD23",
						filig: "\uFB01",
						FilledSmallSquare: "\u25FC",
						FilledVerySmallSquare: "\u25AA",
						fjlig: "fj",
						flat: "\u266D",
						fllig: "\uFB02",
						fltns: "\u25B1",
						fnof: "\u0192",
						Fopf: "\uD835\uDD3D",
						fopf: "\uD835\uDD57",
						forall: "\u2200",
						ForAll: "\u2200",
						fork: "\u22D4",
						forkv: "\u2AD9",
						Fouriertrf: "\u2131",
						fpartint: "\u2A0D",
						frac12: "\u00BD",
						frac13: "\u2153",
						frac14: "\u00BC",
						frac15: "\u2155",
						frac16: "\u2159",
						frac18: "\u215B",
						frac23: "\u2154",
						frac25: "\u2156",
						frac34: "\u00BE",
						frac35: "\u2157",
						frac38: "\u215C",
						frac45: "\u2158",
						frac56: "\u215A",
						frac58: "\u215D",
						frac78: "\u215E",
						frasl: "\u2044",
						frown: "\u2322",
						fscr: "\uD835\uDCBB",
						Fscr: "\u2131",
						gacute: "\u01F5",
						Gamma: "\u0393",
						gamma: "\u03B3",
						Gammad: "\u03DC",
						gammad: "\u03DD",
						gap: "\u2A86",
						Gbreve: "\u011E",
						gbreve: "\u011F",
						Gcedil: "\u0122",
						Gcirc: "\u011C",
						gcirc: "\u011D",
						Gcy: "\u0413",
						gcy: "\u0433",
						Gdot: "\u0120",
						gdot: "\u0121",
						ge: "\u2265",
						gE: "\u2267",
						gEl: "\u2A8C",
						gel: "\u22DB",
						geq: "\u2265",
						geqq: "\u2267",
						geqslant: "\u2A7E",
						gescc: "\u2AA9",
						ges: "\u2A7E",
						gesdot: "\u2A80",
						gesdoto: "\u2A82",
						gesdotol: "\u2A84",
						gesl: "\u22DB\uFE00",
						gesles: "\u2A94",
						Gfr: "\uD835\uDD0A",
						gfr: "\uD835\uDD24",
						gg: "\u226B",
						Gg: "\u22D9",
						ggg: "\u22D9",
						gimel: "\u2137",
						GJcy: "\u0403",
						gjcy: "\u0453",
						gla: "\u2AA5",
						gl: "\u2277",
						glE: "\u2A92",
						glj: "\u2AA4",
						gnap: "\u2A8A",
						gnapprox: "\u2A8A",
						gne: "\u2A88",
						gnE: "\u2269",
						gneq: "\u2A88",
						gneqq: "\u2269",
						gnsim: "\u22E7",
						Gopf: "\uD835\uDD3E",
						gopf: "\uD835\uDD58",
						grave: "`",
						GreaterEqual: "\u2265",
						GreaterEqualLess: "\u22DB",
						GreaterFullEqual: "\u2267",
						GreaterGreater: "\u2AA2",
						GreaterLess: "\u2277",
						GreaterSlantEqual: "\u2A7E",
						GreaterTilde: "\u2273",
						Gscr: "\uD835\uDCA2",
						gscr: "\u210A",
						gsim: "\u2273",
						gsime: "\u2A8E",
						gsiml: "\u2A90",
						gtcc: "\u2AA7",
						gtcir: "\u2A7A",
						gt: ">",
						GT: ">",
						Gt: "\u226B",
						gtdot: "\u22D7",
						gtlPar: "\u2995",
						gtquest: "\u2A7C",
						gtrapprox: "\u2A86",
						gtrarr: "\u2978",
						gtrdot: "\u22D7",
						gtreqless: "\u22DB",
						gtreqqless: "\u2A8C",
						gtrless: "\u2277",
						gtrsim: "\u2273",
						gvertneqq: "\u2269\uFE00",
						gvnE: "\u2269\uFE00",
						Hacek: "\u02C7",
						hairsp: "\u200A",
						half: "\u00BD",
						hamilt: "\u210B",
						HARDcy: "\u042A",
						hardcy: "\u044A",
						harrcir: "\u2948",
						harr: "\u2194",
						hArr: "\u21D4",
						harrw: "\u21AD",
						Hat: "^",
						hbar: "\u210F",
						Hcirc: "\u0124",
						hcirc: "\u0125",
						hearts: "\u2665",
						heartsuit: "\u2665",
						hellip: "\u2026",
						hercon: "\u22B9",
						hfr: "\uD835\uDD25",
						Hfr: "\u210C",
						HilbertSpace: "\u210B",
						hksearow: "\u2925",
						hkswarow: "\u2926",
						hoarr: "\u21FF",
						homtht: "\u223B",
						hookleftarrow: "\u21A9",
						hookrightarrow: "\u21AA",
						hopf: "\uD835\uDD59",
						Hopf: "\u210D",
						horbar: "\u2015",
						HorizontalLine: "\u2500",
						hscr: "\uD835\uDCBD",
						Hscr: "\u210B",
						hslash: "\u210F",
						Hstrok: "\u0126",
						hstrok: "\u0127",
						HumpDownHump: "\u224E",
						HumpEqual: "\u224F",
						hybull: "\u2043",
						hyphen: "\u2010",
						Iacute: "\u00CD",
						iacute: "\u00ED",
						ic: "\u2063",
						Icirc: "\u00CE",
						icirc: "\u00EE",
						Icy: "\u0418",
						icy: "\u0438",
						Idot: "\u0130",
						IEcy: "\u0415",
						iecy: "\u0435",
						iexcl: "\u00A1",
						iff: "\u21D4",
						ifr: "\uD835\uDD26",
						Ifr: "\u2111",
						Igrave: "\u00CC",
						igrave: "\u00EC",
						ii: "\u2148",
						iiiint: "\u2A0C",
						iiint: "\u222D",
						iinfin: "\u29DC",
						iiota: "\u2129",
						IJlig: "\u0132",
						ijlig: "\u0133",
						Imacr: "\u012A",
						imacr: "\u012B",
						image: "\u2111",
						ImaginaryI: "\u2148",
						imagline: "\u2110",
						imagpart: "\u2111",
						imath: "\u0131",
						Im: "\u2111",
						imof: "\u22B7",
						imped: "\u01B5",
						Implies: "\u21D2",
						incare: "\u2105",
						in: "\u2208",
						infin: "\u221E",
						infintie: "\u29DD",
						inodot: "\u0131",
						intcal: "\u22BA",
						int: "\u222B",
						Int: "\u222C",
						integers: "\u2124",
						Integral: "\u222B",
						intercal: "\u22BA",
						Intersection: "\u22C2",
						intlarhk: "\u2A17",
						intprod: "\u2A3C",
						InvisibleComma: "\u2063",
						InvisibleTimes: "\u2062",
						IOcy: "\u0401",
						iocy: "\u0451",
						Iogon: "\u012E",
						iogon: "\u012F",
						Iopf: "\uD835\uDD40",
						iopf: "\uD835\uDD5A",
						Iota: "\u0399",
						iota: "\u03B9",
						iprod: "\u2A3C",
						iquest: "\u00BF",
						iscr: "\uD835\uDCBE",
						Iscr: "\u2110",
						isin: "\u2208",
						isindot: "\u22F5",
						isinE: "\u22F9",
						isins: "\u22F4",
						isinsv: "\u22F3",
						isinv: "\u2208",
						it: "\u2062",
						Itilde: "\u0128",
						itilde: "\u0129",
						Iukcy: "\u0406",
						iukcy: "\u0456",
						Iuml: "\u00CF",
						iuml: "\u00EF",
						Jcirc: "\u0134",
						jcirc: "\u0135",
						Jcy: "\u0419",
						jcy: "\u0439",
						Jfr: "\uD835\uDD0D",
						jfr: "\uD835\uDD27",
						jmath: "\u0237",
						Jopf: "\uD835\uDD41",
						jopf: "\uD835\uDD5B",
						Jscr: "\uD835\uDCA5",
						jscr: "\uD835\uDCBF",
						Jsercy: "\u0408",
						jsercy: "\u0458",
						Jukcy: "\u0404",
						jukcy: "\u0454",
						Kappa: "\u039A",
						kappa: "\u03BA",
						kappav: "\u03F0",
						Kcedil: "\u0136",
						kcedil: "\u0137",
						Kcy: "\u041A",
						kcy: "\u043A",
						Kfr: "\uD835\uDD0E",
						kfr: "\uD835\uDD28",
						kgreen: "\u0138",
						KHcy: "\u0425",
						khcy: "\u0445",
						KJcy: "\u040C",
						kjcy: "\u045C",
						Kopf: "\uD835\uDD42",
						kopf: "\uD835\uDD5C",
						Kscr: "\uD835\uDCA6",
						kscr: "\uD835\uDCC0",
						lAarr: "\u21DA",
						Lacute: "\u0139",
						lacute: "\u013A",
						laemptyv: "\u29B4",
						lagran: "\u2112",
						Lambda: "\u039B",
						lambda: "\u03BB",
						lang: "\u27E8",
						Lang: "\u27EA",
						langd: "\u2991",
						langle: "\u27E8",
						lap: "\u2A85",
						Laplacetrf: "\u2112",
						laquo: "\u00AB",
						larrb: "\u21E4",
						larrbfs: "\u291F",
						larr: "\u2190",
						Larr: "\u219E",
						lArr: "\u21D0",
						larrfs: "\u291D",
						larrhk: "\u21A9",
						larrlp: "\u21AB",
						larrpl: "\u2939",
						larrsim: "\u2973",
						larrtl: "\u21A2",
						latail: "\u2919",
						lAtail: "\u291B",
						lat: "\u2AAB",
						late: "\u2AAD",
						lates: "\u2AAD\uFE00",
						lbarr: "\u290C",
						lBarr: "\u290E",
						lbbrk: "\u2772",
						lbrace: "{",
						lbrack: "[",
						lbrke: "\u298B",
						lbrksld: "\u298F",
						lbrkslu: "\u298D",
						Lcaron: "\u013D",
						lcaron: "\u013E",
						Lcedil: "\u013B",
						lcedil: "\u013C",
						lceil: "\u2308",
						lcub: "{",
						Lcy: "\u041B",
						lcy: "\u043B",
						ldca: "\u2936",
						ldquo: "\u201C",
						ldquor: "\u201E",
						ldrdhar: "\u2967",
						ldrushar: "\u294B",
						ldsh: "\u21B2",
						le: "\u2264",
						lE: "\u2266",
						LeftAngleBracket: "\u27E8",
						LeftArrowBar: "\u21E4",
						leftarrow: "\u2190",
						LeftArrow: "\u2190",
						Leftarrow: "\u21D0",
						LeftArrowRightArrow: "\u21C6",
						leftarrowtail: "\u21A2",
						LeftCeiling: "\u2308",
						LeftDoubleBracket: "\u27E6",
						LeftDownTeeVector: "\u2961",
						LeftDownVectorBar: "\u2959",
						LeftDownVector: "\u21C3",
						LeftFloor: "\u230A",
						leftharpoondown: "\u21BD",
						leftharpoonup: "\u21BC",
						leftleftarrows: "\u21C7",
						leftrightarrow: "\u2194",
						LeftRightArrow: "\u2194",
						Leftrightarrow: "\u21D4",
						leftrightarrows: "\u21C6",
						leftrightharpoons: "\u21CB",
						leftrightsquigarrow: "\u21AD",
						LeftRightVector: "\u294E",
						LeftTeeArrow: "\u21A4",
						LeftTee: "\u22A3",
						LeftTeeVector: "\u295A",
						leftthreetimes: "\u22CB",
						LeftTriangleBar: "\u29CF",
						LeftTriangle: "\u22B2",
						LeftTriangleEqual: "\u22B4",
						LeftUpDownVector: "\u2951",
						LeftUpTeeVector: "\u2960",
						LeftUpVectorBar: "\u2958",
						LeftUpVector: "\u21BF",
						LeftVectorBar: "\u2952",
						LeftVector: "\u21BC",
						lEg: "\u2A8B",
						leg: "\u22DA",
						leq: "\u2264",
						leqq: "\u2266",
						leqslant: "\u2A7D",
						lescc: "\u2AA8",
						les: "\u2A7D",
						lesdot: "\u2A7F",
						lesdoto: "\u2A81",
						lesdotor: "\u2A83",
						lesg: "\u22DA\uFE00",
						lesges: "\u2A93",
						lessapprox: "\u2A85",
						lessdot: "\u22D6",
						lesseqgtr: "\u22DA",
						lesseqqgtr: "\u2A8B",
						LessEqualGreater: "\u22DA",
						LessFullEqual: "\u2266",
						LessGreater: "\u2276",
						lessgtr: "\u2276",
						LessLess: "\u2AA1",
						lesssim: "\u2272",
						LessSlantEqual: "\u2A7D",
						LessTilde: "\u2272",
						lfisht: "\u297C",
						lfloor: "\u230A",
						Lfr: "\uD835\uDD0F",
						lfr: "\uD835\uDD29",
						lg: "\u2276",
						lgE: "\u2A91",
						lHar: "\u2962",
						lhard: "\u21BD",
						lharu: "\u21BC",
						lharul: "\u296A",
						lhblk: "\u2584",
						LJcy: "\u0409",
						ljcy: "\u0459",
						llarr: "\u21C7",
						ll: "\u226A",
						Ll: "\u22D8",
						llcorner: "\u231E",
						Lleftarrow: "\u21DA",
						llhard: "\u296B",
						lltri: "\u25FA",
						Lmidot: "\u013F",
						lmidot: "\u0140",
						lmoustache: "\u23B0",
						lmoust: "\u23B0",
						lnap: "\u2A89",
						lnapprox: "\u2A89",
						lne: "\u2A87",
						lnE: "\u2268",
						lneq: "\u2A87",
						lneqq: "\u2268",
						lnsim: "\u22E6",
						loang: "\u27EC",
						loarr: "\u21FD",
						lobrk: "\u27E6",
						longleftarrow: "\u27F5",
						LongLeftArrow: "\u27F5",
						Longleftarrow: "\u27F8",
						longleftrightarrow: "\u27F7",
						LongLeftRightArrow: "\u27F7",
						Longleftrightarrow: "\u27FA",
						longmapsto: "\u27FC",
						longrightarrow: "\u27F6",
						LongRightArrow: "\u27F6",
						Longrightarrow: "\u27F9",
						looparrowleft: "\u21AB",
						looparrowright: "\u21AC",
						lopar: "\u2985",
						Lopf: "\uD835\uDD43",
						lopf: "\uD835\uDD5D",
						loplus: "\u2A2D",
						lotimes: "\u2A34",
						lowast: "\u2217",
						lowbar: "_",
						LowerLeftArrow: "\u2199",
						LowerRightArrow: "\u2198",
						loz: "\u25CA",
						lozenge: "\u25CA",
						lozf: "\u29EB",
						lpar: "(",
						lparlt: "\u2993",
						lrarr: "\u21C6",
						lrcorner: "\u231F",
						lrhar: "\u21CB",
						lrhard: "\u296D",
						lrm: "\u200E",
						lrtri: "\u22BF",
						lsaquo: "\u2039",
						lscr: "\uD835\uDCC1",
						Lscr: "\u2112",
						lsh: "\u21B0",
						Lsh: "\u21B0",
						lsim: "\u2272",
						lsime: "\u2A8D",
						lsimg: "\u2A8F",
						lsqb: "[",
						lsquo: "\u2018",
						lsquor: "\u201A",
						Lstrok: "\u0141",
						lstrok: "\u0142",
						ltcc: "\u2AA6",
						ltcir: "\u2A79",
						lt: "<",
						LT: "<",
						Lt: "\u226A",
						ltdot: "\u22D6",
						lthree: "\u22CB",
						ltimes: "\u22C9",
						ltlarr: "\u2976",
						ltquest: "\u2A7B",
						ltri: "\u25C3",
						ltrie: "\u22B4",
						ltrif: "\u25C2",
						ltrPar: "\u2996",
						lurdshar: "\u294A",
						luruhar: "\u2966",
						lvertneqq: "\u2268\uFE00",
						lvnE: "\u2268\uFE00",
						macr: "\u00AF",
						male: "\u2642",
						malt: "\u2720",
						maltese: "\u2720",
						Map: "\u2905",
						map: "\u21A6",
						mapsto: "\u21A6",
						mapstodown: "\u21A7",
						mapstoleft: "\u21A4",
						mapstoup: "\u21A5",
						marker: "\u25AE",
						mcomma: "\u2A29",
						Mcy: "\u041C",
						mcy: "\u043C",
						mdash: "\u2014",
						mDDot: "\u223A",
						measuredangle: "\u2221",
						MediumSpace: "\u205F",
						Mellintrf: "\u2133",
						Mfr: "\uD835\uDD10",
						mfr: "\uD835\uDD2A",
						mho: "\u2127",
						micro: "\u00B5",
						midast: "*",
						midcir: "\u2AF0",
						mid: "\u2223",
						middot: "\u00B7",
						minusb: "\u229F",
						minus: "\u2212",
						minusd: "\u2238",
						minusdu: "\u2A2A",
						MinusPlus: "\u2213",
						mlcp: "\u2ADB",
						mldr: "\u2026",
						mnplus: "\u2213",
						models: "\u22A7",
						Mopf: "\uD835\uDD44",
						mopf: "\uD835\uDD5E",
						mp: "\u2213",
						mscr: "\uD835\uDCC2",
						Mscr: "\u2133",
						mstpos: "\u223E",
						Mu: "\u039C",
						mu: "\u03BC",
						multimap: "\u22B8",
						mumap: "\u22B8",
						nabla: "\u2207",
						Nacute: "\u0143",
						nacute: "\u0144",
						nang: "\u2220\u20D2",
						nap: "\u2249",
						napE: "\u2A70\u0338",
						napid: "\u224B\u0338",
						napos: "\u0149",
						napprox: "\u2249",
						natural: "\u266E",
						naturals: "\u2115",
						natur: "\u266E",
						nbsp: "\u00A0",
						nbump: "\u224E\u0338",
						nbumpe: "\u224F\u0338",
						ncap: "\u2A43",
						Ncaron: "\u0147",
						ncaron: "\u0148",
						Ncedil: "\u0145",
						ncedil: "\u0146",
						ncong: "\u2247",
						ncongdot: "\u2A6D\u0338",
						ncup: "\u2A42",
						Ncy: "\u041D",
						ncy: "\u043D",
						ndash: "\u2013",
						nearhk: "\u2924",
						nearr: "\u2197",
						neArr: "\u21D7",
						nearrow: "\u2197",
						ne: "\u2260",
						nedot: "\u2250\u0338",
						NegativeMediumSpace: "\u200B",
						NegativeThickSpace: "\u200B",
						NegativeThinSpace: "\u200B",
						NegativeVeryThinSpace: "\u200B",
						nequiv: "\u2262",
						nesear: "\u2928",
						nesim: "\u2242\u0338",
						NestedGreaterGreater: "\u226B",
						NestedLessLess: "\u226A",
						NewLine: "\n",
						nexist: "\u2204",
						nexists: "\u2204",
						Nfr: "\uD835\uDD11",
						nfr: "\uD835\uDD2B",
						ngE: "\u2267\u0338",
						nge: "\u2271",
						ngeq: "\u2271",
						ngeqq: "\u2267\u0338",
						ngeqslant: "\u2A7E\u0338",
						nges: "\u2A7E\u0338",
						nGg: "\u22D9\u0338",
						ngsim: "\u2275",
						nGt: "\u226B\u20D2",
						ngt: "\u226F",
						ngtr: "\u226F",
						nGtv: "\u226B\u0338",
						nharr: "\u21AE",
						nhArr: "\u21CE",
						nhpar: "\u2AF2",
						ni: "\u220B",
						nis: "\u22FC",
						nisd: "\u22FA",
						niv: "\u220B",
						NJcy: "\u040A",
						njcy: "\u045A",
						nlarr: "\u219A",
						nlArr: "\u21CD",
						nldr: "\u2025",
						nlE: "\u2266\u0338",
						nle: "\u2270",
						nleftarrow: "\u219A",
						nLeftarrow: "\u21CD",
						nleftrightarrow: "\u21AE",
						nLeftrightarrow: "\u21CE",
						nleq: "\u2270",
						nleqq: "\u2266\u0338",
						nleqslant: "\u2A7D\u0338",
						nles: "\u2A7D\u0338",
						nless: "\u226E",
						nLl: "\u22D8\u0338",
						nlsim: "\u2274",
						nLt: "\u226A\u20D2",
						nlt: "\u226E",
						nltri: "\u22EA",
						nltrie: "\u22EC",
						nLtv: "\u226A\u0338",
						nmid: "\u2224",
						NoBreak: "\u2060",
						NonBreakingSpace: "\u00A0",
						nopf: "\uD835\uDD5F",
						Nopf: "\u2115",
						Not: "\u2AEC",
						not: "\u00AC",
						NotCongruent: "\u2262",
						NotCupCap: "\u226D",
						NotDoubleVerticalBar: "\u2226",
						NotElement: "\u2209",
						NotEqual: "\u2260",
						NotEqualTilde: "\u2242\u0338",
						NotExists: "\u2204",
						NotGreater: "\u226F",
						NotGreaterEqual: "\u2271",
						NotGreaterFullEqual: "\u2267\u0338",
						NotGreaterGreater: "\u226B\u0338",
						NotGreaterLess: "\u2279",
						NotGreaterSlantEqual: "\u2A7E\u0338",
						NotGreaterTilde: "\u2275",
						NotHumpDownHump: "\u224E\u0338",
						NotHumpEqual: "\u224F\u0338",
						notin: "\u2209",
						notindot: "\u22F5\u0338",
						notinE: "\u22F9\u0338",
						notinva: "\u2209",
						notinvb: "\u22F7",
						notinvc: "\u22F6",
						NotLeftTriangleBar: "\u29CF\u0338",
						NotLeftTriangle: "\u22EA",
						NotLeftTriangleEqual: "\u22EC",
						NotLess: "\u226E",
						NotLessEqual: "\u2270",
						NotLessGreater: "\u2278",
						NotLessLess: "\u226A\u0338",
						NotLessSlantEqual: "\u2A7D\u0338",
						NotLessTilde: "\u2274",
						NotNestedGreaterGreater: "\u2AA2\u0338",
						NotNestedLessLess: "\u2AA1\u0338",
						notni: "\u220C",
						notniva: "\u220C",
						notnivb: "\u22FE",
						notnivc: "\u22FD",
						NotPrecedes: "\u2280",
						NotPrecedesEqual: "\u2AAF\u0338",
						NotPrecedesSlantEqual: "\u22E0",
						NotReverseElement: "\u220C",
						NotRightTriangleBar: "\u29D0\u0338",
						NotRightTriangle: "\u22EB",
						NotRightTriangleEqual: "\u22ED",
						NotSquareSubset: "\u228F\u0338",
						NotSquareSubsetEqual: "\u22E2",
						NotSquareSuperset: "\u2290\u0338",
						NotSquareSupersetEqual: "\u22E3",
						NotSubset: "\u2282\u20D2",
						NotSubsetEqual: "\u2288",
						NotSucceeds: "\u2281",
						NotSucceedsEqual: "\u2AB0\u0338",
						NotSucceedsSlantEqual: "\u22E1",
						NotSucceedsTilde: "\u227F\u0338",
						NotSuperset: "\u2283\u20D2",
						NotSupersetEqual: "\u2289",
						NotTilde: "\u2241",
						NotTildeEqual: "\u2244",
						NotTildeFullEqual: "\u2247",
						NotTildeTilde: "\u2249",
						NotVerticalBar: "\u2224",
						nparallel: "\u2226",
						npar: "\u2226",
						nparsl: "\u2AFD\u20E5",
						npart: "\u2202\u0338",
						npolint: "\u2A14",
						npr: "\u2280",
						nprcue: "\u22E0",
						nprec: "\u2280",
						npreceq: "\u2AAF\u0338",
						npre: "\u2AAF\u0338",
						nrarrc: "\u2933\u0338",
						nrarr: "\u219B",
						nrArr: "\u21CF",
						nrarrw: "\u219D\u0338",
						nrightarrow: "\u219B",
						nRightarrow: "\u21CF",
						nrtri: "\u22EB",
						nrtrie: "\u22ED",
						nsc: "\u2281",
						nsccue: "\u22E1",
						nsce: "\u2AB0\u0338",
						Nscr: "\uD835\uDCA9",
						nscr: "\uD835\uDCC3",
						nshortmid: "\u2224",
						nshortparallel: "\u2226",
						nsim: "\u2241",
						nsime: "\u2244",
						nsimeq: "\u2244",
						nsmid: "\u2224",
						nspar: "\u2226",
						nsqsube: "\u22E2",
						nsqsupe: "\u22E3",
						nsub: "\u2284",
						nsubE: "\u2AC5\u0338",
						nsube: "\u2288",
						nsubset: "\u2282\u20D2",
						nsubseteq: "\u2288",
						nsubseteqq: "\u2AC5\u0338",
						nsucc: "\u2281",
						nsucceq: "\u2AB0\u0338",
						nsup: "\u2285",
						nsupE: "\u2AC6\u0338",
						nsupe: "\u2289",
						nsupset: "\u2283\u20D2",
						nsupseteq: "\u2289",
						nsupseteqq: "\u2AC6\u0338",
						ntgl: "\u2279",
						Ntilde: "\u00D1",
						ntilde: "\u00F1",
						ntlg: "\u2278",
						ntriangleleft: "\u22EA",
						ntrianglelefteq: "\u22EC",
						ntriangleright: "\u22EB",
						ntrianglerighteq: "\u22ED",
						Nu: "\u039D",
						nu: "\u03BD",
						num: "#",
						numero: "\u2116",
						numsp: "\u2007",
						nvap: "\u224D\u20D2",
						nvdash: "\u22AC",
						nvDash: "\u22AD",
						nVdash: "\u22AE",
						nVDash: "\u22AF",
						nvge: "\u2265\u20D2",
						nvgt: ">\u20D2",
						nvHarr: "\u2904",
						nvinfin: "\u29DE",
						nvlArr: "\u2902",
						nvle: "\u2264\u20D2",
						nvlt: "<\u20D2",
						nvltrie: "\u22B4\u20D2",
						nvrArr: "\u2903",
						nvrtrie: "\u22B5\u20D2",
						nvsim: "\u223C\u20D2",
						nwarhk: "\u2923",
						nwarr: "\u2196",
						nwArr: "\u21D6",
						nwarrow: "\u2196",
						nwnear: "\u2927",
						Oacute: "\u00D3",
						oacute: "\u00F3",
						oast: "\u229B",
						Ocirc: "\u00D4",
						ocirc: "\u00F4",
						ocir: "\u229A",
						Ocy: "\u041E",
						ocy: "\u043E",
						odash: "\u229D",
						Odblac: "\u0150",
						odblac: "\u0151",
						odiv: "\u2A38",
						odot: "\u2299",
						odsold: "\u29BC",
						OElig: "\u0152",
						oelig: "\u0153",
						ofcir: "\u29BF",
						Ofr: "\uD835\uDD12",
						ofr: "\uD835\uDD2C",
						ogon: "\u02DB",
						Ograve: "\u00D2",
						ograve: "\u00F2",
						ogt: "\u29C1",
						ohbar: "\u29B5",
						ohm: "\u03A9",
						oint: "\u222E",
						olarr: "\u21BA",
						olcir: "\u29BE",
						olcross: "\u29BB",
						oline: "\u203E",
						olt: "\u29C0",
						Omacr: "\u014C",
						omacr: "\u014D",
						Omega: "\u03A9",
						omega: "\u03C9",
						Omicron: "\u039F",
						omicron: "\u03BF",
						omid: "\u29B6",
						ominus: "\u2296",
						Oopf: "\uD835\uDD46",
						oopf: "\uD835\uDD60",
						opar: "\u29B7",
						OpenCurlyDoubleQuote: "\u201C",
						OpenCurlyQuote: "\u2018",
						operp: "\u29B9",
						oplus: "\u2295",
						orarr: "\u21BB",
						Or: "\u2A54",
						or: "\u2228",
						ord: "\u2A5D",
						order: "\u2134",
						orderof: "\u2134",
						ordf: "\u00AA",
						ordm: "\u00BA",
						origof: "\u22B6",
						oror: "\u2A56",
						orslope: "\u2A57",
						orv: "\u2A5B",
						oS: "\u24C8",
						Oscr: "\uD835\uDCAA",
						oscr: "\u2134",
						Oslash: "\u00D8",
						oslash: "\u00F8",
						osol: "\u2298",
						Otilde: "\u00D5",
						otilde: "\u00F5",
						otimesas: "\u2A36",
						Otimes: "\u2A37",
						otimes: "\u2297",
						Ouml: "\u00D6",
						ouml: "\u00F6",
						ovbar: "\u233D",
						OverBar: "\u203E",
						OverBrace: "\u23DE",
						OverBracket: "\u23B4",
						OverParenthesis: "\u23DC",
						para: "\u00B6",
						parallel: "\u2225",
						par: "\u2225",
						parsim: "\u2AF3",
						parsl: "\u2AFD",
						part: "\u2202",
						PartialD: "\u2202",
						Pcy: "\u041F",
						pcy: "\u043F",
						percnt: "%",
						period: ".",
						permil: "\u2030",
						perp: "\u22A5",
						pertenk: "\u2031",
						Pfr: "\uD835\uDD13",
						pfr: "\uD835\uDD2D",
						Phi: "\u03A6",
						phi: "\u03C6",
						phiv: "\u03D5",
						phmmat: "\u2133",
						phone: "\u260E",
						Pi: "\u03A0",
						pi: "\u03C0",
						pitchfork: "\u22D4",
						piv: "\u03D6",
						planck: "\u210F",
						planckh: "\u210E",
						plankv: "\u210F",
						plusacir: "\u2A23",
						plusb: "\u229E",
						pluscir: "\u2A22",
						plus: "+",
						plusdo: "\u2214",
						plusdu: "\u2A25",
						pluse: "\u2A72",
						PlusMinus: "\u00B1",
						plusmn: "\u00B1",
						plussim: "\u2A26",
						plustwo: "\u2A27",
						pm: "\u00B1",
						Poincareplane: "\u210C",
						pointint: "\u2A15",
						popf: "\uD835\uDD61",
						Popf: "\u2119",
						pound: "\u00A3",
						prap: "\u2AB7",
						Pr: "\u2ABB",
						pr: "\u227A",
						prcue: "\u227C",
						precapprox: "\u2AB7",
						prec: "\u227A",
						preccurlyeq: "\u227C",
						Precedes: "\u227A",
						PrecedesEqual: "\u2AAF",
						PrecedesSlantEqual: "\u227C",
						PrecedesTilde: "\u227E",
						preceq: "\u2AAF",
						precnapprox: "\u2AB9",
						precneqq: "\u2AB5",
						precnsim: "\u22E8",
						pre: "\u2AAF",
						prE: "\u2AB3",
						precsim: "\u227E",
						prime: "\u2032",
						Prime: "\u2033",
						primes: "\u2119",
						prnap: "\u2AB9",
						prnE: "\u2AB5",
						prnsim: "\u22E8",
						prod: "\u220F",
						Product: "\u220F",
						profalar: "\u232E",
						profline: "\u2312",
						profsurf: "\u2313",
						prop: "\u221D",
						Proportional: "\u221D",
						Proportion: "\u2237",
						propto: "\u221D",
						prsim: "\u227E",
						prurel: "\u22B0",
						Pscr: "\uD835\uDCAB",
						pscr: "\uD835\uDCC5",
						Psi: "\u03A8",
						psi: "\u03C8",
						puncsp: "\u2008",
						Qfr: "\uD835\uDD14",
						qfr: "\uD835\uDD2E",
						qint: "\u2A0C",
						qopf: "\uD835\uDD62",
						Qopf: "\u211A",
						qprime: "\u2057",
						Qscr: "\uD835\uDCAC",
						qscr: "\uD835\uDCC6",
						quaternions: "\u210D",
						quatint: "\u2A16",
						quest: "?",
						questeq: "\u225F",
						quot: '"',
						QUOT: '"',
						rAarr: "\u21DB",
						race: "\u223D\u0331",
						Racute: "\u0154",
						racute: "\u0155",
						radic: "\u221A",
						raemptyv: "\u29B3",
						rang: "\u27E9",
						Rang: "\u27EB",
						rangd: "\u2992",
						range: "\u29A5",
						rangle: "\u27E9",
						raquo: "\u00BB",
						rarrap: "\u2975",
						rarrb: "\u21E5",
						rarrbfs: "\u2920",
						rarrc: "\u2933",
						rarr: "\u2192",
						Rarr: "\u21A0",
						rArr: "\u21D2",
						rarrfs: "\u291E",
						rarrhk: "\u21AA",
						rarrlp: "\u21AC",
						rarrpl: "\u2945",
						rarrsim: "\u2974",
						Rarrtl: "\u2916",
						rarrtl: "\u21A3",
						rarrw: "\u219D",
						ratail: "\u291A",
						rAtail: "\u291C",
						ratio: "\u2236",
						rationals: "\u211A",
						rbarr: "\u290D",
						rBarr: "\u290F",
						RBarr: "\u2910",
						rbbrk: "\u2773",
						rbrace: "}",
						rbrack: "]",
						rbrke: "\u298C",
						rbrksld: "\u298E",
						rbrkslu: "\u2990",
						Rcaron: "\u0158",
						rcaron: "\u0159",
						Rcedil: "\u0156",
						rcedil: "\u0157",
						rceil: "\u2309",
						rcub: "}",
						Rcy: "\u0420",
						rcy: "\u0440",
						rdca: "\u2937",
						rdldhar: "\u2969",
						rdquo: "\u201D",
						rdquor: "\u201D",
						rdsh: "\u21B3",
						real: "\u211C",
						realine: "\u211B",
						realpart: "\u211C",
						reals: "\u211D",
						Re: "\u211C",
						rect: "\u25AD",
						reg: "\u00AE",
						REG: "\u00AE",
						ReverseElement: "\u220B",
						ReverseEquilibrium: "\u21CB",
						ReverseUpEquilibrium: "\u296F",
						rfisht: "\u297D",
						rfloor: "\u230B",
						rfr: "\uD835\uDD2F",
						Rfr: "\u211C",
						rHar: "\u2964",
						rhard: "\u21C1",
						rharu: "\u21C0",
						rharul: "\u296C",
						Rho: "\u03A1",
						rho: "\u03C1",
						rhov: "\u03F1",
						RightAngleBracket: "\u27E9",
						RightArrowBar: "\u21E5",
						rightarrow: "\u2192",
						RightArrow: "\u2192",
						Rightarrow: "\u21D2",
						RightArrowLeftArrow: "\u21C4",
						rightarrowtail: "\u21A3",
						RightCeiling: "\u2309",
						RightDoubleBracket: "\u27E7",
						RightDownTeeVector: "\u295D",
						RightDownVectorBar: "\u2955",
						RightDownVector: "\u21C2",
						RightFloor: "\u230B",
						rightharpoondown: "\u21C1",
						rightharpoonup: "\u21C0",
						rightleftarrows: "\u21C4",
						rightleftharpoons: "\u21CC",
						rightrightarrows: "\u21C9",
						rightsquigarrow: "\u219D",
						RightTeeArrow: "\u21A6",
						RightTee: "\u22A2",
						RightTeeVector: "\u295B",
						rightthreetimes: "\u22CC",
						RightTriangleBar: "\u29D0",
						RightTriangle: "\u22B3",
						RightTriangleEqual: "\u22B5",
						RightUpDownVector: "\u294F",
						RightUpTeeVector: "\u295C",
						RightUpVectorBar: "\u2954",
						RightUpVector: "\u21BE",
						RightVectorBar: "\u2953",
						RightVector: "\u21C0",
						ring: "\u02DA",
						risingdotseq: "\u2253",
						rlarr: "\u21C4",
						rlhar: "\u21CC",
						rlm: "\u200F",
						rmoustache: "\u23B1",
						rmoust: "\u23B1",
						rnmid: "\u2AEE",
						roang: "\u27ED",
						roarr: "\u21FE",
						robrk: "\u27E7",
						ropar: "\u2986",
						ropf: "\uD835\uDD63",
						Ropf: "\u211D",
						roplus: "\u2A2E",
						rotimes: "\u2A35",
						RoundImplies: "\u2970",
						rpar: ")",
						rpargt: "\u2994",
						rppolint: "\u2A12",
						rrarr: "\u21C9",
						Rrightarrow: "\u21DB",
						rsaquo: "\u203A",
						rscr: "\uD835\uDCC7",
						Rscr: "\u211B",
						rsh: "\u21B1",
						Rsh: "\u21B1",
						rsqb: "]",
						rsquo: "\u2019",
						rsquor: "\u2019",
						rthree: "\u22CC",
						rtimes: "\u22CA",
						rtri: "\u25B9",
						rtrie: "\u22B5",
						rtrif: "\u25B8",
						rtriltri: "\u29CE",
						RuleDelayed: "\u29F4",
						ruluhar: "\u2968",
						rx: "\u211E",
						Sacute: "\u015A",
						sacute: "\u015B",
						sbquo: "\u201A",
						scap: "\u2AB8",
						Scaron: "\u0160",
						scaron: "\u0161",
						Sc: "\u2ABC",
						sc: "\u227B",
						sccue: "\u227D",
						sce: "\u2AB0",
						scE: "\u2AB4",
						Scedil: "\u015E",
						scedil: "\u015F",
						Scirc: "\u015C",
						scirc: "\u015D",
						scnap: "\u2ABA",
						scnE: "\u2AB6",
						scnsim: "\u22E9",
						scpolint: "\u2A13",
						scsim: "\u227F",
						Scy: "\u0421",
						scy: "\u0441",
						sdotb: "\u22A1",
						sdot: "\u22C5",
						sdote: "\u2A66",
						searhk: "\u2925",
						searr: "\u2198",
						seArr: "\u21D8",
						searrow: "\u2198",
						sect: "\u00A7",
						semi: ";",
						seswar: "\u2929",
						setminus: "\u2216",
						setmn: "\u2216",
						sext: "\u2736",
						Sfr: "\uD835\uDD16",
						sfr: "\uD835\uDD30",
						sfrown: "\u2322",
						sharp: "\u266F",
						SHCHcy: "\u0429",
						shchcy: "\u0449",
						SHcy: "\u0428",
						shcy: "\u0448",
						ShortDownArrow: "\u2193",
						ShortLeftArrow: "\u2190",
						shortmid: "\u2223",
						shortparallel: "\u2225",
						ShortRightArrow: "\u2192",
						ShortUpArrow: "\u2191",
						shy: "\u00AD",
						Sigma: "\u03A3",
						sigma: "\u03C3",
						sigmaf: "\u03C2",
						sigmav: "\u03C2",
						sim: "\u223C",
						simdot: "\u2A6A",
						sime: "\u2243",
						simeq: "\u2243",
						simg: "\u2A9E",
						simgE: "\u2AA0",
						siml: "\u2A9D",
						simlE: "\u2A9F",
						simne: "\u2246",
						simplus: "\u2A24",
						simrarr: "\u2972",
						slarr: "\u2190",
						SmallCircle: "\u2218",
						smallsetminus: "\u2216",
						smashp: "\u2A33",
						smeparsl: "\u29E4",
						smid: "\u2223",
						smile: "\u2323",
						smt: "\u2AAA",
						smte: "\u2AAC",
						smtes: "\u2AAC\uFE00",
						SOFTcy: "\u042C",
						softcy: "\u044C",
						solbar: "\u233F",
						solb: "\u29C4",
						sol: "/",
						Sopf: "\uD835\uDD4A",
						sopf: "\uD835\uDD64",
						spades: "\u2660",
						spadesuit: "\u2660",
						spar: "\u2225",
						sqcap: "\u2293",
						sqcaps: "\u2293\uFE00",
						sqcup: "\u2294",
						sqcups: "\u2294\uFE00",
						Sqrt: "\u221A",
						sqsub: "\u228F",
						sqsube: "\u2291",
						sqsubset: "\u228F",
						sqsubseteq: "\u2291",
						sqsup: "\u2290",
						sqsupe: "\u2292",
						sqsupset: "\u2290",
						sqsupseteq: "\u2292",
						square: "\u25A1",
						Square: "\u25A1",
						SquareIntersection: "\u2293",
						SquareSubset: "\u228F",
						SquareSubsetEqual: "\u2291",
						SquareSuperset: "\u2290",
						SquareSupersetEqual: "\u2292",
						SquareUnion: "\u2294",
						squarf: "\u25AA",
						squ: "\u25A1",
						squf: "\u25AA",
						srarr: "\u2192",
						Sscr: "\uD835\uDCAE",
						sscr: "\uD835\uDCC8",
						ssetmn: "\u2216",
						ssmile: "\u2323",
						sstarf: "\u22C6",
						Star: "\u22C6",
						star: "\u2606",
						starf: "\u2605",
						straightepsilon: "\u03F5",
						straightphi: "\u03D5",
						strns: "\u00AF",
						sub: "\u2282",
						Sub: "\u22D0",
						subdot: "\u2ABD",
						subE: "\u2AC5",
						sube: "\u2286",
						subedot: "\u2AC3",
						submult: "\u2AC1",
						subnE: "\u2ACB",
						subne: "\u228A",
						subplus: "\u2ABF",
						subrarr: "\u2979",
						subset: "\u2282",
						Subset: "\u22D0",
						subseteq: "\u2286",
						subseteqq: "\u2AC5",
						SubsetEqual: "\u2286",
						subsetneq: "\u228A",
						subsetneqq: "\u2ACB",
						subsim: "\u2AC7",
						subsub: "\u2AD5",
						subsup: "\u2AD3",
						succapprox: "\u2AB8",
						succ: "\u227B",
						succcurlyeq: "\u227D",
						Succeeds: "\u227B",
						SucceedsEqual: "\u2AB0",
						SucceedsSlantEqual: "\u227D",
						SucceedsTilde: "\u227F",
						succeq: "\u2AB0",
						succnapprox: "\u2ABA",
						succneqq: "\u2AB6",
						succnsim: "\u22E9",
						succsim: "\u227F",
						SuchThat: "\u220B",
						sum: "\u2211",
						Sum: "\u2211",
						sung: "\u266A",
						sup1: "\u00B9",
						sup2: "\u00B2",
						sup3: "\u00B3",
						sup: "\u2283",
						Sup: "\u22D1",
						supdot: "\u2ABE",
						supdsub: "\u2AD8",
						supE: "\u2AC6",
						supe: "\u2287",
						supedot: "\u2AC4",
						Superset: "\u2283",
						SupersetEqual: "\u2287",
						suphsol: "\u27C9",
						suphsub: "\u2AD7",
						suplarr: "\u297B",
						supmult: "\u2AC2",
						supnE: "\u2ACC",
						supne: "\u228B",
						supplus: "\u2AC0",
						supset: "\u2283",
						Supset: "\u22D1",
						supseteq: "\u2287",
						supseteqq: "\u2AC6",
						supsetneq: "\u228B",
						supsetneqq: "\u2ACC",
						supsim: "\u2AC8",
						supsub: "\u2AD4",
						supsup: "\u2AD6",
						swarhk: "\u2926",
						swarr: "\u2199",
						swArr: "\u21D9",
						swarrow: "\u2199",
						swnwar: "\u292A",
						szlig: "\u00DF",
						Tab: "\t",
						target: "\u2316",
						Tau: "\u03A4",
						tau: "\u03C4",
						tbrk: "\u23B4",
						Tcaron: "\u0164",
						tcaron: "\u0165",
						Tcedil: "\u0162",
						tcedil: "\u0163",
						Tcy: "\u0422",
						tcy: "\u0442",
						tdot: "\u20DB",
						telrec: "\u2315",
						Tfr: "\uD835\uDD17",
						tfr: "\uD835\uDD31",
						there4: "\u2234",
						therefore: "\u2234",
						Therefore: "\u2234",
						Theta: "\u0398",
						theta: "\u03B8",
						thetasym: "\u03D1",
						thetav: "\u03D1",
						thickapprox: "\u2248",
						thicksim: "\u223C",
						ThickSpace: "\u205F\u200A",
						ThinSpace: "\u2009",
						thinsp: "\u2009",
						thkap: "\u2248",
						thksim: "\u223C",
						THORN: "\u00DE",
						thorn: "\u00FE",
						tilde: "\u02DC",
						Tilde: "\u223C",
						TildeEqual: "\u2243",
						TildeFullEqual: "\u2245",
						TildeTilde: "\u2248",
						timesbar: "\u2A31",
						timesb: "\u22A0",
						times: "\u00D7",
						timesd: "\u2A30",
						tint: "\u222D",
						toea: "\u2928",
						topbot: "\u2336",
						topcir: "\u2AF1",
						top: "\u22A4",
						Topf: "\uD835\uDD4B",
						topf: "\uD835\uDD65",
						topfork: "\u2ADA",
						tosa: "\u2929",
						tprime: "\u2034",
						trade: "\u2122",
						TRADE: "\u2122",
						triangle: "\u25B5",
						triangledown: "\u25BF",
						triangleleft: "\u25C3",
						trianglelefteq: "\u22B4",
						triangleq: "\u225C",
						triangleright: "\u25B9",
						trianglerighteq: "\u22B5",
						tridot: "\u25EC",
						trie: "\u225C",
						triminus: "\u2A3A",
						TripleDot: "\u20DB",
						triplus: "\u2A39",
						trisb: "\u29CD",
						tritime: "\u2A3B",
						trpezium: "\u23E2",
						Tscr: "\uD835\uDCAF",
						tscr: "\uD835\uDCC9",
						TScy: "\u0426",
						tscy: "\u0446",
						TSHcy: "\u040B",
						tshcy: "\u045B",
						Tstrok: "\u0166",
						tstrok: "\u0167",
						twixt: "\u226C",
						twoheadleftarrow: "\u219E",
						twoheadrightarrow: "\u21A0",
						Uacute: "\u00DA",
						uacute: "\u00FA",
						uarr: "\u2191",
						Uarr: "\u219F",
						uArr: "\u21D1",
						Uarrocir: "\u2949",
						Ubrcy: "\u040E",
						ubrcy: "\u045E",
						Ubreve: "\u016C",
						ubreve: "\u016D",
						Ucirc: "\u00DB",
						ucirc: "\u00FB",
						Ucy: "\u0423",
						ucy: "\u0443",
						udarr: "\u21C5",
						Udblac: "\u0170",
						udblac: "\u0171",
						udhar: "\u296E",
						ufisht: "\u297E",
						Ufr: "\uD835\uDD18",
						ufr: "\uD835\uDD32",
						Ugrave: "\u00D9",
						ugrave: "\u00F9",
						uHar: "\u2963",
						uharl: "\u21BF",
						uharr: "\u21BE",
						uhblk: "\u2580",
						ulcorn: "\u231C",
						ulcorner: "\u231C",
						ulcrop: "\u230F",
						ultri: "\u25F8",
						Umacr: "\u016A",
						umacr: "\u016B",
						uml: "\u00A8",
						UnderBar: "_",
						UnderBrace: "\u23DF",
						UnderBracket: "\u23B5",
						UnderParenthesis: "\u23DD",
						Union: "\u22C3",
						UnionPlus: "\u228E",
						Uogon: "\u0172",
						uogon: "\u0173",
						Uopf: "\uD835\uDD4C",
						uopf: "\uD835\uDD66",
						UpArrowBar: "\u2912",
						uparrow: "\u2191",
						UpArrow: "\u2191",
						Uparrow: "\u21D1",
						UpArrowDownArrow: "\u21C5",
						updownarrow: "\u2195",
						UpDownArrow: "\u2195",
						Updownarrow: "\u21D5",
						UpEquilibrium: "\u296E",
						upharpoonleft: "\u21BF",
						upharpoonright: "\u21BE",
						uplus: "\u228E",
						UpperLeftArrow: "\u2196",
						UpperRightArrow: "\u2197",
						upsi: "\u03C5",
						Upsi: "\u03D2",
						upsih: "\u03D2",
						Upsilon: "\u03A5",
						upsilon: "\u03C5",
						UpTeeArrow: "\u21A5",
						UpTee: "\u22A5",
						upuparrows: "\u21C8",
						urcorn: "\u231D",
						urcorner: "\u231D",
						urcrop: "\u230E",
						Uring: "\u016E",
						uring: "\u016F",
						urtri: "\u25F9",
						Uscr: "\uD835\uDCB0",
						uscr: "\uD835\uDCCA",
						utdot: "\u22F0",
						Utilde: "\u0168",
						utilde: "\u0169",
						utri: "\u25B5",
						utrif: "\u25B4",
						uuarr: "\u21C8",
						Uuml: "\u00DC",
						uuml: "\u00FC",
						uwangle: "\u29A7",
						vangrt: "\u299C",
						varepsilon: "\u03F5",
						varkappa: "\u03F0",
						varnothing: "\u2205",
						varphi: "\u03D5",
						varpi: "\u03D6",
						varpropto: "\u221D",
						varr: "\u2195",
						vArr: "\u21D5",
						varrho: "\u03F1",
						varsigma: "\u03C2",
						varsubsetneq: "\u228A\uFE00",
						varsubsetneqq: "\u2ACB\uFE00",
						varsupsetneq: "\u228B\uFE00",
						varsupsetneqq: "\u2ACC\uFE00",
						vartheta: "\u03D1",
						vartriangleleft: "\u22B2",
						vartriangleright: "\u22B3",
						vBar: "\u2AE8",
						Vbar: "\u2AEB",
						vBarv: "\u2AE9",
						Vcy: "\u0412",
						vcy: "\u0432",
						vdash: "\u22A2",
						vDash: "\u22A8",
						Vdash: "\u22A9",
						VDash: "\u22AB",
						Vdashl: "\u2AE6",
						veebar: "\u22BB",
						vee: "\u2228",
						Vee: "\u22C1",
						veeeq: "\u225A",
						vellip: "\u22EE",
						verbar: "|",
						Verbar: "\u2016",
						vert: "|",
						Vert: "\u2016",
						VerticalBar: "\u2223",
						VerticalLine: "|",
						VerticalSeparator: "\u2758",
						VerticalTilde: "\u2240",
						VeryThinSpace: "\u200A",
						Vfr: "\uD835\uDD19",
						vfr: "\uD835\uDD33",
						vltri: "\u22B2",
						vnsub: "\u2282\u20D2",
						vnsup: "\u2283\u20D2",
						Vopf: "\uD835\uDD4D",
						vopf: "\uD835\uDD67",
						vprop: "\u221D",
						vrtri: "\u22B3",
						Vscr: "\uD835\uDCB1",
						vscr: "\uD835\uDCCB",
						vsubnE: "\u2ACB\uFE00",
						vsubne: "\u228A\uFE00",
						vsupnE: "\u2ACC\uFE00",
						vsupne: "\u228B\uFE00",
						Vvdash: "\u22AA",
						vzigzag: "\u299A",
						Wcirc: "\u0174",
						wcirc: "\u0175",
						wedbar: "\u2A5F",
						wedge: "\u2227",
						Wedge: "\u22C0",
						wedgeq: "\u2259",
						weierp: "\u2118",
						Wfr: "\uD835\uDD1A",
						wfr: "\uD835\uDD34",
						Wopf: "\uD835\uDD4E",
						wopf: "\uD835\uDD68",
						wp: "\u2118",
						wr: "\u2240",
						wreath: "\u2240",
						Wscr: "\uD835\uDCB2",
						wscr: "\uD835\uDCCC",
						xcap: "\u22C2",
						xcirc: "\u25EF",
						xcup: "\u22C3",
						xdtri: "\u25BD",
						Xfr: "\uD835\uDD1B",
						xfr: "\uD835\uDD35",
						xharr: "\u27F7",
						xhArr: "\u27FA",
						Xi: "\u039E",
						xi: "\u03BE",
						xlarr: "\u27F5",
						xlArr: "\u27F8",
						xmap: "\u27FC",
						xnis: "\u22FB",
						xodot: "\u2A00",
						Xopf: "\uD835\uDD4F",
						xopf: "\uD835\uDD69",
						xoplus: "\u2A01",
						xotime: "\u2A02",
						xrarr: "\u27F6",
						xrArr: "\u27F9",
						Xscr: "\uD835\uDCB3",
						xscr: "\uD835\uDCCD",
						xsqcup: "\u2A06",
						xuplus: "\u2A04",
						xutri: "\u25B3",
						xvee: "\u22C1",
						xwedge: "\u22C0",
						Yacute: "\u00DD",
						yacute: "\u00FD",
						YAcy: "\u042F",
						yacy: "\u044F",
						Ycirc: "\u0176",
						ycirc: "\u0177",
						Ycy: "\u042B",
						ycy: "\u044B",
						yen: "\u00A5",
						Yfr: "\uD835\uDD1C",
						yfr: "\uD835\uDD36",
						YIcy: "\u0407",
						yicy: "\u0457",
						Yopf: "\uD835\uDD50",
						yopf: "\uD835\uDD6A",
						Yscr: "\uD835\uDCB4",
						yscr: "\uD835\uDCCE",
						YUcy: "\u042E",
						yucy: "\u044E",
						yuml: "\u00FF",
						Yuml: "\u0178",
						Zacute: "\u0179",
						zacute: "\u017A",
						Zcaron: "\u017D",
						zcaron: "\u017E",
						Zcy: "\u0417",
						zcy: "\u0437",
						Zdot: "\u017B",
						zdot: "\u017C",
						zeetrf: "\u2128",
						ZeroWidthSpace: "\u200B",
						Zeta: "\u0396",
						zeta: "\u03B6",
						zfr: "\uD835\uDD37",
						Zfr: "\u2128",
						ZHcy: "\u0416",
						zhcy: "\u0436",
						zigrarr: "\u21DD",
						zopf: "\uD835\uDD6B",
						Zopf: "\u2124",
						Zscr: "\uD835\uDCB5",
						zscr: "\uD835\uDCCF",
						zwj: "\u200D",
						zwnj: "\u200C",
					};
				},
				{},
			],
			28: [
				function(require, module, exports) {
					module.exports = {
						Aacute: "\u00C1",
						aacute: "\u00E1",
						Acirc: "\u00C2",
						acirc: "\u00E2",
						acute: "\u00B4",
						AElig: "\u00C6",
						aelig: "\u00E6",
						Agrave: "\u00C0",
						agrave: "\u00E0",
						amp: "&",
						AMP: "&",
						Aring: "\u00C5",
						aring: "\u00E5",
						Atilde: "\u00C3",
						atilde: "\u00E3",
						Auml: "\u00C4",
						auml: "\u00E4",
						brvbar: "\u00A6",
						Ccedil: "\u00C7",
						ccedil: "\u00E7",
						cedil: "\u00B8",
						cent: "\u00A2",
						copy: "\u00A9",
						COPY: "\u00A9",
						curren: "\u00A4",
						deg: "\u00B0",
						divide: "\u00F7",
						Eacute: "\u00C9",
						eacute: "\u00E9",
						Ecirc: "\u00CA",
						ecirc: "\u00EA",
						Egrave: "\u00C8",
						egrave: "\u00E8",
						ETH: "\u00D0",
						eth: "\u00F0",
						Euml: "\u00CB",
						euml: "\u00EB",
						frac12: "\u00BD",
						frac14: "\u00BC",
						frac34: "\u00BE",
						gt: ">",
						GT: ">",
						Iacute: "\u00CD",
						iacute: "\u00ED",
						Icirc: "\u00CE",
						icirc: "\u00EE",
						iexcl: "\u00A1",
						Igrave: "\u00CC",
						igrave: "\u00EC",
						iquest: "\u00BF",
						Iuml: "\u00CF",
						iuml: "\u00EF",
						laquo: "\u00AB",
						lt: "<",
						LT: "<",
						macr: "\u00AF",
						micro: "\u00B5",
						middot: "\u00B7",
						nbsp: "\u00A0",
						not: "\u00AC",
						Ntilde: "\u00D1",
						ntilde: "\u00F1",
						Oacute: "\u00D3",
						oacute: "\u00F3",
						Ocirc: "\u00D4",
						ocirc: "\u00F4",
						Ograve: "\u00D2",
						ograve: "\u00F2",
						ordf: "\u00AA",
						ordm: "\u00BA",
						Oslash: "\u00D8",
						oslash: "\u00F8",
						Otilde: "\u00D5",
						otilde: "\u00F5",
						Ouml: "\u00D6",
						ouml: "\u00F6",
						para: "\u00B6",
						plusmn: "\u00B1",
						pound: "\u00A3",
						quot: '"',
						QUOT: '"',
						raquo: "\u00BB",
						reg: "\u00AE",
						REG: "\u00AE",
						sect: "\u00A7",
						shy: "\u00AD",
						sup1: "\u00B9",
						sup2: "\u00B2",
						sup3: "\u00B3",
						szlig: "\u00DF",
						THORN: "\u00DE",
						thorn: "\u00FE",
						times: "\u00D7",
						Uacute: "\u00DA",
						uacute: "\u00FA",
						Ucirc: "\u00DB",
						ucirc: "\u00FB",
						Ugrave: "\u00D9",
						ugrave: "\u00F9",
						uml: "\u00A8",
						Uuml: "\u00DC",
						uuml: "\u00FC",
						Yacute: "\u00DD",
						yacute: "\u00FD",
						yen: "\u00A5",
						yuml: "\u00FF",
					};
				},
				{},
			],
			29: [
				function(require, module, exports) {
					module.exports = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
				},
				{},
			],
		},
		{},
		[8],
	)(8);
});
