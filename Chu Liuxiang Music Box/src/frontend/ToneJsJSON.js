function ToneJsJSONParser() {
    /**
     * @brief Parse music data from JSON objects
     * @param {object} jsonData JSONdata
     */
    this.parseFromJSON = function (jsonData) {
        let trackCount = jsonData.tracks.length;
        let tracksData = [];
        // Tone.js will separate the notes of the same sound track and different channels.
        for (let i = 0; i < trackCount; i++) {
            let track = jsonData.tracks[i];
            /** @type {import("../noteUtils").Note[]} */
            let notes = [];
            for (let j = 0; j < track.notes.length; j++) {
                let note = track.notes[j];
                notes.push([note.midi, note.time * 1000, {
                    "duration": note.duration * 1000,
                    "velocity": note.velocity
                }]);
            }
            tracksData.push({
                "name": track.name,
                "channel": track.channel,
                "instrumentId": track.instrument.number,
                "trackIndex": i,
                "noteCount": notes.length,
                "notes": notes
            });
        }
        // console.log(JSON.stringify(tracksData));

        return {
            "haveMultipleTrack": true,
            "durationType": "native",
            "trackCount": trackCount,
            "tracks": tracksData
        }
    }

    /**
     * @brief Parse music data from strings
     */
    this.parseFromString = function (/** @type {string} */ musicData) {
        let jsonData;
        try {
            jsonData = JSON.parse(musicData);
            return this.parseFromJSON(jsonData);
        } catch (err) {
            toast("File parsing failed! Please check whether the format is correct.");
            toast(err);
            console.error("File parsing failed:" + err + ",Data files may be missing or incomplete.！");
        };
    }

    /**
     * @brief Parse a file
     * @param {string} filePath File path
     * @returns {import("../musicFormats").TracksData} Music data
     */
    this.parseFile = function (filePath) {
        try {
            return this.parseFromString(files.read(filePath));
        } catch (err) {
            throw new Error("File parsing failed! Please check whether the format is correct. " + err.message);
        };
    };
}

module.exports = ToneJsJSONParser;