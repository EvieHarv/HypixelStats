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
    if (sessionStorage.getItem('checkForAndShowWarningOfNickedAccount') !== "shown")
    {
        // TODO: Show warning to go change nick. Keep it up for NaN
    }
    sessionStorage.setItem('seenPlayers', [...new Set([...sessionStorage.getItem('seenPlayers').split(','),...playerList])]); // Should be O(n)? I think
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
            <div class="col-xl-3 col-md-6 mb-4 playerCard" player="' + player + '" uuid="">\
                <div class="card border-left-primary shadow h-100 py-2">\
                    <div class="card-body">\
                        <div class="row no-gutters align-items-center">\
                            <div class="col mr-2">\
                                <div class="font-weight-bold text-primary mb-1 name">' + player + '</div>\
                                <div class="h5 mb-0 font-weight-bold text-gray-800 fkdr-div">FKDR: <span class="fkdr">Loading...</span></div>\
                                <div class="h5 mb-0 font-weight-bold text-gray-800 winstreak-div">Winstreak: <span class="winstreak">Loading...</span></div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        ')
    });
    var worker = new Worker('./bootstrap/apis_worker.js'); // Seperate this from the main thread (I think that's how this works here, I'm too used to C#)
    playerList.forEach(function(player) 
    {
        if (store.get('hypixel_key') == undefined)
        {
            $(".playerList").html("Please set your hypixel API key in Settings -> API Settings -> Hypixel Key");
        };
        worker.postMessage([player, store.get('hypixel_key')]);
        worker.onmessage = function (e) 
        {
            var player = e.data[0]
            var uuid = e.data[1]
            var fkdr = e.data[2]
            var winstreak = e.data[3]

            var color = getColor(player, fkdr, winstreak, uuid);
            if (color !== "primary")
            {
                $("[player='" + player + "'] > .card").removeClass('border-left-primary');
                $("[player='" + player + "'] > .card").addClass('border-left-' + color);
                $("[player='" + player + "'] .name").removeClass('text-primary');
                $("[player='" + player + "'] .name").addClass('text-' + color);
            }
            $("[player='" + player + "']").attr('uuid', uuid);
            $("[player='" + player + "']").find('.fkdr').html(fkdr);
            $("[player='" + player + "']").find('.winstreak').html(winstreak);

            // Re-order divs based on FKDR
            var divList = $(".playerCard");
            divList.sort(function(a, b){
                aNum = $(a).find(".fkdr").html();
                bNum = $(b).find(".fkdr").html();
                if (!Number.isFinite((aNum + 1 - 1))) // This is JANK but it works
                {
                    // If it's not a number, its 0
                    aNum = 0;
                }
                if (!Number.isFinite((bNum + 1 - 1)))
                {
                    bNum = 0;
                }
                return bNum-aNum;
            });
            $(".playerList").html(divList);
            //$("[player='" + list[0].getAttribute('player') + "'] .fkdr").html()
        }
    });
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