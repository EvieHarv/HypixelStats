// Startup
$(function()
{
    createPageFromStore();

    $('#saveAllChanges').click(function()
    {
        saveConfigToStore();
    });

    $('#addNew').click(function()
    {
        addNewServer();
    });

    $('.leavePageLink').click(function(e){ saveConfigToStore(); return true; }); // Save on leave
});

function createPageFromStore()
{
    var APIs = store.get('customAPIs');

    $('#mainArea').html('');
    
    Object.keys(APIs).forEach(function(apiName)
    {
        api = APIs[apiName];

        // Create main card
        $('#mainArea').append('\
        <div class="card shadow mb-4 apiCard" id="apiCard' + apiName + '" orig-apiname="' + apiName + '">\
            <a href="#card' + apiName + '" class="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" style="user-select: none!important; -webkit-user-drag: none; ">\
                <input style="width: 375px; display: inline;" type="text" class="form-control form-control-user ml-1 apiURL" placeholder="URL" value="">\
            </a>\
            <div class="collapse ml-1" id="card' + apiName + '">\
                <div class="card-body text-primary">\
                    <button class="btn btn-primary apiGetConfig" type="button" style="display: inline;"><i class="fas fa-search"></i> Attempt Setting Recommended Config</button> <span class="text-xs text-danger">(Only for supported servers)</span>\
                    <button class="btn btn-danger apiRemove" type="button" style="display: inline; float: right;"><i class="fas fa-trash"></i> Delete</button>\
                    <hr>\
                    <div class="custom-control custom-checkbox mt-2"><input type="checkbox" class="custom-control-input onOff" id="onOff' + apiName + '"><label class="custom-control-label" for="onOff' + apiName + '">Enabled</label></div>\
                    <div class="mt-1">Reference Name: <input style="width: 375px; display: inline;" type="text" class="form-control form-control-user text-primary apiName" placeholder="API Reference Name (one word)" value="">  <span class="text-xs text-danger">(no spaces)</span></div>\
                    <div class="mt-1">Description: <input style="width: 525px; display: inline;" type="text" class="form-control form-control-user ml-1 text-primary apiDescription" placeholder="Description" value=""></div>\
                    <div class="mt-1"><label for="overlayAutoHide">Timeout (ms):</label> <input class="apiTimeout" type="number" min="50" max="10000" value=' + api.timeout + '></div>\
                    <div class="card-body shadow mt-1 sendsCard">\
                        <span class="text-lg">Sends:</span><br>\
                        <div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input playerKey" id="playerKey' + apiName + '"><label class="custom-control-label" for="playerKey' + apiName + '">Hypixel Key <span class="text-danger">(Make sure you trust this server!)</span> <code>(key=)</code></label></div>\
                        <div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input playerName" id="playerName' + apiName + '"><label class="custom-control-label" for="playerName' + apiName + '">Player Name <code>(name=)</code></label></div>\
                        <div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input playerUUID" id="playerUUID' + apiName + '"><label class="custom-control-label" for="playerUUID' + apiName + '">Player UUID <code>(uuid=)</code></label></div>\
                    </div>\
                </div>\
            </div>\
        </div>')
    
        card = $('#apiCard' + apiName);

        // ------------
        // Set Elements
        // ------------

        // "Title"/URL
        card.find('.apiURL').val(api.url);
        // On/Off switch
        if (api.on) { card.find('.onOff').prop( "checked", true ); } 
        // Reference Name
        card.find('.apiName').val(apiName);
        // Description
        card.find('.apiDescription').val(api.description);
        // Sends:
        // key
        if (api.sends['userKey']) { card.find('.playerKey').prop( "checked", true ); } 
        // name
        if (api.sends['playerName']) { card.find('.playerName').prop( "checked", true ); } 
        // uuid
        if (api.sends['playerUUID']) { card.find('.playerUUID').prop( "checked", true ); } 

        // ----------------------
        // Register Needed Events
        // ----------------------

        // Prevent card from collpasing when you click on the card URL
        card.find('.apiURL').on('click', function()
        {
            return false;
        });

        // "Title"/URL
        // Disallow spaces
        card.find('.apiURL').on('keypress', function(e)
        {
            if (e.key == " ")
            {
                flashTooltip(e.target, 'Spaces not allowed in URL');
                return false;
            }
        });

        // Attempt to get recommended config
        card.find('.apiGetConfig').click(function(e)
        {
            setConfigFromCardUrl($(e.target).closest('.apiCard'));
        });

        card.find('.apiRemove').click(function(e)
        {
            dimPage();
            showNotificationBox('\
                <h1 class="text-danger">Are you sure you want <br>to delete this server?</h1>\
                <div style="float: right;">\
                    <button class="btn btn-primary mb-0 notifBoxCancel" type="button">Cancel</button>\
                    <button class="btn btn-danger mb-0 notifBoxDelete" type="button">Delete</button>\
                </div>'
            );
            $('.notifBoxCancel').click(function()
            {
                undimPage();
                hideNotifcationBox();
            });
            $('.notifBoxDelete').click(function()
            {
                // Get the original apiName of the card.
                del = $(e.target).closest('.apiCard').attr('orig-apiname');
                // Get the most up-to-date list.
                delAPIs = store.get('customAPIs');
                // Delete.
                delete delAPIs[del];

                store.set('customAPIs', delAPIs);

                undimPage();
                hideNotifcationBox();
                createPageFromStore();
            });
        });
        
        // Reference Name
        // Disallow spaces, special characters, etc.
        card.find('.apiName').on('input', function(e)
        {
            textVal = $(e.target).val();
            // Check for duplicate reference names
            Object.keys(APIs).forEach(function(a)
            {
                // Check name, but don't consider for its own name
                if (textVal == a && a !== apiName)
                {
                    flashTooltip(e.target, "That name is already in use!", 1500);
                    $(e.target).val(textVal.slice(0, -1));
                    return false;
                }
            });
            // Check for invalid characters
            if (textVal.match(/[^a-zA-Z0-9_]/g))
            {
                flashTooltip(e.target, "Invalid character!");
                $(e.target).val(textVal.replace(/[^a-zA-Z0-9_]/g, ""));
                return false;
            }
        });

        // Timeout
        // Set Bounds
        card.find('.apiTimeout').change(function(e)
        {
            num = $(this).val();
    
            if (!(num <= 10000 && num >= 50 && num != "")) // Max of 10k is kinda arbitrary.
            {
                flashTooltip(e.target, "Number must be between 50 and 10,000 ms");
                $(this).val(1000);
                return false;
            }
        });
    });
}

