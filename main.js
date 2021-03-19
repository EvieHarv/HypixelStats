const { app, webContents, BrowserWindow, Menu, MessageChannelMain, ipcMain } = require('electron');
const process = require('process');
const chokidar = require('chokidar');
const readLastLines = require('read-last-lines');
const console = require('console');
const Store = require('electron-store');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

autoUpdater.logger = log;
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
  
  //mainWindow.setAutoHideMenuBar(true);
  //mainWindow.menuBarVisible = false;

  // Build & Apply Menu 
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);
});

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

// TODO: DON'T HARDCODE THIS PATH
if (store.get('logPath') !== undefined)
{
  const watcher = chokidar.watch(store.get('logPath'),
  {
    persistent: true,
    usePolling: true // Unfortunately higher CPU usage, but seems reqiored to get it to work consistently
  });
  watcher.on('change', path => fileUpdated(path));
}

function fileUpdated(path)
{
  const lines = 25; // Maybe a bit much? Could bring down to 15—requires some testing.

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

function checkForPlayer(lines)// This function is so incredibly inefficent, but it's the best I've got right now, so it's what we're using. (It also just really does not matter at this scale)
{
  newLobby = false;
  playerListTemp = [...playerList];
  lines.forEach(function(line)
  {
    // Detection through [Client thread/INFO]: [CHAT] Sending you to 
    if (line.includes("[Client thread/INFO]: [CHAT] Sending you to ")) // When we join a new match
    {
      playerList = []; // Re-initalize list
      newLobby = true;
    }
    // Detection through [PLAYER] has joined!
    else if (line.includes('[Client thread/INFO]: [CHAT] ') && line.includes('has joined')) // Another Player joins, add them to playerList
    {
      var playerName = line.split("[Client thread/INFO]: [CHAT] ")[1].split(" ")[0];
      if(!playerList.includes(playerName)) 
      {
        playerList.push(playerName);
      }
    }
    // Detection through [PLAYER] has quit!
    else if (line.includes('[Client thread/INFO]: [CHAT] ') && line.includes('has quit!')) // Another Player leaves, remove them from playerList
    {
      var playerName = line.split("[Client thread/INFO]: [CHAT] ")[1].split(" ")[0];
      const index = playerList.indexOf(playerName);
      if (index > -1) {
        playerList.splice(index, 1);
      }
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
  // Detect if array just changed AND it's only one player.
  if (newLobby && (!arrayEquals(playerList, playerListTemp))) // Honestly I forget why I put in the second term. I don't think it's needed, but if I've learned one thing in programming it's don't touch something perfectly functional.
  {
    // Once I figure out a good cross-platform method of sending /who ill do it.
    // I've tried robotjs but for various reasons it wouldn't quite work out.
    mainWindow.webContents.send('clearList');
    updateFrontend();
  }
  else if (!arrayEquals(playerList, playerListTemp)) // Array has been updated
  {
    updateFrontend();
  }
  playerListTemp = null; // Garbage collection? I dunno how JS works man.
  return;
};

const { port1, port2 } = new MessageChannelMain()

function updateFrontend()
{
  mainWindow.webContents.send('playerList', playerList);
};