//store should already be set

$('#setKeyButton').click(function()
{ 
    console.log("Setting " + $('#inputApiKey').val() + " as new API key.");
    store.set('hypixel_key', $('#inputApiKey').val());

    var uuid = null;
    $.ajax({
        url: "https://api.hypixel.net/key?key=" + $('#inputApiKey').val(),
        contentType: "application/json",
        dataType: 'json',
        success: function(result){
            uuid = result.record.owner;
            if (uuid == null)
            {
                store.set("key_owner", "N/A");
                $('.myPlayerName').html(store.get("key_owner"));
                infoBarMessage('text-danger', "API Key Error", "The API Key could not be verified. Please ensure you're using the right key, and try again in a moment.", 7500);
                return;
            }
            else
            {
                store.set('key_owner_uuid', uuid)
                $.ajax({
                    url: "https://api.mojang.com/user/profile/" + uuid,
                    async: false,
                    contentType: "application/json",
                    dataType: 'json',
                    success: function(result){
                        store.set("key_owner", result.name);
                        $('.myPlayerName').html(store.get("key_owner"));
                        infoBarMessage('text-success', "API Key Success", "API Key Set Successfully!", 5000);
                    },
                    error: function(jqXHR, textStatus, errorThrown)
                    {
                        store.set("key_owner", "N/A");
                        $('.myPlayerName').html(store.get("key_owner"));
                        infoBarMessage('text-danger', "API Key Error", "The API Key could not be verified. Please ensure you're using the right key, and try again in a moment.", 7500);
                    },
                    timeout: 1500
                })
                .fail(function(jqXHR, textStatus, errorThrown)
                {
                    store.set("key_owner", "N/A");
                    $('.myPlayerName').html(store.get("key_owner"));
                    infoBarMessage('text-danger', "API Key Error", "The API Key could not be verified. Please ensure you're using the right key, and try again in a moment.", 7500);
                });
            }        
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
            // Handle?
        },
        timeout: 1500
    });
});

$(function()
{
    $('#inputApiKey').val(store.get("hypixel_key"));
    $('#inputPath').val(store.get("logPath"));

    if(store.get('disableAutoWho') != true) // We want it on by default
    {
        
        $('#enableAutoWho').prop('checked', true)
    }
    else
    {
        $('#enableAutoWho').prop('checked', false)
    }

    $("#enableAutoWho").change(function() {
        if(this.checked) {
            store.set('disableAutoWho', false)
        }
        else
        {
            store.set('disableAutoWho', true)
        }
    });


    udbState = store.get("undefinedBehavior");

    if (udbState == undefined)
    {
        $('#hideLabel').prop('checked', true)
        $('#showBlank').prop('checked', false)
        $('#showNA').prop('checked', false)
    }
    else if (udbState == 'blank')
    {
        $('#hideLabel').prop('checked', false)
        $('#showBlank').prop('checked', true)
        $('#showNA').prop('checked', false)
    }
    else if (udbState == 'na')
    {
        $('#hideLabel').prop('checked', false)
        $('#showBlank').prop('checked', false)
        $('#showNA').prop('checked', true)
    }

    $("#hideLabel").change(function(e) {
        // It's already default
        if (store.get("undefinedBehavior") == undefined)
        {
            $('#hideLabel').prop('checked', true)
            return;
        }
        else if(this.checked) 
        {
            // Set back to default
            store.delete('undefinedBehavior');
            
            $('#hideLabel').prop('checked', true)
            $('#showBlank').prop('checked', false)
            $('#showNA').prop('checked', false)
        }
    });
    $("#showBlank").change(function() {
        if (store.get("undefinedBehavior") == "blank")
        {
            $('#showBlank').prop('checked', true)
            return;
        }
        else if(this.checked) 
        {
            // Set
            store.set('undefinedBehavior', 'blank');

            $('#hideLabel').prop('checked', false)
            $('#showBlank').prop('checked', true)
            $('#showNA').prop('checked', false)
        }
    });
    $("#showNA").change(function() {
        if (store.get("undefinedBehavior") == "na")
        {
            $('#showNA').prop('checked', true)
            return;
        }
        else if(this.checked) 
        {
            // Set
            store.set('undefinedBehavior', 'na');

            $('#hideLabel').prop('checked', false)
            $('#showBlank').prop('checked', false)
            $('#showNA').prop('checked', true)
        }
    });

});

$('#inputPath').on("keypress", function(e) {
    if (e.keyCode == 13) {
        $('#setPathButton').click(); // Same thing as clicking the button manually
        return false; // prevent the button click from happening
    }
});

$('#setPathButton').click(function()
{
    store.set('logPath', $('#inputPath').val());
    infoBarMessage('text-success', "Success", "Path Set Successfully!", 5000);
});

ipcRenderer.on('setNewAPIKey', function (event,new_api_key)
{
    // Wait a little so it's set.
    setTimeout(
        function() {
            $('#inputApiKey').val(store.get("hypixel_key"));
        }, 100);    
});