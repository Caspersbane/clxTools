/**
 * @typedef {Object} LyricLine
 * @property {number} time Time(ms)
 * @property {string} text lyrics
 */


function LrcParser() {
    /**
     * Parse the lyrics from the strings of the LRC lyrics file
     * @param {string} lrcString The string of the LRC lyrics file
     * @returns {LyricLine[]} Array of lyrics
     */
    this.parseFromString = function (lrcString) {
        const lines = lrcString.split('\n');
        const lyrics = [];
        const timeTagRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

        let currentText = '';

        for (let line of lines) {
            let trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('[ti:') || trimmedLine.startsWith('[ar:') || trimmedLine.startsWith('[al:')) {
                continue; // Skip blank lines and metadata tags
            }

            // const matches = [...trimmedLine.matchAll(timeTagRegex)];
            let matches = [];
            let match;
            while ((match = timeTagRegex.exec(trimmedLine)) !== null) {
                matches.push(match);
            }
            if (matches.length === 0) {
                // If there is no time label, add this line to the current text
                currentText += (currentText ? '\n' : '') + trimmedLine;
                continue;
            }

            // If there is unprocessed text, create a lyric object for the last time tag
            if (currentText) {
                let lastLyric = lyrics[lyrics.length - 1];
                if (lastLyric) {
                    lastLyric.text = currentText;
                }
                currentText = '';
            }

            let text = trimmedLine.replace(timeTagRegex, '').trim();

            for (let match of matches) {
                let [, minutes, seconds, milliseconds] = match;
                let time = parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + parseInt(milliseconds.padEnd(3, '0'));

                lyrics.push({ time, text: text || currentText });
            }

            if (text) {
                currentText = text;
            }
        }

        // Work on the last line of lyrics
        if (currentText) {
            let lastLyric = lyrics[lyrics.length - 1];
            if (lastLyric) {
                lastLyric.text = currentText;
            }
        }

        return lyrics.sort((a, b) => a.time - b.time);
    }

    /**
     * @brief Parse a file
     * @param {string} filePath File path
     */
    this.parseFile = function (filePath) {
        try {
            return this.parseFromString(files.read(filePath));
        } catch (err) {
            throw new Error("File parsing failed! Please check if the format is correct, " + err.message);
        };
    }
}

module.exports = LrcParser;