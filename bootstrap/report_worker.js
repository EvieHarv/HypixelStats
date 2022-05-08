importScripts("./fakeDom.js");
importScripts('./jquery.js');

self.addEventListener("message", function(e) {
    sendReport(e.data[0], e.data[1], e.data[2])
}, false);


function sendReport(name, uuid, key) {

    if (uuid) {
        $.ajax({
            url: "https://api.hypixelstats.com/report?uuid=" + uuid + '&key=' + key,
            contentType: "application/json",
            async: false,
            dataType: 'json',
            tryCount: 0,
            success: function(){ postMessage('Terminate'); },
            error: function (data, textStatus, errorThrown) 
            {
                if (this.tryCount == 0 && errorThrown == "timeout")
                {
                    this.tryCount++;
                    console.warn('API timed out, trying one more time.')
                    $.ajax(this);
                }
                else {
                    postMessage('Terminate');
                }
            },
            timeout: 5000
        });
    }
    else {
        // honestly not sure what to do.
        // for now, gonna just terminate...
        postMessage('Terminate');
    }
}