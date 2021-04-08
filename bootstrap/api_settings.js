$(function()
{
    profileLoad(); // Load in all existing profiles to start
    var statsDiv = document.getElementById('statCardsDiv')
    var sortable = Sortable.create(statsDiv, 
        {
            animation: 150
        });
    var colorDiv = document.getElementById('colorDiv')
    var sortable = Sortable.create(colorDiv, 
        {
            animation: 150
        });
    
    $("#saveAllChanges").click(function(){ 
        saveAllChanges();
    });

    $("#importProfile").click(function(){ 
        importProfile();
    });

    $("#exportProfile").click(function(){ 
        exportProfile();
    });
    
    $("#createNewProfile").click(function(){ 
        createNewProfile();
    });

    $("#deleteProfile").click(function(){ 
        deleteProfile();
    });

    $("#addNewStat").click(function(){ 
        addNewStat();
    });

    $("#addNewColorRule").click(function(){ 
        addNewColorRule();
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
    $('.removeStatButton').click(function(card)
    {
        $(card.target).closest('.statCard').remove();
    });

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
    $('.removeColorButton').click(function(card)
    {
        $(card.target).closest('.colorCard').remove();
    });


    $('#sortDiv').html('');
    // Need to always append so don't wrap in "if"
    $('#sortDiv').append('\
        <div class="mb-4 sortCard" style="width: 100%">\
            <div class="card border-left-primary shadow h-100 py-2">\
                <div class="card-body">\
                    <div class="no-gutters align-items-center">\
                        <div class="mr-2" style="width: 100%;">\
                            <input type="text" class="form-control form-control-user mb-1 text-dark sortRule" id="sortRule" placeholder="Statistic to sort by (numeric)"></input>\
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
};

// Gets the current (edited) properties list. Will return null if a field is invalid.
function getCurrentProperties()
{
    // Get the profile name
    if ($('#profileNameField').val() == "")
    {
        return null;
    };
    profileName = $('#profileNameField').val();

    // If we run into an error (something blank), can halt execution with this.
    halt = false;

    // Get the profile stats
    profileStats = {};
    $(".statCard").each(function(index, card)
    {
        if ($(card).find('.statName').val() == "" || $(card).find('.statData').val() == "")
        {
            halt = true;
            return null;
        } 
        profileStats[$(card).find('.statName').val()] = $(card).find('.statData').val();
    });
    if (halt)
    {
        return null;
    };

    // Get the profile colors
    profileColors = {};
    $(".colorCard").each(function(index, card)
    {
        if ($(card).find('.colorRule').val() == "" || $(card).find('.colorColor').val() == "")
        {
            halt = true;
            return null;
        } 
        profileColors[$(card).find('.colorRule').val()] = $(card).find('.colorColor').val();
    });
    if (halt)
    {
        return null;
    };

    // Get the profile name. Note that it is valid for this to be empty.
    profileSortRule = $('#sortRule').val();
    
    profileSortOrder = 'descending';
    if($('#sortAscending').prop('checked')) 
    {
        profileSortOrder = 'ascending';
    };

    // seems like a hack-y workaround, but works fine.
    prof = {};
    prof.name = profileName;
    prof.properties = { "stats" : profileStats, "colorConditions" : profileColors, "sort" : profileSortRule, "sortOrder" : profileSortOrder };

    return prof;
}



function saveAllChanges()
{
    profiles = store.get('profiles');
    activeProfile = store.get('active_profile');

    newProfile = getCurrentProperties();

    // Make sure we're not making duplicate profiles
    for (var a in profiles)
    {
        // Skip over the active profile, it will be the same a lot of the time.
        if (a == activeProfile)
        {
            continue;
        }
        // If the profile shares a name, it's invalid.
        else if (a == newProfile.name)
        {
            newProfile = null; 
            infoBarMessage('text-danger', 'Error!', 'That profile name already exists.', 2500);
            return null;
        }
    }

    if (newProfile == null)
    {
        infoBarMessage('text-danger', 'Error!', 'Check again! That profile is invalid. (Is something empty?)', 2500);
        return null;
    };

    // Delete the old profile and substitute it with the new one.
    // Order is not preserved, and while this could be easily fixed by just iterating through and adding as we go, I think I actually prefer order not be obeyed.
    delete profiles[activeProfile];
    profiles[newProfile.name] = newProfile.properties;
    store.set('profiles', profiles);
    store.set('active_profile', newProfile.name)
    profileLoad();
    infoBarMessage('text-success', 'Success!', 'Profile settings saved.', 2000);
};

function importProfile()
{
    // validate w/ joi.dev
    console.log('import');
};

function exportProfile()
{
    console.log('export');
};

function createNewProfile()
{
    newProfile = {};
    profiles = store.get('profiles');

    profileNames = Object.keys(profiles);

    newProfile.name = "New Profile";
    
    // Probably a better/more concise way of doing this, but this works fine.
    // Make a new unique name for the profile
    searchingForName = true;
    while (searchingForName)
    {
        // If the name exists already:
        if (profileNames.includes(newProfile.name))
        {
            console.log(profileNames)
            console.log('I hate it here.')
            if (newProfile.name == "New Profile")
            {
                // If "New Profile" exists, rename to "New Profile 1"
                newProfile.name = "New Profile 1";
            }
            else
            {
                // If "New Profile [x]" exists, increment [x]
                newProfile.name = newProfile.name.replace(/(\d+)+/g, function(match, number) {
                    return parseInt(number)+1;
                });
            }
        }
        else
        {
            searchingForName = false;
        };
    };
    
    newProfile.properties = { "stats" : '', "colorConditions" : '', "sort" : '', "sortOrder" : 'descending' };

    profiles[newProfile.name] = newProfile.properties;
    store.set('profiles', profiles);
    store.set('active_profile', newProfile.name)
    profileLoad();
};

function deleteProfile()
{
    // Create temp list by grabbing full list
    profiles = store.get('profiles');
    activeProfile = store.get('active_profile');

    // Prompt the user to ensure they meant it
    dimPage();

    $("#notificationBox").html('\
    <div class="mb-4" id="confirmDeleteProfile" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: auto; z-index: 3;">\
        <div class="card border-bottom-danger shadow h-100 py-2">\
            <div class="card-body">\
                <div class="no-gutters align-items-center">\
                    <div class="mr-2" style="width: 100%;">\
                        <h1 class="text-danger">Delete this profile?</h1>\
                        <button class="btn btn-danger mb-0 ml-1 confirmDeleteProfileButton" type="button" style="float: right;">Delete</button>\
                        <button class="btn btn-primary mb-0 cancelDeleteProfileButton" type="button" style="float: right;"">Cancel</button>\
                    </div>\
                </div>\
            </div>\
        </div>\
    </div>\
    ');

    // They confirm, delete.
    $('.confirmDeleteProfileButton').click(function()
    {
        delete profiles[activeProfile];

        newActiveProfile = Object.keys(profiles)[Object.keys(profiles).length - 1];
        store.set('profiles', profiles);
        store.set('active_profile', newActiveProfile)
    
        $("#notificationBox").html('');
        undimPage();

        profileLoad();
    });

    $('.cancelDeleteProfileButton').click(function(){
        $("#notificationBox").html('');
        undimPage();
    });

};

function addNewStat()
{
    $('#statCardsDiv').append('\
        <div class="mb-4 statCard" style="width: 100%">\
            <div class="card border-left-primary shadow h-100 py-2">\
                <div class="card-body">\
                    <div class="no-gutters align-items-center">\
                        <div class="mr-2" style="width: 100%;">\
                            <input type="text" class="form-control form-control-user mb-1 text-dark statName" placeholder="Display Name"></input>\
                            <input type="text" class="form-control form-control-user mb-1 text-primary statData" placeholder="Stat Code"></input>\
                            <button class="btn btn-danger mb-0 removeStatButton" type="button">Remove</button>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>'
    );
    $('.removeStatButton').click(function(card)
    {
        $(card.target).closest('.statCard').remove();
    });
};

function addNewColorRule()
{
    $('#colorDiv').append('\
        <div class="mb-4 colorCard" style="width: 100%">\
            <div class="card border-left-primary shadow h-100 py-2">\
                <div class="card-body">\
                    <div class="no-gutters align-items-center">\
                        <div class="mr-2" style="width: 100%;">\
                            <input type="text" class="form-control form-control-user mb-1 text-dark colorRule" placeholder="Condition"></input>\
                            <input type="color" class="form-control form-control-user mb-1 text-primary colorColor" value="#f6c23e"></input>\
                            <button class="btn btn-danger mb-0 removeColorButton" type="button">Remove</button>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>'
    );
    $('.removeColorButton').click(function(card)
    {
        $(card.target).closest('.colorCard').remove();
    });
};

function dimPage() {
    document.getElementById("overlay").style.display = "block";
}
  
function undimPage() {
    document.getElementById("overlay").style.display = "none";
}