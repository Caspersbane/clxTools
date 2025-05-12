/*
 * @Author: Daqi
 * @QQ: 531310591@qq.com
 * @Date: 2021-04-18 04:22:51
 * @Version: Auto.Js Pro
 * @Description: Hover button module entrance
 * @LastEditors: Daqi
 * @LastEditTime: 2021-04-19 16:44:52
 */

let FloatButton = function () {
    require('./widget/RoundButton');
    let fbUtil = require('./js/init');
    let CreateRoundButtonView = require('./js/CreateRoundButtonView');
    let Anim = require('./js/Anim');
    let mAnim;
    let mWindows = { logo: null, menu: null };
    let mMenuViews = {};
    let mViewUtils = {};
    let mItemsXY = [];
    let mActions = new Array();
    let [w, h] = [device.width, device.height];

    let mConfig = {};
    mConfig.y = 0.2;
    mConfig.size = fbUtil.dp2px(40);
    mConfig.tint = '#00000000';
    mConfig.color = '#FFFFFF';
    mConfig.isInit = false;
    mConfig.isShow = false;
    mConfig.padding = fbUtil.dp2px(8);
    mConfig.logoAlpha = 0.7;
    mConfig.isMenuOpen = false;
    mConfig.isOrientation = fbUtil.isHorizontalScreen();
    mConfig.menuRadius = fbUtil.dp2px(80);
    mConfig.timer = null;
    //animation
    mConfig.anim = {};
    //state
    mConfig.state = {};
    mConfig.state.anim = false;
    mConfig.state.menuOpen = false;
    mConfig.state.direction = false;
    mConfig.state.orientation = fbUtil.isHorizontalScreen();
    //onevent
    mConfig.eventActions = {};
    mConfig.eventActions.show = new Function();//Displays the event
    mConfig.eventActions.hide = new Function();//Hide events
    mConfig.eventActions.close = new Function();//Close the event
    mConfig.eventActions.item_click = new Function();//Click Events
    mConfig.eventActions.direction_changed = new Function();//Docking direction change event
    mConfig.eventActions.menu_state_changed = new Function();//Menu state change events
    mConfig.eventActions.orientation_changed = new Function();//Screen orientation change events
    //Time
    mConfig.time = {};
    mConfig.time.menu = 210;//Menu animation time
    mConfig.time.show = 500;//logo Displays the animation time
    mConfig.time.direction = 350;//Docking animation time
    mConfig.time.buttonAnim = 210;//button to toggle the animation time
    mConfig.time.autoCloseMenu = 0;//The menu automatically closes the time


    function FloatButton() {
        mAnim = new Anim(this);
        mConfig.anim.stateChanged = mAnim.stateChanged;

        //The listener is initialized
        new ObjectDefinePro(mConfig, 'isInit', (value) => {
            if (value) {
                for (action of mActions) action();
                mActions = [];
            }
        });

        new ObjectDefinePro(mConfig, 'isShow', (value) => {
            mConfig.eventActions[value ? 'show' : 'hide'](value);
        });

        //Listen for changes in Size
        new ObjectDefinePro(mConfig, 'size', (value) => {
            postAction(() => {
                for (key in mViewUtils) mViewUtils[key].setSize(value);
                updateItemCoordinate();//Update the coordinates
                updateMenuWindow();
            });
        });

        //Listen for padding changes
        new ObjectDefinePro(mConfig, 'padding', (value) => {
            postAction(() => { for (key in mViewUtils) mViewUtils[key].setPadding(value) });
        });

        new ObjectDefinePro(mConfig.state, 'menuOpen', value => {
            mAnim.menu(value);
            mConfig.eventActions.menu_state_changed(value);
        });

        // //Listen for changes in the direction of the left and right docks
        new ObjectDefinePro(mConfig.state, 'direction', value => {
            mConfig.eventActions.direction_changed(value);
        });

        //Listen for the screen orientation to change
        new ObjectDefinePro(mConfig.state, 'orientation', value => {
            if (mConfig.isOrientation == value) return;
            mConfig.isOrientation = value;
            postAction(() => {
                if (mConfig.state.menuOpen) {
                    mConfig.state.menuOpen = false;
                }
                if (value) {
                    [w, h] = [device.height, device.width];
                } else {
                    [w, h] = [device.width, device.height];
                }
                updateLogoWindow();
                updateMenuWindow();
            });
            mConfig.eventActions.orientation_changed(value);
        });

        //initializeFloatButton
        initFloatButton();
    }

    FloatButton.prototype.setIcon = function (value) {
        postAction(() => mViewUtils.logo.setIcon(value));
    }

    FloatButton.prototype.setTint = function (value) {
        postAction(() => mViewUtils.logo.setTint(value));
    }

    FloatButton.prototype.setColor = function (value) {
        postAction(() => mViewUtils.logo.setColor(value));
    }

    FloatButton.prototype.addItem = function (name) {
        let viewUtil = new CreateRoundButtonView(name, mConfig);//Create a view
        mViewUtils[name] = viewUtil;//Save the utility class to the collection
        mMenuViews[name] = viewUtil.getView();//Save view information to a collection
        postAction(() => {
            mWindows.menu.content.addView(mMenuViews[name]);//Add a view
            updateItemCoordinate();//Update the coordinates
            updateMenuWindow();//Update the overlay
            mAnim.createAnim(mItemsXY, mMenuViews);//Create animations
        });
        return viewUtil;
    }

    FloatButton.prototype.on = function (eventType, eventAction) {
        mConfig.eventActions[eventType] = eventAction;
    }

    FloatButton.prototype.setAllButtonSize = function (dp) {
        mConfig.size = fbUtil.dp2px(dp);
    }

    FloatButton.prototype.setAllButtonPadding = function (dp) {
        mConfig.padding = fbUtil.dp2px(dp);
    }

    FloatButton.prototype.setMenuRadius = function (dp) {
        mConfig.menuRadius = fbUtil.dp2px(dp);
        postAction(() => { updateMenuWindow(); updateItemCoordinate() });
    }

    FloatButton.prototype.getConfig = function () {
        return mConfig;
    };


    FloatButton.prototype.show = function (action) {
        action = action || new Function();
        if (mConfig.isShow) {
            action();
            return;
        }
        postAction(() => mAnim.show(action));
    }

    FloatButton.prototype.hide = function (action) {
        if (!mConfig.isShow) {
            action();
            return;
        }
        postAction(() => mAnim.hide(action));
    }

    FloatButton.prototype.init = function () {
        if (mConfig.isInit) {
            toastLog('Do not repeat initialization!');
            return;
        }
        initFloatButton();
    }

    FloatButton.prototype.close = function () {
        if (mConfig.isInit) {
            for (key in mWindows) {
                mWindows[key].close();
            }
            mConfig.isInit = false;
        }
    }

    FloatButton.prototype.getWindow = function (name) {
        return mWindows[name];
    }

    FloatButton.prototype.getView = function (name) {
        return mViewUtils[name].getView();
    }

    FloatButton.prototype.getWidth = function () {
        return w;
    }

    FloatButton.prototype.getHeight = function () {
        return h;
    }

    FloatButton.prototype.getViewUtil = function (name) {
        return mViewUtils[name] || null;
    }

    FloatButton.prototype.setAutoCloseMenuTime = function (value) {
        if (value <= 0) {
            mConfig.time.autoCloseMenu = 0;
        } else if (parseInt(value) < 2000) {
            mConfig.time.autoCloseMenu = 2000;
        } else {
            mConfig.time.autoCloseMenu = parseInt(value);
        }
    }

    FloatButton.prototype.setMenuOpen = function (value, action) {
        action = action || new Function();
        if (!mConfig.isShow) {
            action(false);
            return;
        }
        action(true);
        mConfig.state.menuOpen = value;
    }


    function initFloatButton() {
        if (mConfig.isInit) return;
        mWindows.logo = null;
        mWindows.menu = null;
        ui.isUiThread() ? threads.start(initWindow) : initWindow();
    }

    //Initialize the floating window
    function initWindow() {
        mWindows.menu = floaty.rawWindow(<frame id='content' w='*' h='*' visibility='invisible' />);
        mWindows.logo = floaty.rawWindow(<frame id='content' w='auto' h='auto' />);
        //Fixed an error message for updating the LayoutParams overlay
        ui.run(() => {
            mWindows.logo.setSize(-2, -2);
            mWindows.menu.setSize(-2, -2);
            mWindows.logo.setTouchable(false);
            mWindows.menu.setTouchable(false);
            mViewUtils.logo = new CreateRoundButtonView('logo', mConfig);
            mViewUtils.logo.setSize(mConfig.size);
            mViewUtils.logo.setPadding(mConfig.padding);
            mWindows.logo.content.addView(mViewUtils.logo.getView());
            mViewUtils.logo.getView().attr('alpha', mConfig.logoAlpha);
            let mx = (mConfig.state.direction ? mConfig.size : -mConfig.size);
            mViewUtils.logo.getView().setTranslationX(mx);
        });
        //The logo overlay has been updated
        updateLogoWindow();
        createTouchListener(mWindows.logo);
        //Initialization is complete
        //Timer Listens for screen rotation
        //Broadcast is not available in 7.4.1
        setInterval(() => {
            mConfig.state.orientation = fbUtil.isHorizontalScreen();
        }, 500);
        mConfig.isInit = true;
    }

    //Updated the logo overlay
    function updateLogoWindow() {
        mConfig.state.orientation = fbUtil.isHorizontalScreen();
        let x = (mConfig.state.direction ? w - mConfig.size + mConfig.padding : -mConfig.padding);
        let y = parseInt(h * mConfig.y - mConfig.size / 2);
        mWindows.logo.setPosition(x, y);
    }

    //Updated the Menu overlay
    function updateMenuWindow() {
        let lw = mWindows.logo;
        let size = mConfig.size / 2;
        let [w1, y1] = [mWindows.menu.getWidth(), lw.getY()];
        let x = (mConfig.state.direction ? w - w1 - size + mConfig.padding : -mConfig.padding + size);
        let y = y1 - mConfig.menuRadius;
        let mGravity = 'center_vertical' + (mConfig.state.direction ? '|right' : '');
        ui.run(() => {
            let view;
            for (i in mMenuViews) {
                view = mMenuViews[i];
                view.attr('layout_gravity', mGravity)
            }
        });
        mWindows.menu.setPosition(x, y);
    }

    //Update the item coordinates
    function updateItemCoordinate() {
        mItemsXY = [];
        let arr = { x: [], y: [] };
        let len = Object.keys(mMenuViews).length
        let angle = 360 / (len * 2 - 2);
        let degree, value, x, y;
        let mr = mConfig.menuRadius;
        for (i = 0; i < 2; i++) {
            degree = 0;
            arr.x[i] = [];
            arr.y[i] = [];
            for (e = 0; e < len; e++) {
                value = Math.PI * 2 / 360 * (degree - 90);
                x = parseInt(0 + Math.cos(value) * mr);
                y = parseInt(0 + Math.sin(value) * mr);
                arr.x[i][e] = (Math.abs(x) < 10 ? 0 : x);
                arr.y[i][e] = (Math.abs(y) < 10 ? 0 : y);
                i ? degree += angle : degree -= angle;
            }
        }
        mItemsXY = arr;
        mWindows.menu.setSize(mr + mConfig.size, mr * 2 + mConfig.size);
    }

    function ObjectDefinePro(obj, key, action) {
        var mValue = obj[key];
        Object.defineProperty(obj, key, {
            get: function () {
                return mValue;
            },
            set: function (newval) {
                mValue = newval;
                action(newval);
            }
        })
    }

    function postAction(action) {
        mConfig.isInit ? ui.run(action) : mActions.push(() => ui.run(action));
    }

    function createTouchListener(win) {
        let x, y, x1, y1, winX, winY, isMove = false;
        mViewUtils.logo.getView().setOnTouchListener(function (view, event) {
            if (mConfig.state.anim) return true;
            switch (event.getAction()) {
                case event.ACTION_DOWN:
                    isMove = false;
                    x = event.getRawX();
                    y = event.getRawY();
                    winX = win.getX();
                    winY = win.getY();
                    return true;
                case event.ACTION_MOVE:
                    if (!isMove) {
                        if (Math.abs(event.getRawX() - x) > 30 || Math.abs(event.getRawY() - y) > 30) {
                            view.attr('alpha', 1);
                            isMove = true;
                        }
                    } else if (!mConfig.isMenuOpen) {
                        x1 = winX + (event.getRawX() - x);
                        win.setPosition(x1, winY + (event.getRawY() - y));
                    }
                    return true;
                case event.ACTION_UP:
                    if (mConfig.state.anim) return true;
                    if (!isMove) {
                        mConfig.state.menuOpen = !mConfig.state.menuOpen;
                    } else if (!mConfig.isMenuOpen) {
                        mConfig.state.direction = (winX + (event.getRawX() - x) > (w / 2) - (mConfig.size / 2))
                        mAnim.direction(win.getX(), win.getY(), updateMenuWindow);
                    }
                    if (isMove) updateMenuWindow();
                    isMove = false;
                    return true;
            }
            return true;
        });
    }

    return FloatButton;
}();

module.exports = FloatButton;