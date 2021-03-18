const { app, webContents, BrowserWindow, Menu, MessageChannelMain } = require('electron');
const process = require('process');
const chokidar = require('chokidar');
const readLastLines = require('read-last-lines');
const console = require('console');
const { localStorage, sessionStorage } = require('electron-browser-storage');

let mainWindow;

// Start when app ready
app.on('ready', function()
{
  // Create window
  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: true
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
const watcher = chokidar.watch('/home/zonee/.lunarclient/logs/launcher/renderer.log',  // TODO: Make Dynamic Path!
{
  persistent: true,
  usePolling: true // Unfortunately higher CPU usage, but seems reqiored to get it to work consistently
});

watcher.on('change', path => fileUpdated(path));

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

async function checkForPlayer(lines)// This function is so incredibly inefficent, but it's the best I've got right now, so it's what we're using.
{
  key_owner = await localStorage.getItem('key_owner'); // I feel like there must be a much better way to do this but this is what I'm going with
  playerListTemp = [...playerList];
  const newMatchCheck = "[Client thread/INFO]: [CHAT] "+key_owner+" has joined"; // TODO: MAKE DYNAMIC
  lines.forEach(function(line)
  {
    if (line.includes(newMatchCheck)) // When self joins, re-start array and /who
    {
      playerList = [key_owner]; // TODO: MAKE DYNAMIC
    }
    else if (line.includes('[Client thread/INFO]: [CHAT] ') && line.includes('has joined')) // Another Player joins, add them to playerList
    {
      var playerName = line.split("[Client thread/INFO]: [CHAT] ")[1].split(" ")[0];
      if(!playerList.includes(playerName)) 
      {
        playerList.push(playerName);
      }
    }
    else if (line.includes('[Client thread/INFO]: [CHAT] ') && line.includes('has quit!')) // Another Player leaves, remove them from playerList
    {
      var playerName = line.split("[Client thread/INFO]: [CHAT] ")[1].split(" ")[0];
      const index = playerList.indexOf(playerName);
      if (index > -1) {
        playerList.splice(index, 1);
      }
    }
    else if (line.includes('[Client thread/INFO]: [CHAT] ONLINE: '))
    {
      var playerNames = line.split("[Client thread/INFO]: [CHAT] ONLINE: ")[1].split(" "); // TODO: Add all to player list (without doubles)
      for(var i = 0; i < playerNames.length; i++)
      {
        playerNames[i] = playerNames[i].replace(",", "");
      };
      playerList = playerList.concat(playerNames.filter((name) => playerList.indexOf(name) < 0));
    };
  });
  // Detect if array just changed AND it's only one player.
  // There is an edgecase here where you join a new match and other people join too quickly for it to parse it out
  // I'll deal with it if it becomes a problem
  if (arrayEquals(playerList, [key_owner]) && (!arrayEquals(playerList, playerListTemp))) // TODO: MAKE DYNAMIC 
  {
    //console.log("You just gotta type /who ig");
    mainWindow.webContents.send('clearList');
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