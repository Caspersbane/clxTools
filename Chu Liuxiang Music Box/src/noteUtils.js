
/** @type {{subarray: (i: number, j: number) => any[]}} */
Array.prototype;

/**
 * @brief Get a subarray of an array (reference)
 */
Object.defineProperty(Array.prototype, 'subarray', {
    value: function (/** @type {number} */ i, /** @type {number} */ j) {
        var self = this, arr = [];
        for (var n = 0; i <= j; i++, n++) {
            (function (i) {
                Object.defineProperty(arr, n, {       //Array is an Object
                    get: function () {
                        return self[i];
                    },
                    set: function (value) {
                        self[i] = value;
                        return value;
                    }
                });
            })(i);
        }
        return arr;
    },
    writable: true,
    configurable: true
});

/** 
 * @typedef {[pitch: number, startTime: number, attributes: Object.<string,Object>]} Note
 * @typedef {[keyIndex: number, startTime: number, attributes: Object.<string,Object>]} Key // keystroke
 * @typedef {Note|Key} NoteLike
 * @typedef {[pitches: number[], startTime: number, attributes: Object.<string,Object>|undefined]} PackedNote
 * @typedef {[keyIndexes: number[], startTime: number, attributes: Object.<string,Object>|undefined]} PackedKey // keystroke
 * @typedef {PackedNote|PackedKey} PackedNoteLike
 */

