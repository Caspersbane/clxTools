// instruct.js -- Teach/follow mode

var noteUtils = require('./noteUtils.js');

/**
 * Simple follow-up mode. The dot is displayed at the key position, and the dot becomes brighter when the key is pressed, then gradually darkens and finally disappears.
 * @constructor
 */
function SimpleInstructPlayerImpl() {
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

    const Paint = android.graphics.Paint;
    const Color = android.graphics.Color;
    const PorterDuff = android.graphics.PorterDuff;

    let internalState = PlayerStates.UNINITIALIZED;
    let paint = new Paint();
    paint.setARGB(255, 255, 255, 0);

    /**
     * @type {Array<import('./gameProfile.js').pos2d>?}
     */
    let keyPositions = null;
    /**
     * The brightness of the keys(0~1)
     * @type {Array<number>}
     */
    let keyBrightnesss = [];
    /**
     * Key size (radius, pixels)
     * @type {number}
     */
    let keyRadius = 20;
    /**
     * Attenuation speed (scale/ms)
     * @type {number}
     */
    let decaySpeed = 0.005;

    const brightLowerBound = 0.1;

    let lastDrawTime = new Date().getTime();

    this.doTransform = false;

    this.getType = function () {
        return "SimpleInstructPlayer";
    }
    /**
     * @param {PlayerStates} state
     */
    this.setState = function (state) {
        internalState = state;
    }
    /**
     * @param {Array<import('./gameProfile.js').pos2d>} positions 
     */
    this.setKeyPositions = function (positions) {
        keyPositions = positions;
        keyBrightnesss = new Array(positions.length);
        keyBrightnesss.fill(0);
    }
    /**
     * @param {number} radius 
     */
    this.setKeyRadius = function (radius) {
        keyRadius = radius;
    }

    /**
     * @param {number[]} keys
     */
    this.exec = function (keys) {
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            keyBrightnesss[key] = 1;
        }
    }

    /**
     * @param {android.graphics.Canvas} canvas 
     */
    this.draw = function (canvas) {
        if (keyPositions == null) {
            return;
        }
        //清空
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        let now = new Date().getTime();

        for (let i = 0; i < keyPositions.length; i++) {
            let pos = keyPositions[i];
            let brightness = keyBrightnesss[i];
            if (brightness < brightLowerBound) {
                continue;
            }
            paint.setAlpha(Math.floor(brightness * 255));
            paint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(pos[0], pos[1], keyRadius, paint);
            keyBrightnesss[i] *= Math.pow(1 - decaySpeed, now - lastDrawTime);
            if (keyBrightnesss[i] < brightLowerBound) {
                keyBrightnesss[i] = 0;
            }
        }
        lastDrawTime = now;
    }
}

/**
 * Similar to the tracking mode of light encounters:
 * - Displays a gradually expanding circle inside the next key, the circle fills the key exactly when the key is pressed, and then disappears
 * - Displays the position of the previous key and uses a Bezier curve to connect the next key and the previous key
 * - Draw a five-pointed star on the curve, the position of the five-pointed star on the curve corresponds to the ratio of the time since the previous key was pressed to the time difference between the two keys (i.e. a progress bar)
 * - If the two keys are the same key, the curve is not drawn, and the five-pointed star is drawn inside the button
 */
