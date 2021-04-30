var ipcRenderer = require('electron').ipcRenderer;
const Store = require('electron-store');
const store = new Store();

$(function()
{
    if (store.get('hasUsedOverlay') == undefined)
    {
        $('.mainBody').html('\
        <div class="mainBar" id="dragMe" style="border-radius: 5px; font-size: x-large; background-color: rgba(0, 0, 0, .5); position: absolute; top: 0; right: 0; bottom: 0; left: 0; -webkit-app-region: drag; -webkit-user-select: none; user-select: none;">\
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px;">\
                Hey! It looks like this is your first time using the overlay.<br>\
                You can move this window around by clicking and dragging. Once you click off, its position is set. To re-position it, do <span id="keybind"></span><script>$("#keybind").html(store.get("keybinds").focusOverlay)</script> and drag it again.<br><br>\
                Note: Make sure you have your minecraft client in windowed mode!<br><br>\
                If you don\'t like playing in windowed mode, stay in it anyways, and you can use the "force dynamic fullscreen" option in Overlay Settings to force it to be fullscreen in a way the tool can handle.<br>\
                (This is set by default, so it probably already happened!)\
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
    makeTable($('.mainBody'), data);
    $('tr').each(function(index, row)
    {
        console.log(row)
        if (index == 0)
        {
            return;
        }
        else
        {
            $(row).find('td:first').css('color', data[data.length - 1][index - 1])
        }
    });
});

function makeTable(container, data) {
    var table = $("<table/>").addClass('CSSTableGenerator');
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
    return container.html(table);
}