var GameProfile = require("../gameProfile.js");
var midiPitch = require("../midiPitch.js");


/**
 * @brief Convert a value to another interval from 0 to 1000 and use it for the progress bar
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function numberMap(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    if (value < min) value = min;
    if (value > max) value = max;
    return (value - min) / (max - min) * (newMax - newMin) + newMin;
}

/**
 * @brief A logarithmic version of numberMap
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMap
 */
function numberMapLog(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    if (value < min) value = min;
    if (value > max) value = max;
    return Math.log(value - min + 1) / Math.log(max - min + 1) * (newMax - newMin) + newMin;
}

/**
 * @brief numberMap
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMap
 */
function numberRevMap(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    return (value - newMin) / (newMax - newMin) * (max - min) + min;
}

/**
 * @brief numberMapLog
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMapLog
 */
function numberRevMapLog(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    return min + (Math.exp((value - newMin) / (newMax - newMin) * Math.log(max - min + 1)) - 1);
}

/**
 * @brief Floating-point comparison
 */
function floatEqual(a, b) {
    return Math.abs(a - b) < 0.000001;
}

/**
 * @enum {string}
 * @readonly
 */
var ConfigurationFlags = {
    //The level of detail of the setting
    LEVEL_SIMPLE: "LEVEL_SIMPLE",
    LEVEL_ADVANCED: "LEVEL_ADVANCED",
    LEVEL_EXPERT: "LEVEL_EXPERT",
    //Whether the song has duration information
    MUSIC_HAS_DURATION_INFO: "MUSIC_HAS_DURATION_INFO",
    //Whether the song has an audio track
    MUSIC_HAS_TRACKS: "MUSIC_HAS_TRACKS",
    //Working mode
    WORKMODE_GESTURE_PLAYER: "WORKMODE_GESTURE_PLAYER",
    WORKMODE_INSTRUCT: "WORKMODE_INSTRUCT",
    WORKMODE_MIDI_INPUT_STREAMING: "WORKMODE_MIDI_INPUT_STREAMING",
    //Whether the game supports duration information
    GAME_HAS_DURATION_INFO: "GAME_HAS_DURATION_INFO",
    //The game has all the semitones
    GAME_HAS_ALL_SEMITONES: "GAME_HAS_ALL_SEMITONES",
}

/**
 * @enum {string}
 */
const ConfigurationCallbacks = {
    //Refresh the settings screen
    refreshConfigurationUi: "refreshConfigurationUi",
    //Run automatic optimizations
    runAutoTune: "runAutoTune",
    //Select the audio track
    selectTracks: "selectTracks",
}


/**
 *
 * @param {string} rawFileName
 * @param {GameProfile} gameProfile
 * @param {Array<ConfigurationFlags>} flags
 * @param {function(ConfigurationCallbacks, Object):void} callback
 */
