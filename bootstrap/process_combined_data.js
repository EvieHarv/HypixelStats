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
    regexFromHell = /[<>]/gm;

    returnObject = {};
    
    // Define stats property
    returnObject.stats = {};
    // Iterate through the stats and assign them to returnObject.stats. (e.g., returnObject.stats.FKDR)
    for (var entry in profile["combinedStats"])
    {
        if (profile.combinedStats[entry].includes('("data.')){ console.warn("HEY! It looks like you're using an R-function incorrectly—don't start it with 'data.'! Just get straight to the stat. (e.g. 'player.etc'). If you know what you're doing, you can ignore this message."); }
        value = undefined;

        // Wrap in a try/catch because idk what these people are gonna put
        try{ value = Function('"use strict"; var data = arguments[0]; ' + profile.combinedStats[entry] + ';')(data); }
            // NOTE: The User must define a return value within their function! 
        catch(error){ console.debug(error); console.debug('The error above was encountered while processing the stat "' + entry + '" for the combined stats.'); }

        // If it's numeric (it probably should be here, but w/e), fix it to 2 decimals.
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
                returnObject.stats[entry] = null;
            }
            else
            {
                returnObject.stats[entry] = value;
            }
        }
        else // It's defined.
        {
            returnObject.stats[entry] = value;
        }
    }
    
    // At this point, returnObject contains:
    // returnObject.stats (object)
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

// Resolve json data. If it equals 0 or false, return undefined. ("Resolve, delete 0.")
function rd0(path, obj) {
    v = path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : null
    }, obj || self);
    if (v == 0)
    {
        return undefined;
    }
    if (v == false)
    {
        return undefined;
    }
    return v;
}

function f(func, data)
{
    return Function('\"use strict\"; let data = arguments[0]; ' + func)(data);
}