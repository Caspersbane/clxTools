//@ts-check
var midiPitch = require("./midiPitch.js");

/**
 * @typedef {[number, number]} pos2d
 * @typedef {[pos2d, pos2d]} pos2dPair
 */

/**
 * Key positioning type/type of key that needs to get coordinates
 * @enum {string}
 * @typedef {string} KeyLocatorType
 */
const KeyLocatorTypes = {
    //Top left
    "LOCATOR_LEFT_TOP": "LOCATOR_LEFT_TOP",
    //Bottom right
    "LOCATOR_RIGHT_BOTTOM": "LOCATOR_RIGHT_BOTTOM",
    //Press the long tone
    "KEY_LONG": "KEY_LONG",
}

/**
 * @enum {string}
 * @typedef {string} NoteDurationImplementionType
 */
const NoteDurationImplementionTypes = {
    //Not at all, all notes are the same length, no matter how long you hold it down // the easiest
    "none": "none",
    //By holding down another key at the same time to make a long sound, there is a big difference between the two cases //TODO:
    "extraLongKey": "extraLongKey",
    //Native support, how long to make a sound when you hold it down //hardest to support //TODO:
    "native": "native",
}

/**
 * @enum {string}
 */
const FeatureFlags = {
    //Whether there are all semitones
    "hasAllSemitone": "hasAllSemitone",
}

/**
 * @typedef {object} LayoutGeneratorConfig
 * @property {Array<string>} pitchRangeOrList Pitch range or pitch list, e.g. ["C3", "C5"] (including C5)/["C3", "D3", ...]
 * @property {number} row Number of rows
 * @property {number} column Number of columns (including black keys)
 * @property {Array<[number,number]>} [rowLengthOverride] Overwrite the length of a row, default is empty, use column (count from bottom to top)
 * @property {Array<[number,number]>} [insertDummyKeys] Insert a virtual button at the specified position for adjusting the layout. Count from bottom to top, count from left to right, e.g. [0,1] means inserting a virtual button in the second position of the first row
 * @property {boolean} haveSemitone Whether there are semitones or not
 * @property {number} [semiToneWidth] The width occupied by the chromatic key is between the two whole tone keys when it is 0, a key position is independent when it is 1, and a proportional part of it is between 0 and 1, which is 0 by default
 * @property {number} [semiToneHeightOffset] The height of the chromatic keys is offset by 0 in the middle of the whole tone keys, 1 in the middle of the above column, and between 0 and 1 in proportion to the relative position, which is 0.5 by default
 * @property {[[number, number, number],
*             [number, number, number],
*             [number, number, number]]} [transformMatrix] Transform matrix, which is used to transform the position of the keys. The default is I-> does not transform
* @property {number} [centerAngle] The arc button corresponds to the center angle of the sector, and the default value is 0 -> does not transform
* @property {number} [centerRadius] The center radius of the curved button corresponds to the sector (set the total height of the button layout to 1)
*/

