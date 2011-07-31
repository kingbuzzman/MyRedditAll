if (typeof console == "undefined")
    console = { log: function(){} };
	
/*
 * Setting wrapper
 * - handles all the that needs to persist
 */
var settings = {
    COOKIE_NAME: "settings",
    COOKEY_EXPIRATION: (new Date((new Date()).getTime() + 999*24*60*60*1000)).toGMTString(),
    
    // default cookie settings
    // note: this gets overwritten when load() is ran with the current cookie settings
    activeSettings: {
        background: {
            color: ko.observable(null),
            image: ko.observable("images/spacestorm.jpg")
        },
        subreddits: ko.observableArray([
            ko.observableArray(["Gadgets","Funny"]),
            ko.observableArray(["Atheism","Javascript"]),
            ko.observableArray(["WTF","Programming"])
        ]),
        imageBar: ko.observableArray(["Pics","WTF","NSFW","Funny"])
    },

	images: ko.observableArray(),
    arrMetaReddits: ko.observableArray(),
    
    init: function(){
        // initialize preferences's complex object
        settings.preferences = settings.preferences();
        ko.applyBindings(settings);
        settings.preferences.load();
		Cufon.refresh();
    },
    
    // getters
    getBackgroundColor: function(color){
        return this.activeSettings['background']['color']();
    },
    getBackgroundImage: function(){
        return this.activeSettings['background']['image']();
    },
    getSubreddits: function(){
        return this.activeSettings['subreddits']();
    },
    getImageBar: function(newo){
        if(newo == undefined){
            // TODO: delete bellow (ASAP)
            var imageBar = [];
            $.each(this.activeSettings['imageBar'](), function(){
                imageBar.push({"NAME": this, "SECTION": this});
            });
            return imageBar;
            // TODO: delete above (ASAP)
        }
        
        return this.activeSettings['imageBar']();
    },
    
    // adders
    addSubreddit: function(column, subreddit){
        this.activeSettings['subreddits']()[column].push(subreddit);
    },
    addImageBar: function(subreddit){
        this.activeSettings['imageBar'].push(subreddit);
    },
    
    // removers
    removeSubreddit: function(column, subreddit){
        this.activeSettings['subreddits']()[column].remove(subreddit);
    },
	
	removeImageBar: function(subreddit){
		this.activeSettings['imageBar'].remove(subreddit);	 
	},
    
    // setters
    setBackgroundColor: function(color){
        this.activeSettings['background']['color'](color);
        this.activeSettings['background']['image'](null);
    },
    setBackgroundImage: function(image){
        this.activeSettings['background']['color'](null);
        this.activeSettings['background']['image'](image);
    },
	
    // shortcuts
    saveBackgroundColor: function(color){
        this.setBackgroundColor(color);
        this.preferences.save();
    },
    saveBackgroundImage: function(image){
        this.setBackgroundImage(image);
        this.preferences.save();
    },
    
	deleteSubReddit: function(SubRedditTitle){
		for(i in settings.activeSettings.subreddits()) {
			for(b in settings.activeSettings.subreddits()[i]()){ 
				if(settings.activeSettings.subreddits()[i]()[b].toUpperCase() == SubRedditTitle.toUpperCase()){
					settings.activeSettings.subreddits()[i]().splice(b,1);   
				} 
			}
		}
		this.preferences.save();
	},
	
    preferences: function(){
        /*
         * Load all the current settings from the cookie
         */
        this.load = function(){
            var cookie = getCookieValue(this.COOKIE_NAME);
            var settings = {};
            
            if(cookie){
                settings = JSON.parse(cookie);
                this.activeSettings['background']['color'](settings['background']['color']);
                this.activeSettings['background']['image'](settings['background']['image']);
				
				this.activeSettings['subreddits'].removeAll(); 
				for(var i in settings['subreddits']){ 
					this.activeSettings['subreddits'].push(ko.observableArray(settings['subreddits'][i]));
				}
                
                this.activeSettings['imageBar'](settings['imageBar']);
            } else
                // there was no cookie set, save it.
                this.preferences.save();
        };
        
        /*
         * Erase the cookie cookie
         * - TODO: redirect ?
         */
        this.erase = function(){
            document.cookie = this.COOKIE_NAME + "=; expires=Sun, 02 Nov 2008 04:36:49 GMT; path=/";
        };
        
        /*
         * Save all the current settings into the cookie
         */
        this.save = function(){
            document.cookie = this.COOKIE_NAME + "=" + escape(this.toString()) + "; expires=" + this.COOKEY_EXPIRATION + "; path=/";
        };
        
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
        
        return this;
    },
    toString: function(){
        return ko.toJSON(this.activeSettings);
    }
};

settings.showMoreMode= ko.dependentObservable(function(){
	return this.activeSettings.imageBar().length > 4;	
},settings);

$(document).ready(settings.init);
	
var wallpaperIndex = 0;
var currentLayout = settings.getSubreddits();
var currentImageBar = settings.getImageBar();
var redditURL = "http://www.reddit.com";
var oCustomContextMenu = null;
var oBase = null; 
var doAppend = true;
var baseurl = "http://www.reddit.com";	
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
    closePopupAdd()
}

