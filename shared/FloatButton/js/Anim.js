/*
 * @Author: Daqi
 * @QQ: 531310591@qq.com
 * @Date: 2021-04-18 06:14:13
 * @Version: Auto.Js Pro
 * @Description: Animation module
 * @LastEditors: Daqi
 * @LastEditTime: 2021-04-19 16:51:34
 */

function Anim(gd) {
    let fb = gd;
    let data = fb.getConfig();
    let mAnimList = { left: [], right: [] };
    let resources = resources = context.getResources();
    let status_bar_height = resources.getDimensionPixelSize(resources.getIdentifier("status_bar_height", "dimen", "android"));

    //Animation methods
    importClass(android.animation.ValueAnimator)
    importClass(android.animation.ObjectAnimator);
    importClass(android.animation.AnimatorSet);
    importClass(android.view.animation.BounceInterpolator);
    int = (n, v, a) => { return ObjectAnimator.ofInt(v, n, colors.parseColor(a[0]), colors.parseColor(a[1])) };
    tx = (v, a) => { return ObjectAnimator.ofFloat(v, "translationX", a) };
    ty = (v, a) => { return ObjectAnimator.ofFloat(v, "translationY", a) };
    tz = (v, a) => { return ObjectAnimator.ofFloat(v, "translationZ", a) };
    ap = (v, a) => { return ObjectAnimator.ofFloat(v, "alpha", a) };
    sx = (v, a) => { return ObjectAnimator.ofFloat(v, "scaleX", a) };
    sy = (v, a) => { return ObjectAnimator.ofFloat(v, "scaleY", a) };
    pt = (a, t, d) => { let s = new AnimatorSet(); s.playTogether(a); s.setStartDelay(d = d || 0); s.setDuration(t = t || 300); s.start(); return s; };
    inPt = (s, t, d) => { s.setEvaluator(new android.animation.ArgbEvaluator()); s.setStartDelay(d = d || 0); s.setDuration(t = t || 300); s.start(); return s; };
    al = (a, f) => { a.addListener({ onAnimationEnd: f }) };


    this.show = function (action) {
        action = action || new Function();
        ui.run(() => {
            data.state.anim = true;
            fb.getView('logo').attr("visibility", "visible");
            var mx = data.state.direction ? [data.size, 0] : [-data.size, 0];
            fb.getView('logo').setTranslationX(mx);
            data.isShow = true;
            al(pt([tx(fb.getView('logo'), mx)], data.time.show), () => {
                fb.getWindow('logo').setTouchable(true);
                data.state.anim = false;
                data.isShow = true;
                action()
            })
        });
    }

    this.hide = function (action) {
        let lw = fb.getWindow('logo')
        let t = this;
        let arr;
        let mAction = function () {
            arr = (data.state.direction ? [0, data.size] : [0, -data.size]);
            pt([tx(fb.getView('logo'), arr)], data.time.show);;
            data.isShow = false;
        }
        ui.run(() => {
            lw.setTouchable(false);
            if (data.state.menuOpen) {
                t.menu(!data.state.menuOpen, mAction);
                data.state.menuOpen = false;
            } else {
                mAction();
            }
        });

    }

    /**
     * Dock animation
     * Fix - Hoverball is out of screen when docked
     * @param {*} x 
     * @param {*} y 
     */
    this.direction = function (x, y, action) {
        action = action || new Function();
        data.state.anim = true;
        let d = data.state.direction
        let width = fb.getWidth();
        let x1 = (d ? width - data.size + data.padding : -data.padding);
        let y1 = 0;
        let lw = fb.getWindow('logo');
        let lbv = fb.getView('logo');
        ui.run(() => {
            lbv.attr('alpha', data.logoAlpha);
            let anim = ValueAnimator.ofFloat(0, 1);
            let f;
            let h = fb.getHeight();
            let w = Math.abs(x - x1);

            //Calculate if the Y value is outside the screen
            let isOverstep = null
            if (y < status_bar_height) {
                y1 = Math.abs(y - status_bar_height);
                data.y = (Math.round((y + y1) / h * 100) / 100.00);
                isOverstep = false;
            } else if (lw.getY() > h - data.size) {
                y1 = Math.abs(y - (h - data.size - status_bar_height));
                data.y = (Math.round((y - y1) / h * 100) / 100.00);
                isOverstep = true;
            }
            //动画
            anim.setDuration(data.time.direction);
            anim.setInterpolator(new BounceInterpolator());
            anim.addUpdateListener(new ValueAnimator.AnimatorUpdateListener({
                onAnimationUpdate: (animator) => {
                    f = animator.getAnimatedValue();
                    mx = lw.getX() > x1 ? x - parseInt(w * f) : x + parseInt(w * f);
                    my = (isOverstep == null) ? y : (isOverstep ? y - parseInt(y1 * f) : y + parseInt(y1 * f));
                    lw.setPosition(mx, my);
                    action();
                }
            }));
            anim.addListener({
                onAnimationEnd: function () {
                    data.state.anim = false;
                }
            });
            anim.start();
        });
    }

    //Menu animations
    this.menu = function (value, action) {
        action = action || new Function();
        if (data.isMenuOpen == value || data.state.anim) {
            action();
            return;
        };
        data.state.anim = true;//Turn on animation occupancy to prevent more animations
        let mw = fb.getWindow('menu');
        let lbv = fb.getView('logo');
        ui.run(() => {
            value ? mw.content.attr("visibility", "visible") : mw.setTouchable(false);
            //Remove the timer
            if (data.timer != null) {
                clearTimeout(data.timer);
                data.timer = null;
            };
            lbv.attr('alpha', 1);
            //Gets the collection of animations you want to execute
            let mAnim = mAnimList[data.state.direction ? 'right' : 'left'][value ? 0 : 1];
            al(pt(mAnim, data.time.menu), () => {
                if (value) {
                    mw.setTouchable(true);
                    if (data.time.autoCloseMenu != 0) {
                        data.timer = setTimeout(() => {
                            data.state.menuOpen = false;
                            data.timer = null;
                        }, data.time.autoCloseMenu);
                    }
                } else {
                    lbv.attr('alpha', data.logoAlpha);
                    mw.setTouchable(false);
                    mw.content.attr('visibility', 'invisible');
                }
                data.state.anim = false;
                data.isMenuOpen = value;
                action()
            });
        });
    }

    this.stateChanged = function (state, datas, view) {
        //Enforce animations 
        // data.state.anim = true;
        let e = state ? ['2', '1'] : ['1', '2'];
        let time = data.time.buttonAnim;
        let mColorEvaluator = function (value, colorstr) {
            view.attr("backgroundTint", colorstr);//Change the background coloring
        }
        let mColorEvaluator1 = function (value, colorstr) {
            view.attr("tint", colorstr);//Change the background coloring
        }
        ui.run(() => {
            let mColorAnim = ObjectAnimator.ofObject(view, "color", new ColorEvaluator(true, mColorEvaluator), datas['color' + e[0]], datas['color' + e[1]]);
            let mColorAnim1 = ObjectAnimator.ofObject(view, "color", new ColorEvaluator(true, mColorEvaluator1), datas['tint' + e[0]], datas['tint' + e[1]]);
            var mScaleXAnim = ObjectAnimator.ofFloat(view, "scaleX", [1, 0.7, 1]);
            var mScaleYAnim = ObjectAnimator.ofFloat(view, "scaleY", [1, 0.7, 1]);
            let anims = new AnimatorSet();
            anims.playTogether(mColorAnim, mColorAnim1, mScaleXAnim, mScaleYAnim);
            anims.setDuration(time);
            // anims.addListener({
            //     onAnimationEnd: function () {
            //         data.state.anim = false;
            //     }
            // })
            anims.start();
            setTimeout(() => {
                view.attr('src', datas['icon' + e[1]]);
            }, time / 2);
        });

    }

    //Create animations
    this.createAnim = function (data, views) {
        mAnimList = { left: [], right: [] };
        mAnimList.left[0] = getAnim(1, true);
        mAnimList.left[1] = getAnim(1, false);
        mAnimList.right[0] = getAnim(0, true);
        mAnimList.right[1] = getAnim(0, false);

        function getAnim(e, isShow) {
            let arr = [];
            let value, view;
            for (i in views) {
                view = views[i];
                value = Object.keys(views).indexOf(i);
                arr.push(tx(view, isShow ? [0, data.x[e][value]] : [data.x[e][value], 0]));
                arr.push(ty(view, isShow ? [0, data.y[e][value]] : [data.y[e][value], 0]));
                arr.push(sx(view, isShow ? [0, 1] : [1, 0]));
                arr.push(sy(view, isShow ? [0, 1] : [1, 0]));
            }
            return arr;
        }
    }

    /**
     * Color over-algorithm
     * Reference Links:https://blog.csdn.net/a136447572/article/details/89954075
     */
    function ColorEvaluator(value, action) {
        action = action || new Function();
        let mCurrentRed, mCurrentGreen, mCurrentBlue, mCurrentColor;

        // Write the logic for the object animation transition in evaluate(): This is the logic for writing the color transition
        this.evaluate = function (fraction, startValue, endValue) {
            // Gets the initial and end values of the color
            let startColor = mCurrentColor || startValue;
            let endColor = colors.parseColor(endValue);

            // The initialized color is divided into three parts of RGB by string interception, and the RGB value is converted into decimal numbers
            // Then the value range of each color is 0-255
            let [startRed, startGreen, startBlue] = [colors.red(startColor), colors.green(startColor), colors.blue(startColor)]

            let [endRed, endGreen, endBlue] = [colors.red(endColor), colors.green(endColor), colors.blue(endColor)];

            // Defines the value of the initialized color as the color value that currently needs to be manipulated
            [mCurrentRed, mCurrentGreen, mCurrentBlue] = [startRed, startGreen, startBlue];

            // Calculate the difference between the initial color and the end color
            // This difference determines the speed of the color change: if the initial color value and the end color value are very similar, then the color change will be relatively slow; Otherwise, change is fast
            // The logic of how to determine how fast or slow the color change is based on the difference is written in getCurrentColor().
            var redDiff = Math.abs(startRed - endRed);
            var greenDiff = Math.abs(startGreen - endGreen);
            var blueDiff = Math.abs(startBlue - endBlue);
            var colorDiff = redDiff + greenDiff + blueDiff;

            if (mCurrentRed != endRed) {
                mCurrentRed = getCurrentColor(startRed, endRed, colorDiff, 0, fraction);
            }
            if (mCurrentGreen != endGreen) {
                mCurrentGreen = getCurrentColor(startGreen, endGreen, colorDiff, redDiff, fraction);
            }
            if (mCurrentBlue != endBlue) {
                mCurrentBlue = getCurrentColor(startBlue, endBlue, colorDiff, redDiff + greenDiff, fraction);
            }

            // The calculated value of the current color is assembled and returned
            var color = colors.rgb(mCurrentRed, mCurrentGreen, mCurrentBlue)
            var currentColor = colors.toString(color);
            action(value, currentColor, color, colorStr => { mCurrentColor = colorStr }, fraction);//Execute the callback method
            return currentColor;
        }

        // Specifically, the current color is calculated based on the fraction value.
        function getCurrentColor(startColor, endColor, colorDiff, offset, fraction) {
            var currentColor;
            if (startColor > endColor) {
                currentColor = startColor - parseInt((startColor - endColor) * fraction);
            } else {
                currentColor = startColor + parseInt((endColor - startColor) * fraction);
            }
            return currentColor;
        }
    }

};

module.exports = Anim;