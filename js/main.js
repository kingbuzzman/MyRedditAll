/*$(document).bind("mobileinit", function(){
	$.mobile.page.prototype.options.addBackBtn = true;
});*/

if (typeof console == "undefined") {
	console = {
		log: function () {},
		error: function () {},
		info: function () {}
	};
}

$( '#customize' ).live( 'pagecreate',function(event){
	//This is way hacky I have to find the right event and tap into that
	setTimeout(function(){
		App.jqm.refresh();
	},2000);
});

var PhotoSwipe = window.Code.PhotoSwipe;

/*
 * Setting wrapper
 * - handles all the that needs to persist
 */
var App = new(function () {
	/*
	 * this is how to remove the references to itself everywhere, also to avoid not needed .bind(this)
	 */
	var self = this;
	var BASE_URL = "http://www.reddit.com";
	var agent = navigator.userAgent;  
	var isWebkit = (agent.indexOf("AppleWebKit") > 0);
	var isIPad = (agent.indexOf("iPad") > 0);
	var isIOS = (agent.indexOf("iPhone") > 0 || agent.indexOf("iPod") > 0);
	var isAndroid = (agent.indexOf("Android")  > 0);
	var isNewBlackBerry = (agent.indexOf("AppleWebKit") > 0 && agent.indexOf("BlackBerry") > 0);
	var isWebOS = (agent.indexOf("webOS") > 0 || agent.indexOf("wOSBrowser") > 0);
	
	var isWindowsMobile = (agent.indexOf("Windows Phone OS") > 0);
	var isSmallScreen = (screen.width < 767 || (isAndroid && screen.width < 1000));
	var isUnknownMobile = (isWebkit && isSmallScreen);
	var isMobile = (isIOS || isAndroid || isNewBlackBerry || isWebOS || isWindowsMobile || isUnknownMobile);

	this.init = function () {
		$.get("templates.html", function (r) {
			$("head").append(r);
			ko.setTemplateEngine(new mustacheTemplateEngine());
			ko.applyBindings(self);
		});
	};

	this.settings = new(function () {
		var STORAGE_KEY_NAME = "settings";
		var DEFAULT_BACKGROUND_COLOR = null;
		var BACKGROUNDS = [
			"images/prestige-COD.gif",
			"images/spacestorm.jpg",
			"http://www.dinpattern.com/tiles/bones-leather.gif",
			"http://i.imgur.com/GNUvG.jpg",
			"http://i.imgur.com/UL45j.jpg",
			"http://i.imgur.com/vsRWY.jpg",
			"http://i.imgur.com/FuUYr.jpg",
			"http://i.imgur.com/SQb2u.jpg", 
			"http://i.imgur.com/ishzk.jpg",
			"http://i.imgur.com/I77im.jpg",
			"http://i.imgur.com/FHV3p.jpg",
			"http://i.imgur.com/6FDRX.jpg",
			"http://i.imgur.com/n8bZ8.jpg",
			"http://i.imgur.com/4zX8q.jpg"
		];
		var DEFAULT_BACKGROUND_IMAGE = BACKGROUNDS[0];
		
		var DEFAULT_SETTINGS = {
			background: {
				color: DEFAULT_BACKGROUND_COLOR,
				image: DEFAULT_BACKGROUND_IMAGE
			}
		}
		var savedSettings = $.jStorage.get(STORAGE_KEY_NAME, DEFAULT_SETTINGS);

		var load = function () {
			this.background.color(savedSettings.background.color);
			this.background.image(savedSettings.background.image);
			this.save();
			
			$(document).ready(function(){
				$('#colorSelector').ColorPicker({
					color: '#0000ff',
					onShow: function (colpkr) {
						$(colpkr).fadeIn(500);
						return false;
					},
					onHide: function (colpkr) {
						$(colpkr).fadeOut(500);
						self.settings.background.color(jQuery('#colorSelector div').css('backgroundColor'));
						self.settings.background.image(null);
						self.settings.save();
						return false;
					},
					onChange: function (hsb, hex, rgb) {
						$('#colorSelector div').css('backgroundColor', '#' + hex);                              
						$('body').css({"background-color":'#' + hex, "background-image":"none" });
					}
				});
				$( "#customizeDialog" ).draggable({ handle: "#customizeHeader" });				
			});
		}.bind(this);

		this.background = new(function () {
			this.color = ko.observable();
			this.image = ko.observable();

			/*
			 * Checks whether or not the color is set or not
			 * - only gets executed when either image or color changes; thus nulls out the other [eliminates the need to have subscribe()rs]
			 */
			this.isColorSet = ko.dependentObservable(function () {
				var colorSet = this.color() !== null;

				if (colorSet) this.image(null);
				else this.color(null);

				return colorSet;
			}, this);
			
			this.changeNext = function(){
				var index = BACKGROUNDS.indexOf(this.image());
				if (index >= BACKGROUNDS.length - 1)
					index = -1;
				this.image(BACKGROUNDS[index+1]);
				this.saveBackgroundImage();
			}
			
			this.changePrev = function(){
				var index = BACKGROUNDS.indexOf(this.image());
				if (index == 0)
					index = BACKGROUNDS.length;
				this.image(BACKGROUNDS[index-1]);
				this.saveBackgroundImage();
			}
			this.saveBackgroundImage = function(){
				this.color(null);
				self.settings.save();
			}
		})();

		/*
		 * Erase the settings
		 */
		this.erase = function () {
			$.jStorage.deleteKey(STORAGE_KEY_NAME);
		};

		/*
		 * Save all the current settings
		 */
		this.save = function () {
			$.jStorage.set(STORAGE_KEY_NAME, this.toString());
		}

		this.toString = function () {
			return {
				background: {
					color: this.background.color(),
					image: this.background.image()
				}
			}
		}
		load();
	})();

	/*
	 * Request manager
	 * - keeps track of all outgoing remote calls
	 * TODO: if $.ajax returns more than X amount of errors stop making calls
	 */
	var loader = new(function () {
		var MAX_CONNECTIONS = 10;
		var activeConnections = [];
		var queued = [];

		/*
		 * Calls the next request
		 */
		var nextCall = function () {
				// if active connections is above the maximun threshold skip
				// if the queue is empty skip
				if (activeConnections.length > MAX_CONNECTIONS || queued.length === 0) {
					return;
				}

				// get the first request from the queue and make the request again
				var request = queued.shift();
				this.call(request.url, request.callback);
			}.bind(this);

		/*
		 * Makes external request
		 *
		 * @url string ie. http://www.reddit.com/r/miami
		 * @callback function calls back with one parameter, the data
		 * returns connection -- don't rely on it too much since the queue can fill up and return no connection, or the connection finished
		 */
		this.call = function (url, callback) {
			if (activeConnections.length > MAX_CONNECTIONS) {
				queued.push({
					"url": url,
					"callback": callback
				});
				return;
			}

			// make request
			var connection = $.ajax({
				type: 'GET',
				url: url,
				dataType: 'jsonp',
				jsonp: 'jsonp',
				timeout: 20000,
				// 2 seconds timeout
				success: function (data) {
					callback(data.data.children);
				},
				error: function () {
					// stick it on the queue
					queued.push({
						"url": url,
						"callback": callback
					});
				},
				complete: function () {
					// remove connection from the active connection list
					activeConnections = activeConnections.filter(function (item) {
						return item !== connection;
					});

					// see if there is anything waiting to be called
					nextCall();
				}
			});

			// add connection to the current connection pool
			activeConnections.push(connection);

			// return the connection
			return connection;
		};
	})();

	/*
	 * Houses all the visited links
	 */
	this.visitedLinks = new(function () {
		var links = {};
		var STORAGE_KEY_NAME = "visitedLinks";
		var DEAFULT_LINKS = "";
		var saved_links = $.jStorage.get(STORAGE_KEY_NAME, DEAFULT_LINKS);
		/*
		 * Loads the current visited links
		 * @links string list of visited links in a long array ie "link1,link2" NOT: ["link1","link2"]
		 */
		var load = function (links) {
				saved_links = saved_links.split(",");
				for (var index in links)
				this.add(links[index]);
			};

		/*
		 * Append a visited link
		 * @id string the id from reddit
		 */
		this.add = function (id) {
			links[id] = id;
		};

		/*
		 * Checks if the link has been visited or not
		 * @id string the id from reddit
		 * returns true if there is a match
		 */
		this.visited = function (id) {
			return (id in links);
		};

		/*
		 * Returns all the visited links separeted by a comma
		 */
		this.toString = function () {
			var keys = [];

			for (var key in links) {
				keys.push(key);
			}

			return keys.join(",");
		};

		load();
	})();

	/*
	 * Houses the image bar -- controls the image view
	 * TODO: self fetch images
	 */
	this.imageBar = new(function () {
		/*
		 * Always store one array at a time of the images for the active button
		 */
		var imagebar = this;
		var DEFAULT_IMAGE_BAR = "Pics,WTF,NSFW,Funny,F7U12,Bacon";
		var STORAGE_KEY_NAME = "imagebar";
		var images = ko.observableArray();
		var overlays = ko.observableArray();
		var IMAGES_PER_REQUEST = 100;
		var saved_imagebar = $.jStorage.get(STORAGE_KEY_NAME, DEFAULT_IMAGE_BAR);
		/*
		 * this keeps track of the active image in the overlay
		 */
		this.activeImage = ko.observable();

		var ImageBox = function (item) {
			var image = this;	
			this.href = item.url;
			this.title = item.title;
			this.thumbnail = item.thumbnail;
			this.created = item.created;
			this.permalink = BASE_URL + item.permalink;
			this.open = function () { 
				var index = images.indexOf(this);
				if( isMobile ){ 
					instance.show(index);
				}
				else {
					$.colorbox.setIndex(index);
					$.colorbox({
						href: this.href,
						title: this.title
					});	
				}
				imagebar.activeImage(this);
			}
			this.viewComment = function () {
				window.open(this.permalink, '_blank');
			}
			this.viewOriginal = function () {
				window.open(this.href, '_blank');
			}
			this.setClipboardText = function () {
				clip.setText(this.title + ": " + this.href);
			}
			this.shareOnFacebook = function () {
				FB.ui({
					method: 'stream.publish',
					display: 'popup',
					message: 'gettingeducatedaboutFacebookConnect',
					attachment: {
						name: 'MyRedditAll.com',
						caption: this.title,
						description: "",
						'media': [{
							'type': 'image',
							'src': this.href,
							'href': this.href
						}],
						href: this.href
					},
					action_links: [{
						text: 'Code',
						href: this.href
					}]
				});
			}
			
			if (isMobile){
				var Util = window.Code.Util;
				//PhotoSwipe Class
				image.__photoSwipeClickHandler = PhotoSwipe.onTriggerElementClick.bind(instance);
				Util.Events.remove(image, 'click', image.__photoSwipeClickHandler);
				Util.Events.add(image, 'click', image.__photoSwipeClickHandler);
				instance.originalImages.push(image);
				//Cache Class
				src = instance.settings.getImageSource(image);
				caption = instance.settings.getImageCaption(image);
				metaData = instance.settings.getImageMetaData(image);
				instance.cache.images.push(new PhotoSwipe.Image.ImageClass(image, src, caption, metaData));				
			} 
		}


		/*
		 * removeAll can be used to load a new section, accepts parameter name to load a button that isnt in the list 
		 * just to preview the section w/o commiting to add it
		 */
		this.loadImages = function (name) {
			var url = this.requestURL(name);

			images.removeAll();

			// load the complete feed
			loader.call(url, function (data) {
				
				if (isMobile){
					if (typeof window.instance != "undefined" && window.instance != null) {
						PhotoSwipe.detatch(window.instance);
						window.instance = null;
					}
					window.instance = PhotoSwipe.attach(
						[ ], //empty array gets added by liveQuery
						{
							getImageSource: function(el){
								return el.href;
							},
							getImageCaption: function(el){
								return el.title;
							},
							cacheMode: Code.PhotoSwipe.Cache.Mode.aggressive
						}
					);		
				}

				var profile = { "ids": [], name: this.menu.activeButton().name };

				for (var index in data){
					profile.ids.push(data[index].data.id);
					isImage(data[index].data, function (cleanItem) {
						images.push(new ImageBox(cleanItem));
					});
				}
				
				self.AutoRefresh.add(profile, function(data){
					isImage(data, function (cleanItem) {
						images.unshift(new ImageBox(cleanItem));
						$.colorbox.incrementIndex();
					});
				}.bind(this));	
				/*
					this is a temporary hack because of the way photoswipe works, need to figure out a way to improve this
				*/	
				if (!isMobile)
					self.imageBar.sortImagesByDate();
					
				if (isMobile){
					setTimeout(function () {
						window.iScroller.refresh();	
					}, 0);
				}
					
			}.bind(this));

		}

		/*
		 * Loads the content for the active image button
		 */
		var load = function () {

				/*
				 * Loads the default image section
				 */
				this.menu.addButton(saved_imagebar.split(","));
				this.save();

				/*
				 * This provides the copy to share functionality
				 */
				$("a.copyLink").live("mouseover", function (e) {
					var copyLink = $(e.target);
					/*
					 * needs to be recraeted everytime the image changes
					 */
					if (typeof clip == "undefined") {
						ZeroClipboard.setMoviePath('ZeroClipboard.swf');
						window.clip = new ZeroClipboard.Client();
						clip.setHandCursor(true);
						clip.addEventListener('onComplete', function () {
							$("a.copyLink").html('copied');
						}.bind(this));
					}
					/*
					 * this piece moves the embed/object to over the link to make it clickable
					 */
					if (clip.div) {
						clip.reposition(copyLink.get(0));
					} else {
						clip.glue(copyLink.get(0));
					}
					this.activeImage().setClipboardText();

				}.bind(this));


				$(document).ready(function () {
					/*
					 * the idea is to have adGallery monitor the selector rather than having to reinit it
					 */
					if (isMobile){
						//TODO fix the window. scoping
						window.iScroller = new iScroll('ad-thumbs', {
							hScroll: true,
							hScrollbar: false,
							vScroll: false,
							vScrollbar: false,
							momentum: true,
							fadeScrollbar: false
						})	
					}
					else {
						$("#ad-thumbs")
							.append('<div class="vertical" data-bind="visible: !imageBar.hasImages()">\
								<div class="loader"></div>\
							</div>');
						$("div.ad-gallery").adGallery();	
					}
						
					/*
					 * The following provides Facebook share functionality
					 */
					var e = document.createElement("script");
					e.async = true;
					e.onload = function () {
						FB.init({
							appId: "148360715252023",
							status: true,
							cookie: true,
							xfbml: true
						});
					}
					e.src = document.location.protocol + "//connect.facebook.net/en_US/all.js";
					document.getElementById("fb-root").appendChild(e);

					$("#showMore").miniTip({
					    title: "More Pics",
					    content: $("#showMoreList").html(),
					    event: "click",
					    anchor: 's',
					    render: function(){ ko.applyBindings(App); },
					    aHide: false
					});					
					
				});

			}.bind(this);

		var isImage = function (pic, callback) {
				var regex = new RegExp("(.*?)\.(jpg|jpeg|png|gif)$");
				/*
				 * Size formats used by Imgur to optimize imageBar loading
				 */
				var size = "m" //s-small, m-medium, l-large
				/*
				 * javascript.xml also found in the git repo, reads the mimetype of the file to determine if its an image
				 */
				var getHeaders = function (pic) {
						var sql = "USE 'http://javarants.com/yql/javascript.xml' AS j;\
                                   select content-type from j where code='response.object = y.rest(\"" + pic.url + "\").followRedirects(false).get().headers';";
						var reqURL = "http://query.yahooapis.com/v1/public/yql?format=json&q=" + escape(sql);
						$.ajax({
							type: 'GET',
							url: reqURL,
							dataType: 'jsonp',
							success: function (data) {
								try {
									if (data.query.results.result['content-type'].indexOf("image") >= 0) {
										callback(pic);
									}
								} catch (e) {}
							}
						});
					}
				pic.thumbnail = pic.url;
				/*
				 * This part finds images that maybe i.imgur.com or imgur.com that dont have an extension and are not /a/ which are for albums
				 * maybe in the future add support for getting the pics within an album using the official imgur api and retrieving it but for now ignore
				 */
				if (pic.url.indexOf("imgur.com/") >= 0 && pic.url.indexOf("imgur.com/a/") == -1 && !regex.exec(pic.url)) {
					pic.url = pic.url + ".jpg";
				}
				//change the url to thumbnails
				if (pic.url.indexOf("imgur.com/") >= 0) {
					var file = pic.url.split("/")[pic.url.split("/").length - 1].split(".");
					pic.thumbnail = "http://imgur.com/" + file[0].substring(0, 5) + size + "." + (file[1] || "jpg");
				}
				if (regex.exec(pic.url)) {
					callback(pic);
				} else {
					getHeaders(pic, callback);
				}
			}

		this.requestURL = function (name) {
			var section = name || this.menu.activeButton().name;
			return BASE_URL + "/r/" + section + "/.json?&limit=" + IMAGES_PER_REQUEST;
		}

		/*
		 * The idea is that the menu holds the buttons 
		 */
		this.menu = new(function () {
			var selected = ko.observable();
			var MAX_IMAGE_BAR_BUTTONS = 4;
			var buttons = ko.observableArray();

			/*
			 *  Imagebar individual buttons
			 */
			var ImageButton = function (name) {
				this.name = name;

				this.selected = ko.dependentObservable(function () {
					return (selected() == this);
				}.bind(this));

				this.select = function () {
					selected(this);
					imagebar.loadImages();
				}

				this.remove = function () {
					buttons.remove(this);
					self.jqm.refresh();
					imagebar.save();
				};

				this.isFirst = function(){
					return buttons.indexOf(this) == 0;	
				}
				
				this.toString = function () {
					return this.name;
				};
				
			}

			this.addButton = function (name) {
				if (name.push) {
					for (var index in name) {
						this.addButton(name[index]);
					}
				} else {
					buttons.push(new ImageButton(name));
				}

				// TODO: redo this.. it sucks
				if (buttons().length === 1) buttons()[0].select(buttons()[0].name);
			};

			/*
			 * Returns the buttons for the top right imagebar buttons
			 *
			 * returns string[] of names
			 */
			this.getFrontPage = ko.dependentObservable(function () {
				return buttons().slice(0, MAX_IMAGE_BAR_BUTTONS);
			}.bind(this));

			/*
			 * Evaluates whether or not to show the extended menu icon
			 *
			 * returns boolean true if the icon should be shown
			 */
			this.populatedMenu = ko.dependentObservable(function () {
				return buttons().length > MAX_IMAGE_BAR_BUTTONS;
			}.bind(this));

			/*
			 * Returns the extended menu of items
			 *
			 * returns string[] of those buttons that should appear in the drop-down list
			 */
			this.get = ko.dependentObservable(function () {
				return buttons().slice(isMobile ? 0 : MAX_IMAGE_BAR_BUTTONS, buttons().length);
			}.bind(this));

			this.activeButton = function () {
				return selected();
			}

			this.getButtons = function () {
				return buttons();
			}
			
		})();

		/*
		 * Determine if the overlay is open
		 */
		this.overlayOpen = ko.observable(false);
		/*
		 * This helps colorbox maintain an index based approach
		 */
		this.getActiveIndex = function () {
			return images.indexOf(this.activeImage());
		}

		/*
		 * Another colorbox helper method
		 */
		this.fullscreenLightbox = function(){
			var i = new Image();
			i.onload = function(){
			    $.colorbox.resize({ innerWidth: this.width, innerHeight: this.height });
			    $(".cboxPhoto").css({ 'width': this.width, 'height': this.height })
			};
			i.src = $.colorbox.element()[0].href;
		}
		
		this.getImages = function () {
			return images();
		}

		this.hasImages = ko.dependentObservable(function () {
			return images().length > 0;
		}.bind(this));

		//sorters
		this.sortImagesByDate = function (desc) {
			images(images().sort(function (a, b) {
				return (desc || true) ? b.created - a.created : b.created - a.created;
			}));
		}.bind(this);

		/*
		 * Return all the portlets (subreddits) in a Array of Strings
		 */
		this.toStringArray = function () {
			return this.menu.getButtons().map(function (item) {
				return item.name;
			});
		};

		this.save = function () {
			$.jStorage.set(STORAGE_KEY_NAME, this.toString());
		}

		/*
		 * Return all the portlets (subreddits) in their order
		 */
		this.toString = function () {
			return this.toStringArray().join(",");
		};

		load();
	})();

	/*
	 * Houses all the portlets (subreddits)
	 */
	this.subreddits = new(function () {
		// private variables
		var SubReddits = this;
		var STORAGE_KEY_NAME = "subreddits";
		var portlets = ko.observableArray();
		var NEWS_ITEMS_PER_REQUEST = 30;
		var SUBREDDIT_ITEMS = 10;
		var DEFAULT_SUBREDDITS = "Gadgets,Funny,Reddit.com,Javascript,WTF,Programming";
		var saved_subreddits = $.jStorage.get(STORAGE_KEY_NAME, DEFAULT_SUBREDDITS);

		// getters
		this.getSubreddits = function () {
			return this;
		};
		this.activeButtons = ko.observableArray();
		
		var load = function () {
			$("div.viewMore").livequery(function(e){
				$(this).miniTip({
					title: "View More",
					content: $("#viewMoreList").html(),
					render: function(){ ko.applyBindings(App); },
					event: "click",
					aHide: false
				})
			});
			this.addPortlet(saved_subreddits.split(","));
			this.save();
		}.bind(this);

		// private class (individual portlets)
		var Portlet = function (name) {
				var newsItems = ko.observableArray();
				var portlet = this;
				var STORAGE_KEY_NAME = "portlet_" + name; 
				var DEFAULT_SETTINGS = {
						minimized: false,
						showVisited: false
				}; 
				var savedSettings = $.jStorage.get(STORAGE_KEY_NAME, DEFAULT_SETTINGS);
				var minimized = ko.observable(savedSettings.minimized);
				var message = ko.observable("");
				var showVisited = ko.observable(savedSettings.showVisited);


				/*
				 * Loads the content for the subreddit
				 */
				var load = function () {
						var url = this.requestURL();

						if (!url) {
							message("Please select a category");
							return;
						}

						// load the complete feed
						loader.call(url, function (data) {
							if (data.length === 0) {
								message("No results...");
								return;
							}

							// populate each of the news item inside the portlet
							for (var index in data)
							newsItems.push(new NewsItem(data[index].data));

							// set the last item field
							// used for the next call; we continue loading content from this point on
							this.last(newsItems()[newsItems().length - 1]);
							
							var profile = { "ids": $.map(newsItems(), function(o){ return o.id; }), name: portlet.name };
							
							self.AutoRefresh.add(profile, function(item){
								newsItems.unshift(new NewsItem(item));
							}.bind(this))
							
						}.bind(this));
					}.bind(this);

				var NewsItem = function (item) {
					var MAX_TITLE_LENGTH = 95;

					this.id = item.id;
					this.title = item.title;
					this.text = item.title.substring(0, MAX_TITLE_LENGTH) + ((item.title.length > MAX_TITLE_LENGTH) ? "..." : "");
					this.redditURL = BASE_URL + "/tb/" + item.id; // nicer link with comments, upvote.. etc at the top (iframed)
					this.url = item.url;
					this.score = parseInt((item.ups / (item.downs + item.ups)) * 100, 10) + "%";
					this.scoreTitle = this.score + " of People Like It"; /* Reddit removes their own domain name from the permalink to save space so append it back in */
					this.permalink = BASE_URL + item.permalink;
					this.visited = ko.observable(self.visitedLinks.visited(this.id));


					/*
					 * Observable that checks whether or not the link is visible
					 */
					this.isVisible = ko.dependentObservable(function () {
						// checks the the link to see if its been visited, or if all the news items are visible
						return !this.visited() || showVisited();
					}.bind(this));

					/*
					 * Marks the page as seen/visited
					 */
					this.visitPage = function (evt) {
						var element = $(evt.target);

						// replace link with reddit's link for it only if its not Youtube.com which has a glitch with reddit's frame
						if (this.url.indexOf("youtube.com") == -1) element.attr('href', this.redditURL)

						setTimeout(function () {
							// swap back the original link
							element.attr('href', this.url);

							// set the page as visited
							this.visited(true);

							// TODO: this needs to GO, should not reference settings like that
							self.visitedLinks.add(this.id);
							self.settings.save();
						}.bind(this), 1000);

						return true;
					};
				};

				// attributes
				this.name = name 
				/*
				 * Reddit.com's frontpage content is found at Reddit.com/hot/.json not reddit.com/r/Reddit.com/hot/.json
				 */
				this.url = BASE_URL + (name == "Reddit.com" ? "" : ("/r/" + decodeURIComponent(name)));
				this.last = ko.observable();
				this.amountVisible = ko.observable(10);

				/*
				 * Houses the navigaton button for the pannel (ie. "top", "new", .. etc)
				 */
				this.buttons = new(function () {
					var DEFAULT_ACTIVE_BUTTON = "hot";
					var NEWS_BUTTONS = ['hot', 'new', 'top', 'controversial'];					
					var activeButton = ko.observable();
					var buttons = ko.observableArray();
					/*
					 * Button specifics
					 */
					var Button = function (name, active) {
						this.init = function (name, active) {
							this.name = name;
							if (active) this.setActive();
						};

						this.setActive = function (event) {
							activeButton(this);
							portlet.last(null); // reset the last item (for the ajax call)
							newsItems.removeAll(); // remove all the news items
							message(""); // reset the messages
							// if it was clicked then make request
							if (event) load(); // redo this
						}.bind(this);

						this.isActive = ko.dependentObservable(function () {
							return activeButton() === this;
						}.bind(this));

						// initialize the object
						this.init(name, active);
					};

					this.init = function () {
						var name;

						for (var index in NEWS_BUTTONS) {
							name = NEWS_BUTTONS[index];

							buttons.push(new Button(name, (name === DEFAULT_ACTIVE_BUTTON)));
						}
					};

					this.activeButton = activeButton;

					this.all = function () {
						return buttons();
					};
					
					// initialize the object
					this.init();
				})(); 
				
				/*
				 * Returns the full request URL to call reddit.com
				 * - append the last item on the list so it doenst need to reload the full pannel
				 */
				this.requestURL = function () {
					var activeButton = this.buttons.activeButton();

					if (!activeButton) {
						console.error("No active catetegory found for " + this.name);
						return;
					}

					return this.url + "/" + activeButton.name + "/.json?&limit=" + NEWS_ITEMS_PER_REQUEST + ((this.last()) ? "&after=" + this.last().id : "");
				};

				this.setActive = function(){
					SubReddits.activeButtons(this.buttons.all());
				}
				/*
				 *  this allows more items to come in naturally as the ones that are read dissapear
				 */
				this.getNewsItems = function () {
					return ko.utils.arrayFilter(newsItems(), function (newsItem) {
						return newsItem.isVisible() ? newsItem : null;
					}).slice(0, this.amountVisible());
				};

				/*
				 * Returns the state of the minimized property
				 */
				this.isMinimized = function () {
					return minimized();
				};
				
				/*
				 * Returns the state of the showVisited property
				 */
				this.isShowingVisited = function(){
					return showVisited();
				}
				
				/*
				 * Toggles the state of the minimized property
				 */
				this.toggleMinimize = function () {
					// toggles from true to false depending on current value:
					// ie. true ^ true -> false
					// ie. false ^ true -> true
					minimized((minimized() ^ true) === 1);
					this.save();
				};

				/*
				 * Toggles whether it shows the visited links or not
				 */
				this.toggleVisited = function () {
					showVisited((showVisited() ^ true) === 1);
					this.save();
				};
				
				/*
				 * Triggers the display of the load bar to the user if there are no items.
				 * - its ignored if there is a message
				 *
				 * returns boolean: true if there are no items and no massage out for display
				 */
				this.getShowLoadingBar = function () {
					return !(newsItems().length > 0) && message() === "";
				};

				/*
				 * Message display for the user (error, info, etc)
				 *
				 * returns string message description
				 */
				this.getMessage = function () {
					return message();
				};

				/*
				 * Populates the portlet with 10 more items
				 */
				this.populateNext = function () {
					this.amountVisible(this.amountVisible() + 10);
					load();
				};
				
				this.isFirst = function(){
					return portlets.indexOf(this) == 0;	
				}
				
				/*
				 * Remove portlet
				 */
				this.remove = function () {
					if (confirm("Are you sure you want to delete this section?")) {
						SubReddits.removePortlet(this);
					}
				}.bind(this);

				this.save = function(){
					$.jStorage.set(STORAGE_KEY_NAME, {
							minimized: minimized(),
							showVisited: showVisited()
					});
				}
				
				this.toString = function () {
					return this.name;
				}.bind(this);

				load();
			};

		/*
		 * Adds a new portlet to the DOM
		 * @portlet string name of the subreddit
		 */
		this.addPortlet = function (portlet) {
			if (portlet.push) {
				for (var index in portlet) {
					this.addPortlet(portlet[index]);
				}
			} else {
				portlets.push(new Portlet(portlet));
			}
		};

		/*
		 * Returns all the portlets (subreddits)
		 */
		this.getPortlets = function () {
			return portlets;
		};

		/*
		 * Removes portlet
		 * @portlet Portlet() portlet object thats going to get deleted
		 */
		this.removePortlet = function (portlet) {
			portlets.remove(portlet);
			self.jqm.refresh();
			this.save();
		};

		/*
		 * Removes all portlet
		 */
		this.removeAllPortlets = function () {
			portlets.removeAll();
		};

		/*
		 * Return all the portlets (subreddits) in a Array of Strings
		 */
		this.toStringArray = function () {
			return portlets().map(function (item) {
				return item.name;
			});
		};

		this.save = function () {
			$.jStorage.set(STORAGE_KEY_NAME, this.toString());
		}

		/*
		 * Return all the portlets (subreddits) in their order
		 */
		this.toString = function () {
			return this.toStringArray().join(",");
		};

		load();
	})();

	this.metareddits = new(function () {
		var context = this;
		var defaults = ['active', 'over18', 'new', 'self', 'media'];
		var metas = ko.observableArray();
		var activeReddits = ko.observableArray();
		var selected = ko.observable();

		var meta = function (name) {
			var item = this;
			this.name = name;

			this.select = function () {
				selected(this);
				context.request(item.name);
			}.bind(this);

			this.selected = ko.dependentObservable(function () {
				return (selected() == this);
			}.bind(this));
		}

		var load = function () {
			$.each(defaults, function () {
				metas.push(new meta(this));
			});
			$("input[name=metaList]").live("change", function(e){
			    context.request(e.target.value);
			});
		}

		var MAX_IMAGE_BAR_BUTTONS = 4;
		var buttons = ko.observableArray();
		/*
		 * A RedditSection defines an item within a meta that allows you to add them to the imageBar or subreddits
		 */
		var RedditSection = function (item) {
			this.name = item.content;
			this.section = item.href.split('/')[2];
			this.count = item.title.replace(/[^0-9]/g, '');
			
			this.add = function (e) {
				self.adder.show(e.target, this.name);
			}
			this.view = function () {
				self.imageBar.loadImages(this.name);
			}
			this.open = function () {
				window.open(BASE_URL + '/r/' + this.section, "_blank")
			}
		}

		this.get = function () {
			return metas();
		}

		this.activeList = function () {
			return activeReddits();
		}

		this.request = function (name) {
			var sql = "select * from html where url=\"http://metareddit.com/reddits/" + name + "/list\" and xpath='//*[@class=\"subreddit\"]'";
			var script = document.createElement("script");
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", "http://query.yahooapis.com/v1/public/yql?format=json&callback=App.metareddits.loadList&q=" + escape(sql));
			document.body.appendChild(script);
		}

		this.loadList = function (data) {
			if (data.query.count > 0) {
				activeReddits.removeAll();
				$.each(data.query.results.a, function (i, o) {
					activeReddits.push(new RedditSection(o));
				});
				activeReddits(activeReddits.sort(function (a, b) {
				    return b.count - a.count;
				}));
				self.jqm.refresh();
			}
		}

		load();
	})();

	this.adder = new(function () {
		var context = this;
		this.activeSection = ko.observable("");
		this.isActive = ko.dependentObservable(function () {
			return this.activeSection() != "";
		}.bind(this));
		
		var load = function(){
			$('#customize input[name=feedName]').live("keyup", function(e){
				if (e.keyCode == 13)
					context.show(this, this.value);
			});
		}
		
		this.disable = function () {
			this.activeSection("");
		}.bind(this);

		this.show = function (target, name) { 
			this.activeSection(name);
			$("#popupAdd").position({
				of: target,
				my: "left top",
				at: "left bottom",
				offset: 0,
				collision: "flip flip"
			});
		}

		this.pick = function (e) {
			var section = e.target.childNodes[0].innerHTML;
			if (section == "News"){ 
				self.subreddits.addPortlet(this.activeSection());
				self.subreddits.save();
			}
			else if (section == "Pics"){
				self.imageBar.menu.addButton(this.activeSection());
				self.imageBar.save();
			}
			this.disable();	
			self.jqm.refresh();
		}.bind(this);
		
		load();
	})();

	this.jqm = new (function(){
		
		this.refresh = function(){
			$("ul.jqmList").listview('refresh');
			$("input").textinput();
			$.mobile.checkboxradio.prototype.enhanceWithin( $("fieldset.radioFieldset") );
			$( ":jqmData(role='controlgroup')" ).controlgroup({ excludeInvisible: false });
			//$("#popupAdd a[data-role=button]").buttonMarkup();
		}
	})()
	
	this.AutoRefresh = new (function () {
		var ar = this;
		this.registry = {}
		
		this.add = function(profile, callback){
			ar.registry[profile.name.toLowerCase()] = {
				ids: profile.ids,
				callback: callback,
				name: profile.name
			}
			//console.log("subscribing to " + profile.name)
			redditlive.on('connect', function () {
			    redditlive.subscribe([ profile.name ]);
			});			
		}
		
		redditlive.on('post', function (post) {
			var profile = ar.registry[post.subreddit.toLowerCase()];
			if (!profile.ids[post.id]){
				//console.log('Article Added to: ' + profile.name + " " + post.title)
				profile.callback(post)
			}
		});
		
		redditlive.connect();
	})	

})();


//connect items with observableArrays
ko.bindingHandlers.sortableList = {
	init: function (element, valueAccessor) {
		var list = valueAccessor();
		
		$(element).sortable({
			update: function (event, ui) {
				//retrieve our actual data item
				var item = ui.item.tmplItem().data;
				//figure out its new position
				var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);

				//remove the item and add it back in the right spot
				if (position >= 0) {
					list.remove(item);
					list.splice(position, 0, item);
				}
				App.jqm.refresh();
			}
		});
	}
};

ko.bindingHandlers.miniTipMore = {
	init: function (element, valueAccessor) {
		$(element).miniTip({
		    title: "View More",
		    content: $("#viewMoreList").html(),
		    render: function(){ ko.applyBindings(App); },
		    event: "click",
		    aHide: false
		})
	}
};

$(document).ready(App.init);