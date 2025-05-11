<img align="right" width="23%" src="https://github.com/happyme531/clxTools/assets/20812356/1706f681-a66a-44a8-b09f-83362c1df2f8" alt='"Java"Script'>

# clxTools

It is suitable for some RPG mobile games, such as the automatic script of Chu Liuxiang (A Dream of Jianghu). Automatic scripts for some mobile RPGs, such as netease ChuLiuXiang.

Script file: [Click me to download] (https://github.com/happyme531/clxTools/archive/master.zip)

Script running environment: AutoX (a fork of Auto.js). [Enter apk download] (https://github.com/kkevsekk1/AutoX/releases)/[enter the project homepage] (https://github.com/kkevsekk1/AutoX). (Version 6.5.9 is recommended)

Note: The paid version of Auto.js is not supported.

## Installation instructions

1. Download:

Download the script file first: [Script file] (https://github.com/happyme531/clxTools/archive/master.zip)

If the above link cannot be accessed, you can also click [Mirror Address] (https://gh.api.99988866.xyz/https://github.com/happyme531/clxTools/archive/m Aster.zip) download

Then download the script running environment (AutoX): [enter apk download] (https://github.com/kkevsekk1/AutoX/releases) (version 6.5.9 is recommended)

2. Installation:

- Click the downloaded apk file to install AutoX

- Open the autoX.js software from the mobile phone desktop, grant permissions and exit.

- Unzip the script compression package (clxTools-master.zip) into the folder named "Script" in the root directory of the internal storage of the mobile phone, for example: script/clxTools-master (/sdcard/script/clxTools-ma Ster/)

- Installation completed

3. Run:

- Open AutoX.js, click the menu in the upper left corner to open the sidebar, and turn on the "floating window" switch.

- It is recommended to enter the settings in AutoX.js and turn on the "volume up key to stop all scripts" switch, so that the script can be stopped by the volume up key.

- In the game, you can run the script through the floating window.

## Update instructions

Download the latest version of the script file according to the download method in the installation instructions, and unzip it to overwrite the original file. Most configurations will not be lost, but for security reasons, it is recommended to rename the original script folder to another name before updating and keep it for backup.

This project is currently in the development stage and is updated frequently. It is recommended to update the script file from time to time.

------

## Functional module description

### Chu Liu incense brush intimacy

A powerful automatic messaging tool, theoretically applicable to any mobile game

Special functions:

+ ADJUSTABLE SENDING SPEED

+ Custom send content

+ The sent content includes the time, the current number of articles, or a random ancient poem

+ Randomly send customized text (custom.txt), preset: collection of slow coquettish words

+ Automatically turn off the screen after sending (root is required)

### Collection of slow coquettish words.txt

~~** The slow-voiced players are all talented and talk well. I like them very much! **~~

In the slow voice area, people often post all kinds of dirty words in the world chat area that make people feel that it is absolutely a great loss not to copy them, so there is [this collection!] ( https://github.com/happyme531/clxTools/blob/master/%E6%A5%9A%E7%95%99%E9%A6%99%E5%88%B7%E4%BA%B2%E5% AF%86%E5%BA%A6/custom.txt)

### Chu Liuxiang Music Box

At present, the most comprehensive mobile game automatic playing (playing the piano) tool

+ Supported games and configurations:

- Chu Liuxiang (A Dream of Jianghu)

- Tianya Mingyue Knife Mobile Game

- Genshin Impact (Fengwu's Poetry Qin/Old Poetry Qin/Evening Wind Horn)

- Light encounter (3x5/2x4 key position)

- Anti-water cold mobile game (3x7/3x12/1x7 key position/professional mode)

- Egg Party (21/15/36 keys)

- Dawn Awakening

- Obi Island (22/15 keys)

- Harry Potter: Magic Awakening (Professional/Normal Mode)

- The fifth personality (21/36 keys)

- Eternal disaster

- Yin and Yang Master

- Moore Manor (21/36 keys)

- After tomorrow (21/36/88 keys)

- Yuanmeng Star (21/36 keys)

- Heartwarming Town (double row 15 keys/three rows 15 keys/22 keys/37 keys)

- The Legend of the Heroes (22/37 keys)

- QQ Flying Car

- Creation and magic

- Delusional Mountains and Seas (21/36 keys)

- Planet: Restart (88/33 keys)

- Wilderness Operation

- Minecraft (21/36 keys)

- Mini World (21/36 keys)

- Cat and mouse

- Home time

- Sword Net 3

- In the name of shining

- There is a family in the depths of Taoyuan (15/21 keys)

- Seven Days World

- Other games that play music through the touch screen, and the notes are distributed in the matrix

+ Modular design, easy to add new games

+ Automatically identify the game and automatically obtain coordinates (completed in 10 seconds, no need to fill in manually)

+ Multiple music format input (MIDI, Tone.js JSON, DoMiSo, SkyStudio), audio track selection

+ Free cloud music library with about 1,000 songs! (Thanks to the API provided by autoplay.chimomo.cn)

+ File search, red heart collection, custom song list function

+ Score optimizer designed for in-game performance:

- Automatic transposed (avoid black keys), automatic tone up and down (range optimization)

- Multi-touch optimization/chord splitting

- Skip the blank

- Overall speed change/speed limit/remove too frequent notes

- Insert random error (camouflage handball)

- Join your own optimization pass!

+ The key/gesture generation algorithm covers the entire range of the musical instrument in each game, and the effect far exceeds the fixed 21/15 keys.

- Fully support the range with black keys/semitone or non-continuous (36 keys, 8 keys, the old poetry of the original god...)

- Fully support the professional mode of reverse water cold (48/50 keys...)

+ Support real note duration/long note (long press) (light encounter: violin, saxophone; reverse water cold: flute; ...)

+ Real-time visualization of sheet music

+ Follow-up/Practice mode

- Simple follow-up mode, click the glowing button to play

- The advanced follow-up mode inspired by the music score animation of the light encounter guides you to play in the form of animation.

- Vibration prompt

- Follow-up/practice mode is applicable to all games

+ lrc lyrics display

- Load lrc lyrics and display them synchronously during performance

- Jump to the specified time

- Lyrics time synchronization will not be affected by operations such as speed change/skipping blanks.

+ Real-time MIDI streaming

- Use the electric piano/MIDI keyboard/various MIDI-enabled controllers to play in mobile games!

- Support Pocket Music Keyboard (EasyPlay 1s) / Magic Music Keyboard

- Wired/Bluetooth wireless connection, low latency

- Use mobile games as a synthesizer in a sense?

- Support transmodulation, continuous click to simulate long notes

+ High performance, low latency, 1w notes will not be stuck (try some black score?)

+ Export as a keyboard score

<!-- [View details](https://github.com/happyme531/clxTools/blob/master/%E6%A5%9A%E7%95%99%E9%A6%99%E9%9F%B3% E4%B9%90%E7%9B%92/README.md) -->

### Chu Liuxiang Music Box_pc version

The MIDI-to-key key configuration file based on Bome MIDI Translator is suitable for PC games played in the game through keyboard keys. As long as the keys used are the same, it can be used. At least it supports Chu Liuxiang (One Dream Jianghu)/Genshin. After the simulator keyboard mapping, it is also applicable to the above mobile games.

### Million Run Business Calculator

Based on the algorithm of <https://www.bilibili.com/video/BV1EM4y1V7TB>, it has not been tested in detail.

### Chu Liuxiang_Secret Order Terminator

The tool that automatically blasts Chu Liuxiang's secret order in the "Jianghu Enters the Dream" activity, and the script contains many known secret orders. When using, you need to open the script file by yourself to modify the coordinates of the dialog box.

### Chu Liuxiang_Zhushi Brush Popularity

Because no one plays it, this script has been abandoned.

### Chu Liuxiang's picture turns to the wall

A tool for automatic painting on the shadow wall of the mansion

+ Draw general bitmaps by pixel-by-pixel clicks, automatically recognize/switch colors, high degree of completion, average clarity, limited optional colors.

Before use, it is recommended to run the script once to check the best resolution of the picture, and then manually adjust the resolution of the picture.

+ The script has a built-in GCode parser, which can directly draw standard GCode files, and the clarity is quite high. However, there is a problem with the game implementation. The thinnest lines are often disconnected in the middle when drawing, resulting in a effect that is not as good as the preview. Repeated drawing can alleviate this problem.

Using software such as Inkscape or GRBLPlotter, vectors can be converted into GCode files, and then drawn with this script.

The lower left corner of the drawing board is the origin, to the right is the positive direction of the X axis, the upward direction is the positive direction of the Y axis, the distance unit is pixels, the feed speed unit is pixels/minute, the negative number of the Z axis is the falling stroke, and the positive number is the lifting pen (or M3 falling pen, M5 lifting pen).

### ~~ Against the water cold mobile game_House listening sound placement (currently unavailable)~~

In the manor of the cold mobile game against the water, the listening bone card is automatically placed, and the music can be played when running over. [Effect Display] (https://www.bilibili.com/video/BV11j411o7Az)

Based on the algorithm of **Chu Liuxiang Music Box**, the effect is very good.

### Characteristic Poem.txt

Based on the bug collection of Chu Liuxiang in the format of Minecraft characteristic poem, new bugs are rarely updated at present.

### Text to color words

A tool to insert color codes into known sentences to generate rainbow characters. Many NetEase mobile games use the same color code, and this tool can also be used.

Tips: In Chu Liuxiang, the floating public chat window can enter 99 characters, while the sidebar can only enter 50 characters. However, the information sent by the floating window cannot be copied, reply, +1.

### Automatic piano-nyan cat

The earliest form of the "Chu Liuxiang Music Box" project. At that time, Chu Liuxiang was the first to add the mechanism of playing the piano to the mobile game. This was the earliest targeted script development, in which the score could only be converted manually. Now there is basically no practical value.

### Automatic ai black and white chess

For the script developed by Chu Liuxiang's "impermanent chess", the algorithm was not written by me. It destroys the fairness of the game and the calculation is slow. It is recommended to only use it to fight against npc ("Rhinoceros Battle"). Coordinates need to be modified manually, and the accuracy of coordinates is very high. It is recommended to use ps analysis after taking screenshots.

## Star History

[![ Star History Chart](https://api.star-history.com/svg? repos=happyme531/clxTools&type=Date)](https://star-history.com/#happyme531/clxTools&Date)

--------

## Open Source Protocol

[LGPLv2.1](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html)

Derivative projects:

- [QiuMusicPro](https://qiu.zhilill.com/code/a729e3167514f8d2235e4a565c47d472) / [Partial source code](https://gith ub.com/CencYun/QiuMusicPro): Based on the free automatic performance app of **Chu Liuxiang Music Box**, there are many online scores, but other functions are limited.

Note: It is strongly recommended not to join their QQ group, because the atmosphere in the group is very bad, and the corresponding app account will be banned after leaving the group!

- [midi-Streamer-Assistant](https://github.com/Jayce-H/midi-Streamer-Assistant): MIDI streaming based on ** Chu Liuxiang Music Box** Assistant, only the streaming function is retained.

--------

### by Yimeng Jianghu (Chu Liuxiang):: Slow Voice:: Xinmu Liuxia:: Li Mango

![ 1658421643](https://user-images.githubusercontent.com/20812356/180462109-b9971abc-ad18-4e2e-9284-fdb F1856a8e3.jpg)

Official QQ communication group: 954694570 (slow, if you have any questions, it is recommended to open the issue directly or send an email)