function buildListFromPage()
{
    // Create an "APIs" object, same format as store.get('customAPIs');
    
    var APIs = {};

    // Iterate through cards
    $('.apiCard').each(function(index, cardTarget)
    {
        // Make into jquery object
        var card = $(cardTarget); 

        // Assign data
        // At this point we assume all data is safe.
        const url = card.find('.apiURL').val();
        const on = card.find('.onOff').prop('checked');
        const apiName = card.find('.apiName').val(); // aka refName
        const description = card.find('.apiDescription').val();
        const timeout = card.find('.apiTimeout').val();
        const sendsKey = card.find('.playerKey').prop('checked');
        const sendsName = card.find('.playerName').prop('checked');
        const sendsUUID = card.find('.playerUUID').prop('checked');

        APIs[apiName] = 
        {
            "on" : on,
            "url" : url,
            "description" : description,
            "timeout" : Number(timeout),
            "sends":
            {
                "userKey" : sendsKey,
                "playerName" : sendsName,
                "playerUUID" : sendsUUID
            }
        }
    });

    return APIs;
}

function setConfigFromCardUrl(card)
{
    var url = card.find('.apiURL').val();
    const currentAPIs = store.get('customAPIs');

    var apiData;

    // Add https if not present
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    $.ajax({
        url: url + "?getConfig",
        contentType: "application/json",
        async: false,
        dataType: 'json',
        success: function(result){
            apiData = result;
        },
        error: function (apiData, textStatus, errorThrown) 
        {
            console.warn('URL "' + url + '" failed to resolve "?getConfig".');
            apiData = null;
        },
        timeout: 2500
    });

    if (apiData == null)
    {
        infoBarMessage('text-danger', 'Failed to Get Config', 'The URL failed to return a valid config. You may either have a wrong URL, or the specified URL does not have a recommended config to set (this is true for any of the Hypixel APIs).', 5000)
        return false;
    }
    else
    {
        try 
        {
            // TODO: Validate this input
            var apiName = apiData.config.apiName; // Reference name, has to be unique.
            const onOff = apiData.config.on;
            const description = apiData.config.description;
            const timeout = apiData.config.timeout;
            const sendsKey = apiData.config.sends.userKey;
            const sendsName = apiData.config.sends.playerName;
            const sendsUUID = apiData.config.sends.playerUUID;

            // Check that apiName is unique. Keep adding underscores until it is
            doAgain = true;
            while (doAgain)
            {
                doAgain = false;
                Object.keys(currentAPIs).forEach(function(name)
                {
                    // If the name it finds already exists AND is not apart of the current card (it can set to itself)
                    if (apiName == name && apiName !== card.find('.apiName').val())
                    {
                        // It isn't unique
                        apiName = apiName + "_"; 
                        doAgain = true;
                        infoBarMessage('text-primary', "Config Non-Default.", "The server's requested reference name was already taken, so an underscore was added.", 6000);
                    };
                });
            }

            card.find('.apiURL').val(url);
            if (onOff) { card.find('.onOff').prop( "checked", true ); } else { card.find('.onOff').prop( "checked", false ); }
            card.find('.apiName').val(apiName); // aka refName
            card.find('.apiDescription').val(description);
            card.find('.apiTimeout').val(timeout);
            card.find('.playerKey').prop('checked');
            card.find('.playerName').prop('checked');
            card.find('.playerUUID').prop('checked');
            if (sendsKey) { card.find('.playerKey').prop( "checked", true ); } else { card.find('.playerKey').prop( "checked", false ); }
            if (sendsName) { card.find('.playerName').prop( "checked", true ); } else { card.find('.playerName').prop( "checked", false ); }
            if (sendsUUID) { card.find('.playerUUID').prop( "checked", true ); } else { card.find('.playerUUID').prop( "checked", false ); }

            saveConfigToStore();
        } 
        catch (error) 
        {
            infoBarMessage('text-danger', 'Failed to Get Config', 'The URL failed to return a valid config. You may either have a wrong URL, or the specified URL does not have a recommended config to set (this is true for any of the Hypixel APIs).', 5000)
            return false;    
        }
    }
}

