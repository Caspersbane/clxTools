var FileProvider = require("../fileProvider.js");
var MusicFormats = require("../musicFormats.js");

/**
 * @argument {FileProvider} fileProvider 
 */
function FileSelector(fileProvider) {
    const musicFormats = new MusicFormats();
    let window;
    /**
     * @type {string?}
     */
    let selectedMusic = null;
    /**
     * @type {string?}
     */
    let selectedPlaylist = null;
    /**
     * @type {number?}
     */
    let selectedPlaylistIndex = null;

    /**
     * @type {(selectedMusic: string?, selectedPlaylist: string?) => void}
     */
    let onItemSelected = (selectedMusic, selectedPlaylist) => { };

    // 创建UI
    function createUI() {
        window = floaty.window(  //If it is set to rawWindow, the spinner will not be opened
            <frame id="board" w="*" h="*">
                <vertical w="{{Math.round(device.width * 0.9)}}px" h="{{Math.round(device.height * 0.8)}}px" bg="#ffffff" padding="8sp">
                    <horizontal w="*" h="32dp" bg="#f5f5f5" marginBottom="8sp">
                        <text id="btnManagePlaylist" text="≡" textSize="24sp" textColor="#000000" padding="12 0" h="*" gravity="center" />
                        <spinner id="playlistSelector" w="*" h="*" layout_weight="1.6" gravity="center" ellipsize="end" margin="12 0" />
                        <input id="searchInput" w="*" h="40dp" hint="搜索音乐" bg="#f0f0f0" padding="8sp" layout_weight="1" inputType="text" imeOptions="actionDone" singleLine="true" focusable="true" focusableInTouchMode="true" />
                        <text id="btnClose" text="×" textSize="24sp" textColor="#000000" padding="12 0" gravity="center" />
                    </horizontal>
                    {/* Progress bar */}
                    {/* progressbar It's hard to see the blank space up and down, this one doesn't */}
                    <com.google.android.material.progressindicator.LinearProgressIndicator id="loadingProgressBar" w="*" h="8dp" bg="#f0f0f0" indeterminate="true" />
                    {/* List of files */}
                    <list id="fileList" w="*" h="*" bg="#fafafa">
                        <horizontal w="*" h="40dp">
                            <text id="fileName" text="{{this.displayName}}" textSize="16sp" textColor="#000000" maxLines="1" ellipsize="end" layout_weight="1" />
                            <text id="extraInfo" text="{{this.extraInfo}}" textSize="12sp" textColor="#808080" maxLines="1" ellipsize="end" />
                            <button id="btnLike" text="{{this.liked ? '♥' : '♡'}}" textSize="15sp" w="40dp" h="40dp" margin="0" style="Widget.AppCompat.Button.Borderless" textColor="#FF8080" />
                            <button id="btnAdd" text="+" textSize="18sp" w="40dp" h="40dp" padding="0" style="Widget.AppCompat.Button.Borderless" textColor="#4CAF50" visibility="{{this.addable ? 'visible' : 'gone'}}" />
                            <button id="btnRemove" text="-" textSize="22sp" w="40dp" h="40dp" style="Widget.AppCompat.Button.Borderless" textColor="#F44336" visibility="{{this.removable ? 'visible' : 'gone'}}" />
                        </horizontal>
                    </list>
                </vertical>
            </frame>
        );
        // Set up the UI interaction logic
        ui.run(() => setupUILogic());
    }

    // Set up the UI interaction logic
    function setupUILogic() {
        // window.setAdjustEnabled(true);
        window.setSize(-1, -1);
        // window.setTouchable(true);
        window.board.on('touch_down', () => {
            window.searchInput.clearFocus();
            window.disableFocus();
            // window.board.setVisibility(8);
            // window.setTouchable(true);
        });
        // Initialize the playlist selector
        let playlists = fileProvider.listAllMusicLists();
        playlists.unshift("All songs");  // Add the "All Songs" option at the beginning of the list
        console.verbose(`All playlists: ${JSON.stringify(playlists)}`);

        window.playlistSelector.setAdapter(new android.widget.ArrayAdapter(context, android.R.layout.simple_spinner_item, playlists));
        window.playlistSelector.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
            onItemSelected: function (parent, view, position, id) {
                selectedPlaylistIndex = position === 0 ? null : position - 1;
                selectedPlaylist = position === 0 ? null : playlists[position];
                refreshFileList();
            },
            onNothingSelected: function () {
            }
        }));
        // Search for input box events
        window.searchInput.setOnEditorActionListener(new android.widget.TextView.OnEditorActionListener((view, i, event) => {
            const EditorInfo = android.view.inputmethod.EditorInfo;
            switch (i) {
                case EditorInfo.IME_ACTION_DONE:
                    let keyword = window.searchInput.getText().toString().trim();
                    refreshFileList(keyword.toLowerCase());
                    window.searchInput.clearFocus();
                    window.disableFocus();
                    return false;
                default:
                    return true;
            }
        }));
        window.searchInput.on("touch_down", () => {
            window.requestFocus();
            window.searchInput.requestFocus();
        });
        // Manage playlist button
        window.btnManagePlaylist.on("click", function () {
            window.close();
            showPlaylistManagementDialog();
        });

        // Close the button
        window.btnClose.on("click", function () {
            window.close();
        });

        // File list item click event
        window.fileList.on("item_click", function (item, position, itemView, listView) {
            selectedMusic = item.name;
            window.close();
            if (onItemSelected != null) {
                onItemSelected(selectedMusic, selectedPlaylist);
            }
        });

        function onBtnRemoveClickFunc(itemHolder) {
            return function () {
                const musicName = itemHolder.getItem().name;
                if (selectedPlaylist && fileProvider.removeMusicFromList(selectedPlaylist, musicName)) {
                    toast("Removed from playlist");
                    refreshFileList();
                } else {
                    toast("Removal failed");
                }
            };
        }

        function onBtnLikeClickFunc(itemHolder, itemView) {
            return function () {
                const musicName = itemHolder.getItem().name;
                const liked = fileProvider.userMusicLists[0].musicFiles.includes(musicName);
                if (!liked) {
                    fileProvider.addMusicToList(fileProvider.userMusicLists[0].name, musicName);
                    itemView.btnLike.setText("♥");
                    toast("Bookmarked");
                } else {
                    fileProvider.removeMusicFromList(fileProvider.userMusicLists[0].name, musicName);
                    itemView.btnLike.setText("♡");
                    toast("Favorites have been unfavored");
                }
            };
        }

        function onBtnAddClickFunc(itemHolder, itemView) {
            return function () {
                const musicName = itemHolder.getItem().name;
                //Pop-up menu
                const popUpMenu = new android.widget.PopupMenu(context, itemView.btnAdd);
                const menu = popUpMenu.getMenu();
                const playlists = fileProvider.listAllMusicLists();
                for (let i = 0; i < playlists.length; i++) {
                    menu.add(0, i, i, playlists[i]);
                }
                popUpMenu.setOnMenuItemClickListener(new android.widget.PopupMenu.OnMenuItemClickListener({
                    onMenuItemClick: function (menuItem) {
                        const playlist = playlists[menuItem.getItemId()];
                        if (fileProvider.addMusicToList(playlist, musicName)) {
                            toast(`Added to playlist"${playlist}"`);
                        } else {
                            toast("Failed to add");
                        }
                        return true;
                    }
                }));
                popUpMenu.show();
            };
        }

        // File list item binding event
        window.fileList.on("item_bind", function (itemView, itemHolder) {
            //collection
            itemView.btnLike.on("click", onBtnLikeClickFunc(itemHolder, itemView));
            //Add to the specified playlist
            itemView.btnAdd.on("click", onBtnAddClickFunc(itemHolder, itemView));
            //Removes the current playlist
            itemView.btnRemove.on("click", onBtnRemoveClickFunc(itemHolder));
        });
        window.fileList.setItemViewCacheSize(40);
        window.fileList.setDrawingCacheEnabled(true);
        window.fileList.recycledViewPool.setMaxRecycledViews(0, 40);
    }

    function refreshFileList(searchText) {
        window.loadingProgressBar.setVisibility(android.view.View.VISIBLE);
        if (searchText == null)
            searchText = '';
        setImmediate((searchText) => {
            console.log(`searchText: ${searchText}`);
            let files;

            if (selectedPlaylist) {
                files = fileProvider.listMusicInList(selectedPlaylist) || [];
            } else {
                try {
                    files = fileProvider.listAllMusicFilesWithCache();
                } catch (e) {
                    console.error(e);
                    dialogs.alert("mistake", "Unable to read the list of music files: " + e + "\n" + e.stack);
                    window.close();
                    return;
                }
            }

            // Apply search filtering
            if (searchText.trim() !== '')
                files = files.filter(function (file) {
                    return file.toLowerCase().includes(searchText);
                });

            ui.run(() => {
                window.fileList.setDataSource(files.map(function (name) {
                    return {
                        name: name,
                        displayName: musicFormats.getFileNameWithoutExtension(name),
                        addable: selectedPlaylistIndex == null,
                        removable: selectedPlaylistIndex != null,
                        liked: fileProvider.userMusicLists[0].musicFiles.includes(name),
                        extraInfo: name.startsWith('cloud') ? '(Cloud)' : ''
                    };
                }));
                window.loadingProgressBar.setVisibility(android.view.View.GONE);
            });
        }, searchText);
    }

    function showPlaylistManagementDialog() {
        dialogs.build({
            title: "manage...",
            items: ["Create a new playlist", "Rename the current playlist", "Delete the current playlist", "Manually refresh the cloud song list", "Clear the song cache"."],
            itemsSelectMode: "select"
        }).on("item_select", function (index, item) {
                switch (index) {
                    case 0:
                        createPlaylist();
                        break;
                    case 1:
                        renamePlaylist();
                        break;
                    case 2:
                        deletePlaylist();
                        break;
                    case 3:
                        {
                            const d = dialogs.build({
                                title: "Loading...",
                                content: "The cloud song list is being updated...",
                                progress: {
                                    max: -1,
                                    horizontal: true
                                }
                            });
                            d.show();
                            fileProvider.updateCloudMusicList((err, succeed) => {
                                d.dismiss();
                                if (err) {
                                    dialogs.alert("Failed to load", "Failed to update the cloud song list: " + err);
                                    return;
                                }
                                toast("The update was successful");
                            }, true);
                        }
                        break;
                    case 4:
                        fileProvider.clearMusicFileCache();
                        toast("The song cache has been cleared");
                        break;
                }
            }).show();
    }

    function createPlaylist() {
        dialogs.rawInput("Enter a playlist name").then(function (name) {
            if (name && fileProvider.createMusicList(name)) {
                toast("The playlist is created");
            } else {
                toast("Playlist creation failed");
            }
            createUI();
        });
    }

    function renamePlaylist() {
        if (!selectedPlaylist) {
            toast("Please select a playlist first");
            return;
        }
        dialogs.rawInput("Enter a new playlist name", selectedPlaylist).then(function (newName) {
            if (newName && fileProvider.renameMusicList(selectedPlaylist, newName)) {
                toast("The playlist was renamed successfully");
                selectedPlaylist = newName;
            } else {
                toast("Playlist rename failed");
            }
            createUI();
        });
    }

    function deletePlaylist() {
        if (!selectedPlaylist) {
            toast("Please select a playlist first");
            return;
        }
        dialogs.confirm("OK to delete the playlist " + selectedPlaylist + " Is it?").then(function (confirm) {
            if (confirm && fileProvider.deleteMusicList(selectedPlaylist)) {
                toast("The playlist was deleted");
                selectedPlaylist = null;
            } else {
                toast("Failed to delete playlist");
            }
            createUI();
        });
    }

    function updatePlaylistSelector() {
        let playlists = fileProvider.listAllMusicLists();
        playlists.unshift("All songs");
        window.playlistSelector.setAdapter(new android.widget.ArrayAdapter(context, android.R.layout.simple_spinner_item, playlists));
        refreshFileList();
    }

    // Disclosure method: Display the selection menu
    this.show = function () {
        createUI();
        // refreshFileList();  // window.playlistSelector.setOnItemSelectedListener会自动调用
    };

    // Disclosure Method: Get the name of the selected music
    this.getSelectedMusic = function () {
        return selectedMusic;
    };

    // Disclosure Method: Get the name of the selected playlist
    this.getSelectedPlaylist = function () {
        return selectedPlaylist;
    };

    this.setOnItemSelected = function (/** @type {(selectedMusic: string?, selectedPlaylistIndex: string?) => void} */ callback) {
        onItemSelected = callback;
    }

}

module.exports = FileSelector;