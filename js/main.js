if (typeof console == "undefined") {
    console = { log: function(){} };
}

/*
 * Setting wrapper
 * - handles all the that needs to persist
 */
var settings = new (function(){
    // default cookie settings
    var BACKGROUND_COLOR = null;
    var BACKGROUND_IMAGE = "images/spacestorm.jpg";
    var SUBREDDITS = ["Gadgets", "Funny", "Reddit.com", "Javascript","WTF","Programming"];
    var SUBREDDIT_ITEMS = 10;
    var IMAGE_BAR = ["Pics","WTF","NSFW","Funny"];
    
    var BASE_URL = "http://www.reddit.com";
    
    this.background = {
        color: ko.observable(BACKGROUND_COLOR),
        image: ko.observable(BACKGROUND_IMAGE)
    };
    
    this.images = ko.observableArray();
    this.activeImage = function(){
        return this.images()[this.activeImageIndex()];
    };
    this.activeImageIndex = ko.observable(0);
    this.metaReddits = ko.observableArray();
     
    this.init = function(){
        // initialize complex object
        this.preferences = new this.preferences(this);
        
        this.preferences.load();
        ko.applyBindings(this);
    };
    
    // getters
    this.getBackgroundColor = function(color){
        return this.background.color();
    };
    this.getBackgroundImage = function(){
        return this.background.image();
    };
    this.getSubreddits = function(){
        return this.subreddits;
    };
    
    // setters
    this.setBackgroundColor = function(color){
        this.background.color(color);
        this.background.image(null);
    };

    this.setBackgroundImage = function(image){
        this.background.color(null);
        this.background.image(image);
    };
    
    // shortcuts
    this.saveBackgroundColor = function(color){
        this.setBackgroundColor(color);
        this.preferences.save();
    };
    this.saveBackgroundImage = function(image){
        this.setBackgroundImage(image);
        this.preferences.save();
    };
    
    
    //sorters
    this.sortImagesByDate = function(desc){
        settings.images(settings.images().sort(function(a,b){
            return (desc || true) ? b.created - a.created : b.created - a.created;
        }));
    };
    
    /*
     * Request manager
     * - keeps track of all outgoing remote calls
     * TODO: if $.ajax returns more than X amount of errors stop making calls
     */
    var loader = new (function(){
        var MAX_CONNECTIONS = 10;
        var activeConnections = [];
        var queued = [];
        
        // TODO: redo, map-filter?
        var cleanData = function(data){
            var arrData = [];
            data.sort(function(a,b){
                return b.created - a.created;
            }); 
            for (i in data){
                arrData.push(data[i].data);
            }
            
            return arrData;
        };
        
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
                    var redditData = cleanData(data.data.children);
                    if (redditData.length > 0){
                        callback(redditData);
                    }
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
            links = links.split(",");
            
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
        var MAX_IMAGE_BAR_BUTTONS = 4;
        
        var buttons = ko.observableArray();
        var selected = ko.observable();
        
        var ImageButton = function(name){
            this.name = name;
            
            this.selected = ko.dependentObservable(function(){
                return (selected() == this);
            }.bind(this));
            
            this.select = function(e){
                mra.imageBar.changePic(this.name); 
                selected(this);
            }
            
            this.remove = function(){
                buttons.remove(this);
            };
            
            this.toString = function(){
                return this.name;
            };
        }
        
        this.addButton = function(name){
            if(name.push){
                for(var index in name){
                    this.addButton(name[index]);
                }
            } else {
                buttons.push(new ImageButton(name));
            }
            
            // TODO: redo this.. it sucks
            if(buttons().length === 1)
                buttons()[0].select(buttons()[0].name);
        };
        
        this.showMenu = function(){
			$("#showMoreList").position({
				of: $("#showMore"),
				my: "right top",
				at: "right bottom",
				offset: 0, 
				collision: "flip flip"
			}).toggle();
        };
		
        /* Returns the buttons for the top right imagebar buttons */
        this.getFrontPage = ko.dependentObservable(function(){
            return buttons().slice(0, MAX_IMAGE_BAR_BUTTONS);
        }.bind(this));
        /* this is an observeable that decides whether to show the extended menu icon */
        this.populatedMenu = ko.dependentObservable(function(){
            return buttons().length > MAX_IMAGE_BAR_BUTTONS;
        }.bind(this));
        /* This shows the extended menu of items */
        this.getMenu = ko.dependentObservable(function(){
            return buttons().slice(MAX_IMAGE_BAR_BUTTONS, buttons().length);
        }.bind(this));
        
        /*
         * Return all the image bar buttons in a Array of Strings
         */
        this.toStringArray = function(){
            return buttons().map(function(item){
                return item.name;
            });
        };
        
        /*
         * Return all the image bar buttons in their order
         */
        this.toString = function(){
            return this.toStringArray().join(", ");
        };
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
            
            this.showVisited = ko.observable(false);
            
            this.toggleVisited = function(){
                this.showVisited((this.showVisited() ^ true) === 1);
            };
            
            /*
             * Loads the content for the subreddit
             */
            var load = function(){
                var url = this.requestURL();
                
                // load the complete feed
                loader.call(url, function(data){
                    for(var index in data)
                        newsItems.push(new NewsItem(data[index]));
                    
                    this.last(newsItems()[newsItems().length-1]);
                }.bind(this));
            }.bind(this);
            
            var NewsItem = function(item){
                var MAX_TITLE_LENGTH = 95;
                
                this.id = item.id;
                this.title = item.title;
                this.text = item.title.substring(0, MAX_TITLE_LENGTH) + ((item.title.length > MAX_TITLE_LENGTH)? "...": "");
                this.redditURL = BASE_URL + "/tb/" + item.id;
                this.url = item.url;
                this.score =  parseInt((item.ups / (item.downs + item.ups)) * 100, 10) + "%";
                this.scoreTitle = this.score + " of People Like It";
                this.permalink = BASE_URL + item.permalink;
                this.visited = ko.observable(settings.visitedLinks.visited(this.id));
                
                /*
                 * Observable that checks whether or not the link is visible
                 */
                this.isVisible = ko.dependentObservable(function(){
                    // TODO: remove the settings reference
                    // checks the the link to see if its been visited, or if all the news items are visible
                    return !this.visited() || portlet.showVisited();
                }.bind(this));
                
                /*
                 * Marks the page as seem/visited
                 */
                this.visitPage = function(evt){
                    var element = $(evt.target);
                    
                    // replace link with reddit's link for it
                    element.attr('href', this.redditURL)
                    
                    setTimeout(function(){
                            // swap back the original link
                            element.attr('href', this.url);
                            
                            // set the page as visited
                            this.visited(true);
                            
                            // TODO: this needs to GO, should not reference settings like that
                            settings.visitedLinks.add(this.id);
                            settings.preferences.save();
                        }.bind(this), 1000
                    );
                    
                    return true;
                };
            };
            
            this.buttons = new (function(){
                var activeButton = ko.observable(NEWS_BUTTONS[0]);
                
                // public constants
                this.NEWS_BUTTONS = NEWS_BUTTONS;
                
                // TODO: create an object out of each button and make a property inside of it with isActive()
                this.getActiveButton = function(){
                    return activeButton();
                };
                
                this.reloadSection = function(i,e,o){
                    var button = $(i.target).attr("rel");
                    
                    newsItems.removeAll();
                    
                    activeButton(button);
                    load(); // redo this
                };
            })();
            
            // attributes
            this.name = name;
            this.url = BASE_URL + "/r/" + decodeURIComponent(name);
            this.last = ko.observable();
            this.amountVisible = ko.observable(10);
			
            this.requestURL = function(){
                return this.url + "/" + this.buttons.getActiveButton() + "/.json?&limit=" + NEWS_ITEMS_PER_REQUEST + ((this.last())? "&after=" + this.last().id: "");
            };
            
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
             * Triggers the display of the load bar to the user
             */
            this.getShowLoadingBar = function(){
                return !(newsItems().length > 0);
            };
            
            /*
             * Populates the portlet with 10 more items
             */
            this.populateNext = function(){
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
            settings.preferences.save();
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
        for(var index in arguments) {
            this.addPortlet(arguments[index]);
        }
    })();
    
    /*
     * Houses all the user preference code
     * - needs to be initialized
     */
    this.preferences = function(settings){
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
            } else {
                // load default subreddits
                this.getSubreddits().addPortlet(SUBREDDITS);
                
                $.each(IMAGE_BAR,function(i, o){
                    this.imageBar.addButton(o);
                }.bind(this));
                
                // there was no cookie set, save it.
                this.preferences.save();
            }
        }.bind(settings);
        
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
        }.bind(settings);
    };
    
    this.toString = function(){
        return ko.toJSON({
            background: {
                color: this.getBackgroundColor(),
                image: this.getBackgroundImage()
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

$(document).ready(function(){
    settings.init();
    // $("#newsSection").sortable().disableSelection();
});

var redditURL = "http://www.reddit.com";

var mra = {
    init: function(){
		//not yet
        //all hover and click logic for buttons
        $(".fg-button:not(.ui-state-disabled)")
        .hover(
            function(){ 
                $(this).addClass("ui-state-hover"); 
            },
            function(){ 
                $(this).removeClass("ui-state-hover"); 
            }
        )
        .mousedown(function(){
                $(this).parents('.fg-buttonset-single:first').find(".fg-button.ui-state-active").removeClass("ui-state-active");
                if( $(this).is('.ui-state-active.fg-button-toggleable, .fg-buttonset-multi .ui-state-active') ){ $(this).removeClass("ui-state-active"); }
                else { $(this).addClass("ui-state-active"); }    
        })
        .mouseup(function(){
            if(! $(this).is('.fg-button-toggleable, .fg-buttonset-single .fg-button,  .fg-buttonset-multi .fg-button') ){
                $(this).removeClass("ui-state-active");
            }
        });
        //mra.imageBar.init(); 
        //TODO move this to the portlet class
        //mra.timer.init(); 
		mra.customize.init();
        /* This is the actual binding to the popupAdd container that decides what to do based on what is clicked */
        $("button[name=btnColumn]").bind("click",function(){
            (this.value == 3) ? settings.imageBar.addButton(selectedReddit) : mra.news.loadNewSection(selectedReddit,this.value);
            settings.preferences.save();
            mra.locationPicker.hide();
        }); 
    },
    jsonpRequest: function(url){
        var script = document.createElement("script"); 
        script.setAttribute("type","text/javascript"); 
        script.setAttribute("src",url);
        document.body.appendChild(script);
    },
    fetchContentFromRemote: function(callback, subReddit, limit, start, useBackup){
        if (typeof start == "undefined") start = 0;
            reqURL = redditURL + "/r/" + decodeURIComponent(subReddit) + "/.json?&limit=" + parseInt(limit + start);    
        
        $.ajax({
                type: 'GET',
                url: reqURL, 
                dataType: 'jsonp',
                jsonp: 'jsonp',
                timeout: 20000, // 2 seconds timeout
                success: function(data){
                    arrData = mra.cleanData(data);
                    if (arrData.length == 0){
                        (subReddit in mra.news) ? mra.news[subReddit]++ : mra.news[subReddit] = 0;
                        (mra.news[subReddit] < 5) ? mra.fetchContentFromRemote(callback,subReddit,limit,start, 1) : callback([]);
                    } else {
                        callback(arrData);
                    }
                },
                error: function(){
                    var $portlet = $("div.portlet[title="+subReddit+"]");
                    $portlet.find("div.loader").hide()
                    callback([]);
                    if (confirm(subReddit + " appears not to be loading, would you like to delete it?")){
                        // TODO: fix, this will crash.. for now
                        mra.news.deleteReddit($portlet);
                    }
                }
            }
        );
    },
    cleanData: function(data){
        var arrData = [];
        data.data.children.sort(function(a,b){
            return b.data.created - a.data.created;
        }); 
        for (i in data.data.children){
            arrData.push(data.data.children[i].data);
        }

        return arrData;
    },
    timer: {
        init: function(){
            mra.timer.countMins = 0;
            setInterval(mra.timer.addTime,1000 * 60); 
        }, 
        addTime: function(){ 
            mra.timer.countMins = mra.timer.countMins + 1;
            if (mra.timer.countMins % 15 == 0){ 
                mra.fetchContentFromRemote(function(arrItems){
                    arrPics = arrItems;
                    mra.imageBar.loadMoreImages();
                }, mra.imageBar.currentImageBar, 100);
            }
        }
    },
	customize: {
		wallpaperIndex: 0,	
		wallpapers: [
				"images/spacestorm.jpg",
				"http://www.dinpattern.com/tiles/prestige-COD.gif",
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
		],
		init: function(){
			$('#colorSelector').ColorPicker({
				color: '#0000ff',
				onShow: function (colpkr) {
					$(colpkr).fadeIn(500);
					return false;
				},
				onHide: function (colpkr) {
					$(colpkr).fadeOut(500);
					settings.setBackgroundColor(jQuery('#colorSelector div').css('backgroundColor'));
					settings.preferences.save();
					return false;
				},
				onChange: function (hsb, hex, rgb) {
					$('#colorSelector div').css('backgroundColor', '#' + hex);                              
					$('body').css({"background-color":'#' + hex, "background-image":"none" });
				}
			});
			$( "#customizeDialog" ).draggable({ handle: "#customizeHeader" });
 	
		},
		nextWallpaper: function(){ 
			mra.customize.wallpaperIndex++
			if (mra.customize.wallpaperIndex > (mra.customize.wallpapers.length - 1))
				mra.customize.wallpaperIndex = 0;  
			mra.customize.saveWallpaper();
		},
		prevWallpaper: function(){ 
			mra.customize.wallpaperIndex--
			if (mra.customize.wallpaperIndex < 0)
				mra.customize.wallpaperIndex = (mra.customize.wallpapers.length - 1);
			mra.customize.saveWallpaper();	
		},
		saveWallpaper: function(){
			settings.saveBackgroundImage(mra.customize.wallpapers[mra.customize.wallpaperIndex]); 
		},
		closeDialog: function(){
			jQuery('#customizeDialog').fadeOut();
			mra.locationPicker.hide();
		}

	},
    locationPicker: {
        /*this is the little popup you see when you click on meta and customize this so u can pick 1|2|3|image*/
        passEvent: function(evt){
            var curObj = $(evt.target); 
            mra.locationPicker.show( curObj, curObj.attr("id").split("_")[1] );
        },
        show: function(obj, sectionName){
            if (sectionName != ''){  
                selectedReddit = sectionName; 
                $("#popupAdd").fadeIn().position({
                    of: obj,
                    my: "right top",
                    at: "left bottom",
                    offset: 0, 
                    collision: "flip flip"
                });
            }   
        },
        hide: function(){
            $("#popupAdd").fadeOut();
            selectedReddit = "";
        }
    },
    news: {   
        loadNewSection: function(curReddit, column){
            currentColumnSelected = (typeof column == "undefined") ? $("[name=btnColumn].ui-state-active").val() : column;
            settings.subreddits.addPortlet(curReddit);
        },
    }, 
    imageBar: { 
        init: function(){ 
            mra.imageBar.lbHasInit = 0;
            mra.imageBar.currentImageBar = settings.getImageBarNames()[0]; 
            mra.fetchContentFromRemote(function(arrItems){
                mra.imageBar.processItems(arrItems,mra.imageBar.currentImageBar);
            }, mra.imageBar.currentImageBar, 100); 
        },
        loadMeta: function(metaSection){
			sql = "select * from html where url=\"http://metareddit.com/reddits/" + metaSection + "/list\" and xpath='//*[@class=\"subreddit\"]'";
			reqURL = "http://query.yahooapis.com/v1/public/yql?format=json&callback=mra.imageBar.processMeta&q=" + escape(sql);
			mra.jsonpRequest(reqURL);    
        },
        processMeta: function(data){ 
			if (data.query.count > 0)
            settings.metaReddits(
                jQuery.map(data.query.results.a,function(o,i){
                    return { NAME: o.content, SECTION: o.href.split('/')[2] };
                })
            );
        },
        viewComments: function(){
            mra.imageBar.popupWindow(
                $("a[rel^='prettyPhoto'] img[src='" + $("img.cboxPhoto").attr('src') + "']").parent().attr("commentLink")
            );
        },
        changePic: function(evt){
            $(".ad-gallery").hide();
            $(".ad-gallery-loading").show();
            mra.imageBar.currentImageBar = evt;
            mra.fetchContentFromRemote(function(arrItems){
                mra.imageBar.processItems(arrItems,mra.imageBar.currentImageBar);
            }, mra.imageBar.currentImageBar, 100);
        },
        removeImageBar: function(evt){
            $(evt).parent().fadeOut()
            settings.removeImageBar(evt.target.id); 
        }, 
        popupWindow: function(href){
             window.open(href, '_blank');
        },
        filterElements: function(arrElems){
            var regex = new RegExp("(.*?)\.(jpg|jpeg|png|gif)$");
            var sElements = "";
            var filtered = [];
            for (i in arrElems){
                var pic = arrElems[i];
                pic.permalink = redditURL + pic.permalink;
                if (pic.url != ''){
                    if (  pic.url.indexOf("http://imgur.com/") >= 0 ){
                         pic.url = pic.url + ".jpg";
                    }
                    if (regex.exec( pic.url )){
                        settings.images.push(pic); 
                    }
                    else {
                        mra.imageBar.getHeaders(pic);
                    }
                }
            } 
        },
        getHeaders: function(a){
			//TODO recreate <execute> tag for the missing javascript.xml file
			return;
            var curPic = a;
            var sql = "USE 'http://javarants.com/yql/javascript.xml' AS j;\
                               select content-type from j where code='response.object = y.rest(\"" + curPic.url + "\").followRedirects(false).get().headers';";
            var reqURL = "http://query.yahooapis.com/v1/public/yql?format=json&q=" + escape(sql);
            $.ajax({
                    type: 'GET',
                    url: reqURL, 
                    dataType: 'jsonp',
                    success: function(data){
                        try {
                            if (data.query.results.result['content-type'].indexOf("image") >= 0){                         
                                settings.images.push(curPic);
                                settings.sortImagesByDate();
                            } 
                        }catch(e){}    
                    }
                }
            );
        },
        contextOnClick: function(Sender, EventArgs){
                el = mra.imageBar.currentImageContext.currentTarget.childNodes[1];
                var action = EventArgs.CommandName;
                if (action == 'comments'){
                    mra.imageBar.popupWindow($(el).attr('commentlink'));
                }
                if (action == 'image'){
                    mra.imageBar.popupWindow($(el).attr('href'));
                }
                if (action == 'source'){
                    mra.imageBar.popupWindow("http://www.tineye.com/search/?url=" + $(el).attr('href'));
                }
                if (action == 'analyze'){
                    mra.imageBar.popupWindow("analyze.cfm?imgURL=" + $(el).attr('href'));
                } 
        },
        applyContextMenu: function(){
            window.oCustomContextMenu = null;
			window.oBase = document.getElementById('div');

            var Arguments = {
                Base: oBase,
                Width: 160,
                FontColor: "white",
                HoverFontColor: "black",
                HoverBackgroundColor: "#222",
                HoverBorderColor: null,
                ClickEventListener: mra.imageBar.contextOnClick
            };
    
             oCustomContextMenu = new CustomContextMenu(Arguments); 
             
             oCustomContextMenu.AddItem('images/fileTypes/comments.png', 'View Comments', false, 'comments');
             oCustomContextMenu.AddSeparatorItem();
             oCustomContextMenu.AddItem('images/fileTypes/image_link.png', 'View Image', false, 'image');
             oCustomContextMenu.AddSeparatorItem();
             oCustomContextMenu.AddItem('images/fileTypes/link.png', 'Find Source', false, 'source');
             oCustomContextMenu.AddSeparatorItem();
             oCustomContextMenu.AddItem('images/fileTypes/link.png', 'Error Analyze', false, 'analyze');
             oCustomContextMenu.AddSeparatorItem();
             oCustomContextMenu.AddItem('images/fileTypes/link.png', 'Copy To Share', false, 'copy');
    
            $("ul.ad-thumb-list li").bind('contextmenu',function(e){
                mra.imageBar.currentImageContext = e;
                return oCustomContextMenu.Display(e);
            });    
            
        },
        /* This is the main module that inits the image overlay for the imageBar*/
        applyLightBox: function(){
            $("#container div.ad-gallery a").colorbox({ 
                maxHeight: function(){ return (window.innerHeight * 0.9) }, 
                maxWidth: function(){ return (window.innerWidth * 0.9) },
                onComplete:function(){ 
                    var largeMode = $("img.cboxPhoto").width() > 400;
                    $("#cboxCurrent span").toggle(largeMode);
                    if (!largeMode){
                        $.colorbox.resize({ width: 400 })
                    }
                    $("#cboxTitle").show();
                    mra.imageBar.clipboard.addCopy(document.getElementById('copyLink2'));
                    $("iframe").attr("src",$("img.cboxPhoto").attr("src"));
                }, 
                onLoad: function(){
                    mra.imageBar.loadMoreImages();
                    $("#cboxTitle").show();
                },
                transition: "elastic",
                opacity: 0.7,
                preloading: false,
                current: function(){ 
                    var comment = '<img src="images/fileTypes/comments.png" align="absmiddle" width="16" height="16"><span>View Comments</span>';    
                    var image = '<img src="images/fileTypes/image_link.png" align="absmiddle" width="16" height="16"><span>New Tab</span>';
                    var cts = '<img src="images/fileTypes/link.png" align="absmiddle" width="16" height="16"><span>Copy To Share</span>';
                    var markup = '<a href="'+ $(this).attr('commentLink') + '" onclick="mra.imageBar.viewComments(); return false;" class="cufonize">' + comment + '</a>\
                    | <a href="' + this.href + '" onclick="mra.imageBar.popupWindow($(\'img.cboxPhoto\').attr(\'src\')); return false;" class="cufonize">' + image + '</a>\
                    | <a id="copyLink2" title="' + this.title + '" href="' + this.href + '" onclick="return false;" class="cufonize copyLink2">' + cts + '</a>'; /**/
                    return markup;
                },
                slideshow: true,
                slideshowAuto: false,
                slideshowSpeed: function(){ return 2000 + (this.title.length * 50) }
            });
        },
        loadMoreImages: function(){
            if (arrPics.length > 0){
                $.each(arrPics.splice(0,10),function(i,o){
                    if ($("#" + o.id).length == 0)
                    settings.images.unshift(o)  
                });
                
                isLoading = false;
                setTimeout(function(){
                    if (isLoading == false){
                        adGallery.findImages()
                        mra.imageBar.applyLightBox();
                    }
                    isLoading = true;
                },1000);                    
            } 
        },
        /* this initializes the copy to share functionality for the overlay */
		clipboard: {
			init: function(){
				mra.imageBar.clipboard.curObj = "";
				$("#cboxContent").hover(
					function(){
						$("#cboxTitle").stop(true).fadeTo("normal",0); 
					},
					function(){  
						$("#cboxTitle").stop(true).fadeTo("normal",0.85); 
					}
				);
				$("#cboxTopRight").html('<img src="images/maximize.png" onclick="mra.imageBar.fullscreenLightbox()">');        
				ZeroClipboard.setMoviePath( 'ZeroClipboard.swf' );
				//ZeroClipboard is a flash plugin that lets you put text into the user's clipboard
				clip = new ZeroClipboard.Client();
				clip.setHandCursor( true );
				clip.addEventListener( 'onComplete', function() { afterCopy() } );				
			},
			after: function(){
				 $("#"+mra.imageBar.clipboard.curObj).html('copied');
			},
			reposition: function(elem){
				clip.setText( elem.title + ": " + elem.href );
				jQuery(clip.div).topZIndex();
				clip.receiveEvent('mouseout', null);
				clip.reposition(elem);  
			},
			//this function is there because the onmouseover event gets removed every time the picture changes
			addCopy: function(obj){
				obj.onmouseover = function(){
					mra.imageBar.clipboard.curObj=this.id;
					if (clip.div) {
						mra.imageBar.clipboard.reposition(this);
					}
					else clip.glue(this);
					clip.receiveEvent('mouseover', null);
				}
			}
		}, 
        fullscreenLightbox: function(){
            var i = new Image();
            i.onload = function(){
                $.colorbox.resize({ innerWidth: this.width, innerHeight: this.height });
                $(".cboxPhoto").css({ 'width': this.width, 'height': this.height })
            };
            i.src = $.colorbox.element().children().attr('src')
        },
        processItems: function(pics, subReddit){ 
            var sImageBar = "";  
            window.arrPics = pics;
            $(".ad-gallery").show();
            $(".ad-gallery-loading").hide(); 
            settings.images.removeAll(); 
            mra.imageBar.filterElements(pics);    
            window.adGallery = $("div.ad-gallery")    
                .attr("id", "imagebar_" + mra.imageBar.currentImageBar)
                .adGallery({
                  loader_image: 'images/ajax-loader_images.gif',
                  width: false, // Width of the image, set to false and it will read the CSS width
                  height: 150, // Height of the image, set to false and it will read the CSS height
                  thumb_opacity: 0.7, // Opacity that the thumbs fades to/from, (1 removes fade effect)
                                      // Note that this effect combined with other effects might be resource intensive
                                      // and make animations lag
                  start_at_index: 0, // Which image should be displayed at first? 0 is the first image
                  start_at_pixel: 0, //curPos, // Which image should be displayed at first? 0 is the first image
                  description_wrapper: false, // Either false or a jQuery object, if you want the image descriptions
                                                           // to be placed somewhere else than on top of the image
                  animate_first_image: false, // Should first image just be displayed, or animated in?
                  animation_speed: 400, // Which ever effect is used to switch images, how long should it take?
                  display_next_and_prev: true, // Can you navigate by clicking on the left/right on the image?
                  display_back_and_forward: true, // Are you allowed to scroll the thumb list?
                  scroll_jump: (window.innerWidth / 2), // If 0, it jumps the width of the container
                  slideshow: {
                    enable: false,
                    autostart: false,
                    speed: 5000,
                    start_label: 'Start',
                    stop_label: 'Stop',
                    stop_on_scroll: true, // Should the slideshow stop if the user scrolls the thumb list?
                    countdown_prefix: '(', // Wrap around the countdown
                    countdown_sufix: ')'
                  },
				effect: 'slide-hori', // or 'slide-vert', 'resize', 'fade', 'none' or false
				enable_keyboard_move: false, // Move to next/previous image with keyboard arrows?
				cycle: true // If set to false, you can't go from the last image to the first, and vice versa,
			});
            window.adGallery = window.adGallery[0];    
            document.addEventListener('touchmove', function(e){ e.preventDefault(); });
            myScroll = new iScroll($('.ad-thumb-list')[0], { desktopCompatibility: true, vScrollbar:false });
            mra.imageBar.applyLightBox();
            mra.imageBar.applyContextMenu();
            mra.imageBar.clipboard.init();
            setTimeout(function(){ window.imageLoader = setInterval(mra.imageBar.loadMoreImages,1000 * 10);  },1000 * 10);

        }
    }
}
$(document).ready(mra.init);