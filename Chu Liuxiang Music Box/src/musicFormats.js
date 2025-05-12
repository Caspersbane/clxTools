//@ts-check
/* 
 * musicFormats.js -- About the music formats supported by the music box
 *
 *  Copyright (C) 2021 hallo1 
 * 
 */

/*
 1. Tone.js JSON format:
    Music files with the .json extension will be parsed to Tone.js JSON format
    At the moment, this script supports the format very well, and it can generally be parsed normally
    For more details, please refer to : https://tonejs.github.io/

 2. Standard MIDI Format:
    Music files with the .mid extension will be parsed to standard MIDI format
    Currently, this script does not support the format very well, and may not resolve properly in some cases
    If you find that it doesn't parse properly, you can convert this music file to Tone.js JSON format https://tonejs.github.io/Midi/

 3. Variations of the dream format:
    NetEase Cloud Music Author Variations of the Dream music published in music format for lyrics
    Please refer to it https://music.163.com/#/artist?id=1085053
    Paste the entire lyrics into a text file and save them in .txt format to parse them normally

 4. DoMiSo format
    The format was designed by nigh@github.com , see https://github.com/Nigh/DoMiSo-genshin
    Only music files in .txt (text) format can be parsed

*/

/**
 * @enum {string}
 */
const NoteDurationType = {
    "none": "none", // Not at all
    "native": "native", // Native support
}

/**
 * Some type definitions
 * @typedef {{
 * name: string, 
 * channel: number,
 * trackIndex: number,
 * instrumentId: number,
 * noteCount: number, 
 * notes: import('./noteUtils.js').Note[]
 * }} Track
 * 
 * @typedef {{name: string, value: any}} Metadata
 * @typedef {{
 * haveMultipleTrack: boolean, 
 * trackCount: number, 
 * durationType: NoteDurationType,
 * tracks: Track[],
 * metadata?: Metadata[]
 * }} TracksData
 */

const ToneJsJSONParser = require('./frontend/ToneJsJSON');
const MidiParser = require('./frontend/Midi');
const DoMiSoTextParser = require('./frontend/DoMiSo_text');
const SkyStudioJSONParser = require('./frontend/SkyStudioJSON');

function MusicFormats() {
    /**
     * @typedef {{
     * "name": string,
     * "friendlyName": string,
     * "fileExtension": string,
     * "haveDurationInfo": boolean,
     * "haveTracks": boolean,
     * }} MusicFormat
     * 
     * @type {MusicFormat[]}
     */
    const formats =
        [{
            "name": "tonejsjson",
            "friendlyName": "Tone.js JSON 格式",
            "fileExtension": ".json",
            "haveDurationInfo": true,
            "haveTracks": true
        },
        {
            "name": "midi",
            "friendlyName": "MIDI 格式",
            "fileExtension": ".mid",
            "haveDurationInfo": true,
            "haveTracks": true
        },
        {
            "name": "domiso",
            "friendlyName": "DoMiSo格式",
            "fileExtension": ".dms.txt",
            "haveDurationInfo": false,
            "haveTracks": false
        },
        {
            "name": "skystudiojson",
            "friendlyName": "SkyStudio JSON 格式",
            "fileExtension": ".skystudio.txt",
            "haveDurationInfo": false,
            "haveTracks": false
        }];

    /**
     * @brief Get the music format of the file
     * @param {string} fullFileName File name (including extension)
     * @returns {MusicFormat} Music format
     */
    this.getFileFormat = function (fullFileName) {
        for (let format of formats) {
            if (fullFileName.endsWith(format.fileExtension))
                return format;
        }
        throw new Error("Unsupported file formats");
    }

    /**
     * @brief Determine whether the file is a music file
     * @param {string} fullFileName File name (including extension)
     * @returns {boolean} Whether it is a music file or not
     */
    this.isMusicFile = function (fullFileName) {
        for (let format of formats) {
            if (fullFileName.endsWith(format.fileExtension))
                return true;
        }
        return false;
    }

    /**
     * @brief Get a file name that doesn't contain an extension or a path(For music files)
     * @param {string} fullFileName File name (including extension)
     * @returns {string} The file name that does not contain the extension as well as the path
     * @example
     * getFileNameWithoutExtension("tmp/music1.mid") -> "music1"
     * getFileNameWithoutExtension("music2.mid") -> "music2"
     */
    this.getFileNameWithoutExtension = function (fullFileName) {
        let ret = fullFileName;
        if (this.isMusicFile(fullFileName)) {
            let fileFormat = this.getFileFormat(fullFileName);
            ret = fullFileName.substring(0, fullFileName.length - fileFormat.fileExtension.length);
        }
        return ret.substring(ret.lastIndexOf("/") + 1);
    }


    /**
     * Parse music files
     * @param {string} filePath 
     * @returns {TracksData} Music data
     */
    this.parseFile = function (filePath) {
        let fileFormat = this.getFileFormat(filePath);
        switch (fileFormat.name) {
            case "tonejsjson":
                return new ToneJsJSONParser().parseFile(filePath);
            case "midi":
                return new MidiParser().parseFile(filePath);
            case "domiso":
                return new DoMiSoTextParser().parseFile(filePath, undefined);
            case "skystudiojson":
                return new SkyStudioJSONParser().parseFile(filePath);
            default:
                throw new Error("Unsupported file formats");
        }
    }

    /**
     * @brief Parse music data from strings
     * @param {string} musicData Music data
     * @param {string} formatName The name of the music format
     * @returns {TracksData} Music data
     */
    this.parseFromString = function (musicData, formatName) {
        switch (formatName) {
            case "tonejsjson":
                return new ToneJsJSONParser().parseFromString(musicData);
            case "domiso":
                return new DoMiSoTextParser().parseFromString(musicData);
            case "skystudiojson":
                return new SkyStudioJSONParser().parseFromString(musicData);
            default:
                throw new Error("Unsupported file formats");
        }
    }
}

module.exports = MusicFormats;