function NoteUtils() {
    /**
     * @brief Converts note data in absolute time to note data in relative time (the time of each note represents the time difference from the previous note)
     * @param {Array<NoteLike>} noteData - Music data (will be modified)
     * @returns {Array<NoteLike>} - Returns note data relative to time
     */
    this.toRelativeTime = function (noteData) {
        let lastTime = 0;
        for (let i = 0; i < noteData.length; i++) {
            let newTime = noteData[i][1] - lastTime;
            lastTime = noteData[i][1];
            noteData[i][1] = newTime;
        }
        return noteData;
    }

    /**
     * @brief Converts note data of relative time to note data of absolute time
     * @param {Array<NoteLike>} noteData - Music data (will be modified)
     * @returns {Array<NoteLike>} - Note data that returns absolute time
     */
    this.toAbsoluteTime = function (noteData) {
        let curTime = 0;
        for (let i = 0; i < noteData.length; i++) {
            let newTime = noteData[i][1] + curTime;
            curTime = newTime;
            noteData[i][1] = newTime;
        }
        return noteData;
    }

    /**
     * @brief Deletes the note at the specified position
     * @param {Array<NoteLike>} noteData - Music data (will be modified)
     * @param {number} index - The position of the note to be deleted
     * @returns {Array<NoteLike>} - Returns the deleted note data
     */
    this.deleteNoteAt = function (noteData, index) {
        noteData.splice(index, 1);
        return noteData;
    }

    /**
     * @brief "Soft" deletes notes at the specified position without changing the array length
     * @param {Array<NoteLike>} noteData - Music data (will be modified)
     * @param {number} index - The position of the note to be deleted
     * @returns {Array<NoteLike>} - Returns the deleted note data
     */
    this.softDeleteNoteAt = function (noteData, index) {
        if (noteData[index][2] == undefined) {
            noteData[index][2] = {};
        }
        //@ts-ignore
        noteData[index][2]["deleted"] = true;
        return noteData;
    }

    /**
     * @brief Soft deletes the specified note
     * @param {NoteLike} note - The note you want to delete
     */
    this.softDeleteNote = function (note) {
        if (note[2] == undefined) {
            note[2] = {};
        }
        //@ts-ignore
        note[2]["deleted"] = true;
    }

    /**
     * @brief Soft changes the time of the note at the specified position
     * @param {Array<NoteLike>} noteData - Music data (will be modified)
     * @param {number} index - The position of the note you want to change
     * @param {number} time - New time
     * @returns {Array<NoteLike>} - Returns the changed note data
     */
    this.softChangeNoteTimeAt = function (noteData, index, time) {
        if (noteData[index][2] == undefined) {
            noteData[index][2] = {};
        }
        //@ts-ignore
        noteData[index][2]["newTime"] = time;
        return noteData;
    }

    /**
     * @brief Soft changes the time of the specified note
     * @param {NoteLike} note - The note you want to change
     * @param {number} time - New time
     */
    this.softChangeNoteTime = function (note, time) {
        if (note[2] == undefined) {
            note[2] = {};
        }
        //@ts-ignore
        note[2]["newTime"] = time;
    }

    /**
     * @brief Make the changes effective
     * @param {Array<NoteLike>} noteData - Music data (will be modified)
     * @returns {Array<NoteLike>} - Returns the deleted note data
     */
    this.applyChanges = function (noteData) {
        for (let i = 0; i < noteData.length; i++) {
            //@ts-ignore
            if (noteData[i][2]["deleted"] == true) {
                noteData.splice(i, 1);
                i--;
            }
            //@ts-ignore
            else if (noteData[i][2]["newTime"] != undefined) {
                //@ts-ignore
                noteData[i][1] = noteData[i][2]["newTime"];
                //@ts-ignore
                delete noteData[i][2]["newTime"];
            }
        }
        noteData.sort((a, b) => {
            return a[1] - b[1];
        });
        return noteData;
    }

    /**
     * @brief Gets the start position of the next set of notes
     * @param {Array<NoteLike>} noteData - Music data
     * @param {number} index - The position of the current note
     * @returns {number} - Return to the start of the next set of notes
     */
    this.nextChordStart = function (noteData, index) {
        const eps = 1; // 1ms
        let curTime = noteData[index][1];
        let nextTime = curTime + eps;
        while (index < noteData.length && noteData[index][1] < nextTime) {
            index++;
        }
        return index;
    }

    /**
     * @brief Note group iterators
     * @param {Array<NoteLike>} noteData - Music data
     * @returns {IterableIterator<Array<NoteLike>>} - Return to the note group iterator
     */
    this.chordIterator = function* (noteData) {
        let index = 0;
        while (index < noteData.length) {
            let nextIndex = this.nextChordStart(noteData, index);
            yield noteData.subarray(index, nextIndex - 1);
            index = nextIndex;
        }
    }

    /**
     * @brief Combine scattered notes into continuous notes
     * @param {Array<NoteLike>} noteData - Music data
     * @returns {Array<PackedNoteLike>} - Returns the merged note data
     */
    this.packNotes = function (noteData) {
        let packedNoteData = [];
        let it = this.chordIterator(noteData);
        for (let keys of it) {
            let time = keys[0][1];
            let keyArray = new Array();
            let attributes = new Array();
            keys.forEach((key) => {
                keyArray.push(key[0]);
                attributes.push(key[2]);
                if (key[2].lyric != undefined) {
                    attributes[0].lyric = key[2].lyric;
                    // console.verbose("lyric: " + JSON.stringify(attributes));
                    // key[2].lyric = undefined;
                }
            });
            packedNoteData.push([keyArray, time, attributes]);
        }
        //@ts-ignore
        return packedNoteData;
    }

    /**
     * @brief Finds the starting index of the set of notes closest to each other at a given time
     * @param {Array<NoteLike>} noteData - Music data
     * @param {number} timems - Target Time (ms)
     * @returns {number} - Returns the starting index of the closest set of notes
     */
    this.findChordStartAtTime = function (noteData, timems) {
        const eps = 1; // 1ms threshold

        // Binary search
        let left = 0;
        let right = noteData.length - 1;

        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            if (noteData[mid][1] === timems) {
                // Find the exact match, now look forward to the first note of the group
                while (mid > 0 && Math.abs(noteData[mid][1] - noteData[mid - 1][1]) <= eps) {
                    mid--;
                }
                return mid;
            } else if (noteData[mid][1] < timems) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        // No exact match found, left is the insertion point
        if (left >= noteData.length) {
            // If timems is greater than the time of all notes, returns the starting index of the last set of notes
            let lastIndex = noteData.length - 1;
            while (lastIndex > 0 && Math.abs(noteData[lastIndex][1] - noteData[lastIndex - 1][1]) <= eps) {
                lastIndex--;
            }
            return lastIndex;
        }

        if (left === 0) {
            // If the timems are less than the time of all notes, the index of the first note is returned
            return 0;
        }

        // Check which is closer to timems between left-1 and left
        if (Math.abs(noteData[left - 1][1] - timems) <= Math.abs(noteData[left][1] - timems)) {
            // left-1 Closer
            left--;
        }

        while (left > 0 && Math.abs(noteData[left][1] - noteData[left - 1][1]) <= eps) {
            left--;
        }
        return left;
    }

    /**
     * @brief Gets "transferable" properties, which should be transferred to the new note if the original note is deleted.
     * @param {NoteLike} note - musical notes
     * @returns {Object.<string,Object>?} - Returns a "transferable" property, or null if not
     */
    this.getTransferableAttributes = function (note) {
        let transferableAttributes = {};
        for (let key in note[2]) {
            if (key == "lyric") {
                transferableAttributes[key] = note[2][key];
            }
        }
        if (Object.keys(transferableAttributes).length === 0) {
            return null;
        }
        return transferableAttributes;
    }
}

module.exports = new NoteUtils();