# HypixelStats

HypixelStats is a cross-platform, open-source project that aims to be the easiest way to get stats about the players in your games.

![Main Page](https://media.discordapp.net/attachments/414270111067668502/822399830004465694/unknown.png)

---

## Features

### <b>NOTE: HypixelStats is only currently compatible with Lunar Client. Support for other clients coming soon!</b>

- Automatically detects when you join new game, and automatically detects when players leave/join and adds/removes them from the list.
    - Currently, you still have to do `/who` once when you join to get the players already in the lobby. I'm currently working on an automatic system for this.
- Currently sorts by FKDR, and shows FKDR+Winstreak
    - This will be configurable in future releases!
- Includes the ability to whitelist/blacklist players for quick identification. Whitelisted players appear green, blacklisted players appear red.
- Detects nicked players and displays them as yellow.
- Keeps track of every player you've run into since you opened the app, for ease of blacklisting or whitelisting.
- Built-in plancke.io search

## Features in the works

- Compatibility with every popular client (lunar, badlion, vanilla).
- Ability to set what stats you want to see, from what games, and in what order.
    - Based on a profile system, so you can switch what you want to see easily at any given time. 
- Automatic party detection.
- Automatic coloring based off of stat critera. (e.g. Red if `FKDR > 4`)
- Automatic `/who` on join
- Reach goal: make into an overlay, similar to BedwarsStats overlay.

To be clear—I have nothing against the BedwarsStats overlay, and I'm not trying to cut into its success! I greatly respect the developer and all the hard work he has put in, especially regarding the sniper detection network. While this program is very similar, it has come out of a need for a cross-platform solution, because BedwarsStats is windows-only. Open-source is also a plus.

If you only have a single monitor, BedwarsStats is still superior. If you have two monitors, it's your choice of which one is easier to read and gives more relevent information. 

---

## Installing, Getting Set Up, and Updating

### Installing
- Go to the latest release (on the right side of this page).
- If you're on windows, download `HypixelStats.exe` and run it.
    - Your antivirus will probably throw a fit. It's fine, just ignore the warnings and continue. You can look at and compile the code yourself if you don't trust me (hey, I get it).
    - Complete the installer.
    - The installer should automatically create a Desktop Icon. You can run the program from there.
- If you're on linux, use the `.AppImage` and you're done.
- If you're on MAC, good luck. Run it with node.


### Setup

1. To get started, get your hypixel key. You can do this just by joining hypixel and doing `/api new`. Then, go to `Settings -> API Settings`, and put it in.

2. You will also need to set your log path. Open the lunar client launcher, go to the "about" tab, and click "open logs folder in file explorer." Here you should see a `renderer.log` file. Make sure to give the <b>FULL</b> path to this file, e.g. `C:\Users\me\.lunarclient\logs\renderer.log`

3. Once your log location is set, close the app entirely and start it again. (I know, it's a bit annoying, but you only have to do this once.)

Done!

You can now join a game, do `/who`, and see all the stats!

### Updates

When a new update is available, you'll see a prompt in the top right of the dashboard to update. Click it, and you're done! It's that easy.

---

## Disclaimer

This is my first time using node, electron, and a bunch of other web-like technologies. I'm completely self-teaching and just trying to build something that <i>works</i>, so maybe the best practices aren't always used. If you notice something off, feel free to submit an issue! I'm always willing to learn where I went wrong and what the better way to do it is.