/**
 * Calibrate the layout
 * @param {string} promptText Prompt text
 * @param {import("../gameProfile").pos2d[]} normalizedPos Normalized reference coordinates
 * @param {import("../gameProfile").KeyLocatorType} [type] The key positioning type is currently only implemented in the upper left and lower right, and the default is upper left and lower right
 * @returns {import("../gameProfile").pos2dPair[] | null} The resulting anchor coordinates will return null if the operation is terminated
 */
function calibrateLayout(promptText, normalizedPos, type) {
    if (type == null) {
        type = "LOCATOR_LEFT_TOP";
    }
    if (type != "LOCATOR_LEFT_TOP") {
        throw new Error("Unsupported targeting types: " + type);
    }
    let deviceWidth = context.getResources().getDisplayMetrics().widthPixels;
    let deviceHeight = context.getResources().getDisplayMetrics().heightPixels;

    // The initial position is at 1/4 and 3/4 of the screen
    let pos1 = [deviceWidth / 4, deviceHeight / 4];  // Top left
    let pos2 = [deviceWidth * 3 / 4, deviceHeight * 3 / 4];  // Bottom right

    let dragging1 = false;
    let dragging2 = false;
    let confirmed = false;
    let aborted = false;  // Add a termination flag

    // A full-screen drawing window
    let fullScreenWindow = floaty.rawWindow(<canvas id="canv" w="*" h="*" />);
    fullScreenWindow.setTouchable(true);
    fullScreenWindow.setSize(-1, -1);

    // Touch event handling
    fullScreenWindow.canv.setOnTouchListener(function (v, evt) {
        let x = parseInt(evt.getRawX());
        let y = parseInt(evt.getRawY());

        if (evt.getAction() == evt.ACTION_DOWN) {
            // Check to see if the anchor is clicked
            if (distance([x, y], pos1) < 50) {
                dragging1 = true;
            } else if (distance([x, y], pos2) < 50) {
                dragging2 = true;
            }
        } else if (evt.getAction() == evt.ACTION_MOVE) {
            // Update the position of the point being dragged while making sure pos2 is at the bottom right of pos1
            if (dragging1) {
                // pos1 cannot be moved to the bottom right of pos2
                x = Math.min(x, pos2[0]);
                y = Math.min(y, pos2[1]);
                pos1 = [x, y];
            } else if (dragging2) {
                // pos2 cannot be moved to the top left of pos1
                x = Math.max(x, pos1[0]);
                y = Math.max(y, pos1[1]);
                pos2 = [x, y];
            }
        } else if (evt.getAction() == evt.ACTION_UP) {
            dragging1 = false;
            dragging2 = false;
        }
        return true;
    });

    // Draw functions
    fullScreenWindow.canv.on("draw", function (canvas) {
        const Paint = android.graphics.Paint;
        const Color = android.graphics.Color;
        const PorterDuff = android.graphics.PorterDuff;

        let paint = new Paint();
        canvas.drawColor(Color.parseColor("#3f000000"), PorterDuff.Mode.SRC);

        // If it has been terminated, it is not drawn
        if (aborted) {
            return;
        }

        // Draw a rectangular box
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(2);
        paint.setARGB(255, 255, 255, 255);
        canvas.drawRect(
            Math.min(pos1[0], pos2[0]),
            Math.min(pos1[1], pos2[1]),
            Math.max(pos1[0], pos2[0]),
            Math.max(pos1[1], pos2[1]),
            paint
        );

        // Draw two anchor points
        let drawLocatorPoint = function (x, y, text) {
            // Black bezel
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(5);
            paint.setARGB(255, 0, 0, 0);
            canvas.drawCircle(x, y, 32, paint);

            // Yellow middle circle
            paint.setStrokeWidth(3);
            paint.setARGB(255, 255, 255, 0);
            canvas.drawCircle(x, y, 30, paint);

            // Black inner ring
            paint.setStyle(Paint.Style.FILL);
            paint.setARGB(255, 0, 0, 0);
            canvas.drawCircle(x, y, 22, paint);

            // Yellow filling
            paint.setARGB(180, 255, 255, 0);
            canvas.drawCircle(x, y, 20, paint);

            // Text with black strokes
            paint.setTextSize(30);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(4);
            paint.setARGB(255, 0, 0, 0);
            canvas.drawText(text, x - 40, y - 40, paint);

            // Text white fill
            paint.setStyle(Paint.Style.FILL);
            paint.setARGB(255, 255, 255, 255);
            canvas.drawText(text, x - 40, y - 40, paint);
        };

        drawLocatorPoint(pos1[0], pos1[1], "左上");
        drawLocatorPoint(pos2[0], pos2[1], "右下");

        // Draw a reference point
        let drawReferencePoint = function (x, y, index) {
            // Cross with white bezel
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(5);
            paint.setARGB(255, 255, 255, 255);
            let size = 15;
            canvas.drawLine(x - size - 2, y, x + size + 2, y, paint);
            canvas.drawLine(x, y - size - 2, x, y + size + 2, paint);

            // Blue inner ring cross
            paint.setStrokeWidth(3);
            paint.setARGB(255, 50, 50, 255);
            canvas.drawLine(x - size, y, x + size, y, paint);
            canvas.drawLine(x, y - size, x, y + size, paint);

            // White bezel
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(3);
            paint.setARGB(255, 255, 255, 255);
            canvas.drawCircle(x, y, 7, paint);

            // Blue filling
            paint.setStyle(Paint.Style.FILL);
            paint.setARGB(255, 50, 50, 255);
            canvas.drawCircle(x, y, 5, paint);

            // Serial number black stroke
            paint.setTextSize(25);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(4);
            paint.setARGB(255, 0, 0, 0);
            canvas.drawText((index + 1).toString(), x + 15, y + 15, paint);

            // The serial number is filled in white
            paint.setStyle(Paint.Style.FILL);
            paint.setARGB(255, 255, 255, 255);
            canvas.drawText((index + 1).toString(), x + 15, y + 15, paint);
        };

        for (let i = 0; i < normalizedPos.length; i++) {
            let realPos = normalizedToReal(normalizedPos[i], pos1, pos2);
            drawReferencePoint(realPos[0], realPos[1], i);
        }
    });

    // Prompt and Confirm button window
    let confirmWindow = floaty.rawWindow(
        <frame gravity="left|top">
            <vertical bg="#7fffff7f">
                <text id="promptText" text="" textSize="14sp" />
                <button id="confirmBtn" style="Widget.AppCompat.Button.Colored" text="确定" />
                <button id="resetBtn" style="Widget.AppCompat.Button.Colored" text="复原" />
                <button id="abortBtn" style="Widget.AppCompat.Button.Colored" text="终止" />
            </vertical>
        </frame>
    );
    confirmWindow.setPosition(deviceWidth / 3, 0);
    confirmWindow.setTouchable(true);

    // button events
    ui.run(() => {
        confirmWindow.promptText.setText(promptText);
        confirmWindow.confirmBtn.click(() => {
            confirmed = true;
        });
        confirmWindow.resetBtn.click(() => {
            // Reset the location
            pos1 = [deviceWidth / 4, deviceHeight / 4];
            pos2 = [deviceWidth * 3 / 4, deviceHeight * 3 / 4];
        });
        confirmWindow.abortBtn.click(() => {
            // Terminate the calibration
            aborted = true;  // Set the termination flag first
            confirmed = true;
        });
    });

    // Wait for confirmation
    while (!confirmed) {
        sleep(100);
    }

    fullScreenWindow.close();
    confirmWindow.close();

    // If the operation is terminated, null is returned
    if (aborted) {
        return null;
    }

    return [pos1, pos2];
}

// Calculate the distance between two points
function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

// Converts normalized coordinates to actual coordinates
function normalizedToReal(nPos, pos1, pos2) {
    let x = pos1[0] + (pos2[0] - pos1[0]) * nPos[0];
    let y = pos1[1] + (pos2[1] - pos1[1]) * nPos[1];
    return [x, y];
}

module.exports = calibrateLayout;
