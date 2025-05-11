const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
let { MergeTracksPass } = require("../../src/passes");


describe('MergeTracksPass', () => {
    test('merges tracks', () => {
        const tracksData = {
            "haveMultipleTrack": true,
            "durationType": "native",
            "trackCount": 2,
            "tracks": [
                {
                    "name": "",
                    "channel": 0,
                    "trackIndex": 0,
                    "instrumentId": -1,
                    "noteCount": 2,
                    "notes": [
                        [
                            48,
                            0,
                            {
                                "duration": 500
                            }
                        ],
                        [
                            50,
                            100,
                            {
                                "duration": 500
                            }
                        ],
                    ]
                },
                {
                    "name": "",
                    "channel": 1,
                    "trackIndex": 1,
                    "instrumentId": -1,
                    "noteCount": 1,
                    "notes": [
                        [
                            60,
                            50,
                            {
                                "duration": 500
                            }
                        ]
                    ]
                }
            ]
        }
        const expected = [
            [48, 0, { "duration": 500 }],
            [60, 50, { "duration": 500 }],
            [50, 100, { "duration": 500 }]];
        //@ts-ignore
        const actual = new MergeTracksPass({}).run(tracksData);
        assert.deepEqual(actual, expected);
    });

    test('skip percussion channel', () => {
        const tracksData = {
            "haveMultipleTrack": true,
            "durationType": "native",
            "trackCount": 3,
            "tracks": [
                {
                    "name": "",
                    "channel": 9,
                    "trackIndex": 0,
                    "instrumentId": -1,
                    "noteCount": 2,
                    "notes": [
                        [
                            48,
                            0,
                            {
                                "duration": 500
                            }
                        ],
                        [
                            50,
                            100,
                            {
                                "duration": 500
                            }
                        ],
                    ]
                },
                {
                    "name": "",
                    "channel": 1,
                    "trackIndex": 1,
                    "instrumentId": -1,
                    "noteCount": 0,
                    "notes": []
                },
                {
                    "name": "",
                    "channel": 1,
                    "trackIndex": 2,
                    "instrumentId": -1,
                    "noteCount": 1,
                    "notes": [
                        [
                            60,
                            50,
                            {
                                "duration": 500
                            }
                        ]
                    ]
                }
            ]
        }
        const expected = [[60, 50, { "duration": 500 }]];
        const actual = new MergeTracksPass({
            skipPercussion: true
        //@ts-ignore
        }).run(tracksData);
        assert.deepEqual(actual, expected);
    });
});