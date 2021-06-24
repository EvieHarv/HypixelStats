const { app, webContents, BrowserWindow, Menu, MessageChannelMain, ipcMain, globalShortcut } = require('electron');
const process = require('process');
const readLastLines = require('read-last-lines');
const console = require('console');
const Store = require('electron-store');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
const https = require('https');
const fs = require('fs')


var keySender = require('./node-key-sender/');
keySender.setOption('startDelayMillisec', 25);
var hasJava = false; // We need java for /who to be sent with keySender
var autoWhoInUse = false;
const { exec } = require('child_process'); // For windows AutoWho
var path = require("path");
const isAccelerator = require('electron-is-accelerator');

autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;
let overlayWindow;

var fakeFullscreenOn = false;

const store = new Store();

// Start when app ready
app.on('ready', function()
{
  // Create window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: true,
      enableRemoteModule: true,
      webviewTag: true // Is this a bad thing to do? I needed it in playerLookup, but ngl thats nonessential so if somone tells me that's bad I'll remove it.
    },
    minWidth: 800,
    minHeight: 450
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

  setFileWatcher();

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

  initalizeGlobalShortcuts();
});

var mostRecentSize = 0;
var timesRead = 0;
var fileLocation;
var readLoopStarted = false;
var loopCount = 0;
const readLogFile = async () => 
{
  loopCount++;
  try
  {
    // Modifed from https://github.com/imconnorngl/overlay/blob/60aba3d04601284a7ddfac7652a0071db1bb5660/js/playerUpdater.js#L28
    // Only just found this repo (and statsify in general, idk how I never heard of it before).
    // Can't find a license, but hoping we're chill if I take and adapt this method of file updating into the program. 
    // Seems like an all-around better method than Chokidar.
    readLoopStarted = true;
    var newSize = fs.fstatSync(fileLocation).size;
    if (loopCount >= 250) // 250 is arbitrary, takes around 3.8 seconds for every check. Want to reduce the strain on the filesystem.
    {
      loopCount = 0;
      var filePath = store.get('logPath');
      if (filePath)
      {
        testSize = fs.statSync(filePath).size;
        if (newSize != testSize)
        {
          console.log('It appears the log file has changed. This may be due to a restarted client. Attempting to re-set it...');
          setFileWatcher();
        }  
      }
    }
    if (timesRead == 0) 
    {
      mostRecentSize = newSize;
      timesRead++;
      setTimeout(readLogFile, 10);
    } 
    else if (newSize < mostRecentSize + 1) 
    {
      setTimeout(readLogFile, 10);
    } 
    else 
    {
      fs.read(fileLocation, Buffer.alloc(2056), 0, 2056, mostRecentSize, (err, bytecount, buff) => {
        mostRecentSize += bytecount;
  
        const lines = buff.toString().split(/\r?\n/).slice(0, -1);
        checkForPlayer(lines);
        readLogFile();
      });
    }  
  }
  catch(err)
  {
    console.error("File reading failed");
    console.error(err);
  }
};

function setFileWatcher()
{
  var filePath = store.get('logPath');
  if (filePath)
  {
    fs.open(filePath, 'r', (err, fd) => {
      if (!err) 
      {
        if (fileLocation)
        {
          fs.close(fileLocation);
        };
        mostRecentSize = 0;
        timesRead = 0;
        fileLocation = fd;
        if (!readLoopStarted) readLogFile();
      }
      else 
      { 
        console.error('File failed to set'); 
      }; 
    });
  }
}

ipcMain.on('logPathChanged', function(event)
{
  setFileWatcher();
});

function toggleFakeFullscreen()
{
  if (process.platform == "win32" )
  {
    var executable = fakeFullscreenOn ? "UnFakeFullscreen.exe" : "FakeFullscreen.exe"
    fakeFullscreenOn = !fakeFullscreenOn;
    // You can find the AHK scripts in node-key-sender/FakeFullscreen.ahk
    var AHKpath = path.join(__dirname, 'node-key-sender', executable);
    if (__dirname.includes('app.asar')) // A slightly strange way to check if we're in the published executable
    {
      AHKpath = path.join(__dirname.split("app.asar")[0], executable);
    }
    exec(AHKpath, {}, function(error, stdout, stderr) {
      if (error) {
        console.log(`error: ${error.message}`);
      }
    });
  }
  // TODO: Come up with something for other platforms.
}

