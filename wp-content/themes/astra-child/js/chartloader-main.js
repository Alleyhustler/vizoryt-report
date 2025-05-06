// code by Fabian Olesen AKA TheExiledMonk
// set default V2

//let asset='BTC';
//let asset = 'DOGE';
let end = "";
let test="";

// do we have end specified in url, if yes, store in const end
const urlParams = new URLSearchParams(window.location.search);
const paramName = 'end';

if (urlParams.has(paramName)) {
    const paramValue = urlParams.get(paramName);
    end = `?${paramName}=${paramValue}`;
}

// --------------------------- load all charts --------------------------------------
// Testing Direct load after asset has been set.

//Doesnt work
//window.addEventListener(asset, Set_Asset(asset), false);

// Faster than DOMContentLoaded
/*document.addEventListener('readystatechange', () => {
	Set_Asset(asset);
	
});*/

// Slowest implementation
/*document.addEventListener('DOMContentLoaded', () => {
    Set_Asset(asset);
});*/

let RR;

async function buildTableCOR() {
	const response = await fetch('https://dwcf.gny.io/get/correlation/BTC/token/1d?latest=367&indicator=correlations');
  	const data = await response.json();
  	const dataArray = Object.entries(data).map(([key, value]) => ({_id: parseInt(key), ...value}));

  	dataArray.sort((a, b) => b._id - a._id); // sort descending by _id

  	const currentYearData = dataArray[0];
  	const previousYearData = await dataArray.find(d => new Date(d._id).getFullYear() === new Date(currentYearData._id).getFullYear() - 1);

    const headerRow1 = document.getElementById("headerRow1");
    const headerRow2 = document.getElementById("headerRow2");
    const tbody = document.getElementById("tableBody");

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    headerRow1.innerHTML = `<th></th><th></th><th colspan="${Object.keys(currentYearData).length - 1}">${currentYear} (to date)</th>`;
    
    // Filter out the _id and reverse the stock order
    const stocks = Object.keys(currentYearData).filter(stock => stock !== '_id').reverse();
    
    // Exclude the _id from being displayed
    headerRow2.innerHTML = `<th></th><th></th>${stocks.map(stock => `<th>${stock}</th>`).join('')}`;

    let i = 0;
    stocks.forEach(stock1 => {
        const tr = document.createElement("tr");

        if (i === 0) {
            const th = document.createElement("th");
            th.rowSpan = stocks.length;

            // Create a span element to hold the text
            const textSpan = document.createElement("span");
            th.style.width = "12px";
            textSpan.textContent = previousYear;
            textSpan.classList.add("vertical-text");

            // Append the span to the th element
            th.appendChild(textSpan);

            tr.appendChild(th);
        }

        const th = document.createElement("th");
        th.textContent = stock1;
        tr.appendChild(th);

        let j = 0;
        stocks.forEach(stock2 => {
            const td = document.createElement("td");

            if (i < j) {
                const value = currentYearData[stock1] && currentYearData[stock1][stock2] !== undefined ? currentYearData[stock1][stock2] : " ";
                const displayValue = value === 1 ? " " : value;
                td.classList.add("tableCOR");
                td.style.backgroundColor = getColor(displayValue);
                if (value === 1)
                {
                    td.style.backgroundColor = getColor(value);
                    td.textContent = "";
                }else{
                    td.textContent = parseFloat(displayValue).toFixed(2);
                }
            } else {
                const value = previousYearData[stock1] && previousYearData[stock1][stock2] !== undefined ? previousYearData[stock1][stock2] :  "´";
                const displayValue = value === 1 ? " " : value;
                td.style.backgroundColor = getColor(displayValue);
                td.classList.add("tableCOR");
                if (value === 1)
                {
                    td.style.backgroundColor = getColor(value);
                    td.textContent = "";
                }else{
                    td.textContent = parseFloat(displayValue).toFixed(2);
                }
            }

            tr.appendChild(td);
            j++;
        });
        tbody.appendChild(tr);
        i++;
    });
}

let prebuildRR=0;

async function Set_Asset(token) {
    let initialCandleData;
    asset = token; // Normalize asset to lowercase
	const lowercaseAsset = asset.toLowerCase();

    if (prebuildRR === 0) {
        initialCandleData = await fetchInitialCandleData(asset, '1d', 30);

        const initialPromises = [
            buildTableCOR(),
            fetchDataRR(),
            fetchBulkDataGNY(lowercaseAsset, [
                'Average', 'BBand', 'Hikkake', 'Stochastic', 'Fibn', 'PSAR', 
                'ChaikinAD', 'Avg', 'OBV', 'Ultimate', 'RSI', 'McCellan', 
                'Coppock', 'MACD', 'TokenReadout'
            ])
        ];

        const updatePromises = createUpdatePromises(asset, initialCandleData);

        // Combine and await all promises concurrently
        await Promise.all([...initialPromises, ...updatePromises]);

        prebuildRR = 1;
    } else {
        clearCharts();

        const updatePromises = createUpdatePromises(asset, initialCandleData);

        // Await only the update promises
        await Promise.all(updatePromises);
    }
}

function createUpdatePromises(asset, initialCandleData) {
    return [
        fetchCandleDataWithIndicators('candlestickChartAverage', '1d', 30, asset, initialCandleData),
        fetchCandleDataBBands('candlestickChartBBands', '1d', 30, asset, initialCandleData),
        fetchCandleData('Fib', '1d', 30, asset, initialCandleData),
        fetchCandleDataPSAR('candlestickChartPSAR', '1d', 30, asset, initialCandleData),
        hik_fetchData('candlestickChart', '1d', 30, asset, initialCandleData),
        updateChartMACD(asset),
        updateChartStoch(asset),
        updateChartChaikinAD('Chaikin_AD_Oscillator', asset),
        updateChartAV('Average_Directional_Movement_Index', asset),
        updateChartOBV('On_Balance_Volume', asset),
        updateChartUltimateOsc('Ultimate_Oscillator', asset),
        updateChartUnique('Relative_Strength_Index', asset),
        updateChartMcClellan('McClellan_Oscillator', asset),
        updateChartCoppock('Coppock_Indicator', asset),
        printInClass('assetname', asset),
        fetchDataAndExtractGas()
    ];
}

function clearCharts() {
    const divIds = [
        'candlestickChartBBands', 'candlestickChartAverage', 'candlestickChart', 'MACDChart', 
        'StochChart', 'Fib', 'candlestickChartPSAR', 'AVGChart', 'OBVChart', 
        'UltimateOscChart', 'UniqueChart', 'McClellanChart', 'CoppockChart' ]
    divIds.forEach(clearDiv);
}

// refresher
function refreshCharts() {
    Set_Asset(asset);
}
function msUntilNext5thMinute() {
    var now = new Date();
    var next = new Date();

    if (now.getMinutes() >= 5) {
        // if we're past the 5th minute, go to the 5th minute of the next hour
        next.setHours(now.getHours() + 1);
    }

    next.setMinutes(5);
    next.setSeconds(0);
    next.setMilliseconds(0);

    return next.getTime() - now.getTime();
}

// Wait until the next 5th minute, then refresh every hour
setTimeout(function() {
	refreshCharts();
    setInterval(refreshCharts, 60*60*1000);
}, msUntilNext5thMinute());

// Run at startup
Set_Asset(asset);