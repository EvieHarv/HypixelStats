importScripts("./fakeDom.js");
importScripts('./jquery.js');

self.addEventListener("message", function(e) {
    callApis(e.data[0], e.data[1])
}, false);

async function callApis(player, key)
{
    var uuidUrl = "https://api.mojang.com/users/profiles/minecraft/" + player;
    var hypxUrl = "https://api.hypixel.net/player?key=" + key + "&uuid=";

    var uuid = null;

    $.ajax({
        url: uuidUrl,
        async: false,
        tryCount: 0,
        retryLimit : 3,
        contentType: "application/json",
        dataType: 'json',
        success : function(result){
            if (result !== undefined && result.id !== undefined) // Due to some weird edgecases, have to check that both are defined
            { 
                uuid = result.id; 
            } 
            else 
            { 
                console.error("Nick Detected! Name: " + player);
            }
        },
        error : function(xhr, textStatus, errorThrown) {
            this.tryCount++;
            if (this.tryCount == this.retryLimit) // On the last try, try out playerDB instead.
            {
                console.log("All mojang have failed, resorting to playerdb");
                $.ajax({
                    url: "https://playerdb.co/api/player/minecraft/" + player,
                    async: false,
                    tryCount: 0,
                    retryLimit : 3,
                    contentType: "application/json",
                    dataType: 'json',
                    success : function(result){
                        uuid = result.data.player.id;
                    },
                    error : function(xhr, textStatus, errorThrown) {
                        console.error("PLAYERDB LOOKUP FAILED! Trying again for " + player + " err: " + errorThrown);
                    }
                });
            }
            else if (this.tryCount <= this.retryLimit) {
                console.error("MOJANG LOOKUP FAILED! Trying again for " + player + " err: " + errorThrown);
                $.ajax(this);
                return;
            }
            else
            {
                console.error("Nick Detected! Name: " + player);        
            }
    }
    })
    .fail(function(err)
    {
        console.error(err);
        uuid = null;
        console.error("Nick Detected! Name: " + player);
    });
    var data = null;
    if (uuid)
    {
        $.ajax({
            url: hypxUrl + uuid,
            async: false,
            contentType: "application/json",
            dataType: 'json',
            success: function(result){ // TODO: Make dynamic for which stats are chosen
                data = result;
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown)
        {
            console.log(jqXHR.cause + " : " + textStatus + " : " + errorThrown);
            console.error("API Failed. Nick Detected! Name: " + player);
        });
    }
    postMessage([data, player]);
};