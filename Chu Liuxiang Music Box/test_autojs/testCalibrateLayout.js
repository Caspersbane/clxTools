// Test the calibration layout function
const calibrateLayout = require("../src/ui/calibrateLayout.js");

// Normalized coordinate points for testing
const testPoints = [
    [0.5, 0.5],    // center
    [0, 0],        // Top left
    [1, 0],        // Top right corner
    [0, 1],        // Bottom left
    [1, 1],        // Bottom right
    [0.25, 0.25],  // Top left 1/4
    [0.75, 0.75]   // Bottom right 3/4
];

// Run the test
function runTest() {
    console.log("Start testing calibrateLayout");
    console.log("Test points:", testPoints);

    // Call the calibration function
    let result = calibrateLayout(
        "Adjust the anchor position\n Reference points include:: Center point, four corners, and two 1/4 points",
        testPoints
    );

    // Display the results
    console.log("Calibration results:");
    console.log("Top left:", result.pos1);
    console.log("Bottom right point:", result.pos2);
}

// Perform the test
runTest();
