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

// 保存价格历史数据
let priceHistory = [];
const maxHistoryLength = 5; // 设置保存的历史记录数量

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

// 根据移动平均线选择上涨或下跌
function chooseBasedOnTrend() {
  const shortTermPeriod = 2; // 短期移动平均线周期
  const longTermPeriod = 5;  // 长期移动平均线周期

  if (priceHistory.length < longTermPeriod) {
    return Math.random() < 0.5 ? 'up' : 'down';
  }

  const shortTermWMA = calculateWeightedMovingAverage(priceHistory, shortTermPeriod);
  const longTermWMA = calculateWeightedMovingAverage(priceHistory, longTermPeriod);

  const shortTermEMA = calculateExponentialMovingAverage(priceHistory, shortTermPeriod);
  const longTermEMA = calculateExponentialMovingAverage(priceHistory, longTermPeriod);

  // 比较不同的技术指标
  if (shortTermEMA > longTermEMA || shortTermWMA > longTermWMA) {
    return 'up';
  } else {
    return 'down';
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
  } else {
    clickButton(downButtonSelector);
    console.log('选择：下跌');
  }
}

// 定义定时器变量
let guessIntervalId;
let fuelRecoveryIntervalId;

// 开始定时器函数
function startGuessing() {
  function checkFuelAndGuess() {
    const fuelCount = getFuelCount();
    console.log(`当前燃料: ${fuelCount}/10`);

    if (fuelCount > 0) {
      // 更新价格历史
      const currentPrice = getBTCPrice();
      if (currentPrice !== null) {
        priceHistory.push(currentPrice);
        if (priceHistory.length > maxHistoryLength) {
          priceHistory.shift(); // 保持价格历史在指定的长度
        }
      }

      // 进行BTC价格的猜测
      guessBTCPrice();

      // 设置随机的猜测时间间隔
      const randomInterval = Math.floor(Math.random() * 5000) + 5000; // 随机时间在5秒到10秒之间
      clearInterval(guessIntervalId);
      guessIntervalId = setInterval(checkFuelAndGuess, randomInterval);
    } else {
      console.log('燃料耗尽，等待恢复...');
    }
  }

  checkFuelAndGuess(); // 立即执行一次检查和猜测

  // 每隔80秒检查一次燃料恢复情况
  fuelRecoveryIntervalId = setInterval(() => {
    const fuelCount = getFuelCount();
    console.log(`检查燃料数量: ${fuelCount}/10`);
    if (fuelCount === 10) {
      console.log('燃料已恢复，继续猜测');
      checkFuelAndGuess(); // 恢复后立即执行一次检查和猜测
    } else {
      console.log('燃料未恢复，继续等待...');
    }
  }, 80000); // 每80秒检查一次燃料情况
}

// 停止定时器函数
function stopGuessing() {
  clearInterval(guessIntervalId);
  clearInterval(fuelRecoveryIntervalId);
  console.log('停止猜测');
}

// 启动定时器
startGuessing();

// 在控制台手动启动和停止定时器
window.startGuessing = startGuessing;
window.stopGuessing = stopGuessing;