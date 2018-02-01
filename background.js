//setInterval(function(){}, 9999); //Dummy SetInterval (Gets cleared during netflix's load events)
setInterval(function(){
	
	/**
	 * 1. Click the continue paying button 
	 * 2. Click the play next episode button (there are two different versions of this button)
	**/
	
	var postplayV1 = document.querySelector(".postplay-still-container");					// Next episode playing in X seconds (big one)
	var postplayV2 = document.querySelector("#playerContainer .nf-flat-button-primary");		// Next episode playing in X seconds (small one)
	var postplayV3 = document.querySelector(".WatchNext-still-hover-container");		// Next episode playing in X seconds (v2.0)
	var continuePlaying = document.querySelector(".button.continue-playing");
	
	if(postplayV1) { postplayV1.click(); }
	if(postplayV2) { postplayV2.click(); }
	if(postplayV3) { postplayV3.click(); }
	if(continuePlaying) { continuePlaying.click(); }
	
}, 33);

document.querySelector('body').addEventListener("keydown", function (e) {
	
	/**** Add in Ctrl arrow key to skip 60sec and shift arrow to skip 5 mins ****/
    var found = false;

    if( e.code === 'ArrowRight' && e.shiftKey ) {
        NetflixSeek.seekIncrement( 5 * 60 );
    } else if( e.code === 'ArrowRight' && e.ctrlKey ) {
        NetflixSeek.seekIncrement( 60 );
    } else if( e.code === 'ArrowLeft' && e.shiftKey ) {
        NetflixSeek.seekIncrement( -5 * 60 );
    } else if( e.code === 'ArrowLeft' && e.ctrlKey ) {
        NetflixSeek.seekIncrement( -60 );
    }

    if(found) {
        e.stopPropagation();
		return false;
    }
	/**** /Add in Ctrl arrow key to skip 60sec and shift arrow to skip 5 mins ****/
	
	/**** Don't pause when seeking with the arrow keys ****/
	var playpause = function(play) {
		play = typeof play === 'undefined' ? true : play;
		if(document.querySelector('video').paused) {
			if(play) {
				document.querySelector(".player-control-button.player-play-pause").click();
			}
		} else {
			if(!play) {
				document.querySelector(".player-control-button.player-play-pause").click();
			}
		}
	};
	
	var video = document.querySelector('video');
	//if(!video.paused) {
		if(e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
			window.setTimeout(function() {
				
				playpause();
				
			}, 0);
		}
	//}
	/**** /Don't pause when seeking with the arrow keys ****/

	/**** Spacebar should skip intro if that button is showing ****/
    if( e.code === 'Space' ) {
        var skipCreditsElement = document.querySelector('.skip-credits a');
        if(skipCreditsElement) {
            skipCreditsElement.click();

            e.stopPropagation();
            return false;
        }
    }
	/**** /Spacebar should skip intro if that button is showing ****/

});

