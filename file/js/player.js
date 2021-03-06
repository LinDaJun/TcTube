var player, defaultVideoNum, videoNum = totalTime = startTime = 0;
function isIE(version){
    ie9 = /MSIE 9/i.test(navigator.userAgent);
    ie10 = /MSIE 10/i.test(navigator.userAgent);
    ie11 = /rv:11.0/i.test(navigator.userAgent);
    if (version === 9) {
        return ie9;
    } else if (version === 10) {
        return ie10;
    } else if (version === 11) {
        return ie11;
    }
    return ie9 || ie10 || ie11;
}
if (!String.prototype.includes) { // IE includes
    String.prototype.includes = function(search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }

        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}
function onYouTubeIframeAPIReady() {
    console.log("onYouTubeIframeAPIReady()");
    delete window.player;
    window.player = new YT.Player('frame', {
        events: {
            onReady: function (event) {
                console.log("player.onReady()");
                player.playVideo();
                updateTimerDisplay();
            },
            onPlaybackQualityChange: function (event) {
                console.log("player.onPlaybackQualityChange(playbackQuality: " + player.getPlaybackQuality() + ")");

            },
            onStateChange: function (event) {
                switch(event.data) {
                    case -1:
                        console.log("player.onUnstarted()\n\r%c" + player.getVideoData().video_id, "background: black;color: red;font-size: 20px;");
                        break;
                    case 0:
                        console.log("player.onEnded()\n\r%c" + player.getVideoData().title, "background: black;color: red;font-size: 20px;");
                        index(1);
                        break;
                    case 1:
                        console.log("player.onPlaying(time: " + player.getCurrentTime() + ")");
                        play.className = "pause";
                        break;
                    case 2:
                        console.log("player.onPause(time: " + player.getCurrentTime() + ")");
                        play.className = "play";
                        break;
                    case 3:
                        console.log("player.onBuffering(time: " + player.getCurrentTime() + ")");
                        play.className = "pause";
                        break;
                    case 5:
                        console.log("player.onVideoCued()\n\r%c" + player.getVideoData().video_id, "background: black;color: red;font-size: 20px;");
                        break;
                    default:
                        console.log("player.onStateChange(state: " + event.data + ")");
                }
            },
            onError: function (event) {
                console.log("%cplayer.onError()", "color: red;");
                switch(event.data) {
                    case 2:
                        console.log("無效影片ID");
                        break;
                    case 5:
                        console.log("無法在Html5中播放影片");
                        break;
                    case 100:
                        console.log("該影片已不存在");
                        break;
                    case 100:
                    case 150:
                        console.log("該影片不能嵌入使用"); // 像是 taN50P-SFyc 玩具槍與玫瑰 就不能嵌入
                        break;
                }
            }
        }
    });
}
function debug() {
    console.groupEnd(); // 關閉收合
    groupCollapsed = false;
}
function startPlayTime() {
    console.log("time:" + window.totalTime);
    window.startTime = video.currentTime;
}
function stopPlayTime() {
    if (window.startTime < video.currentTime) {
        window.totalTime += video.currentTime - window.startTime;
        window.startTime = 0;
    }
    console.log("time:" + window.totalTime);
}
function reportPlayHistory() {
    stopPlayTime();
    if (window.totalTime > 0) {
        socket.emit("report play history", {time: totalTime, video: videoNum});
    }
    window.totalTime = 0;
}
function updateTimerDisplay() { // 刷新時間(待整合video.timeupdate())
    if (!frame.hidden && typeof window.player !== 'undefined') {
        if (typeof player.getDuration !== 'undefined') {
            if (!isNaN(player.getDuration())) {
                if (player.getDuration() == Infinity) { // 無限大(保安 可以告訴我檔案多大嗎!!)
                    duration.textContent = "??:??";
                } else {
                    duration.textContent = formatTime(player.getDuration());
                }
            }
            if (typeof player.getCurrentTime !== 'undefined') {
                if (!isNaN(player.getCurrentTime())) {
                    if (player.getCurrentTime() == Infinity) { // 無限大(保安 可以告訴我檔案多大嗎!!)
                        currentTime.textContent = "??:??";
                    } else {
                        currentTime.textContent = formatTime(player.getCurrentTime());
                    }
                }
                Draw(progress, player.getCurrentTime() / player.getDuration());
            }
        }
    }
}
function formatTime(seconds) { // 格式化時間(通用)
    minutes = Math.floor(seconds / 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
}
function sleep(milliseconds) { // 延遲(毫秒)
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
function loadJSON(file, callback) { // 載入Json檔
    var xmlHttpRequest = new XMLHttpRequest();
    if(xmlHttpRequest.overrideMimeType) xmlHttpRequest.overrideMimeType("application/json");
    xmlHttpRequest.open("GET", file, true);
    xmlHttpRequest.onreadystatechange = function () {
        if (xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == "200") {
            callback(xmlHttpRequest.responseText);
        }
    };
    xmlHttpRequest.send(null);
}
function Draw(obj, percente, direction, reverse) { // 填充百分比(通用)
    if(typeof direction === 'undefined') {
        direction = "x";
    }
    if(typeof reverse === 'undefined') {
        reverse = false;
    }
    objContent = obj.getContext("2d");
    if (obj == volumeSlider || video.hidden) {
        objContent.fillStyle = "rgb(255,200,200)";
    } else if (video.seekable.end.length == 0) {
        objContent.fillStyle = "rgb(200,200,255)";
    } else {
        try {
            if (video.seekable.end(0) != 0) {
                objContent.fillStyle = "rgb(255,200,200)";
            } else {
                objContent.fillStyle = "rgb(200,100,100)";
            }
        } catch (error) {
            objContent.fillStyle = "rgb(200,100,100)";
        }
    }
    objContent.clearRect(0, 0, obj.width, obj.height);
    objContent.fillRect(0, 0, obj.width, obj.height);
    objContent.fillStyle = "rgb(255,0,0)";
    x = obj.width * ((direction == "x") ? percente : 1);
    y = obj.height * ((direction == "y") ? percente : 1);
    if (reverse) {
        objContent.fillRect(obj.width - x, obj.height - y, obj.width, obj.height);
    } else {
        objContent.fillRect(0, 0, x, y);
    }
}
function refreshVolume() { // 音量改變事件(通用) 100 1
    if (!frame.hidden) { // Youtube播放器
        if (player.isMuted()) {
            Draw(volumeSlider, 0, "y", true);
            volume.children[0].className = "volumeOff";
            console.info("改變音量為:%c靜音" , "color: red;");
        } else {
            Draw(volumeSlider, player.getVolume() / 100, "y", true);
            if (player.getVolume() == 0) {
                volume.children[0].className = "volumeOff";
            } else if (player.getVolume() <= 50) {
                volume.children[0].className = "volumeDown";
            } else {
                volume.children[0].className = "volumeUp";
            }
            console.info("改變音量為:%c" + player.getVolume(), "color: red;");
        }
    } else if (!video.hidden) { // 一般播放器
        if (video.muted) {
            Draw(volumeSlider, 0, "y", true);
            volume.children[0].className = "volumeOff";
            console.info("改變音量為:%c靜音" , "color: red;");
        } else {
            Draw(volumeSlider, video.volume, "y", true);
            if (video.volume == 0) {
                volume.children[0].className = "volumeOff";
            } else if (video.volume <= 0.5) {
                volume.children[0].className = "volumeDown";
            } else {
                volume.children[0].className = "volumeUp";
            }
            console.info("改變音量為:%c" + video.volume, "color: red;");
        }
    }
}
function calcPercente(e, direction, reverse) { // 計算百分比(通用)
    if(typeof direction === 'undefined') {
        direction = "x";
    }
    if(typeof reverse === 'undefined') {
        reverse = false;
    }
    if (direction == "x") {
        return ((reverse) ? e.target.width - e.offsetX : e.offsetX) / e.target.width;
    } else {
        return ((reverse) ? e.target.height - e.offsetY : e.offsetY) / e.target.height;
    }
}
//rate volume 需要標準化變更公式
function indexRate(offset, newRate) {
    if (offset != 0) { // 數位
        newRate = 0;
        if (!frame.hidden) { // Youtube播放器
            availablePlaybackRates = player.getAvailablePlaybackRates();
            availablePlaybackRateIndex = availablePlaybackRates.indexOf(player.getPlaybackRate()) + offset;
        } else if (!video.hidden) { // 一般播放器
            availablePlaybackRates = [0.5, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4];
            availablePlaybackRateIndex = availablePlaybackRates.indexOf(video.playbackRate) + offset;
        }
        if (availablePlaybackRateIndex < 0) availablePlaybackRateIndex = 0;
        if (availablePlaybackRateIndex >= availablePlaybackRates.length) availablePlaybackRateIndex = availablePlaybackRates.length - 1;
        newRate = availablePlaybackRates[availablePlaybackRateIndex];
    } else { // 類比
        if (!frame.hidden) { // Youtube播放器(模擬類比)
            // 假如可以跨站就可以指定速度
            availablePlaybackRates = player.getAvailablePlaybackRates();
            for (var i = 0; i < availablePlaybackRates.length; i++) {
                if (newRate <= availablePlaybackRates[i] || availablePlaybackRates.length == i + 1) {
                    console.info("修改撥放速率為:%c" + availablePlaybackRates[i], "color: red;");
                    newRate = availablePlaybackRates[i];
                    break;
                }
            }

        } else if (!video.hidden) { // 一般播放器
            min = 0.5;
            max = 4;
            if (newRate < min) newRate = min;
            if (newRate > max) newRate = max;
            newRate = Math.round(newRate * 100) / 100;
        }
    }

    if (!frame.hidden) { // Youtube播放器
        player.setPlaybackRate(newRate);
    } else if (!video.hidden) { // 一般播放器
        video.playbackRate = newRate;
    }
    console.info("修改撥放速率為:%c" + newRate, "color: red;");
    rate.textContent = newRate + "X";
}
function index(offset) { // 歌曲索引(通用)
    // 假如沒傳入參數，直接採用預設值，即Python自動產生的數字或使用者輸入的數字
    // 缺少Youtube判斷
    reportPlayHistory();
    var preVideoNum = videoNum;
    if (typeof offset === 'undefined') {
        videoNum = defaultVideoNum;
    } else {
        videoNum = ((videoNum + offset) % playlist.length + playlist.length) % playlist.length;
    }

    // 移除Source
    while (video.firstChild) {
        video.removeChild(video.firstChild);
    }
    if (playlist[videoNum].file[0].includes("blob:") || playlist[videoNum].file[0].includes("http:") || playlist[videoNum].file[0].includes("https:")) { // 絕對位址
        if (playlist[videoNum].file[0].includes("www.youtube")) {  // youtube
            // 依據Youtube API是否載入來改變Youtube影片來源
            if (typeof window.player === 'undefined' || typeof window.player.loadVideoByUrl === 'undefined') {
                frame.src = playlist[videoNum].file[0] + "?autoplay=" + ((localStorage.getItem("autoplay")) ? 1 : 0) + "&controls=0&disablekb=1&enablejsapi=1&autohide=1&modestbranding=1&playsinline=1&rel=0&showinfo=0&theme=dark&iv_load_poliucy=3&cc_load_policy=1";
            } else {
                player.loadVideoByUrl(playlist[videoNum].file[0] + "?autoplay=" + ((localStorage.getItem("autoplay")) ? 1 : 0) + "&controls=0&disablekb=1&enablejsapi=1&autohide=1&modestbranding=1&playsinline=1&rel=0&showinfo=0&theme=dark&iv_load_poliucy=3&cc_load_policy=1"); // &origin=http%3A%2F%2F" + window.location.host
            }

            if (!video.paused) {
                video.pause();
            }

            // 重新開始監控事件
            window.time_update_interval = setInterval(function () {
                // 刷新時間 音量 速率(後兩項較不緊急)
                updateTimerDisplay();
                if (!video.hidden) { // 一般播放器
                    // 移除監控任務
                    clearInterval(window.time_update_interval);
                    delete window.time_update_interval;
                }
            }, 25);

            // 改變顯示為Youtube影片
            frame.hidden = false;
            video.hidden = true;
        } else { // 其他網站(http)
            video.src = playlist[videoNum].file[0];
            if (typeof window.player === 'undefined' || typeof window.player.loadVideoByUrl === 'undefined') {
                frame.src = "about:blank";
            } else {
                player.stopVideo();
                // player.loadVideoByUrl("about:blank");
                // player.clearVideo(); // not work
            }

            // 移除監控任務
            clearInterval(window.time_update_interval);
            delete window.time_update_interval;

            // 改變顯示為一般影片
            frame.hidden = true;
            video.hidden = false;
        }
    } else { // 相對位址(本機檔案)
        video.src = "http://" + window.location.host + "/file/video/" + playlist[videoNum].file[0];
        if (typeof window.player === 'undefined' || typeof window.player.loadVideoByUrl === 'undefined') {
            frame.src = "about:blank";
        } else {
            player.stopVideo();
            // player.loadVideoByUrl("about:blank");
            // player.clearVideo(); // not work
        }
        // 加入其他檔案為Source
        for (var i = 0; i < playlist[videoNum].file.length; i++) {
            tempSource = document.createElement("source");
            tempSource.src = "http://" + window.location.host + "/file/video/" + playlist[videoNum].file[i];
            video.appendChild(tempSource);
        }

        // 移除監控任務
        clearInterval(window.time_update_interval);
        delete window.time_update_interval;

        // 改變顯示為一般影片
        frame.hidden = true;
        video.hidden = false;

    }

    duration.textContent = "00:00";
    currentTime.textContent = "00:00";

    // Chrome.console依播放歌曲分組，一首一組
    console.groupEnd();
    if (groupCollapsed) {
        console.groupCollapsed(videoNum + " - " + playlist[videoNum].title);
    } else {
        console.group(videoNum + " - " + playlist[videoNum].title);
    }
    console.log("%c" + playlist[videoNum].file, "color: blue;")

    // 設定視窗標題
    if (typeof playlist[videoNum].artist === 'undefined') {
        document.title = playlist[videoNum].title;
    } else {
        document.title = playlist[videoNum].artist + " - " + playlist[videoNum].title;
    }

    // 頁面歷史(尚缺上一頁功能)，需與Python Flask伺服器網頁路徑規則一致
    if (typeof offset !== 'undefined' && offset !== 0) {
        if (window.history.pushState) {
            if (window.location.pathname.includes("/video/")) {
                window.history.pushState({videoNum: videoNum}, 1, "http://" + window.location.host + "/video/" + videoNum);
            } else if (window.location.search.includes("?video=")) {
                window.history.pushState({videoNum: videoNum}, 1, "http://" + window.location.host + "/?video=" + videoNum);
            } else {
                window.history.pushState({videoNum: videoNum}, 1, window.location.href);
            }
        }
    } else {
        window.history.replaceState({videoNum: videoNum}, 0, window.location.href);
    }
}
// 播放/暫停(通用)
function playAndPause() {
    if (!frame.hidden) { // Youtube播放器
        if (player.getPlayerState() == 2) {
            player.playVideo();
            console.info("%c播放", "background: green;");
        } else if (player.getPlayerState() == 1) {
            player.pauseVideo();
            console.info("%c暫停", "background: yellow;");
        } else {
            console.warn("playAndPause(PlayerState :" + player.getPlayerState() + ")");
        }
    } else if (!video.hidden) { // 一般播放器
        if (video.paused) {
            video.play();
            console.info("%c播放", "background: green;");
        } else {
            video.pause();
            console.info("%c暫停", "background: yellow;");
        }
    }
}
function Seek(offset, percente) {
    newTime = 0;
    if (!video.hidden) { // 一般播放器
        if (offset === 0) {
            newTime = Math.round(video.duration * percente * 100) / 100;
        } else {
            if (video.currentTime + offset > video.duration) {
                index(1);
                return;
            } else if (video.currentTime + offset < 0) {
                index(-1);
                return;
            } else {
                newTime = video.currentTime + offset;
            }
        }
        video.seekTo(newTime);
    } else if (!frame.hidden) { // Youtube播放器
        if (offset === 0) {
            newTime = Math.round(player.getDuration() * percente * 100) / 100;
        } else {
            if (player.getCurrentTime() + offset > player.getDuration()) {
                index(1);
                return;
            } else if (player.getCurrentTime() + offset < 0) {
                index(-1);
                return;
            } else {
                newTime = player.getCurrentTime() + offset;
            }
        }
        player.seekTo(newTime);
    }
    console.info("調整時間:%c" + newTime, "color: red;");
}
// 全螢幕(通用)
function fullScreen() {
    if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
        if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.CancelFullScreen) {
            document.CancelFullScreen();
        } else if (document.msCancelFullScreen) {
            document.msCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    } else {
        if (videoFrame.mozRequestFullScreen) {
            videoFrame.mozRequestFullScreen();
        } else if (videoFrame.requestFullscreen) {
            videoFrame.requestFullscreen();
        } else if (videoFrame.msRequestFullscreen) {
            videoFrame.msRequestFullscreen();
        } else if (videoFrame.webkitRequestFullscreen) {
            videoFrame.webkitRequestFullscreen();
        }
    }
}
function isMobile() {
    var a = navigator.userAgent||navigator.vendor||window.opera;
    return/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s)|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg(g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4));
}
jQuery(document).ready(function init() { // 載入完成後執行
    // console.log("init()");
    console.log("isIE: " + isIE());
    window.setTimeout(function detectAdBlock() { // Adblock 偵測
        var bottomad = document.getElementById("bottomAd");
        if (bottomad.length == 1) {
            if (bottomad.height() == 0) {
                console.log("%cADBlocker Active!!", "color: red;"); // adblocker active
            } else {
                console.log("%cno ADBlocker", "color: green;"); // no adblocker
            }
        }
    }, 1);

    frame = document.getElementById("frame"); // IE Iframe
    body = document.getElementsByTagName("body")[0];
    // 初始化設定值
    if (localStorage.getItem("autoplay") == null) {
        localStorage.setItem("autoplay", true); // autoplay預設值為True
    }
    if (localStorage.getItem("autonext") == null) {
        localStorage.setItem("autonext", true); // autonext預設值為True
    }
    if (localStorage.getItem("rate") == null) {
        localStorage.setItem("rate", 1); // autonext預設值為True
    }

    groupCollapsed = true;

    Draw(volumeSlider, video.volume, "y", true);
    rate.textContent = video.playbackRate + "X";

    if (isMobile()) { // 手機
        console.log("%cMobile", "color: white; background: black;");
    //     hammer = new Hammer(video);
    //     hammer.on("panleft", function(evt) {
    //         index(-1);
    //     });
    //     hammer.on("panright", function(evt) {
    //         index(1);
    //     });
    //     hammer.on("panup", function(evt) {
    //     });
    //     hammer.on("pandown", function(evt) {
    //     });
    } else {
        console.log("%cnot Mobile", "color: green; background: black;");
    }
    setInterval(function() {
        if (video.currentTime > window.startTime) {
            document.title = totalTime + video.currentTime - window.startTime;
        }
    }, 200);
    video.seekTo = function (newTime) {
        if (video.seekable.end(0) != 0) {
            console.info("調整時間:%c" + newTime, "color: red;");
            stopPlayTime();
            video.currentTime = newTime;
        }
        if (video.seekable.end.length > 1) {
            console.error("%cvideo.seekable.end.length > 1" + newTime, "font-size:40px;color: red;");
        }
    }

    window.onpopstate = function(event) {
        console.dir(event);
        console.log(event.currentTarget.location.pathname);
        if (event.state.videoNum !== videoNum) {
            videoNum = event.state.videoNum;
            index(0);
        }
    }
    window.onfocus = function(event) { // 切換回來時
        // console.log("window.onFocus()");
        if (typeof panel !== 'undefined' && !panel.closed) {
            panel.video.pause();
            if (video.src != panel.video.src) {
                video.src = panel.video.src;
                window.location = panel.location; // 變網址
                playTime = panel.video.currentTime;
            } else {
                video.currentTime = panel.video.currentTime;
                if (video.paused) {
                    video.play();
                }
            }
            panel.close(); // 關掉開啟的視窗
        }
    };
    window.onblur = function(event) { // 失去目標
        // console.log("window.onBlur()");
    };
    window.onbeforeunload = reportPlayHistory;
    function onFullscreenChange(event) { // 全螢幕切換時
        // console.log("document.onFullscreenChange()");
        isFullScreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
        if (isFullScreen) {
            size.className = "zoomIn";
        } else {
            size.className = "zoomOut";
        }
    };
    if (typeof document.onfullscreenchange !== 'undefined') {
        document.onfullscreenchange = onFullscreenChange;
    } else if (typeof document.onwebkitfullscreenchange !== 'undefined') {
        document.onwebkitfullscreenchange = onFullscreenChange;
    } else if (typeof document.onmozfullscreenchange !== 'undefined') {
        document.onmozfullscreenchange = onFullscreenChange;
    } else if (typeof document.onMSFullscreenChange !== 'undefined') {
        document.onMSFullscreenChange = onFullscreenChange;
    }

    document.onkeydown = function(event) { // 按鍵處理
        console.info("document.onKeydown:%c" + event.keyCode, "color: blue;");
        // console.dir(event);
        if (event.ctrlKey) {
            if (event.keyCode == 37) { // ←
                index(-1);
            } else if (event.keyCode == 39) { // →
                index(1);
            }
        } else {
            if (event.altKey) return;
            if (event.keyCode == 37) { // ←
                Seek(-5);
            } else if (event.keyCode == 39) { // →
                Seek(5);
            } else if (event.keyCode >= 96 && event.keyCode <= 105) { // 0 ~ 9
                Seek(0, (event.keyCode - 96) / 10);
            } else if (event.keyCode == 107) { // +
                video.volume = (video.volume <= 0.9) ? video.volume + 0.1 : 1;
            } else if (event.keyCode == 109) { // -
                video.volume = (video.volume >= 0.1) ? video.volume - 0.1 : 0;
            } else if (event.keyCode == 32) {
                playAndPause();
            } else if (event.keyCode == 122) {
                event.preventDefault(); //關閉預設全螢幕功能
                fullScreen();
            }
        }
    };

    body.onclick = function(event) { // 點擊頁面
        if (!contextMenu.hidden) {
            contextMenu.hidden = true;
        }
    };

    video.onloadedmetadata = function(event) {
        // console.log("video.loadedmetadata()");
        // if (typeof playbackRate !== 'undefined') {
        //     video.playbackRate = playbackRate;
        // }
        // if (typeof playVolume !== 'undefined') {
        //     video.volume = playVolume;
        // }
        if (typeof window.playTime !== 'undefined') {
            video.currentTime = window.playTime;
            delete window.playTime; // 釋放，避免下一首一樣從一半開始
        }
        if (localStorage.getItem("autoplay")) {
            if (typeof panel !== 'undefined' && !panel.closed) {
            } else {
                video.play();
            }
        }
        if (typeof ispanel !== "undefined") {
            if (opener.video.src != video.src) {
                opener.video.src = video.src;
                opener.location = window.location; // 變網址
                opener.video.currentTime = video.currentTime;
            }
        }
    };
    video.onloadstart = function(event) {
        // console.log("video.loadstart()");
        body.className = "wait";
    };
    video.oncanplaythrough = function(event) {
        // console.log("video.canplaythrough()");
        startPlayTime();
        body.className = "ok";
    };
    video.onplay = function(event) { // 影片撥放
        startPlayTime();
        // console.log("video.onPlay()");
        play.className = "pause";
        body.className = "ok";
        // drawVideo = window.setInterval(function() {
        //     // preview.getContext("2d").drawImage(previewVideo, 0, 0, preview.width, preview.height);
        // }, 20);
    };
    video.onpause = function(event) { // 影片暫停
        // window.clearInterval(drawVideo);
        stopPlayTime();
        // console.log("video.onPause()");
        play.className = "play";
        body.className = "wait";
    };
    video.onseeking = function(event) {
        // console.log("video.seeking()");
        body.className = "wait";
    };
    video.ontimeupdate = function(event) { // 時間有改變時
        // console.log("video.ontimeupdate()");
        currentTime.textContent = formatTime(video.currentTime);
        if (!isNaN(video.duration) && video.duration != Infinity) {
        // if (video.seekable.end.length > 0) {
            Draw(progress, video.currentTime / video.duration);
        }
        if (typeof ispanel !== "undefined" && opener.video.currentTime !== video.currentTime) {
            window.opener.video.currentTime = video.currentTime;
        }
    };
    video.ondurationchange = function(event) { // 影片長度改變
        // console.log("video.onDurationchange()");
        if (!isNaN(video.duration)) {
            if (video.duration == Infinity) { // 無限大(保安 可以告訴我檔案多大嗎!!)
                duration.textContent = "??:??";
            } else {
                duration.textContent = formatTime(video.duration);
            }
        }
    };
    video.onvolumechange = function(event) { // 音量有改變時
        // console.log("video.onVolumechange()");
        refreshVolume();
    };
    video.onended = function(event) {
        // console.log("video.ended()");
        body.className = "wait";
        if (localStorage.getItem("autonext")) {
            index(1);
        }
    };
    video.onemptied = function(event) {
        console.log("video.emptied()");
    };
    function onVideoWheel(event) { // 滾輪調整速率
        // console.log("video.mousewheel()");
        if (event.shiftKey) {
            indexRate((event.wheelDelta <= 0 || event.detail > 0) ? -1 : 1);
        }
    };
    if (typeof video.onwheel !== 'undefined') {
        video.onwheel = onVideoWheel;
    } else if (typeof video.onmousewheel !== 'undefined') {
        video.onmousewheel = onVideoWheel;
    }

    function onFrameWheel(event) { // 滾輪調整速率
        // console.log("frame.mousewheel()");
        if (event.shiftKey) {
            indexRate((event.wheelDelta <= 0 || event.detail > 0) ? -1 : 1);
        }
    };
    if (typeof frame.onwheel !== 'undefined') {
        frame.onwheel = onFrameWheel;
    } else if (typeof frame.onmousewheel !== 'undefined') {
        frame.onmousewheel = onFrameWheel;
    }
    video.oncontextmenu = function(event) { // 右鍵
        // console.log("video.onContextmenu()");
        contextMenu.style.left = event.clientX + "px";
        contextMenu.style.top = event.clientY + "px";
        contextMenu.hidden = false;
        return false; // 這層已處理完，所以取消事件
    };
    video.ondblclick = function(event) {
        // console.log("video.onDblclick()");
        fullScreen();
    };
    video.onclick = function(event) { // 點螢幕播放暫停
        // console.log("video.onClick()");
        if (!contextMenu.hidden) {
            contextMenu.hidden = true;
        } else {
            playAndPause();
        }
    };

    frame.onload = function(event) { // Youtube Iframe載入
        // console.log("frame.onLoad()");
    };

    controlBar.onselectstart = function(event) { // 取消反白
        event.preventDefault(); // 略過這層往後送
    };
    controlBar.oncontextmenu = function(event) { // 右鍵
        // alert("右鍵");
        event.preventDefault(); // 略過這層往後送
    };

    play.onclick = function(event) { // 撥放/暫停
        playAndPause();
    };

    progress.onmouseover = function(event) { // 要做預覽功能的
        // var previewVideo = document.createElement("video");
        // previewVideo.src = video.src;

        // previewVideo.currentTime = Math.round(previewVideo.duration * calcPercente(event) * 100) / 100;
        // preview.width = previewVideo.videoWidth * 0.25;
        // preview.height = previewVideo.videoHeight * 0.25;
        // preview.getContext("2d").drawImage(previewVideo, 0, 0, preview.width, preview.height);
    };

    progress.onclick = function(event) { // 調整撥放位置
        Seek(0, calcPercente(event));
    };
    function onVolumeWheel(event) { // 滾輪調整音量
        tempChange = (event.wheelDelta <= 0 || event.detail > 0) ? -1 : 1;
        if (!frame.hidden) { // Youtube播放器
            player.setVolume((tempChange < 0) ? ((player.getVolume() >= 10) ? (player.getVolume() - 10) : 0) : ((player.getVolume() <= 90) ? (player.getVolume() + 10) : 100));
            refreshVolume();
        } else if (!video.hidden) { // 一般播放器
            video.volume = (tempChange < 0) ? ((video.volume >= 0.1) ? video.volume - 0.1 : 0) : ((video.volume <= 0.9) ? video.volume + 0.1 : 1);
        }
    };
    if (typeof volume.onwheel !== 'undefined') {
        volume.onwheel = onVolumeWheel;
    } else if (typeof volume.onmousewheel !== 'undefined') {
        volume.onmousewheel = onVolumeWheel;
    }

    mute.onclick = function(event) { // 靜音
        if (!frame.hidden) { // Youtube播放器
            if (player.isMuted()) {
                player.unMute();
            } else {
                player.mute();
            }
            refreshVolume();
        } else if (!video.hidden) { // 一般播放器
            video.muted = 1 - video.muted;
        }
    };

    volumeSlider.onclick = function(event) { // 音量調整
        if (!frame.hidden) { // Youtube播放器
            player.setVolume(calcPercente(event, "y", true) * 100);
            refreshVolume();
        } else if (!video.hidden) { // 一般播放器
            video.volume = calcPercente(event, "y", true);
        }
    };

    function onRateWheel(event) { // 滾輪調整速率
        indexRate((event.wheelDelta <= 0 || event.detail > 0) ? -1 : 1);
    };
    if (typeof rate.onwheel !== 'undefined') {
        rate.onwheel = onRateWheel;
    } else if (typeof rate.onmousewheel !== 'undefined') { // IE
        rate.onmousewheel = onRateWheel;
    }
    rate.onclick = function(event) { //輸入速率
        tempRate = prompt("速率：");
        console.info("輸入速率:%c" + tempRate, "color: red;");
        if (tempRate != "" && tempRate != null) {
            indexRate(0, tempRate);
        }
    };

    next.onclick = function(event) { // 下一首
        index(1);
    };

    size.onclick = function(event) { // 全螢幕
        fullScreen();
    };

    openPanel.onclick = function(event) { // 開新頁
        if (typeof ispanel === "undefined") {
            video.pause();
            // window.opener = null;
            // window.close();
            panel = window.open(window.location.href, "dialog", "width=854, height=480,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no");
            panel.playTime = video.currentTime;
            panel.ispanel = true;
            // panel.playbackRate = video.playbackRate;
            // panel.playVolume = video.volume;
        } else {
            window.close();
            window.opener.video.play();
            window.opener.currentTime = video.currentTime;
        }
    };

    menu_next.onclick = function(event) { // 選單 - 下一首
        if (!contextMenu.hidden) {
            index(1);
            contextMenu.hidden = true;
        }
    };
    menu_prev.onclick = function(event) { // 選單 - 上一首
        if (!contextMenu.hidden) {
            index(-1);
            contextMenu.hidden = true;
        }
    };
    // 缺少Youtube網址
    menu_newVideo.onclick = function(event) { // 選單 - 在新視窗開啟影片
        if (!contextMenu.hidden) {
            window.open(video.src, "dialog", "width=640, height=360,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no");
            contextMenu.hidden = true;
        }
    };
    // 缺少Youtube網址
    menu_clipVideo.onclick = function(event) { // 選單 - 複製影片網址
        if (!contextMenu.hidden) {
            menu_clipVideo.childNodes[0].innerText = video.src;
            menu_clipVideo.childNodes[0].hidden = false;
            menu_clipVideo.childNodes[0].select();
            document.execCommand("copy");
            menu_clipVideo.childNodes[0].hidden = true;
            contextMenu.hidden = true;
        }
    };
    index();
});