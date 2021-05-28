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
});

function createPageFromStore()
{
    var APIs = store.get('customAPIs');
    console.log(APIs);
    
    Object.keys(APIs).forEach(function(apiName)
    {
        api = APIs[apiName];

        // Create main card
        $('#mainArea').append('\
        <div class="card shadow mb-4 apiCard" id="apiCard' + apiName + '">\
            <a href="#card' + apiName + '" class="d-block card-header py-3" data-toggle="collapse" role="button" style="user-select: none!important; -webkit-user-drag: none; ">\
                <input style="width: 375px; display: inline;" type="text" class="form-control form-control-user ml-1 apiURL" placeholder="URL" value="">\
            </a>\
            <div class="collapse show ml-1" id="card' + apiName + '">\
                <div class="card-body text-primary">\
                    <button class="btn btn-primary apiGetConfig" type="button" style="display: inline;"><i class="fas fa-search"></i> Attempt Setting Recommended Config</button> <span class="text-xs text-danger">(Only for supported servers)</span>\
                    <hr>\
                    <div class="custom-control custom-checkbox mt-2"><input type="checkbox" class="custom-control-input onOff" id="onOff' + apiName + '"><label class="custom-control-label" for="onOff' + apiName + '">Enabled</label></div>\
                    <div class="mt-1">Reference Name: <input style="width: 375px; display: inline;" type="text" class="form-control form-control-user text-primary apiName" placeholder="API Reference Name (one word)" value="">  <span class="text-xs text-danger">(no spaces)</span></div>\
                    <div class="mt-1">Description: <input style="width: 525px; display: inline;" type="text" class="form-control form-control-user ml-1 apiDescription" placeholder="Description" value=""></div>\
                    <div class="mt-1"><label for="overlayAutoHide">Timeout (ms):</label> <input class="apiTimeout" type="number" min="50" max="10000" value=' + api.timeout + '></div>\
                    <div class="card-body shadow mt-1 sendsCard">\
                        <span class="text-lg">Sends:</span><br>\
                        <div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input playerKey" id="playerKey' + apiName + '"><label class="custom-control-label" for="playerKey' + apiName + '">Hypixel Key <span class="text-danger">(Make sure you trust this server!)</span> <code>(key=)</code></label></div>\
                        <div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input playerName" id="playerName' + apiName + '"><label class="custom-control-label" for="playerName' + apiName + '">Player Name <code>(player=)</code></label></div>\
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
        card.find('apiGetConfig').click(function()
        {
            // TODO: AJAX get config and apply it. 
        });
        
        // Reference Name
        // Disallow spaces, special characters, etc.
        card.find('.apiName').on('input', function(e)
        {
            textVal = $(e.target).val();
            // Check for duplicate reference names
            Object.keys(APIs).forEach(function(a)
            {
                // Don't consider for its own name
                if (a == apiName){ return; }
                if (textVal == a)
                {
                    flashTooltip(e.target, "That name is already in use!", 1500);
                    $(e.target).val(textVal.slice(0, -1));
                    return false;
                }
            });
            // Check for invalid characters
            if (textVal.match(/[^a-zA-Z]/g))
            {
                flashTooltip(e.target, "Invalid character!");
                $(e.target).val(textVal.replace(/[^a-zA-Z]/g, ""));
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

function saveConfigToStore()
{
    APIs = buildListFromPage();
    store.set('customAPIs', APIs)
    infoBarMessage('text-success', 'Saved!', 'Profile settings saved.', 1250);
}

function addNewServer()
{
    // TODO
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