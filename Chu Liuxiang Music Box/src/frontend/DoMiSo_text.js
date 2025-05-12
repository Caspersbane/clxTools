// The format was designed by nigh@github.com , 参见 https://github.com/Nigh/DoMiSo-genshin
var MidiPitch = require('../midiPitch.js');

let basePitch = 60; //C5
let defaultBPM = 80;
let BPM = defaultBPM;
let tickTimems = 60 * 1000 / BPM;

/*
Control commands

key control(Tonal control)
1=F#
When no scale number is added, the default is the 5th scale. i.e. the above command is equivalent to:
1=F5#
When no tonality is specified, 1=C is default

tempo control(Speed control)
bpm=120
The valid BPM range is 1~480, and the value outside this range will be considered invalid, and the BPM will be reset to the initial value of 80.
If there is no specified speed, the default is BPM=80
*/

function parseCmd(cmdStr) {
    let cmd = cmdStr.split('=')[0];
    let param = cmdStr.split('=')[1];
    switch (cmd) {
        case '1':
            basePitch = MidiPitch.nameToMidiPitch(param);
            console.log("Set basePitch:", basePitch);
            break;
        case 'bpm':
            let BPM2 = parseInt(param);
            console.log("Set BPM:", BPM2);
            if (BPM2 < 1 || BPM2 > 480) {
                BPM = defaultBPM;
                tickTimems = 60 * 1000 / BPM
            } else {
                BPM = BPM2;
                tickTimems = 60 * 1000 / BPM
            }
            break;
        case 'rollback':
            console.warn("The rollback has not yet been implemented");
            break;
        default:
            throw new Error('Invalid control commands');
            break;
    }
};


function parseNote(noteStr) {
    //split by the only number in it
    let pitchStr = noteStr.split(/\d/)[0].trim();
    let timingStr = noteStr.split(/\d/)[1].trim();


    let pitch = basePitch;

    //pitchStr It can only be empty, one or more plus signs, or minus signs
    if (pitchStr.length > 0) {
        if (pitchStr[0] === '+') {
            pitch += 12 * pitchStr.length;
        } else if (pitchStr[0] === '-') {
            pitch -= 12 * pitchStr.length;
        } else {
            throw new Error('Invalid scale number');
        }
    }
    let pitchNum = parseInt(noteStr[pitchStr.length]);
    if (pitchNum < 0 || pitchNum > 8) {
        throw new Error('Invalid scale number');
    }
    if (pitchNum == 0) {
        pitch = -1;
    } else {
        pitch += MidiPitch.octaveArray[pitchNum - 1];
    }

    let tickTime = 0;
    //timingStr 
    if (timingStr.length == 0) {
        tickTime = 1;
        //goto
    } else {
        if (timingStr[0] === '#') {
            pitch += 1;
            timingStr = timingStr.substr(1);
        } else if (timingStr[0] === 'b') {
            pitch -= 1;
            timingStr = timingStr.substr(1);
        };
        let tickTimeArr = [];
        tickTimeArr.push(1);
        let timingStrPos = 0;
        let tickTimePos = 0;
        while (timingStrPos < timingStr.length) {
            switch (timingStr[timingStrPos]) {
                case '.':
                    tickTimeArr.push(tickTimeArr[tickTimePos] / 2); // Indicates that the time value of the preceding note is extended by half.
                    tickTimePos++;
                    timingStrPos++;
                    continue;
                case '-':
                    tickTimeArr.push(1);//Represents the time value of a whole note. The meaning is the same as in the ordinary simple notation. and can be combined with /.
                    tickTimePos++;
                    timingStrPos++;
                    continue;
                case '/':
                    tickTimeArr[tickTimePos] /= 2; // Indicates that the length of the preceding mark is reduced by half. The meaning is consistent with the underlining in the normal notation
                    timingStrPos++;
                    continue;
                default:
                    throw new Error('Invalid time value');
            }
        }
        tickTimeArr.forEach(function (item) {
            tickTime += item;
        });

    }
    //console.log("str:" + noteStr + ";pitch:" + pitch + ";timing:" + tickTime);
    return {
        "pitch": pitch,
        "tickTime": tickTime
    }

}

