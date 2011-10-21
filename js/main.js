if(typeof console == "undefined"){
    console = { log: function(){}, error: function(){}, info: function(){} };
}

$(document).ready(function(){
    settings.init();
});

/*
 * Setting wrapper
 * - handles all the that needs to persist
 */
var settings = new (function(){
	//this is how to remove the references to settings everywhere
	var self = this;
    // default cookie settings
    var BACKGROUND_COLOR = null;
    var BACKGROUND_IMAGE = "images/spacestorm.jpg";
    var SUBREDDITS = ["Gadgets", "Funny", "Reddit.com", "Javascript","WTF","Programming"];
    var SUBREDDIT_ITEMS = 10;
    var IMAGE_BAR = ["Pics","WTF","NSFW","Funny","RageComics","Bacon"];
    var BASE_URL = "http://www.reddit.com";
    
    this.background = new (function(){
        this.color = ko.observable(BACKGROUND_COLOR);
        this.image = ko.observable(BACKGROUND_IMAGE);
        
        /*
         * Checks whether or not the color is set or not
         * - only gets executed when either image or color changes; thus nulls out the other [eliminates the need to have subscribe()rs]
         */
        this.isColorSet = ko.dependentObservable(function(){
            var colorSet = this.color() !== null;
            
            if(colorSet)
                this.image(null);
            else
                this.color(null);
            
            return colorSet;
        }, this)
    })();
    

    this.metaReddits = ko.observableArray();
     
    this.init = function(){
        // initialize complex object
        //this.preferences = new this.preferences(this);
        //this.preferences.load();
		
		$.get("templates.html", function(r){
		    $("head").append(r);
        	ko.applyBindings(this);
			this.preferences.load();
		}.bind(this));	
    };
    
    // getters
    this.getSubreddits = function(){
        return this.subreddits;
    };
    
    //sorters
    this.sortImagesByDate = function(desc){
        this.images(this.images().sort(function(a,b){
            return (desc || true) ? b.created - a.created : b.created - a.created;
        }));
    }.bind(this);
    /*
     * Request manager
     * - keeps track of all outgoing remote calls
     * TODO: if $.ajax returns more than X amount of errors stop making calls
     */
    var loader = new (function(){
        var MAX_CONNECTIONS = 10;
        var activeConnections = [];
        var queued = [];
        
        /*
         * Calls the next request
         */
        var nextCall = function(){
            // if active connections is above the maximun threshold skip
            // if the queue is empty skip
            if(activeConnections.length > MAX_CONNECTIONS || queued.length === 0) {
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
        this.call = function(url, callback){
            if(activeConnections.length > MAX_CONNECTIONS){
                queued.push({ "url": url, "callback": callback });
                return;
            }
            
            // make request
            var connection = $.ajax({
                type: 'GET',
                url: url,
                dataType: 'jsonp',
                jsonp: 'jsonp',
                timeout: 20000, // 2 seconds timeout
                success: function(data){
                    callback(data.data.children);
                },
                error: function(){
                    // stick it on the queue
                    queued.push({ "url": url, "callback": callback });
                },
                complete: function(){
                    // remove connection from the active connection list
                    activeConnections = activeConnections.filter(function(item){
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
    this.visitedLinks = new (function(){
        var links = {};
        
        /*
         * Append a visited link
         * @id string the id from reddit
         */
        this.add = function(id){
            links[id] = id;
        };
        
        /*
         * Checks if the link has been visited or not
         * @id string the id from reddit
         * returns true if there is a match
         */
        this.visited = function(id){
            return (id in links);
        };
        
        /*
         * Loads the current visited links
         * @links string list of visited links in a long array ie "link1,link2" NOT: ["link1","link2"]
         */
        this.load = function(links){
			try {
	            links = links.split(",");
			}catch(e){ self.preferences.erase() }
            for(var index in links)
                this.add(links[index]);
        };
        
        /*
         * Returns all the visited links separeted by a comma
         */
        this.toString = function(){
            var keys = [];
            
            for(var key in links) {
                keys.push(key);
            }
            
            return keys.join(",");
        };
    })();
    
    /*
     * Houses the image bar -- controls the image view
     * TODO: self fetch images
     */
    this.imageBar = new (function(){
    	/*
    	 * Always store one array at a time of the images for the active button
    	 */
    	var images = ko.observableArray();
    	var IMAGES_PER_REQUEST = 50;
    	
    	var ImageBox = function(item){
    		this.src = item.url;
    		this.title = item.title;
    		this.thumbnail = item.thumbnail;
    	}
        /*
         * Loads the content for the active image button
         */
        var load = function(){
            var url = this.requestURL();
            
            // load the complete feed
            loader.call(url, function(data){

                // populate each of the images into the imageBar
                for(var index in data)
                	isImage(data[index].data, function(cleanItem){
                		images.push(new ImageBox(cleanItem));
                	}) 

            }.bind(this));
        }.bind(this);

        var isImage = function(pic, callback){ 
            var regex = new RegExp("(.*?)\.(jpg|jpeg|png|gif)$");
            /*
             * Size formats used by Imgur to optimize imageBar loading
             */
			var size = "m" //s-small, m-medium, l-large
			/*
			 * javascript.xml also found in the git repo, reads the mimetype of the file to determine if its an image
			 */				
			var getHeaders = function(pic){
                var sql = "USE 'http://javarants.com/yql/javascript.xml' AS j;\
                                   select content-type from j where code='response.object = y.rest(\"" + pic.url + "\").followRedirects(false).get().headers';";
                var reqURL = "http://query.yahooapis.com/v1/public/yql?format=json&q=" + escape(sql);
                $.ajax({
                        type: 'GET',
                        url: reqURL, 
                        dataType: 'jsonp',
                        success: function(data){
                        	if (data.query.results.result['content-type'].indexOf("image") >= 0){                         
                        		callback(pic); 
                            }   
                        }
                    }
                );				
			}				
			pic.thumbnail = pic.url;
			//normalize the urls
            if ( pic.url.indexOf("imgur.com/") >= 0 && !regex.exec( pic.url ) ){
                 pic.url = pic.url + ".jpg";
            }
			//change the url to thumbnails
			if ( pic.url.indexOf("imgur.com/") >= 0 ){
				var file = pic.url.split("/")[pic.url.split("/").length - 1].split(".");
				pic.thumbnail = "http://imgur.com/" + file[0].substring(0,5) + size + "." + (file[1] || "jpg");
			}
            if (regex.exec( pic.url )){
            	callback(pic); 
            }
            else {
                getHeaders(pic, callback);
            }
        } 
        
        this.requestURL = function(){
        	//for now
        	//var activeButton = this.menu.activeButton();
        	var activeButton = {
        		name: "Pics"
        	}
        	
            return BASE_URL + "/r/" + activeButton.name + "/.json?&limit=" + IMAGES_PER_REQUEST;
        }
        
        /*
         * The idea is that the menu holds the buttons 
         */
    	this.menu = new (function(){
    		var MAX_IMAGE_BAR_BUTTONS = 4;
    		var selected = ko.observable();
    		    		
    		this.buttons = new (function(){
        		var MAX_IMAGE_BAR_BUTTONS = 4;
        		var buttons = ko.observableArray();
        		
        	})(); 
    		
    		this.activeButton = function(){
    			return selected();
    		}
    	})();
        
    	this.getImages = function(){
    		return images();
    	}
    	
    	load();
    })();
    
    /*
     * Houses all the portlets (subreddits)
     */
    this.subreddits = new (function(){
        // private variables
        var SubReddits = this;
        var portlets = ko.observableArray();
        var NEWS_BUTTONS = ['hot','new','top','controversial'];
        var NEWS_ITEMS_PER_REQUEST = 30;
        
        // private class (individual portlets)
        var Portlet = function(name){
            var newsItems = ko.observableArray();
            var portlet = this;
            var minimized = ko.observable(false);
            var message = ko.observable("");
            
            this.showVisited = ko.observable(false);
            
            this.toggleVisited = function(){
                this.showVisited((this.showVisited() ^ true) === 1);
            };
            
            /*
             * Loads the content for the subreddit
             */
            var load = function(){
                var url = this.requestURL();
                
                if(!url){
                    message("Please select a category");
                    return;
                }
                
                // load the complete feed
                loader.call(url, function(data){
                    if(data.length === 0){
                        message("No results...");
                        return;
                    }
                    
                    // populate each of the news item inside the portlet
                    for(var index in data)
                        newsItems.push(new NewsItem(data[index].data));
                    
                    // set the last item field
                    // used for the next call; we continue loading content from this point on
                    this.last(newsItems()[newsItems().length-1]);
                }.bind(this));
            }.bind(this);
            
            var NewsItem = function(item){
                var MAX_TITLE_LENGTH = 95;
                
                this.id = item.id;
                this.title = item.title;
                this.text = item.title.substring(0, MAX_TITLE_LENGTH) + ((item.title.length > MAX_TITLE_LENGTH)? "...": "");
                this.redditURL = BASE_URL + "/tb/" + item.id; // nicer link with comments, upvote.. etc at the top (iframed)
                this.url = item.url;
                this.score =  parseInt((item.ups / (item.downs + item.ups)) * 100, 10) + "%";
                this.scoreTitle = this.score + " of People Like It";
                /* Reddit removes their own domain name from the permalink to save space so append it back in */
				this.permalink = BASE_URL + item.permalink;
                this.visited = ko.observable(self.visitedLinks.visited(this.id));

                
                /*
                 * Observable that checks whether or not the link is visible
                 */
                this.isVisible = ko.dependentObservable(function(){
                    // checks the the link to see if its been visited, or if all the news items are visible
                    return !this.visited() || portlet.showVisited();
                }.bind(this));
                
                /*
                 * Marks the page as seen/visited
                 */
                this.visitPage = function(evt){
                    var element = $(evt.target);
                    
                    // replace link with reddit's link for it only if its not Youtube.com which has a glitch with reddit's frame
					if (this.url.indexOf("youtube.com") == -1)
	                    element.attr('href', this.redditURL)
                    
                    setTimeout(function(){
                            // swap back the original link
                            element.attr('href', this.url);
                            
                            // set the page as visited
                            this.visited(true);
                            
                            // TODO: this needs to GO, should not reference settings like that
                            self.visitedLinks.add(this.id);
                            self.preferences.save();
                        }.bind(this), 1000
                    );
                    
                    return true;
                };
            };
            
            // attributes
            this.name = name;
            this.url = BASE_URL + "/r/" + decodeURIComponent(name);
            this.last = ko.observable();
            this.amountVisible = ko.observable(10);
            
            /*
             * Houses the navigaton button for the pannel (ie. "top", "new", .. etc)
             */
            this.buttons = new (function(){
                var DEFAULT_ACTIVE_BUTTON = "hot";
                
                var buttons = ko.observableArray();
                var activeButton = ko.observable();
                
                /*
                 * Button specifics
                 */
                var Button = function(name, active){
                    this.init = function(name, active){
                        this.name = name;
                        if(active) this.setActive();
                    };
                    
                    this.setActive = function(event){
                        activeButton(this);
                        
                        portlet.last(null); // reset the last item (for the ajax call)
                        newsItems.removeAll(); // remove all the news items
                        message(""); // reset the messages
                        
                        // if it was clicked then make request
                        if(event)
                            load(); // redo this
                    }.bind(this);
                    
                    this.isActive = ko.dependentObservable(function(){
                        return activeButton() === this;
                    }.bind(this));
                    
                    // initialize the object
                    this.init(name, active);
                };
                
                this.init = function(){
                    var name;
                    
                    for(var index in NEWS_BUTTONS){
                        name = NEWS_BUTTONS[index];
                        
                        buttons.push(new Button(name, (name === DEFAULT_ACTIVE_BUTTON)));
                    }
                };
                
                this.activeButton = activeButton;
                
                this.all = function(){
                    return buttons();
                };
                
                // initialize the object
                this.init();
            })();
            
            /*
             * Returns the full request URL to call reddit.com
             * - append the last item on the list so it doenst need to reload the full pannel
             */
            this.requestURL = function(){
                var activeButton = this.buttons.activeButton();
                
                if(!activeButton){
                    console.error("No active catetegory found for " + this.name);
                    return;
                }
                
                return this.url + "/" + activeButton.name + "/.json?&limit=" + NEWS_ITEMS_PER_REQUEST + ((this.last())? "&after=" + this.last().id: "");
            };
            
            /*
             *  this allows more items to come in naturally as the ones that are read dissapear
             */
            this.getNewsItems = function(){
                return ko.utils.arrayFilter(newsItems(), function(newsItem){
                    return newsItem.isVisible() ? newsItem: null;
                }).slice(0,this.amountVisible());
            };
            
            /*
             * Returns the state of the minimized property
             */
            this.isMinimized = function(){
                return minimized();
            };
            
            /*
             * Toggles the state of the minimized property
             */
            this.toggleMinimize = function(){
                // toggles from true to false depending on current value:
                // ie. true ^ true -> false
                // ie. false ^ true -> true
                minimized((minimized() ^ true) === 1);
            };
            
            /*
             * Triggers the display of the load bar to the user if there are no items.
             * - its ignored if there is a message
             *
             * returns boolean: true if there are no items and no massage out for display
             */
            this.getShowLoadingBar = function(){
                return !(newsItems().length > 0) && message() === "";
            };
            
            /*
             * Message display for the user (error, info, etc)
             *
             * returns string message description
             */
            this.getMessage = function(){
                return message();
            };
            
            /*
             * Populates the portlet with 10 more items
             */
            this.populateNext = function(){
				this.amountVisible(this.amountVisible()+10);
                load();
            };
            
            /*
             * Remove portlet
             */
            this.remove = function(){
                if (confirm("Are you sure you want to delete this section?")){
                    SubReddits.removePortlet(this);
                }
            }.bind(this);
            
            this.toString = function(){
                return this.name;
            }.bind(this);
            
            load();
        };
        
        /*
         * Adds a new portlet to the DOM
         * @portlet string name of the subreddit
         */
        this.addPortlet = function(portlet){
            if(portlet.push){
                for(var index in portlet) {
                    this.addPortlet(portlet[index]);
                }
            } else {
                portlets.push(new Portlet(portlet));
            }
        };
        
        /*
         * Returns all the portlets (subreddits)
         */
        this.getPortlets = function(){
            return portlets;
        };
        
        /*
         * Removes portlet
         * @portlet Portlet() portlet object thats going to get deleted
         */
        this.removePortlet = function(portlet){
            portlets.remove(portlet);
			self.preferences.save();
        };
        
        /*
         * Removes all portlet
         */
        this.removeAllPortlets = function(){
            portlets.removeAll();
        };
        
        /*
         * Return all the portlets (subreddits) in a Array of Strings
         */
        this.toStringArray = function(){
            return portlets().map(function(item){
                return item.name;
            });
        };
        
        /*
         * Return all the portlets (subreddits) in their order
         */
        this.toString = function(){
            return this.toStringArray().join(", ");
        };
        
        // initializes all the portlets
        for(var index in arguments){
            this.addPortlet(arguments[index]);
        }
    })();
    
    /*
     * Houses all the user preference code
     * - needs to be initialized
     */
    this.preferences = new (function(settings){
        var currentTime = (new Date()).getTime();
        
        var COOKIE_NAME = "settings";
        var COOKIE_EXPIRE_NOW = (new Date(currentTime - 2*24*60*60*1000)).toGMTString(); // 2 days ago
        var COOKIE_EXPIRATION = (new Date(currentTime + 999*24*60*60*1000)).toGMTString(); // 999 days from now
        
        /*
         * Get cookie value (private function)
         * - loops over all the cookies and returns the one that maches
         * @param cookie name of the cookie
         * @return the content of the cookie [escaped]
         */
        var getCookieValue = function(cookie){
            var rawCookies = document.cookie.split(";");
            var rawCookieData = null;
            
            // leave if theres nothing worth searching for
            if(typeof(cookie) === 'undefined' || cookie === "") { return; }
            
            // loop over all the cookies
            for(var i in rawCookies) {
                rawCookieData = rawCookies[i].split("=");
                
                // if the cookie name matches return the value of the cookie [escaped]
                if(rawCookieData[0].replace(/(^\s+|\s+$)/g, "") == cookie) {
                    return unescape(rawCookieData[1]);
                }
            }
            
            // nothing found
            return;
        };
        
        /*
         * Load all the current settings from the cookie
         */
        this.load = function(){
            var cookie = getCookieValue(COOKIE_NAME);
            var settings = {};
            
            // load the cookie if its available
            if(cookie){
                settings = $.parseJSON(cookie);
                
                try {
                    this.background.color(settings.background.color);
                    this.background.image(settings.background.image);
                    
                    this.visitedLinks.load(settings['visitedLinks']);
                    this.getSubreddits().removeAllPortlets();
                    settings.subreddits.map(function(item){
                        this.getSubreddits().addPortlet(item);
                    }.bind(this));
                    
                    //Populate the cookie variable into the settings.imageBar variable
                    $.each(settings.imageBar,function(i, o){
                        this.imageBar.addButton(o);
                    }.bind(this));
                } catch(e){
                    console.error("Error loading settings..");
                    this.preferences.erase();
                }
            } else {
                // load default subreddits
                this.getSubreddits().addPortlet(SUBREDDITS);
                
                $.each(IMAGE_BAR,function(i, o){
                    this.imageBar.addButton(o);
                }.bind(this));
                
                // there was no cookie set, save it.
                this.preferences.save();
            }
        }.bind(self);
        /*
         * Erase the cookie
         */
        this.erase = function(){
            document.cookie = COOKIE_NAME + "=; expires=" + COOKIE_EXPIRE_NOW + "; path=/";
            document.location.href = document.location.href;
        };
        
        /*
         * Save all the current settings into the cookie
         */
        this.save = function(){
            document.cookie = COOKIE_NAME + "=" + escape(this.toString()) + "; expires=" + COOKIE_EXPIRATION + "; path=/";
        }.bind(this);
    })(this);
    
    this.toString = function(){
        return ko.toJSON({
            background: {
                color: this.background.color(),
                image: this.background.image()
            },
            subreddits: this.getSubreddits().toStringArray(),
            imageBar: this.imageBar.toStringArray(),
            visitedLinks: this.visitedLinks.toString()
        });
    };
})();

//connect items with observableArrays
ko.bindingHandlers.sortableList = {
    init: function(element, valueAccessor) {
        var list = valueAccessor();
        $(element).sortable({
            update: function(event, ui) {
                //retrieve our actual data item
                var item = ui.item.tmplItem().data;
                //figure out its new position
                var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                
                //remove the item and add it back in the right spot
                if (position >= 0) {
                    list.remove(item);
                    list.splice(position, 0, item);
                }
                
            }
        });
    }
};

var redditURL = "http://www.reddit.com";
