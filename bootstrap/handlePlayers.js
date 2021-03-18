// store already defined by this point
var ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('playerList', function (event,playerList) 
{
    updatePlayerArea(playerList);
});

ipcRenderer.on('clearList', function (event) 
{
    $(".playerList").html("");
});

function updatePlayerArea(playerList)
{
    $(".playerCard").each(function(card) // Keep old card data if player still in, delete data if card is no longer relevent
    {
        if ($(".playerCard")[card] == undefined) // Honestly not 100% sure where this comes from but handle it anyways. I'm tired don't judge me.
        {
            return;
        }
        if(playerList.includes(($(".playerCard")[card].getAttribute('player')))) // If card for this player exists already, keep and ignore
        {
            const index = playerList.indexOf($(".playerCard")[card].getAttribute('player'));
            if (index > -1) {
                playerList.splice(index, 1);
            }
        }
        else 
        {
            $(".playerCard")[card].remove(); // Remove a card for a player who doesn't exist anymore
        }
    });
    playerList.forEach(function(player)
    {
        $(".playerList").append('\
            <div class="col-xl-3 col-md-6 mb-4 playerCard" player="' + player + '" uuid="">\
                <div class="card border-left-success shadow h-100 py-2">\
                    <div class="card-body">\
                        <div class="row no-gutters align-items-center">\
                            <div class="col mr-2">\
                                <div class="font-weight-bold text-success mb-1">' + player + '</div>\
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

            $("[player='" + player + "']").attr('uuid', uuid);
            $("[player='" + player + "']").find('.fkdr').html(fkdr);
            $("[player='" + player + "']").find('.winstreak').html(winstreak);
        }
    });
}