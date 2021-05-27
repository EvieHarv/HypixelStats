// Startup
$(function()
{
    createListFromStore();

    $('#saveAllChanges').click(function()
    {
        saveConfigToStore();
    });

    $('#addNew').click(function()
    {
        addNewServer();
    });
});

function createListFromStore()
{
    var APIs = store.get('customAPIs');
    console.log(APIs);
    
    Object.keys(APIs).forEach(function(apiName)
    {
        api = APIs[apiName];
        $('#mainArea').append('\
        <div class="card shadow mb-4" id="apiCard' + apiName + '">\
            <a href="#card' + apiName + '" class="d-block card-header py-3" data-toggle="collapse" role="button">\
            </a>\
            <div class="collapse show" id="card' + apiName + '">\
                <div class="card-body text-primary">\
                    <span class="text-danger"><strong>Loading...</strong></span>\
                </div>\
            </div>\
        </div>')
    
        card = $('#apiCard' + apiName);

        // ----------------
        // Add all elements
        // ----------------

        // URL
        card.find('.card-header').html('<div class="mt-1"><input style="width: 375px; display: inline;" type="text" class="form-control form-control-user ml-1 apiURL" placeholder="URL" value="' + api.url + '"></div>');
        
        // remove "loading..." from card body
        card.find('.card-body').html('');
        
        // On/Off switch
        card.find('.card-body').append('<div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input onOff" id="onOff' + apiName + '"><label class="custom-control-label" for="onOff' + apiName + '">Enabled</label></div>');
        if (api.on) { card.find('.onOff').prop( "checked", true ); } 
        
        // API internal name
        card.find('.card-body').append('<div class="mt-1">Reference Name: <input style="width: 375px; display: inline;" type="text" class="form-control form-control-user text-primary apiName" placeholder="API Reference Name (one word)" value="' + apiName + '">  <span class="text-xs text-danger">(no spaces)</span></div>');

        // Description
        card.find('.card-body').append('<div class="mt-1">Description: <input style="width: 525px; display: inline;" type="text" class="form-control form-control-user ml-1 apiDescription" placeholder="Description" value="' + api.description + '"></div>');

        // Timeout
        card.find('.card-body').append('<div class="mt-1"><label for="overlayAutoHide">Timeout (ms):</label> <input class="apiTimeout" type="number" min="50" max="10000" value=' + api.timeout + '></div>');

        // create card element for the below to be put into
        card.find('.card-body').append('<div class="card-body shadow mt-1 sendsCard"></div>'); 
        // Title
        card.find('.sendsCard').html('<span class="text-lg">Sends:</span><br>')
        // key
        card.find('.sendsCard').append('<div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input playerKey" id="playerKey' + apiName + '"><label class="custom-control-label" for="playerKey' + apiName + '">Hypixel Key <span class="text-danger">(Make sure you trust this server!)</span> <code>(key=)</code></label></div>');
        if (api.sends['userKey']) { card.find('.playerKey').prop( "checked", true ); } 
        // name
        card.find('.sendsCard').append('<div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input playerName" id="playerName' + apiName + '"><label class="custom-control-label" for="playerName' + apiName + '">Player Name <code>(player=)</code></label></div>');
        if (api.sends['playerName']) { card.find('.playerName').prop( "checked", true ); } 
        // uuid
        card.find('.sendsCard').append('<div class="custom-control custom-checkbox"><input type="checkbox" class="custom-control-input playerUUID" id="playerUUID' + apiName + '"><label class="custom-control-label" for="playerUUID' + apiName + '">Player UUID <code>(uuid=)</code></label></div>');
        if (api.sends['playerUUID']) { card.find('.playerUUID').prop( "checked", true ); } 
    });
}

function buildListFromPage()
{
    // Create an "APIs" object, same format as store.get('customAPIs');
    // TODO
}

function saveConfigToStore()
{
    APIs = buildListFromPage();
    infoBarMessage('text-success', 'Success!', 'Profile settings saved.', 1250);
}

function addNewServer()
{
    // TODO
}