self.addEventListener("message", function(e) {
    handlePlayer(e.data[0], e.data[1])
}, false);

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

function handlePlayer(profile, data)
{
    // Yes, this is probably horrible. I'm just using this so it ensures the returned string is *relatively* safe
    regexFromHell = /^[a-zA-Z0-9_~`!@#$%^&* ()\[\]\{\}\\|;:'",.?\/-]*$/gm;

    returnObject = {};
    
    // Define stats property
    returnObject.stats = {};
    // Iterate through the stats and assign them to returnObject.stats. (e.g., returnObject.stats.FKDR)
    for (var entry in profile["stats"])
    {
        if (profile.stats[entry].includes('("data.')){ console.warn("HEY! It looks like you're using an R-function incorrectly—don't start it with 'data.'! Just get straight to the stat. (e.g. 'player.etc'). If you know what you're doing, you can ignore this message."); }
        value = undefined;
        // Wrap in a try/catch because idk what these people are gonna put
        try{ value = Function('"use strict"; var data = arguments[0]; return ' + profile.stats[entry] + ';')(data); }
        catch(error){ console.error(error); console.warn('The error above was encountered while processing the stat "' + entry + '" for ' + data.internal.name); }

        // If it's numeric, fix it to 2 decimals.
        if (typeof value === 'number') {
            value = value.toFixedDown(2); // TODO: Possibly make configurable.
        }

        // If it's undefined or NaN, return null.
        if (value == undefined || Number.isNaN(value))
        {
            returnObject.stats[entry] = null;
        }
        else if (typeof value === 'string')
        {
            // If it's a string, ensure it contains at least vaguely safe characters (pretty much no <>)
            if (value.match(regexFromHell))
            {
                returnObject.stats[entry] = value;
            }
            else
            {
                returnObject.stats[entry] = null;
            }
        }
        else // It's defined.
        {
            returnObject.stats[entry] = value;
        }
    }

    // Iterate through color conditions if they exist, assign one at the end.
    if (profile['colorConditions'])
    {
        color = undefined;
        for (var condition in profile['colorConditions'])
        {
            if (!(color)) // Keep checking until we find a valid color
            {
                // If {condition == true}, return {color}.
                // Can error out for the user, still want to continue going if it does.
                try { color = Function('"use strict"; var data = arguments[0]; if (' + condition + ') { return ("' + profile.colorConditions[condition] + '"); } ')(data); }
                catch(error){ console.error(error); console.warn('The error above was encountered while processing the color condition "' + condition + '" for ' + data.internal.name); }; 
            }
        }
        // A color was found
        if (color)
        {
            // Assign the found color, if any
            returnObject.color = color;
        }
        else
        {
            // Assign default color if no other was found
            returnObject.color = '#4e73df'; // TODO: Make configurable
        }
    }
    else
    {
        returnObject.color = '#4e73df'; // TODO: Make configurable
    }

    // Get the numerical value that will be used for sorting.
    if (profile.sort)
    {
        value = undefined;
        try{ value = Function('"use strict"; var data = arguments[0]; return (' + profile.sort + ')')(data); }
        catch(error){ console.error(error); console.warn('The error above was encountered while sorting ' + data.internal.name); }

        if (value == undefined)
        {
            returnObject.sortValue = 0; // Hardcode unresolved to 0.
        }
        else if (!(typeof value === 'number')) // MUST be numeric. Return 0.
        {
            console.error("Sort values must be numeric.");
            console.warn('The error above was encountered while sorting ' + data.internal.name);
            returnObject.sortValue = 0;
        }
        else 
        {
            returnObject.sortValue = value;
        }
    }
    else
    {
        // If we don't sort, just null it.
        returnObject.sortValue = null;
    }
    
    // At this point, returnObject contains:
    // returnObject.stats (object)
    // returnObject.color (string)
    // returnObject.sortValue (int or null)
    postMessage(returnObject);
}

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////// FUNCTIONS TO BE USED IN PROFILES ////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////


// Resolve json data safely. Generally unused. ("Resolve")
function r(path, obj) {
    v = path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : null
    }, obj || self);
    return v;
}

// Resolve json data. If it is unresolvable, default to 0. ("Resolve, default 0")
function r0(path, obj) {
    v = path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : null
    }, obj || self);
    if (v == undefined)
    {
        return 0;
    }
    return v;
}

// Resolve json data. If it is unresolvable, default to 1. ("Resolve, default 1")
function r1(path, obj) {
    v = path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : null
    }, obj || self);
    if (v == undefined)
    {
        return 1;
    }
    return v;
}

// Resolve json data. If it is unresolvable, default to 1. If it is resolved but equals 0, return 1 instead. ("Resolve, default 1, no 0")
function r1n0(path, obj) {
    v = path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : null
    }, obj || self);
    if (v == undefined)
    {
        return 1;
    }
    else if (v == 0)
    {
        return 1;
    }
    return v;
}