//store should already be set

const isAccelerator = require("electron-is-accelerator");
const dialog = require('electron').remote.dialog;
const path = require('path');
const fs = require('fs');

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

    if(store.get('enableDarkMode') == true)
    {
        
        $('#enableDarkMode').prop('checked', true)
    }
    else
    {
        $('#enableDarkMode').prop('checked', false)
    }

    $("#enableDarkMode").change(function() {
        if(this.checked) {
            store.set('enableDarkMode', true)
        }
        else
        {
            store.set('enableDarkMode', false)
        }
        window.location.reload();
    });

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
    
    if(store.get('doPartyWhitelisting') == true) // We want it on by default
    {
        
        $('#enablePartyWhitelisting').prop('checked', true)
    }
    else
    {
        $('#enablePartyWhitelisting').prop('checked', false)
    }

    $("#enablePartyWhitelisting").change(function() {
        if(this.checked) {
            store.set('doPartyWhitelisting', true)
        }
        else
        {
            store.set('doPartyWhitelisting', false)
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

    $("#overlayAutoHide").val(store.get('overlayAutoHide'));

    $("#overlayAutoHide").change(function()
    {
        num = $(this).val();

        if (num <= 60 && num >= 0 && num != "") // Max of 60 is kinda arbitrary.
        {
            store.set('overlayAutoHide', num);
        }
        else
        {
            $(this).val(50);
            store.set('overlayAutoHide', 50);
            return false;
        }
    });

    // TODO: At some point, make this system iterate through instead of just defining one-by-one.
    keybinds = store.get('keybinds');
    $( "#kbProfileUp" ).val(keybinds.profUp);
    $( "#kbProfileDown" ).val(keybinds.profDown);
    $( "#kbFocusOverlay" ).val(keybinds.focusOverlay);
    $( "#kbFakeFullscreen" ).val(keybinds.toggleFakeFullscreen);
    $( "#kbShowOverlay" ).val(keybinds.showOverlay);
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
    $( "#kbShowOverlay" ).keydown(function(e) 
    {
        key  = validateKey(e);
        if (key !== false)
        {
            $( "#kbShowOverlay" ).val(key);
            keybinds = store.get('keybinds');
            keybinds.showOverlay = key;
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
    $('#RMkbShowOverlay').click(function()
    {
        $( "#kbShowOverlay" ).val("");
        keybinds = store.get('keybinds');
        keybinds.showOverlay = "";
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

$('.clientSelect').click(function(e)
{
    setClient(e.target.id);
});

function setClient(clientName)
{
    var home;
    if (process.platform == "win32")
    {
        home = process.env['USERPROFILE'];
    }
    else
    {
        home = process.env['HOME'];
    }
    var logPath;
    if (clientName == "clientVanillaForge") { logPath = path.join(home, "/AppData/Roaming/.minecraft/logs/latest.log"); }
    // Ok, I really dont like supporting badlion because of some of their history, but I realize that not doing so only hurts the users.
    // I don't support the devs, but I can't imagine this helps them too much.
    else if (clientName == "clientBadlion") { logPath = path.join(home, "/AppData/Roaming/.minecraft/logs/blclient/minecraft/latest.log"); }
    else if (clientName == "clientLunar") { logPath = path.join(home, "/.lunarclient/offline/1.8/logs/latest.log"); }
    else if (clientName == "clientPVPLounge") { logPath = path.join(home, "/AppData/Roaming/.pvplounge/logs/latest.log"); }
    console.log(logPath);
    if (!fs.existsSync(logPath))
    {
        console.log('Logfile does not exist.');
        infoBarMessage('text-danger', 'Logfile Path Not Found', 'The path was not found! Make sure you\'ve started this client before. If you need help, join our Discord.', 7500);
    }
    else
    {
        $('#inputPath').val(logPath);
        store.set('logPath', logPath);
        ipcRenderer.send('logPathChanged');
        infoBarMessage('text-success', 'Success', 'The path was set!', 5000);
    }
}


$('#setPathButton').click(function()
{
    defPath = $('#inputPath').val();
    if (!fs.existsSync(defPath))
    {
        defPath = process.env['USERPROFILE'];
    }
    dialog.showOpenDialog(
        { 
            title: 'Select Path',
            defaultPath: defPath,
            properties: ['openFile'],
            properties: []
        }
    ).then(result => {
        if (!result.canceled) {
            $('#inputPath').val(result.filePaths[0]);
            store.set('logPath', result.filePaths[0]);
            infoBarMessage('text-success', "Success", "Path Set!", 5000);
            ipcRenderer.send('logPathChanged');
        }
    }).catch(err => {
        console.error(err);
    });
});

ipcRenderer.on('setNewAPIKey', function (event,new_api_key)
{
    // Wait a little so it's set.
    setTimeout(
        function() {
            $('#inputApiKey').val(store.get("hypixel_key"));
        }, 100);    
});