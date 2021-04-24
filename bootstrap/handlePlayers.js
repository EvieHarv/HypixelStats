// store already defined by this point
var ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('playerList', function (event,playerList) 
{
    updatePlayerArea(playerList);
});

function updatePlayerArea(playerList)
{
    // Could possibly do this aliasing stuff in main.js so it happens less. Keeping it here for now for ease of debugging in the render process
    if (store.get('aliases') == undefined)
    {
        store.set('aliases', {})
    }
    var aliases = store.get('aliases');
    for(var i = 0; i < playerList.length; i++)
    {
        if (Object.keys(aliases).includes(playerList[i])) // This name is aliased, change it.
        {
            playerList[i] = aliases[playerList[i]];
        }
    };
    if (sessionStorage.getItem('seenPlayers') == null)
    {
        sessionStorage.setItem('seenPlayers', []);
    }
    // Session storage so it doesn't spam someone who's stubborn, but still reminds them. playerList.Length > 4 for cases where a whole party joins at once.
    // (A whole party joining at once, the key owners's name can end up at the end of the of the 4)
    // Check infoBar status to check the message isn't already sent.
    if (sessionStorage.getItem('checkForAndShowWarningOfNickedAccount') !== "shown" && playerList.length > 4)
    {
        if ((!playerList.includes(store.get('key_owner')) || playerList.length > 16))
        {
            if($('#infoBarHolder').html().trim() == "")
            {
                infoBarMessage('', "<span class='text-danger' id='nickAltBanner'>Nick/Alt Detected</span>", "Hey! It looks like you're playing nicked or on an alt.\
                <br>If you're nicked, please go to <a href='./bootstrap/aliases.html'><code>Player Lists -> Aliases/Nick Hider</code></a> \
                and put your nick in as an alias to your account name. <b class='text-danger'>Update this whenever you change your nick.</b>\
                <br>If you're on an alt, please update your API key to the API key of the alt account. \
                <br>Any time you join on a different account, just generate a new API key with <code>/api new</code> and the program will auto-detect it!\
                <br>If you don't do this, the program can have a difficult time removing old players, and often won't purge the list at <i>all</i>.\
                <button class='btn btn-secondary warningButton' style='float: right;'>Hide This Message</button>\
                <script>$('.warningButton').click(function(){$('#infoBarHolder').html(''); sessionStorage.setItem('checkForAndShowWarningOfNickedAccount', 'shown');})</script>", 999999);
            }
        }
        else
        {
            $('#nickAltBanner').closest('#infoBar').remove();
        }
    }
    sessionStorage.setItem('seenPlayers', [...new Set([...sessionStorage.getItem('seenPlayers').split(','),...playerList])].filter(function (el) {return el != "";})); // Should be O(n)? I think
    $(".playerCard").each(function(index, card) // Keep old card data if player still in, delete data if card is no longer relevent
    {
        if (card == undefined) 
        {
            // Honestly not 100% sure where this comes from but handle it anyways. I'm tired don't judge me. 
            // UPDATE: 
            // Think this came from the old system where I didn't know the second term in .each() was a thing so I was just using the index. 
            // Sometimes it would get outdated data (an index that no longer exists) and would throw an error.
            // Should be fixed now, but it adds practically no extra computation time, and if something somehow goes wrong it'd catch it, so it stays.
            return;
        }
        if(playerList.includes(card.getAttribute('player'))) // If card for this player exists already, keep and ignore
        {
            const index = playerList.indexOf(card.getAttribute('player'));
            if (index > -1) {
                playerList.splice(index, 1);
            }
        }
        else 
        {
            card.remove(); // Remove a card for a player who doesn't exist anymore
        }
    });
    playerList.forEach(function(player)
    {
        $(".playerList").append('\
            <div class="col-xl-3 col-md-6 mb-4 playerCard" id="' + player + '" player="' + player + '" uuid="">\
                <div class="card border-left-primary shadow h-100 py-2">\
                    <div class="card-body">\
                        <div class="row no-gutters align-items-center">\
                            <div class="col mr-2">\
                                <div class="font-weight-bold text-primary mb-1 name">' + player + '</div>\
                                <div class="h5 mb-0 font-weight-bold text-gray-800 playerDataHolder">Loading...</div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        ')
    });
    playerList.forEach(function(player) 
    {
        var worker = new Worker('./bootstrap/apis_worker.js'); // Seperate this from the main thread (I think that's how this works here, I'm too used to C#)
        if (store.get('hypixel_key') == undefined)
        {
            $(".playerList").html("Please set your hypixel API key in Settings -> API Settings -> Hypixel Key");
        };
        worker.postMessage([player, store.get('hypixel_key')]);
        worker.onmessage = function (e) 
        {
            player = resolve('player.displayname', e.data[0]); // using resolve() so it doesn't error out
            playerBackup = e.data[1] // If player isn't defined, still need name to resolve nick.

            // The data is invalid somehow
            if (player)
            {
                // Assign the data we go to the playerCard div. It's just a jquery thing, so handle it all in jquery
                $("#" + player).data('data', e.data[0]);
                $("#" + playerBackup).attr('uuid', e.data[2]);
                
                updatePlayerData(player);
            }
            else
            {
                $("#" + playerBackup).data('data', "Nick");
                $("#" + playerBackup).attr('uuid', "Nick");
                $("#" + playerBackup).find('.playerDataHolder').html('<div class="h5 mb-0 font-weight-bold text-warning">Nick</div>');
                updatePlayerData(playerBackup);
            }
        }
    });
}

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};


