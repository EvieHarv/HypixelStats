const { app, webContents, BrowserWindow, Menu, MessageChannelMain, ipcMain } = require('electron');
const process = require('process');
const chokidar = require('chokidar');
const readLastLines = require('read-last-lines');
const console = require('console');
const Store = require('electron-store');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

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
});

// Make sure store values are defined
function checkUndefineds()
{
  // Set up default profile for a new user
  if (store.get('profiles') == undefined)
  {
    profiles = {
      "Bedwars" : {
        "stats" : {
          "Winstreak" : "data.player.stats.Bedwars.winstreak",
          "FKDR" : "data.player.stats.Bedwars.four_four_final_kills_bedwars/data.player.stats.Bedwars.four_four_final_deaths_bedwars",
          "Stars" :  "data.player.achievements.bedwars_level"
        },
        "colorConditions" : {
          "blacklist.includes(playerName)" : "#E74A3B",
          "whitelist.includes(playerName)" : "#1CC88A",
          "isNick" : "#F6C23E",
          "data.player.channel == 'PARTY'" : "#36B9CC",
          "(data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars) > 5" : "#e74a3b"
        },
        "sort" : "(data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars)",
        "sortOrder" : "descending"
      },
      "Duels" : {
        "stats" : {
          "Sumo Winstreak" : "data.player.stats.Duels.current_sumo_winstreak",
          "Sumo W/L" : "data.player.stats.Duels.sumo_duel_wins/data.player.stats.Duels.sumo_duel_losses",
          "UHC Winstreak" : "data.player.stats.Duels.current_uhc_winstreak",
          "UHC W/L" : "data.player.stats.Duels.uhc_duel_wins/data.player.stats.Duels.uhc_duel_losses"
        },
        "colorConditions" : {
          "blacklist.includes(playerName)" : "#E74A3B",
          "whitelist.includes(playerName)" : "#1CC88A",
          "isNick" : "#F6C23E"
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
          "blacklist.includes(playerName)" : "#E74A3B",
          "whitelist.includes(playerName)" : "#1CC88A",
          "isNick" : "#F6C23E",
          "data.player.channel == 'PARTY'" : "#36B9CC",
          "(data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars) > 5" : "#F6C23E"
        },
        "sort" : "(data.player.stats.Bedwars.four_four_final_kills_bedwars / data.player.stats.Bedwars.four_four_final_deaths_bedwars)",
        "sortOrder" : "ascending"
      }
    };
    store.set('profiles', profiles);
    store.set('active_profile', 'Bedwars');
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
          checkForPlayer(lastLines.split('\n').filter(function(l){return l != '';})) // TODO: Call Function to update player list
      })
      .catch((err)=> {
          console.error(err)
      });
};

var playerList = []; // Is this bad practice in javascript, or is this okay? I'm gonna go with it being okay, because it works.

const arrayEquals = (a, b) =>
  a.length === b.length &&
  a.every((v, i) => v === b[i])

largestCount = 0;
function checkForPlayer(lines)// This function is so incredibly inefficent, but it's the best I've got right now, so it's what we're using. (It also just really does not matter at this scale, I've noticed 0 performance issues.)
{
  playerListTemp = [...playerList];
  var key_owner = store.get('key_owner');
  var aliases = store.get('aliases');
  lines.forEach(function(line)
  {
    var nickDetect = false;
    // Detection through [Client thread/INFO]: [CHAT] Sending you to && [CHAT] (nicked_alias) has joined
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
    // Detection through [Client thread/INFO]: [CHAT] Sending you to && [CHAT] (key_owner) has joined
    if (nickDetect || line.includes("[Client thread/INFO]: [CHAT] " + key_owner + " has joined" || line.includes("[Client thread/INFO]: [CHAT] Sending you to "))) // When we join a new match
    {
      // Still not completely consistent for an nicked, un-aliased account. Should be consistent enough to give them the warning, though.
      playerList = []; // Re-initalize list
    }
    // Detection through [PLAYER] has joined!
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
  // Detect a new lobby
  if (largestCount > playerList.length && !arrayEquals(playerList, playerListTemp))
  {
    // This will constantly re-load when a new player joins UNTIL the user does /who.
    // I would just set it to require playerList.length == 1, but then sometimes it won't catch a new game at all, 
    // because the chat-update-delay would often catch more than 1 player and then *not* update already-existing players (namely key_owner).
    // So, until I figure out auto /who, I'm taking the "always update until /who" route
    
    // TODO: FIGURE OUT HOW TO SEND /who CROSSPLATFORM AND DO IT HERE
    mainWindow.webContents.send('playerList', []); // Clear the page so that the owner's stats can update
  }
  // Detect if array
  updateFrontend();
  playerListTemp = null; // Garbage collection? I dunno how JS works man.
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