ipcMain.on('launchOverlay', function(event, data){
  if (!overlayWindow)
  {
    if (process.platform == "win32" && store.get('fakeFullscreen') == true && store.get('hasUsedOverlay'))
    {
      // I made the AHK a compiled script so that you don't have to have AHK installed
      // You can find the AHK script in node-key-sender/FakeFullscreen.ahk
      var AHKpath = path.join(__dirname, 'node-key-sender', 'FakeFullscreen.exe');
      if (__dirname.includes('app.asar')) // A slightly strange way to check if we're in the published executable
      {
        AHKpath = path.join(__dirname.split("app.asar")[0], 'FakeFullscreen.exe');
      }
      exec(AHKpath, {}, function(error, stdout, stderr) {
        if (error) {
          console.log(`error: ${error.message}`);
        }
      });
      fakeFullscreenOn = true;
      // (I would just use toggleFullscreen here, but I want this to *always* set it to the on state.)
    }

    owX = 510;
    owY = 240;

    // Default to last position when closed
    pos = store.get('overlayWindowPosition');
    if (pos)
    {
      owX = pos[0];
      owY = pos[1];
    }

    overlayWindow = new BrowserWindow({
      x: owX,
      y: owY,
      webPreferences: 
      {
        nodeIntegration: true,
        contextIsolation: false
      },
      width: 900,
      height: 600,
      resizable: false,
      frame: false,
      transparent: true
    });
    overlayWindow.loadFile("./overlay/index.html");
    overlayWindow.setAlwaysOnTop(true, "normal");
    overlayWindow.on('blur', function()
    {
      overlayWindow.webContents.send('lostFocus');
      overlayWindow.setIgnoreMouseEvents(true);
    });

    overlayWindow.on('close', function()
    {
      store.set('overlayWindowPosition', overlayWindow.getPosition());
    })

    overlayWindow.on('closed', function()
    { 
      overlayWindow = undefined; 
    });
  }
});

// Pass data from MainWindow to OverlayWindow
ipcMain.on('overlayData', function(event, data){
  if (overlayWindow)
  {
    overlayWindow.webContents.send('playerData', data);
  }
});

ipcMain.on('requestData', function(event, data){
  mainWindow.webContents.send('overlayRequest');
});

ipcMain.on('killOverlay', function(event, data){
  overlayWindow.close();
});


ipcMain.on('keybindsChanged', function(){
  initalizeGlobalShortcuts();
});


function initalizeGlobalShortcuts()
{
  globalShortcut.unregisterAll();
  keybinds = store.get('keybinds');
  
  if (keybinds.profUp !== null && isAccelerator(keybinds.profUp)) // We verify that it is valid or null when we set it, but it may be good to validate. Dunno.
  {
    const pfu = globalShortcut.register(keybinds.profUp, () => 
    {
      profs = store.get('profiles');
      index = Object.keys(profs).indexOf(store.get('active_profile'));
      len = Object.keys(profs).length;

      if ((len-1) == index) { index = 0; }
      else { index++; }

      store.set('active_profile', Object.keys(profs)[index]);

      mainWindow.webContents.send('profileChanged');
    });  
  };

  if (keybinds.profDown !== null && isAccelerator(keybinds.profDown))
  {
    const pfd = globalShortcut.register(keybinds.profDown, () => 
    {
      profs = store.get('profiles');
      index = Object.keys(profs).indexOf(store.get('active_profile'));
      len = Object.keys(profs).length;

      if (index == 0) { index = (len-1); }
      else { index--; }

      store.set('active_profile', Object.keys(profs)[index]);

      mainWindow.webContents.send('profileChanged');
    });
  };

  if (keybinds.focusOverlay !== null && isAccelerator(keybinds.focusOverlay))
  {
    const lbm = globalShortcut.register(keybinds.focusOverlay, () => 
    {
      if (overlayWindow)
      {
        overlayWindow.setIgnoreMouseEvents(false);
        overlayWindow.focus()
      }
    });
  };

  if (keybinds.toggleFakeFullscreen !== null && isAccelerator(keybinds.toggleFakeFullscreen))
  {
    const lbm = globalShortcut.register(keybinds.toggleFakeFullscreen, () => 
    {
      toggleFakeFullscreen();
    });
  };

  if (keybinds.showOverlay !== null && isAccelerator(keybinds.showOverlay))
  {
    const lbm = globalShortcut.register(keybinds.showOverlay, () => 
    {
      mainWindow.webContents.send('overlayRequest');
    });
  };

  if (keybinds.lobbyMode !== null && isAccelerator(keybinds.lobbyMode))
  {
    const lbm = globalShortcut.register(keybinds.lobbyMode, () => 
    {
      // TODO;
      // mainWindow.webContents.send('lobbyMode', "");
    });
  };
}

