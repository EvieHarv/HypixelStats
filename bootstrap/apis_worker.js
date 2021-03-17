importScripts("./fakeDom.js");
importScripts('./jquery.js');

self.addEventListener("message", function(e) {
    callApis(e.data)
}, false);

async function callApis(player)
{
    var uuidUrl = "https://api.mojang.com/users/profiles/minecraft/" + player;
    var hypxUrl = "https://api.hypixel.net/player?key=" + "YOUR-API-KEY-HERE" + "&uuid="; // TODO Dynamic

    var uuid = null;

    var fkdr = null; // TODO: Make some dynamic system for user-decided stats
    var winstreak = null;

    $.ajax({
        url: uuidUrl,
        async: false,
        tryCount: 0,
        retryLimit : 3,
        contentType: "application/json",
        dataType: 'json',
        success : function(result){
            // $("[player='" + player + "']").attr('uuid', result.data.player.id); // Store UUID in playerCard -- Can't access DOM over worker with new method
            uuid = result.id;
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
            };
    }
    })
    .fail(function(err)
    {
        console.error(err);
        // $("[player='" + player + "']").attr('uuid', "Nick"); // TODO: Handle nicks somehow
        uuid = "Nick";
        fkdr = "N/A";
        winstreak = "N/A";
        console.error("Nick Detected! Name: " + player);
    });
    if (uuid !== "Nick")
    {
        $.ajax({
            url: hypxUrl + uuid,
            async: false,
            contentType: "application/json",
            dataType: 'json',
            success: function(result){
                if (result.player == null)
                {
                    uuid = 'Nick';
                    fkdr = 'N/A';
                    winstreak = 'N/A';
                    console.error("Nick Detected! Name: " + player);
                }
                // Store FKDR in playerCard
                else if (result.player.stats.Bedwars.four_four_final_deaths_bedwars == undefined) // No Deaths (nice)
                {
                    //$("[player='" + player + "']").find('.fkdr').html(result.player.stats.Bedwars.four_four_final_kills_bedwars);
                    fkdr = result.player.stats.Bedwars.four_four_final_kills_bedwars;
                }
                else if (result.player.stats.Bedwars.four_four_final_kills_bedwars == undefined) // No kills (rough)
                {
                    //$("[player='" + player + "']").find('.fkdr').html("0");
                    fkdr = 0;
                }
                else // Normal Human with both kills & deaths
                {
                    //$("[player='" + player + "']").find('.fkdr').html((
                    //    result.player.stats.Bedwars.four_four_final_kills_bedwars / result.player.stats.Bedwars.four_four_final_deaths_bedwars).toFixed(2));
                    fkdr = (result.player.stats.Bedwars.four_four_final_kills_bedwars / result.player.stats.Bedwars.four_four_final_deaths_bedwars).toFixed(2)
                }
    
                // Store winstreak in playerCard
                //$("[player='" + player + "']").find('.winstreak').html(result.player.stats.Bedwars.winstreak);
                if (result.player.stats.Bedwars.winstreak !== undefined){ winstreak = result.player.stats.Bedwars.winstreak; }
                else {winstreak = "N/A"};
            }
        })
        .fail(function()
        {
            $("[player='" + player + "']").attr('uuid', "Nick");
            console.error("Nick Detected! Name: " + player);
        });
    }
    workerResult = [player, uuid, fkdr, winstreak]; // TODO:  Make some dynamic system for user-decided stats
    postMessage(workerResult);
};