var NetflixSeek = (function() {

    var showControls = function () {
        var $ = jQuery,
            scrubber = $('#scrubber-component'),
            eventOptions = {
                'bubbles': true,
                'button': 0,
                'currentTarget': scrubber[0]
            };
        scrubber[0].dispatchEvent(new MouseEvent('mousemove', eventOptions));
    };

    var getDuration = function () {
        return document.querySelector('video').duration;
    };

    var getCurrentTime = function () {
        return document.querySelector('video').currentTime;
    };

    var seek = function (seconds) {
        var eventOptions, 
			scrubber, 
			$ = jQuery, 
			duration = getDuration();
			
		seconds = Math.max(seconds, 0);
		seconds = Math.min(seconds, duration);

        console.log('Seeking from ' + getCurrentTime() + ' to ' + seconds);

		showControls();

		// compute the parameters for the mouse events
		scrubber = $('#scrubber-component');
		var factor = seconds / getDuration();
		var mouseX = scrubber.offset().left + Math.round(scrubber.width() * factor); // relative to the document
		var mouseY = scrubber.offset().top + scrubber.height() / 2;                  // relative to the document
		eventOptions = {
			'bubbles': true,
			'button': 0,
			'screenX': mouseX - $(window).scrollLeft(),
			'screenY': mouseY - $(window).scrollTop(),
			'clientX': mouseX - $(window).scrollLeft(),
			'clientY': mouseY - $(window).scrollTop(),
			'offsetX': mouseX - scrubber.offset().left,
			'offsetY': mouseY - scrubber.offset().top,
			'pageX': mouseX,
			'pageY': mouseY,
			'currentTarget': scrubber[0]
		};

		// make the "trickplay preview" show up
		scrubber[0].dispatchEvent(new MouseEvent('mouseover', eventOptions));

		window.setTimeout(function () {
			// simulate a click on the scrubber
			scrubber[0].dispatchEvent(new MouseEvent('mousedown', eventOptions));
			scrubber[0].dispatchEvent(new MouseEvent('mouseup', eventOptions));
			scrubber[0].dispatchEvent(new MouseEvent('mouseout', eventOptions));

			//window.setTimeout(function () {
			//    hideControls();
			//}, 1);

		}, 10);
    };

	/*
    var loadJqueryScript = function(callback) {
        // Load the script
        var script = document.createElement("SCRIPT");
        script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';
        script.type = 'text/javascript';
        script.onload = callback;
        document.getElementsByTagName("head")[0].appendChild(script);
    };

    var idempotentLoadJquery = function(callback) {
        if( typeof jQuery === "undefined" ) {
            loadJqueryScript(callback);
        } else {
            callback();
        }
    };
	*/
	
	// used when the user is spamming ctrl/shift arrow
	var seekTime = {
		'from': null,
		'to': null
	};

    return {
        seekTo : seek,
        seekIncrement : function(seconds) {
			
			var currentTime = getCurrentTime();
			var toTime = currentTime + seconds;
			if(currentTime === seekTime.from) {
				// user is probably spamming seek and the player hasn't had a chance to update yet
				toTime = seekTime.to + seconds;
			}
			seekTime = {
				'from': currentTime,
				'to': toTime
			};
			
            seek( toTime );
        }
    }

})();


