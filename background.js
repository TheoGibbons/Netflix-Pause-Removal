//setInterval(function(){}, 9999); //Dummy SetInterval (Gets cleared during netflix's load events)
setInterval(function(){
	
	/**
	 * 1. Click the continue paying button 
	 * 2. Click the play next episode button (there are two different versions of this button)
	**/
	
	var postplayV1 = document.querySelector(".postplay-still-container");					// Next episode playing in X seconds (big one)
	var postplayV2 = document.querySelector("#playerContainer .nf-flat-button-primary");		// Next episode playing in X seconds (small one)
	var continuePlaying = document.querySelector(".button.continue-playing");
	
	if(postplayV1) { postplayV1.click(); }
	if(postplayV2) { postplayV2.click(); }
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