function ConfigurationUi(rawFileName, gameProfile, flags, callback) {
    const View = android.view.View;
    let evt = events.emitter(threads.currentThread());

    let configuration = require("../configuration.js");

    /**
     * @type {Array<ConfigurationFlags>}
     */
    this.flags = flags;

    /**
     * @typedef {Object} ConfigurationUiFragment
     * @property {string} name - name
     * @property {View} view - interface
     */

    /**
     * @type {Array<ConfigurationUiFragment>}
     * @brief Sets up the various sub-screens of the interface
     */
    this.fragments = [];

    let anythingChanged = false;



    evt.on("callback", function (callbackName, data) {
        callback(callbackName, data);
    });

    /**
     * 
     * @param {ConfigurationCallbacks} callbackName 
     * @param {Object} data 
     */
    function runCallback(callbackName, data) {
        //You cannot call callback directly on the UI thread, otherwise it will cause the UI thread to block
        //Use the event mechanism
        evt.emit("callback", callbackName, data);
    }

    let triggerUiRefresh = function () {
        runCallback(ConfigurationCallbacks.refreshConfigurationUi, {});
    }

    //The constructor begins

    //Configuration of file playback mode
    if (this.flags.includes(ConfigurationFlags.WORKMODE_GESTURE_PLAYER) ||
        this.flags.includes(ConfigurationFlags.WORKMODE_INSTRUCT)) {

        //Set the level
        let view_configurationLevel = ui.inflate(
            <vertical>
                <text text="Set the level:" textColor="red" />
                <radiogroup id="levelSelection" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                    <radio id="levelSelection_simple" text="简单" textSize="12sp" margin="0dp" />
                    <radio id="levelSelection_advanced" text="高级" textSize="12sp" margin="0dp" />
                    <radio id="levelSelection_expert" text="专家" textSize="12sp" margin="0dp" visibility="gone" />{/* TODO: */}
                </radiogroup>
            </vertical>
        );
        let configurationLevel = configuration.readGlobalConfig("configurationLevel", ConfigurationFlags.LEVEL_ADVANCED);
        this.flags.push(configurationLevel);
        switch (configurationLevel) {
            case ConfigurationFlags.LEVEL_SIMPLE:
                view_configurationLevel.levelSelection_simple.setChecked(true);
                break;
            case ConfigurationFlags.LEVEL_ADVANCED:
                view_configurationLevel.levelSelection_advanced.setChecked(true);
                break;
            case ConfigurationFlags.LEVEL_EXPERT:
                view_configurationLevel.levelSelection_expert.setChecked(true);
                break;
        }
        view_configurationLevel.levelSelection.setOnCheckedChangeListener(function (group, checkedId) {
            anythingChanged = true;
            let configurationLevel = "";
            switch (checkedId) {
                case view_configurationLevel.levelSelection_simple.getId():
                    configurationLevel = ConfigurationFlags.LEVEL_SIMPLE;
                    break;
                case view_configurationLevel.levelSelection_advanced.getId():
                    configurationLevel = ConfigurationFlags.LEVEL_ADVANCED;
                    break;
                case view_configurationLevel.levelSelection_expert.getId():
                    configurationLevel = ConfigurationFlags.LEVEL_EXPERT;
                    break;
            }
            configuration.setGlobalConfig("configurationLevel", configurationLevel);
            triggerUiRefresh();
        });

        this.fragments.push({
            name: "configurationLevel",
            view: view_configurationLevel
        });

        //Mode of operation
        let view_runMode = ui.inflate(
            <vertical>
                <text text="运行模式:" />
                <radiogroup id="playerSelection" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                    <radio id="playerSelection_AutoJsGesturePlayer" text="Auto-playing" textSize="12sp" margin="0dp" />
                    <radio id="playerSelection_SimpleInstructPlayer" text="Follow Mode (Easy)" textSize="12sp" margin="0dp" />
                    <radio id="playerSelection_SkyCotlLikeInstructPlayer" text="Follow Mode (Similar to Light Encounter)" textSize="12sp" margin="0dp" />
                </radiogroup>
            </vertical>
        )

        let playerSelection = configuration.readGlobalConfig("playerSelection", ["AutoJsGesturePlayer"]);
        if (playerSelection.includes("AutoJsGesturePlayer")) {
            view_runMode.playerSelection_AutoJsGesturePlayer.setChecked(true);
            this.flags.push(ConfigurationFlags.WORKMODE_GESTURE_PLAYER);
        }
        if (playerSelection.includes("SimpleInstructPlayer")) {
            view_runMode.playerSelection_SimpleInstructPlayer.setChecked(true);
            this.flags.push(ConfigurationFlags.WORKMODE_INSTRUCT);
        }

        if (playerSelection.includes("SkyCotlLikeInstructPlayer")) {
            view_runMode.playerSelection_SkyCotlLikeInstructPlayer.setChecked(true);
            this.flags.push(ConfigurationFlags.WORKMODE_INSTRUCT);
        }

        view_runMode.playerSelection.setOnCheckedChangeListener(function (group, checkedId) {
            anythingChanged = true;
            let playerSelection = [];
            if (checkedId == view_runMode.playerSelection_AutoJsGesturePlayer.getId()) {
                playerSelection.push("AutoJsGesturePlayer");
            }
            if (checkedId == view_runMode.playerSelection_SimpleInstructPlayer.getId()) {
                playerSelection.push("SimpleInstructPlayer");
            }
            if (checkedId == view_runMode.playerSelection_SkyCotlLikeInstructPlayer.getId()) {
                playerSelection.push("SkyCotlLikeInstructPlayer");
            }
            configuration.setGlobalConfig("playerSelection", playerSelection);
        });

        this.fragments.push({
            name: "runMode",
            view: view_runMode
        });

        //Follow mode configuration
        if (this.flags.includes(ConfigurationFlags.WORKMODE_INSTRUCT)) {
            if (this.flags.includes(ConfigurationFlags.LEVEL_ADVANCED) ||
                this.flags.includes(ConfigurationFlags.LEVEL_EXPERT)) {
                let view_instructMode = ui.inflate(
                    <vertical>
                        <text text="Follow mode configuration:" textColor="red" />
                        <horizontal w="*">
                            {/* 30~300%, logarithmic, default 100%*/}
                            <text text="Pattern size: " />
                            <text text="default%" id="SimpleInstructPlayer_MarkSizeValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="SimpleInstructPlayer_MarkSizeSeekbar" w="*" max="1000" layout_gravity="center" />
                        <vertical id="SkyCotlLikeInstructPlayerSettingContainer" visibility="gone">
                            <horizontal>
                                <text text="Draw a guide line for each note: " />
                                <checkbox id="SkyCotlLikeInstructPlayer_DrawLineToEachNextKeysCheckbox" />
                            </horizontal>
                            <horizontal>
                                <text text="Draw a guide line for the next note: " />
                                <checkbox id="SkyCotlLikeInstructPlayer_DrawLineToNextNextKeyCheckbox" />
                            </horizontal>
                            <horizontal>
                                <text text="Draw the guide circle on the outside of the button: " />
                                <checkbox id="SkyCotlLikeInstructPlayer_DrawRingOutsideCheckbox" />
                            </horizontal>
                        </vertical>
                        <horizontal height="wrap_content">
                            <text text="Vibration effects: " />
                            <spinner id="instructVibrationEffectSelector" w="*" entries="关|弱|中|强" />
                        </horizontal>
                        {/*TODO: Eyepicker (Android doesn't have this component?)*/}
                    </vertical>
                );
                let selectedPlayerTypes = configuration.readGlobalConfig("playerSelection", ["AutoJsGesturePlayer"]);
                if (selectedPlayerTypes.includes("SkyCotlLikeInstructPlayer")) {
                    view_instructMode.SkyCotlLikeInstructPlayerSettingContainer.setVisibility(View.VISIBLE);
                    let SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys = configuration.readGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys", false);
                    view_instructMode.SkyCotlLikeInstructPlayer_DrawLineToEachNextKeysCheckbox.setChecked(SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys);
                    let SkyCotlLikeInstructPlayer_DrawLineToNextNextKey = configuration.readGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToNextNextKey", true);
                    view_instructMode.SkyCotlLikeInstructPlayer_DrawLineToNextNextKeyCheckbox.setChecked(SkyCotlLikeInstructPlayer_DrawLineToNextNextKey);
                    let SkyCotlLikeInstructPlayer_DrawRingOutside = configuration.readGlobalConfig("SkyCotlLikeInstructPlayer_DrawRingOutside", false);
                    view_instructMode.SkyCotlLikeInstructPlayer_DrawRingOutsideCheckbox.setChecked(SkyCotlLikeInstructPlayer_DrawRingOutside);
                }

                let SimpleInstructPlayer_MarkSize = configuration.readGlobalConfig("SimpleInstructPlayer_MarkSize", 1);
                view_instructMode.SimpleInstructPlayer_MarkSizeValueText.setText((SimpleInstructPlayer_MarkSize * 100).toFixed(2) + "%");
                view_instructMode.SimpleInstructPlayer_MarkSizeSeekbar.setProgress(numberMapLog(SimpleInstructPlayer_MarkSize, 0.3, 3));

                view_instructMode.SimpleInstructPlayer_MarkSizeSeekbar.setOnSeekBarChangeListener({
                    onProgressChanged: function (seekbar, progress, fromUser) {
                        if (progress == undefined) return;
                        let value = numberRevMapLog(progress, 0.3, 3);
                        view_instructMode.SimpleInstructPlayer_MarkSizeValueText.setText((value * 100).toFixed(2) + "%");
                        return true;
                    },
                    onStartTrackingTouch: function (seekbar) { },
                    onStopTrackingTouch: function (seekbar) {
                        anythingChanged = true;
                        let value = numberRevMapLog(seekbar.getProgress(), 0.3, 3);
                        configuration.setGlobalConfig("SimpleInstructPlayer_MarkSize", value);
                    }
                });

                view_instructMode.SkyCotlLikeInstructPlayer_DrawLineToEachNextKeysCheckbox.setOnCheckedChangeListener(function (button, checked) {
                    anythingChanged = true;
                    configuration.setGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys", checked);
                });

                view_instructMode.SkyCotlLikeInstructPlayer_DrawLineToNextNextKeyCheckbox.setOnCheckedChangeListener(function (button, checked) {
                    anythingChanged = true;
                    configuration.setGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToNextNextKey", checked);
                });

                view_instructMode.SkyCotlLikeInstructPlayer_DrawRingOutsideCheckbox.setOnCheckedChangeListener(function (button, checked) {
                    anythingChanged = true;
                    configuration.setGlobalConfig("SkyCotlLikeInstructPlayer_DrawRingOutside", checked);
                });

                let instructVibrationEffect = configuration.readGlobalConfig("instructVibrationEffect", 1);
                view_instructMode.instructVibrationEffectSelector.setSelection(instructVibrationEffect);

                view_instructMode.instructVibrationEffectSelector.setOnItemSelectedListener({
                    onItemSelected: function (parent, view, position, id) {
                        anythingChanged = true;
                        configuration.setGlobalConfig("instructVibrationEffect", position);
                    }
                });

                this.fragments.push({
                    name: "instructMode",
                    view: view_instructMode
                });
            } else if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
                let view_instructMode = ui.inflate(
                    <vertical>
                        <text text="Follow mode configuration:" textColor="red" />
                        <horizontal w="*">
                            {/* 30~300%, logarithmic, default 100%*/}
                            <text text="Pattern size: " />
                            <radiogroup id="SimpleInstructPlayer_MarkSizeSelector" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="SimpleInstructPlayer_MarkSizeSelector_65" text="小" textSize="12sp" margin="0dp" />
                                <radio id="SimpleInstructPlayer_MarkSizeSelector_100" text="中" textSize="12sp" margin="0dp" checked="true" />
                                <radio id="SimpleInstructPlayer_MarkSizeSelector_150" text="大" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                    </vertical>
                );
                let SimpleInstructPlayer_MarkSize = configuration.readGlobalConfig("SimpleInstructPlayer_MarkSize", 1);
                if (floatEqual(SimpleInstructPlayer_MarkSize, 0.65)) {
                    view_instructMode.SimpleInstructPlayer_MarkSizeSelector_65.setChecked(true);
                } else if (floatEqual(SimpleInstructPlayer_MarkSize, 1)) {
                    view_instructMode.SimpleInstructPlayer_MarkSizeSelector_100.setChecked(true);
                } else if (floatEqual(SimpleInstructPlayer_MarkSize, 1.5)) {
                    view_instructMode.SimpleInstructPlayer_MarkSizeSelector_150.setChecked(true);
                }

                view_instructMode.SimpleInstructPlayer_MarkSizeSelector.setOnCheckedChangeListener(function (group, checkedId) {
                    anythingChanged = true;
                    let SimpleInstructPlayer_MarkSize = 1;
                    switch (checkedId) {
                        case view_instructMode.SimpleInstructPlayer_MarkSizeSelector_65.getId():
                            SimpleInstructPlayer_MarkSize = 0.65;
                            break;
                        case view_instructMode.SimpleInstructPlayer_MarkSizeSelector_100.getId():
                            SimpleInstructPlayer_MarkSize = 1;
                            break;
                        case view_instructMode.SimpleInstructPlayer_MarkSizeSelector_150.getId():
                            SimpleInstructPlayer_MarkSize = 1.5;
                            break;
                    }
                    configuration.setGlobalConfig("SimpleInstructPlayer_MarkSize", SimpleInstructPlayer_MarkSize);
                });

                this.fragments.push({
                    name: "instructMode",
                    view: view_instructMode
                });
            }
        }

        //Score visualization
        let view_visualization = ui.inflate(
            <vertical>
                <text text="Score visualization:" />
                <horizontal>
                    <text text="Use the score visualization:" />
                    <checkbox id="visualizationEnabledCheckbox" />
                </horizontal>
            </vertical>
        );

        let visualizationEnabled = configuration.readGlobalConfig("visualizationEnabled", true);
        view_visualization.visualizationEnabledCheckbox.setChecked(visualizationEnabled);
        view_visualization.visualizationEnabledCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            configuration.setGlobalConfig("visualizationEnabled", checked);
        });
        this.fragments.push({
            name: "visualization",
            view: view_visualization
        });

        //Speed settings
        if (this.flags.includes(ConfigurationFlags.LEVEL_ADVANCED) ||
            this.flags.includes(ConfigurationFlags.LEVEL_EXPERT)) {
            let view_speed = ui.inflate(
                <vertical>
                    <text text="Speed control:" textColor="red" />
                    <horizontal>
                        {/* 5~1500%, logarithmic, default 1-> is not used */}
                        <text text="变速:" />
                        <checkbox id="speedMultiplier" />
                        <text text="default%" id="speedMultiplierValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="speedMultiplierSeekbar" w="*" max="1000" layout_gravity="center" />
                    <horizontal w="*">
                        {/* 1~20hz, logarithmic, default 0-> is not used*/}
                        <text text="Limit click speed (apply after changing speeds):" />
                        <checkbox id="limitClickSpeedCheckbox" />
                        <text text="default次/秒" id="limitClickSpeedValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="limitClickSpeedSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>);
            let limitClickSpeedHz = configuration.readFileConfig("limitClickSpeedHz", rawFileName, 0);
            let speedMultiplier = configuration.readFileConfig("speedMultiplier", rawFileName, 1);
            view_speed.limitClickSpeedCheckbox.setChecked(limitClickSpeedHz != 0);
            view_speed.limitClickSpeedValueText.setText(limitClickSpeedHz.toFixed(2) + "times/second");
            view_speed.limitClickSpeedSeekbar.setProgress(numberMapLog(limitClickSpeedHz, 1, 20));
            view_speed.speedMultiplier.setChecked(speedMultiplier != 1);
            view_speed.speedMultiplierValueText.setText((speedMultiplier * 100).toFixed(2) + "%");
            view_speed.speedMultiplierSeekbar.setProgress(numberMapLog(speedMultiplier, 0.05, 15));
            view_speed.limitClickSpeedCheckbox.setOnCheckedChangeListener(function (button, checked) {
                anythingChanged = true;
                if (checked) {
                    let limitClickSpeedHz = numberRevMapLog(view_speed.limitClickSpeedSeekbar.getProgress(), 1, 20);
                    configuration.setFileConfig("limitClickSpeedHz", limitClickSpeedHz, rawFileName);
                } else {
                    configuration.setFileConfig("limitClickSpeedHz", 0, rawFileName);
                }
            });
            view_speed.speedMultiplier.setOnCheckedChangeListener(function (button, checked) {
                anythingChanged = true;
                if (checked) {
                    let speedMultiplier = numberRevMapLog(view_speed.speedMultiplierSeekbar.getProgress(), 0.05, 15);
                    configuration.setFileConfig("speedMultiplier", speedMultiplier, rawFileName);
                } else {
                    configuration.setFileConfig("speedMultiplier", 1, rawFileName);
                }
            });
            view_speed.limitClickSpeedSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMapLog(progress, 1, 20);
                    view_speed.limitClickSpeedValueText.setText(value.toFixed(2) + "times/second");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    if (!view_speed.limitClickSpeedCheckbox.isChecked()) return;
                    anythingChanged = true;
                    let value = numberRevMapLog(seekbar.getProgress(), 1, 20);
                    configuration.setFileConfig("limitClickSpeedHz", value, rawFileName);
                }
            });
            view_speed.speedMultiplierSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMapLog(progress, 0.05, 15);
                    view_speed.speedMultiplierValueText.setText((value * 100).toFixed(2) + "%");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    if (!view_speed.speedMultiplier.isChecked()) return;
                    anythingChanged = true;
                    let value = numberRevMapLog(seekbar.getProgress(), 0.05, 15);
                    configuration.setFileConfig("speedMultiplier", value, rawFileName);
                }
            });
            this.fragments.push({
                name: "speed",
                view: view_speed
            });
        } else if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
            let view_speed = ui.inflate(
                <vertical>
                    {/* There's not even a ConstraintLayout here, ahhhhh */}
                    <text text="变速:" />
                    <horizontal>
                        {/* Recovery, -0.25, -0.1, <当前速度>, +0.1, +0.25 */}
                        <button id="speedMultiplierReset" text="恢复" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                        <button id="speedMultiplierMinus025" text="-0.25" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                        <button id="speedMultiplierMinus01" text="-0.1" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                        {/* Bold font */}
                        <text id="speedMultiplierValueText" textStyle="bold" textSize="20sp" gravity="center_vertical" layout_gravity="center_vertical" layout_weight="2" />
                        <button id="speedMultiplierPlus01" text="+0.1" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                        <button id="speedMultiplierPlus025" text="+0.25" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                    </horizontal>
                </vertical>);
            let speedMultiplier = configuration.readFileConfig("speedMultiplier", rawFileName, 1);
            view_speed.speedMultiplierValueText.setText((speedMultiplier).toFixed(2) + "x");
            let alterSpeedMultiplier = function (delta) {
                let speedMultiplier = configuration.readFileConfig("speedMultiplier", rawFileName, 1);
                speedMultiplier += delta;
                if (speedMultiplier < 0.05) speedMultiplier = 0.05;
                if (speedMultiplier > 15) speedMultiplier = 15;
                anythingChanged = true;
                configuration.setFileConfig("speedMultiplier", speedMultiplier, rawFileName);
                view_speed.speedMultiplierValueText.setText((speedMultiplier).toFixed(2) + "x");
            }
            view_speed.speedMultiplierReset.click(function () {
                anythingChanged = true;
                configuration.setFileConfig("speedMultiplier", 1, rawFileName);
                view_speed.speedMultiplierValueText.setText("1.00x");
            });
            view_speed.speedMultiplierMinus025.click(function () {
                alterSpeedMultiplier(-0.25);
            });
            view_speed.speedMultiplierMinus01.click(function () {
                alterSpeedMultiplier(-0.1);
            });
            view_speed.speedMultiplierPlus01.click(function () {
                alterSpeedMultiplier(0.1);
            });
            view_speed.speedMultiplierPlus025.click(function () {
                alterSpeedMultiplier(0.25);
            });
            this.fragments.push({
                name: "speed",
                view: view_speed
            });
        }

        //Duration control
        let view_duration = ui.inflate(
            <vertical>
                <text text="Duration optimization:" textColor="red" />
                {/* Note duration output mode */}
                <vertical id="noteDurationOutputModeContainer">
                    <horizontal>
                        <text text="Duration output mode:" />
                        <radiogroup id="noteDurationOutputMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                            <radio id="noteDurationOutputMode_none" text="Fixed value" textSize="12sp" margin="0dp" />
                            <radio id="noteDurationOutputMode_native" text="Real-world duration (experimental)" textSize="12sp" margin="0dp" />
                            {/* <radio id="noteDurationOutputMode_extraLongKey" text="Extra long tone button" textSize="12sp" margin="0dp" /> */}
                        </radiogroup>
                    </horizontal>
                </vertical>
                <text id="noteDurationOutputModeContainerFallbackText" text="Music files do not have duration information, and True Duration mode is not available" textColor="red" visibility="gone" />
                {/* 默认点击时长 */}
                <vertical id="defaultClickDurationContainer">
                    <horizontal w="*">
                        <text text="The default click duration: " />
                        {/* <radiogroup id="defaultClickDurationMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                 Fixed value, 1~500ms, logarithmic, default 5ms 
                                <radio id="defaultClickDurationMode_fixed" text="Fixed value" textSize="12sp" margin="0dp" selected="true" />
                                The ratio of the note interval, e.g. 0.5 represents half the click duration to the interval to the next note. 0.05~0.98, linear, default 0.5
                                <radio id="defaultClickDurationMode_intervalRatio" text="Note interval ratio" textSize="12sp" margin="0dp" />
                            </radiogroup> */}
                        <text text="defaultms" id="defaultClickDurationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="defaultClickDurationSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
                {/* Maximum gesture duration: 100~30000ms, logarithmic, default 8000ms */}
                <vertical id="maxGestureDurationContainer">
                    <horizontal w="*">
                        <text text="最长手势持续时间: " />
                        <text text="defaultms" id="maxGestureDurationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="maxGestureDurationSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
                {/* Empty time between keys: 1~600ms, logarithmic, default 100ms */}
                <vertical id="marginDurationContainer">
                    <horizontal w="*">
                        <text text="Empty time between keys: " />
                        <text text="defaultms" id="marginDurationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="marginDurationSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
                {/* Merge Adjacent Notes, 5~800ms, Logarithmic, Default 50*/}
                <vertical id="mergeNearbyNotesIntervalContainer">
                    <horizontal w="*">
                        <text text="Maximum interval between adjacent notes: " />
                        <text text="defaultms" id="mergeNearbyNotesIntervalValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="mergeNearbyNotesIntervalSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
            </vertical>
        )
        let noteDurationOutputMode = configuration.readFileConfigForTarget("noteDurationOutputMode", rawFileName, gameProfile, "none");
        switch (noteDurationOutputMode) {
            case "none":
                view_duration.noteDurationOutputMode_none.setChecked(true);
                break;
            case "native":
                view_duration.noteDurationOutputMode_native.setChecked(true);
                break;
        }
        //Set UI visibility
        let real_noteDurationOutputMode = noteDurationOutputMode;
        let musicHasDurationInfo = this.flags.includes(ConfigurationFlags.MUSIC_HAS_DURATION_INFO);
        if (!musicHasDurationInfo) {
            view_duration.noteDurationOutputModeContainerFallbackText.setVisibility(View.VISIBLE);
            view_duration.noteDurationOutputModeContainer.setVisibility(View.GONE);
            real_noteDurationOutputMode = "none";
        }
        switch (real_noteDurationOutputMode) {
            case "none":
                view_duration.defaultClickDurationContainer.setVisibility(View.VISIBLE);
                view_duration.maxGestureDurationContainer.setVisibility(View.GONE);
                view_duration.marginDurationContainer.setVisibility(View.GONE);
                break;
            case "native":
                view_duration.defaultClickDurationContainer.setVisibility(View.GONE);
                view_duration.maxGestureDurationContainer.setVisibility(View.VISIBLE);
                view_duration.marginDurationContainer.setVisibility(View.VISIBLE);
                break;
        }
        //Hide all sliders in easy mode
        if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
            view_duration.defaultClickDurationContainer.setVisibility(View.GONE);
            view_duration.maxGestureDurationContainer.setVisibility(View.GONE);
            view_duration.marginDurationContainer.setVisibility(View.GONE);
            view_duration.mergeNearbyNotesIntervalContainer.setVisibility(View.GONE);
        }

        let defaultClickDuration = configuration.readGlobalConfig("defaultClickDuration", 5);
        view_duration.defaultClickDurationValueText.setText(defaultClickDuration.toFixed(2) + "ms");
        view_duration.defaultClickDurationSeekbar.setProgress(numberMapLog(defaultClickDuration, 1, 500));
        let maxGestureDuration = configuration.readGlobalConfig("maxGestureDuration", 8000);
        view_duration.maxGestureDurationValueText.setText(maxGestureDuration.toFixed(2) + "ms");
        view_duration.maxGestureDurationSeekbar.setProgress(numberMapLog(maxGestureDuration, 100, 30000));
        let marginDuration = configuration.readGlobalConfig("marginDuration", 100);
        view_duration.marginDurationValueText.setText(marginDuration.toFixed(2) + "ms");
        view_duration.marginDurationSeekbar.setProgress(numberMapLog(marginDuration, 1, 600));
        let mergeNearbyNotesInterval = configuration.readFileConfig("mergeNearbyNotesInterval", rawFileName, 50);
        view_duration.mergeNearbyNotesIntervalValueText.setText(mergeNearbyNotesInterval.toFixed(2) + "ms");
        view_duration.mergeNearbyNotesIntervalSeekbar.setProgress(numberMapLog(mergeNearbyNotesInterval, 5, 800));

        view_duration.noteDurationOutputMode.setOnCheckedChangeListener(function (group, checkedId) {
            anythingChanged = true;
            let noteDurationOutputMode = "";
            switch (checkedId) {
                case view_duration.noteDurationOutputMode_none.getId():
                    noteDurationOutputMode = "none";
                    break;
                case view_duration.noteDurationOutputMode_native.getId():
                    noteDurationOutputMode = "native";
                    break;
            }
            switch (noteDurationOutputMode) {
                case "none":
                    view_duration.defaultClickDurationContainer.setVisibility(View.VISIBLE);
                    view_duration.maxGestureDurationContainer.setVisibility(View.GONE);
                    view_duration.marginDurationContainer.setVisibility(View.GONE);
                    break;
                case "native":
                    view_duration.defaultClickDurationContainer.setVisibility(View.GONE);
                    view_duration.maxGestureDurationContainer.setVisibility(View.VISIBLE);
                    view_duration.marginDurationContainer.setVisibility(View.VISIBLE);
                    break;
            }
            configuration.setFileConfigForTarget("noteDurationOutputMode", noteDurationOutputMode, rawFileName, gameProfile);
            triggerUiRefresh();
        });
        view_duration.defaultClickDurationSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMapLog(progress, 1, 500);
                view_duration.defaultClickDurationValueText.setText(value.toFixed(2) + "ms");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMapLog(seekbar.getProgress(), 1, 500);
                configuration.setGlobalConfig("defaultClickDuration", value);
            }
        });
        view_duration.maxGestureDurationSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMapLog(progress, 100, 30000);
                view_duration.maxGestureDurationValueText.setText(value.toFixed(2) + "ms");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMapLog(seekbar.getProgress(), 100, 30000);
                configuration.setGlobalConfig("maxGestureDuration", value);
            }
        });
        view_duration.marginDurationSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMapLog(progress, 1, 600);
                view_duration.marginDurationValueText.setText(value.toFixed(2) + "ms");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMapLog(seekbar.getProgress(), 1, 600);
                configuration.setGlobalConfig("marginDuration", value);
            }
        });

        view_duration.mergeNearbyNotesIntervalSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMapLog(progress, 5, 800);
                view_duration.mergeNearbyNotesIntervalValueText.setText(value.toFixed(2) + "ms");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMapLog(seekbar.getProgress(), 5, 800);
                configuration.setFileConfig("mergeNearbyNotesInterval", value, rawFileName);
            }
        });

        this.fragments.push({
            name: "duration",
            view: view_duration
        });

        //Vocal range optimization
        let view_range = ui.inflate(
            <vertical>
                <text text="Vocal range optimization:" textColor="red" />
                {/* <ImageView w="*" h="1dp" bg="#a0a0a0" /> */}
                <horizontal id="semiToneRoundingModeSettingContainer">
                    {/* Rounded down by default */}
                    <text text="Chromatic rounding method:" layout_gravity="center_vertical" />
                    <radiogroup id="semiToneRoundingModeSetting" orientation="vertical" padding="0dp" margin="0dp" layout_height="wrap_content">
                        <radio id="semiToneRoundingModeSetting_roundDown" text="Round down" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_roundUp" text="Round up" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_drop" text="Discard semitones" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_both" text="At the same time, round up and down" textSize="12sp" margin="0dp" />
                    </radiogroup>
                </horizontal>
                <vertical id="trackDisableThresholdSettingContainer">
                    <horizontal>
                        {/* 1~99%, 线性, 默认50% */}
                        <text text="Auto-Adjust: Disable track threshold (the higher the - the easier it is to >):" />
                        <text text="default%" id="trackDisableThresholdValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="trackDisableThresholdSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
                <horizontal>
                    <button id="autoTuneButton" text="The following settings are automatically optimized" />
                </horizontal>
                <horizontal>
                    {/* -2~2 */}
                    <text text="Rise/fall an octave:" />
                    <text text="default" id="majorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    <text text="" id="analyzedMajorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" textColor="black" />
                </horizontal>
                <seekbar id="majorPitchOffsetSeekbar" w="*" max="4" layout_gravity="center" />
                <vertical id="minorPitchOffsetSettingContainer">
                    <horizontal>
                        {/* -4~7 */}
                        <text text="Ascending/falling semitones (transposing):" />
                        <text text="default" id="minorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        <text text="" id="analyzedMinorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" textColor="black" />
                    </horizontal>
                    <seekbar id="minorPitchOffsetSeekbar" w="*" max="11" layout_gravity="center" />
                </vertical>
                <horizontal id="wrapHigherOctaveContainer">
                    <text text="Move the upper octave note into the vocal range: " />
                    <checkbox id="wrapHigherOctaveCheckbox" />
                </horizontal>
                <horizontal id="wrapLowerOctaveContainer">
                    <text text="Move the lower octave notes into the vocal range: " />
                    <checkbox id="wrapLowerOctaveCheckbox" />
                </horizontal>
                <horizontal id="trackSelectionContainer">
                    <text text="Track selection:" />
                    <button id="selectTracksButton" text="choose..." padding="0dp" />
                </horizontal>
                <text text="The current music file has no track information, and the selected track is not available" id="trackSelectionContainerFallbackText" textColor="red" visibility="gone" />
            </vertical>
        );

        //Hide the menu in simple mode
        if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
            view_range.semiToneRoundingModeSettingContainer.setVisibility(View.GONE);
            view_range.trackDisableThresholdSettingContainer.setVisibility(View.GONE);
            view_range.minorPitchOffsetSettingContainer.setVisibility(View.GONE);
            view_range.wrapHigherOctaveContainer.setVisibility(View.GONE);
            view_range.wrapLowerOctaveContainer.setVisibility(View.GONE);
        }
        //If the game has all semitones, hide the transpose setting
        if (this.flags.includes(ConfigurationFlags.GAME_HAS_ALL_SEMITONES)) {
            view_range.semiToneRoundingModeSettingContainer.setVisibility(View.GONE);
            view_range.autoTuneButton.setVisibility(View.GONE);
            view_range.minorPitchOffsetSettingContainer.setVisibility(View.GONE);
        }
        //If there is no audio track information, hide the audio track selection
        if (!this.flags.includes(ConfigurationFlags.MUSIC_HAS_TRACKS)) {
            view_range.trackSelectionContainer.setVisibility(View.GONE);
            view_range.trackSelectionContainerFallbackText.setVisibility(View.VISIBLE);
        }


        let semiToneRoundingMode = configuration.readFileConfig("semiToneRoundingMode", rawFileName, 0);
        switch (semiToneRoundingMode) {
            case 0:
                view_range.semiToneRoundingModeSetting_roundDown.setChecked(true);
                break;
            case 1:
                view_range.semiToneRoundingModeSetting_roundUp.setChecked(true);
                break;
            case 2:
                view_range.semiToneRoundingModeSetting_drop.setChecked(true);
                break;
            case 3:
                view_range.semiToneRoundingModeSetting_both.setChecked(true);
                break;
        }
        let trackDisableThreshold = 0.5; //It will not be saved
        view_range.trackDisableThresholdValueText.setText((trackDisableThreshold * 100).toFixed(2) + "%");
        view_range.trackDisableThresholdSeekbar.setProgress(numberMap(trackDisableThreshold * 100, 1, 99));
        let majorPitchOffset = configuration.readFileConfigForTarget("majorPitchOffset", rawFileName, gameProfile, 0);
        view_range.majorPitchOffsetValueText.setText(majorPitchOffset.toFixed(0));
        view_range.majorPitchOffsetSeekbar.setProgress(majorPitchOffset + 2);
        let analyzedMajorPitchOffset = configuration.readFileConfigForTarget("analyzedMajorPitchOffset", rawFileName, gameProfile);
        if (analyzedMajorPitchOffset != undefined) {
            view_range.analyzedMajorPitchOffsetValueText.setText(` (recommend: ${analyzedMajorPitchOffset.toFixed(0)})`);
        }
        let minorPitchOffset = configuration.readFileConfigForTarget("minorPitchOffset", rawFileName, gameProfile, 0);
        view_range.minorPitchOffsetValueText.setText(`${minorPitchOffset.toFixed(0)} (${midiPitch.getTranspositionEstimatedKey(minorPitchOffset)})`);
        view_range.minorPitchOffsetSeekbar.setProgress(minorPitchOffset + 4);
        let analyzedMinorPitchOffset = configuration.readFileConfigForTarget("analyzedMinorPitchOffset", rawFileName, gameProfile);
        if (analyzedMinorPitchOffset != undefined) {
            view_range.analyzedMinorPitchOffsetValueText.setText(` (recommend: ${analyzedMinorPitchOffset.toFixed(0)})`);
        }
        let wrapHigherOctave = configuration.readFileConfigForTarget("wrapHigherOctave", rawFileName, gameProfile, 1);
        view_range.wrapHigherOctaveCheckbox.setChecked(wrapHigherOctave > 0);  //It doesn't automatically convert to bool
        let wrapLowerOctave = configuration.readFileConfigForTarget("wrapLowerOctave", rawFileName, gameProfile, 0);
        view_range.wrapLowerOctaveCheckbox.setChecked(wrapLowerOctave > 0);

        view_range.semiToneRoundingModeSetting.setOnCheckedChangeListener(function (group, checkedId) {
            anythingChanged = true;
            let semiToneRoundingMode = 0;
            switch (checkedId) {
                case view_range.semiToneRoundingModeSetting_roundDown.getId():
                    semiToneRoundingMode = 0;
                    break;
                case view_range.semiToneRoundingModeSetting_roundUp.getId():
                    semiToneRoundingMode = 1;
                    break;
                case view_range.semiToneRoundingModeSetting_drop.getId():
                    semiToneRoundingMode = 2;
                    break;
                case view_range.semiToneRoundingModeSetting_both.getId():
                    semiToneRoundingMode = 3;
                    break;
            }
            configuration.setFileConfig("semiToneRoundingMode", semiToneRoundingMode, rawFileName);
        });
        view_range.trackDisableThresholdSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMap(progress, 1, 99);
                view_range.trackDisableThresholdValueText.setText(value.toFixed(2) + "%");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMap(seekbar.getProgress(), 1, 99);
                trackDisableThreshold = value;
            }
        });
        view_range.majorPitchOffsetSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = progress - 2;
                view_range.majorPitchOffsetValueText.setText(value.toFixed(0));
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = seekbar.getProgress() - 2;
                configuration.setFileConfigForTarget("majorPitchOffset", value, rawFileName, gameProfile);
            }
        });
        view_range.minorPitchOffsetSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = progress - 4;
                view_range.minorPitchOffsetValueText.setText(`${value.toFixed(0)} (${midiPitch.getTranspositionEstimatedKey(value)})`);
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = seekbar.getProgress() - 4;
                configuration.setFileConfigForTarget("minorPitchOffset", value, rawFileName, gameProfile);
            }
        });
        view_range.autoTuneButton.click(function () {
            anythingChanged = true;
            runCallback(ConfigurationCallbacks.runAutoTune, {
                "trackDisableThreshold": trackDisableThreshold
            });
        });
        view_range.wrapHigherOctaveCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            configuration.setFileConfigForTarget("wrapHigherOctave", checked, rawFileName, gameProfile);
        });
        view_range.wrapLowerOctaveCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            configuration.setFileConfigForTarget("wrapLowerOctave", checked, rawFileName, gameProfile);
        });
        view_range.selectTracksButton.click(function () {
            anythingChanged = true;
            runCallback(ConfigurationCallbacks.selectTracks, {
            });
        });

        this.fragments.push({
            name: "range",
            view: view_range
        });

        //Chord optimization
        if (this.flags.includes(ConfigurationFlags.LEVEL_ADVANCED) ||
            this.flags.includes(ConfigurationFlags.LEVEL_EXPERT)) {
            let view_chord = ui.inflate(
                <vertical>
                    <horizontal w="*">
                        <text text="Chord optimization:" textColor="red" />
                        <checkbox id="chordLimitCheckbox" />
                    </horizontal>
                    <vertical id="chordLimitSettingContainer">
                        <horizontal w="*">
                            <text text="最多同时按键数量: " />
                            {/* 1-9, default 2*/}
                            <text text="default个" id="maxSimultaneousNoteCountValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="maxSimultaneousNoteCountSeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal>
                            {/* Rounded down by default */}
                            <text text="How to limit the number of buttons: " layout_gravity="center_vertical" />
                            <radiogroup id="noteCountLimitMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="noteCountLimitMode_delete" text="Delete the exceeded" textSize="12sp" margin="0dp" />
                                <radio id="noteCountLimitMode_split" text="Split into multiple groups" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                        <horizontal w="*">
                            <text text="拆分成多组时组间间隔: " />
                            {/* 5-500ms, logarithmic, default 75ms */}
                            <text text="defaultms" id="noteCountLimitSplitDelayValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="noteCountLimitSplitDelaySeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal w="*">
                            <text text="选择方式: " />
                            <radiogroup id="chordSelectMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="chordSelectMode_high" text="优先高音" textSize="12sp" margin="0dp" />
                                <radio id="chordSelectMode_low" text="优先低音" textSize="12sp" margin="0dp" />
                                <radio id="chordSelectMode_random" text="随机" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                    </vertical>
                </vertical>
            );
            let chordLimitEnabled = configuration.readFileConfig("chordLimitEnabled", rawFileName, false);
            view_chord.chordLimitCheckbox.setChecked(chordLimitEnabled);
            view_chord.chordLimitSettingContainer.setVisibility(chordLimitEnabled ? View.VISIBLE : View.GONE);
            let maxSimultaneousNoteCount = configuration.readFileConfig("maxSimultaneousNoteCount", rawFileName, 2);
            view_chord.maxSimultaneousNoteCountValueText.setText(maxSimultaneousNoteCount.toFixed(0));
            view_chord.maxSimultaneousNoteCountSeekbar.setProgress(numberMap(maxSimultaneousNoteCount, 1, 9));
            let noteCountLimitMode = configuration.readFileConfig("noteCountLimitMode", rawFileName, "split");
            switch (noteCountLimitMode) {
                case "delete":
                    view_chord.noteCountLimitMode_delete.setChecked(true);
                    break;
                case "split":
                    view_chord.noteCountLimitMode_split.setChecked(true);
                    break;
            }
            let noteCountLimitSplitDelay = configuration.readFileConfig("noteCountLimitSplitDelay", rawFileName, 75);
            view_chord.noteCountLimitSplitDelayValueText.setText(noteCountLimitSplitDelay.toFixed(2) + "ms");
            view_chord.noteCountLimitSplitDelaySeekbar.setProgress(numberMapLog(noteCountLimitSplitDelay, 5, 500));
            let chordSelectMode = configuration.readFileConfig("chordSelectMode", rawFileName, "high");
            switch (chordSelectMode) {
                case "high":
                    view_chord.chordSelectMode_high.setChecked(true);
                    break;
                case "low":
                    view_chord.chordSelectMode_low.setChecked(true);
                    break;
                case "random":
                    view_chord.chordSelectMode_random.setChecked(true);
                    break;
            }

            view_chord.chordLimitCheckbox.setOnCheckedChangeListener(function (button, checked) {
                anythingChanged = true;
                view_chord.chordLimitSettingContainer.setVisibility(checked ? View.VISIBLE : View.GONE);
                configuration.setFileConfig("chordLimitEnabled", checked, rawFileName);
            });
            view_chord.maxSimultaneousNoteCountSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMap(progress, 1, 9);
                    view_chord.maxSimultaneousNoteCountValueText.setText(value.toFixed(0));
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    anythingChanged = true;
                    let value = numberRevMap(seekbar.getProgress(), 1, 9);
                    configuration.setFileConfig("maxSimultaneousNoteCount", value, rawFileName);
                }
            });
            view_chord.noteCountLimitMode.setOnCheckedChangeListener(function (group, checkedId) {
                anythingChanged = true;
                let noteCountLimitMode = "";
                switch (checkedId) {
                    case view_chord.noteCountLimitMode_delete.getId():
                        noteCountLimitMode = "delete";
                        break;
                    case view_chord.noteCountLimitMode_split.getId():
                        noteCountLimitMode = "split";
                        break;
                }
                configuration.setFileConfig("noteCountLimitMode", noteCountLimitMode, rawFileName);
            });
            view_chord.noteCountLimitSplitDelaySeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMapLog(progress, 5, 500);
                    view_chord.noteCountLimitSplitDelayValueText.setText(value.toFixed(2) + "ms");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    anythingChanged = true;
                    let value = numberRevMapLog(seekbar.getProgress(), 5, 500);
                    configuration.setFileConfig("noteCountLimitSplitDelay", value, rawFileName);
                }
            });
            view_chord.chordSelectMode.setOnCheckedChangeListener(function (group, checkedId) {
                anythingChanged = true;
                let chordSelectMode = "";
                switch (checkedId) {
                    case view_chord.chordSelectMode_high.getId():
                        chordSelectMode = "high";
                        break;
                    case view_chord.chordSelectMode_low.getId():
                        chordSelectMode = "low";
                        break;
                    case view_chord.chordSelectMode_random.getId():
                        chordSelectMode = "random";
                        break;
                }
                configuration.setFileConfig("chordSelectMode", chordSelectMode, rawFileName);
            });

            this.fragments.push({
                name: "chord",
                view: view_chord
            });
        } else if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
            let view_chord = ui.inflate(
                <vertical>
                    <text text="和弦优化:" textColor="red" />
                    <radiogroup id="maxSimultaneousNoteCountSelector" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                        <radio id="maxSimultaneousNoteCountSelector_1" text="1 finger" textSize="12sp" margin="0dp" />
                        <radio id="maxSimultaneousNoteCountSelector_2" text="2 fingers" textSize="12sp" margin="0dp" />
                        <radio id="maxSimultaneousNoteCountSelector_3" text="3 fingers" textSize="12sp" margin="0dp" />
                        <radio id="maxSimultaneousNoteCountSelector_9" text="Unlimited" textSize="12sp" margin="0dp" checked="true" />
                    </radiogroup>
                </vertical>
            );
            let chordLimitEnabled = configuration.readFileConfig("chordLimitEnabled", rawFileName, false);
            let maxSimultaneousNoteCount = configuration.readFileConfig("maxSimultaneousNoteCount", rawFileName, 9);
            if (chordLimitEnabled) {
                switch (maxSimultaneousNoteCount) {
                    case 1:
                        view_chord.maxSimultaneousNoteCountSelector_1.setChecked(true);
                        break;
                    case 2:
                        view_chord.maxSimultaneousNoteCountSelector_2.setChecked(true);
                        break;
                    case 3:
                        view_chord.maxSimultaneousNoteCountSelector_3.setChecked(true);
                        break;
                    case 9:
                        view_chord.maxSimultaneousNoteCountSelector_9.setChecked(true);
                        break;
                }
            } else {
                view_chord.maxSimultaneousNoteCountSelector_9.setChecked(true);
            }
            view_chord.maxSimultaneousNoteCountSelector.setOnCheckedChangeListener(function (group, checkedId) {
                anythingChanged = true;
                let maxSimultaneousNoteCount = 9;
                switch (checkedId) {
                    case view_chord.maxSimultaneousNoteCountSelector_1.getId():
                        maxSimultaneousNoteCount = 1;
                        break;
                    case view_chord.maxSimultaneousNoteCountSelector_2.getId():
                        maxSimultaneousNoteCount = 2;
                        break;
                    case view_chord.maxSimultaneousNoteCountSelector_3.getId():
                        maxSimultaneousNoteCount = 3;
                        break;
                    case view_chord.maxSimultaneousNoteCountSelector_9.getId():
                        configuration.setFileConfig("chordLimitEnabled", false, rawFileName);
                        return;
                        break;
                }
                configuration.setFileConfig("maxSimultaneousNoteCount", maxSimultaneousNoteCount, rawFileName);
                configuration.setFileConfig("chordLimitEnabled", true, rawFileName);
            });

            this.fragments.push({
                name: "chord",
                view: view_chord
            });
        }

        //Camouflage handballs
        if (this.flags.includes(ConfigurationFlags.LEVEL_ADVANCED) ||
            this.flags.includes(ConfigurationFlags.LEVEL_EXPERT)) {
            let view_humanify = ui.inflate(
                <vertical>
                    <text text="Camouflage Hand Bullet (Global):" textColor="red" />
                    <horizontal w="*">
                        {/* 5~150ms, linear, default 0-> not used*/}
                        <text text="Note timing deviation: " />
                        <checkbox id="noteTimeDeviationCheckbox" />
                        <text text="defaultms" id="noteTimeDeviationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="noteTimeDeviationSeekbar" w="*" max="1000" layout_gravity="center" />
                    <horizontal w="*">
                        {/* 0~6mm, linear, default 1*/}
                        <text text="Click Position Deviation: " />
                        <text text="defaultmm" id="clickPositionDeviationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="clickPositionDeviationSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
            );
            let noteTimeDeviation = configuration.readGlobalConfig("humanifyNoteAbsTimeStdDev", 0);
            view_humanify.noteTimeDeviationCheckbox.setChecked(noteTimeDeviation != 0);
            view_humanify.noteTimeDeviationValueText.setText(noteTimeDeviation.toFixed(2) + "ms");
            view_humanify.noteTimeDeviationSeekbar.setProgress(numberMap(noteTimeDeviation, 5, 150));
            let clickPositionDeviation = configuration.readGlobalConfig("clickPositionDeviationMm", 1);
            view_humanify.clickPositionDeviationValueText.setText(clickPositionDeviation.toFixed(2) + "mm");
            view_humanify.clickPositionDeviationSeekbar.setProgress(numberMap(clickPositionDeviation, 0, 6));

            view_humanify.noteTimeDeviationCheckbox.setOnCheckedChangeListener(function (button, checked) {
                anythingChanged = true;
                let progress = view_humanify.noteTimeDeviationSeekbar.getProgress();
                let value = numberRevMap(progress, 5, 150);
                configuration.setGlobalConfig("humanifyNoteAbsTimeStdDev", checked ? value : 0);
            });
            view_humanify.noteTimeDeviationSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMap(progress, 5, 150);
                    view_humanify.noteTimeDeviationValueText.setText(value.toFixed(2) + "ms");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    if (!view_humanify.noteTimeDeviationCheckbox.isChecked()) return;
                    anythingChanged = true;
                    let value = numberRevMap(seekbar.getProgress(), 5, 150);
                    configuration.setGlobalConfig("humanifyNoteAbsTimeStdDev", value);
                }
            });
            view_humanify.clickPositionDeviationSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMap(progress, 0, 6);
                    view_humanify.clickPositionDeviationValueText.setText(value.toFixed(2) + "mm");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    anythingChanged = true;
                    let value = numberRevMap(seekbar.getProgress(), 0, 6);
                    configuration.setGlobalConfig("clickPositionDeviationMm", value);
                }
            });

            this.fragments.push({
                name: "humanify",
                view: view_humanify
            });
        }

        //Skip the blanks
        let view_skipBlank = ui.inflate(
            <vertical>
                <text text="Skip the blanks:" textColor="red" />
                <horizontal w="*">
                    <text text="Skip the intro blanks: " />
                    <checkbox id="skipInitEnabledCheckbox" />
                </horizontal>
                <horizontal w="*">
                    <text text="Skip the middle blank: " />
                    <checkbox id="skipBlank5sEnabledCheckbox" />
                </horizontal>
            </vertical>
        );
        let skipInitEnabled = configuration.readGlobalConfig("skipInit", false);
        view_skipBlank.skipInitEnabledCheckbox.setChecked(skipInitEnabled ? true : false); //Not sure why number might be returned here
        let skipBlank5sEnabled = configuration.readGlobalConfig("skipBlank5s", false);
        view_skipBlank.skipBlank5sEnabledCheckbox.setChecked(skipBlank5sEnabled ? true : false);

        view_skipBlank.skipInitEnabledCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            configuration.setGlobalConfig("skipInit", checked);
        });

        view_skipBlank.skipBlank5sEnabledCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            configuration.setGlobalConfig("skipBlank5s", checked);
        });

        this.fragments.push({
            name: "skipBlank",
            view: view_skipBlank
        });

    } else if (this.flags.includes(ConfigurationFlags.WORKMODE_MIDI_INPUT_STREAMING)) {

        let view_range = ui.inflate(
            <vertical>
                <text text="音域优化:" textColor="red" />
                {/* <horizontal id="semiToneRoundingModeSettingContainer">
                    <text text="Chromatic rounding method:" layout_gravity="center_vertical" />
                    <radiogroup id="semiToneRoundingModeSetting" orientation="vertical" padding="0dp" margin="0dp" layout_height="wrap_content">
                        <radio id="semiToneRoundingModeSetting_roundDown" text="Round down" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_roundUp" text="Round up" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_drop" text="Discard semitones" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_both" text="At the same time, round up and down" textSize="12sp" margin="0dp" />
                    </radiogroup>
                </horizontal> */}
                <horizontal>
                    <text text="升/Octave down:" />
                    <text text="default" id="majorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                </horizontal>
                <seekbar id="majorPitchOffsetSeekbar" w="*" max="4" layout_gravity="center" />
                <vertical id="minorPitchOffsetSettingContainer">
                    <horizontal>
                        <text text="Ascending/falling semitones (transposing):" />
                        <text text="default" id="minorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="minorPitchOffsetSeekbar" w="*" max="11" layout_gravity="center" />
                </vertical>
            </vertical>
        );

        //TODO: Chromatic rounding method for stream processing
        // let semiToneRoundingMode = configuration.readGlobalConfig("MIDIInputStreaming_semiToneRoundingMode", 0);
        // switch (semiToneRoundingMode) {
        //     case 0:
        //         view_range.semiToneRoundingModeSetting_roundDown.setChecked(true);
        //         break;
        //     case 1:
        //         view_range.semiToneRoundingModeSetting_roundUp.setChecked(true);
        //         break;
        //     case 2:
        //         view_range.semiToneRoundingModeSetting_drop.setChecked(true);
        //         break;
        //     case 3:
        //         view_range.semiToneRoundingModeSetting_both.setChecked(true);
        //         break;
        // }
        let majorPitchOffset = configuration.readGlobalConfig("MIDIInputStreaming_majorPitchOffset", 0);
        view_range.majorPitchOffsetValueText.setText(majorPitchOffset.toFixed(0));
        view_range.majorPitchOffsetSeekbar.setProgress(majorPitchOffset + 2);
        let minorPitchOffset = configuration.readGlobalConfig("MIDIInputStreaming_minorPitchOffset", 0);
        view_range.minorPitchOffsetValueText.setText(`${minorPitchOffset.toFixed(0)} (${midiPitch.getTranspositionEstimatedKey(minorPitchOffset)})`);
        view_range.minorPitchOffsetSeekbar.setProgress(minorPitchOffset + 4);

        // view_range.semiToneRoundingModeSetting.setOnCheckedChangeListener(function (group, checkedId) {
        //     anythingChanged = true;
        //     let semiToneRoundingMode = 0;
        //     switch (checkedId) {
        //         case view_range.semiToneRoundingModeSetting_roundDown.getId():
        //             semiToneRoundingMode = 0;
        //             break;
        //         case view_range.semiToneRoundingModeSetting_roundUp.getId():
        //             semiToneRoundingMode = 1;
        //             break;
        //         case view_range.semiToneRoundingModeSetting_drop.getId():
        //             semiToneRoundingMode = 2;
        //             break;
        //         case view_range.semiToneRoundingModeSetting_both.getId():
        //             semiToneRoundingMode = 3;
        //             break;
        //     }
        //     configuration.setGlobalConfig("MIDIInputStreaming_semiToneRoundingMode", semiToneRoundingMode);
        // });
        view_range.majorPitchOffsetSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = progress - 2;
                view_range.majorPitchOffsetValueText.setText(value.toFixed(0));
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = seekbar.getProgress() - 2;
                configuration.setGlobalConfig("MIDIInputStreaming_majorPitchOffset", value);
            }
        });
        view_range.minorPitchOffsetSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = progress - 4;
                view_range.minorPitchOffsetValueText.setText(`${value.toFixed(0)} (${midiPitch.getTranspositionEstimatedKey(value)})`);
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = seekbar.getProgress() - 4;
                configuration.setGlobalConfig("MIDIInputStreaming_minorPitchOffset", value);
            }
        });


        this.fragments.push({
            name: "range",
            view: view_range
        });

        let view_fakeSustain = ui.inflate(<vertical>
            <text text="Camouflage long tones:" textColor="red" />
            <horizontal w="*">
                <text text="Use continuous taps to disguise long tones: " />
                <checkbox id="fakeSustainEnabledCheckbox" />
            </horizontal>
            <vertical id="fakeSustainSettingContainer">
                <horizontal w="*">
                    <text text="Continuous click speed: " />
                    <text text="default次/秒" id="fakeSustainIntervalValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                </horizontal>
                <seekbar id="fakeSustainIntervalSeekbar" w="*" max="1000" layout_gravity="center" />
            </vertical>
        </vertical>
        );

        let fakeSustainInterval = configuration.readGlobalConfig("MIDIInputStreaming_fakeSustainInterval", 0);
        view_fakeSustain.fakeSustainEnabledCheckbox.setChecked(fakeSustainInterval != 0);
        view_fakeSustain.fakeSustainSettingContainer.setVisibility(fakeSustainInterval != 0 ? View.VISIBLE : View.GONE);
        view_fakeSustain.fakeSustainIntervalValueText.setText((1000 / fakeSustainInterval).toFixed(2) + "次/秒");
        view_fakeSustain.fakeSustainIntervalSeekbar.setProgress(numberMap(1000 / fakeSustainInterval, 1, 20));

        view_fakeSustain.fakeSustainEnabledCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            view_fakeSustain.fakeSustainSettingContainer.setVisibility(checked ? View.VISIBLE : View.GONE);
            let progress = view_fakeSustain.fakeSustainIntervalSeekbar.getProgress();
            let value = numberRevMap(progress, 1, 20);
            configuration.setGlobalConfig("MIDIInputStreaming_fakeSustainInterval", checked ? value : 0);
        });
        view_fakeSustain.fakeSustainIntervalSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMap(progress, 1, 20);
                view_fakeSustain.fakeSustainIntervalValueText.setText(value.toFixed(2) + "times/second");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                if (!view_fakeSustain.fakeSustainEnabledCheckbox.isChecked()) return;
                anythingChanged = true;
                let value = 1000 / numberRevMap(seekbar.getProgress(), 1, 20);
                configuration.setGlobalConfig("MIDIInputStreaming_fakeSustainInterval", value);
            }
        });

        this.fragments.push({
            name: "fakeSustain",
            view: view_fakeSustain
        });
    }


    /**
     * @brief Obtain the view of the configuration page
     * @returns {View}
     */
    this.getView = function () {
        let frame = ui.inflate(
            <ScrollView margin="0dp" padding="0dp">
                <vertical id="body" margin="0dp" padding="0dp">
                </vertical>
            </ScrollView>
        );
        for (let fragment of this.fragments) {
            let cardId = 'card_' + fragment.name;
            let card = ui.inflate(
                <card cardElevation="5dp" cardCornerRadius="2dp" margin="2dp" contentPadding="2dp">
                </card>
                , frame.body);
            card.addView(fragment.view);
            // card.setId(cardId);
            frame.body.addView(card);
        }
        return frame;
    }

    /**
     * @brief Whether any configuration has been modified
     */
    this.isAnythingChanged = function () {
        return anythingChanged;
    }
}

module.exports = {
    ConfigurationUi,
    ConfigurationFlags
}