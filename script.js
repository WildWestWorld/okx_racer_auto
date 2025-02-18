// 模拟点击按钮的函数
function clickButton(selector) {
    const button = document.querySelector(selector);
    if (button) {
        button.click();
    } else {
        console.log(`未找到选择器为 ${selector} 的按钮`);
    }
}

// 获取元素文本内容的函数
function getTextContent(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent : null;
}

// 获取燃料数量
function getFuelCount() {
    const fuelElement = document.querySelector('.FuelIndicator_description__EaUsa');
    if (fuelElement) {
        const fuelText = fuelElement.innerText;
        const match = fuelText.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
    }
    return 0;
}

// 获取最大燃料数
function getMaxFuelCount() {
    const maxFuelElement = document.querySelector('.FuelIndicator_maxChances__OMSHl');
    if (maxFuelElement) {
        return parseInt(maxFuelElement.textContent, 10);
    }
    return 10; // 默认值，如果无法获取到最大燃料数
}

// 保存价格历史数据
let priceHistory = [];
const maxHistoryLength = 20; // 设置保存的历史记录数量，增加到20以用于短期和布林带计算
const predictionDelay = 5; // 预测5秒后的趋势

// 获取BTC价格
function getBTCPrice() {
    const priceElement = document.querySelector('.CoinPrice_value__ZjRZz');
    if (priceElement) {
        const priceText = priceElement.innerText.replace(/[^\d.-]/g, '');
        return parseFloat(priceText);
    }
    return null;
}

// 计算加权移动平均线 (WMA)
function calculateWeightedMovingAverage(prices, period) {
    if (prices.length < period) return null;

    const slice = prices.slice(-period);
    const weights = Array.from({ length: period }, (_, i) => i + 1);
    const sum = slice.reduce((acc, price, index) => acc + price * weights[index], 0);
    const weightSum = weights.reduce((acc, weight) => acc + weight, 0);
    return sum / weightSum;
}

// 计算指数移动平均线 (EMA)
function calculateExponentialMovingAverage(prices, period) {
    if (prices.length < period) return null;

    const k = 2 / (period + 1);
    let ema = prices[0]; // 初始EMA值为第一天的价格

    for (let i = 1; i < prices.length; i++) {
        ema = (prices[i] - ema) * k + ema;
    }

    return ema;
}

// 计算相对强弱指数 (RSI)
function calculateRSI(prices, period) {
    if (prices.length < period) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < period; i++) {
        const difference = prices[i] - prices[i - 1];
        if (difference >= 0) {
            gains += difference;
        } else {
            losses -= difference;
        }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// 计算布林带
function calculateBollingerBands(prices, period = 20, k = 2) {
    if (prices.length < period) return null;

    const slice = prices.slice(-period);
    const sma = slice.reduce((acc, price) => acc + price, 0) / period;
    const variance = slice.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
        upper: sma + k * stdDev,
        lower: sma - k * stdDev,
        middle: sma
    };
}

// 计算MACD
function calculateMACD(prices, shortPeriod, longPeriod, signalPeriod) {
    const shortEMA = calculateExponentialMovingAverage(prices, shortPeriod);
    const longEMA = calculateExponentialMovingAverage(prices, longPeriod);
    if (shortEMA === null || longEMA === null) return null;

    const macdLine = shortEMA - longEMA;
    const signalLine = calculateExponentialMovingAverage(prices.slice(-signalPeriod), signalPeriod);
    if (signalLine === null) return null;

    return {
        macdLine: macdLine,
        signalLine: signalLine,
        histogram: macdLine - signalLine
    };
}

// 综合多个指标进行预测
function chooseBasedOnTrend() {
    const shortTermPeriod = 5; // 短期移动平均线周期
    const longTermPeriod = 14; // 长期移动平均线周期
    const rsiPeriod = 14;      // RSI周期
    const macdShortPeriod = 12;
    const macdLongPeriod = 26;
    const macdSignalPeriod = 9;

    if (priceHistory.length < longTermPeriod + predictionDelay) {
        return null; // 数据不足，不进行预测
    }

    const futurePrices = priceHistory.slice(-longTermPeriod - predictionDelay, -predictionDelay);

    const shortTermWMA = calculateWeightedMovingAverage(futurePrices, shortTermPeriod);
    const longTermWMA = calculateWeightedMovingAverage(futurePrices, longTermPeriod);

    const shortTermEMA = calculateExponentialMovingAverage(futurePrices, shortTermPeriod);
    const longTermEMA = calculateExponentialMovingAverage(futurePrices, longTermPeriod);

    const rsi = calculateRSI(futurePrices, rsiPeriod);

    const macd = calculateMACD(futurePrices, macdShortPeriod, macdLongPeriod, macdSignalPeriod);

    const bollingerBands = calculateBollingerBands(futurePrices);

    // 确认趋势逻辑
    let upSignal = 0;
    let downSignal = 0;

    if (shortTermEMA > longTermEMA) upSignal++;
    else downSignal++;

    if (shortTermWMA > longTermWMA) upSignal++;
    else downSignal++;

    if (macd && macd.histogram > 0) upSignal++;
    else downSignal++;

    if (rsi < 30) upSignal++; // RSI低于30表示超卖，可能上涨
    else if (rsi > 70) downSignal++; // RSI高于70表示超买，可能下跌

    if (bollingerBands) {
        if (futurePrices[futurePrices.length - 1] < bollingerBands.lower) upSignal++;
        if (futurePrices[futurePrices.length - 1] > bollingerBands.upper) downSignal++;
    }

    if (upSignal > downSignal) {
        return 'up';
    } else if (downSignal > upSignal) {
        return 'down';
    } else {
        return null; // 无法确定趋势，不进行预测
    }
}

