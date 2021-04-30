var ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('lostFocus', function (event)
{
    document.getElementById("dragMe").remove();
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