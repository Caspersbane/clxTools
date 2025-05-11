# Chu Liuxiang Music Box:: Help to use

Welcome to the oldest, most advanced, effective and completely open-source free mobile phone automatic playing artifact of its kind: Chu Liuxiang Music Box

## 1. Download and install

In fact, if you click "Usage Instructions" from the script to enter this page, then you have already installed it.

Otherwise, please refer to [https://github.com/happyme531/clxTools/blob/master/README.md](https://github.com/happyme531/cl Description in xTools/blob/master/README.md).

## 2. Import music files

Just put the music file in the "Chu Liuxiang Music Box" directory in the internal storage of the mobile phone, and you can see the imported files by running the script. If you can't see this directory, please run the script once and then check it.

Currently supported file types:

1. MIDI:

This is one of the most common music file formats in the world.

The file suffix is .mid.

All kinds of midi music can be found everywhere on the Internet. You can search and download the music you want by yourself.

The download website I recommend is: https://www.midishow.com/. Note: You need points to download, but you can get the same number of points for comments. You can listen to the comments first and then download.

- If you can't find the midi format of the music you want but can find the original piano video on b station, then use https://github.com/happyme531/GenshinImpactPianoExtract to Duan Yuanshen Piano Video is converted into a MIDI file that can be used by the script. ( The effect is good)

- You can use WIDI/piano-transcription/basicpitch and other software to convert mp3 to midi. ( The effect is not necessarily good)

2. DoMiSo:

This is a music file format developed by Nigh@github.com.

The original suffix of these music files is .txt. In order to recognize the script normally, you need to change the suffix name to .dms.txt.

See: https://github.com/Nigh/DoMiSo-genshin

3. Light encounter SkyStudio:

A music file format designed for light encounter performance.

The original suffix name of these music files is .txt. In order for the script to recognize it normally, you need to change the suffix name to .skystudio.txt.

- SkyStudio scores can be found in various places, and you can search and download the music you want by yourself.

- You can download [SkyStudio] (https://play.google.com/store/apps/details? id=com.Maple.SkyStudio) to arrange.

- You can find some scores on https://github.com/StageGuard/SkyAutoPlayerScript.

Note: The range of notes in this format is only C4-C6, a total of 15.

### Lyrics display

The script will automatically load the .lrc file with the same name as the music file under the music folder, and display the lyrics at the start of playback. Click the lyrics area to view all the lyrics, and click a certain line of lyrics to jump to the corresponding time.

## three. Game selection

Before using it, please select the option corresponding to your game in the main menu -> Global Settings -> Select Game/Musical Instrument menu.

If there is no corresponding instrument, just select "Default".

- Against the water cold mobile game professional mode: Please adjust the key range to the maximum when using it, otherwise the click position will be incorrect.

- Counter-water cold mobile game Flute: You need to turn on the chord optimization and adjust the maximum number of simultaneous keys to 1, otherwise there will be a serious sound leakage.

## four. Configuration instructions

- Operation mode

- Automatic playing: Automatic playing music.

- Follow-up mode (simple): Display the key prompts at the corresponding position on the screen, and you can play according to the prompts.

- Follow-up mode (light-like encounter): The advanced follow-up mode similar to light-up will prompt the pressed key and key time in the form of aperture, and use connection and animation to prompt melody changes. The animation is smooth and the effect is better.

- Music score visualization

- Use sheet music visualization: graphically display the list of key positions for a period of time on the screen, which is convenient to observe the structure of the song. At present, it is only valid for the keys of the grid arrangement.

### Follow-up mode configuration

- Pattern size:

Adjust the size of the key prompts in the follow-up mode.

- Draw a guide line for each note:

By default, only the guide line will be drawn between the key where the current highest note is located and the highest key in the next group. After turning on this option, a guide line will be drawn between each key in the next group.

+ If you want to practice multi-finger chords, turn it on to better see the position of other keys.

+ If you only intend to use a single finger, turning it off can reduce visual interference.

- Draw a guide line for the next note:

After turning on this option, a light guide line will also be drawn between the highest note in the next group and the highest note in the next group.

+ Open can better show the changes of the melody.

+ Closing can simplify the visual effect.

- Vibration effect:

Give vibration feedback when you need a key to help you better master the rhythm. You can choose four vibration intensities: off/weak/medium/strong.

### Speed control

- Variable speed:

Adjust the playback speed to make the song faster or slower as a whole.

- Limit the click speed:

By limiting the fastest click speed, the faster part of the song is slowed down, while the slower part remains unchanged. It will be applied after the speed change.

### Duration control (output)

- Duration output mode:

- Fixed value: For all notes, the duration of clicking the screen is a fixed value (default click duration). It is suitable for musical instruments that make the same sound length no matter how long you hold the button (this is the case with most games).

- Real duration (experimental): The duration of clicking the screen is the real duration of each note. It is suitable for the violin of the light encounter, the saxophone and the flute that can continue to make sound. Note: Only valid for MIDI and Tone.js JSON formats (because there is no real duration information in files in other formats). At present, it is in the experimental stage, and there may be problems such as game crash and system jamming.

- Default click duration:

Control the duration of each screen click in fixed value mode. It is recommended to be as small as possible, unless the game is not recognized by clicking too fast. Under normal circumstances, there is no need to adjust.

- The longest duration of gestures:

The maximum duration of each set of gestures in real duration mode. Too large a value may cause the floating window operation to be stuck, and too small a value may cause the long sound to be truncated, but the overall impact will not be great.

+ If the music stops after a long time after clicking the pause button, you can reduce this value.

+ If the long note in the song becomes significantly shorter, you can increase this value.

- Leave time between keys:

The interval between lifting and pressing the button twice in the real duration mode. Too small and too large may cause sound leakage, but the default value generally does not need to be adjusted. Inserting intervals between keys is a remedy for the current immature algorithm, which may be removed in the future.

+ If the short note is omitted, the value can be increased.

+ If many notes are significantly shortened, this value can be reduced.

- The maximum interval between adjacent notes:

If the interval between two notes is lower than this value, it is considered that they should be pressed at the same time.

+ If the notes that should be pressed at the same time are separated incorrectly, this value can be increased. It is recommended to increase it when exporting the keyboard score.

+ If the notes that are next to each other but should not be pressed at the same time are pressed at the same time, this value can be reduced.

### Sound range optimization

- Half-tone processing method:

There are 12 notes in an octave in the music, but most games only have 7 notes (no black keys). For notes without corresponding notes, you can choose to round down (play a note lower than this note) / round up (play a note higher than this note) / discard semitones (not play) / round up and down at the same time (play high and low bass at the same time). Under normal circumstances, there is no need to adjust.

- Automatically adjust the disabled audio track threshold:

For music with multiple tracks, some tracks may be very high/low, and some of the notes are beyond the range that the game can play. Automatic adjustment can disable these audio tracks and optimize the performance effect. The higher the value, the more audio tracks will be retained, and the lower the value, the more audio tracks will be disabled.

- Up/down octaves, up/down halftone:

Adjust the pitch of the song to adapt it to the range of the game. These two options will be set automatically during the first performance, and generally do not need to be adjusted manually. If you find that some notes are still out of range after automatic adjustment and the performance effect is not good, you can manually adjust the up/down octave setting.

- Move high-octave notes to the range:

If the note exceeds the range of the game, move the note above the octave to the range. Maybe it can improve the performance effect? If it doesn't sound right, you can turn off this option.

- Move low-octave notes to the range:

Same as above, but move notes below the octave of the range to the range.

- Audio track selection:

There are multiple audio tracks in some MIDI files. The content of the audio track may be the main melody, accompaniment, chord, etc. You can select the audio track to be played here, which defaults to all audio tracks.

### Chord optimization

- The maximum number of simultaneous keys:

Limit the maximum number of keys pressed at the same time when clicking on the screen. In some games, clicking too many buttons at the same time will cause sound leakage or abnormal sound. You can adjust this setting to optimize. If there are too many keys when practicing, you can also lower this value.

- How to limit the number of keys:

- Delete the excess: If the number of keys pressed at the same time exceeds the limit, delete the excess keys.

- Split into multiple groups: If the number of keys pressed at the same time exceeds the limit, divide the keys into multiple groups, each group does not exceed the limit, and there is a certain interval between them.

- Split into multiple groups of time intervals:

When divided into multiple groups, the interval between each group.

- Selection method:

- Priority treble: Prioritize treble, suitable for playing the main melody.

- Priority bass: Priority is bass.

- Random: Random selection. Generally, it is used together with "divided into multiple groups".

### Camouflage Handball (Total)

(These settings are global settings, which means that all songs will use these settings)

- Note time deviation:

Add a random deviation to the start time of each note, so that the playing effect is closer to the feeling of playing by hand. (But in actual use, it seems to be closer to the feeling of network delay?)

- Click position deviation:

Adding a random deviation to the position of each click on the screen may play a role in preventing the game from being recognized as a script operation. Set to 0 to close, too high a value will occasionally cause the wrong key to be pressed.

### Skip the blank

- Skip the prelude blank:

Skip the blank part of the prelude during playback and start playing directly.

- Skip the middle blank:

Omit the blank part of more than 5 seconds in the middle of the song during playback.

## Some tips

- Click the time display area of the floating window to move/zoom the floating window, and double-click to restore the default position and size.

## Additional function: MIDI streaming performance

Use this function to play MIDI files on the computer in real time, or connect electronic pianos/MIDI keyboards and other devices to play directly in the game.

1. Set the **USB configuration** of the mobile phone to **MIDI**. Some mobile phones can be selected directly after connecting to USB, and some mobile phones need to be set in **Developer Options**.

2. Connect the mobile phone to the computer, and the computer will recognize the MIDI device.

3. Turn on the **MIDI streaming** function of the script, select the MIDI output device as a mobile phone on the computer, and you can perform MIDI streaming performance.

4. When MIDI streaming, you can adjust the up and down octaves, transmulation and continuous clicks to simulate long notes and other settings in the setting interface.

## Bluetooth MIDI performance

Because Auto.js does not have the permission to control Bluetooth, Bluetooth MIDI cannot be used directly, and a small plug-in needs to be installed to achieve it.

1. Install the plug-in: There is a file named `midibtlepairing.apk` in the `Chu Liuxiang Music Box` directory (i.e. the music file directory) or the `exampleTracks` directory of the script folder in the internal storage of the mobile phone. Just install it.

2. Connect Bluetooth devices: open the plug-in, scan and connect Bluetooth MIDI devices.

3. Turn on the **MIDI streaming** function of the script, and you can recognize the Bluetooth MIDI device and perform MIDI performance. (No need to change the USB configuration)