const dialog = require('electron').remote.dialog;
const path = require('path');
const fs = require('fs');

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
    
    $("#duplicateProfile").click(function(){ 
        duplicateProfile();
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

    // Check for unsaved changes
    $('.leavePageLink').click(function(e){ return validateLeave(e); });

    // TODO: Possibly grab owner uuid instead of hardcoding this one
    $('#apiViewMethods').attr('href', "https://api.hypixel.net/player?key=" + store.get('hypixel_key') + "&uuid=b876ec32-e396-476b-a115-8438d83c67d4")
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
    // Probably a better way to do this, but if I put it manually as a value="" it breaks on quotes.
    i = 0;
    for (var p in profs[profile].stats)
    {
        $('#statCardsDiv').append('\
            <div class="mb-4 statCard" style="width: 100%">\
                <div class="card border-left-primary shadow h-100 py-2">\
                    <div class="card-body">\
                        <div class="no-gutters align-items-center">\
                            <div class="mr-2" style="width: 100%;">\
                                <input type="text" class="form-control form-control-user mb-1 text-dark statName" id="statName' + i + '" placeholder="Display Name"></input>\
                                <input type="text" class="form-control form-control-user mb-1 text-primary statData" id="statCode' + i + '" placeholder="Stat Code"></input>\
                                <button class="btn btn-danger mb-0 removeStatButton" type="button">Remove</button>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>'
        );
        $('#statName' + i).val(p);
        $('#statCode' + i).val(profs[profile].stats[p]);
        i++;
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
                                <input type="text" class="form-control form-control-user mb-1 text-dark colorRule" id="colorName' + i + '" placeholder="Condition"></input>\
                                <input type="color" class="form-control form-control-user mb-1 text-primary colorColor" id="colorCode' + i + '"></input>\
                                <button class="btn btn-danger mb-0 removeColorButton" type="button">Remove</button>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>'
        );
        $('#colorName' + i).val(p);
        $('#colorCode' + i).val(profs[profile].colorConditions[p]);
        i++;
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
    profile = null;

    dialog.showOpenDialog(
        { 
            title: 'Select Path',
            properties: ['openFile'],
            filters: [
                { name: 'JSON', extensions: ['json'] },
            ],
            properties: []
        }
    ).then(result => {
        if (!result.canceled) {
            var data = fs.readFileSync(result.filePaths[0], 'utf8');
            validateAndAddProfile(data);
        }
    }).catch(err => {
        console.error(err);
    });
};

// TODO:
// This structure is pretty rigid, and not very future-thinking.
// I'm using it for now for lack of better idea off the top of my head, but looking to change this at some point.
function validateAndAddProfile(data) {
    data = JSON.parse(data)
    profiles = store.get('profiles');
    activeProfile = store.get('active_profile');

    profName = "";

    // Make sure it only has one profile
    if (Object.keys(data).length == 1)
    {
        profName = Object.keys(data)[0];
    }
    else{ infoBarMessage('text-danger', 'Error!', 'That profile is invalid.', 2500); return; };

    // Make sure it has the right vague structure
    // Sub-strucutre isn't checked, but by this point im just *assuming* valid.
    // If it breaks, they should still be able to delete it.
    if (!Object.keys(data[profName]).equals(["stats", "colorConditions", "sort", "sortOrder"]))
    {
        infoBarMessage('text-danger', 'Error!', 'That profile is invalid.', 2500); return;
    }
    
    if (Object.keys(profiles).includes(profName))
    {
        infoBarMessage('text-danger', 'Error!', 'That profile already exists!', 2500); return;
    }

    profiles[profName] = data[profName];
    store.set('profiles', profiles);
    store.set('active_profile', profName)
    profileLoad();
    infoBarMessage('text-success', 'Success!', 'Profile settings saved.', 2000);
}

function exportProfile()
{
    // Currently we get the _as-is_ profile, not the saved one. Could change this, maybe.
    prof = getCurrentProperties();
    
    json = {};
    json[prof.name] = prof.properties;

    if (prof == null)
    {
        infoBarMessage('text-danger', 'Error!', 'Check again! The current profile is invalid. (Is something empty?)', 2500);
        return null;
    }
    else
    {
        dialog.showSaveDialog({
            title: 'Select Path',
            defaultPath: prof.name + '.json',
            buttonLabel: 'Save',
            // Restricting the user to only Text Files.
            filters: [
                {
                    name: 'JSON',
                    extensions: ['json']
                }, ],
            properties: []
        }).then(file => {
            // Stating whether dialog operation was cancelled or not.
            if (!file.canceled) {                
                // Creating and Writing to the sample.txt file
                fs.writeFile(file.filePath.toString(), 
                            JSON.stringify(json, null, 2), function (err) {
                    if (err) throw err;
                    console.log('Saved Profile ' + prof.name);
                });
            }
        }).catch(err => {
            console.log(err)
        });
    }
};

function duplicateProfile()
{
    current_prof = getCurrentProperties();
    newProfile = {};
    profiles = store.get('profiles');

    profileNames = Object.keys(profiles);

    newProfile.name = store.get('active_profile');
    
    // Probably a better/more concise way of doing this, but this works fine.
    // Make a new unique name for the profile
    searchingForName = true;
    while (searchingForName)
    {
        // If the name exists already:
        if (profileNames.includes(newProfile.name))
        {
            if (newProfile.name == store.get('active_profile'))
            {
                // If "[ProfileName]" exists, rename to "New Profile 1"
                newProfile.name = store.get('active_profile') + " 1";
            }
            else
            {
                // If "[ProfileName] [x]" exists, increment [x]
                newProfile.name = newProfile.name.replace(/(\d+)+$/g, function(match, number) {
                    return parseInt(number)+1;
                });
            }
        }
        else
        {
            searchingForName = false;
        };
    };
    
    newProfile.properties = current_prof.properties;

    profiles[newProfile.name] = newProfile.properties;
    store.set('profiles', profiles);
    store.set('active_profile', newProfile.name)
    profileLoad();
}

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
            if (newProfile.name == "New Profile")
            {
                // If "New Profile" exists, rename to "New Profile 1"
                newProfile.name = "New Profile 1";
            }
            else
            {
                // If "New Profile [x]" exists, increment [x]
                newProfile.name = newProfile.name.replace(/(\d+)+$/g, function(match, number) {
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


// https://stackoverflow.com/a/14853974
// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});


function validateLeave(target)
{
    savedProfile = store.get('profiles')[store.get('active_profile')]
    editedProfile = getCurrentProperties();

    // If the profile has no changes, we're good to leave
    if(objEquals(savedProfile, editedProfile.properties) && store.get('active_profile') == editedProfile.name)
    {
        return true;
    }

    dimPage();

    // Show notif box asking if they want to leave
    $("#notificationBox").html('\
    <div class="mb-4" id="confirmLeavePage" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: auto; z-index: 3;">\
        <div class="card border-bottom-danger shadow h-100 py-2">\
            <div class="card-body">\
                <div class="no-gutters align-items-center">\
                    <div class="mr-2" style="width: 100%;">\
                        <h1 class="text-danger">You have unsaved changes! <br>Do you really want to leave?</h1>\
                        <button class="btn btn-danger mb-0 ml-1 confirmLeavePageButton" type="button" style="float: right;">Leave</button>\
                        <button class="btn btn-primary mb-0 cancelLeavePageButton" type="button" style="float: right;"">Cancel</button>\
                    </div>\
                </div>\
            </div>\
        </div>\
    </div>\
    ');

    // They confirm, we leave.
    $('.confirmLeavePageButton').click(function()
    {
        window.location.href = $(target.target).attr('href');
    });

    $('.cancelLeavePageButton').click(function(){
        $("#notificationBox").html('');
        undimPage();
    });

    return false;
}

// A little jank, but effective
function objEquals(obj1, obj2) {
    function _equals(obj1, obj2) {
        return JSON.stringify(obj1)
            === JSON.stringify($.extend(true, {}, obj1, obj2));
    }
    return _equals(obj1, obj2) && _equals(obj2, obj1);
}