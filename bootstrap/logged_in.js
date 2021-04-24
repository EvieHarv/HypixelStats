var ipcRenderer = require('electron').ipcRenderer;

const Store = require('electron-store');

const store = new Store();

$(function()
{
    $('.myPlayerName').html(store.get("key_owner"));
});

ipcRenderer.on('setNewAPIKey', function (event,new_api_key) 
{
    console.log("Setting " + new_api_key + " as new API key.");
    store.set('hypixel_key', new_api_key);

    var uuid = null;
    $.ajax({
        url: "https://api.hypixel.net/key?key=" + new_api_key,
        contentType: "application/json",
        dataType: 'json',
        success: function(result){
            uuid = result.record.owner;
            if (uuid == null)
            {
                store.set("key_owner", "N/A");
                $('.myPlayerName').html(store.get("key_owner"));
                return;
            }
            else
            {
                store.set('key_owner_uuid', uuid)
                $.ajax({
                    url: "https://api.mojang.com/user/profile/" + uuid,
                    contentType: "application/json",
                    dataType: 'json',
                    success: function(result){
                        store.set("key_owner", result.name);
                        $('.myPlayerName').html(store.get("key_owner"));
                    },
                    error: function(jqXHR, textStatus, errorThrown)
                    {
                        store.set("key_owner", "N/A");
                        $('.myPlayerName').html(store.get("key_owner"));
                    },
                    timeout: 1500
                })
                .fail(function(jqXHR, textStatus, errorThrown)
                {
                    store.set("key_owner", "N/A");
                    $('.myPlayerName').html(store.get("key_owner"));
                })
            }        
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
            // Handle?
        },
        timeout: 1500
    });
});