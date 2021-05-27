importScripts("./fakeDom.js");
importScripts('./jquery.js');

self.addEventListener("message", function(e) {
    callApis(e.data[0], e.data[1], e.data[2])
}, false);

async function callApis(player, key, APIs) // Player name, owner key, custom APIs
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
                postMessage([null, player, null]);  
            }
        }
    })
    .fail(function(err)
    {
        console.error(err);
        uuid = null;
        console.error("Nick Detected! Name: " + player);
    });

    if (uuid)
    {
        var data = null;
        
        $.ajax({
            url: hypxUrl + uuid,
            contentType: "application/json",
            async: false,
            dataType: 'json',
            tryCount: 0,
            success: function(result){
                data = result;
            },
            error: function (data, textStatus, errorThrown) 
            {
                if (this.tryCount == 0 && errorThrown == "timeout")
                {
                    this.tryCount++;
                    console.warn('Hypixel API timed out, trying one more time.')
                    $.ajax(this);
                }
                else
                {
                    console.log('Err: ' + errorThrown);
                    console.error("API Failed. Nick Detected! Name: " + player);    
                    data = null;
                }
            },
            timeout: 1500 // TODO: Maybe make customizable?
        });


        if (data !== null) // Checks if hypixel data was fetched 
        {
            // Do custom API calls
            if (APIs)
            {
                data.c = {};
                Object.keys(APIs).forEach(apiName => 
                    {
                        api = APIs[apiName];

                        if (api.on)
                        {
                            url = api.url;
                            // We assume we're dealing with safe data by this point.
                            add = "?"; // Easy way to add on paramaters with & if there is more than 1 argument sent.
                            if (api.sends.userKey) { url += add + "key=" + key; add = "&"; };
                            if (api.sends.playerName) { url += add + "name=" + player; add = "&"; };
                            if (api.sends.playerUUID) { url += add + "uuid=" + uuid; add = "&"; };

                            apiData = null;

                            $.ajax({
                                url: url,
                                contentType: "application/json",
                                async: false,
                                dataType: 'json',
                                success: function(result){
                                    apiData = result;
                                },
                                error: function (apiData, textStatus, errorThrown) 
                                {
                                    console.warn('Custom API "' + apiName + '" failed to resolve.');
                                    apiData = null; // Only run these custom ones once. Maybe add customization in the future.
                                },
                                timeout: api.timeout
                            });
                            
                            // Add custom data under "c".
                            // Ex: "data.c.isSniper.data"
                            // It's a bit cumbersome, but it seems like the more clear method to me.
                            data.c[apiName] = apiData;
                        }
                    });

                postMessage([data, player, uuid]);    
            }
            else
            {
                postMessage([data, player, uuid]);
            }
        }
        else
        {
            // I'm assuming if hypixel doesn't resolve, we don't need to resolve anything else.
            // If any evidence for this not being the case comes up, I can re-write this.
            postMessage([null, player, uuid]);
        }
    }
    else
    {
        postMessage([null, player, uuid]);
    }
};