// Parse the data for all players
// Used in profileLoader.js
function updateAllPlayerData()
{
    $(".playerCard").each(function(index, card){
        updatePlayerData(card.id);
    });
    resortCards();
}

// Parse the data for a specific player
function updatePlayerData(player)
{
    profile = store.get('profiles')[store.get('active_profile')];

    isNick = false;
    if ($("#" + playerBackup).attr('uuid') == "Nick")
    {
        isNick = true;
    }
    else // Only need to run through stats if its a valid player
    {
        // Reset the data area
        $("#" + player).find('.playerDataHolder').html('');
        
        // Get the active profile as a JSON object
        
        // Get the data from the playerCard div
        data = $("#" + player).data('data');
        
        // Loop through each stat and append it. This *has* to exist in a profile, so no if statement to check.
        for (var entry in profile["stats"])
        {
            // Not sure on the security of Function() or if it's a good practice.
            // As far as I can tell, it seems better than eval() at least.
            
            // Evaluate the expression
            value = undefined;

            // Wrap in a try/catch because idk what these people are gonna put
            try{ value = Function('"use strict";return (' + profile.stats[entry] + ')')(data); }
            catch(error){ console.error(error); }

            if (typeof value === 'number') {
                value = value.toFixedDown(2);
            }
            if (value == undefined || value == NaN)
            {
                value = "N/A";
            }
            // Add the data to the player card
            $("#" + player).find('.playerDataHolder').append('<div class="h5 mb-0 font-weight-bold text-gray-800">' + entry + ": " + value + '</div>');
        }
    }
    // Check that this profile has valid colorConditions
    if (profile['colorConditions'])
    {
        color = undefined;
        for (var condition in profile['colorConditions'])
        {
            if (!(color)) // Keep checking until we find a valid color
            {
                playerName = player;
                data = $("#" + player).data('data');
                blacklist = store.get('blacklist');
                whitelist = store.get('whitelist');
                seenPlayers = sessionStorage.getItem('seenPlayers').split(',').filter(function (el) {return el != "";});
                isNick = isNick; // Just here for clarity
                try // Can error out for the user, still want to continue going if it does.
                {
                    color = Function('"use strict";if (' + condition + ') { return ("' + profile.colorConditions[condition] + '"); } ')
                    (playerName, data, blacklist, whitelist, seenPlayers, isNick);
                }
                catch(error){ console.error(error); }; 
            }
        }
        // A color was found
        if (color)
        {
            // Set name to color
            $('#' + player).find('.name').attr('style', "color: " + color + "!important;")
            // Set border to color
            $('#' + player).find('.border-left-primary').attr('style', "border-left: .25rem solid " + color + "!important;")
        }
    };
    resortCards();
}


// Re-sort the cards based on their data and the current profile
function resortCards()
{
    profile = store.get('profiles')[store.get('active_profile')];
    
    // Check for a valid sort config
    if (profile['sort'])
    {
        divList = $(".playerCard");

        console.log('akij')
        // Wait untill all player calls have been made to sort. TODO: Maybe make this a toggle? 
        // somePlayersUndefined = false;
        // divList.each(function(a, b){
        //     // If the div has the uuid attribute defined, it means that the data has been grabbed successfully.
        //     if(!b.getAttribute('uuid'))
        //     {
        //         somePlayersUndefined = true;
        //         return false;
        //     }
        // });
        // if (somePlayersUndefined){ return false; } // End execution
        
        sortString = profile.sort;
        divList.sort(function(a, b)
        {
            dataA = $(a).data('data');
            dataB = $(b).data('data');
            try {
                if (b.getAttribute('uuid') == "Nick") // Send nicks to end
                {
                    return -1;
                };

                data = dataA;
                valueA = Function('"use strict"; return (' + sortString + ');')(data);
                data = dataB;
                valueB = Function('"use strict"; return (' + sortString + ');')(data);

                if (!Number.isFinite(valueA) && !Number.isFinite(valueB)) // Both NaN? Do nothing.
                {
                    return 0;
                }
                else if (!Number.isFinite(valueA))
                {
                    return 1;
                }
                else if (!Number.isFinite(valueB))
                {
                    return -1;
                }

                value = valueB - valueA; // Values are good, actually subract them

                return value;
            } catch (error) {console.warn(error); return 0;} // This tends to spam the output log. Maybe tidy this up with some checks?
        });
        // Flip array around if the user wants ascending list
        if (profile['sortOrder'] && profile.sortOrder == "ascending")
        {
            divList = divList.reverse();
        }
        divList.appendTo('.playerList');
    }    
}

$.fn.reverse = [].reverse;

function resolve(path, obj) {
    return path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : null
    }, obj || self)
}

function getColor(player, fkdr, winstreak, uuid)
{
    var blacklist = store.get('blacklist')
    var whitelist = store.get('whitelist')
    if (blacklist !== undefined)
    {
        if (blacklist.includes(player))
        {
            return "danger";
        };
    }
    if (whitelist !== undefined)
    {
        if (whitelist.includes(player))
        {
            return "success";
        };
    }
    if (uuid == "Nick" || uuid == undefined || uuid == "") // Really it should only be the first one, but I dont trust myself so we're doing all 3
    {
        return "warning";
    }
    return "primary"; // Neither
}