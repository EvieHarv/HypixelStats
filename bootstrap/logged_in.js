const Store = require('electron-store');

const store = new Store();

$(function()
{
    $('.myPlayerName').html(store.get("key_owner"));
});