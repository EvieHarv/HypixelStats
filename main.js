const { app, webContents, BrowserWindow, Menu, MessageChannelMain, ipcMain } = require('electron');
const process = require('process');
const chokidar = require('chokidar');
const readLastLines = require('read-last-lines');
const console = require('console');
const Store = require('electron-store');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
const https = require('https');

var keySender = require('./node-key-sender/');
keySender.setOption('startDelayMillisec', 25);
var hasJava = false; // We need java for /who to be sent with keySender
var autoWhoInUse = false;
const { exec } = require('child_process'); // For windows AutoWho
var path = require("path");

autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;

const store = new Store();

// Start when app ready
app.on('ready', function()
{
  // Create window
  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: true,
      enableRemoteModule: true,
      webviewTag: true // Is this a bad thing to do? I needed it in playerLookup, but ngl thats nonessential so if somone tells me that's bad I'll remove it.
    }
  });

  // Load index
  mainWindow.loadFile("index.html");

  mainWindow.on('closed', function(){app.quit();});
  
  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });
  
  //mainWindow.setAutoHideMenuBar(true);
  //mainWindow.menuBarVisible = false;

  // Build & Apply Menu 
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  // Make sure store values are defined
  checkUndefineds();

  if (!(process.platform == "win32"))
  {
    // We only need java on non-windows platforms.
    // We use it for autowho, and windows uses a compiled AHK script
    javaversion(function(err,version){
      // Java not installed
      if (err)
      {
        // We wait to make sure it's ready.
        setTimeout(function(){mainWindow.webContents.send('downloadJava');}, 2500);
      }
      // Java is installed
      else
      {
        hasJava = true;
      }
    });  
  }
});

// Make sure store values are defined
function checkUndefineds()
{
  // Set up default profile for a new user
  if (store.get('profiles') == undefined)
  {
    profiles = {
      "Bedwars 4v4s" : {
        "stats" : {
          "Winstreak" : "data.player.stats.Bedwars.winstreak",
          "FKDR" : "data.player.stats.Bedwars.four_four_final_kills_bedwars/data.player.stats.Bedwars.four_four_final_deaths_bedwars",
          "Stars" :  "data.player.achievements.bedwars_level"
        },
        "colorConditions" : {
          "blacklist.includes(playerName)" : "#e74a3b",
          "whitelist.includes(playerName)" : "#1cc88a",
          "isNick" : "#f6c23e",
          "data.player.channel == 'PARTY'" : "#36b9cc",
          "(data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars) > 5" : "#e74a3b"
        },
        "sort" : "(data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars)",
        "sortOrder" : "descending"
      },
      "UHC/Sumo Duels" : {
        "stats" : {
          "Sumo Winstreak" : "data.player.stats.Duels.current_sumo_winstreak",
          "Sumo W/L" : "data.player.stats.Duels.sumo_duel_wins/data.player.stats.Duels.sumo_duel_losses",
          "UHC Winstreak" : "data.player.stats.Duels.current_uhc_winstreak",
          "UHC W/L" : "data.player.stats.Duels.uhc_duel_wins/data.player.stats.Duels.uhc_duel_losses"
        },
        "colorConditions" : {
          "blacklist.includes(playerName)" : "#e74a3b",
          "whitelist.includes(playerName)" : "#1cc88a",
          "isNick" : "#f6c23e"
        },
        "sort" : "",
        "sortOrder" : "descending"
      },
      "Custom Stats Examples" : {
        "stats" : {
          "One Specific Stat (Winstreak)" : "data.player.stats.Bedwars.winstreak",
          "Simple Math (FKDR)" : "data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars",
          "Javascript Math (Network Level)" : "(Math.sqrt(data.player.networkExp + 15312.5) - 125/Math.sqrt(2))/(25*Math.sqrt(2))"
        },
        "colorConditions" : {
          "blacklist.includes(playerName)" : "#e74a3b",
          "whitelist.includes(playerName)" : "#1cc88a",
          "isNick" : "#f6c23e",
          "data.player.channel == 'PARTY'" : "#36b9cc",
          "(data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars) > 5" : "#f6c23e"
        },
        "sort" : "(data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars)",
        "sortOrder" : "ascending"
      }
    };
    store.set('profiles', profiles);
    store.set('active_profile', 'Bedwars 4v4s');
  };

  // Alias list
  if (store.get('aliases') == undefined)
  {
    store.set('aliases', {});
  };

  // Blacklist and whitelist
  if (store.get('blacklist') == undefined)
  {
      store.set('blacklist', []);
  };
  if (store.get('whitelist') == undefined)
  {
      store.set('whitelist', []);
  };

  // If key owner exists but no UUID has been grabbed (from prev. versions of the tool), build that information.
  if (store.get("key_owner") && !(store.get('key_owner_uuid')))
  {
    https.get("https://api.hypixel.net/key?key=" + store.get('hypixel_key'), (resp) => {
      let data = '';
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });    
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        key_owner_uuid = (JSON.parse(data)).record.owner;
        console.log("Setting key owner UUID as: " + key_owner_uuid);
        store.set('key_owner_uuid', key_owner_uuid)
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  }
}

