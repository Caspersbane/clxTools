// Description: Configure the system

let MusicFormats = require("./musicFormats");

function Configuration() {
    const globalConfig = storages.create("hallo1_clxmidiplayer_config");
    const musicDir = "/sdcard/Chu Liuxiang music box data directory/";
    const configSubDir = "configs/";
    const musicFormats = new MusicFormats();

    /**
     * Try migrating the old profile to the new one
     * @param {string} rawFilename - The file name without the suffix
     */
    function tryMigrateOldConfig(rawFilename) {
        files.ensureDir(musicDir + configSubDir);
        const oldConfigPath = musicDir + rawFilename + ".json.cfg";
        const newConfigPath = musicDir + configSubDir + rawFilename + ".json";
        if (files.exists(oldConfigPath) && !files.exists(newConfigPath)) {
            console.info("Migrate old profiles:" + oldConfigPath + " -> " + newConfigPath);
            files.move(oldConfigPath, newConfigPath);
        }
    }

    /**
     * Initialize the configuration of the specified file
     * @param {string} filepath - The path to the configuration file
     */
    function initFileConfig(filepath) {
        console.info("Initialize the file:" + filepath);
        files.create(filepath);
        let cfg = {};
        cfg.semiToneRoundingMode = 0;
        files.write(filepath, JSON.stringify(cfg));
    };

    /**
     * Get the path to the music folder
     * @returns {string} - Returns the path to the music folder
     */
    this.getMusicDir = function () {
        return musicDir;
    }

    /**
     * Set global configuration items
     * @param {string} key - The key name of the configuration item
     * @param {*} val - The value of the configuration item
     * @returns {number} - Returning 0 indicates that the setting is successful (always successful?)
     */
    this.setGlobalConfig = function (key, val) {
        globalConfig.put(key, val);
        console.log("The global configuration is successful: " + key + " = " + val);
        return 0;
    };

    /**
     * Read the global configuration item
     * @param {string} key - The key name of the configuration item
     * @param {*} defaultValue - The default value of the configuration item
     * @returns {*} - Returns the value of the CI item, or the default value if it does not exist
     */
    this.readGlobalConfig = function (key, defaultValue) {
        let res = globalConfig.get(key, defaultValue);
        if (res == null) {
            return defaultValue;
        } else {
            return res;
        }
    };

    /**
     * Check whether the specified file has a configuration file
     * @param {*} filename - filename
     * @returns {boolean} - Returns true indicates that the corresponding configuration file exists, otherwise it returns false
     */
    this.haveFileConfig = function (filename) {
        filename = musicFormats.getFileNameWithoutExtension(filename);
        const configPath = musicDir + configSubDir + filename + ".json";
        if (files.exists(configPath)) {
            return true;
        }
        tryMigrateOldConfig(filename);
        return files.exists(configPath);
    }

    /**
     * Set the configuration items of the specified file
     * @param {string} key - The key name of the configuration item
     * @param {*} val - The value of the configuration item
     * @param {string} filename - filename
     * @returns {number} - If the return is 0, the setting is successful
     */
    this.setFileConfig = function (key, val, filename) {
        console.verbose("Set the file configuration: " + key + " = " + val + " for " + filename);
        filename = musicFormats.getFileNameWithoutExtension(filename);
        const configPath = musicDir + configSubDir + filename + ".json";
        if (!this.haveFileConfig(filename)) {
            initFileConfig(configPath);
        };
        let tmp = files.read(configPath);
        tmp = JSON.parse(tmp);

        tmp[key] = val;
        files.write(configPath, JSON.stringify(tmp));
        console.verbose("Write to the file" + configPath + "succeed");
        return 0;
    };

    /**
     * Read the configuration items of the specified file
     * @param {string} key - The key name of the configuration item
     * @param {string} filename - filename
     * @param {*} [defaultValue] - The default value of the configuration item
     * @returns {*} - Returns the value of the CI item, or the default value if it does not exist
     */
    this.readFileConfig = function (key, filename, defaultValue) {
        filename = musicFormats.getFileNameWithoutExtension(filename);
        const configPath = musicDir + configSubDir + filename + ".json";
        if (!this.haveFileConfig(filename)) {
            initFileConfig(configPath);
        };
        let tmp = files.read(configPath);
        tmp = JSON.parse(tmp);

        //migrate: halfCeiling -> semiToneRoundingMode
        if (key == "semiToneRoundingMode") {
            if (tmp["halfCeiling"] != null) {
                this.setFileConfig(
                    "semiToneRoundingMode",
                    tmp["halfCeiling"] ? 1 : 0,
                    filename
                );
                return tmp["halfCeiling"] ? 1 : 0;
            }
        }

        if (tmp[key] == null) {
            console.verbose(`Returns to the default value:${key} = ${JSON.stringify(defaultValue)}`);
            return defaultValue;
        } else {
            console.verbose(`Read the configuration:${key} = ${JSON.stringify(tmp[key])}`);
            return tmp[key];
        }
    };

    /**
     * Set the configuration items of the specified file in the specified target (Game-Key-Instrument).
     * @param {string} key - The key name of the configuration item
     * @param {*} val - The value of the configuration item
     * @param {string} filename - filename
     * @param {import("./gameProfile")} gameProfile - Game configuration
     * @returns {number} - If the return is 0, the setting is successful
     */
    this.setFileConfigForTarget = function (key, val, filename, gameProfile) {
        const newKey = `${gameProfile.getProfileIdentifierTriple()}.${key}`;
        return this.setFileConfig(newKey, val, filename);
    }

    /**
     * Read the configuration items of the specified file in the specified target (game-key-instrument), return the public configuration if it does not exist, and return the default value if the public configuration does not exist
     * @param {string} key - The key name of the configuration item
     * @param {string} filename - filename
     * @param {import("./gameProfile")} gameProfile - Game configuration
     * @param {*} [defaultValue] - The default value of the configuration item
     * @returns {*} - Returns the value of the CI item, or the default value if it does not exist
     */
    this.readFileConfigForTarget = function (key, filename, gameProfile, defaultValue) {
        const newKey = `${gameProfile.getProfileIdentifierTriple()}.${key}`;
        const res1 = this.readFileConfig(newKey, filename, undefined);
        if (res1 != undefined) {
            return res1;
        }
        const res2 = this.readFileConfig(key, filename, undefined);
        if (res2 != undefined) {
            return res2;
        }
        return defaultValue;
    }

    /**
     * Clear the configuration of the specified file
     * @param {string} filename - filename
     * @returns {number} - If 0 is returned, the clearance is successful
     */
    this.clearFileConfig = function (filename) {
        filename = musicFormats.getFileNameWithoutExtension(filename);
        const configPath = musicDir + configSubDir + filename + ".json";
        initFileConfig(configPath);
        return 0;
    }

    /**
     * Save the JSON object to the specified file in the configuration folder
     * @param {string} filename - filename
     * @param {object} obj - JSON object
     */
    this.setJsonToFile = function (filename, obj) {
        const configPath = musicDir + configSubDir + filename + ".json";
        files.ensureDir(musicDir + configSubDir);
        files.write(configPath, JSON.stringify(obj));
    }

    /**
     * Read the JSON object from the specified file in the configuration folder
     * @param {string} filename - File name, without .json suffix
     * @returns {object?} - JSON object, which returns null if the file does not exist
     */
    this.getJsonFromFile = function (filename) {
        const configPath = musicDir + configSubDir + filename + ".json";
        if (!files.exists(configPath)) {
            return null;
        }
        try {
            return JSON.parse(files.read(configPath));
        } catch (e) {
            console.error(`Read the configuration file${configPath}fail: ${e}`);
            return null;
        }
    }

    /**
     * Obtain the last modified time of the specified file in the configuration folder
     * @param {string} filename - File name, without .json suffix
     * @returns {number?} - Returns the last modified time (in milliseconds), or null if the file does not exist
     */
    this.getJsonFileLastModifiedTime = function (filename) {
        const configPath = musicDir + configSubDir + filename + ".json";
        if (!files.exists(configPath)) {
            return null;
        }
        return java.nio.file.Files.getLastModifiedTime(java.nio.file.Paths.get(configPath)).toMillis();
    }

}

module.exports = new Configuration();