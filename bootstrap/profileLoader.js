$(function()
{
    profileLoad();
});

function profileLoad()
{
    profile = store.get('active_profile');
    listProfile = Object.keys(store.get('profiles'));

    $('#profileDropdown').html(profile);
    $('#dropdownMenu').html('');
    for (var p in listProfile)
    {
        $('#dropdownMenu').append('<a class="dropdown-item" href="#">' + listProfile[p] + '</a>');
    }
    $('.dropdown-item').on('click', function(e){ 
        selected = e.target.innerHTML;
        store.set('active_profile', selected);
        profileLoad();
        updateAllPlayerData(); // from handlePlayer.js
    });
}