// Make sure store values are defined
function checkUndefineds()
{
  if (store.get('updateMigrationStore') == undefined)
  {
    store.set('updateMigrationStore', {});
  }
  if (store.get('updateMigrationStore').rfuncProfiles == undefined && store.get('profiles') != undefined)
  {
    // User has profiles, BUT they aren't the new ones.
    // Honestly, I think about one person has used the tool by this point, so moving data around without a flashy screen isn't a huge concern, but this is horrible practice.
    // Future updates should take that into concern.
    fs.writeFile(path.join(__dirname, 'old_profiles.json'), 
      JSON.stringify(store.get('profiles'), null, 2), function (err) {
        if (err) throw err;
        console.log('Saved Profiles');
      }
    );
    store.delete('profiles');
  }
  if (store.get('updateMigrationStore').sniperDetectionProfiles == undefined && store.get('profiles') != undefined)
  {
    // User has profiles, BUT they dont have sniper detection yet.
    // We're gonna append the data to each profile.
    // this is SUPER jank, but its what we're working with here.
    profs = store.get('profiles');
    Object.keys(profs).forEach(function(e)
    {
        if (e.includes('Bedwars'))
        {
            profs[e].stats["Reports:"] = "rd0(\"c.sniperCheck.report\", data)";
            profs[e].stats["Sniper:"] = "rd0(\"c.sniperCheck.sniper\", data)";
        };
        oldColorC = profs[e].colorConditions;
        profs[e].colorConditions = {};
        doNext = false;
        Object.keys(oldColorC).forEach(function(a)
        {
            if (doNext)
            {
                profs[e].colorConditions["(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)"] = "#e228d2";
                doNext = false;
            }
            profs[e].colorConditions[a] = oldColorC[a];
            if (a == "data.internal.whitelist.includes(data.internal.name)")
            {
                doNext = true;
            }
        });
    });
    store.set('profiles', profs);
    u = store.get('updateMigrationStore');
    u.sniperDetectionProfiles = true;
    store.set('updateMigrationStore', u);

  };
  // Set up default profile for a new user
  if (store.get('profiles') == undefined)
  {
    u = store.get('updateMigrationStore');
    u.rfuncProfiles = true;
    u.sniperDetectionProfiles = true;
    store.set('updateMigrationStore', u);
    profiles = 
    {
      "Bedwars Overall": {
        "stats": {
          "FKDR:": "r0(\"player.stats.Bedwars.final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.final_deaths_bedwars\", data)",
          "Winstreak:": "r0(\"player.stats.Bedwars.winstreak\", data)",
          "✫": "data.player.achievements.bedwars_level",
          "Reports:": "rd0(\"c.sniperCheck.report\", data)",
          "Sniper:": "rd0(\"c.sniperCheck.sniper\", data)"
        },
        "colorConditions": {
          "data.internal.blacklist.includes(data.internal.name)": "#e74a3b",
          "data.internal.whitelist.includes(data.internal.name)": "#1cc88a",
          "(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)": "#e228d2",
          "data.internal.isNick": "#f6c23e",
          "data.player.channel == 'PARTY'": "#36b9cc",
          "(r0(\"player.stats.Bedwars.final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.final_deaths_bedwars\", data)) > 5": "#e74a3b"
        },
        "sort": "r0(\"player.stats.Bedwars.final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.final_deaths_bedwars\", data)",
        "sortOrder": "descending"
      },
      "Bedwars Solo": {
        "stats": {
          "FKDR:": "r0(\"player.stats.Bedwars.eight_one_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.eight_one_final_deaths_bedwars\", data)",
          "Winstreak:": "r0(\"player.stats.Bedwars.winstreak\", data)",
          "✫": "data.player.achievements.bedwars_level",
          "Reports:": "rd0(\"c.sniperCheck.report\", data)",
          "Sniper:": "rd0(\"c.sniperCheck.sniper\", data)"
        },
        "colorConditions": {
          "data.internal.blacklist.includes(data.internal.name)": "#e74a3b",
          "data.internal.whitelist.includes(data.internal.name)": "#1cc88a",
          "(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)": "#e228d2",
          "data.internal.isNick": "#f6c23e",
          "data.player.channel == 'PARTY'": "#36b9cc",
          "(r0(\"player.stats.Bedwars.eight_one_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.eight_one_final_deaths_bedwars\", data)) > 5": "#e74a3b"
        },
        "sort": "r0(\"player.stats.Bedwars.eight_one_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.eight_one_final_deaths_bedwars\", data)",
        "sortOrder": "descending"
      },
      "Bedwars Doubles": {
        "stats": {
          "FKDR:": "r0(\"player.stats.Bedwars.eight_two_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.eight_two_final_deaths_bedwars\", data)",
          "Winstreak:": "r0(\"player.stats.Bedwars.winstreak\", data)",
          "✫": "data.player.achievements.bedwars_level",
          "Reports:": "rd0(\"c.sniperCheck.report\", data)",
          "Sniper:": "rd0(\"c.sniperCheck.sniper\", data)"
        },
        "colorConditions": {
          "data.internal.blacklist.includes(data.internal.name)": "#e74a3b",
          "data.internal.whitelist.includes(data.internal.name)": "#1cc88a",
          "(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)": "#e228d2",
          "data.internal.isNick": "#f6c23e",
          "data.player.channel == 'PARTY'": "#36b9cc",
          "(r0(\"player.stats.Bedwars.eight_two_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.eight_two_final_deaths_bedwars\", data)) > 5": "#e74a3b"
        },
        "sort": "r0(\"player.stats.Bedwars.eight_two_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.eight_two_final_deaths_bedwars\", data)",
        "sortOrder": "descending"
      },
      "Bedwars 3v3v3v3": {
        "stats": {
          "FKDR:": "r0(\"player.stats.Bedwars.four_three_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.four_three_final_deaths_bedwars\", data)",
          "Winstreak:": "r0(\"player.stats.Bedwars.winstreak\", data)",
          "✫": "data.player.achievements.bedwars_level",
          "Reports:": "rd0(\"c.sniperCheck.report\", data)",
          "Sniper:": "rd0(\"c.sniperCheck.sniper\", data)"
        },
        "colorConditions": {
          "data.internal.blacklist.includes(data.internal.name)": "#e74a3b",
          "data.internal.whitelist.includes(data.internal.name)": "#1cc88a",
          "(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)": "#e228d2",
          "data.internal.isNick": "#f6c23e",
          "data.player.channel == 'PARTY'": "#36b9cc",
          "(r0(\"player.stats.Bedwars.four_three_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.four_three_final_deaths_bedwars\", data)) > 5": "#e74a3b"
        },
        "sort": "r0(\"player.stats.Bedwars.four_three_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.four_three_final_deaths_bedwars\", data)",
        "sortOrder": "descending"
      },
      "Bedwars 4v4v4v4": {
        "stats": {
          "FKDR:": "r0(\"player.stats.Bedwars.four_four_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.four_four_final_deaths_bedwars\", data)",
          "Winstreak:": "r0(\"player.stats.Bedwars.winstreak\", data)",
          "✫": "data.player.achievements.bedwars_level",
          "Reports:": "rd0(\"c.sniperCheck.report\", data)",
          "Sniper:": "rd0(\"c.sniperCheck.sniper\", data)"
        },
        "colorConditions": {
          "data.internal.blacklist.includes(data.internal.name)": "#e74a3b",
          "data.internal.whitelist.includes(data.internal.name)": "#1cc88a",
          "(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)": "#e228d2",
          "data.internal.isNick": "#f6c23e",
          "data.player.channel == 'PARTY'": "#36b9cc",
          "(r0(\"player.stats.Bedwars.four_four_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.four_four_final_deaths_bedwars\", data)) > 5": "#e74a3b"
        },
        "sort": "r0(\"player.stats.Bedwars.four_four_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.four_four_final_deaths_bedwars\", data)",
        "sortOrder": "descending"
      },
      "Bedwars 4v4": {
        "stats": {
          "FKDR:": "r0(\"player.stats.Bedwars.two_four_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.two_four_final_deaths_bedwars\", data)",
          "Winstreak:": "r0(\"player.stats.Bedwars.winstreak\", data)",
          "✫": "data.player.achievements.bedwars_level",
          "Reports:": "rd0(\"c.sniperCheck.report\", data)",
          "Sniper:": "rd0(\"c.sniperCheck.sniper\", data)"
        },
        "colorConditions": {
          "data.internal.blacklist.includes(data.internal.name)": "#e74a3b",
          "data.internal.whitelist.includes(data.internal.name)": "#1cc88a",
          "(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)": "#e228d2",
          "data.internal.isNick": "#f6c23e",
          "data.player.channel == 'PARTY'": "#36b9cc",
          "(r0(\"player.stats.Bedwars.two_four_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.two_four_final_deaths_bedwars\", data)) > 5": "#e74a3b"
        },
        "sort": "r0(\"player.stats.Bedwars.two_four_final_kills_bedwars\", data) / r1n0(\"player.stats.Bedwars.two_four_final_deaths_bedwars\", data)",
        "sortOrder": "descending"
      },
      "Sumo/UHC Duels": {
        "stats": {
          "Sumo WS:": "r0(\"player.stats.Duels.current_sumo_winstreak\", data)",
          "Sumo W/L:": "r0(\"player.stats.Duels.sumo_duel_wins\", data) / r1n0(\"player.stats.Duels.sumo_duel_losses\", data)",
          "UHC WS:": "r0(\"player.stats.Duels.current_uhc_winstreak\", data)",
          "UHC W/L:": "r0(\"player.stats.Duels.uhc_duel_wins\", data) / r1n0(\"player.stats.Duels.uhc_duel_losses\", data)"
        },
        "colorConditions": {
          "data.internal.blacklist.includes(data.internal.name)": "#e74a3b",
          "data.internal.whitelist.includes(data.internal.name)": "#1cc88a",
          "(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)": "#e228d2",
          "data.internal.isNick": "#f6c23e",
          "(r0(\"player.stats.Duels.sumo_duel_wins\", data) / r1n0(\"player.stats.Duels.sumo_duel_losses\", data)) > 3 || (r0(\"player.stats.Duels.uhc_duel_wins\", data) / r1n0(\"player.stats.Duels.uhc_duel_losses\", data)) > 3": "#e74a3b"
        },
        "sort": "",
        "sortOrder": "descending"
      },
      "Bridge Duels": {
        "stats": {
          "Winstreak:": "r0(\"player.stats.Duels.current_bridge_winstreak\", data)",
          "W/L:": "r0(\"player.stats.Duels.bridge_duel_wins\", data) / r1n0(\"player.stats.Duels.bridge_duel_losses\", data)",
          "K/D:": "r0(\"player.stats.Duels.bridge_duel_bridge_kills\", data) / r1n0(\"player.stats.Duels.bridge_duel_bridge_deaths\", data)"
        },
        "colorConditions": {
          "data.internal.blacklist.includes(data.internal.name)": "#e74a3b",
          "data.internal.whitelist.includes(data.internal.name)": "#1cc88a",
          "(data.c.sniperCheck.report > 0) || (data.c.sniperCheck.sniper == true)": "#e228d2",
          "data.internal.isNick": "#f6c23e",
          "(r0(\"player.stats.Duels.bridge_duel_wins\", data) / r1n0(\"player.stats.Duels.bridge_duel_losses\", data)) > 3 || r0(\"player.stats.Duels.bridge_duel_kills\", data) / r1n0(\"player.stats.Duels.bridge_duel_deaths\", data) > 3": "#e74a3b"
        },
        "sort": "",
        "sortOrder": "descending"
      }
    }
    store.set('profiles', profiles);
    store.set('active_profile', 'Bedwars Overall');
  };

  if (store.get('customAPIs') == undefined)
  {
    var APIs = 
    {
      "sniperCheck":
      {
        "on": true,
        "url": "api.hypixelstats.com/sniper",
        "description": "Default sniper detection, courtesy of bwstats! discord.gg/bwstats. This is just a JSON wrapper for his API.",
        "timeout": 1000,
        "sends": 
        {
          "userKey" : false,
          "playerName" : true,
          "playerUUID" : false
        }
      }
    }
    store.set('customAPIs', APIs);
  }

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
    try
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
    catch(e)
    {
      console.error(e);
    }
  }

  // Initalize the toplevel property
  if (store.get('keybinds') == undefined)
  {
    store.set('keybinds', { "profUp": "Control+U", "profDown" : "Control+I", "focusOverlay": "Control+Shift+G", "lobbyMode": "Control+L", "toggleFakeFullscreen": "Control+F4", "showOverlay": "Control+N" });
  }
  keybinds = store.get('keybinds');
  // Check for stuff that was added after initial commit
  if (keybinds.focusOverlay == undefined)
  {
    keybinds.focusOverlay = "Control+Shift+G";
    store.set("keybinds", keybinds)
  }
  if (keybinds.toggleFakeFullscreen == undefined)
  {
    keybinds.toggleFakeFullscreen = "Control+F4";
    store.set("keybinds", keybinds)
  }
  if (keybinds.showOverlay == undefined)
  {
    keybinds.showOverlay = "Control+N";
    store.set("keybinds", keybinds)
  }




  if (store.get('overlayAutoHide') == undefined)
  {
    store.set('overlayAutoHide', 15);
  }

  if (store.get('doPartyWhitelisting') == undefined)
  {
    store.set('doPartyWhitelisting', true);
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

var playerList = [];
var outOfGame = [];
var partyList = [];

const arrayEquals = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

largestCount = 0; // The number of players currently in the game, as calculated by a running total

function checkForPlayer(lines)// This function is so incredibly inefficent, but it's the best I've got right now, so it's what we're using. (It also just really does not matter at this scale, I've noticed 0 performance issues.)
{
  // Get the player list before we add any, for comparison's sake
  playerListTemp = [...playerList];

  var key_owner = store.get('key_owner');
  var aliases = store.get('aliases');

  new_api_key = null;

  // Loop through the given lines and check each for new players
  lines.forEach(function(line)
  {
    if (line.split('[CHAT]')[1] && (line.split('[CHAT]')[1].includes(':') && !line.split('[CHAT]')[1].startsWith(' You\'ll be partying with: ') && !line.split('[CHAT]')[1].startsWith(' ONLINE: ') && !line.split('[CHAT]')[1].startsWith(' Party ')))
    {
      // ignore player chat, but allow party and ONLINE: to bypass
      return false;
    }
    // Detect new API key and do relevent work
    // The indexOf checking is needed to ensure that nobody can just type in chat " [CHAT] Your new API key is [xyz]" and inject a fake key
    if (line.includes(" [CHAT] Your new API key is ") && (line.indexOf(" [CHAT]") == line.lastIndexOf(" [CHAT]")))
    {
      new_api_key = line.split(' [CHAT] Your new API key is ')[1];
      // I would just set it here, but we do it after all lines are checked to ensure that someone who did `/api new` twice in a short spam wont cause bugs
    };
    var nickDetect = false;
    // Detects if we join a new match through  [CHAT] Sending you to && [CHAT] (nicked_alias) has joined
    if (aliases !== undefined && Object.values(aliases).includes(key_owner))
    {
      Object.keys(aliases).filter(function(key) {return aliases[key] === key_owner}).forEach(function (nick) // Could be multiple, so we forEach it. I can't imagine this being very many.
      {
        if (line.includes(" [CHAT] " + nick + " has joined"))
        {
          nickDetect = true;
        }
      });
    }
    // Detects if we join a new match through  [CHAT] Sending you to && [CHAT] (key_owner) has joined
    if (nickDetect || line.includes(" [CHAT] " + key_owner + " has joined") || line.includes(" [CHAT] Sending you to ")) // When we join a new match
    {
      // Still not completely consistent for an nicked, un-aliased account. Should be consistent enough to give them the warning, though.
      playerList = []; // Re-initalize list
      outOfGame = [];
    }


    // Detects a new player through [PLAYER] has joined!
    if (line.includes(' [CHAT] ') && line.includes('has joined')) // Another Player joins, add them to playerList
    {
      var playerName = line.split(" [CHAT] ")[1].split(" ")[0];
      if(!playerList.includes(playerName)) 
      {
        playerList.push(playerName);
      }
      // Gets the x from (x/16)! (or (x/8), whatever) and assigns it to largestCount
      largestCount = parseInt(line.split(" [CHAT] ")[1].split(" ")[3].split('/')[0].replace('(', ''));
    }
    // Detection through [PLAYER] has quit!
    else if (line.includes(' [CHAT] ') && line.includes('has quit!')) // Another Player leaves, remove them from playerList
    {
      var playerName = line.split(" [CHAT] ")[1].split(" ")[0];
      const index = playerList.indexOf(playerName);
      if (index > -1) {
        playerList.splice(index, 1);
      }
      largestCount--;
    }
    // Detection through /who
    else if (line.includes(' [CHAT] ONLINE: '))
    {
      var playerNames = line.split(" [CHAT] ONLINE: ")[1].split(" "); // TODO: Add all to player list (without doubles)
      for(var i = 0; i < playerNames.length; i++)
      {
        playerNames[i] = playerNames[i].replace(",", "").trim(); // It works fine on linux without the .trim(), but windows sneaks in a newline character
      };
      playerList = playerNames; // Fully re-set list to the /who, because /who will always be the full story anyways.
      outOfGame = [];
    };



    // Check for finals
    if (line.includes(' [CHAT] ') && line.includes('FINAL KILL!')) // Another Player joins, add them to playerList
    {
      var playerName = line.split(" [CHAT] ")[1].split(" ")[0];
      if(!outOfGame.includes(playerName)) 
      {
        outOfGame.push(playerName);
      }
    }

    // Check for leaves
    if (line.includes(' [CHAT] ') && line.includes('disconnected')) // Another Player joins, add them to playerList
    {
      var playerName = line.split(" [CHAT] ")[1].split(" ")[0];
      if(!outOfGame.includes(playerName)) 
      {
        outOfGame.push(playerName);
      }
    }
    if (line.includes(' [CHAT] ') && line.includes('reconnected.')) // Another Player joins, add them to playerList
    {
      var playerName = line.split(" [CHAT] ")[1].split(" ")[0];
      if(outOfGame.includes(playerName)) 
      {
        const index = outOfGame.indexOf(playerName);
        if (index > -1) {
          outOfGame.splice(index, 1);
        };
      }
    }



    /////////////////
    // Party Stuff //
    /////////////////

    // Detect new party
    if (line.includes('You have joined') && line.includes('party!')) // Another Player joins, add them to playerList
    {
      // Reset
      partyList = [];
      // Get leader name
      var matchStr = line.match(/\b\w+'s\b/);
      if (!matchStr)
      {
        // this happens if their name ends in s
        // is there probably a better way to do this? definately
        // am i gonna do it? not right now probably later when i eventually refactor this whole mistake of a function
        matchStr = line.match(/\b\w+'/);
        matchStr = matchStr[0].slice(0, -1);
      }
      else
      {
        matchStr = matchStr[0].slice(0, -2);
      }

      // Push to list
      if (matchStr) partyList.push(matchStr.trim());
    }
    // Detect existing players in party (on join)
    if (line.includes('You\'ll be partying with: '))
    {
      var names = line.split('You\'ll be partying with:')[1];
      names = names.match(/ \w+/g);
      // I'm not very good at regex, but I'm trying
      for (let i = 0; i < names.length; i++) { names[i] = names[i].trim(); }
      names.forEach(name => { partyList.push(name); });
    }
    // new player joined
    if (line.includes(' joined the party.'))
    {
      var name = line.split('[CHAT]')[1].match(/\b(?<!\[)\w+\b/);
      partyList.push(name[0]);
    };
    // player left
    if (line.includes(' has left the party.'))
    {
      // get name
      var name = line.split('[CHAT]')[1].match(/\b(?<!\[)\w+\b/);
      // remove from list
      const index = partyList.indexOf(name[0]);
      if (index > -1) {
        partyList.splice(index, 1);
      }
    };
    // kicks
    if (line.includes(' has been removed from the party.'))
    {
      var name = line.split('[CHAT]')[1].match(/\b(?<!\[)\w+\b/);
      const index = partyList.indexOf(name[0]);
      if (index > -1) {
        partyList.splice(index, 1);
      }  
    };
    // disconnect kicks
    if (line.includes(' was removed from your party.'))
    {
      var name = line.split('[CHAT]')[1].match(/\b(?<!\[)\w+\b/);
      const index = partyList.indexOf(name[0]);
      if (index > -1) {
        partyList.splice(index, 1);
      }  
    };

    // `/p list` ones:
    if (line.includes('Party Leader: '))
    {
      var names = line.split('Party Leader:')[1];
      var name = names.match(/ \w+/)[0].trim();
      if (!partyList.includes(name)) partyList.push(name);
    };
    if (line.includes('Party Moderators: '))
    {
      var names = line.split('Party Moderators:')[1];
      names = names.match(/ \w+/g);
      // I'm not very good at regex, but I'm trying
      for (let i = 0; i < names.length; i++) { names[i] = names[i].trim(); }
      names.forEach(name => { if (!partyList.includes(name)) partyList.push(name); });
    };
    if (line.includes('Party Members: '))
    {
      var names = line.split('Party Members:')[1];
      names = names.match(/ \w+/g);
      // I'm not very good at regex, but I'm trying
      for (let i = 0; i < names.length; i++) { names[i] = names[i].trim(); }
      names.forEach(name => { if (!partyList.includes(name)) partyList.push(name); });
    };

    // disband/leave
    if (line.includes('has disbanded the party!') || line.includes('The party was disbanded because all invites'))
    {
      partyList = [];
    };
    if (line.includes('You left the party.'))
    {
      partyList = [];
    };
    if (line.includes('You are not currently in a party.'))
    {
      partyList = [];
    };
    if (line.includes('You have been kicked from the party'))
    {
      partyList = [];
    }
  });

  // Validate that the names are legit. (This keeps random stuff like [Master] ranks from other servers from interfering. Also technically security, as someone could theoretically inject a <script>)
  playerList.forEach(player => {
    if(!(player.match(/^\w+$/i)))
    {
      console.error("An invalid name was detected! (This is nothing to worry about)");

      // Remove name from array
      playerList = playerList.filter(function(name) {
        return name !== player;
      });

      largestCount--; // Account for list size change
    }
  });
  outOfGame.forEach(player => {
    if(!(player.match(/^\w+$/i)))
    {
      console.error("An invalid final was detected! (This is nothing to worry about)");

      // Remove name from array
      outOfGame = outOfGame.filter(function(name) {
        return name !== player;
      });

      largestCount--; // Account for list size change
    }
  });

  // Reset frontend list entirely if in a new lobby (largestCount > playerList.length).
  // This works because we reset the playerList back to just the owner when a new lobby is detected.
  // The (largestCount < playerList.length) will occur when someone is aliased wrong. We don't like that still, but we can handle it here.
  // I know this is programmically the same as (largestCount !== playerList.length), but I like it this way for the concept of it
  if ((largestCount > playerList.length || largestCount < playerList.length) && !arrayEquals(playerList, playerListTemp))
  {
    // We only want to do this during normal operation
    if (largestCount > playerList.length)
    {
      mainWindow.webContents.send('playerList', []); // Clear the page so that the key owner's stats can update
    }

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
    playerList = []; // Reset so it doesnt yell at us for being "nicked"
    outOfGame = [];
    updateFrontend();
  }

  return;
};

function updateFrontend()
{
  mainWindow.webContents.send('playerList', playerList);
  mainWindow.webContents.send('outOfGame', outOfGame);
  mainWindow.webContents.send('partyList', partyList);
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


app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
})