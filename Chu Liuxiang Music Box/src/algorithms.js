//@ts-check
//algorithms.js 

function Algorithms() {
    /**
     * Pseudo-random number generator
     * @param {number} seed_
     * @returns {function():number} 
     */
    this.PRNG = function (seed_) {
        var seed = 0x2F6E2B1;
        if (seed_ != undefined) {
            seed = seed_;
        }
        return function () {
            // Robert Jenkins’ 32 bit integer hash function
            seed = ((seed + 0x7ED55D16) + (seed << 12)) & 0xFFFFFFFF;
            seed = ((seed ^ 0xC761C23C) ^ (seed >>> 19)) & 0xFFFFFFFF;
            seed = ((seed + 0x165667B1) + (seed << 5)) & 0xFFFFFFFF;
            seed = ((seed + 0xD3A2646C) ^ (seed << 9)) & 0xFFFFFFFF;
            seed = ((seed + 0xFD7046C5) + (seed << 3)) & 0xFFFFFFFF;
            seed = ((seed ^ 0xB55A4F09) ^ (seed >>> 16)) & 0xFFFFFFFF;
            return (seed & 0xFFFFFFF) / 0x10000000;
        };
    };

    /**
     * @brief Shuffle the algorithm, randomly shuffling the array
     * @param {Array} array Arrays to scramble
     * @param {function():number} randomFunc Random number generator
     * @returns {Array} Array after scrambling
     */
    this.shuffle = function (array, randomFunc) {
        var i = array.length, j, temp;
        if (i == 0) return array;
        while (--i) {
            j = Math.floor(randomFunc() * (i + 1));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
}

module.exports = Algorithms;