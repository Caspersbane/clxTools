//@ts-check
//players.js -- Implement play/play functions

var { SimpleInstructPlayerImpl, SkyCotlLikeInstructPlayerImpl } = require("./instruct.js");

function NormalDistributionRandomizer(mean, stddev) {
    this.mean = mean;
    this.stddev = stddev;

    this.next = function () {
        var u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        var num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num * this.stddev + this.mean;
        return num;
    }
}

/**
 * @enum {string}
 * @readonly
 */
var PlayerType = {
    None: "None",
    AutoJsGesturePlayer: "AutoJsGesturePlayer",
    SimpleInstructPlayer: "SimpleInstructPlayer",
    SkyCotlLikeInstructPlayer: "SkyCotlLikeInstructPlayer"
}

/**
 * @constructor
 */
function AutoJsGesturePlayerImpl() {
    /**
    * @brief Perform a set of actions
    * @param {Gestures} _gestures gesture
    */
    this.exec = function (_gestures) {
        gestures.apply(null, _gestures);
    }

    this.getType = function () {
        return PlayerType.AutoJsGesturePlayer;
    }

    this.doTransform = true;
}

/**
 * @enum {number}
 */
const PlayerStates = {
    PLAYING: 0,
    PAUSED: 1,
    SEEKING: 2,
    SEEK_END: 3,
    UNINITIALIZED: 4,
    FINISHED: 5,
}

/**
 * @typedef {[delay: number,duration: number, points: ...import("./gameProfile").pos2d[]]} Gesture
 * @typedef {Array<Gesture>} Gestures
 * @typedef {object} PlayerImpl
 * @property {boolean} doTransform Whether you want to use the transformGesture function to handle gestures
 * @property {(function(Gestures):void)|(function(import('./noteUtils').PackedKey):void)} exec Perform a set of actions
 * @property {function(): PlayerType} getType Get the player type
 * @property {function(object):void} [setGestureTimeList] Set gesture and time data
 * @property {function(number):void} [seekTo] Set the playback position
 * @property {function():void} [next] Play the next note
 * @property {function(PlayerStates):void} [setState] Set the playback status
 */

/**
 * Player. There may be different implementations
 * @param {PlayerImpl} playerImpl 
 */
