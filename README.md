# HypixelStats

[<p align="center"><img src="/bootstrap/imgs/logo.png" width="350px"></p>](https://github.com/EthanHarv/HypixelStats/releases/latest)

HypixelStats is a cross-platform, open-source project that aims to be the easiest way to get stats about the players in your games.

Works for more than just bedwars! You can define exactly what you want to see and how you want to see it, making it the most configurable option out there!

Not associated with Hypixel Inc.

[Watch the Getting Started guide!](https://www.youtube.com/watch?v=dnQOkYA3pNE)

[Join the discord!](http://discord.gg/yAAz4UkNb5)

## [Download the latest release here](https://github.com/EthanHarv/HypixelStats/releases/latest)

[![Main Page](https://media.discordapp.net/attachments/821280850061819945/836355148669911050/unknown.png)](https://github.com/EthanHarv/HypixelStats/releases/latest)

[![Overlay Bedwars](https://media.discordapp.net/attachments/821280850061819945/842210554940751932/unknown.png)](https://github.com/EthanHarv/HypixelStats/releases/latest)

[![Overlay Duels](https://media.discordapp.net/attachments/833380433076813824/842209825999814687/unknown.png)](https://github.com/EthanHarv/HypixelStats/releases/latest)

## Features

### <b>NOTE: HypixelStats is only currently compatible with Lunar Client. Support for other clients coming soon!</b>

- Automatically detects when you join new game, sends /who to get the full list, and automatically detects when players leave/join and adds/removes them from the list.
    - Auto `/who` should work fine with nothing else on windows, other platforms require Java to be installed in the PATH.
- Fully configuarable view of stats, with on-the-fly profile switching (with keybinds!) for easy viewing of any stats you want, at any time.
    - Also includes assignable colors based off of stats, as well as the ability to sort the list by any (numeric) stat.
- An overlay for easy stat-viewing
- Includes the ability to whitelist/blacklist players for quick identification. By default, whitelisted players appear green and blacklisted players appear red. (This is configurable in the profiles!)
- Detects nicked players and displays them as yellow by default (also configurable).
- Keeps track of every player you've run into since you opened the app (single-session), for ease of blacklisting or whitelisting players you've recently played with.
- Built-in plancke.io search

## Features in the works

- Compatibility with vanilla client
    - Won't be adding compatiblity with BLC as I don't support the devs, use lunar or vanilla.
- Automatic, temporary party whitelisting with `/p list` (toggable)
- Support for custom APIs
    - A custom api.hypixelstats.com database, with reporting features to identify hackers/snipers.

## Installing, Getting Set Up, and Updating

### Installing
- Go to the latest release (on the right side of this page).
- If you're on windows, download `HypixelStats.exe` and run it.
    - Your antivirus will probably throw a fit. It's fine, just ignore the warnings and continue. You can look at and compile the code yourself if you don't trust me (hey, I get it).
    - Complete the installer.
    - The installer should automatically create a Desktop Icon. You can run the program from there.
- If you're on linux, use the `.AppImage` and you're done.
- If you're on MAC, reference the [Building](https://github.com/EthanHarv/HypixelStats/wiki/Building) article.

### Setup

1. To get started, get your hypixel key. You can do this just by joining hypixel and doing `/api key`. Then, go to `Settings -> Application Settings`, and put it in.
    - Any time you switch to an alt account, make sure to do `/api new` and it will ***automatically*** detect it and set it for you. (You don't even have to be on the Settings page! It'll pick it up anywhere). It can break things if you don't do this.

2. You will also need to set your log path. Open the lunar client launcher, go to the "about" tab, and click "open logs folder in file explorer." Here you should see a `renderer.log` file. Make sure to give the <b>FULL</b> path to this file, e.g. `C:\Users\me\.lunarclient\logs\renderer.log`

3. Once your log location is set, close the app entirely and start it again. (I know, it's a bit annoying, but you only have to do this once.)

Done!

You can now join a game and see all the stats!

***NOTE***: If you ever play nicked, make sure to go to the Aliases tab and set your nickname! It can break things if you don't.

### Updates

When a new update is available (Windows + Linux, MAC users reference [Building](https://github.com/EthanHarv/HypixelStats/wiki/Building)), you'll see a prompt in the top right of the dashboard to update. Click it, and you're done! It's that easy.
