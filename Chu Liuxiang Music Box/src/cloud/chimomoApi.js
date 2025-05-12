/**
 * @type {import('axios').AxiosStatic}
 */
//@ts-ignore
let axios = require('axios');

/**
 * @typedef {Object} ChimomoApiFileEntry
 * @property {string} id - A unique identifier for a file (uuid)
 * @property {string} name - The name of the MIDI file
 * @property {string} type - The file type does not seem to affect the use
 * @property {string} createdAt - The date and time when the file was created, in the format 'YYYY-MM-DD HH:mm:ss'
 * @property {string} uploader - The name of the uploader
 */

/**
 * @typedef {Object} ChimomoApiMusicList
 * @property {number} pageNo - The current page number
 * @property {number} pageSize - The number of items displayed per page
 * @property {number} pageCount - Total number of pages
 * @property {number} total - Total number of projects
 * @property {ChimomoApiFileEntry[]} data - An array of MIDI file data
 */

function ChimomoApi() {
    const apiBase = "https://autoplay.chimomo.cn/api/v1/"


    /**
     * @brief Get a list of music
     * @param {number} pageNo page number
     * @param {number} pageSize Number per page
     * @param {string?} keyword keywords
     * @param {(err: Error?, data: ChimomoApiMusicList?) => void} callback Callback function
     */
    this.fetchMusicList = function (pageNo, pageSize, keyword, callback) {
        const url = `${apiBase}/song/list`;
        const params = {
            pageNo,
            pageSize,
            keyword
        };

        axios.get(url, {
            params,
            timeout: 5000
        })
            .then(response => {
                if (response.data.code === 200) {
                    callback(null, response.data.data);
                } else {
                    callback(new Error(response.data.msg), null);
                }
            })
            .catch(error => {
                callback(error, null);
            });
    }

    /**
     * @brief Get the music files
     * @param {string} musicId Music ID
     * @param {(err: Error?, data: import('@tonejs/midi').MidiJSON?) => void} callback 回调函数
     */
    this.fetchMusicFileById = function (musicId, callback) {
        const url = `${apiBase}/song/${musicId}`;
        let config = {
            timeout: 5000
        };
        axios.get(url, config)
            .then(response => {
                if (response.data.code === 200) {
                    callback(null, response.data.data);
                } else {
                    callback(new Error(response.data.msg), null);
                }
            })
            .catch(error => {
                callback(error, null);
            });
    }
}

module.exports = ChimomoApi;