//predefinedres.js -- Preset resolution

function preDefinedRes() {
    /*
     * Get built-in key positions
        screenHeight:Screen height (pixels)
        screenWidth:Screen width (pixels)
        gameType:The game type can be "Chu Liuxiang", "Tianya Moon Knife", "Genshin Impact", "Moore Manor".", 
     */
    this.getKeyPosition = function (screenHeight, screenWidth, gameType) {
        let clickx_pos;
        let clicky_pos;
        let longclick_pos;

        switch (gameType) {
            case "Chu Liuxiang":
                if (screenWidth == 1080 && screenHeight == 1920) {
                    //Parameters of 1920x1080 resolution (most mobile phones nowadays)
                    clickx_pos = [340, 580, 819, 1055, 1291, 1531, 1768];
                    clicky_pos = [956, 816, 680];
                    longclick_pos = [78, 367];
                } else if (screenWidth == 1440 && screenHeight == 3120) {
                    //Parameters of 3120x1440 resolution (my LG G7, 2K screen)
                    clickx_pos = [781, 1099, 1418, 1735, 2051, 2369, 2686];
                    clicky_pos = [1271, 1089, 905];
                    longclick_pos = [400, 525]; //x,y
                } else if (screenWidth == 1080 && screenHeight == 2160) {
                    //2160x1080 resolution with fish screen
                    clickx_pos = [460, 697, 940, 1176, 1414, 1652, 1862];
                    clicky_pos = [955, 818, 679];
                    longclick_pos = [204, 359];
                } else if (screenWidth == 1080 && screenHeight == 2340) {
                    //EG. Redmi K20 Pro
                    clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
                    clicky_pos = [955, 818, 680];
                    longclick_pos = [204, 359];
                } else if (screenWidth == 1080 && screenHeight == 2240) {
                    //
                    clickx_pos = [502, 738, 982, 1215, 1436, 1693, 1931];
                    clicky_pos = [955, 818, 680];
                    longclick_pos = [204, 359];
                } else if (screenWidth == 720 && screenHeight == 1520) {
                    //1520x720 (weird)
                    clickx_pos = [348, 506, 665, 824, 982, 1141, 1300];
                    clicky_pos = [637, 547, 454];
                    longclick_pos = [175, 240];
                } else if (screenWidth == 1080 && screenHeight == 2248) {
                    //2188x1080(It's also weird)
                    clickx_pos = [507, 746, 983, 1220, 1458, 1696, 1934];
                    clicky_pos = [956, 818, 681];
                    longclick_pos = [388, 420];
                } else if (screenWidth == 1176 && screenHeight == 2400) {
                    clickx_pos = [553, 801, 1055, 1300, 1551, 1800, 2052];
                    clicky_pos = [997, 857, 715];
                    longclick_pos = [455, 442];
                } else {
                    throw new Error("Unsupported resolutions");
                }
                break;
            case "The Moon Knife of the End of the World":
                if (device.width == 1440 && device.height == 3120) {
                    //Parameters of 3120x1440 resolution (my LG G7, 2K screen)
                    clickx_pos = [574, 928, 1290, 1655, 2018, 2376, 2743];
                    clicky_pos = [1322, 1169, 1024];
                } else if (device.width == 1080 && device.height == 2310) {
                    clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
                    clicky_pos = [955, 818, 680];
                } else if (device.width == 1080 && device.height == 2376) {
                    clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
                    clicky_pos = [955, 818, 680];
                    //Strange question arises--- 2340x1080 resolution seems to have two different coordinates?
                    //If the first set of coordinates doesn't suit you, you need to add two slashes (//) to the beginning of the last 1~3 lines of code, and remove the two slashes at the beginning of the last 4~6 lines
                } else if (device.width == 1080 && device.height == 2340) {
                    toast("If it doesn't play properly, open the script and look around line 260");
                    clickx_pos = [421, 696, 968, 1243, 1512, 1787, 2055];
                    clicky_pos = [990, 879, 766];
                    //} else if (device.width == 1080 && device.height == 2340) {
                    //    clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
                    //    clicky_pos = [955, 818, 680];
                } else if (device.width == 1080 && device.height == 2280) {
                    clickx_pos = [396, 666, 938, 1216, 1484, 1756, 2025];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 2244) {
                    clickx_pos = [396, 666, 938, 1216, 1484, 1756, 2025];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 2230) {
                    clickx_pos = [396, 666, 938, 1216, 1484, 1756, 2025];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 2160) {
                    clickx_pos = [396, 666, 938, 1216, 1484, 1756, 2025];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 2400) {
                    clickx_pos = [443, 727, 1004, 1274, 1546, 1815, 2088];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 1920) {
                    clickx_pos = [215, 488, 757, 1031, 1300, 1573, 1847];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 720 && device.height == 1465) {
                    clickx_pos = [252, 426, 602, 775, 950, 1125, 1301];
                    clicky_pos = [510, 584, 661];
                } else {
                    throw new Error("Unsupported resolutions");
                }
                break;
            case "Genshin Impact":
                throw new Error("Unsupported resolutions");
                break;
            case "Moore Manor":
                throw new Error("Unsupported resolutions");
                break;
            default:
                throw new Error("Wrong type of game");
                break;
        }
        return {
            clickx_pos: clickx_pos,
            clicky_pos: clicky_pos,
            longclick_pos: longclick_pos
        }
    }
}

module.exports = preDefinedRes;