function popupAdd(curObj, curReddit){
    selectedReddit = curReddit;
    if (curReddit != ''){   
        $("#popupAdd").fadeIn().position({
            of: $( curObj ),
            my: "right top",
            at: "left bottom",
            offset: 0, 
            collision: "flip flip"
        });
    }
}
function closePopupAdd(){
    $("#popupAdd").fadeOut();
    selectedReddit = "";
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
		path:'/ZeroClipboard.swf',
		copy:function(){
			return mra.currentComment;
		}
	});
	$("#imageMenu").destroyContextMenu()
}

var mra = {
    init: function(){
		
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
			
        mra.loaderImage = $("<img src='images/ajaxLoader.gif' width='126' height='22' align='middle'>");
        mra.news.init();
        mra.imageBar.init();
        mra.timer.init(); 

        $("button[name=btnColumn]").bind("click",function(){
            (this.value == 3) ? settings.addImageBar(selectedReddit) : mra.news.loadNewSection(selectedReddit,this.value);
			settings.preferences.save();
            closePopupAdd();
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
            console.log(s);
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
            reqURL = "/fetchContent.cfm?r=" + decodeURIComponent(subReddit) + "&limit=" + parseInt(limit + start);
        else*/     
            reqURL = baseurl + "/r/" + decodeURIComponent(subReddit) + "/.json?&limit=" + parseInt(limit + start);    
        $.ajax({
                type: 'GET',
                url: reqURL, 
                dataType: 'jsonp',
                jsonp: 'jsonp',
                success: function(data){
                    arrData = mra.cleanData(data);
                    (arrData.length == 0) ? mra.fetchContentFromRemote(callback,subReddit,limit,start, 1) : callback(arrData);
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
                mra.news.totalIndex = mra.news.totalIndex + 1;
                if (mra.news.totalIndex <= (mra.news.portlets.length - 1)){ 
                    mra.news.loadNextFeed(); 
                    mra.fetchContentFromRemote(function(arrItems){
                        arrPics = arrItems;
                        doAppend = false;
                        setInterval(mra.imageBar.loadMoreImages,5000);  
                    }, mra.imageBar.currentImageBar, 100);
                }
                else {
                    mra.news.totalIndex = 0;    
                }
            }
        }
    },
    news: {
        totalIndex: 0,
        totalItems: 10,
        init: function(){
            mra.news.portlets = $("#newsSection .portlet");    
    
            $(".column").sortable({
                connectWith: '.column',
                stop: function(event, ui) { 
                    var arrColumns = new Array(1);
                    $(".column").each(function(i, o){
                        arrColumns[i] = new Array(1);
                        $(o).find('.portlet').each(function(ii, oo){
                            arrColumns[i][ii] = oo.title;
                        });
                    });
                    currentLayout = arrColumns; 
                }
            });                
            $("div.column").delegate("div.ui-icon-more","click",mra.news.loadMore);
            $("div.column").delegate("div.ui-icon-more","mouseover", function(evt){
                $(evt.currentTarget).find(".text").stop(true).fadeIn();
            });
            $("div.column").delegate("div.ui-icon-more","mouseout", function(evt){
                $(evt.currentTarget).find(".text").stop(true).fadeOut();
            });
            $("div.column").delegate(".portlet-header .ui-toggle-display","click",function() {
                $(this).toggleClass("ui-icon-minusthick").toggleClass("ui-icon-plusthick");
                $(this).parents(".portlet:first").find(".portlet-content").toggle();
            });
    
             $("div.column").delegate(".portlet-header .ui-close-display","click",function() {
                 if (confirm("Are you sure you want to delete this section?")){
                     $(this).parent().hide(1000, function(){
                         $(this).parent().remove();
                     }); 
                     settings.deleteSubReddit($(this).parent().parent().attr('title'));
					 settings.preferences.save();
                 }    
            });    

            $(".column").disableSelection();
    
            mra.news.loadNextFeed();
        }, 
        addCount: function(){
            mra.news.totalIndex = mra.news.totalIndex + 1;
            if (mra.news.totalIndex <= (mra.news.portlets.length - 1))
                mra.news.loadNextFeed();
        },
        loadMore: function(evt){
            currentCount = $(evt.currentTarget).prevAll().length;
            subReddit = $(evt.currentTarget).parent().parent().attr("Title");
            $('#newsSection .portlet[title=' + subReddit + '] .portlet-content').html("");
            mra.fetchContentFromRemote(function(arrItems){
                mra.news.addItemsToView(arrItems,subReddit);
            }, subReddit, mra.news.totalItems + currentCount);
        },
        reloadSection: function(subReddit, section){
            $('#newsSection .portlet[title=' + subReddit + '] .portlet-content').html(mra.loaderImage);
            mra.fetchContentFromRemote(function(arrItems){
                mra.news.addItemsToView(arrItems,subReddit);
            }, subReddit + "/" + section, mra.news.totalItems);
            $('#newsSection .portlet[title=' + subReddit + '] .portlet-header .toggleView').removeClass('ui-icon-bullet').addClass('ui-icon-radio-on');
            $('#newsSection .portlet[title=' + subReddit + '] .portlet-header .toggleView[rel=' + section + ']').removeClass('ui-icon-radio-on').addClass('ui-icon-bullet');
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
        loadNextFeed: function(){  
            var curTitle = mra.news.portlets[mra.news.totalIndex].title;
            mra.fetchContentFromRemote(function(arrItems){
                mra.news.addItemsToView(arrItems,curTitle);
                mra.news.addCount();
            }, curTitle, mra.news.totalItems);
        },
        addItemsToView: function(arrItems, sectionName){
            var curNewsColumn = mra.news.portlets.filter('.portlet[title=' + sectionName + ']').find('.portlet-content'); 
            curNewsColumn.html("");
            if (arrItems.length == 0){
                curNewsColumn.html('<div class="ui-state-default">Nothing here to see</div>');
            }
            else {
            -    $.each(arrItems,function(i, obj){
                    var title = left(obj.title,100);
                    var score = parseInt((obj.ups/ (obj.downs + obj.ups)) * 100);
            
                    var itemLICenter = $(document.createElement("div"))
                        .addClass("itemLICenter")
                        .html('<a target="_blank" href="' + obj.url + '" class="newsItem">' + title + '</a>');
            
                    var itemLIRight = $(document.createElement("div"))
                        .addClass("itemLIRight")
                        .html('<a target="_blank" href="' +  redditURL + obj.permalink + '" class="newsItem commentURL" title="' + (title + "% of People Like It") + '">' + score + '%</a>');
            
                    itemUL = $(document.createElement("div"))
                        .addClass("itemUL");
                
                    itemUL.append(itemLICenter);
                    itemUL.append(itemLIRight);
            
                    curNewsColumn.append(itemUL);
                });        
                curNewsColumn.append('<div class="ui-icon-more"><span class="ui-icon ui-icon-carat-1-s" style="float:left"></span><span class="text" style="display:none; float:right;">Read More</span></div>');
            }
            return true;
        }
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
                settings.arrMetaReddits(currentImageBar);
            }
            else {
                sql = "select * from html where url=\"http://metareddit.com/reddits/" + metaSection + "/list\" and xpath='//*[@class=\"subreddit\"]'";
                reqURL = "http://query.yahooapis.com/v1/public/yql?format=json&callback=mra.imageBar.processMeta&q=" + escape(sql);
                mra.jsonpRequest(reqURL);    
            } 
        },
        processMeta: function(data){ 
            settings.arrMetaReddits(
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
                mra.imageBar.currentImageBar = evt.currentTarget.id; 
            else if (typeof evt == "string")
                mra.imageBar.currentImageBar = evt;    
            mra.fetchContentFromRemote(function(arrItems){
                mra.imageBar.processItems(arrItems,mra.imageBar.currentImageBar);
            }, mra.imageBar.currentImageBar, 100);
        },
        killimage: function(curObj){
            $(curObj).parent().remove();        
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
						//TODO at this point is just append it to the observ array
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
                                //console.log("adding " + curPic.url);
                                //jQuery(".ad-thumb-list ul").append(mra.imageBar.makeHTML(curPic));
                                //adGallery.findImages();
                                //mra.imageBar.applyContextMenu();                            
								settings.images.push(curPic);
                            } 
                        }catch(e){}    
                    }
                }
            );
        },
        /*makeHTML: function(pic){
            return '<li>\
                        <a id="'+pic.id+'" rel="prettyPhoto[reddit]" target="_blank" commentLink="'+ baseurl + pic.permalink +'" title="'+ pic.title.replace(/"/g,"'") +'" href="'+ pic.url +'">\
                            <img height="150" src="'+ pic.url +'" onerror="$(this).parent().parent().remove()">\
                        </a>\
                    </li>';    
        },*/
        contextOnClick: function(Sender, EventArgs){
                /*switch(EventArgs.CommandName)
                {
                    case 'Add':
                        alert('Text: ' + EventArgs.Text);
                        alert('IsDisabled: ' + EventArgs.IsDisabled);
                        alert('ImageUrl: ' + EventArgs.ImageUrl);
                        break;
                    case 'Save':
                        alert('Text: ' + EventArgs.Text);
                        alert('IsDisabled: ' + EventArgs.IsDisabled);
                        alert('ImageUrl: ' + EventArgs.ImageUrl);
                        break;
                    case 'Update':
                        alert('Text: ' + EventArgs.Text);
                        alert('IsDisabled: ' + EventArgs.IsDisabled);
                        alert('ImageUrl: ' + EventArgs.ImageUrl);
                        break;
                    case 'Cancel':
                       alert('Text: ' + EventArgs.Text);
                       alert('IsDisabled: ' + EventArgs.IsDisabled);
                       alert('ImageUrl: ' + EventArgs.ImageUrl);
                       break;
                }*/
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
                    settings.images.push(o)	
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

$(document).ready(mra.init);