/**
* @brief Generate pitch-to-key mappings based on parameters
* @param {LayoutGeneratorConfig} config 
* @returns {Map<string, pos2dPair|undefined>} Pitch-to-key position mapping
*/
function generateLayout(config) {
    if (config.semiToneWidth == undefined) {
        config.semiToneWidth = 0;
    }
    if (config.semiToneHeightOffset == undefined) {
        config.semiToneHeightOffset = 0.5;
    }
    if (config.transformMatrix == undefined) {
        config.transformMatrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ];
    }
    if (config.centerAngle == undefined) {
        config.centerAngle = 0;
    }
    if (config.centerRadius == undefined) {
        config.centerRadius = 1;
    }
    let rowLengthOverride = new Map();
    if (config.rowLengthOverride) {
        for (let i = 0; i < config.rowLengthOverride.length; i++) {
            rowLengthOverride[config.rowLengthOverride[i][0]] = config.rowLengthOverride[i][1];
        }
    }
    console.log(rowLengthOverride);

    let rows = [];
    //1. Generate a list of pitches for each row, regardless of key position for the time being
    let usePitchRange = config.pitchRangeOrList.length == 2;
    let pitchOrIndex = usePitchRange ? midiPitch.nameToMidiPitch(config.pitchRangeOrList[0]) : 0;
    for (let i = 0; i < config.row; i++) {
        let colLen = rowLengthOverride.get(i) ? rowLengthOverride.get(i) : config.column;
        console.log(colLen);
        let row = [];
        for (let j = 0; j < colLen; j++) {
            let curPitch = usePitchRange ? pitchOrIndex : midiPitch.nameToMidiPitch(config.pitchRangeOrList[pitchOrIndex]);
            row.push([curPitch, [0, 0]]);
            if (usePitchRange) {
                //If the next note is a semitone but no chromatic keys are used, skip
                if (!config.haveSemitone && midiPitch.isHalf(curPitch + 1)) {
                    pitchOrIndex++;
                }
                pitchOrIndex++;
            } else {
                pitchOrIndex++;
            }
        }
        rows.push(row);
    }

    //2. Insert a dummy column
    if (config.insertDummyKeys) {
        //Insert from right to left
        for (let i = 0; i < rows.length; i++) {
            let insertDummyColumns = config.insertDummyKeys.reduce((acc, cur) => {
                if (cur[0] == i) {
                    //@ts-ignore
                    acc.push(cur[1]);
                }
                return acc;
            }, []).sort((a, b) => b - a);
            for (let j = 0; j < insertDummyColumns.length; j++) {
                rows[i].splice(insertDummyColumns[j], 0, [-1, [0, 0]]);
            }
        }
    }

    //3. Generate the coordinates of the foundation
    //Suppose each row is x=0 at the left, 1 at the right, y=1 at the bottom of each column, and 0 at the top

    let rowDistance = config.row == 1 ? 1 : 1 / (config.row - 1);
    let colDistance = config.column == 1 ? 1 : 1 / (config.column - 1);

    for (let i = 0; i < rows.length; i++) {
        let curX = 0
        for (let j = 0; j < rows[i].length; j++) {
            //Config needs to be considered.semiToneWidth
            rows[i][j][1][0] = curX;
            //Check if the current or next note is a semitone, and if so, adjust the position
            //@ts-ignore
            if (midiPitch.isHalf(rows[i][j][0]) || (rows[i][j + 1] && midiPitch.isHalf(rows[i][j + 1][0]))) {
                curX += colDistance * (1 + config.semiToneWidth);
            } else {
                curX += colDistance * 2;
            }
            rows[i][j][1][1] = 1 - rowDistance * i;
        }

    }
    //Normalize the X coordinates
    {
        let minX = rows.reduce((min, row) => Math.min(min, row.reduce((min, key) => Math.min(min, key[1][0]), 0)), 0);
        let maxX = rows.reduce((max, row) => Math.max(max, row.reduce((max, key) => Math.max(max, key[1][0]), 0)), 0);
        let width = maxX - minX;
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                rows[i][j][1][0] = (rows[i][j][1][0] - minX) / width;
            }
        }
    }
    //4. Center-aligned
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let rowLen = row[row.length - 1][1][0] - row[0][1][0];
        let centerX = rowLen / 2;
        for (let j = 0; j < row.length; j++) {
            row[j][1][0] -= (centerX - 0.5);
        }
    }

    //5. Adjust the y coordinate of the chromatic button
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            //@ts-ignore
            if (midiPitch.isHalf(rows[i][j][0])) {
                rows[i][j][1][1] -= rowDistance * config.semiToneHeightOffset;
            }
        }
    }

    //6. Apply a transformation matrix
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            let pos = rows[i][j][1];
            pos[0] = pos[0] * config.transformMatrix[0][0] + pos[1] * config.transformMatrix[0][1] + config.transformMatrix[0][2];
            pos[1] = pos[0] * config.transformMatrix[1][0] + pos[1] * config.transformMatrix[1][1] + config.transformMatrix[1][2];
        }
    }

    //7. Apply an arc transform
    if (config.centerAngle != 0) {
        let centerX = 0.5;
        let centerY = -config.centerRadius;
        let radius = config.centerRadius;
        let startAngle = Math.PI / 2 - config.centerAngle / 2;
        let endAngle = Math.PI / 2 + config.centerAngle / 2;

        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let pos = rows[i][j][1];
                let angle = startAngle + (endAngle - startAngle) * pos[0];
                let newX = centerX + (radius + pos[1]) * Math.cos(angle);
                let newY = centerY + (radius + pos[1]) * Math.sin(angle);
                pos[0] = newX;
                pos[1] = newY; // Fix the y coordinates
            }
        }
        // Normalize x and y to between 0,1
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let pos = rows[i][j][1];
                if (pos[0] < minX) minX = pos[0];
                if (pos[0] > maxX) maxX = pos[0];
                if (pos[1] < minY) minY = pos[1];
                if (pos[1] > maxY) maxY = pos[1];
            }
        }
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let pos = rows[i][j][1];
                pos[0] = (pos[0] - minX) / (maxX - minX);
                pos[1] = (pos[1] - minY) / (maxY - minY);
            }
        }
        //Reverse left and right. Not sure why it is needed
        for (let i = 0; i < rows.length; i++) {
            let poss = rows[i].map(key => key[1]);
            poss.reverse();
            for (let j = 0; j < poss.length; j++) {
                rows[i][j][1] = poss[j];
            }
        }
    }

    //8. Full normalization
    let minX = rows.reduce((min, row) => Math.min(min, row.reduce((min, key) => Math.min(min, key[1][0]), 0)), 0);
    let maxX = rows.reduce((max, row) => Math.max(max, row.reduce((max, key) => Math.max(max, key[1][0]), 0)), 0);
    let width = maxX - minX;
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            rows[i][j][1][0] = (rows[i][j][1][0] - minX) / width;
        }
    }
    let minY = rows.reduce((min, row) => Math.min(min, row.reduce((min, key) => Math.min(min, key[1][1]), 0)), 0);
    let maxY = rows.reduce((max, row) => Math.max(max, row.reduce((max, key) => Math.max(max, key[1][1]), 0)), 0);
    let height = maxY - minY;
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            rows[i][j][1][1] = (rows[i][j][1][1] - minY) / height;
        }
    }

    //9. Generate the final result
    let noteKeyMap = new Map();
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            if (rows[i][j][0] != -1) {
                //@ts-ignore
                let pitchName = midiPitch.midiPitchToName(rows[i][j][0]);
                noteKeyMap[pitchName] = rows[i][j][1];
            }
        }
    }

    //Sort according to pitch from low to high
    return noteKeyMap;
}

/**
 * Commonly used transformation matrices
 * @type {Object.<string, [[number, number, number],
 *             [number, number, number],
 *             [number, number, number]]>}
 */
const transformMatrices = {
    "centerFlipY": [
        [1, 0, 0],
        [0, -1, 1],
        [0, 0, 1],
    ]
}

/**
 * Commonly used key layouts
 * @constant
 * @type {Object.<string, LayoutGeneratorConfig>}
 */