function DoMiSoTextParser() {
    /**
     * @brief Parse music data from strings
     * @param {string} musicData Music data
     * @returns {import("../musicFormats.js").TracksData}
     */
    this.parseFromString = function (musicData) {
        let lines = musicData.split('\n');
        //Look for annotation dividers (two consecutive equal signs)
        let commentLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('==') != -1) {
                commentLine = i;
                break;
            }
        }

        let comment = '';
        if (commentLine != -1) {
            let commentLines = lines.slice(0, commentLine);
            commentLines.forEach(function (line) {
                comment += line;
                comment += '\n';
            });
            comment = comment.trim();
            lines = lines.slice(commentLine + 1);
        }



        //Divide the remaining lines by spaces
        let strs = [];
        lines.forEach(function (line) {
            let ss = line.split(" ");
            ss.forEach(function (s) {
                if (s.length > 0)
                    strs.push(s);
            });
        });


        let curMsTime = 0;

        let chordPitchArr = [];
        let chordTickTime = 0;
        let inChord = false;
        let ret = [];
        strs.forEach(function (s) {
            if (s === '(') {
                inChord = true;
                return;
            }
            if (s === ')') {
                inChord = false;
                chordPitchArr.forEach(function (pitch) {
                    ret.push([pitch, curMsTime, {}]);
                });
                curMsTime += chordTickTime * tickTimems;
                chordPitchArr = [];
                chordTickTime = 0;
                return;
            }
            // Determine whether it is a command or a note
            // There is an equal sign is the command
            if (s.indexOf('=') != -1) {
                try {
                    parseCmd(s);
                } catch (e) {
                    throw new Error("Parsing command" + s + "fail, " + e.message);
                }
                // The ones that have numbers are the notes
            } else if (s.indexOf('0') != -1 || s.indexOf('1') != -1 || s.indexOf('2') != -1 || s.indexOf('3') != -1 || s.indexOf('4') != -1 || s.indexOf('5') != -1 || s.indexOf('6') != -1 || s.indexOf('7') != -1) {
                let noteData;
                try {
                    noteData = parseNote(s);
                } catch (e) {
                    throw new Error("Parse notes" + s + "fail, " + e.message);
                }
                if (inChord) {
                    chordPitchArr.push(noteData.pitch);
                    chordTickTime = Math.max(chordTickTime, noteData.tickTime);
                } else {
                    if (noteData.pitch != -1) ret.push([noteData.pitch, curMsTime, {}]);
                    curMsTime += noteData.tickTime * tickTimems;
                }
            }
            //Ignore everything else
        });

        return {
            "haveMultipleTrack": false,
            "trackCount": 1,
            "durationType": "none",
            "tracks": [
                {
                    "name": "",
                    "channel": 0,
                    "instrumentId": 0,
                    "trackIndex": 0,
                    "noteCount": ret.length,
                    "notes": ret
                }
            ],
            "metadata": [{
                "name": "DoMiSo song annotations",
                "value": comment
            }]
        }
    }

    /**
     * @brief Parse a file
     * @param {string} filePath File path
     * @returns {import("../musicFormats.js").TracksData} Music data
     */
    this.parseFile = function (filePath, parserConfig) {
        try {
            return this.parseFromString(files.read(filePath));
        } catch (err) {
            throw new Error("File parsing failed! Please check if the format is correct, " + err.message);
        };
    }
}

module.exports = DoMiSoTextParser;

if (require.main === module) {
    const assert = require('assert');
    // Test cases

    //5.. is a note value of  1+0.5+0.25 拍
    assert.deepEqual(parseNote('5..'), {
        "pitch": 65,
        "tickTime": 1.75
    });
    console.log('Test case 1 passes');

    //++3b// is a note value of  0.25 拍
    assert.deepEqual(parseNote('++3b//'), {
        "pitch": 60 + 24 + 3 - 1,
        "tickTime": 0.25
    });
    console.log('Test case 2 passes');

    //-1#-/- is the note value of  1+0.5+1 拍。
    assert.deepEqual(parseNote('-1#-/-'), {
        "pitch": 60 - 12 + 1 + 1,
        "tickTime": 2.5
    });
    console.log('Test case 3 passes');

}

