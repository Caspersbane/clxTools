
function FileChooser() {
    importClass(android.content.Intent);
    importClass(android.provider.MediaStore);

    const FileChooserPathEvent = "FileChooserPathEvent";

    /**
     * @brief Invoke the system file picker to select the file
     * @param {function<string>} callback The callback function is set to the selected file path, and null when canceled
     */
    this.chooseFile = function (callback) {
        throw "Not implemented"; // TODO: Not implemented
        let exec = engines.execScriptFile("src/fileChooserActivity.js");
        let engine = exec.getEngine();
        events.broadcast.on(FileChooserPathEvent, (path) => {
            console.log("FileChooserPathEvent: " + path);
            events.broadcast.removeAllListeners(FileChooserPathEvent);
            engine.forceStop();
            callback(path);
        });
    }

    /**
     * @brief Invoking the System File Selector to Select a File (Blocking)
     * @return {string} The selected file path is null when canceled
     */
    this.chooseFileSync = function () {
        let result = 0;
        this.chooseFile(function (path) {
            result = path;
        });
        while (result === 0) {
            sleep(100);
        }
        return result;
    }

    /**
     * @brief Call the system file selector to select the file and copy it to the specified directory
     * @param {string} destDir Destination directory
     */
    this.chooseFileAndCopyTo = function (destDir) {
        if (!destDir.endsWith("/")) {
            destDir += "/";
        }
        let exec = engines.execScriptFile("src/fileChooserActivity.js", {
            arguments: ["copyTo", destDir]
        });
    }

}

module.exports = FileChooser;