const keyLayoutConfigs = {
    "generic_3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
    },
    "generic_3x12": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0,
        semiToneWidth: 1,
    },
    "generic_2x7": {
        pitchRangeOrList: ["C4", "B5"],
        row: 2,
        column: 7,
        haveSemitone: false,
    },
    "sky_3x5": {
        pitchRangeOrList: ["C3", "C5"],
        row: 3,
        column: 5,
        haveSemitone: false,
        transformMatrix: transformMatrices.centerFlipY,
    },
    "sky_2x4": {
        pitchRangeOrList: ["C6",
            "D6",
            "E6",
            "G6",
            "A4",
            "E5",
            "G5",
            "A5"],
        row: 2,
        column: 4,
        haveSemitone: false,
    },
    "nshm_1x7": {
        pitchRangeOrList: ["C4", "B4"],
        row: 1,
        column: 7,
        haveSemitone: false,
    },
    "nshm_professional_gu_zheng": {
        pitchRangeOrList: ["C2", "C6#"],
        row: 1,
        column: 50,
        haveSemitone: true,
        semiToneHeightOffset: 1,
    },
    "nshm_professional_qv_di": {
        pitchRangeOrList: ["G3", "D6"],
        row: 1,
        column: 32,
        haveSemitone: true,
        semiToneHeightOffset: 1,
    },
    "nshm_professional_pi_pa": {
        pitchRangeOrList: ["A2", "D6"],
        row: 1,
        column: 42,
        haveSemitone: true,
        semiToneHeightOffset: 1,
    },
    "nshm_professional_suo_na": {
        pitchRangeOrList: ["E3", "B5"],
        row: 1,
        column: 32,
        haveSemitone: true,
        semiToneHeightOffset: 1,
    },
    "dzpd_interleaved3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        insertDummyKeys: [[1, 0]],
    },
    "dzpd_7_8": {
        pitchRangeOrList: ["C4", "C6"],
        row: 2,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[1, 8]],
    },
    "dzpd_yinterleaved36": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0.35,
    },
    "speedmobile_interleaved3x7_1": {
        pitchRangeOrList: ["C3", "C5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[2, 8]],
        insertDummyKeys: [[0, 7]],
    },
    "speedmobile_interleaved3x12_1": {
        pitchRangeOrList: ["C3", "C6"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0,
        insertDummyKeys: [[0, 12]],
    },
    "abd_7_8_7": {
        pitchRangeOrList: ["C3", "C6"],
        row: 3,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[1, 8]],
        transformMatrix: transformMatrices.centerFlipY,
    },
    "abd_8_7": {
        pitchRangeOrList: ["C3", "C5"],
        row: 2,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[1, 8]],
        transformMatrix: transformMatrices.centerFlipY,
    },
    "hpma_yinterleaved3x12": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0.5,
    },
    "hpma_2x7": {
        pitchRangeOrList: ["C3", "B4"],
        row: 2,
        column: 7,
        haveSemitone: false,
    },
    "mrzh_3x12": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0,
        semiToneWidth: 0,
    },
    "mrzh_piano23": {
        pitchRangeOrList: ["F3#", "E5"],
        row: 1,
        column: 23,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "generic_piano88": {
        pitchRangeOrList: ["A0", "C8"],
        row: 1,
        column: 88,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "xqcq_suona33": {
        pitchRangeOrList: ["C3", "G5"],
        row: 1,
        column: 33,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "xdxz_7_7_8": {
        pitchRangeOrList: ["C3", "C6"],
        row: 3,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[2, 8]],
    },
    "xdxz_7_7_8_half": {
        pitchRangeOrList: ["C3", "C6"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0.35,
        semiToneWidth: 0,
        rowLengthOverride: [[2, 13]],
    },
    "mhls_curved3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        //Bad, who's going to fix it?
        centerAngle: Math.PI / 1.7,
        centerRadius: 1.55,
        // centerAngle: Math.PI / 4,
        // centerRadius: 10,
    },
    "yjwj_curved3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        centerAngle: Math.PI / 40,
        centerRadius: 100,
    },
    "jw3_sloped3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        transformMatrix: [
            [1, 0.11, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]
    },
    "generic_piano36": {
        pitchRangeOrList: ["C3", "B5"],
        row: 1,
        column: 36,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "yslzm_piano20": {
        pitchRangeOrList: ["E4", "B5"],
        row: 1,
        column: 20,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "tysc_interleaved3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        insertDummyKeys: [[1, 7]],
    },
    "qrsj_piano24": {
        pitchRangeOrList: ["C4", "B5"],
        row: 1,
        column: 24,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
}

//Encounter: The location of the map corresponding to the tune
//https://www.bilibili.com/read/cv15735140/
const skyTuneMapPosition = {
    "C": "Encounter/Morning Island Desert Zone/Middle of the Prophecy Valley/Between the third and fourth gates of the rainforest (hidden map entrance), there is a pavilion of the little golden man on the left side/The beginning of the hidden map of the four golden people in the rainforest/The end of the rainforest/Xiaguang City/Xiaguang City underwater/Forbidden Pavilion basement? / Eye of the Storm Phase I",
    "Db": "The island next to the end of Morning Island / Yunye Eight People / The pavilion of the little golden figure between the fourth gate of the rainforest and the end point (hidden map exit) / The third floor of the Forbidden Pavilion",
    "D": "Behind the initial diagram of the clouds/large central image of the clouds (second picture?) / Hidden map on the right side of Yunye (the one with two small broken towers) / Holy Island / End of Xiagu / Maze of Xiagu / Second Floor of the Forbidden Pavilion / Tomb Three Dragons / End of the Tomb / The beginning of the Forbidden Pavilion did not reach the position of the first floor",
    "Eb": "On the right side of the middle of the third gate to the fourth gate of the rainforest, there is a pavilion of the little golden man/tomb soil without dragons/tomb earth ark/tomb soil four dragon maps/tomb earth shipwreck",
    "E": "The galaxy of the road of rebirth",
    "F": "The end of the three towers of Yunye, the big tower / The hidden map of the two golden men in the rainforest / The castle of the Kasumigaya Flying Track (the small broken city with a ball in the middle) / Between the two entrances of the office / The first floor of the Forbidden Pavilion",
    "Gb": "The fourth gate of the rainforest to the last tower at the end",
    "G": "Rainforest Initial Diagram / Morning Island Fly to the end cliffs",
    "Ab": "Morning Island Finish Altar / Prophecy Valley Beginning / Kasumigaya Track Finish",
    "A": "The skating three-way exit at the beginning of Kasumi Valley / the altar at the end of the Forbidden Pavilion / the top of the small broken tower on the fourth floor of the Forbidden Pavilion",
    "Bb": "The second tower of the three towers of the cloud field/the transition map from the rainforest to the valley of Kasumigami",
    "B": "After the first pitch change on the second floor of the Forbidden Pavilion",
}

/**
 * The specific configuration of the variant type
 * There will be different instruments in the game, which share the same keybits, but the vocal range may be different. 
 * Therefore this type is used to denote different variants
 * @typedef {Object} VariantConfig
 * @property {string} variantType - Variant type
 * @property {string} variantName - Variant name
 * @property {[string, string]} [availableNoteRange] - Available note range [min, max]. undefined means that all notes in the noteKeyMap are used
 * @property {string} noteDurationImplementionType - How note duration is implemented. @see NoteDurationImplementionTypes Defaults to "none"
 * @property {number} [sameKeyMinInterval] - The minimum interval (ms) between the same keystrokes. undefined means that the value in the GameConfig is used, otherwise the value | 0 indicates no limit
 * @property {Object.<string, string>} [replaceNoteMap] - Replace the note mapping table. Replace the original note with a new note. For example: {"C3": "C4", "D3": "D4"} means that C3 is replaced with C4 and D3 is replaced with D4
 */

/**
 * Default variant configuration
 * @type {VariantConfig}
 */
const defaultVariantConfig = {
    variantType: "default",
    variantName: "default",
    noteDurationImplementionType: NoteDurationImplementionTypes.none,
};

/**
 * Key type
 * @typedef {Object} KeyType
 * @property {string} name - The name of the key type
 * @property {string} displayName - The key type display name
 * @property {LayoutGeneratorConfig} keyLayout - Key layout generation configuration
 */
/**
 * @typedef {Object} GameConfig
 * @property {string} gameType - The type of game, which can be any value
 * @property {string} gameName - The name of the game, which can be any value
 * @property {Array<KeyType>} keyTypes - Available key types
 * @property {Array<VariantConfig>} variants - Available variants. The first variant is the default variant, and if there is only one variant, the variant selection screen will not be displayed
 * @property {number} sameKeyMinInterval - The minimum interval (ms) for the same key, which defaults to 0
 * @property {Array<string>} packageNamePart - Part of the package name, which defaults to an empty array
 */

/**
 * Predefined game configurations
 * @type {Array<GameConfig>}
 */
const PreDefinedGameConfigs = [
    {
        gameType: "Chu Liuxiang",
        gameName: "Chu Liuxiang",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],
        variants: [
            { //TODO:
                variantType: "default",
                variantName: "默认",
                noteDurationImplementionType: NoteDurationImplementionTypes.extraLongKey,
            },
        ],
        sameKeyMinInterval: 200,
        packageNamePart: ["wyclx"],
    }, {
        gameType: "The Moon Knife of the End of the World",
        gameName: "The Moon Knife of the End of the World",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],
        variants: [
            defaultVariantConfig,
        ],
        sameKeyMinInterval: 100,
        packageNamePart: ["tmgp.wuxia"],
    }, {
        gameType: "Genshin Impact",
        gameName: "Genshin Impact",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }, {
            name: "generic_2x7",
            displayName: "2x7",
            keyLayout: keyLayoutConfigs.generic_2x7,
        }],
        variants: [
            {
                variantType: "The poetry of the scenery",
                variantName: "The poetry of the scenery",
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
            {
                variantType: "Evening breeze horn",
                variantName: "Evening breeze horn",
                noteDurationImplementionType: NoteDurationImplementionTypes.native,
            },
            {
                variantType: "The old poetry qin",
                variantName: "The old poetry qin",
                replaceNoteMap: {
                    "E3": "D3#",
                    "B3": "A3#",
                    "E4": "D4#",
                    "B4": "A4#",
                    "D5": "C5#",
                    "E5": "D5#",
                    "A5": "G5#",
                    "B5": "A5#",
                },
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["genshin", "yuanshen", "ys.x"],
    }, {
        gameType: "Light encounter",
        gameName: "Light encounter",
        keyTypes: [{
            name: "sky_3x5",
            displayName: "3x5",
            keyLayout: keyLayoutConfigs.sky_3x5,
        }, {
            name: "sky_2x4",
            displayName: "2x4",
            keyLayout: keyLayoutConfigs.sky_2x4,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["sky"],
    }, {
        gameType: "Reverse the cold mobile game",
        gameName: "Against the cold",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }, {
            name: "generic_3x12",
            displayName: "3x12",
            keyLayout: keyLayoutConfigs.generic_3x12,
        }, {
            name: "nshm_1x7",
            displayName: "1x7",
            keyLayout: keyLayoutConfigs.nshm_1x7,
        },
        {
            name: "nshm_professional_gu_zheng",
            displayName: "Pro mode (Guzheng)",
            keyLayout: keyLayoutConfigs.nshm_professional_gu_zheng,
        },
        {
            name: "nshm_professional_qv_di",
            displayName: "Pro Mode (Hulusi)",
            keyLayout: keyLayoutConfigs.nshm_professional_qv_di,
        },
        {
            name: "nshm_professional_pi_pa",
            displayName: "Pro Mode (Pipa)",
            keyLayout: keyLayoutConfigs.nshm_professional_pi_pa,
        },
        {
            name: "nshm_professional_suo_na",
            displayName: "Professional Mode (Suona)",
            keyLayout: keyLayoutConfigs.nshm_professional_suo_na,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["nshm"],
    }, {
        gameType: "Egg Boy Party",
        gameName: "Egg Boy Party",
        keyTypes: [
            {
                name: "dzpd_7_8",
                displayName: "15 keys",
                keyLayout: keyLayoutConfigs.dzpd_7_8,
            }, {
                name: "dzpd_interleaved3x7",
                displayName: "21 keys",
                keyLayout: keyLayoutConfigs.dzpd_interleaved3x7,
            }, {
                name: "dzpd_yinterleaved36",
                displayName: "36 keys",
                keyLayout: keyLayoutConfigs.dzpd_yinterleaved36,
            }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["party"],
    },
    //Naraka
    {
        gameType: "Naraka",
        gameName: "Naraka",
        keyTypes: [{
            name: "yjwj_curved3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.yjwj_curved3x7,
        }],
        variants: [
            defaultVariantConfig,
            {
                variantType: "flute",
                variantName: "flute",
                availableNoteRange: ["G3", "B5"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["netease.l22"],
    }, {
        gameType: "Dawn Awakening",
        gameName: "Dawn Awakening",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],  //TODO: Piano + range toggle button
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["toaa"],
    }, {
        gameType: "Obi Island",
        gameName: "Obi Island",
        keyTypes: [{
            name: "abd_7_8_7",
            displayName: "22 keys",
            keyLayout: keyLayoutConfigs.abd_7_8_7,
        }, {
            name: "abd_8_7",
            displayName: "15 keys",
            keyLayout: keyLayoutConfigs.abd_8_7,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["aobi"],
    }, {
        gameType: "Harry Potter _ Magic Awakens",
        gameName: "Harry Potter: Magical Awakening",
        keyTypes: [{
            name: "hpma_yinterleaved3x12",
            displayName: "36 keys",
            keyLayout: keyLayoutConfigs.hpma_yinterleaved3x12,
        }, {
            name: "hpma_2x7",
            displayName: "14 keys",
            keyLayout: keyLayoutConfigs.hpma_2x7,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["harrypotter"],
    }, {
        gameType: "Fifth personality",
        gameName: "Fifth personality",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "21 keys",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }, {
            name: "hpma_yinterleaved3x12",
            displayName: "36 keys",
            keyLayout: keyLayoutConfigs.hpma_yinterleaved3x12,
        }],
        variants: [
            defaultVariantConfig,
            {
                variantType: "Jade flute",
                variantName: "Jade flute",
                availableNoteRange: ["C3", "B4"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["dwrg"],
    }, {
        gameType: "Onmyoji",
        gameName: "Onmyoji",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["onmyoji"],
    }, {
        gameType: "Moore Manor",
        gameName: "Moore Manor",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "21 keys",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }, {
            name: "hpma_yinterleaved3x12",
            displayName: "36 keys",
            keyLayout: keyLayoutConfigs.hpma_yinterleaved3x12,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["mole"],
    }, {
        gameType: "After tomorrow",
        gameName: "After tomorrow",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "21 keys",
            keyLayout: keyLayoutConfigs.generic_3x7,
        },
        {
            name: "mrzh_3x12",
            displayName: "36 keys",
            keyLayout: keyLayoutConfigs.mrzh_3x12,
        },
        {
            name: "generic_piano88",
            displayName: "88-key piano",
            keyLayout: keyLayoutConfigs.generic_piano88,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["mrzh"],
    }, {
        gameType: "The Star of the Yuan Dream",
        gameName: "The Star of the Yuan Dream",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        },
        {
            name: "hpma_yinterleaved36",
            displayName: "3x12",
            keyLayout: keyLayoutConfigs.hpma_yinterleaved3x12,
        }],
        variants: [
            defaultVariantConfig,
            {
                variantType: "Suona",
                variantName: "Suona",
                availableNoteRange: ["E3", "B5"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["com.tencent.letsgo"],
    }, {
        gameType: "Heartbeat town",
        gameName: "Heartbeat town",
        //Double row 15 keys, triple row 15 keys, 22 keys, 22 keys + semitone
        keyTypes: [{
            name: "dzpd_7_8",
            displayName: "Double-row 15 keys",
            keyLayout: keyLayoutConfigs.dzpd_7_8,
        }, {
            name: "sky_3x5",
            displayName: "Three rows of 15 keys",
            keyLayout: keyLayoutConfigs.sky_3x5,
        }, {
            name: "xdxz_7_7_8",
            displayName: "22 keys",
            keyLayout: keyLayoutConfigs.xdxz_7_7_8,
        }, {
            name: "xdxz_7_7_8_half",
            displayName: "37 keys",
            keyLayout: keyLayoutConfigs.xdxz_7_7_8_half,
        }], //TODO： 8 Keys (Drum)
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: [], //TODO:
    }, {
        gameType: "Legend of the Condor Heroes",
        gameName: "Legend of the Condor Heroes",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],
        variants: [  //TODO: This game should have a long tone button
            defaultVariantConfig,
            {
                variantType: "Bamboo flute",
                variantName: "Bamboo flute",
                availableNoteRange: ["G3", "A5"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
            {
                variantType: "Hole flute",
                variantName: "Hole flute",
                availableNoteRange: ["C3", "B4"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["sdyxz"],
    },
    //QQ Speed
    {
        gameType: "QQ Speed",
        gameName: "QQ Speed",
        keyTypes: [{
            name: "speedmobile_interleaved3x7_1",
            displayName: "22 keys",
            keyLayout: keyLayoutConfigs.speedmobile_interleaved3x7_1,
        }, {
            name: "speedmobile_interleaved3x12_1",
            displayName: "37 keys",
            keyLayout: keyLayoutConfigs.speedmobile_interleaved3x12_1,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["speedmobile"],
    },
    //Creation and magic
    {
        gameType: "Creation and magic",
        gameName: "Creation and magic",
        keyTypes: [{
            name: "sky_3x5",
            displayName: "3x5",
            keyLayout: keyLayoutConfigs.sky_3x5,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["hero.sm"],
    },
    //Delusional mountains and seas
    {
        gameType: "Delusional mountains and seas",
        gameName: "Delusional mountains and seas",
        keyTypes: [
            {
                name: "generic_piano36",
                displayName: "36-key piano",
                keyLayout: keyLayoutConfigs.generic_piano36,
            },
            {
                name: "generic_3x7",
                displayName: "3x7",
                keyLayout: keyLayoutConfigs.generic_3x7,
            }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tmgp.djsy"],
    },
    {
        gameType: "Planet Reboot",
        gameName: "Planet: Reboot",
        keyTypes: [{
            name: "generic_piano88",
            displayName: "88-key piano",
            keyLayout: keyLayoutConfigs.generic_piano88,
        },
        {
            name: "xqcq_suona33",
            displayName: "33 keys suona",
            keyLayout: keyLayoutConfigs.xqcq_suona33,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["hermes"],
    },
    {
        gameType: "Wilderness Action",
        gameName: "Wilderness Action",
        keyTypes: [{
            name: "generic_piano88",
            displayName: "88-key piano",
            keyLayout: keyLayoutConfigs.generic_piano88,
        }],
        variants: [
            defaultVariantConfig,
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["netease.hyxd"],
    },
    //Minecraft
    {
        gameType: "Minecraft",
        gameName: "Minecraft",
        keyTypes: [
            {
                name: "generic_3x7",
                displayName: "3x7",
                keyLayout: keyLayoutConfigs.generic_3x7,
            },
            {
                name: "generic_piano36",
                displayName: "36-key piano",
                keyLayout: keyLayoutConfigs.generic_piano36,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["netease.mc", "netease.x19"],
    },
    //Mini world
    {
        gameType: "迷你世界",
        gameName: "迷你世界",
        keyTypes: [
            {
                name: "generic_3x7",
                displayName: "21 keys",
                keyLayout: keyLayoutConfigs.generic_3x7,
            },
            {
                name: "dzpd_yinterleaved36",
                displayName: "36键",
                keyLayout: keyLayoutConfigs.dzpd_yinterleaved36,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["miniworld"],
    },
    //Cats and mice
    {
        gameType: "Cats and mice",
        gameName: "Cats and mice",
        keyTypes: [
            {
                name: "mhls_curved3x7",
                displayName: "21 keys",
                keyLayout: keyLayoutConfigs.mhls_curved3x7, //最逆天的键位
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tom"],
    },
    //Stay-at-home time
    {
        gameType: "Stay-at-home time",
        gameName: "Stay-at-home time",
        keyTypes: [
            {
                name: "dzpd_yinterleaved36",
                displayName: "36 keys",
                keyLayout: keyLayoutConfigs.dzpd_yinterleaved36,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["housetime"],
    },
    //Sword Net 3
    {
        gameType: "Sword Net 3",
        gameName: "Sword Net 3",
        keyTypes: [
            {
                name: "mhls_curved3x7",
                displayName: "21 keys (arc)",
                keyLayout: keyLayoutConfigs.mhls_curved3x7,
            },
            {
                name: "jw3_sloped3x7",
                displayName: "21 keys (slash)",
                keyLayout: keyLayoutConfigs.jw3_sloped3x7,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tmgp.jx3m"],
    },
    {
        gameType: "In the name of Shining",
        gameName: "In the name of Shining",
        keyTypes: [
            {
                name: "yslzm_piano20",
                displayName: "20-key piano",
                keyLayout: keyLayoutConfigs.yslzm_piano20,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["yslzm"],
    },
    {
        gameType: "There are people in the depths of Taoyuan",
        gameName: "There are people in the depths of Taoyuan",
        keyTypes: [
            {
                name: "tysc_interleaved3x7",
                displayName: "21 keys",
                keyLayout: keyLayoutConfigs.tysc_interleaved3x7,
            },
            {
                name: "dzpd_7_8",
                displayName: "15 keys",
                keyLayout: keyLayoutConfigs.dzpd_7_8,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["fiftyone"],
    },
    {
        gameType: "Seven Days World",
        gameName: "Seven Days World",
        keyTypes: [
            {
                name: "qrsj_piano24",
                displayName: "24-key piano",
                keyLayout: keyLayoutConfigs.qrsj_piano24,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["ohminicgos"],
    },
    //Customization 1
    {
        gameType: "Customization 1",
        gameName: "Customization 1",
        keyTypes: [
            {
                name: "generic_3x7",
                displayName: "3x7",
                keyLayout: keyLayoutConfigs.generic_3x7,
            },
            {
                name: "generic_3x12",
                displayName: "3x12",
                keyLayout: keyLayoutConfigs.generic_3x12,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 0,
        packageNamePart: [],
    }, {
        gameType: "Custom 2",
        gameName: "Custom 2",
        keyTypes: [
            {
                name: "generic_3x7",
                displayName: "3x7",
                keyLayout: keyLayoutConfigs.generic_3x7,
            },
            {
                name: "generic_3x12",
                displayName: "3x12",
                keyLayout: keyLayoutConfigs.generic_3x12,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 0,
        packageNamePart: [],
    },
];

/**
 * @constructor
 */
function GameProfile() {

    var preDefinedGameConfigs = PreDefinedGameConfigs;

    /**
     * @type {GameConfig[]}
     */
    var gameConfigs = [];

    /**
     * @type {GameConfig | undefined}
     * The game configuration that is currently in effect
     */
    var currentGameConfig = undefined;
    //The name of the current key layout
    var currentKeyTypeName = "";
    //The name of the currently active variant
    var currentVariantType = "";
    //The current game type - the name of the keylocators, which is used to find the keylocators configuration
    var currentGameTypeKeyTypeName = "";

    /**
     * @typedef {Object.<KeyLocatorTypes,pos2dPair>} LocatedKeys
     */
    /**
     * @type {Map<string,LocatedKeys>}
     * @description Keybindings for all games (gameType-keyTypeName, pos1, pos2)
     */
    var keyLocators = new Map();

    /**
     * @type {Array<pos2d>?}
     * @description Array of key positions (pitch from low to high)
     */
    var cachedKeyPos = null;

    /**
     * @type {Map<number,number>?}
     * @description Mapping of MIDI pitch to key sequence number (starting with 1).
     */
    var cachedPitchKeyMap = null;

    /**
     * @type {[number,number]?}
     * @description MIDI pitch range. Find things faster
     */
    var cachedNoteRange = null;

    /**
     * @brief Load the configuration list
     * @param {Array<Object>} configs Configure the list
     */
    this.loadGameConfigs = function (configs) {
        for (let i = 0; i < configs.length; i++) {
            gameConfigs = preDefinedGameConfigs;
        }
    }

    /**
     * @brief Load the list of default configurations
     */
    this.loadDefaultGameConfigs = function () {
        this.loadGameConfigs(preDefinedGameConfigs);
    }

    /**
     * @brief Updating the Configuration List (Current Configuration)
     */
    this.updateGameConfigs = function () {
        //Save the current configuration to gameConfigs
        if (currentGameConfig == null) {
            return;
        }
        let haveCurrentConfig = false;
        for (let i = 0; i < gameConfigs.length; i++) {
            if (gameConfigs[i].gameType == currentGameConfig.gameType) {
                haveCurrentConfig = true;
                gameConfigs[i] = currentGameConfig;
                break;
            }
        }
        if (!haveCurrentConfig) {
            gameConfigs.push(currentGameConfig);
        }
    }

    /**
     * @brief Get the configuration list
     * @returns {GameConfig[]} Configure the list
     */
    this.getGameConfigs = function () {
        this.updateGameConfigs();
        return gameConfigs;
    }

    /**
     * Set the current configuration based on the package name
     * @param {string} packageName Package name
     * @returns {boolean} Whether the setting is successful
     */
    this.setConfigByPackageName = function (packageName) {
        if (packageName == null || packageName == "") {
            return false;
        }
        //First, check whether the current configuration meets the requirements
        if (currentGameConfig != null) {
            for (let i = 0; i < currentGameConfig.packageNamePart.length; i++) {
                if (packageName.indexOf(currentGameConfig.packageNamePart[i]) != -1) {
                    return true;
                }
            }
        }
        // Check whether there are any configurations that meet the requirements in the configuration list
        let config = gameConfigs.find(function (config) {
            return config.packageNamePart.some(function (part) {
                return packageName.indexOf(part) != -1;
            });
        });
        if (config == null) {
            return false;
        }
        currentGameConfig = config;
        return true;
    }

    /**
     * Determine the current configuration based on the configuration name (game type).
     * @param {string} gameType The name of the configuration file
     * @returns {boolean} Whether the setting is successful
     */
    this.setConfigByName = function (gameType) {
        let config = gameConfigs.find(function (config) {
            return config.gameType == gameType;
        });
        if (config == null) {
            return false;
        }
        currentGameConfig = config;
        return true;
    }

    /**
     * Get a list of profile names
     * @returns {Array<string>} A list of profile names
     */
    this.getConfigNameList = function () {
        return gameConfigs.map(function (config) {
            return config.gameType;
        });
    }

    /**
     * Get all key configurations
     * @returns {Map<string,LocatedKeys>} Key configuration
     */
    this.getKeyLocators = function () {
        return keyLocators;
    }

    /**
     * Set all key configurations 
     * @param {Map<string,LocatedKeys>} l Key configuration
     */
    this.setKeyLocators = function (l) {
        keyLocators = l;
    }

    this.getCurrentConfig = function () {
        return currentGameConfig;
    }

    this.getCurrentConfigTypeName = function () {
        if (currentGameConfig == undefined) {
            return
        }
        return currentGameConfig.gameType;
    }

    this.getCurrentConfigDisplayName = function () {
        if (currentGameConfig == undefined) {
            return
        }
        return currentGameConfig.gameName;
    }

    this.setCurrentConfig = function (config) {
        currentGameConfig = config;
    }

    this.getCurrentAvailableVariants = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        return currentGameConfig.variants
    }

    this.getCurrentAvailableKeyLayouts = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        return currentGameConfig.keyTypes;

    }

    this.setCurrentVariantByTypeName = function (/** @type {string} */ variantType) {
        let variants = this.getCurrentAvailableVariants();
        if (variants == undefined) {
            return false;
        }
        if (variants.find(function (variant) {
            return variant.variantType == variantType;
        }) == undefined) {
            return false;
        }

        currentVariantType = variantType;
    }

    this.getCurrentVariant = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        return currentGameConfig.variants.find(function (variant) {
            return variant.variantType == currentVariantType;
        });
    }

    this.getCurrentVariantTypeName = function () {
        return currentVariantType;
    }

    this.getCurrentVariantDisplayName = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        let variant = this.getCurrentVariant();
        if (variant == undefined) {
            return undefined;
        }
        //If it is a unique configuration, the configuration name is not displayed
        if (currentGameConfig.variants.length == 1) {
            return "";
        }
        return variant.variantName;
    }

    this.setCurrentVariantDefault = function () {
        if (currentGameConfig == undefined) {
            return;
        }
        console.log(JSON.stringify(currentGameConfig));
        currentVariantType = currentGameConfig.variants[0].variantType;
    }

    this.setCurrentKeyLayoutByTypeName = function (/** @type {string} */ keyTypeName) {
        if (currentGameConfig == undefined) {
            return;
        }
        let keyTypes = currentGameConfig.keyTypes;
        if (keyTypes == undefined) {
            return false;
        }
        if (keyTypes.find(function (keyType) {
            return keyType.name == keyTypeName;
        }) == undefined) {
            return false;
        }
        currentKeyTypeName = keyTypeName;
        currentGameTypeKeyTypeName = `${currentGameConfig.gameType}-${currentKeyTypeName}`;
    }


    this.setCurrentKeyLayoutDefault = function () {
        if (currentGameConfig == undefined) {
            return;
        }
        currentKeyTypeName = currentGameConfig.keyTypes[0].name;
        currentGameTypeKeyTypeName = `${currentGameConfig.gameType}-${currentKeyTypeName}`;
    }

    this.getCurrentKeyLayoutDisplayName = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        let KeyType = this.getCurrentKeyLayout();
        if (KeyType == undefined) {
            return undefined;
        }
        // //If it is a unique configuration, the configuration name is not displayed
        // if (currentGameConfig.keyTypes.length == 1) {
        //     return "";
        // }
        return KeyType.displayName;
    }

    this.getCurrentKeyLayoutTypeName = function () {
        return currentKeyTypeName;
    }

    this.getProfileIdentifierTriple = function () {
        return `${this.getCurrentConfigTypeName()}-${this.getCurrentKeyLayoutTypeName()}-${this.getCurrentVariantTypeName()}`;
    }

    /**
     * Gets the current key parameters
     * @returns {KeyType|undefined} The current keybite type
     */
    this.getCurrentKeyLayout = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        return currentGameConfig.keyTypes.find(function (keyType) {
            return keyType.name == currentKeyTypeName;
        });
    }

    /**
     * Sets the position of the upper-left and lower-right anchors
     * @param {pos2dPair} pos1
     * @param {pos2dPair} pos2
     * @returns 
     */
    this.setKeyPosition = function (pos1, pos2) {
        if (currentGameConfig == undefined) {
            return false;
        }
        if (keyLocators[currentGameTypeKeyTypeName] == undefined) {
            keyLocators[currentGameTypeKeyTypeName] = {};
        }
        keyLocators[currentGameTypeKeyTypeName][KeyLocatorTypes.LOCATOR_LEFT_TOP] = pos1;
        keyLocators[currentGameTypeKeyTypeName][KeyLocatorTypes.LOCATOR_RIGHT_BOTTOM] = pos2;
        return true;
    }

    /**
     * Check that the top-left and bottom-right anchors of the currently selected key are set
     * @returns {boolean} Whether it has been set or not
     */
    this.checkKeyPosition = function () {
        if (currentGameConfig == undefined) {
            return false;
        }
        if (keyLocators[currentGameTypeKeyTypeName] == undefined) {
            return false;
        }
        let keys = keyLocators[currentGameTypeKeyTypeName];
        if (keys[KeyLocatorTypes.LOCATOR_LEFT_TOP][0] == 0 &&
            keys[KeyLocatorTypes.LOCATOR_LEFT_TOP][1] == 0 &&
            keys[KeyLocatorTypes.LOCATOR_RIGHT_BOTTOM][0] == 0 &&
            keys[KeyLocatorTypes.LOCATOR_RIGHT_BOTTOM][1] == 0) {
            return false;
        }
        return true;
    }

    /**
     * Load the layout
     * @param {boolean} [normalize] Whether to use normalized coordinates or not, defaults to false
     */
    this.loadLayout = function (normalize) {
        if (normalize == undefined) {
            normalize = false;
        }
        if (currentGameConfig == null) {
            return false;
        }
        let currentLayout = this.getCurrentKeyLayout();
        if (currentLayout == undefined) {
            return false;
        }
        let noteKeyMap = generateLayout(currentLayout.keyLayout);
        let currentVariant = currentGameConfig.variants.find(function (variant) {
            return variant.variantType == currentVariantType;
        });
        if (currentVariant != undefined) {
            let replaceNoteMap = currentVariant.replaceNoteMap;
            if (replaceNoteMap != undefined) {
                //Replace the pitch in the noteMap with the pitch in the replaceNoteMap
                for (let [originalNote, newNote] of Object.entries(replaceNoteMap)) {
                    if (noteKeyMap.has(originalNote)) {
                        let position = noteKeyMap.get(originalNote);
                        noteKeyMap.delete(originalNote);
                        noteKeyMap[newNote] = position;
                    }
                }
            }
            let noteRange = currentVariant.availableNoteRange;
            if (noteRange != undefined) {
                //Remove the pitch from the noteKeyMap that is out of the noteRange
                for (let [note, position] of noteKeyMap) {
                    if (midiPitch.nameToMidiPitch(note) < midiPitch.nameToMidiPitch(noteRange[0]) || midiPitch.nameToMidiPitch(note) > midiPitch.nameToMidiPitch(noteRange[1])) {
                        noteKeyMap.delete(note);
                    }
                }
            }
        }
        let noteKeyMapList = Object.entries(noteKeyMap);
        console.verbose(`noteKeyMapList: ${JSON.stringify(noteKeyMapList)}`);
        //The pitches are sorted from low to high
        noteKeyMapList.sort(function (a, b) {
            return midiPitch.nameToMidiPitch(a[0]) - midiPitch.nameToMidiPitch(b[0]);
        });

        cachedKeyPos = new Array();
        for (let i = 0; i < noteKeyMapList.length; i++) {
            cachedKeyPos.push(noteKeyMapList[i][1]);
        }

        //Maps to top left - bottom right
        if (!normalize) {
            if (!this.checkKeyPosition()) {
                return;
            }
            let locator = this.getKeyLocators()[currentGameTypeKeyTypeName];
            let leftTop = locator[KeyLocatorTypes.LOCATOR_LEFT_TOP];
            let rightBottom = locator[KeyLocatorTypes.LOCATOR_RIGHT_BOTTOM];
            for (let i = 0; i < cachedKeyPos.length; i++) {
                let [x, y] = cachedKeyPos[i];
                let newX = leftTop[0] + (rightBottom[0] - leftTop[0]) * x;
                let newY = leftTop[1] + (rightBottom[1] - leftTop[1]) * y;
                cachedKeyPos[i] = [newX, newY];
            }
        }
        cachedPitchKeyMap = new Map();
        for (let i = 0; i < noteKeyMapList.length; i++) {
            cachedPitchKeyMap.set(midiPitch.nameToMidiPitch(noteKeyMapList[i][0]), i + 1);
        }
        console.verbose(`cachedKeyPos: ${JSON.stringify(cachedKeyPos)}`);
        console.verbose(`cachedPitchKeyMap: ${JSON.stringify(Object.fromEntries(cachedPitchKeyMap))}`);
    }

    /**
     * Get the key position
     * @param {number} key Key sequence number (from 0, pitch from low to high)
     * @returns {[number, number]} Key position
     */
    this.getKeyPosition = function (key) {
        if (cachedKeyPos == null) {
            this.loadLayout();
        }
        //@ts-ignore
        return cachedKeyPos[key];
    }

    /**
     * Get all key positions
     * @returns {Array<pos2d>} Array of key positions
     */
    this.getAllKeyPositions = function () {
        if (cachedKeyPos == null) {
            this.loadLayout();
        }
        //@ts-ignore
        return cachedKeyPos;
    }

    /**
     * Gets the normalized key position
     * @returns {Array<pos2d>} An array of normalized key positions
     */
    this.getNormalizedKeyPositions = function () {
        this.loadLayout(true);
        //@ts-ignore
        return cachedKeyPos;
    }

    /**
     * Get the corresponding key name based on the MIDI pitch value.
     * @param {number} pitch - MIDI pitch values.
     * @returns {number} The key sequence number corresponding to the MIDI pitch value, starting at 0 and returning -1 if there is no corresponding key.
     */
    this.getKeyByPitch = function (pitch) {
        if (cachedPitchKeyMap == null) {
            this.loadLayout();
        }
        //@ts-ignore
        let res = cachedPitchKeyMap.get(pitch);
        if (res === undefined) {
            return -1;
        }
        return res - 1;
    }

    /**
     * Gets the corresponding MIDI pitch value based on the key sequence number.
     * @param {number} key - The serial number of the key, starting from 0.
     * @returns {number} The MIDI pitch value corresponding to the key sequence number, or -1 if there is no corresponding MIDI pitch value.
     */
    this.getPitchByKey = function (key) {
        if (cachedPitchKeyMap == null) {
            this.loadLayout();
        }
        // Iterate through the map to find the pitch for the given key
        //@ts-ignore
        for (let [pitch, mappedKey] of cachedPitchKeyMap) {
            if (mappedKey - 1 === key) {
                return pitch;
            }
        }
        // If no matching pitch is found, return -1
        return -1;
    }

    /**
     * Get the range of keystrokes.
     * @returns {[number,number]} The key range, the first element is the minimum key sequence number, and the second element is the maximum key sequence number. Start with 1.
     */
    this.getKeyRange = function () {
        if (cachedPitchKeyMap == null) {
            this.loadLayout();
        }
        //@ts-ignore
        let keys = Array.from(cachedPitchKeyMap.values());
        let minKey = 999;
        let maxKey = -1;
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (key < minKey) {
                minKey = key;
            }
            if (key > maxKey) {
                maxKey = key;
            }
        }
        return [minKey, maxKey];
    }

    this.getNoteRange = function () {
        if (cachedNoteRange == null) {
            if (cachedPitchKeyMap == null) {
                this.loadLayout();
            }
            //@ts-ignore
            let pitches = Array.from(cachedPitchKeyMap.keys());
            let minPitch = 999;
            let maxPitch = -1;
            for (let i = 0; i < pitches.length; i++) {
                let pitch = pitches[i];
                if (pitch < minPitch) {
                    minPitch = pitch;
                }
                if (pitch > maxPitch) {
                    maxPitch = pitch;
                }
            }
            cachedNoteRange = [minPitch, maxPitch];
        }
        return cachedNoteRange;
    }

    this.getSameKeyMinInterval = function () {
        if (currentGameConfig == undefined) {
            console.log("currentGameConfig is undefined");
            return undefined;
        }
        let currentVariant = currentGameConfig.variants[currentVariantType];
        if (currentVariant != undefined && currentVariant.sameKeyMinInterval != undefined) {
            return currentVariant.sameKeyMinInterval;
        }
        return currentGameConfig.sameKeyMinInterval;
    }

    /**
     * Gets keys that are physically close to the specified key
     * @param {number} key Specify the key
     * @returns {Array<[key: number, distance: number]>}  The key sequence number and distance that are closest to the specified key
     */
    this.getPhysicalClosestKeys = function (key) {
        if (cachedKeyPos == null) {
            this.loadLayout();
        }
        if (!cachedKeyPos) {
            return [];
        }
        let keyPos = cachedKeyPos[key];
        let closestKeys = [];
        for (let i = 0; i < cachedKeyPos.length; i++) {
            if (i == key) {
                continue;
            }
            let pos = cachedKeyPos[i];
            let distance = Math.sqrt(Math.pow(pos[0] - keyPos[0], 2) + Math.pow(pos[1] - keyPos[1], 2));
            closestKeys.push([i, distance]);
        }
        closestKeys.sort(function (a, b) {
            return a[1] - b[1];
        });
        return closestKeys;
    }

    /**
     * Gets the minimum distance of the physical key
     * @returns {number} Physical minimum distance (pixels) of keys
     */
    this.getPhysicalMinKeyDistance = function () {
        if (cachedKeyPos == null) {
            this.loadLayout();
        }
        if (!cachedKeyPos) {
            return 999999;
        }
        let minDistance = 999999;
        for (let i = 0; i < cachedKeyPos.length; i++) {
            for (let j = i + 1; j < cachedKeyPos.length; j++) {
                let distance = Math.sqrt(Math.pow(cachedKeyPos[i][0] - cachedKeyPos[j][0], 2) + Math.pow(cachedKeyPos[i][1] - cachedKeyPos[j][1], 2));
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
        }
        return minDistance;
    }

    /**
     * Clear the cache for the current configuration
     */
    this.clearCurrentConfigCache = function () {
        cachedKeyPos = null;
        cachedPitchKeyMap = null;
        cachedNoteRange = null;
    }

    /**
     * Get hints about the current game and the tune
     * @param {string} key Key signature
     * @returns {string} Prompt information
     * @see MidiPitch.getTranspositionEstimatedKey
     */
    this.getGameSpecificHintByEstimatedKey = function (key) {
        if (currentGameConfig == undefined) {
            return "";
        }
        if (currentGameConfig.gameType === "Light encounter") {
            return `Light Encounter: Suggest a playing position: ${skyTuneMapPosition[key]}`;
        }
        if (currentGameConfig.gameType === "Reverse the cold mobile game") {
            return `Against the Cold: It is recommended to choose a mode: ${key}`;
        }
        return "";
    }
}



module.exports = GameProfile;