function Player(playerImpl) {

    this.PlayerStates = PlayerStates;

    /**
     * @type {PlayerStates}
     * @description Player state
     * @private
     */
    let playerState = PlayerStates.UNINITIALIZED;

    /**
     * @type {Array<[Gestures, number]>|Array<import('./noteUtils').PackedKey>?}
     * @description Gesture and time data
     */
    let gestureTimeList = null;

    /**
     * @type {function(number):void}
     * @description Callback function for each note played
     */
    let onPlayNote = function (/** @type {number} */ position) { };

    /**
 * @type {function(number):void}
 * @description State switch callback function
 */
    let onStateChange = function (/** @type {number} */ newState) { };

    /**
     * @type Thread
     * @description Play the thread
     * @private
     */
    let playerThread = null;

    /**
     * @type number
     * @description Playback Position (Note Serial Number)
     * @private
     */
    let position = 0;

    /**
     * @type number
     * @description Playback speed (multiplier, <1 deceleration, >1 acceleration)
     * @private
     * @default 1
     */
    let playSpeed = 1;

    /**
     * @type number
     * @description Mean deviation of click position (pixels)
     * @private
     * @default 0
     */
    let clickPositionDeviationPx = 0;

    /**
     * @type {NormalDistributionRandomizer|null}
     */
    let clickPositionDeviationRandomizer = null;

    let implSync = function () {
        if (playerImpl.setState != null) playerImpl.setState(playerState);
        if (playerImpl.seekTo != null) playerImpl.seekTo(position);
    }

    this.getType = function () {
        return playerImpl.getType();
    }

    this.getImplementationInstance = function () {
        return playerImpl;
    }

    /**
     * @brief Set gesture and time data
     * @param {Array<[Gestures, number]>|Array<import('./noteUtils').PackedKey>} gestureTimeList_ 手势和时间数据
     */
    this.setGestureTimeList = function (gestureTimeList_) {
        gestureTimeList = gestureTimeList_;
        if (playerImpl.setGestureTimeList != null) {
            playerImpl.setGestureTimeList(gestureTimeList_);
        }
    }

    /**
     * @brief Set the average deviation of the click position in pixels
     * @param {number} clickPositionDeviationPx_ Mean deviation of click position (pixels)
     */
    this.setClickPositionDeviationPx = function (clickPositionDeviationPx_) {
        clickPositionDeviationPx = clickPositionDeviationPx_;
        clickPositionDeviationRandomizer = new NormalDistributionRandomizer(0, clickPositionDeviationPx);
    }

    /**
     * @brief Start playback
     * 
     */
    this.start = function () {
        playerState = PlayerStates.UNINITIALIZED;
        position = 0;
        implSync();
        let func = playerThreadFunc.bind(this);
        playerThread = threads.start(func);
    }

    /**
     * @brief Pause playback
     */
    this.pause = function () {
        playerState = PlayerStates.PAUSED;
        implSync();
    }

    /**
     * @brief Continue playing
     */
    this.resume = function () {
        playerState = PlayerStates.SEEK_END;
        implSync();
    }

    /**
     * @brief Set the playback position
     * @param {number} position_ Playback Position (Note Serial Number)
     * @note TODO: Thread-safe?
     */
    this.seekTo = function (position_) {
        if (playerState == PlayerStates.PLAYING || playerState == PlayerStates.SEEK_END)
            playerState = PlayerStates.SEEKING;
        position = position_;
        implSync();
    }

    /**
     * @brief Get the playback location
     * @returns {number} Playback Position (Note Serial Number)
     */
    this.getCurrentPosition = function () {
        return position;
    }

    /**
     * @brief Get playback status
     * @returns {number} Playback status
     */
    this.getState = function () {
        return playerState;
    }

    /**
     * @brief Get the playback speed
     * @returns {number} Playback speed (multiplier, <1 deceleration, >1 acceleration)
     */
    this.getPlaySpeed = function () {
        return playSpeed;
    }

    /**
     * @brief Set the playback speed
     * @param {number} playSpeed_ Playback speed (multiplier, <1 deceleration, >1 acceleration)
     */
    this.setPlaySpeed = function (playSpeed_) {
        playSpeed = playSpeed_;
    }
    /**
     * @brief Set the callback function
     * @param {function(number):void} onPlayNote_ Callback function for each note played
     */
    this.setOnPlayNote = function (onPlayNote_) {
        onPlayNote = onPlayNote_;
    }

    /**
     * @brief State switch callback function
     * @param {function(number):void} onStateChange_ The callback function for each state switch
     */
    this.setOnStateChange = function (onStateChange_) {
        onStateChange = onStateChange_;
    }

    /**
     * @brief Stop playback and release resources
     * @returns {boolean} Whether the stop was successful
     */
    this.stop = function () {
        if (playerThread != null) {
            playerThread.interrupt();
            playerThread.join();
            playerThread = null;
            playerState = PlayerStates.FINISHED;
            onStateChange(playerState);
            position = 0;
            implSync();
            return true;
        }
        return false;
    }

    /**
     * @brief Perform a set of actions
     * @param {Gestures} _gestures gesture
     */
    this.exec = function (_gestures) {
        if (playerImpl.doTransform)
            playerImpl.exec(transformGesture(_gestures));
        else
            playerImpl.exec(_gestures);
    }

    /**
     * @brief Work on this set of gestures
     * @param {Gestures} gestures gesture
     * @returns {Gestures} Post-processing gestures
     */
    function transformGesture(gestures) {
        //Random offset
        if (clickPositionDeviationPx > 0) {
            gestures.forEach(gesture => {
                let deviation, angle;
                do {
                    deviation = clickPositionDeviationRandomizer.next();
                } while (Math.abs(deviation) > 2 * clickPositionDeviationPx);
                angle = Math.random() * 2 * Math.PI;
                gesture[2][0] += deviation * Math.cos(angle);
                gesture[2][1] += deviation * Math.sin(angle);
            });
        }
        return gestures;
    }

    /**
     * @brief Play thread functions
     * @private
     */
    function playerThreadFunc() {
        if (gestureTimeList == null) {
            console.error("gestureTimeList is null");
            return;
        }
        let oldState = playerState;
        let startTimeAbs = new Date().getTime() + 100;
        console.info("PlayerThread started");
        while (1) {
            if (oldState != playerState) {
                console.info("PlayerState: %s -> %s", oldState, playerState);
                oldState = playerState;
                onStateChange(playerState);
            }
            implSync();
            switch (playerState) {
                case PlayerStates.FINISHED:
                case PlayerStates.UNINITIALIZED:
                case PlayerStates.PAUSED: //(->SEEK_END)
                    sleep(500); //Wait for the state to change in a loop 
                    break;
                case PlayerStates.SEEKING: //(->SEEK_END)
                    playerState = PlayerStates.SEEK_END;
                    sleep(500); //Within 500ms, the status may change back to SEEKING. Keep the cycle
                    break;
                case PlayerStates.SEEK_END: { //(->PLAYING)
                    playerState = PlayerStates.PLAYING;
                    if (position == 0) {
                        startTimeAbs = new Date().getTime() + 100; //The first play, starting before 100ms
                        break;
                    }
                    //Set the playback start time
                    let currentNoteTimeAbs = gestureTimeList[position][1] * (1 / playSpeed);
                    startTimeAbs = new Date().getTime() - currentNoteTimeAbs;
                    onPlayNote(position);
                    break;
                }
                case PlayerStates.PLAYING: { //(->PAUSED/FINISHED/SEEKING)
                    if (position >= gestureTimeList.length) {
                        playerState = PlayerStates.FINISHED;
                        break;
                    }
                    let currentNote = gestureTimeList[position][0];
                    let currentNoteTimeAbs = gestureTimeList[position][1] * (1 / playSpeed);
                    let elapsedTimeAbs = new Date().getTime() - startTimeAbs;
                    let delayTime = currentNoteTimeAbs - elapsedTimeAbs - 7; //7ms is the gesture execution time
                    if (delayTime > 0) {
                        while (delayTime > 0) {
                            sleep(Math.min(delayTime, 467));
                            delayTime -= 467;
                            if (playerState != PlayerStates.PLAYING) {
                                break;
                            }
                        }
                    } else {
                        //Just skip it
                        position++;
                        break;
                    }
                    this.exec(currentNote);
                    position++;
                    onPlayNote(position);
                    break;
                }
                default:
                    break;
            }
        }
    }
}

/**
 * @typedef {Player} PlayerBase
 */


module.exports = {
    "PlayerType": PlayerType,
    "AutoJsGesturePlayer": Player.bind(null, new AutoJsGesturePlayerImpl()),
    "SimpleInstructPlayer": Player.bind(null, new SimpleInstructPlayerImpl()),
    "SkyCotlLikeInstructPlayer": Player.bind(null, new SkyCotlLikeInstructPlayerImpl()),
}
