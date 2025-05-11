//Click the position of the input box of the input text

Const inputBoxPos = [1526, 1051];

//Confirm the location of the button

Const confirmBtnPos = [1984,1051];

//All secret orders

Const allKeys = [

//2022.7.15 Guanshan update, enter the dream to add

"From now on, the full boat of bright moon will go",

"Long pass away into your arms",

"Acacia begins to feel that the sea is not deep",

//2021.7.9 Enter the dream to add

"Jianghu Night Rain Ten Years Lamp",

"We often see each other every year",

"Only fate feels you look back",

"Send me a plum in the south of the Yangtze River",

"One inch of acacia and an inch of gray",

"The dream of breaking the hometown will not come true",

"Acacia is like the depth of the sea",

"The blue mist is misty, double swallows",

"Mo Dao, the gentleman's will is still shallow",

"How many times the soul dream is the same as you",

"There is no place with acacia",

"Si Gongzi didn't dare to say it",

"Only acacia is endless",

//The last time

"A spring dream chases the silk",

"Drunken dream, drunk, Xiao Weisu",

"The old mountain is empty and the dream of pine trees",

"The residual sky is still vaguely dreaming",

"Last night, the dream of falling flowers in Xiantan",

"Where to find the clouds in the dream",

"In the middle of the night, I suddenly dreamed of the youth's affairs",

"Suddenly, take a boat and dream of the sun",

"A dream of rivers and lakes costs five years",

//The following is the old secret order

"Qingshan's face wants to be followed",

"Re-inscription of Jiange",

"The fragrance comes into the dream in the middle of the night",

"I'm going to meet you again,"

"Water, stone, wind, forest into the dream",

"East wind willow flower fragrance",

"The mountains and rivers on the palm of the mountains and rivers for the first time",

"A thousand dreams in one night",

"It smells like a dream", //Note that it's not like

"Plum blossoms come into the dream",

"The head of the Jinjiang River often enters the dream",

"Singing a pen and wanting to tu Danqing",

"Daozhou re-enters the dream",

"The sun and moon in the pot are still years old",

//From other people

"After being drunk, Xiyuan enters the dream",

"In the middle of the night, the fragrance comes into the dream",

"Autumn fishing on the clear beach is a dream",

"Peach Blossom Water Return Ship",

"The festival is heavy again",

//It may be a new addition

"Why did you dream last night",

"The garden is full of flowers and chrysanthemums are golden"

];

Function tryKey(key) {

click(inputBoxPos[0], inputBoxPos[1]);

If (! className("android.widget.EditText").findOne(300)) {

// Not found, indicating that the secret order has been unlocked.

Return 1;

};

className("android.widget.EditText").findOnce().setText(key);

className("android.widget.Button").text("Determine").findOne().click();

Sleep(600);

click(confirmBtnPos[0],confirmBtnPos[1]);

Sleep(20);

Return zero;

};

For (var i = 0; i < allKeys.length; i++) {

If (tryKey(allKeys[i])) {

toastLog("Crack Success"); // The script speed is too fast,

Exit ();

};

};