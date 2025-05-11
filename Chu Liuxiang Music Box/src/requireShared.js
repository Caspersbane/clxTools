
/**
 * Loading shared js files, similar to require, is used to solve the problem of several projects sharing js files.

* Android can't be soft-linked. If you put the shared js file in a directory, you can't find it after packaging.
 * @param {string} fileName
 */
function requireShared(fileName) {
    const sharedDirRel = "../shared/";
    const cacheDirRel = "./sharedcache/";
    const alternativeSharedDir = "/sdcard/脚本/clxTools/shared/";
    function copyDir(src, dst) {
        let filess = files.listDir(src);
        for (let i = 0; i < filess.length; i++) {
            let file = filess[i];
            if (files.isDir(src + file)) {
                copyDir(src + file + "/", dst + file + "/");
            } else {
                console.verbose(`复制文件: ${src + file} -> ${dst + file}`);
                files.copy(src + file, dst + file);
            }
        }
    }
    let sharedDir = files.path(sharedDirRel);
    let cacheDir = files.path(cacheDirRel);
    //Check whether it is running in the /data/user/ directory. If so, use the backup directory (for debugging)
    console.log(files.cwd());
    if (files.cwd().startsWith("/data/user/")) {
        sharedDir = alternativeSharedDir;
    }
    files.ensureDir(cacheDir);
    let sourceExists = files.exists(sharedDir + fileName);
    let cacheExists = files.exists(cacheDir + fileName);
    if (sourceExists && !cacheExists) {
        console.log("Copy the shared folder");
        copyDir(sharedDir, cacheDir);
        return require(cacheDir + fileName);
    } else if (!sourceExists && cacheExists) {
        //If the shared file does not exist, but the cache file exists, the cache file will be loaded directly (after packaging, the shared file will be lost)
        console.log("The shared file does not exist. Load the cache file.: " + fileName);
        return require(cacheDir + fileName);
    } else if (!sourceExists && !cacheExists) {
        throw new Error("The shared file does not exist.: " + fileName);
    }

    //All of them exist. Check whether there are updates.
    let sourceLastModified = java.nio.file.Files.getLastModifiedTime(java.nio.file.Paths.get(sharedDir + fileName)).toMillis();
    let cacheLastModified = java.nio.file.Files.getLastModifiedTime(java.nio.file.Paths.get(cacheDir + fileName)).toMillis();
    if (sourceLastModified > cacheLastModified) {
        console.log("The shared file has been updated.: " + fileName);
        copyDir(sharedDir, cacheDir);
    }
    return require(cacheDir + fileName);
}

module.exports = {
    requireShared: requireShared
}