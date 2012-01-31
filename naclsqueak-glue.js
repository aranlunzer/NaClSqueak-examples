// NaClSqueak <=> JS glue

    naclsqueakModule = null;  // Global application object.
    statusText = '';
    developmentMode = document.URL.indexOf("localhost:8003") >= 0;
    if (developmentMode) toSqueakMessageIndex = 99999900;
    embedded_image_file = false;
    req = null;

    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 
    function base64_encode(input) {
      var output = "";
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;

      while (i < input.length) {

        chr1 = input.charCodeAt(i++) & 0xFF;
	chr2 = input.charCodeAt(i++) & 0xFF;
	chr3 = input.charCodeAt(i++) & 0xFF;
 
	enc1 = chr1 >> 2;
	enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
  	enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
	enc4 = chr3 & 63;
 
  	if (isNaN(chr2)) {
	   enc3 = enc4 = 64;
	} else if (isNaN(chr3)) {
	   enc4 = 64;
	}
 
	output = output +
	  _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
	  _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
      }
 
      return output;
   }


   // When the NaCl module has loaded, hook up an event listener to handle
   // messages coming from it via PPB_Messaging.PostMessage() (in C) or
   // pp::Instance.PostMessage() (in C++), and indicate success.
   function moduleDidLoad() {
     naclsqueakModule = document.getElementById('naclsqueak');
     naclsqueakModule.addEventListener('message', handleNaClMessage, true);
     paintInterval = setInterval('naclsqueakModule.postMessage("paint")', 20);
     loadSqueakImage();
     updateStatus('SUCCESS');
   }

    function handleNaClMessage(message_event) {
      handleMessageFromSqueak(message_event.data);
    }

    function handleMessageFromSqueak(data) {
      try {
        eval(data)
      } catch(e) { alert(e.message); }
    }

    // progress on transfers from the server to the client (downloads)  
    function updateProgress(evt) {  
      if (evt.lengthComputable) {  
        var percentComplete = Math.round((evt.loaded / evt.total) * 100.0);
        updateStatus(percentComplete.toString());
      } else {  
       // Unable to compute progress information since the total size is unknown  
      }  
    }
  
    function transferComplete(evt) {
      loadSqueakImage2();
    }
  
    function transferFailed(evt) {
      alert("An error occurred while transferring the file.");  
    }
  
    function transferCanceled(evt) {
      alert("The transfer has been cancelled by the user.");  
    }

    function loadSqueakImage2() {
      naclsqueakModule.postMessage('setHeapSize:' + (128 * 1024 * 1024));

      naclsqueakModule.postMessage('setImageSize:' + (req.responseText.length.toString()));
      current = 0;
      while (current < req.responseText.length) {
        naclsqueakModule.postMessage('loadImage:' + base64_encode(req.responseText.substring(current, current + 3000)));
	    current = Math.min(current + 3000, req.responseText.length);
      }
      req = null;
   }

    function loadSqueakImage() {
      if (embedded_image_file) {
        naclsqueakModule.postMessage('loadImage');
      } else {
        req = new XMLHttpRequest();
    	req.addEventListener("progress", updateProgress, false);  
    	req.addEventListener("load", transferComplete, false);  
    	req.addEventListener("error", transferFailed, false);  
    	req.addEventListener("abort", transferCanceled, false);  
        req.open('GET', 'NaClSqueak-seaside-expts.image', true);
    	req.overrideMimeType('text/plain; charset=x-user-defined');
    	req.setRequestHeader("If-Modified-Since", "Sun, 23 Oct 2011 00:00:00 GMT");
        req.send(null);
      }
    }

    // If the page loads before the Native Client module loads, then set the
    // status message indicating that the module is still loading.  Otherwise,
    // do not change the status message.
    function pageDidLoad() {
      setUpTangle();

      if (developmentMode) {
        setTimeout('pollForMessagesFromSqueak()', 500);
        squeakReady();
        toSqueakMessageIndex = 1;
        }
      else {
      document.getElementById('listener').addEventListener('load', moduleDidLoad, true);
      document.getElementById('listener').innerHTML = "<embed name=\"nacl_module\" id=\"naclsqueak\" width=800 height=600 src=\"naclsqueak.nmf\" type=\"application/x-nacl\" />";

        if (naclsqueakModule == null) {
          updateStatus('LOADING...');
        } else {
          // It's possible that the Native Client module onload event fired
          // before the page's onload event.  In this case, the status message
          // will reflect 'SUCCESS', but won't be displayed.  This call will
          // display the current message.
          updateStatus();
        }
      }
    }

    function sendToSqueak(data) {
        if (developmentMode) {
            var msg = '#' + (toSqueakMessageIndex++).toString() + '#' + data;
            var req = new XMLHttpRequest();
            // send asynchronously to avoid blocking any interaction that might be driving this.
            req.open('GET', 'http://localhost:8003/handleMessage?' + encodeURIComponent(msg), true);
            req.send(null);
        }
        else if (naclsqueakModule) {
            var prefix = "@" + this.utf8_encode(data).length + "@";
            var current = 0;
            do {
                var inThisMsg = Math.min(3000, data.length - current);
                naclsqueakModule.postMessage('message:' + prefix + data.substring(current, current + inThisMsg));
                current += inThisMsg;
                prefix = "";                // only used once
            } while (current < data.length - 1);
        }
    }
    

    function deliverResultToSqueak(data) {
        sendToSqueak("result:" + data);
        }


    // private method for UTF-8 encoding
	this.utf8_encode = function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	}

    function pollForMessagesFromSqueak() {
      if (developmentMode) {
        var req = new XMLHttpRequest();
        req.open('GET', 'http://localhost:8003/pollForMessages', false);
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                msg = req.responseText;
                if (msg != '') {

                    try {
                        var messages = JSON.parse(msg);
                    } catch (e) { alert("Parse error: " + e.message); }

                    for (var i = 0; i < messages.length; i++) {
                        //  document.getElementById("status_field").innerHTML = "<pre>" + messages[i] + "</pre>";
                        try {
                            handleMessageFromSqueak(messages[i]);
                        } catch (e) { alert(e.message + " in " + messages[i]); }
                    }
                }

                // finished this check; set up another one, after a delay dependent on the response this time
                setTimeout('pollForMessagesFromSqueak()', (msg.length > 0 ? 50 : 200));
            }
        };
       req.send(null);
       }
    }

    // utility function for fetching stuff over the web on behalf of NaCl squeak
    // currently hard-coded for Google search API
    function requestForSqueak(query) {

        var myRequest = new Request.JSONP({
            url: "http://localhost:80/NaCl/fetchjson.php?callback=?",
            data: {
                query: query
            },
            onComplete: function (response) { deliverResultToSqueak(response.message) }
        });
        myRequest.send();
    }

    function getSqueakStatus() {
      try {
        naclsqueakModule.postMessage('getStatus');
      } catch(e) {
        alert(e.message);
      }
    }

    // Set the global status message.  If the element with id 'statusField'
    // exists, then set its HTML to the status message as well.
    // opt_message The message test.  If this is null or undefined, then
    // attempt to set the element with id 'statusField' to the value of
    // |statusText|.
    function updateStatus(opt_message) {
      if (opt_message)
        statusText = opt_message;
      var statusField = document.getElementById('status_field');
      if (statusField) {
        statusField.innerHTML = statusText;
      }
    }