// 随机选择上涨或下跌按钮并点击
function guessBTCPrice() {
    const upButtonSelector = '.ButtonContainer_btn__AmQTp:nth-child(1)';
    const downButtonSelector = '.ButtonContainer_btn__AmQTp:nth-child(2)';

    const choice = chooseBasedOnTrend();
    if (choice === 'up') {
        clickButton(upButtonSelector);
        console.log('选择：上涨');
    } else if (choice === 'down') {
        clickButton(downButtonSelector);
        console.log('选择：下跌');
    } else {
        console.log('无法确定趋势，不进行预测');
    }
}

// 定义定时器变量
let guessIntervalId;
let fuelRecoveryIntervalId;
let pageRefreshIntervalId;
let fuelCheckingIntervalId;

// 检查燃料并开始猜测
function checkFuelAndGuess() {
    const fuelCount = getFuelCount();
    const maxFuelCount = getMaxFuelCount();
    console.log(`当前燃料: ${fuelCount}/${maxFuelCount}`);

    if (fuelCount > 0) {
        // 更新价格历史
        const currentPrice = getBTCPrice();
        if (currentPrice !== null) {
            priceHistory.push(currentPrice);
            if (priceHistory.length > maxHistoryLength) {
                priceHistory.shift(); // 保持价格历史在指定的长度
            }
            console.log(`当前价格: ${currentPrice}`);
        }

        // 进行BTC价格的猜测
        guessBTCPrice();

        // 设置随机的猜测时间间隔
        const randomInterval = Math.floor(Math.random() * 1000) + 1000; // 随机时间在1秒到2秒之间
        clearInterval(guessIntervalId);
        guessIntervalId = setInterval(checkFuelAndGuess, randomInterval);
    } else {
        console.log('燃料耗尽，等待恢复...');
        clearInterval(guessIntervalId);
        // 每隔30秒检查一次燃料恢复情况
        fuelCheckingIntervalId = setInterval(() => {
            const fuelCount = getFuelCount();
            if (fuelCount > 0) {
                console.log('燃料已恢复，继续猜测');
                clearInterval(fuelCheckingIntervalId);
                checkFuelAndGuess();
            }
        }, 30000); // 每30秒检查一次燃料情况
    }
}

// 开始定时器函数
function startGuessing() {
    // 收集价格数据的函数
    function collectPriceData() {
        const currentPrice = getBTCPrice();
        if (currentPrice !== null) {
            priceHistory.push(currentPrice);
            if (priceHistory.length > maxHistoryLength) {
                priceHistory.shift(); // 保持价格历史在指定的长度
            }
            console.log(`收集价格数据: ${currentPrice}`);
        }

        if (priceHistory.length >= maxHistoryLength) {
            clearInterval(priceDataIntervalId);
            checkFuelAndGuess(); // 确保价格数据足够后立即检查燃料并开始猜测
        }
    }

    const priceDataIntervalId = setInterval(collectPriceData, 1000); // 每秒收集一次价格数据

    // 每15分钟刷新页面一次
    pageRefreshIntervalId = setInterval(() => {
        console.log('每15分钟刷新页面一次');
        location.reload();
    }, 15 * 60 * 1000); // 15分钟
}

// 停止定时器函数
function stopGuessing() {
    clearInterval(guessIntervalId);
    clearInterval(fuelRecoveryIntervalId);
    clearInterval(pageRefreshIntervalId);
    clearInterval(fuelCheckingIntervalId);
    console.log('停止猜测');
}

// 延迟启动定时器函数
function delayedStartGuessing() {
    setTimeout(startGuessing, 3000); // 延迟3秒后启动定时器
}

// 启动定时器
delayedStartGuessing();

// 在控制台手动启动和停止定时器
window.startGuessing = startGuessing;
window.stopGuessing = stopGuessing;