ipcMain.on('updateCheck', function(){ // Check update like this to make sure page is fully loaded before checking
  log.info('Checking for update... (from render process)')
  autoUpdater.checkForUpdates();
});

autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('updateAvailable');
});

ipcMain.once('updateConfirmed', function()
{
  log.info("Downloading Update");
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-downloaded', (info) => {
  autoUpdater.quitAndInstall();
})

// Menu Template
const mainMenuTemplate = 
[
  {
    label:'Edit',
    submenu:
    [
      {
        label: 'Devtools',
        accelerator: "Ctrl+Shift+I",
        click(item, focusedwindow)
        {
          focusedwindow.webContents.toggleDevTools();
        }
      },
      {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click()
        {
          app.quit();
        }
      },
      {
        role: "reload"
      }
    ]
  }
];

if (store.get('logPath') !== undefined)
{
  const watcher = chokidar.watch(store.get('logPath'),
  {
    persistent: true,
    usePolling: true // Unfortunately higher CPU usage, but seems required to get it to work consistently
  });
  watcher.on('change', path => fileUpdated(path));
}

function fileUpdated(path)
{
  const lines = 25; // This isn't an exact science here, but 25 seems to work. Performace is fine still, so there's wiggle room.

  readLastLines.read(path, lines) // I wish I could just do line-by-line, but it misses it when they go too quickly, so we check multiple lines every update.
      .then((lastLines)=> {
        // Split lines into array, and remove blank values
          checkForPlayer(lastLines.split('\n').filter(function(l){return l != '';}))
      })
      .catch((err)=> {
          console.error(err)
      });
};

var playerList = []; // Is this bad practice in javascript, or is this okay? I'm gonna go with it being okay, because it works.

const arrayEquals = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

largestCount = 0; // The number of players currently in the game, as calculated by a running total

