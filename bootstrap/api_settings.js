//store should already be set
function infoBarMessage(textType, heading, message, timeMs)
{
    $("#infoBarHolder").append('\
                <div class="card shadow mb-4" id="infoBar" style="display: none;"">\
                    <div class="card-header py-3">\
                        <h6 class="m-0 font-weight-bold '+textType+'" id="infoHeading">'+ heading +'</h6>\
                    </div>\
                    <div class="card-body py-3">\
                        <p class="mb-0 '+textType+'" id="infoMessage">'+ message +'</p>\
                    </div>\
                </div>');
    var div = $("#infoBarHolder").children().last();
    div.fadeIn(500).delay(timeMs);
    div.fadeOut(500);
    setTimeout(function(){div.remove()}, timeMs+1000);
}


$('#setKeyButton').click(function()
{ 
    console.log("Setting " + $('#inputApiKey').val() + " as new API key.");
    store.set('hypixel_key', $('#inputApiKey').val());

    var uuid = null;
    $.ajax({
        url: "https://api.hypixel.net/key?key=" + $('#inputApiKey').val(),
        async: false,
        contentType: "application/json",
        dataType: 'json',
        success: function(result){
            uuid = result.record.owner;
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
            // Handle?
        }
    });
    if (uuid == null)
    {
        store.set("key_owner", "N/A");
        $('.myPlayerName').html(store.get("key_owner"));
        infoBarMessage('text-danger', "API Key Error", "The API Key could not be verified. Please ensure you're using the right key, and try again in a moment.", 7500);
        return;
    }
    else
    {
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
        })
        .fail(function(jqXHR, textStatus, errorThrown)
        {
            store.set("key_owner", "N/A");
            $('.myPlayerName').html(store.get("key_owner"));
            infoBarMessage('text-danger', "API Key Error", "The API Key could not be verified. Please ensure you're using the right key, and try again in a moment.", 7500);
        });
    }
});

$(function()
{
    $('#inputApiKey').val(store.get("hypixel_key"));
});