function SkyCotlLikeInstructPlayerImpl() {
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

    const Paint = android.graphics.Paint;
    const Color = android.graphics.Color;
    const PorterDuff = android.graphics.PorterDuff;
    const Path = android.graphics.Path;
    const PathEffect = android.graphics.PathEffect;
    const DashPathEffect = android.graphics.DashPathEffect;

    let internalState = PlayerStates.UNINITIALIZED;
    let paint = new Paint();
    let lookAheadTime = 1000;  // ms

    this.getType = function () {
        return "SkyCotlLikeInstructPlayer";
    }
    /**
     * @type {Array<import('./noteUtils').PackedKey>}
     */
    let keyTimeList = [];

    this.setGestureTimeList = function (gestureTimeList_) {
        keyTimeList = gestureTimeList_;
    }

    let position = 0;

    this.seekTo = function (pos) {
        position = pos;
    }
    /**
     * @param {number[]} keys
     */
    this.exec = function (keys) {
        lastKeysTime = new Date().getTime();
        lastKeys = keyTimeList[position];
        position++;
    }

    /**
     * @param {PlayerStates} state
     */
    this.setState = function (state) {
        internalState = state;
    }
    /**
    * @type {Array<import('./gameProfile.js').pos2d>?}
    */
    let keyPositions = null;
    /**
     * @param {Array<import('./gameProfile.js').pos2d>} positions 
     */
    this.setKeyPositions = function (positions) {
        keyPositions = positions;
    }

    /**
     * @type {Map<number, number>}
     */
    let keyOrder = new Map();
    /**
     * @brief Set the order of the buttons, the higher the pitch, the higher the value
     * @note The higher the key number, the higher the pitch, so additional mapping is required
     */
    this.setKeyOrder = function (order) {
        keyOrder = order;
    }


    /**
     * Key size (radius, pixels)
     * @type {number}
     */
    let keyRadius = 20;
    /**
     * @param {number} radius 
     */
    this.setKeyRadius = function (radius) {
        keyRadius = radius;
    }

    /**
     * If there are multiple keys in the next set, whether you want to draw a curve for each button (instead of just the highest note)
     * @type {boolean}
     */
    let drawLineToEachNextKeys = true;
    /**
     * @param {boolean} value 
     */
    this.setDrawLineToEachNextKeys = function (value) {
        drawLineToEachNextKeys = value;
    }

    /**
     * Whether you want to draw a shallower curve on the next set of keys on the next set of keys
     * @type {boolean}
     */
    let drawLineToNextNextKey = true;
    /**
     * @param {boolean} value 
     */
    this.setDrawLineToNextNextKey = function (value) {
        drawLineToNextNextKey = value;
    }

    /**
     * Whether to draw a ring on the outside of the key (instead of the default inside)
     * @type {boolean}
     */
    let drawRingOutside = false;
    /**
     * @param {boolean} value 
     */
    this.setDrawRingOutside = function (value) {
        drawRingOutside = value;
    }

    /**
     * @brief Draw a filled triangle at the specified location
     * @param {android.graphics.Canvas} canvas
     * @param {Paint} paint
     * @param {[number, number]} pos
     * @param {number} radius
     */
    function drawFilledTriangle(canvas, paint, pos, radius) {
        const x = pos[0];
        const y = pos[1];

        // Calculates the three vertices of an equilateral triangle
        const topX = x;
        const topY = y - radius;
        const leftX = x - radius * Math.sin(Math.PI / 3);  // sin(60°)
        const leftY = y + radius * Math.cos(Math.PI / 3);  // cos(60°)
        const rightX = x + radius * Math.sin(Math.PI / 3);
        const rightY = y + radius * Math.cos(Math.PI / 3);

        // Create a path
        const path = new Path();

        // Move to a vertex
        path.moveTo(topX, topY);

        // Connect the other two vertices
        path.lineTo(leftX, leftY);
        path.lineTo(rightX, rightY);

        // Closed path
        path.close();

        // Draw filled triangles
        canvas.drawPath(path, paint);
    }

    /**
     * @brief Draw a smooth curve that convex to connect the two points
     * @param {android.graphics.Canvas} canvas
     * @param {Paint} paint
     * @param {[number, number]} start
     * @param {[number, number]} end
     * @param {number} factor Controls how much the curve is curved(0-1)
     */
    function drawCurveLine(canvas, paint, start, end, factor) {
        // Make sure the factor is between 0-1
        factor = Math.max(0, Math.min(1, factor));

        // Calculate the midpoint of the start and end points
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;

        // Calculates the unit vector perpendicular to the start and end lines
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitPerpX = -dy / length;
        const unitPerpY = dx / length;

        // Calculate control points
        // Use factor and segment length to determine the distance between the control point and the midpoint
        const controlDistance = length * factor * 0.5;
        const controlX = midX + unitPerpX * controlDistance;
        const controlY = midY + unitPerpY * controlDistance;

        // Create a path
        const path = new android.graphics.Path();
        path.moveTo(start[0], start[1]);
        path.quadTo(controlX, controlY, end[0], end[1]);

        // Draw a path on the canvas
        canvas.drawPath(path, paint);
    }

    /**
     * @brief Draw a smooth curve that convex to connect the two points
     * @param {android.graphics.Canvas} canvas
     * @param {Paint} paint
     * @param {[number, number]} start
     * @param {[number, number]} end
     * @param {number} factor Controls how much the curve is curved(0-1)
     * @param {number} t Control the degree to which the curve is completed(0-1)
     */
    function drawPartialCurveLine(canvas, paint, start, end, factor, t) {
        // Make sure that factor and t are between 0-1
        factor = Math.max(0, Math.min(1, factor));
        t = Math.max(0, Math.min(1, t));

        // Calculate the midpoint of the start and end points
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;

        // Calculates the unit vector perpendicular to the start and end lines
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitPerpX = -dy / length;
        const unitPerpY = dx / length;

        // Calculate control points
        // Use factor and segment length to determine the distance between the control point and the midpoint
        const controlDistance = length * factor * 0.5;
        const controlX = midX + unitPerpX * controlDistance;
        const controlY = midY + unitPerpY * controlDistance;

        // Create a path
        const path = new android.graphics.Path();
        path.moveTo(start[0], start[1]);
        path.quadTo(controlX, controlY, end[0], end[1]);

        // Use PathMeasure to measure the path
        const pathMeasure = new android.graphics.PathMeasure(path, false);
        const pathLength = pathMeasure.getLength();

        // Create a new path to store part of the path
        const partialPath = new android.graphics.Path();
        pathMeasure.getSegment(0, pathLength * t, partialPath, true);

        // Draw a partial path on the canvas
        canvas.drawPath(partialPath, paint);
    }

    /**
     * @brief For the smoothed curve described above, the position of the point on the curve is calculated, given the proportion of the length of the entire curve from the starting point
     * @param {[number, number]} start
     * @param {[number, number]} end
     * @param {number} progress Proportion of the length of the entire curve from the start point (0-> starting point, 1-> end point)
     * @param {number} factor Controls how much the curve is curved
     * @returns {[number, number]} The location of the point on the curve
     */
    function getPointOnCurve(start, end, progress, factor) {
        // Make sure the progress and factor are between 0-1
        progress = Math.max(0, Math.min(1, progress));
        factor = Math.max(0, Math.min(1, factor));

        // Calculate the midpoint of the start and end points
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;

        // Calculates the unit vector perpendicular to the start and end lines
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitPerpX = -dy / length;
        const unitPerpY = dx / length;

        // Calculate control points
        const controlDistance = length * factor * 0.5;
        const controlX = midX + unitPerpX * controlDistance;
        const controlY = midY + unitPerpY * controlDistance;

        // Use progress as an approximation of t
        const t = progress;

        // Calculate points on Bezier curves
        const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlX + t * t * end[0];
        const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlY + t * t * end[1];

        return [x, y];
    }

    /**
     * @param {number} x 
     */
    function easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    /**
     * @type {import('./noteUtils').PackedKey}
     */
    let lastKeys = [[-1], 0, {}];
    let lastKeysTime = 0;

    /**
     * @param {android.graphics.Canvas} canvas 
     */
    this.draw = function (canvas) {
        //empty
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        if (keyPositions == null) {
            return;
        }
        if (internalState != PlayerStates.PLAYING) return; // FIXME: 正确实现暂停功能

        let now = new Date().getTime();

        //1. Decide which keys to process
        let activeKeys = [];
        let nextTime = now - lastKeysTime + lastKeys[1] + lookAheadTime;
        for (let i = position; i < keyTimeList.length; i++) {
            let keys = keyTimeList[i];
            //@ts-ignore
            if (keys[1] > nextTime) {
                break;
            }
            activeKeys.push(keys);
        }

        //2. Draw a gray solid circle for all the keys as a background
        for (let i = 0; i < keyPositions.length; i++) {
            let pos = keyPositions[i];
            paint.setARGB(48, 0, 0, 0);
            paint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(pos[0], pos[1], keyRadius, paint);
            //+ Draw a white circle on the outside
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(4);
            paint.setARGB(255, 255, 255, 255);
            canvas.drawCircle(pos[0], pos[1], keyRadius, paint);
        }

        //3. Draw a hollow circle for the button you want to process. The next set of keys is yellow, and the others are gray
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(5);
        for (let i = 0; i < activeKeys.length; i++) {
            let keys = activeKeys[i];
            let deltaTime = keys[1] - lastKeys[1];
            let radiusFactor = 1 - (lastKeysTime + deltaTime - now) / lookAheadTime;
            let startRadius = drawRingOutside ? keyRadius * 2 : keyRadius;
            let endRadius = drawRingOutside ? keyRadius : 0;
            if (radiusFactor > 1) radiusFactor = 1;
            if (radiusFactor < 0) radiusFactor = 0;
            for (let j = 0; j < keys[0].length; j++) {
                let pos = keyPositions[keys[0][j]];
                if (i == 0) {
                    paint.setARGB(255, 255, 255, 64);
                } else {
                    paint.setARGB(220, 255, 255, 255);
                }
                canvas.drawCircle(pos[0], pos[1], startRadius + (endRadius - startRadius) * radiusFactor, paint);
            }
        }

        //4. Draw a curve between the before and after sets of buttons
        let fromKey = lastKeys[0].reduce((a, b) => keyOrder.get(a) > keyOrder.get(b) ? a : b);
        if (activeKeys.length > 0 && fromKey != -1) {
            let toKeys = []
            if (drawLineToEachNextKeys) {
                toKeys = activeKeys[0][0];
            } else {
                toKeys = [activeKeys[0][0].reduce((a, b) => keyOrder.get(a) > keyOrder.get(b) ? a : b)];
            }
            let deltaTime = activeKeys[0][1] - lastKeys[1];
            let progress = (now - lastKeysTime) / deltaTime;
            if (progress > 1) progress = 1;
            if (progress < 0) progress = 0;
            progress = easeInOutSine(progress);
            const haveSameKey = toKeys.includes(fromKey);
            for (let toKey of toKeys) {
                if (toKey != -1) {
                    let fromPos = keyPositions[fromKey];
                    let toPos = keyPositions[toKey];
                    paint.setARGB(255, 255, 255, 255);
                    paint.setStyle(Paint.Style.STROKE);
                    paint.setStrokeWidth(4);
                    drawCurveLine(canvas, paint, fromPos, toPos, 0.5);
                    // If two sets of keys contain the same key, don't draw a moving triangle (confusing)
                    if (!haveSameKey) {
                        let starPos = getPointOnCurve(fromPos, toPos, progress, 0.5);
                        paint.setStyle(Paint.Style.FILL);
                        drawFilledTriangle(canvas, paint, starPos, keyRadius / 3);
                    }
                    //If the two sets of keys are the same, draw a five-pointed star (triangle) inside the buttons.
                    if (toKey == fromKey) {
                        let starPos = keyPositions[fromKey];
                        paint.setStyle(Paint.Style.FILL);
                        drawFilledTriangle(canvas, paint, starPos, keyRadius / 3);
                    }
                }
            }
        }

        // 5. Draw a light curve for the next set of keys on the next set of keys
        if (drawLineToNextNextKey && activeKeys.length > 1) {
            let fromKey = activeKeys[0][0].reduce((a, b) => keyOrder.get(a) > keyOrder.get(b) ? a : b);
            let toKey = activeKeys[1][0].reduce((a, b) => keyOrder.get(a) > keyOrder.get(b) ? a : b);
            if (fromKey != -1 && toKey != -1) {
                let fromPos = keyPositions[fromKey];
                let toPos = keyPositions[toKey];
                let deltaTime = activeKeys[0][1] - lastKeys[1];
                let progress = (now - lastKeysTime) / deltaTime;
                if (progress > 1) progress = 1;
                if (progress < 0) progress = 0;
                paint.setARGB(128, 255, 255, 255);
                paint.setStyle(Paint.Style.STROKE);
                paint.setStrokeWidth(4);
                drawPartialCurveLine(canvas, paint, fromPos, toPos, 0.5, progress);
            }
        }
    }
}
module.exports = {
    SimpleInstructPlayerImpl,
    SkyCotlLikeInstructPlayerImpl
}
