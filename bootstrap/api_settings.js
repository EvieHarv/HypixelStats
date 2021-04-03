$(function()
{
    profileLoad(); // Load in all existing profiles to start'
    var el = document.getElementById('statCardsDiv')
    var sortable = Sortable.create(el, 
        {
            animation: 150
        });
});

function profileLoad()
{
    profs = store.get('profiles');
    profile = store.get('active_profile');
    listProfile = Object.keys(store.get('profiles'));

    $('#profileNameField').val(profile);
    $('#profileDropdown').html(profile);
    $('#profileDropdownMenu').html('');
    for (var p in listProfile)
    {
        $('#profileDropdownMenu').append('<a class="dropdown-item" href="javascript:void(0)">' + listProfile[p] + '</a>');
    }
    $('.dropdown-item').on('click', function(e){ 
        selected = e.target.innerHTML;
        store.set('active_profile', selected);
        profileLoad();
    });
    $('#statCardsDiv').html('');
    for (var p in profs[profile].stats)
    {
        $('#statCardsDiv').append('\
            <div class="mb-4 statCard" style="width: 100%">\
                <div class="card border-left-primary shadow h-100 py-2">\
                    <div class="card-body">\
                        <div class="no-gutters align-items-center">\
                            <div class="mr-2" style="width: 100%;">\
                                <input type="text" class="form-control form-control-user mb-1 text-dark statName" stat="' + p + '" placeholder="Display Name" value="' + p + '"></input>\
                                <input type="text" class="form-control form-control-user mb-1 text-primary statData" stat="' + p + '" placeholder="Stat Code" value="' +  profs[profile].stats[p] + '"></input>\
                                <button class="btn btn-danger mb-0 removeStatButton" stat="' + p + '" type="button">Remove</button>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>'
        );
    }
    $('#colorDiv').html('');
    for (var p in profs[profile].colorConditions)
    {
        $('#colorDiv').append('\
            <div class="mb-4 colorCard" style="width: 100%">\
                <div class="card border-left-primary shadow h-100 py-2">\
                    <div class="card-body">\
                        <div class="no-gutters align-items-center">\
                            <div class="mr-2" style="width: 100%;">\
                                <input type="text" class="form-control form-control-user mb-1 text-dark colorRule" stat="' + p + '" placeholder="Condition" value="' + p + '"></input>\
                                <input type="color" class="form-control form-control-user mb-1 text-primary colorColor" stat="' + p + '" value="' +  profs[profile].colorConditions[p] + '"></input>\
                                <button class="btn btn-danger mb-0 removeColorButton" stat="' + p + '" type="button">Remove</button>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>'
        );
    }
    $('#sortDiv').html('');
    // Need to always append, we don't have an "add"
    $('#sortDiv').append('\
        <div class="mb-4 sortCard" style="width: 100%">\
            <div class="card border-left-primary shadow h-100 py-2">\
                <div class="card-body">\
                    <div class="no-gutters align-items-center">\
                        <div class="mr-2" style="width: 100%;">\
                            <input type="text" class="form-control form-control-user mb-1 text-dark sortRule" id="sortRule" placeholder="Condition"></input>\
                            <div class="form-group">\
                                <div class="custom-control custom-checkbox">\
                                    <input type="checkbox" class="custom-control-input" id="sortAscending">\
                                    <label class="custom-control-label" for="sortAscending">Invert (sort ascending instead of descending)</label>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>'
    );
    if (profs[profile]["sort"])
    {
        $('#sortRule').val(profs[profile]["sort"]);
        if (profs[profile]["sortOrder"] == "ascending")
        {
            $("#sortAscending").prop('checked', true);
        }
    };
    
    // TODO: Add the logic
}