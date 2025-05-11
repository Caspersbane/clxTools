"ui";

var { requireShared } = require("./src/requireShared.js");

var runtimes = requireShared("runtimes.js");

const Explain the text = "\
1. In order to click the screen and display the playback progress bar, this script requires a floating window, a background pop-up interface and barrier-free permissions. No other permissions are required. The script does not need to be networked and will not collect any data.\n\
2. How to use: Click the button in the lower right corner to open the floating window, cut back to the game, and click the floating window to use it..\n\
3. You can press the volume up key to end the operation at any time.\n\
4. Script production: Chu Liuxiang (A Dream of Jianghu):: Slow Voice:: Xinmu Liuxia:: Li Mango. \n\
5. This script is an open source project, welcome fork, star, issue, pr. \n\
6. Thanks to the framework provided by the author of autoX.js.\n\
\n\
Music storage location: /sdcard/Chu Liuxiang Music Box Data Catalog\n\
"

const Explain the number of lines = Explain the text.split("\n").length;

const projectUrl = "https://github.com/happyme531/clxTools";
const anotherProjectUrl = "https://github.com/happyme531/GenshinImpactPianoExtract";

var isDarkMode = false;
try {
    isDarkMode = (context.getResources().getConfiguration().uiMode & context.getResources().getConfiguration().UI_MODE_NIGHT_MASK) == context.getResources().getConfiguration().UI_MODE_NIGHT_YES;
    console.log("isDarkMode: " + isDarkMode);
} catch (e) {
    console.log(e);
}

ui.layout(
    <frame bg={isDarkMode ? "#000000" : "#ffffff"}>
        <vertical>
            {/* Title column */}
            <appbar>
                <toolbar id="toolbar" title="楚留香音乐盒" />
            </appbar>
            {/* Scroll text description */}
            <ScrollView layout_weight="1" fadeScrollbars="false">
                <text id="text" textSize="16dp" textColor={isDarkMode ? "#ffffff" : "#000000"} text={Explain the text} line={Explain the number of lines} />
            </ScrollView>

            {/* Drag the bar */}
            <text id="barDesc" textSize="16dp" textColor={isDarkMode ? "#ffffff" : "#000000"} text="The size adjustment of the floating window: 36" />
            <seekbar id="seekbar" max="100" progress="36" />

            {/* Bottom bar button */}
            <horizontal>
                <button id="projectLinkBtn" text="打开项目主页" />
            </horizontal>

            <text id="anotherProjectLinkText" textSize="16dp" textColor={isDarkMode ? "#ffffff" : "#000000"} text="Are you interested in learning about another project?" />
            <horizontal>
                <button id="anotherProjectLinkBtn" text="Open the homepage of the automatic score picking project" />
            </horizontal>

        </vertical>
        {/* Start button in the lower right corner */}
        <fab id="launchBtn" w="auto" h="auto" src="@drawable/ic_launch_black_48dp" margin="16" layout_gravity="bottom|right" tint="#ffffff" />
    </frame>
)

ui.text.setText(Explain the text);
let floatWindowSize = 36;
ui.seekbar.setOnSeekBarChangeListener({
    onProgressChanged: function (seekBar, progress, fromUser) {
        floatWindowSize = progress;
        ui.barDesc.setText("悬浮窗大小调节: " + progress);
    }
});

let floatWindowStarted = false;
ui.launchBtn.on("click", () => {
    if (!floatWindowStarted) {
        console.log("launch!");
        threads.start(() => {
            engines.execScriptFile("main.js");
            exit();
        });
        floatWindowStarted = true;
    }
    if (auto.service != null) {
        home();
    }
});

ui.projectLinkBtn.on("click", () => {
    app.openUrl(projectUrl);
});

ui.anotherProjectLinkBtn.on("click", () => {
    app.openUrl(anotherProjectUrl);
});

let canExit = false;
let canExitTimeout = null;
ui.emitter.on("back_pressed", (e) => {
    if (!canExit) {
        toast("再按一次退出");
        canExit = true;
        canExitTimeout = setTimeout(() => {
            canExit = false;
        }, 2000);
        e.consumed = true;
    } else {
        clearTimeout(canExitTimeout);
        e.consumed = false;
    };
})