function checkForPlayer(lines)// This function is so incredibly inefficent, but it's the best I've got right now, so it's what we're using. (It also just really does not matter at this scale, I've noticed 0 performance issues.)
{
  // Get the player list before we add any, for comparison's sake
  playerListTemp = [...playerList];

  var key_owner = store.get('key_owner');
  var aliases = store.get('aliases');

  new_api_key = null;

  // Loop through the past 25 lines and check each for new players (we use the past 25 because sometimes when many join at once the event will skip)
  lines.forEach(function(line)
  {
    // Detect new API key and do relevent work
    // The indexOf checking is needed to ensure that nobody can just type in chat "[Client thread/INFO]: [CHAT] Your new API key is [xyz]" and inject a fake key
    if (line.includes("[Client thread/INFO]: [CHAT] Your new API key is ") && (line.indexOf("[Client thread/INFO]: [CHAT]") == line.lastIndexOf("[Client thread/INFO]: [CHAT]")))
    {
      new_api_key = line.split('[Client thread/INFO]: [CHAT] Your new API key is ')[1];
      // I would just set it here, but we do it after all 25 lines are checked to ensure that someone who did `/api new` twice in a short spam wont cause bugs
    };
    var nickDetect = false;
    // Detects if we join a new match through [Client thread/INFO]: [CHAT] Sending you to && [CHAT] (nicked_alias) has joined
    if (aliases !== undefined && Object.values(aliases).includes(key_owner))
    {
      Object.keys(aliases).filter(function(key) {return aliases[key] === key_owner}).forEach(function (nick) // Could be multiple, so we forEach it. I can't imagine this being very many.
      {
        if (line.includes("[Client thread/INFO]: [CHAT] " + nick + " has joined"))
        {
          nickDetect = true;
        }
      });
    }
    // Detects if we join a new match through [Client thread/INFO]: [CHAT] Sending you to && [CHAT] (key_owner) has joined
    if (nickDetect || line.includes("[Client thread/INFO]: [CHAT] " + key_owner + " has joined" || line.includes("[Client thread/INFO]: [CHAT] Sending you to "))) // When we join a new match
    {
      // Still not completely consistent for an nicked, un-aliased account. Should be consistent enough to give them the warning, though.
      playerList = []; // Re-initalize list
    }


    // Detects a new player through [PLAYER] has joined!
    if (line.includes('[Client thread/INFO]: [CHAT] ') && line.includes('has joined')) // Another Player joins, add them to playerList
    {
      var playerName = line.split("[Client thread/INFO]: [CHAT] ")[1].split(" ")[0];
      if(!playerList.includes(playerName)) 
      {
        playerList.push(playerName);
      }
      // Gets the x from (x/16)! (or (x/8), whatever) and assigns it to largestCount
      largestCount = parseInt(line.split("[Client thread/INFO]: [CHAT] ")[1].split(" ")[3].split('/')[0].replace('(', ''));
    }
    // Detection through [PLAYER] has quit!
    else if (line.includes('[Client thread/INFO]: [CHAT] ') && line.includes('has quit!')) // Another Player leaves, remove them from playerList
    {
      var playerName = line.split("[Client thread/INFO]: [CHAT] ")[1].split(" ")[0];
      const index = playerList.indexOf(playerName);
      if (index > -1) {
        playerList.splice(index, 1);
      }
      largestCount--;
    }
    // Detection through /who
    else if (line.includes('[Client thread/INFO]: [CHAT] ONLINE: '))
    {
      var playerNames = line.split("[Client thread/INFO]: [CHAT] ONLINE: ")[1].split(" "); // TODO: Add all to player list (without doubles)
      for(var i = 0; i < playerNames.length; i++)
      {
        playerNames[i] = playerNames[i].replace(",", "").trim(); // It works fine on linux without the .trim(), but windows sneaks in a newline character
      };
      playerList = playerList.concat(playerNames.filter((name) => playerList.indexOf(name) < 0));
    };
  });

  // Reset frontend list entirely if in a new lobby
  if (largestCount > playerList.length && !arrayEquals(playerList, playerListTemp))
  {
    mainWindow.webContents.send('playerList', []); // Clear the page so that the key owner's stats can update

    // User must have java and /who must not have been sent in the last 3 seconds
    if ((hasJava || process.platform == "win32") && !autoWhoInUse && (store.get('disableAutoWho') != true)) // The "disableAutoWho" nomenclature is slightly confusing, but we use it so we don't have to verify it's existance.
    {
      // Don't allow for interruption 
      autoWhoInUse = true;
      if (process.platform == "win32")
      {
        // I made the AHK a compiled script so that you don't have to have AHK installed
        // You can find the AHK script in node-key-sender/AutoWho.ahk
        var AHKpath = path.join(__dirname, 'node-key-sender', 'AutoWho.exe');
        if (__dirname.includes('app.asar')) // A slightly strange way to check if we're in the published executable
        {
          AHKpath = path.join(__dirname.split("app.asar")[0], 'AutoWho.exe');
        }
        exec(AHKpath, {}, function(error, stdout, stderr) {
          if (error) {
            console.log(`error: ${error.message}`);
          }
        });
      }
      else
      {
        keySender.startBatch()
        .batchTypeKey('control') // We send these keys before because they can often interfere with `/who` if they were already pressed down. Might (try) to make this configurable (somehow) if enough people use different layouts for it to matter.
        .batchTypeKey('w')
        .batchTypeKey('a')
        .batchTypeKey('s')
        .batchTypeKey('d')
        .batchTypeKey('f')
        .batchTypeKey('space')
        .batchTypeKey('slash', 50)
        .batchTypeKeys(['w','h','o','enter'])
        .sendBatch();
      }

      // Wait 3 seconds until /who is available again
      setTimeout(function(){ autoWhoInUse = false; }, 3000);
    }
  }
  // Send the player list 
  updateFrontend();
  playerListTemp = null; // Garbage collection? I dunno how JS works man.

  if (new_api_key && (new_api_key != store.get('hypixel_key')))
  {
    console.log('Setting API key to ' + new_api_key);
    mainWindow.webContents.send('setNewAPIKey', new_api_key);
    playerList = [];
    updateFrontend();
  }

  return;
};

const { port1, port2 } = new MessageChannelMain()

function updateFrontend()
{
  mainWindow.webContents.send('playerList', playerList);
};

ipcMain.on('sendListAgain', function(){ // Re-sending player list on page load
  updateFrontend();
});




function javaversion(callback) {
  var spawn = require('child_process').spawn('java', ['-version']);
  spawn.on('error', function(err){
    return callback(err, null);
  })

  var scriptOutput = "";

  spawn.stderr.on('data', function(data) {
    data=data.toString();
    scriptOutput+=data;
  });
  
  spawn.on('close', function(exitCode){
    data = scriptOutput.split('\n')[0];
    var javaVersion = new RegExp('(java|openjdk) version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
    if (javaVersion != false) {
      // We have Java installed
      return callback(null, javaVersion);
    } 
    else {
      // We don't have Java installed. Sad.
      return callback(null, null);
    }
  });
}