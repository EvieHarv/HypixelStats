var ipcRenderer = require('electron').ipcRenderer;
const Store = require('electron-store');
const store = new Store();

var timeout;

var has_focus = true;
window.onblur = function(){  
    has_focus=false;
    doFade();
}  
window.onfocus = function(){  
    has_focus=true;
    $('.mainBody').fadeIn('fast');
}

$(function()
{
    if (store.get('hasUsedOverlay') == undefined)
    {
        $('.mainBody').html('\
        <div class="mainBar" id="dragMe" style="border-radius: 5px; font-size: x-large; background-color: rgba(0, 0, 0, .9); position: absolute; top: 0; right: 0; bottom: 0; left: 0; -webkit-app-region: drag; -webkit-user-select: none; user-select: none;">\
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px;">\
                Hey! It looks like this is your first time using the overlay.<br>\
                You can move this window around by clicking and dragging. Once you click off, its position is set. To re-position it, do <span id="keybind"></span><script>$("#keybind").html(store.get("keybinds").focusOverlay)</script> and drag it again.<br><br>\
                <h1>Note: Make sure you have your minecraft client in windowed mode!</h1><br><br>\
                If you don\'t like playing in windowed mode, MAKE SURE you\'re in it anyways before launching the overlay, and you can use the "Fake Fullscreen" option in Application Settings to force it to be fullscreen in a way the tool can handle. (It looks identical to fullscreen and has almost no downsides).<br><br>\
                You can do <span id="keybind2"></span><script>$("#keybind2").html(store.get("keybinds").toggleFakeFullscreen)</script> to toggle fake fullscreen on and off.\
            </div>\
        </div>\
        ');
        store.set('hasUsedOverlay', true);
        ipcRenderer.on('lostFocus', function (event, data)
        {
            ipcRenderer.send('requestData');
        });
    }
    else
    {
        ipcRenderer.send('requestData');
    }
});

ipcRenderer.on('playerData', function (event, data)
{
    $('.mainBody').fadeIn('fast');
    $('.mainBody').html("<table class='profDisplay'><tbody><th style='text-align: center;'><u>" + store.get("active_profile") + "</u></th></tbody></table>"); // a bit hack-y
    $('.mainBody').append(makeTable(data));
    $('tr').each(function(index, row)
    {
        if (index <= 1)
        {
            return;
        }
        else
        {
            $(row).find('td:first').css('color', data[data.length - 1][index - 1 - 1])
        }
    });

    doFade();
});

function doFade()
{
    hideTime = store.get("overlayAutoHide") * 1000;

    if (hideTime == 0)
    {
        clearTimeout(timeout);
        return; // Never fade if overlayAutoHide == 0 seconds
    }
    else
    {
        clearTimeout(timeout);
        if (!has_focus)
        {
            timeout = setTimeout(function()
            { 
                $('.mainBody').fadeOut('slow'); 
            }, hideTime);
        }
    }
}

function makeTable(data) {
    var table = $("<table/>").addClass('TableGen');
    $.each(data, function(rowIndex, r) {
        if (rowIndex < data.length - 1)
        {
            var row = $("<tr/>");
            $.each(r, function(colIndex, c) { 
                row.append($("<t"+(rowIndex == 0 ?  "h" : "d")+"/>").text(c));
            });
            table.append(row);
        }
    });
    return table;
}