if (typeof console == "undefined")
    console = { log: function(){} };

myVar = true;

/*
 * Setting wrapper
 * - handles all the that needs to persist
 */
var settings = new (function(){
    // default cookie settings
    var BACKGROUND_COLOR = null;
    var BACKGROUND_IMAGE = "image/spacestorm.jpg";
    var SUBREDDITS = ["Gadgets", "Funny", "Reddit.com", "Javascript","WTF","Programming"];
    var SUBREDDIT_ITEMS = 10;
    var IMAGE_BAR = ["Pics","WTF","NSFW","Funny"];
    
    var BASE_URL = "http://www.reddit.com";
    
    // note: this gets overwritten when load() is ran with the current cookie settings
    this.activeSettings = {
        background: {
            color: ko.observable(null),
            image: ko.observable("images/spacestorm.jpg")
        },
        // TODO: Make sure page continues to load if an invalid one is entered
        subreddits: [], //new SubReddits("Gadgets", "Funny", "Reddit.com", "Javascript","WTF","Programming"),
        visited_news: ko.observableArray([]),
    };
    
	this.imageBar = ko.observable({}),
	this.images = ko.observableArray();
	this.activeImage = function(){
		return this.images()[this.activeImageIndex()];
	};
	this.activeImageIndex = ko.observable(0);
	this.newsItemsVisible = ko.observable({});
	this.isNewsItemVisible = ko.observable(myVar);
    this.metaReddits = ko.observableArray();
     
    this.init = function(){
        // initialize complex object
        this.preferences = new this.preferences(this);
        this.subreddits = new this.subreddits();
        
        this.preferences.load();
		ko.applyBindings(this);
		Cufon.refresh();
    };
    
    // TODO: needs to be inside the image object once its created
    this.showMoreMode = ko.dependentObservable(function(){
        return this.imageBar().length > 4;
    }, this);
    
    // getters
    this.getBackgroundColor = function(color){
        return this.activeSettings['background']['color']();
    };
    this.getBackgroundImage = function(){
        return this.activeSettings['background']['image']();
    };
    this.getSubreddits = function(){
        return this.subreddits;
    };
    this.getImageBar = function(newo){
        return $.map(this.imageBar(), function(i,o){
		    return ({"NAME": o, "SECTION": o});
		});;
    };
    
    // adders
    this.addSubreddit = function(column, subreddit){
        this.activeSettings['subreddits']()[column].push(subreddit);
    };
    this.addImageBar = function(subreddit){
        this.imageBar()[subreddit] = ko.observableArray();
    };
    
    // removers
    this.removeSubreddit = function(column, subreddit){
        this.activeSettings['subreddits']()[column].remove(subreddit);
    };
	
	this.removeImageBar = function(subreddit){
		this.imageBar.remove(subreddit);	 
	};
    
    // setters
    this.setBackgroundColor = function(color){
        this.activeSettings['background']['color'](color);
        this.activeSettings['background']['image'](null);
    },
    this.setBackgroundImage = function(image){
        this.activeSettings['background']['color'](null);
        this.activeSettings['background']['image'](image);
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
            data.data.children.sort(function(a,b){
                return b.data.created - a.data.created;
            }); 
            for (i in data.data.children){
                arrData.push(data.data.children[i].data);
            }
            
            return arrData;
        };
        
        /*
         * Calls the next request
         */
        var nextCall = function(){
            // if active connections is above the maximun threshold skip
            // if the queue is empty skip
            if(activeConnections.length > MAX_CONNECTIONS || queued.length == 0)
                return;
            
            // get the first request from the queue and make the request again
            var request = queued.shift();
            this.call(request['url'], request['callback']);
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
                url: url + "/.json?&limit=100",
                dataType: 'jsonp',
                jsonp: 'jsonp',
                timeout: 20000, // 2 seconds timeout
                success: function(data){
                    var redditData = cleanData(data);
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
        
        return this;
    })();
    
    /*
     * Houses all the portlets (subreddits)
     * - needs to be initialized
     */
    this.subreddits = function(){
        // private variables
        var SubReddits = this;
        var portlets = ko.observableArray();
        var NEWS_BUTTONS = ['hot','new','controversial','top'];
        
        // private class (individual portlets)
        var Portlet = function(name){
            var newsItems = ko.observableArray();
            var portlet = this;
            var minimized = ko.observable(false);
            
            var load = function(section){
				// undefined is not inherent like null, it has to be checked with typeof
                var url = this.url + ((typeof section == "undefined")? "" : "/" + section);
                
                newsItems.removeAll();
                
                // load the complete feed
                loader.call(url, function(data){
                    for(var index in data){
                        newsItems.push(new NewsItem(data[index]));
                    }
                }.bind(this));
            }.bind(this);
            
            var NewsItem = function(item){
                this.id = item['id'],
                this.title = item['title'];
                this.text = item['title'].substring(0, 100);
                this.url = BASE_URL + "/tb/" + item['id'];
                this.score =  parseInt((item['ups'] / (item['downs'] + item['ups'])) * 100) + "%";
                this.scoreTitle = item['score'] + "  of People Like It";
                this.permalink = BASE_URL + item['permalink'];
                
                /*
                 * Observable that checks whether or not the link is visible
                 */
                this.isVisible = ko.dependentObservable(function(){
                    // TODO: remove the settings reference
                    // checks the the link to see if its been visited, or if all the news items are visible
                    return settings.activeSettings.visited_news.indexOf(this.id) == -1 || settings.isNewsItemVisible();
                });
                
                /*
                 * Marks the page as seem/visited
                 */
                this.visitPage = function(evt){
                    setTimeout(function(){
                            // TODO: this needs to GO
                            settings.activeSettings.visited_news.push(this.id);
                            settings.preferences.save();
                        }, 2*60*1000
                    );
                    
                    $(evt.target).parent().fadeOut(2500);
                    
                    return true;
                };
                
                return this;
            };
            
            this.buttons = new (function(){
                var activeButton = ko.observable('top');
                
                // public constants
                this.NEWS_BUTTONS = NEWS_BUTTONS;
                
                this.getActiveButton = function(){
                    return activeButton();
                };
                
                this.reloadSection = function(i,e,o){
                    var button = $(i.target).attr("rel");
                    
                    // reset the amount visible back to 10 news stories..
                    portlet.amountVisible(10);
                    
                    activeButton(button);
                    load(button);
                };
                
                return this;
            })();
            
            // attributes
            this.name = name;
            this.url = BASE_URL + "/r/" + decodeURIComponent(name);
            this.amountVisible = ko.observable(10);

			this.getNewsItems = function(){
				return ko.utils.arrayFilter(newsItems(), function(newsItem){
					return newsItem.isVisible() ? newsItem: null;
				}).slice(0,this.amountVisible());
			}
            
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
                minimized(Boolean(minimized() ^ true));
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
				this.amountVisible(this.amountVisible()+10);
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
            
            return this;
        };
        
        /*
         * Adds a new portlet to the DOM
         * @portlet string name of the subreddit
         */
        this.addPortlet = function(portlet){
            if(portlet.push){
                for(var index in portlet)
                    this.addPortlet(portlet[index]);
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
        for(var index in arguments)
            this.addPortlet(arguments[index]);
        
        return this;
    };
    
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
            if(cookie == undefined || cookie == "") return;
            
            // loop over all the cookies
            for(var i in rawCookies){
                rawCookieData = rawCookies[i].split("=");
                
                // if the cookie name matches return the value of the cookie [escaped]
                if(rawCookieData[0].replace(/(^\s+|\s+$)/g, "") == cookie)
                    return unescape(rawCookieData[1]);
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
                this.activeSettings['background']['color'](settings['background']['color']);
                this.activeSettings['background']['image'](settings['background']['image']);
                
                this.getSubreddits().removeAllPortlets();
                settings['subreddits'].map(function(item){
                    this.getSubreddits().addPortlet(item);
                }.bind(this));
				
                //Populate the cookie variable into the settings.imageBar variable
				$.each(settings['imageBar'],function(i,o){
					this.addImageBar(o);
				}.bind(this));
            } else {
                // load default subreddits
                this.getSubreddits().addPortlet(SUBREDDITS);
                
				$.each(IMAGE_BAR,function(i,o){
					this.addImageBar(o);
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
        
        return this;
    };
    
    this.toString = function(){
        return ko.toJSON({
            background: {
                color: this.getBackgroundColor(),
                image: this.getBackgroundImage()
            },
            subreddits: this.getSubreddits().toStringArray(),
            imageBar: $.map(ko.toJS(settings.imageBar()), function(o,i){ return i; }),
            visitedNews: ko.toJSON(this.activeSettings.visited_news)
        });
    };
    
    return this
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
                
                Cufon.refresh();
            }
        });
    }
};

$(document).ready(function(){
    settings.init();
    // $("#newsSection").sortable().disableSelection();
});
	
var wallpaperIndex = 0;
var currentLayout = settings.getSubreddits();
var currentImageBar = settings.getImageBar();
var redditURL = "http://www.reddit.com";
var oCustomContextMenu = null;
var oBase = null; 
var doAppend = true;
var baseurl = "http://www.reddit.com";	
var weburl = "http://myredditall.com/";
var arrWallpapers = [
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
]; 

function nextWallpaper(){ 
    wallpaperIndex++
    if (wallpaperIndex > (arrWallpapers.length - 1))
        wallpaperIndex = 0;  
    settings.saveBackgroundImage(arrWallpapers[wallpaperIndex]); 
}
function prevWallpaper(){ 
    wallpaperIndex--
    if (wallpaperIndex < 0)
        wallpaperIndex = (arrWallpapers.length - 1);
    settings.saveBackgroundImage(arrWallpapers[wallpaperIndex]); 
}

function left(str,count){
    return String(str).substring(0,count);
}
 
function customizeLayout(){
     jQuery('#customizeDialog').fadeIn();
      if (document.images)
    {
      preload_image_object = new Image();
        
       for(i=0; i<=arrWallpapers.length-1; i++) 
         preload_image_object.src = arrWallpapers[i];
    }
}

function closeCustomize(){
    jQuery('#customizeDialog').fadeOut();
    mra.locationPicker.hide();
}
 

function afterCopy(btn){
    $("#"+clip_curr).html('copied');
}
function repositionCopy(elem){ 
    clip.setText( elem.title + ": " + elem.href );
    jQuery(clip.div).topZIndex();
    clip.receiveEvent('mouseout', null);
    clip.reposition(elem);    
}

function copyToShare(el){
    mra.currentComment = el.title + ": " + el.href;
	$("#copyLink2").zclip({
		path:'ZeroClipboard.swf',
		copy:function(){
			return mra.currentComment;
		}
	});
	$("#imageMenu").destroyContextMenu()
}

var mra = {
    init: function(){
		currentImageBar = settings.getImageBar();
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
			
        //mra.loaderImage = $("<img src='images/ajaxLoader.gif' width='126' height='22' align='middle'>");
        mra.news.init();
        mra.imageBar.init();
        mra.timer.init(); 

        $("button[name=btnColumn]").bind("click",function(){
            (this.value == 3) ? settings.addImageBar(selectedReddit) : mra.news.loadNewSection(selectedReddit,this.value);
			settings.preferences.save();
            mra.locationPicker.hide();
        }); 
		
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
        $( "#customizeDialog" ).draggable({ handle: "#customizeHeader" })    
    },
    debug: {
        init: function(){ 
            time.errors = true;
            time.setLineReportMethod(mra.debug.report);
        },
        report: function(s){
        }
    },
    jsonpRequest: function(url){
        var script = document.createElement("script"); 
        script.setAttribute("type","text/javascript"); 
        script.setAttribute("src",url);
        document.body.appendChild(script);
    },
    fetchContentFromRemote: function(callback, subReddit, limit, start, useBackup){
        if (typeof start == "undefined") start = 0;
        /*if (typeof useBackup == "undefined")
            reqURL = weburl + "fetchContent.cfm?r=" + decodeURIComponent(subReddit) + "&limit=" + parseInt(limit + start);
        else*/     
            reqURL = baseurl + "/r/" + decodeURIComponent(subReddit) + "/.json?&limit=" + parseInt(limit + start);    
		
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
	locationPicker: {
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
        totalIndex: 0,
        totalItems: 100, //maximum limit imposed by reddit
        init: function(){
            mra.news.portlets = $("#newsSection .portlet");    
    		mra.news.columns = $("div.column");
        }, 
		togglePortlet: function(evt){ 
			$(evt.target).toggleClass('ui-icon-minusthick').toggleClass('ui-icon-plusthick'); 
			$(evt.target).parents('.portlet:first').find('.portlet-content').toggle(); 
		},
		
        loadNewSection: function(curReddit, column){
		    currentColumnSelected = (typeof column == "undefined") ? $("[name=btnColumn].ui-state-active").val() : column;
			settings.addSubreddit(column,curReddit);
            Cufon.refresh();
            mra.news.portlets = $("#newsSection .portlet");
            mra.fetchContentFromRemote(function(arrItems){
                mra.news.addItemsToView(arrItems,curReddit);
            }, curReddit, mra.news.totalItems);
        },
    }, 
    imageBar: { 
        init: function(){ 
            mra.imageBar.lbHasInit = 0;
            mra.imageBar.currentImageBar = "Pics"; 
            mra.fetchContentFromRemote(function(arrItems){
                mra.imageBar.processItems(arrItems,mra.imageBar.currentImageBar);
            }, mra.imageBar.currentImageBar, 100); 
    
            mra.imageBar.oDialog = $("#metaRedditDialog").dialog({
                title: "MetaReddit",
                width: 900,
                height: 400,
                autoOpen: false
            });
    
            mra.imageBar.loadMeta('Favorites'); 
        },
        loadMeta: function(metaSection){
            if (metaSection == 'Favorites'){
                settings.metaReddits(currentImageBar);
            }
            else {
                sql = "select * from html where url=\"http://metareddit.com/reddits/" + metaSection + "/list\" and xpath='//*[@class=\"subreddit\"]'";
                reqURL = "http://query.yahooapis.com/v1/public/yql?format=json&callback=mra.imageBar.processMeta&q=" + escape(sql);
                mra.jsonpRequest(reqURL);    
            } 
        },
        processMeta: function(data){ 
            settings.metaReddits(
                jQuery.map(data.query.results.a,function(o,i){
                    return { NAME: o.content, SECTION: o.href.split('/')[2] };
                })
            );
        },
        showMore: function(){
			morePos = jQuery("#showMore").position(); 
			$("#showMoreList")
				.css({ "position": "absolute", "top": (morePos.top + 31) })
				.css({ left: (morePos.left + 32) - $("#showMoreList").width() })
				.toggle();
        },
        viewComments: function(){
            mra.imageBar.popupWindow(
                $("a[rel^='prettyPhoto'] img[src='" + $("img.cboxPhoto").attr('src') + "']").parent().attr("commentLink")
            );
        },
        changePic: function(evt){
            $(".ad-gallery").hide();
            $(".ad-gallery-loading").show();
            //$(".ad-controls").html(""); 
            if (typeof evt == "object" && typeof evt.currentTarget != "undefined")   
                mra.imageBar.currentImageBar = (evt.currentTarget.id.split("_")[1] || evt.currentTarget.id);  
            else if (typeof evt == "string")
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
						//filtered.push(pic);	
                        //sElements += mra.imageBar.makeHTML(pic);
                    }
                    else {
                        mra.imageBar.getHeaders(pic);
                    }
                }
            }
            //return filtered;
        },
        getHeaders: function(a){
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
                if (action == 'copy'){
            
                }
        
                // oCustomContextMenu.Hide();   
        },
        applyContextMenu: function(){
            oBase = document.getElementById('div');

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
			
            Cufon.refresh();
        },
        applyLightBox: function(){
            $("#container div.ad-gallery a").colorbox({ 
                maxHeight: function(){ return (window.innerHeight * 0.9) }, 
                maxWidth: function(){ return (window.innerWidth * 0.9) },
                onComplete:function(){ 
                    Cufon.refresh() 
                    var largeMode = $("img.cboxPhoto").width() > 400;
                    $("#cboxCurrent span").toggle(largeMode);
                    if (!largeMode){
                        $.colorbox.resize({ width: 400 })
                    }
                    $("#cboxTitle").show();
                    mra.imageBar.addClipboardCopy(document.getElementById('copyLink2'));
                    if (mra.imageBar.lbHasInit == 0)
                        mra.imageBar.initLightbox();
                    repositionCopy(document.getElementById('copyLink2'));
                    $("<iframe>").attr("src",$("img.cboxPhoto").attr("src")).appendTo("body").bind("load", function(){ $(this).remove() });
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
        initLightbox: function(){
            $("#cboxContent").hover(
                function(){
                    $("#cboxTitle").stop(true).fadeTo("normal",0); 
                },
                function(){  
                    $("#cboxTitle").stop(true).fadeTo("normal",0.85); 
                }
            );
            $("#cboxTopRight").html('<img src="images/maximize.png" onclick="mra.imageBar.fullscreenLightbox()">');        
            mra.imageBar.lbHasInit = 1;    
    
            ZeroClipboard.setMoviePath( 'ZeroClipboard.swf' );
            clip = new ZeroClipboard.Client();
            clip.setHandCursor( true );
            clip.addEventListener( 'onComplete', function() { afterCopy() } );
            clip_curr='';
        },
        addClipboardCopy: function(obj){
            obj.onmouseover = function(){
                clip_curr=this.id;
                if (clip.div) {
                    repositionCopy(this);
                }
                else clip.glue(this);
                clip.receiveEvent('mouseover', null);
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
			
            /*sImageBar = sImageBar + mra.imageBar.createElements(arrPics.splice(0,15)); 
            $("ul.ad-thumb-list").html(sImageBar);
    
            
    		*/
			
			settings.images.removeAll(); 
			mra.imageBar.filterElements(pics); 
					
			
            //var catOnDom  = ($("div.ad-gallery").attr('id') != '') ? $("div.ad-gallery").attr('id').split('_')[1] : "";
            //var curPos = (catOnDom == "") ? 0 : adGallery.thumbs_wrapper.scrollLeft();    
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
    
            mra.imageBar.applyLightBox();
            mra.imageBar.applyContextMenu();
            //adGallery.thumbs_wrapper.scrollLeft(curPos);

        }
    }
}

function saveSettings(){
    $.ajax({
        url: "/saveSettings.cfm",
        data: {
            layout: encodeURIComponent(JSON.stringify(currentLayout)),
            imagebar: encodeURIComponent(JSON.stringify(currentImageBar)), 
            saveName: $('input[name=saveName]').val()
        },
        success: function(response){
            location.href = $.parseJSON(response).directory;
        }
    })
}

$(document).ready(mra.init);