function saveConfigToStore()
{
    APIs = buildListFromPage();
    store.set('customAPIs', APIs)
    infoBarMessage('text-success', 'Saved!', 'Profile settings saved.', 1250);
    createPageFromStore();
}

function addNewServer()
{
    var APIs = store.get('customAPIs');

    var apiName = 'myServer'; // Reference name, has to be unique.
    const url = "";
    const onOff = true;
    const description = 'My Custom Server';
    const timeout = 1000;
    const sendsKey = false;
    const sendsName = false;
    const sendsUUID = false;

    // Check that apiName is unique. Keep adding underscores until it is
    doAgain = true;
    while (doAgain)
    {
        doAgain = false;
        Object.keys(APIs).forEach(function(name)
        {
            // If the name it finds already exists
            if (apiName == name)
            {
                // It isn't unique
                apiName = apiName + "_"; 
                doAgain = true;
            };
        });
    }

    APIs[apiName] = 
    {
        "on" : onOff,
        "url" : url,
        "description" : description,
        "timeout" : Number(timeout),
        "sends":
        {
            "userKey" : sendsKey,
            "playerName" : sendsName,
            "playerUUID" : sendsUUID
        }
    }

    store.set('customAPIs', APIs)

    createPageFromStore();
}

var tooltipTimeout;

function flashTooltip(target, text, time=1000)
{
    clearTimeout(tooltipTimeout);
    $(target).tooltip('dispose');
    $(target).tooltip({ title: text, trigger: "manual", html: true });
    $(target).tooltip('show');
    tooltipTimeout = setTimeout(function(){$('.tooltip').tooltip('hide');}, time);
}

function dimPage() {
    document.getElementById("overlay").style.display = "block";
}
  
function undimPage() {
    document.getElementById("overlay").style.display = "none";
}

function showNotificationBox(html)
{
    $("#notificationBox").html('\
    <div class="mb-4" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: auto; z-index: 3;">\
        <div class="card border-danger shadow h-100 py-2">\
            <div class="card-body">\
                <div class="no-gutters align-items-center">\
                    <div class="mr-2" style="width: 100%;">\
                    ' + html + '\
                    </div>\
                </div>\
            </div>\
        </div>\
    </div>\
    ');
}

function hideNotifcationBox()
{
    $("#notificationBox").html("");
}