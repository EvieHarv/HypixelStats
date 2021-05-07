//store should already be set

const isAccelerator = require("electron-is-accelerator");

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

    if (store.get('fakeFullscreen') == true)
    {
        $("#fakeFullscreen").prop('checked', true);
    }

    $("#fakeFullscreen").change(function()
    {
        if (this.checked)
        {
            $("#fakeFullscreen").prop('checked', true);
            store.set('fakeFullscreen', true);
        }
        else
        {
            store.delete('fakeFullscreen');
        }    
    });

    keybinds = store.get('keybinds');
    $( "#kbProfileUp" ).val(keybinds.profUp);
    $( "#kbProfileDown" ).val(keybinds.profDown);
    $( "#kbFocusOverlay" ).val(keybinds.focusOverlay);
    $( "#kbFakeFullscreen" ).val(keybinds.toggleFakeFullscreen);
    $( "#kbLobbyMode" ).val(keybinds.lobbyMode);

    $( "#kbProfileUp" ).keydown(function(e) 
    {
        key  = validateKey(e);
        if (key !== false)
        {
            $( "#kbProfileUp" ).val(key);
            keybinds = store.get('keybinds');
            keybinds.profUp = key;
            store.set('keybinds', keybinds);
            ipcRenderer.send('keybindsChanged');
        };
        return false;
    });
    $( "#kbProfileDown" ).keydown(function(e) 
    {
        key  = validateKey(e);
        if (key !== false)
        {
            $( "#kbProfileDown" ).val(key);
            keybinds = store.get('keybinds');
            keybinds.profDown = key;
            store.set('keybinds', keybinds);
            ipcRenderer.send('keybindsChanged');
        };
        return false;
    });
    $( "#kbFocusOverlay" ).keydown(function(e) 
    {
        key  = validateKey(e);
        if (key !== false)
        {
            $( "#kbFocusOverlay" ).val(key);
            keybinds = store.get('keybinds');
            keybinds.focusOverlay = key;
            store.set('keybinds', keybinds);
            ipcRenderer.send('keybindsChanged');
        };
        return false;
    });
    $( "#kbFakeFullscreen" ).keydown(function(e) 
    {
        key  = validateKey(e);
        if (key !== false)
        {
            $( "#kbFakeFullscreen" ).val(key);
            keybinds = store.get('keybinds');
            keybinds.toggleFakeFullscreen = key;
            store.set('keybinds', keybinds);
            ipcRenderer.send('keybindsChanged');
        };
        return false;
    });
    $( "#kbLobbyMode" ).keydown(function(e) 
    {
        key  = validateKey(e);
        if (key !== false)
        {
            $( "#kbLobbyMode" ).val(key);
            keybinds = store.get('keybinds');
            keybinds.lobbyMode = key;
            store.set('keybinds', keybinds);
            ipcRenderer.send('keybindsChanged');
        };
        return false;
    });


    $('#RMkbProfileUp').click(function()
    {
        $( "#kbProfileUp" ).val("");
        keybinds = store.get('keybinds');
        keybinds.profUp = "";
        store.set('keybinds', keybinds);
        ipcRenderer.send('keybindsChanged');
    });
    $('#RMkbProfileDown').click(function()
    {
        $( "#kbProfileDown" ).val("");
        keybinds = store.get('keybinds');
        keybinds.profDown = "";
        store.set('keybinds', keybinds);
        ipcRenderer.send('keybindsChanged');
    });
    $('#RMkbFocusOverlay').click(function()
    {
        $( "#kbFocusOverlay" ).val("");
        keybinds = store.get('keybinds');
        keybinds.focusOverlay = "";
        store.set('keybinds', keybinds);
        ipcRenderer.send('keybindsChanged');
    });
    $('#RMkbFakeFullscreen').click(function()
    {
        $( "#kbFakeFullscreen" ).val("");
        keybinds = store.get('keybinds');
        keybinds.toggleFakeFullscreen = "";
        store.set('keybinds', keybinds);
        ipcRenderer.send('keybindsChanged');
    });
    $('#RMkbLobbyMode').click(function()
    {
        $( "#kbLobbyMode" ).val("");
        keybinds = store.get('keybinds');
        keybinds.lobbyMode = "";
        store.set('keybinds', keybinds);
        ipcRenderer.send('keybindsChanged');
    });

});

function validateKey(e)
{
    keybind = "";

    if (e.keyCode == 8)
    {
        return "";
    }
    if (e.metaKey)
    {
        return false;
    }

    x = e.keyCode;
    if (x >= 16 && x <=18)
    {
        return false;
    }
    if (e.ctrlKey)
    {
        keybind += "Control+";
    }
    if (e.altKey)
    {
        keybind += "Alt+";
    }
    if (e.shiftKey)
    {
        keybind += "Shift+";
    }

    keybind += e.key.toUpperCase();

    if (!isAccelerator(keybind))
    {
        return false;
    }

    return keybind;
}

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