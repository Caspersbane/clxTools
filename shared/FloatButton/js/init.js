/*
 * @Author: Daqi
 * @QQ: 531310591@qq.com
 * @Date: 2021-04-18 04:29:01
 * @Version: Auto.Js Pro
 * @Description: Utilities
 * @LastEditors: Daqi
 * @LastEditTime: 2021-04-19 12:19:14
 */

let mUtil = {};

(function () {
    const scale = context.getResources().getDisplayMetrics().density;
    let config = context.getResources().getConfiguration();
    mUtil.dp2px = dp => Math.floor(dp * scale + 0.5);
    mUtil.px2dp = px => Math.floor(px / scale + 0.5);
    mUtil.isHorizontalScreen = function () {
        let ori = config.orientation;
        if (ori == config.ORIENTATION_LANDSCAPE) {
            //Landscape screen
            return true;
        } else if (ori == config.ORIENTATION_PORTRAIT) {
            //Portrait screen
            return false;
        }
    }
})();

module.exports = mUtil;