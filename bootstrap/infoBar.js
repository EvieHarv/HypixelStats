function infoBarMessage(textType, heading, message, timeMs)
{
    $("#infoBarHolder").append('\
                <div class="card shadow mb-4" id="infoBar" style="display: none;">\
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
};