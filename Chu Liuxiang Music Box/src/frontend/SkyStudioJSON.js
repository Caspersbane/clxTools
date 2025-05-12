
function SkyStudioJSONParser() {
    //key0 in the upper left corner, key15 in the lower right corner, and the pitch ranges from C4 to C6
    this.skyKey2Midi = [
        48, 50, 52, 53, 55,
        57, 59, 60, 62, 64,
        65, 67, 69, 71, 72,
    ];

    /**
     * @brief Parse music data from strings
     * @param {string} musicData Music data
     * @returns {import("../musicFormats.js").TracksData}
     */
    this.parseFromString = function (musicData) {
        let jsonData = JSON.parse(musicData);
        jsonData = jsonData[0];
        if (jsonData.isEncrypted) {
            throw new Error("The file is encrypted and cannot be parsed!");
        }

        let name = jsonData.name;
        let author = jsonData.author;
        let transcribedBy = jsonData.transcribedBy;
        let isComposed = jsonData.isComposed;
        let bpm = jsonData.bpm;
        let metaDataText = "The name of the song: " + name + "\n" + "author: " + author + "\n" + "Transcriber: " + transcribedBy + "\n" + "isComposed: " + isComposed + "\n" + "BPM: " + bpm;
        let notes = jsonData.songNotes;
        /** @type {import("../noteUtils").Note[]} */
        let ret = [];
        for (let i = 0; i < notes.length; i++) {
            let n = notes[i];
            let key = parseInt(n.key.split("y")[1]); //"key"
            let pitch = this.skyKey2Midi[key];
            ret.push([pitch, n.time, {}]);
        }
        return {
            "haveMultipleTrack": false,
            "trackCount": 1,
            "durationType": "none",
            "tracks": [
                {
                    "name": name,
                    "channel": 0,
                    "instrumentId": 0,
                    "trackIndex": 0,
                    "noteCount": ret.length,
                    "notes": ret
                }
            ],
            "metadata": [
                {
                    "name": "SkyStudio Composition Information",
                    "value": metaDataText
                }
            ]
        }
    }

    /**
     * @brief Parse a file
     * @param {string} filePath File path
     * @returns {import("../musicFormats").TracksData} Music data
     */
    this.parseFile = function (filePath) {
        console.log("parseFile:" + filePath);
        let jsonData;
        try {
            try {
                return this.parseFromString(files.read(filePath));
            } catch (e) {
                return this.parseFromString(files.read(filePath, "utf-16"));
                console.log("The file is encoded as UTF-16");
            }
        } catch (err) {
            throw new Error("File parsing failed! Please check if the format is correct, " + err.message);
        };

    }
}
module.exports = SkyStudioJSONParser;