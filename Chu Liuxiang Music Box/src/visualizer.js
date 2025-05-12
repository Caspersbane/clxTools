
function Visualizer() {

    const mergeThreshold = 0.01; //seconds, which is consistent with the value in the main.js

    var mergedNoteData = [];
    var row = 0;
    var col = 0;
    var boardRow = 3;
    var boardCol = 5;
    var step = 0;
    var lastStep = -1;
    var lastFirstKeyIndex = -2;

    var keysBitmap = null;
    var backgroundBitmap = null;

    /**
     * Load the song data
     * @param {Array<import("./noteUtils.js").PackedKey>} data Song data [[key number (from 0)],...], Time[s]]
     */
    this.loadNoteData = function (data) {
        mergedNoteData = data.slice();
    }


    /**
     * Set the button arrangement
     * @param {number} row_ Number of rows
     * @param {number} col_ Number of columns
     */
    this.setKeyLayout = function (row_, col_) {
        row = row_;
        col = col_;
    }

    /**
     * Next button
     */
    this.next = function () {
        lastStep = step;
        step++;
    }

    /**
     * Switch to the specified key
     * @param {number} step_ serial number
     */
    this.goto = function (step_) {
        if (lastStep == step_ - 1) {
            //If it's the next button, go straight to next
            this.next();
            return;
        }
        step = step_;
        lastStep = Math.max(step - 1, 0);
        lastFirstKeyIndex = -2;
    }


    /**
     * Draw buttons
     * @param {android.graphics.Canvas} canvas 画布
     */
    this.drawKeys = function (canvas) {
        let paint = new Paint(); //android.graphics.Paint
        paint.setStyle(Paint.Style.FILL);
        //Calculate the size of the board // rectangle
        let boardWidth = canvas.getWidth() / boardCol;
        let boardHeight = canvas.getHeight() / boardRow;
        // console.log("board size: " + boardWidth + "x" + boardHeight +" row: "+boardRow+" col: "+boardCol);
        //Calculate the size of the keys // circle, with a spacing of 1.4 times the diameter of the keys
        let keyDiameter = Math.min(boardWidth / ((col + 1) * 1.4), boardHeight / ((row + 1) * 1.4));
        let keyRadius = keyDiameter / 2;
        let keySpacingX = boardWidth / (col + 1);
        let keySpacingY = boardHeight / (row + 1);
        let drawStep = Math.max(0, step);

        //The first board corresponds to that button
        let firstKeyIndex = Math.floor(drawStep / (boardRow * boardCol)) * boardRow * boardCol;
        //Draw the picture one by one
        for (let i = 0; i < boardRow; i++) {
            for (let j = 0; j < boardCol; j++) {
                //Calculates the position of the current picture
                let x = j * boardWidth;
                let y = i * boardHeight;

                //Calculates the keys of the current screen
                let currentKeyIndex = firstKeyIndex + i * boardCol + j;
                if (currentKeyIndex >= mergedNoteData.length) {
                    break;
                }
                let currentKeys = mergedNoteData[currentKeyIndex][0];

                //Draw buttons
                for (let k = 0; k < row; k++) {
                    for (let l = 0; l < col; l++) {
                        let keyX = x + keySpacingX * (l + 1);
                        let keyY = y + keySpacingY * (row - k);
                        if (currentKeys.includes(k * col + l)) {
                            //pressed keys
                            paint.setARGB(192, 127, 255, 0);
                        } else {
                            //Unpressed keys, gray
                            paint.setARGB(192, 128, 128, 128);
                        }
                        //Rounded rectangle
                        canvas.drawRoundRect(keyX - keyRadius, keyY - keyRadius, keyX + keyRadius, keyY + keyRadius, 3, 3, paint);
                    }
                }
                //Draw the number
                paint.setARGB(128, 255, 255, 255);
                paint.setTextSize(20);
                canvas.drawText(i * boardCol + j + firstKeyIndex, x + 10, y + 30, paint);
            }
        }
    }

    /**
     * Draw the background
     * @param {android.graphics.Canvas} canvas canvas
     */
    this.drawBackground = function (canvas) {
        let paint = new Paint(); //android.graphics.Paint
        paint.setStyle(Paint.Style.FILL);
        //Calculate the size of the board // rectangle
        let boardWidth = canvas.getWidth() / boardCol;
        let boardHeight = canvas.getHeight() / boardRow;
        let drawStep = Math.max(0, step);

        //The first board corresponds to that button
        let firstKeyIndex = Math.floor(drawStep / (boardRow * boardCol)) * boardRow * boardCol;
        //Draw the picture one by one
        for (let i = 0; i < boardRow; i++) {
            for (let j = 0; j < boardCol; j++) {
                //Calculates the position of the current picture
                let x = j * boardWidth;
                let y = i * boardHeight;

                //Determine the color
                if (i * boardCol + j + firstKeyIndex == drawStep) {
                    //Current screen, white
                    paint.setARGB(80, 255, 255, 255);
                } else {
                    //"Not Current" screen, gray
                    paint.setARGB(80, 128, 128, 128);
                }

                //Draw the picture
                canvas.drawRect(x, y, x + boardWidth, y + boardHeight, paint);
            }
        }
    }

    /**
     * painting!
     * @param {android.graphics.Canvas} canvas canvas
     */
    this.draw = function (canvas) {
        let Color = android.graphics.Color;
        let PorterDuff = android.graphics.PorterDuff;
        //Create a bitmap
        if (keysBitmap == null || keysBitmap.getWidth() != canvas.getWidth() || keysBitmap.getHeight() != canvas.getHeight()) {
            keysBitmap = android.graphics.Bitmap.createBitmap(canvas.getWidth(), canvas.getHeight(), android.graphics.Bitmap.Config.ARGB_8888);
            //Force repaint
            lastStep = -2;
            console.log("create keysBitmap: " + keysBitmap.getWidth() + "x" + keysBitmap.getHeight());
        }
        if (backgroundBitmap == null || backgroundBitmap.getWidth() != canvas.getWidth() || backgroundBitmap.getHeight() != canvas.getHeight()) {
            backgroundBitmap = android.graphics.Bitmap.createBitmap(canvas.getWidth(), canvas.getHeight(), android.graphics.Bitmap.Config.ARGB_8888);
            //Force repaint
            lastFirstKeyIndex = -2;
            console.log("create backgroundBitmap: " + backgroundBitmap.getWidth() + "x" + backgroundBitmap.getHeight());
        }

        if (lastStep != step) {
            //If the step changes, the background is redrawn
            let backgroundCanvas = new Canvas(backgroundBitmap);
            //Clear the canvas
            backgroundCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
            this.drawBackground(backgroundCanvas);
            lastStep = step;

            let firstKeyIndex = Math.floor(step / (boardRow * boardCol)) * boardRow * boardCol;
            if (firstKeyIndex != lastFirstKeyIndex) {
                //If the first button changes, the key is redrawn
                let keysCanvas = new Canvas(keysBitmap);
                //Clear the canvas
                keysCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
                this.drawKeys(keysCanvas);
                lastFirstKeyIndex = firstKeyIndex;
            }
        }
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        canvas.drawBitmap(backgroundBitmap, 0, 0, null);
        canvas.drawBitmap(keysBitmap, 0, 0, null);
    }
}


console.log("Visualizer.js loaded");

module.exports = Visualizer;