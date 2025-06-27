// stats.js r6 - http://github.com/mrdoob/stats.js
var Stats = function () {

    // 配色方案
    var COLORS = {
        fps: { bg: { r: 16, g: 16, b: 48 }, fg: { r: 0, g: 255, b: 255 } },
        ms:  { bg: { r: 16, g: 48, b: 16 }, fg: { r: 0, g: 255, b: 0 } },
        mb:  { bg: { r: 48, g: 16, b: 26 }, fg: { r: 255, g: 0, b: 128 } }
    };

    // 状态
    var mode = 0; // 0: fps, 1: ms, 2: mb
    var modeCount = 2; // 默认2，若支持内存检测则为3

    // 计时
    var frame = 0;
    var now = Date.now();
    var last = now, lastFps = now;
    var minMs = 1000, maxMs = 0;
    var minFps = 1000, maxFps = 0;
    var minMb = 1000, maxMb = 0;

    // FPS
    var fps = 0;

    // DOM
    var container = document.createElement("div");
    container.style.cursor = "pointer";
    container.style.width = "80px";
    container.style.opacity = "0.9";
    container.style.zIndex = "10001";

    // 工具函数：更新canvas上的图表
    function updateGraph(imageData, value, type) {
        var colors = COLORS[type];
        var data = imageData.data;
        var fg = colors.fg;
        var bg = colors.bg;
        var i, j, index;

        // 左移一列
        for (i = 0; i < 30; i++) {
            for (j = 0; j < 73; j++) {
                index = (j + i * 74) * 4;
                data[index]     = data[index + 4];
                data[index + 1] = data[index + 5];
                data[index + 2] = data[index + 6];
            }
        }
        // 新的一列
        for (i = 0; i < 30; i++) {
            index = (73 + i * 74) * 4;
            if (i < value) {
                data[index]     = bg.r;
                data[index + 1] = bg.g;
                data[index + 2] = bg.b;
            } else {
                data[index]     = fg.r;
                data[index + 1] = fg.g;
                data[index + 2] = fg.b;
            }
        }
    }

    // DOM节点：FPS
    var fpsPanel = document.createElement("div");
    fpsPanel.style.backgroundColor = `rgb(${Math.floor(COLORS.fps.bg.r / 2)},${Math.floor(COLORS.fps.bg.g / 2)},${Math.floor(COLORS.fps.bg.b / 2)})`;
    fpsPanel.style.padding = "2px 0px 3px 0px";
    container.appendChild(fpsPanel);

    var fpsText = document.createElement("div");
    fpsText.style.fontFamily = "Helvetica, Arial, sans-serif";
    fpsText.style.textAlign = "left";
    fpsText.style.fontSize = "9px";
    fpsText.style.color = `rgb(${COLORS.fps.fg.r},${COLORS.fps.fg.g},${COLORS.fps.fg.b})`;
    fpsText.style.margin = "0px 0px 1px 3px";
    fpsText.innerHTML = '<span style="font-weight:bold">FPS</span>';
    fpsPanel.appendChild(fpsText);

    var fpsCanvas = document.createElement("canvas");
    fpsCanvas.width = 74;
    fpsCanvas.height = 30;
    fpsCanvas.style.display = "block";
    fpsCanvas.style.marginLeft = "3px";
    fpsPanel.appendChild(fpsCanvas);

    var fpsCtx = fpsCanvas.getContext("2d");
    fpsCtx.fillStyle = `rgb(${COLORS.fps.bg.r},${COLORS.fps.bg.g},${COLORS.fps.bg.b})`;
    fpsCtx.fillRect(0, 0, fpsCanvas.width, fpsCanvas.height);
    var fpsImage = fpsCtx.getImageData(0, 0, fpsCanvas.width, fpsCanvas.height);

    // DOM节点：MS
    var msPanel = document.createElement("div");
    msPanel.style.backgroundColor = `rgb(${Math.floor(COLORS.ms.bg.r / 2)},${Math.floor(COLORS.ms.bg.g / 2)},${Math.floor(COLORS.ms.bg.b / 2)})`;
    msPanel.style.padding = "2px 0px 3px 0px";
    msPanel.style.display = "none";
    container.appendChild(msPanel);

    var msText = document.createElement("div");
    msText.style.fontFamily = "Helvetica, Arial, sans-serif";
    msText.style.textAlign = "left";
    msText.style.fontSize = "9px";
    msText.style.color = `rgb(${COLORS.ms.fg.r},${COLORS.ms.fg.g},${COLORS.ms.fg.b})`;
    msText.style.margin = "0px 0px 1px 3px";
    msText.innerHTML = '<span style="font-weight:bold">MS</span>';
    msPanel.appendChild(msText);

    var msCanvas = document.createElement("canvas");
    msCanvas.width = 74;
    msCanvas.height = 30;
    msCanvas.style.display = "block";
    msCanvas.style.marginLeft = "3px";
    msPanel.appendChild(msCanvas);

    var msCtx = msCanvas.getContext("2d");
    msCtx.fillStyle = `rgb(${COLORS.ms.bg.r},${COLORS.ms.bg.g},${COLORS.ms.bg.b})`;
    msCtx.fillRect(0, 0, msCanvas.width, msCanvas.height);
    var msImage = msCtx.getImageData(0, 0, msCanvas.width, msCanvas.height);

    // 检查是否支持内存检测
    try {
        if (performance && performance.memory && performance.memory.totalJSHeapSize) {
            modeCount = 3;
        }
    } catch (e) {}

    // DOM节点：MB（内存）
    var mbPanel = document.createElement("div");
    mbPanel.style.backgroundColor = `rgb(${Math.floor(COLORS.mb.bg.r / 2)},${Math.floor(COLORS.mb.bg.g / 2)},${Math.floor(COLORS.mb.bg.b / 2)})`;
    mbPanel.style.padding = "2px 0px 3px 0px";
    mbPanel.style.display = "none";
    container.appendChild(mbPanel);

    var mbText = document.createElement("div");
    mbText.style.fontFamily = "Helvetica, Arial, sans-serif";
    mbText.style.textAlign = "left";
    mbText.style.fontSize = "9px";
    mbText.style.color = `rgb(${COLORS.mb.fg.r},${COLORS.mb.fg.g},${COLORS.mb.fg.b})`;
    mbText.style.margin = "0px 0px 1px 3px";
    mbText.innerHTML = '<span style="font-weight:bold">MB</span>';
    mbPanel.appendChild(mbText);

    var mbCanvas = document.createElement("canvas");
    mbCanvas.width = 74;
    mbCanvas.height = 30;
    mbCanvas.style.display = "block";
    mbCanvas.style.marginLeft = "3px";
    mbPanel.appendChild(mbCanvas);

    var mbCtx = mbCanvas.getContext("2d");
    mbCtx.fillStyle = "#301010";
    mbCtx.fillRect(0, 0, mbCanvas.width, mbCanvas.height);
    var mbImage = mbCtx.getImageData(0, 0, mbCanvas.width, mbCanvas.height);

    // 点击切换统计类型
    container.addEventListener("click", function () {
        mode = (mode + 1) % modeCount;
        fpsPanel.style.display = "none";
        msPanel.style.display = "none";
        mbPanel.style.display = "none";
        if (mode === 0) fpsPanel.style.display = "block";
        if (mode === 1) msPanel.style.display = "block";
        if (mode === 2) mbPanel.style.display = "block";
    });

    // 更新方法
    return {
        domElement: container,
        update: function () {
            frame++;
            now = Date.now();

            // 计算MS
            var ms = now - last;
            minMs = Math.min(minMs, ms);
            maxMs = Math.max(maxMs, ms);
            updateGraph(msImage, Math.min(30, 30 - ms / 200 * 30), "ms");
            msText.innerHTML = `<span style="font-weight:bold">${ms} MS</span> (${minMs}-${maxMs})`;
            msCtx.putImageData(msImage, 0, 0);
            last = now;

            // 每秒统计一次FPS
            if (now > lastFps + 1000) {
                fps = Math.round(frame * 1000 / (now - lastFps));
                minFps = Math.min(minFps, fps);
                maxFps = Math.max(maxFps, fps);
                updateGraph(fpsImage, Math.min(30, 30 - fps / 100 * 30), "fps");
                fpsText.innerHTML = `<span style="font-weight:bold">${fps} FPS</span> (${minFps}-${maxFps})`;
                fpsCtx.putImageData(fpsImage, 0, 0);

                // 内存统计
                if (modeCount === 3) {
                    var mb = performance.memory.usedJSHeapSize * 9.54e-7; // 转换为MB
                    minMb = Math.min(minMb, mb);
                    maxMb = Math.max(maxMb, mb);
                    updateGraph(mbImage, Math.min(30, 30 - mb / 2), "mb");
                    mbText.innerHTML = `<span style="font-weight:bold">${Math.round(mb)} MB</span> (${Math.round(minMb)}-${Math.round(maxMb)})`;
                    mbCtx.putImageData(mbImage, 0, 0);
                }

                lastFps = now;
                frame = 0;
            }
        }
    };
};