var adjustments_de = {
	dayNames: [ "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag" ]
};
function spell_check(inp){

	if(inp === '' || inp === ' ' || inp.length < 2){alert('Bitte mehr Text schreiben!');return false;}

	if(inp.indexOf('[') !== -1 || inp.indexOf(']') !== -1 || inp.indexOf('{') !== -1 || inp.indexOf('}') !== -1 || inp.indexOf('<') !== -1 || inp.indexOf('>') !== -1 || inp.indexOf(';') !== -1 || inp.indexOf('array') !== -1 || inp.indexOf('return') !== -1 || inp.indexOf('eval') !== -1){alert('Bitte keinen code einschreiben!');return false;}

	return true;

}


function isTouchSupported() {
    var msTouchEnabled = window.navigator.msMaxTouchPoints;
    var generalTouchEnabled = "ontouchstart" in document.createElement("div");

    if (msTouchEnabled || generalTouchEnabled) {
        return true;
    }
    return false;
}


var highlighted_users_text = [];

var sh_me = function(t,s){

	if(s === 2){
		s = (t.children[0].style.visibility === 'hidden' || t.children[0].style.visibility === '') ? 1 : 0;
	}

	t.children[0].style.visibility = (s === 0) ? 'hidden' : 'visible';
	t.style.width = t.style.height = (s === 0) ? '24px' : '48px';
	t.style.margin = (s === 0) ? '0 16px' : '0 4px';

	if(s === 1){

		highlighted_users_text.push(t.id);

	}else{

		var h = highlighted_users_text.indexOf(t.id);
		if(h !== -1) {
			highlighted_users_text.splice(h, 1);
		}

	}

	change_other_user_text('user' + t.id + 'Class',s);

};


function change_other_user_text(t,s){

	var other_user_text = document.getElementsByClassName(t);
		console.log(t + ' touch ' + other_user_text.length);

	for(var j = 0; j < other_user_text.length; j++){

		other_user_text[j].style.background = (s === 0) ? 'rgba(255,255,255,0)' : 'rgba(0,255,0,1)';

	}

}



var define_things = function() {

    "use strict";

    // for better performance - to avoid searching in DOM
    var wc = document.getElementById('write_connections');
    var wt = document.getElementById('write_text');
    var tf = document.getElementById('text_field');
    var status = document.getElementById('status');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        wt.innerHTML = 'Sorry, but your browser doesn\'t support WebSockets.';
        status.style.display = 'none';
        return;
    }

    // open connection
    var connection = new WebSocket('ws://5.196.101.69:1337');

    connection.onopen = function () {
        // first we want users to enter their names
        status.innerHTML = '';
        tf.style.display = 'block';
        tf.value = '';
        tf.focus();
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        wt.innerHTML = 'Sorry, but there\'s some problem with your connection or the server is down.';
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json.type === 'color') { // first response from the server with user's color

            myColor = json.data;
            //status.text(myName + ': ').css('color', myColor);
            tf.removeAttribute('disabled');
            tf.placeholder='hier weiterschreiben ...';
            tf.focus();
            // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
					// insert every single message to the chat window

					for (var i=0; i < json.data.length; i++) {
							addMessage(json.data[i].author, json.data[i].text,
												 json.data[i].color, new Date(json.data[i].time));
					}
				} else if (json.type === 'userupdate') { // users online has changed

            inscrit_users(json.names);
            wt.style.display = wc.style.display = 'block';

					console.log('users online has changed' + json.names[0]);
				} else if (json.type === 'message') { // it's a single message
			            tf.removeAttribute('disabled'); // let the user write another message
			            addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
     * Send mesage when user presses Enter key
     */
	tf.addEventListener('keydown', function(e){

        if (e.keyCode === 13) {
            var msg = this.value;
            if (!spell_check(msg)) {
                return;
            }
            msg = msg.charAt(0).toUpperCase() + msg.slice(1);
			if(myName !== false){
            	msg = (msg.slice(-1) === '!' || msg.slice(-1) === '?' || msg.slice(-1) === '.') ? msg : msg + '.';
			}
            // send the message as an ordinary text
            connection.send(msg);
            this.value = '';
            // disable the input field to make the user wait until server
            // sends back response
            this.setAttribute('disabled', 'disabled');

            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }

	}, false);

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.innerHtml = 'Error';
			tf.setAttribute('disabled', 'disabled');
            tf.value='Unable to comminucate with the WebSocket server.';
        }
    }, 3000);

    /**
     * Add message to the chat window
     */

    var prev_day = '';

    function addMessage(author, message, color, dt) {

        if(prev_day !== adjustments_de.dayNames[dt.getDay()]){

                prev_day = adjustments_de.dayNames[dt.getDay()];

            	var wt_ih = document.createElement('span');
		wt_ih.innerHTML = '<br/><br/>' + prev_day + '<br/><br/>';
		wt.appendChild(wt_ih);

        }

		var is_mine = (myName !== author) ? 'user' + author.toLowerCase() + 'Class' : 'me';

		//vanilla version
		wt.appendChild(document.createTextNode(' '));
		var wt_ih = document.createElement('span');
		wt_ih.innerHTML = message;
		wt_ih.setAttribute('class', is_mine);
		wt.appendChild(wt_ih);

        /*
		//jq version

		content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
             + ': ' + message + '</p>');
		*/

		ion.sound.play("button_tiny");

    }

	function inscrit_users(us){

		var m_ov = (isTouchSupported()) ? 'ontouchstart="sh_me(this,2)"' : 'onmouseover="sh_me(this,1)"';

		var m_ou = (isTouchSupported()) ? '' : 'onmouseout="sh_me(this,0)"';
		/*
		users_onl_count = arr[ix].length;
		*/
		var wc_ih = '<div>' + myName + '</div>';

		for(var i = 0; i < us.length; i++){

			if(myName !== us[i]){

				wc_ih += '<div id="' + us[i].toLowerCase() + '" ' + m_ov + ' ' + m_ou + '><span>' + us[i] + '</span></div>';

			}

		}

		var gone_users = highlighted_users_text.filter(function(obj) { return us.indexOf(obj) === -1; });

		for(var j = 0; j < gone_users.length; j++){

			var h = highlighted_users_text.indexOf(gone_users[j]);

			if(h !== -1) {

				highlighted_users_text.splice(h, 1);

			}

			change_other_user_text('user' + gone_users[j] + 'Class',0);

		}

		wc.innerHTML = wc_ih;

	}

	ion.sound({
		sounds: [
			{name: "button_tiny"}
		],
		path: "http://david.abotsi.com/node_files/ise/sounds/",
		preload: true,
		volume: 0.2
	});

}

document.addEventListener( "DOMContentLoaded", define_things, false );
