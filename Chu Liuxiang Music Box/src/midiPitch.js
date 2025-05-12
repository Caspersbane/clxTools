
function MidiPitch() {
    this.octaveArray = [
        0, 2, 4, 5, 7, 9, 11
    ];

    /**
     * Converts note names to corresponding MIDI pitch values.
     * @param {string} name - The name of the note to be converted, for example C4、C4#、C#、C 等。
     * @returns {number} The MIDI pitch value of the note.
     */
    this.nameToMidiPitch = function (name) {
        name = name.toUpperCase();
        var pitch = {
            'C': 0,
            'D': 2,
            'E': 4,
            'F': 5,
            'G': 7,
            'A': 9,
            'B': 11
        };
        var note = name[0];
        switch (name.length) {
            case 1: // eg. C
                return pitch[note] + 12 * 5;
            case 2: // eg. C5 | C# (alias for C5#)
                if (name[1] === '#') {
                    return pitch[note] + 12 * 5 + 1;
                } else {
                    return pitch[note] + 12 * 5 + 12 * (parseInt(name[1]) - 4);
                }
            case 3: // eg. C5#
                return pitch[note] + 12 * 5 + 1 + 12 * (parseInt(name[1]) - 4);
            default:
                throw new Error('Invalid note name: ' + name);
        }
    }
    /**
     * Converts MIDI pitch values to corresponding note names.
     * @param {number} midiPitch - The MIDI pitch value to be converted.
     * @returns {string} Note names, such as C4, C#4, etc.
     */
    this.midiPitchToName = function (midiPitch) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiPitch / 12) - 1;
        const noteIndex = midiPitch % 12;
        return noteNames[noteIndex] + octave;
    }


    /**
     * Returns whether the MIDI pitch value is a semitone (actually, the black key?)
     * @param {number} pitch - MIDI pitch value.
     * @returns {boolean} Returns true if it is a semitone, false otherwise.
     */
    this.isHalf = function (pitch) {
        return pitch % 12 === 1 || pitch % 12 === 3 || pitch % 12 === 6 || pitch % 12 === 8 || pitch % 12 === 10;
    }

    /**
     * Transpose: Get the key signature corresponding to the transpose value (0 -> 'C')
     * @param {number} offset - Transpose the value.
     * @returns {string} The key signature corresponding to the transpose value.
     */
    this.getTranspositionEstimatedKey = function (offset) {
        const transpositionName = [
            'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G'
        ];
        return transpositionName[(-offset + 4 + 12) % 12]; //reverse...
    };
}

module.exports = new MidiPitch();

