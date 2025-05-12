//humanify.js --- Add a disturbance to the music to make it sound more like a human player

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

function Humanify() {
    this.stddev = 200;
    /**
     * @param {number} stddev standard deviation
     * @brief Set the standard deviation
     */
    this.setNoteAbsTimeStdDev = function (stddev) {
        this.stddev = stddev;
    }

    /**
     * @param {import("./noteUtils.js").NoteLike[]} notes Array of songs
     * @brief Add a disturbance to the song to make it sound more like it's played by a human. The processing speed should be fast
     * @return {import("./noteUtils.js").NoteLike[]} An array of songs after the perturbation
     */
    this.humanify = function (notes) {
        var randomizer = new NormalDistributionRandomizer(0, this.stddev);
        for (var i = 0; i < notes.length; i++) {
            notes[i][1] += randomizer.next();
            if (notes[i][1] < 0) notes[i][1] = 0;
        }
        //Reorder
        notes.sort(function (a, b) {
            return a[1] - b[1];
        });
        return notes;
    }
}

module.exports = Humanify;