/**************** Add Rotten Tomatoes score to Netflix ****************/
(function () {

    var currentlyOpenJawBone = [];


    var ajax = function (type, url, params, onResponse) {
        var xmlhttp;
        if (window.XMLHttpRequest)
            xmlhttp = new XMLHttpRequest(); // code for IE7+, Firefox, Chrome, Opera, Safari
        else
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); // code for IE6, IE5

        var strParams;

        //If params is an object then convert to a string
        if (typeof params === 'object') {
            //Turn params into a string that we can send
            strParams = "";
            for (var param in params)
                strParams += param + "=" + encodeURIComponent(params[param]) + "&";
            strParams = strParams.substr(0, strParams.length - 1);
        } else {
            strParams = params;
        }

        // If url is blank then use the current page's name
        if (typeof url === 'undefined' || !url) {
            url = location.pathname.substring(location.pathname.lastIndexOf("/") + 1);
            if (window.location.search.substring(1).length > 0)
                url += '?' + window.location.search.substring(1);	// Add querystring
        }
        if (url.substr(0, 1) === "?") url = location.pathname.substring(location.pathname.lastIndexOf("/") + 1) + url;

        if (type.toUpperCase() === "POST") {
            xmlhttp.open("POST", url, true);

            //Send the proper header information along with the request
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        } else {
            xmlhttp.open("GET", url + (url.indexOf("?") === -1 ? "?" : "&") + strParams, true);
        }

        xmlhttp.onreadystatechange = function () {	//Called when state changes.
            if (xmlhttp.readyState == 4) {
                onResponse(xmlhttp);
            }
        };
        xmlhttp.send(type.toUpperCase() === "POST" ? strParams : null);
    };

    var levenshtein = function (a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        var tmp, i, j, prev, val, row;

        // swap to save some memory O(min(a,b)) instead of O(a)
        if (a.length > b.length) {
            tmp = a;
            a = b;
            b = tmp;
        }

        row = new Array(a.length + 1);
        // init the row
        for (i = 0; i <= a.length; i++) {
            row[i] = i;
        }

        // fill in the rest
        for (i = 1; i <= b.length; i++) {
            prev = i;
            for (j = 1; j <= a.length; j++) {
                if (b[i - 1] === a[j - 1]) {
                    val = row[j - 1]; // match
                } else {
                    val = Math.min(row[j - 1] + 1, // substitution
                        Math.min(prev + 1,     // insertion
                            row[j] + 1));  // deletion
                }
                row[j - 1] = prev;
                prev = val;
            }
            row[a.length] = prev;
        }
        return row[a.length];
    };

    var getSections = function () {
        return document.querySelectorAll('.jawBone');
    };

    var getTitle = function (section) {
        var $title = section.querySelector('.title'),
            img = $title.querySelector('img');
        return img ? img.getAttribute('alt') : $title.innerHTML;
    };

    var getYear = function (section) {
        var year = section.querySelector('.year');
        return year ? year.innerHTML : null;
    };

    var isTvSeries = function (section) {
        return !!section.querySelector('#tab-Episodes');
    };

    var addMatchScoreTvSeries = function (array, title, year) {
        for(var i=0; i<array.length; i++) {
            var l = levenshtein(array[i].myTitle, title),
                y = array[i].myYear - year;

            // Netflix years are almost always > Rotten Tomatoes years
            if(y > 0) {
                y = y*3;
            }
            y = Math.abs(y);

            // year differences are not as much of an issue as title differences
            y = y / 2;

            array[i].levenshtein = l;
            array[i].matchScore = l + y;
        }
        return array;
    };

    var addMatchScoreMovies = function (array, title, year) {
        for(var i=0; i<array.length; i++) {
            var l = levenshtein(array[i].myTitle, title),
                y = array[i].myYear - year;

            y = Math.abs(y);

            array[i].levenshtein = l;
            array[i].matchScore = l + y;
        }
        return array;
    };

    var orderTitlesArray = function (array) {
        return array.sort(function(a, b) {
            return a.matchScore-b.matchScore;
        });
    };

    var tvSeriesToUnifiedKeys = function (array) {
        for(var i=array.length-1; i>=0; i--) {
            array[i].myTitle = array[i].title;
            array[i].myYear = array[i].endYear ? array[i].endYear : array[i].startYear;
        }
        return array;
    };

    var moviesToUnifiedKeys = function (array) {
        for(var i=array.length-1; i>=0; i--) {
            array[i].myTitle = array[i].name;
            array[i].myYear = array[i].year;
        }
        return array;
    };

    var getRtElem = function (section) {
        var meta = section.querySelector('.meta'),
            rtElem = meta.querySelector('.rtElem');

        if(!rtElem) {
            rtElem = document.createElement('span');

            rtElem.style = "position:relative;";
            rtElem.className = "rtElem";
            meta.appendChild(rtElem);
        }

        return rtElem;
    };

    var addUserSelect = function(section, array) {
        console.log("We could not find a sufficiently matching title, the user must select which one of " + array.length + " to use", array);
        var rtElem = getRtElem(section);

        var select = document.createElement('select');
        select.innerHTML = "<option>Select</option>";
        for(var i=0; i<array.length; i++) {
            console.log(array[i]);
            select.innerHTML += "<option data-json='" + JSON.stringify(array[i]) + "'>" + array[i].myTitle + "(" + array[i].myYear + ")" + "</option>";
        }

        select.addEventListener('change', function() {
            var selectedOptionData = this.options[this.selectedIndex].getAttribute('data-json');
            if(selectedOptionData) {
                addBestMatchingTitle(section, JSON.parse(selectedOptionData));
            }
        }, false);

        rtElem.appendChild(select);
    };

    var addBestMatchingTitle = function(section, tvseries) {
        console.log("SUCCESS corresponding title found", tvseries);
        var rtElem = getRtElem(section);

        rtElem.innerHTML =
            '<a href="https://www.rottentomatoes.com' + tvseries.url + '" target="_blank" style="position: relative;">' +
            '<img src="https://www.rottentomatoes.com/static/images/icons/fresh-16.png"/>' +
            '<span style="position: absolute;font-size: 14px;color: white;text-align: center;vertical-align: middle;line-height: 14px;top: 0;right: 0;bottom: 0;left: 0;">' +
                (tvseries.meterScore ? tvseries.meterScore : 'NA') +
            '</span>' +
            '</a>';

        addRTAudienceScore(section, tvseries);
    };

    var add404 = function(section, title) {
        console.log("FAILURE 0 corresponding titles found");
        var rtElem = getRtElem(section);

        rtElem.innerHTML =
            '<a href="https://www.rottentomatoes.com/search/?search=' + encodeURIComponent(title) + '" target="_blank" style="position: relative;">' +
            '<img src="https://www.rottentomatoes.com/static/images/icons/fresh-16.png"/>' +
            '<span style="position: absolute;font-size: 14px;color: white;text-align: center;vertical-align: middle;line-height: 14px;top: 0;right: 0;bottom: 0;left: 0;">' +
                '404' +
            '</span>' +
            '</a>';
    };

    var addRTAudienceScore = function(section, tvseries) {
        var rtElem = getRtElem(section);

        ajax('get', 'https://dev.testsite.com/f/movie-rating-search/index.json.php', {
            'action': 'rottenTomatoesFullScore',
            'url': tvseries.url
        }, (function (data) {
            var json = JSON.parse(data.responseText);

            console.log(json);

            var newRTTitle = [];
            newRTTitle.push((tvseries.title ? tvseries.title : tvseries.name) + ' (' + (tvseries.year ? tvseries.year : tvseries.startYear) + ')');
            if(json.result.allCriticsScore) {
                newRTTitle.push("All critics: " + json.result.allCriticsScore);
            }
            if(json.result.topCriticsScore) {
                newRTTitle.push("Top critics: " + json.result.topCriticsScore);
            }
            if(json.result.audienceScore) {
                newRTTitle.push("Audience: " + json.result.audienceScore);
            }
            rtElem.title = newRTTitle.join("\n");


            if(json.result.audienceScore) {
                var rtElemAudience = document.createElement('span');
                rtElemAudience.innerHTML =
                    '<span>' +
                    '<img src="https://dev.testsite.com/f/movie-rating-search/icons-v2-popcorn.png" style="width: 28px;"/>' +
                    '<span style="position: absolute;top: 9px;left: 39px;font-size: 14px;color: black;background-color: rgba(255, 255, 255, 0.5);">' +
                        json.result.audienceScore +
                    '</span>' +
                    '</span>';
                rtElem.appendChild(rtElemAudience);
            }

        }));
    };

    window.setInterval(
    (function () {

        var sections = getSections(),
            allOpenTitles = [];

        for (var i = 0; i < sections.length; i++) {
            var section = sections[i],
                title = getTitle(section);

            if (!title) {
                continue;
            }

            allOpenTitles.push(title);

            if (currentlyOpenJawBone.indexOf(title) === -1) {

                var year = getYear(section),
                    tvSeries = isTvSeries(section);

                ajax('get', 'https://dev.testsite.com/f/movie-rating-search/index.json.php', {
                    'action': 'search',
                    'search': title
                }, (function (data) {
                    var json = JSON.parse(data.responseText),
                        array;

                    console.log("\"" + this.title + "\" search results", json, this);
                    if (this.tvSeries) {
                        array = json.result.rottenTomatoes.tvSeries;

                        // movies have a slightly different layout to tv series e.g. the "title" key is "name"
                        // lets convert so both have the sameish keys
                        array = tvSeriesToUnifiedKeys(array);

                        array = addMatchScoreTvSeries(array, this.title, this.year);
                        array = orderTitlesArray(array);

                        if(array.length === 1 && array[0].matchScore <= 2) {
                            // If there is only one match found with a good match score then it must be the correct title
                            addBestMatchingTitle(this.section, array[0]);
                        } else if(array.length > 0) {
                            // there are either multiple titles found, or the found title didn't have a very good match
                            // score so, the user must select the title
                            addUserSelect(this.section, array);
                        } else {
                            add404(this.section, this.title);
                        }

                    } else {
                        array = json.result.rottenTomatoes.movies;

                        // movies have a slightly different layout to tv series e.g. the "title" key is "name"
                        // lets convert so both have the sameish keys
                        array = moviesToUnifiedKeys(array);

                        array = addMatchScoreMovies(array, this.title, this.year);
                        array = orderTitlesArray(array);

                        if(array.length === 1 && array[0].matchScore <= 2) {
                            // If there is only one match found with a good match score then it must be the correct title
                            addBestMatchingTitle(this.section, array[0]);
                        } else if(array.length > 0) {
                            // there are either multiple titles found, or the found title didn't have a very good match
                            // score so, the user must select the title
                            addUserSelect(this.section, array);
                        } else {
                            add404(this.section, this.title);
                        }
                    }

                }).bind({
                    title: title,
                    year: year,
                    tvSeries: tvSeries,
                    section: section
                }));

            }

        }

        currentlyOpenJawBone = allOpenTitles;

        // })();
    }), 100);

})();
/**************** /Add Rotten Tomatoes score to Netflix ****************/