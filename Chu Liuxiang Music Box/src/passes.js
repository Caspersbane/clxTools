//@ts-check
// passes.js 

var MusicFormats = require("./musicFormats.js");
var Humanifyer = require("./humanify.js");
var GameProfile = require("./gameProfile.js");
var Algorithms = require("./algorithms.js");

var noteUtils = require("./noteUtils.js");

/**
 * @brief Doing nothing passes, outputs the input as it is, and doesn't produce any statistics
 * @param {Object} config
 */
function NopPass(config) {
    this.name = "NopPass";
    this.description = "No-operation";
    /**
     * Run this pass
     * @template T
     * @param {T} input - Enter the data
     * @param {function(number):void} [progressCallback] - Progress callback function, parameter is progress (0-100)
     * @returns {T} - Returns the input data as-is
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (input, progressCallback) {
        return input;
    }
    this.getStatistics = function () {
        return {};
    }
}


/**
 * @brief Parse the music file based on the source file path, Output music data
 * @param {Object} config
 */
function ParseSourceFilePass(config) {
    this.name = "ParseSourceFilePass";
    this.description = "Parse the source file";

    let totalNoteCnt = 0;
    /**
     * Run this pass
     * @param {string} sourceFilePath - Source file path
     * @param {function(number):void} [progressCallback] - Progress callback function, The parameter is progress(0-100)
     * @returns {MusicFormats.TracksData} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (sourceFilePath, progressCallback) {
        let musicFormats = new MusicFormats();
        let tracksData = musicFormats.parseFile(sourceFilePath);
        totalNoteCnt = tracksData.tracks.reduce((acc, track) => acc + track.noteCount, 0);
        return tracksData;
    }

    this.getStatistics = function () {
        return {
            totalNoteCnt: totalNoteCnt
        };
    }

}

/**
 * @brief Merges all notes in a specified track into a single note array
 * @typedef {Object} MergeTracksPassConfig
 * @property {number[]} [selectedTracks] - An array of track sequence numbers to merge, If it is empty, all tracks are merged
 * @property {boolean} [skipPercussion] - Whether or not to skip percussion channels(Channel 10), Defaults to true
 * @param {MergeTracksPassConfig} config
 */
function MergeTracksPass(config) {
    this.name = "MergeTracksPass";
    this.description = "Merge audio tracks";

    let selectedTracks = config.selectedTracks;

    let skipPercussion = true;
    if (config.skipPercussion != null) {
        skipPercussion = config.skipPercussion;
    }

    /**
     * Run this pass
     * @param {MusicFormats.TracksData} tracksData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, The parameter is progress(0-100)
     * @returns {noteUtils.Note[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (tracksData, progressCallback) {
        if (!tracksData.haveMultipleTrack) return tracksData.tracks[0].notes;

        if (selectedTracks == null || selectedTracks.length == 0) {
            selectedTracks = [];
            for (let i = 0; i < tracksData.tracks.length; i++) {
                selectedTracks.push(i); //All audio tracks are selected by default
            }
        }

        let noteData = [];
        for (let i = 0; i < selectedTracks.length; i++) {
            if (selectedTracks[i] >= tracksData.tracks.length) continue;
            let track = tracksData.tracks[selectedTracks[i]];
            if (track.channel === 9 && skipPercussion) continue;
            noteData = noteData.concat(track.notes);
        }
        noteData.sort(function (a, b) {
            return a[1] - b[1];
        });
        return noteData;
    }
    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief Adds a random offset to the time of the entered note data, to simulate manual input
 * @typedef {Object} HumanifyPassConfig
 * @property {number} noteAbsTimeStdDev - Standard deviation of note time(millisecond)
 * @param {HumanifyPassConfig} config
 */
function HumanifyPass(config) {
    this.name = "HumanifyPass";
    this.description = "Camouflage manual input";

    let noteAbsTimeStdDev = 0;

    if (config.noteAbsTimeStdDev == null) {
        throw new Error("noteAbsTimeStdDev is null");
    }
    noteAbsTimeStdDev = config.noteAbsTimeStdDev;
    /**
     * Run this pass
     * @param {noteUtils.Note[]} noteData - Music data
     * @param {function(number):void} progressCallback - Progress callback function, The parameter is progress(0-100)
     * @returns {noteUtils.Note[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteData, progressCallback) {
        let humanifyer = new Humanifyer();
        humanifyer.setNoteAbsTimeStdDev(noteAbsTimeStdDev);
        noteData = humanifyer.humanify(noteData);
        return noteData;
    }
    this.getStatistics = function () {
        return {};
    }
}


/**
 * @brief Add an offset to the pitch of each note
 * @typedef {Object} PitchOffsetPassConfig
 * @property {number} offset - Pitch offset(Semitones are in units)
 * @param {PitchOffsetPassConfig} config
 */
function PitchOffsetPass(config) {
    this.name = "PitchOffsetPass";
    this.description = "Add an offset to the pitch of each note";

    let offset = 0;

    if (config.offset == null) {
        throw new Error("offset is null");
    }
    offset = config.offset;

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, The parameter is progress(0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteData, progressCallback) {
        for (let i = 0; i < noteData.length; i++) {
            noteData[i][0] += offset;
        }
        return noteData;
    }
    this.getStatistics = function () {
        return {};
    }
}

/**
 * @enum {number}
 * @constant
 */
var SemiToneRoundingMode = {
    //Do not do it
    none: -1,
    //Take the lower note
    floor: 0,
    //Take a higher note
    ceil: 1,
    //Delete notes
    drop: 2,
    //Take the lower and higher notes at the same time
    both: 3,
    //Alternate between lower and higher notes
    alternating: 4
}

/**
 * @brief Handle notes that cannot be played in the target game
 * @typedef {Object} LegalizeTargetNoteRangePassConfig
 * @property {SemiToneRoundingMode} semiToneRoundingMode - Chromatic processing
 * @property {number} [wrapHigherOctave] - Moves notes that are within n octaves of the highest note to range, The default value is 0
 * @property {number} [wrapLowerOctave] - Moves notes that are within n octaves of the lowest note to the range, The default value is 0
 * @property {GameProfile} currentGameProfile - Current game configuration
 * @param {LegalizeTargetNoteRangePassConfig} config
 */
function LegalizeTargetNoteRangePass(config) {
    this.name = "LegalizeTargetNoteRangePass";
    this.description = "Handle notes that cannot be played in the target game";

    let semiToneRoundingMode = SemiToneRoundingMode.floor;
    let wrapHigherOctave = 0;
    let wrapLowerOctave = 0;
    let currentGameProfile = null;

    let underFlowedNoteCnt = 0;
    let overFlowedNoteCnt = 0;
    let roundedNoteCnt = 0;
    let middleFailedNoteCnt = 0;
    let wrappedHigherNoteCnt = 0;
    let wrappedLowerNoteCnt = 0;
    let lastIsFloor = false;


    if (config.semiToneRoundingMode == null) {
        throw new Error("semiToneRoundingMode is null");
    }
    if (config.currentGameProfile == null) {
        throw new Error("currentGameProfile is null");
    }
    semiToneRoundingMode = config.semiToneRoundingMode;
    currentGameProfile = config.currentGameProfile;

    if (config.wrapHigherOctave != null) {
        wrapHigherOctave = config.wrapHigherOctave;
    }
    if (config.wrapLowerOctave != null) {
        wrapLowerOctave = config.wrapLowerOctave;
    }

    /**
     * Run this pass
     * @param {noteUtils.Note[]} noteData - Music data
     * @param {function(number):void} progressCallback - Progress callback function, The parameter is progress(0-100)
     * @returns {noteUtils.Note[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteData, progressCallback) {
        let processedNoteData = [];
        let noteRange = currentGameProfile.getNoteRange();

        for (let i = 0; i < noteData.length; i++) {
            let note = noteData[i];
            let midiPitch = note[0];
            //Out-of-range notes
            if (midiPitch < noteRange[0]) {
                if (midiPitch >= noteRange[0] - wrapLowerOctave * 12) {
                    midiPitch += 12 * Math.ceil((noteRange[0] - midiPitch) / 12);
                    note[0] = midiPitch;
                    wrappedLowerNoteCnt++;
                } else {
                    underFlowedNoteCnt++;
                    continue;
                }
            }
            if (midiPitch > noteRange[1]) {
                if (midiPitch <= noteRange[1] + wrapHigherOctave * 12) {
                    midiPitch -= 12 * Math.ceil((midiPitch - noteRange[1]) / 12);
                    note[0] = midiPitch;
                    wrappedHigherNoteCnt++;
                } else {
                    overFlowedNoteCnt++;
                    continue;
                }
            }
            let key = currentGameProfile.getKeyByPitch(midiPitch);
            if (key != -1) { //There are corresponding buttons, No processing is required
                processedNoteData.push(note);
                continue;
            }
            //semitone, It needs to be dealt with
            switch (semiToneRoundingMode) {
                case SemiToneRoundingMode.none:
                    processedNoteData.push(note);
                    break;
                case SemiToneRoundingMode.floor:
                    if (currentGameProfile.getKeyByPitch(midiPitch - 1) != -1) {
                        processedNoteData.push([midiPitch - 1, note[1], note[2]]);
                        roundedNoteCnt++;
                    }
                    break;
                case SemiToneRoundingMode.ceil:
                    if (currentGameProfile.getKeyByPitch(midiPitch + 1) != -1) {
                        processedNoteData.push([midiPitch + 1, note[1], note[2]]);
                        roundedNoteCnt++;
                    }
                    break;
                case SemiToneRoundingMode.drop:
                    break;
                case SemiToneRoundingMode.both:
                    if (currentGameProfile.getKeyByPitch(midiPitch - 1) != -1) {
                        processedNoteData.push([midiPitch - 1, note[1], note[2]]);
                        roundedNoteCnt++;
                    }
                    if (currentGameProfile.getKeyByPitch(midiPitch + 1) != -1) {
                        processedNoteData.push([midiPitch + 1, note[1], note[2]]);
                    }
                    break;
                case SemiToneRoundingMode.alternating:
                    if (lastIsFloor) {
                        if (currentGameProfile.getKeyByPitch(midiPitch + 1) != -1) {
                            processedNoteData.push([midiPitch + 1, note[1], note[2]]);
                            lastIsFloor = false;
                            roundedNoteCnt++;
                        }
                    } else {
                        if (currentGameProfile.getKeyByPitch(midiPitch - 1) != -1) {
                            processedNoteData.push([midiPitch - 1, note[1], note[2]]);
                            lastIsFloor = true;
                            roundedNoteCnt++;
                        }
                    }
                    break;
                default:
                    throw new Error("Unknown chromatic processing: " + semiToneRoundingMode);
            }
        }
        //@ts-ignore
        return processedNoteData;
    }

    this.getStatistics = function () {
        return {
            "underFlowedNoteCnt": underFlowedNoteCnt,
            "overFlowedNoteCnt": overFlowedNoteCnt,
            "roundedNoteCnt": roundedNoteCnt,
            "middleFailedNoteCnt": middleFailedNoteCnt
        };
    }
}

/**
 * @brief Assign the current time of each note(ms)Stored in properties
 * @typedef {Object} StoreCurrentNoteTimePassConfig
 * @param {StoreCurrentNoteTimePassConfig} [config]
 */
function StoreCurrentNoteTimePass(config) {
    this.name = "StoreCurrentNoteTimePass";
    this.description = "Stores the note's current time in the properties";

    const attributeName = "originalTime";

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, parameter is progress(0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the processed data
     */
    this.run = function (noteData, progressCallback) {
        noteData.forEach((note, index) => {
            note[2][attributeName] = note[1];
        });
        return noteData;
    };

    this.getStatistics = function () {
    };
}

/**
 * @brief Converts an array of notes into an array of keys for the corresponding game
 * @typedef {Object} NoteToKeyPassConfig
 * @property {GameProfile} currentGameProfile - Current game configuration
 * @param {NoteToKeyPassConfig} config
 */
function NoteToKeyPass(config) {
    this.name = "NoteToKeyPass";
    this.description = "Convert notes to keys";

    let currentGameProfile = null;

    if (config.currentGameProfile == null) {
        throw new Error("currentGameProfile is null");
    }
    currentGameProfile = config.currentGameProfile;

    /**
     * Run this pass
     * @param {noteUtils.Note[]} noteList - Music data
     * @param {function(number):void} progressCallback - Progress callback function, The parameter is progress(0-100)
     * @returns {noteUtils.Key[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteList, progressCallback) {
        let keyList = [];
        for (let i = 0; i < noteList.length; i++) {
            let key = currentGameProfile.getKeyByPitch(noteList[i][0]);
            if (key == -1) {
                throw new Error("Notes cannot be converted to keys: " + noteList[i][0]);
            }
            keyList.push([key, noteList[i][1], noteList[i][2]]);
        }
        // @ts-ignore
        return keyList;
    }
    this.getStatistics = function () {
        return {
        };
    }
}

/**
 * @brief Limit the maximum frequency of the same key, Remove notes that exceed the frequency
 * @typedef {Object} SingleKeyFrequencyLimitPassConfig
 * @property {number} minInterval - Minimum interval(millisecond)
 * @param {SingleKeyFrequencyLimitPassConfig} config
 */
function SingleKeyFrequencyLimitPass(config) {
    this.name = "SingleKeyFrequencyLimitPass";
    this.description = "限制单个按键频率";

    let minInterval = 0; // millisecond

    let droppedNoteCnt = 0;

    if (config.minInterval == null) {
        throw new Error("minInterval is null");
    }
    minInterval = config.minInterval;
    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} progressCallback - Progress callback function, The parameter is progress(0-100)
     * @returns {noteUtils.NoteLike} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteData, progressCallback) {
        const sameNoteGapMin = minInterval;
        for (let i = 0; i < noteData.length; i++) {
            let note = noteData[i];
            let j = i + 1;
            while (j < noteData.length) {
                let nextNote = noteData[j];
                if (note[0] === -1) {
                    j++;
                    continue;
                }
                if (note[0] === nextNote[0]) {
                    if (nextNote[1] - note[1] < sameNoteGapMin) {
                        noteData.splice(j, 1);
                        //console.log("Remove notes that are too dense:" + nextNote[0] + "(diff:" + (nextNote[1] - note[1]) + ")");
                        droppedNoteCnt++;
                    }
                }
                if (nextNote[1] - note[1] > sameNoteGapMin) {
                    break;
                }
                j++;
            }
            if (progressCallback != null && i % 10 == 0) {
                progressCallback(100 * i / noteData.length);
            }
        }
        return noteData;
    }
    this.getStatistics = function () {
        return {
            "droppedNoteCnt": droppedNoteCnt
        };
    }
}


/**
 * @brief Merge keys pressed at the same time
 * @typedef {Object} MergeKeyPassConfig
 * @property {number} maxInterval - Maximum interval(millisecond)
 * @property {number} [maxBatchSize] - Maximum number of merges, The default value is 10
 * @param {MergeKeyPassConfig} config
 */
function MergeKeyPass(config) {
    this.name = "MergeKeyPass";
    this.description = "Merge adjacent keys";

    let maxInterval = 0; // millisecond
    let maxBatchSize = 19; // Maximum number of merges

    if (config.maxInterval == null) {
        throw new Error("maxInterval is null");
    }
    maxInterval = config.maxInterval;
    if (config.maxBatchSize != null) {
        maxBatchSize = config.maxBatchSize;
    }
    let droppedSameNoteCount = 0;

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, The parameter is progress(0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteData, progressCallback) {
        let lastTime = noteData[0][1];
        let lastSize = 0;
        let lastNotes = new Set();
        lastNotes.add(noteData[0][0]);
        for (let i = 1; i < noteData.length; i++) {
            let note = noteData[i];
            if (note[1] - lastTime < maxInterval && lastSize < maxBatchSize) {
                note[1] = lastTime;
                //Check for duplicates
                if (lastNotes.has(note[0])) {
                    noteUtils.softDeleteNoteAt(noteData, i);
                    droppedSameNoteCount++;
                    continue;
                }
                lastNotes.add(note[0]);
                lastSize++;
            } else {
                lastNotes = new Set();
                lastNotes.add(note[0]);
                lastSize = 0;
                lastTime = note[1];
            }
        }
        noteUtils.applyChanges(noteData);
        return noteData;
    }

    this.getStatistics = function () {
        return {
            "droppedSameNoteCount": droppedSameNoteCount
        };
    }
}

/**
 * @brief Convert a list of keys to a list of gestures
 * @typedef {Object} KeyToGesturePassConfig
 * @property {GameProfile.NoteDurationImplementionType} [durationMode] - Key duration mode, Defaults to"none"
 * @property {number} [pressDuration] - Default key press duration(millisecond), Only if durationMode is set to"none"effective, The default value is 5
 * @property {number} [maxGestureDuration] - Maximum gesture duration(millisecond)
 * @property {number} [maxGestureSize] - Maximum gesture length
 * @property {number} [marginDuration] - Gesture intervals(milliseconds), which is only valid when durationMode is "native", defaults to 100
 * @property {GameProfile} currentGameProfile - Current game configuration
 * @param {KeyToGesturePassConfig} config
 */
function KeyToGesturePass(config) {
    this.name = "KeyToGesturePass";
    this.description = "Convert a list of keys to a list of gestures";

    let pressDuration = 5; // millisecond
    let durationMode = "none";
    let maxGestureDuration = 10000; // millisecond
    let maxGestureSize = 19;
    let marginDuration = 100; // millisecond
    let currentGameProfile = null;


    if (config.currentGameProfile == null) {
        throw new Error("currentGameProfile is null");
    }

    currentGameProfile = config.currentGameProfile;
    if (config.pressDuration != null)
        pressDuration = config.pressDuration;
    if (config.durationMode != null)
        durationMode = config.durationMode;
    if (config.maxGestureDuration != null)
        maxGestureDuration = config.maxGestureDuration;
    if (config.maxGestureSize != null)
        maxGestureSize = config.maxGestureSize;
    if (config.marginDuration != null)
        marginDuration = config.marginDuration;

    let maxGestureSize_mid = Math.ceil(maxGestureSize * 2 / 3);
    let maxGestureSize_low = Math.ceil(maxGestureSize * 1 / 3);
    const eps_mid = 1;

    //Statistics
    let directlyTruncatedNoteCnt = 0;
    let groupTruncatedNoteCnt = 0;
    let sameKeyTruncatedNoteCnt = 0;
    let removedShortNoteCnt = 0;


    /**
     * Run this pass
     * @param {noteUtils.Key[]} noteData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, parameter is progress (0-100)
     * @returns {import("./players.js").Gestures} - Returns the parsed data
     */
    this.run = function (noteData, progressCallback) {
        let haveDurationProperty = noteData[0][2] != null && noteData[0][2]["duration"] != null;
        let gestureTimeList = new Array();
        console.log(`durationMode: ${durationMode}`);
        if (durationMode == "none" || !haveDurationProperty) {
            let it = noteUtils.chordIterator(noteData);
            for (let keys of it) {
                let time = keys[0][1];
                let gestureArray = new Array();
                keys.forEach((key) => {
                    const keyIndex = key[0]
                    const clickPos = currentGameProfile.getKeyPosition(keyIndex);
                    if (clickPos == null) {
                        console.log(`The key ${keyIndex} is out of range and is discarded`);
                        return;
                    }
                    gestureArray.push([0, pressDuration, clickPos.slice()]);
                });
                if (gestureArray.length > 0)
                    gestureTimeList.push([gestureArray, time]);
            };
        } else if (durationMode == "native") {
            // The end time of this set of keystrokes
            let currentGroupEndTime = 0;
            // The start time of this set of keys
            let currentGroupStartTime = 0;

            // A list of keys for this set of keys
            /** @type {Array<[keyIndex:number, startTime:number, endTime:number]>} */
            let currentGroupKeys = new Array();
            // List of groups
            let groupList = new Array();
            for (let currentKey of noteData) {
                // console.log(`key: ${JSON.stringify(key)}`);
                let thisStartTime = currentKey[1];
                //@ts-ignore
                let thisDuration = currentKey[2]["duration"];
                let thisEndTime = thisStartTime + thisDuration;
                //Truncate the portion that exceeds the maximum gesture length
                if (thisEndTime - thisStartTime > maxGestureDuration) {
                    thisEndTime = thisStartTime + maxGestureDuration;
                    directlyTruncatedNoteCnt++;
                }
                //This is the first button in this set of keys
                if (currentGroupKeys.length == 0) {
                    currentGroupStartTime = thisStartTime;
                    currentGroupEndTime = thisEndTime;
                    currentGroupKeys.push([currentKey[0], thisStartTime, thisEndTime]);
                    continue;
                }
                //Check if you want to start a new set
                //The start time of this button is greater than the end time of this set of keys, or the number of keys in the current group has reached the maximum
                //a new set is started
                if (currentGroupKeys.length >= maxGestureSize ||
                    // When there are fewer keys, let the successive keys be grouped into the same group
                    (currentGroupKeys.length < maxGestureSize_low && thisStartTime - currentGroupEndTime > marginDuration) ||
                    // When there are many buttons, they are divided into different groups
                    (currentGroupKeys.length > maxGestureSize_mid && thisStartTime - currentGroupEndTime > - marginDuration) ||
                    // Other times
                    (currentGroupKeys.length >= maxGestureSize_low && currentGroupKeys.length <= maxGestureSize_mid && thisStartTime - currentGroupEndTime > eps_mid)) {
                    //console.log(`start: ${currentGroupStartTime}ms, end: ${currentGroupEndTime}ms, current: ${thisStartTime}ms, groupduration: ${currentGroupEndTime - currentGroupStartTime}ms, size: ${currentGroupKeys.length}`);
                    //Truncate all note end times to the current note start time TODO: This is not the optimal solution
                    for (let i = 0; i < currentGroupKeys.length; i++) {
                        let key = currentGroupKeys[i];
                        if (key[2] > thisStartTime) {
                            groupTruncatedNoteCnt++;
                            key[2] = thisStartTime;
                        }
                    }
                    //Avoid end-to-end
                    for (let i = 0; i < currentGroupKeys.length; i++) {
                        let key = currentGroupKeys[i];
                        if (Math.abs(key[2] - thisStartTime) < marginDuration) {
                            key[2] = thisStartTime - marginDuration;
                        }
                    }
                    groupList.push(currentGroupKeys);
                    currentGroupKeys = new Array();
                }
                //This is the first button in this set of keys
                if (currentGroupKeys.length == 0) {
                    currentGroupStartTime = thisStartTime;
                    currentGroupEndTime = thisEndTime;
                    currentGroupKeys.push([currentKey[0], thisStartTime, thisEndTime]);
                    continue;
                }
                //Check if they overlap with the same keys
                let overlappedSamekeyIndex = currentGroupKeys.findIndex((e) => {
                    return e[0] == currentKey[0] && e[2] > thisStartTime;
                });
                if (overlappedSamekeyIndex != -1) {
                    // //Connect overlapping keys
                    // let overlappedSamekey = currentGroupKeys[overlappedSamekeyIndex];
                    // thisStartTime = overlappedSamekey[1];
                    // if (thisEndTime < overlappedSamekey[2]) {
                    //     thisEndTime = overlappedSamekey[2];
                    // }
                    // currentGroupKeys.splice(overlappedSamekeyIndex, 1);
                    //Cut off overlapping keys
                    let overlappedSamekey = currentGroupKeys[overlappedSamekeyIndex];
                    overlappedSamekey[2] = thisStartTime - marginDuration;
                    sameKeyTruncatedNoteCnt++;
                }
                //Detect if there is a head-to-tail connection issue (the tail of one button is connected to the head of another button, causing systemUi to crash!)
                for (let i = 0; i < currentGroupKeys.length; i++) {
                    let key = currentGroupKeys[i];
                    if (Math.abs(key[2] - thisStartTime) < marginDuration) {
                        key[2] = thisStartTime - marginDuration;
                    }
                }
                //Add this button
                currentGroupKeys.push([currentKey[0], thisStartTime, thisEndTime]);
                if (thisEndTime > currentGroupEndTime)
                    currentGroupEndTime = thisEndTime;
            }
            if (currentGroupKeys.length > 0) groupList.push(currentGroupKeys);
            //Convert to a gesture
            for (let group of groupList) {
                /** @type {Array <[delay: number, duration: number, pos: [x: number,y: number]]>} */
                let gestureArray = new Array();
                let groupStartTime = group[0][1];
                for (let key of group) {
                    let delay = key[1] - groupStartTime;
                    let duration = key[2] - key[1];
                    if (duration < pressDuration) {
                        removedShortNoteCnt++;
                        continue; //Ignore keys that have too short a duration
                    }
                    let clickPos = currentGameProfile.getKeyPosition(key[0]);
                    if (clickPos == null) {
                        console.log(`The key ${key[0]} is out of range and is discarded`);
                        continue;
                    }
                    gestureArray.push([delay, duration, clickPos.slice()]);
                }
                if (gestureArray.length > 0)
                    gestureTimeList.push([gestureArray, groupStartTime]);
            }
        }
        return gestureTimeList;
    }

    this.getStatistics = function () {
        return {
            "directlyTruncatedNoteCnt": directlyTruncatedNoteCnt,
            "groupTruncatedNoteCnt": groupTruncatedNoteCnt,
            "sameKeyTruncatedNoteCnt": sameKeyTruncatedNoteCnt,
            "removedShortNoteCnt": removedShortNoteCnt
        };
    }
}

/**
 * @brief Limit the length of the empty part that is too long, and delete the empty part that is too long
 * @typedef {Object} LimitBlankDurationPassConfig
 * @property {number} [maxBlankDuration] - The maximum blank time (ms), default is 5000
 * @param {LimitBlankDurationPassConfig} config
 */
function LimitBlankDurationPass(config) {
    this.name = "LimitBlankDurationPass";
    this.description = "Limit the length of an excessively long blank space";

    let maxBlankDuration = 5000; // millisecond

    if (config.maxBlankDuration != null) {
        maxBlankDuration = config.maxBlankDuration;
    }
    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} progressCallback - Progress callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteData, progressCallback) {
        noteData = noteUtils.toRelativeTime(noteData);
        for (let i = 0; i < noteData.length; i++) {
            if (noteData[i][1] > maxBlankDuration)
                noteData[i][1] = maxBlankDuration;
        }
        noteData = noteUtils.toAbsoluteTime(noteData);
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief Skip the blank part of the intro
 * @typedef {Object} SkipIntroPassConfig
 * @param {SkipIntroPassConfig} config
 */
function SkipIntroPass(config) {
    this.name = "SkipIntroPass";
    this.description = "Skip the blank part of the intro";

    const maxIntroTime = 2000; // millisecond

    /**
     * Run this pass
     * @template T
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} progressCallback - Progress callback function, The parameter is progress(0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteData, progressCallback) {
        let introTime = noteData[0][1];
        if (introTime < maxIntroTime) return noteData;
        let deltaTime = introTime - maxIntroTime;
        for (let i = 0; i < noteData.length; i++) {
            noteData[i][1] -= deltaTime;
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief Limit note frequency, delay notes that are too fast
 * @typedef {Object} NoteFrequencySoftLimitPassConfig
 * @property {number} [minInterval] - The minimum interval (ms), which is 150 by default
 * @param {NoteFrequencySoftLimitPassConfig} config
 */
function NoteFrequencySoftLimitPass(config) {
    this.name = "NoteFrequencySoftLimitPass";
    this.description = "Limit note frequencies";

    let minInterval = 150; // millisecond

    if (config.minInterval != null) {
        minInterval = config.minInterval;
    }

    function saturationMap(freq) {
        return (1000 / minInterval) * Math.tanh(freq / (1000 / minInterval));
    }

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} progressCallback - Progress callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (noteData, progressCallback) {
        let freqs = new Array();
        for (let i = 0; i < noteData.length - 1; i++) {
            let deltaTime = noteData[i + 1][1] - noteData[i][1];
            freqs.push(1000 / deltaTime);
        }
        for (let i = 0; i < freqs.length; i++) {
            freqs[i] = saturationMap(freqs[i]);
        }
        for (let i = 0; i < noteData.length - 1; i++) {
            let deltaTime = 1000 / freqs[i];
            noteData[i + 1][1] = noteData[i][1] + deltaTime;
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief gear shift
 * @typedef {Object} SpeedChangePassConfig
 * @property {number} speed - Variable speed multiplier
 * @param {SpeedChangePassConfig} config
 */
function SpeedChangePass(config) {
    this.name = "SpeedChangePass";
    this.description = "gear shift";

    let speed = 1;

    if (config.speed == null) {
        throw new Error("speed is null");
    }
    speed = config.speed;

    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} progressCallback - Progress callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the processed data
     */
    this.run = function (noteData, progressCallback) {
        for (let i = 0; i < noteData.length; i++) {
            noteData[i][1] /= speed;
            if (noteData[i][2]["duration"] != null)
                noteData[i][2]["duration"] /= speed;
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief Limit the number of keys pressed at a time
 * @typedef {Object} ChordNoteCountLimitPassConfig
 * @property {number} [maxNoteCount] - The maximum number of notes, defaults to 9
 * @property {string} [limitMode] - Limit mode, selectable values are "delete" or "split", default is "delete"
 * @property {number} [splitDelay] - The delay (in milliseconds) of the note after splitting, which is only valid when limitMode is "split", defaults to 5
 * @property {string} [selectMode] - Select which notes to keep, selectable values are "high"/"low"/"random", default is "high"
 * @property {number} [randomSeed] - Random seed, default is 74751
 * @param {ChordNoteCountLimitPassConfig} config
 */
function ChordNoteCountLimitPass(config) {
    this.name = "ChordNoteCountLimitPass";
    this.description = "Limit the number of keys pressed at a time";

    let maxNoteCount = 9;
    let limitMode = "delete";
    let splitDelay = 5;
    let selectMode = "high";
    let randomSeed = 74751;

    if (config.maxNoteCount != null) {
        maxNoteCount = config.maxNoteCount;
    }
    if (config.limitMode != null) {
        limitMode = config.limitMode;
    }
    if (config.splitDelay != null) {
        splitDelay = config.splitDelay;
    }
    if (config.selectMode != null) {
        selectMode = config.selectMode;
    }
    if (config.randomSeed != null) {
        randomSeed = config.randomSeed;
    }

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the processed data
     */
    this.run = function (noteData, progressCallback) {
        const algorithms = new Algorithms();
        const prng = algorithms.PRNG(randomSeed);
        const totalLength = noteData.length;
        let i = 0;
        while (true) {
            let ni = noteUtils.nextChordStart(noteData, i);
            if (ni == noteData.length) break;
            let chord = noteData.subarray(i, ni - 1);
            if (chord.length > maxNoteCount) {
                switch (selectMode) {
                    case "high": //Sort from highest to lowest
                        chord.sort((a, b) => b[0] - a[0]);
                        break;
                    case "low": //
                        chord.sort((a, b) => a[0] - b[0]);
                        break;
                    case "random":
                        chord = algorithms.shuffle(chord, prng);
                        break;
                }

                for (let j = maxNoteCount; j < chord.length; j++) {
                    if (limitMode == "delete") {
                        noteUtils.softDeleteNoteAt(noteData, i + j);
                    } else if (limitMode == "split") {
                        noteUtils.softChangeNoteTime(chord[j], chord[j][1] + splitDelay * (j - maxNoteCount + 1));
                    }
                }
            }
            i = ni;
        }
        noteUtils.applyChanges(noteData);
        noteData.sort((a, b) => a[1] - b[1]);
        return noteData;
    }
    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief Combine the same note that occurs consecutively into one long note
 * @typedef {Object} FoldFrequentSameNotePassConfig
 * @property {number} [maxInterval] - The maximum interval (ms), defaults to 150
 * @param {FoldFrequentSameNotePassConfig} config
 */
function FoldFrequentSameNotePass(config) {
    this.name = "FoldFrequentSameNotePass";
    this.description = "Combine the same note that occurs consecutively into one long note";

    let maxInterval = 150; // millisecond

    if (config.maxInterval != null) {
        maxInterval = config.maxInterval;
    }

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} progressCallback - Gadu callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the processed data
     */
    this.run = function (noteData, progressCallback) {
        let i = 0;
        while (i < noteData.length - 1) {
            let targetNoteIndexList = new Array();
            targetNoteIndexList.push(i);
            let lastNoteStartTime = noteData[i][1];
            let j = i + 1;
            while (j < noteData.length && noteData[j][1] - lastNoteStartTime < maxInterval) {
                if (noteData[j][0] === noteData[i][0]) {
                    targetNoteIndexList.push(j);
                    lastNoteStartTime = noteData[j][1];
                }
                j++;
            }
            if (targetNoteIndexList.length > 1) {
                let startTime = noteData[targetNoteIndexList[0]][1];
                let endTime = noteData[targetNoteIndexList[targetNoteIndexList.length - 1]][1];
                let key = noteData[targetNoteIndexList[0]][0];
                let attrs0 = Object.assign({}, noteData[targetNoteIndexList[0]][2]);
                for (let i of targetNoteIndexList) {
                    noteUtils.softDeleteNoteAt(noteData, i);
                }
                let newNote = [key, startTime, attrs0];
                newNote[2]["duration"] = endTime - startTime;
                noteUtils.applyChanges(noteData);
                //@ts-ignore
                noteData.splice(targetNoteIndexList[0], 0, newNote);
            }
            i++;
        }
        return noteData;
    }

    this.getStatistics = function () { };
}

/**
 * @brief Split long notes into multiple short notes
 * @typedef {Object} SplitLongNotePassConfig
 * @property {number} [minDuration] - The minimum duration (in milliseconds) that is considered a long note is 500 by default
 * @property {number} [splitDuration] - The duration of the note after splitting (ms), defaults to 100 // i.e. splitting into multiple 100ms notes
 * @param {SplitLongNotePassConfig} config
 */
function SplitLongNotePass(config) {
    this.name = "SplitLongNotePass";
    this.description = "Split long notes into multiple short notes";

    let minDuration = 500; // millisecond
    let splitDuration = 100; // millisecond

    if (config.minDuration != null) {
        minDuration = config.minDuration;
    }
    if (config.splitDuration != null) {
        splitDuration = config.splitDuration;
    }

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} progressCallback - Progress callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the processed data
     */
    this.run = function (noteData, progressCallback) {
        for (let i = 0; i < noteData.length; i++) {
            let note = noteData[i];
            if (note[2] != null && note[2]["duration"] != null && note[2]["duration"] >= minDuration) {
                let startTime = note[1];
                let endTime = startTime + note[2]["duration"];
                let key = note[0];
                for (let t = startTime + splitDuration; t < endTime; t += splitDuration) {
                    let newNote = [key, t, {}];
                    newNote[2]["duration"] = splitDuration;
                    //@ts-ignore
                    noteData.splice(i + 1, 0, newNote);
                }
                note[2]["duration"] = splitDuration;
            }
        }
        noteData.sort((a, b) => a[1] - b[1]);
        return noteData;
    }
}

/**
 * @brief To estimate the duration of a note, it is currently simply to take the interval between notes as the duration
 * @typedef {Object} EstimateNoteDurationPassConfig
 * @property {number} [multiplier] - Time magnification, which defaults to 0.75, means that the duration of this note is 0.75 times the time interval to the next note
 * @param {EstimateNoteDurationPassConfig} config
 */
function EstimateNoteDurationPass(config) {
    this.name = "EstimateNoteDurationPass";
    this.description = "Estimate the duration of the note";

    let multiplier = 0.75;

    if (config.multiplier != null) {
        multiplier = config.multiplier;
    }

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData
     * @param {function(number):void} [progressCallback] - Progress callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the processed data
     */
    this.run = function (noteData, progressCallback) {
        let i = 0;
        while (true) {
            let ni = noteUtils.nextChordStart(noteData, i);
            if (ni == noteData.length) break;
            //@ts-ignore
            let chord = noteData.subarray(i, ni - 1);
            let deltaTime = noteData[ni][1] - noteData[i][1];
            for (let note of chord) {
                if (note[2]["duration"] == undefined) {
                    note[2]["duration"] = deltaTime * multiplier;
                }
            }
            i = ni;
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief Delete empty audio tracks
 * @typedef {Object} RemoveEmptyTracksPassConfig
 * @param {RemoveEmptyTracksPassConfig} config
 */
function RemoveEmptyTracksPass(config) {
    this.name = "RemoveEmptyTracksPass";
    this.description = "Delete empty audio tracks";
    /**
     * Run this pass
     * @param {MusicFormats.TracksData} tracksData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, parameter is progress (0-100)
     * @returns {MusicFormats.TracksData} - Returns the parsed data
     * @throws {Error} - If parsing fails, an exception is thrown
     */
    this.run = function (tracksData, progressCallback) {
        if (!tracksData.haveMultipleTrack) return tracksData;
        for (let i = tracksData.tracks.length - 1; i >= 0; i--) {
            if (tracksData.tracks[i].noteCount == 0) {
                tracksData.tracks.splice(i, 1);
            }
        }
        tracksData.trackCount = tracksData.tracks.length;
        if (tracksData.trackCount == 1) tracksData.haveMultipleTrack = false;
        return tracksData;
    }
    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief Bind the lyrics to the nearest note
 * @typedef {Object} BindLyricsPassConfig
 * @property {import('./frontend/lrc').LyricLine[]} lyrics - Array of lyrics
 * @property {boolean} [useStoredOriginalTime] - Whether or not to use the original time of the note, defaults to false
 * @param {BindLyricsPassConfig} config
 */
function BindLyricsPass(config) {
    this.name = "BindLyricsPass";
    this.description = "Bind the lyrics to the nearest note";

    let lyrics = config.lyrics;

    if (!lyrics || !Array.isArray(lyrics)) {
        throw new Error("lyrics is null or not an array");
    }

    let useStoredOriginalTime = false;
    if (config.useStoredOriginalTime != null) {
        useStoredOriginalTime = config.useStoredOriginalTime;
    }

    let totalErrorMs = 0;

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]} - Returns the processed data
     */
    this.run = function (noteData, progressCallback) {
        let noteDataCopy = [];
        if (useStoredOriginalTime) {
            for (let note of noteData) {
                noteDataCopy.push([note[0], note[2].originalTime, note[2]]);
            }
        } else {
            noteDataCopy = noteData;
        }
        for (let i = 0; i < lyrics.length; i++) {
            let lyric = lyrics[i];
            //@ts-ignore
            let noteIndex = noteUtils.findChordStartAtTime(noteDataCopy, lyric.time);
            let existingLyric = noteData[noteIndex][2]["lyric"];
            if (existingLyric == null || existingLyric == "") {
                noteData[noteIndex][2]["lyric"] = lyric.text;
            } else {
                noteData[noteIndex][2]["lyric"] = existingLyric + "\n" + lyric.text;
            }
            totalErrorMs += Math.abs(noteDataCopy[noteIndex][1] - lyric.time);
        }
        return noteData;
    };

    this.getStatistics = function () {
        return {
            "totalError": totalErrorMs
        };
    };
}

/**
 * @brief Extrapolate the optimal pitch offset
 * @typedef {Object} InferPitchOffsetPassConfig
 * @property {GameProfile} gameProfile - Game configuration
 * @property {number} [overFlowedNoteWeight] - The weight of notes where the treble is out of range, defaults to 5
 * @param {InferPitchOffsetPassConfig} config
 */
function InferBestPitchOffsetPass(config) {
    this.name = "InferPitchOffsetPass";
    this.description = "Extrapolate the optimal pitch offset";

    const betterResultThreshold = 0.05;
    const possibleMajorPitchOffset = [0, -1, 1, -2, 2];
    const possibleMinorPitchOffset = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, 6, 7];

    if (config.gameProfile == null) {
        throw new Error("gameProfile is null");
    }
    let gameProfile = config.gameProfile;

    //The cost of discarding a note with a high pitch is higher than the cost of discarding a note with a lower pitch, so it has a high weight
    let overFlowedNoteWeight = 5;
    if (config.overFlowedNoteWeight != null) {
        overFlowedNoteWeight = config.overFlowedNoteWeight;
    }

    let bestOctaveOffset = 0;
    let bestSemiToneOffset = 0;
    let bestOverFlowedNoteCnt = 0;
    let bestUnderFlowedNoteCnt = 0;
    let bestRoundedNoteCnt = 0;

    /**
     * @param {noteUtils.Note[]} noteData
     * @param {number} targetMajorPitchOffset
     * @param {number} targetMinorPitchOffset
     * @param {GameProfile} gameProfile
     * @brief Test the effect of the configuration 
     * @return {{
    * "outRangedNoteWeight": number,
    * "overFlowedNoteCnt": number,
    * "underFlowedNoteCnt": number,
    * "roundedNoteCnt": number,
    * "totalNoteCnt": number,
    * }}
    */
    function evalFileConfig(noteData, targetMajorPitchOffset, targetMinorPitchOffset, gameProfile) {
        const pass = new SequentialPass({
            passes: [
                new PitchOffsetPass({
                    offset: targetMajorPitchOffset * 12 + targetMinorPitchOffset
                }),
                new LegalizeTargetNoteRangePass({
                    currentGameProfile: gameProfile,
                    semiToneRoundingMode: SemiToneRoundingMode.floor
                })
            ]
        });
        let data = JSON.parse(JSON.stringify(noteData));
        pass.run(data, (progress) => { });
        const stats = pass.getStatistics();
        return {
            "outRangedNoteWeight": stats.LegalizeTargetNoteRangePass.overFlowedNoteCnt * overFlowedNoteWeight + stats.LegalizeTargetNoteRangePass.underFlowedNoteCnt,
            "overFlowedNoteCnt": stats.LegalizeTargetNoteRangePass.overFlowedNoteCnt,
            "underFlowedNoteCnt": stats.LegalizeTargetNoteRangePass.underFlowedNoteCnt,
            "roundedNoteCnt": stats.LegalizeTargetNoteRangePass.roundedNoteCnt,
            "totalNoteCnt": noteData.length,
        };
    }

    /**
     * Run this pass
     * @param {noteUtils.NoteLike[]} noteData - Music data
     * @param {function(number):void} [progressCallback] - Progress callback function, parameter is progress (0-100)
     * @returns {noteUtils.NoteLike[]}
     */
    this.run = function (noteData, progressCallback) {
        const totalTrialCount = 2 * possibleMajorPitchOffset.length + possibleMinorPitchOffset.length;
        let bestResult = { "outRangedNoteWeight": 10000000, "roundedNoteCnt": 10000000 };

        for (let i = 0; i < possibleMajorPitchOffset.length; i++) {
            if (progressCallback != null)
                progressCallback(i / totalTrialCount * 100);
            //Only out-of-range notes are considered
            let result = evalFileConfig(noteData, possibleMajorPitchOffset[i], 0, gameProfile);
            console.log("Pass " + i + " 结果: " + JSON.stringify(result));
            if (bestResult.outRangedNoteWeight - result.outRangedNoteWeight > result.outRangedNoteWeight * betterResultThreshold) {
                bestOctaveOffset = possibleMajorPitchOffset[i];
                bestResult = result;
            }
        }
        bestResult = { "outRangedNoteWeight": 10000000, "roundedNoteCnt": 10000000 };
        for (let i = 0; i < possibleMinorPitchOffset.length; i++) {
            if (progressCallback != null)
                progressCallback((possibleMajorPitchOffset.length + i) / totalTrialCount * 100);
            //Only the notes that are rounded off are considered
            let result = evalFileConfig(noteData, bestOctaveOffset, possibleMinorPitchOffset[i], gameProfile);
            console.log("Pass " + i + " 结果: " + JSON.stringify(result));
            if (bestResult.roundedNoteCnt - result.roundedNoteCnt > result.roundedNoteCnt * betterResultThreshold) {
                bestSemiToneOffset = possibleMinorPitchOffset[i];
                bestResult = result;
            }
        }
        bestResult = { "outRangedNoteWeight": 10000000, "roundedNoteCnt": 10000000 };
        for (let i = 0; i < possibleMajorPitchOffset.length; i++) {
            if (progressCallback != null)
                progressCallback((possibleMajorPitchOffset.length + possibleMinorPitchOffset.length + i) / totalTrialCount * 100);
            //Again, consider out-of-range notes
            let result = evalFileConfig(noteData, possibleMajorPitchOffset[i], bestSemiToneOffset, gameProfile);
            console.log("Pass " + i + " outcome: " + JSON.stringify(result));
            if (bestResult.outRangedNoteWeight - result.outRangedNoteWeight > result.outRangedNoteWeight * betterResultThreshold) {
                bestOctaveOffset = possibleMajorPitchOffset[i];
                bestResult.outRangedNoteWeight = result.outRangedNoteWeight;
                bestOverFlowedNoteCnt = result.overFlowedNoteCnt;
                bestUnderFlowedNoteCnt = result.underFlowedNoteCnt;
                bestRoundedNoteCnt = result.roundedNoteCnt;
                bestResult = result;
            }
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {
            "bestOctaveOffset": bestOctaveOffset,
            "bestSemiToneOffset": bestSemiToneOffset,
            "bestOverFlowedNoteCnt": bestOverFlowedNoteCnt,
            "bestUnderFlowedNoteCnt": bestUnderFlowedNoteCnt,
            "bestRoundedNoteCnt": bestRoundedNoteCnt
        };
    }
}

/**
 * @typedef {Object} Pass
 * @property {string} name - Pass name
 * @property {string} description - pass description
 * @property {function} run - Run this pass
 * @property {function():Object} getStatistics - Get statistics
 */

/**
 * @brief A series of passes are executed sequentially
 * @typedef {Object} SequentialPassConfig
 * @property {Array<Pass>} passes - list of passes
 * @param {SequentialPassConfig} config
 */
function SequentialPass(config) {
    this.name = "SequentialPass";
    this.description = "A series of passes are executed sequentially";

    let passes = new Array();

    /**
     * @type {Object.<string, any>}
     */
    let statistics = {};

    if (config.passes == null) {
        throw new Error("passes is null");
    }
    passes = config.passes;

    /**
     * Run this pass
     * @param {any} data
     * @param {function(number, string):void} [progressCallback] - The progress callback function is the progress (0-100) and the current pass description
     * @returns {any} - Returns the processed data
     */
    this.run = function (data, progressCallback) {
        let currentData = data;
        for (let i = 0; i < passes.length; i++) {
            if (progressCallback != null)
                progressCallback(i / passes.length * 100, passes[i].description);
            currentData = passes[i].run(currentData, (progress) => { });
            statistics[passes[i].name] = passes[i].getStatistics();
        }
        return currentData;
    }

    this.getStatistics = function () {
        return statistics;
    }
}

// function EstimateSemiTone

// /**
//  * @brief Randomly add the situation of missing sound/pressing the wrong key/accidentally touching other keys, and disguise manual input
//  * @typedef {Object} RandomErrorPassConfig
//  * @property {number} [missRate] - Sound leakage probability (0-1), default is 0
//  * @property {number} [wrongRate] - Press the error probability (0-1), the default is 0
//  * @property {number} [extraRate] - Multi-press probability (0-1), default is 0 // i.e. extra keys are randomly inserted
//  * @property {number} [rollBackMs] - Rollback length (ms), default is 0 //When an error occurs, it is rebounced to a previous period of time
//  * @property {number} [rollBackProb] - The rollback probability (0-1), default is 0.8 
//  * @property {number} [randomSeed] - Random seed, default is 74751
//  * @property {boolean} [freqAware] - Whether or not to adjust the error rate based on the frequency of the note (i.e., the faster you play, the easier it is to make mistakes) is true by default
//  * @property {GameProfile} gameProfile - Game configuration
//  * @param {RandomErrorPassConfig} config
//  */
// function RandomErrorPass(config) {
//     this.name = "RandomErrorPass";
//     this.description = "Randomly add the situation of missing sound/pressing the wrong key/accidentally touching other keys, and disguise manual input";

//     const maxWeight = 10; // The maximum weight limit for a single note
//     const nullKey = -1; // Empty button

//     let missRate = 0;
//     let wrongRate = 0;
//     let extraRate = 0;
//     let rollBackMs = 0;
//     let rollBackProb = 0.8;
//     let randomSeed = 74751;
//     let freqAware = true;
//     /** @type {GameProfile| null} */
//     let gameProfile = null;

//     if (config.missRate != null) missRate = config.missRate;
//     if (config.wrongRate != null) wrongRate = config.wrongRate;
//     if (config.extraRate != null) extraRate = config.extraRate;
//     if (config.rollBackMs != null) rollBackMs = config.rollBackMs;
//     if (config.rollBackProb != null) rollBackProb = config.rollBackProb;
//     if (config.randomSeed != null) randomSeed = config.randomSeed;
//     if (config.freqAware != null) freqAware = config.freqAware;
//     if (config.gameProfile == null) throw new Error("gameProfile is null");
//     gameProfile = config.gameProfile;

//     /**
//      * @brief Implementation of rollback
//      * @param {Array<[key: number[], time: number]>} noteData - Music data
//      */


//     /**
//      * 运行此pass
//      * @param {Array<[key: number[], time: number]>} noteData - Music data
//      * @param {function(number):void} progressCallback - Progress callback function, parameter is progress (0-100)
//      * @returns {Array<[keys: number[], time: number]>} - Returns the parsed data
//      * @throws {Error} - If parsing fails, an exception is thrown
//      */
//     function run(noteData, progressCallback) {
//     }
// }

module.exports = {
    NopPass,
    ParseSourceFilePass,
    MergeTracksPass,
    HumanifyPass,
    LegalizeTargetNoteRangePass,
    NoteToKeyPass,
    SingleKeyFrequencyLimitPass,
    MergeKeyPass,
    KeyToGesturePass,
    LimitBlankDurationPass,
    SkipIntroPass,
    NoteFrequencySoftLimitPass,
    SpeedChangePass,
    ChordNoteCountLimitPass,
    FoldFrequentSameNotePass,
    SplitLongNotePass,
    StoreCurrentNoteTimePass,
    BindLyricsPass,
    EstimateNoteDurationPass,
    InferBestPitchOffsetPass,
    RemoveEmptyTracksPass,
    SequentialPass,
    PitchOffsetPass,

    SemiToneRoundingMode
}

