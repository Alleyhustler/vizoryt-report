const ApiUrl = "https://dwcf.gny.io/get/"

// Function to extract Speed_instant_gas value from the JSON response
    function extractSpeedInstantGas(jsonResponse) {
      if (jsonResponse && jsonResponse.length > 0) {
        const { Speed_instant_gas } = jsonResponse[0];
        return Speed_instant_gas.toFixed(2); // Round to 2 decimal places
      }
      return null;
    }

    // Function to fetch the JSON data from the URL
    async function fetchData(url) {
      try {
        const response = await fetch(url);
        return response.json();
      } catch (error) {
        console.log("Error fetching data:", error);
        return null;
      }
    }

    // Function to fetch the data and extract Speed_instant_gas value
    async function fetchDataAndExtractGas() {
      const url = `${ApiUrl}fee/ETHGAS/fee/1h?latest=1`;

      try {
        const jsonResponse = await fetchData(url);
        const speedInstantGas = extractSpeedInstantGas(jsonResponse);
        if (speedInstantGas) {
          document.getElementById('output').textContent = `${speedInstantGas} `;
        }
      } catch (error) {
        console.log('Error:', error);
      }
    }

// ----------------------------------------------------- Fetch Candle Data -----------------------------------------


function jsonToArray(response) {
	const dataArray = Object.entries(response).map(([key, value]) => ({_id: parseInt(key), ...value}));
	return dataArray;
}
async function fetchInitialCandleData(asset, interval, dataPoints, end) {
    let url = `https://dwcf.gny.io/get/exchanges/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}`;
    if (typeof end !== 'undefined') {
        url += end;
    }

    try {
        const fetchedCandleData = await fetch(url)
    	.then(response => response.json())
    	.then(data => data.map(item => ({
        	x: item._id,
        	y: [parseFloat(item.Open), parseFloat(item.High), parseFloat(item.Low), parseFloat(item.Close)]
    	})));
		return fetchedCandleData;
    } catch (error) {
        console.error("Failed to fetch candle data:", error);
        return []; // Return an empty array in case of fetch error
    }
}


let Fib;
// Function to fetch candle data and all indicators
async function fetchCandleDataWithIndicators(chartId, interval, dataPoints, asset, fetchedCandleData = null) {
    if (!fetchedCandleData) {
        fetchedCandleData = await fetchInitialCandleData(asset, interval, dataPoints);
    }

    const { averageData, EMA20Data, EMA5Data, MA200dData, MA200wData } = await fetchAllIndicatorData(asset, interval, dataPoints);

    // Calculate overall min and max values
    let allValues = [];
    fetchedCandleData.forEach(item => allValues.push(...item.y));
    [averageData, EMA20Data, EMA5Data, MA200dData, MA200wData].forEach(dataSet => {
        dataSet.forEach(item => allValues.push(item.value));
    });
    
    const { min: overallMinY, max: overallMaxY } = getMinMaxFromArray(allValues);
    
    // Use overallMinY and overallMaxY for setting the y-axis range
    renderCandlestickChartWithIndicators(chartId, fetchedCandleData, { averageData, EMA20Data, EMA5Data, MA200dData, MA200wData }, overallMinY * 0.95, overallMaxY * 1.05);
}

async function fetchCandleDataBBands(chartId, interval, dataPoints, asset, fetchedCandleData = null) {
    if (!fetchedCandleData) {
        fetchedCandleData = await fetchInitialCandleData(asset, interval, dataPoints);
    }

    const bollingerBandsData = await fetchBollingerBandsData(asset, interval, dataPoints);

    const candleValues = fetchedCandleData.flatMap(item => item.y);
    const { min: minY, max: maxY } = getMinMaxFromArray(candleValues);

    renderCandlestickChartBBands(chartId, fetchedCandleData, bollingerBandsData, minY * 0.95, maxY * 1.05);
}

async function fetchCandleData(chartId, interval, dataPoints, asset, fetchedCandleData = null) {
    if (!fetchedCandleData) {
        fetchedCandleData = await fetchInitialCandleData(asset, interval, dataPoints);
    }

    const candleValues = fetchedCandleData.flatMap(item => item.y);
    const { min: minY, max: maxY } = getMinMaxFromArray(candleValues);

    renderFib(chartId, fetchedCandleData, minY * 0.95, maxY * 1.05);
}

async function fetchCandleDataPSAR(chartId, interval, dataPoints, asset, fetchedCandleData = null) {
    if (!fetchedCandleData) {
        fetchedCandleData = await fetchInitialCandleData(asset, interval, dataPoints);
    }

    const PSARData = await fetchPSARData(asset, interval, dataPoints);

    const candleValues = fetchedCandleData.flatMap(item => item.y);
    const { min: minY, max: maxY } = getMinMaxFromArray(candleValues);

    renderCandlestickChartPSAR(chartId, fetchedCandleData, PSARData, minY * 0.95, maxY * 1.05);
}

async function hik_fetchData(chartId, interval, dataPoints, asset, fetchedCandleData = null) {
    if (!fetchedCandleData) {
        fetchedCandleData = await fetchInitialCandleData(asset, interval, dataPoints);
    }

    const hikData = await hik_fetchIndicatorData(asset, interval, dataPoints);

    const combinedData = fetchedCandleData.map((item, index) => ({
        ...item,
        hik: hikData[index] ? hikData[index].hik : null
    }));

    const candleValues = fetchedCandleData.flatMap(item => item.y);
    const { min: minY, max: maxY } = getMinMaxFromArray(candleValues);

    hik_renderCandlestickChart(chartId, combinedData, minY * 0.85, maxY * 1.15);
}
async function fetchVolumeData(interval, dataPoints, asset) {
		let Url = `https://dwcf.gny.io/get/exchanges/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}`;
		if(typeof end !== 'undefined') { Url += end; }
        const fetchedData = await fetch(`${Url}`)
           	.then(response => response.json())
           	.then(data => data.map(item => ({ x: item._id, y: parseFloat(item.Volume) })));
	return fetchedData;
}


// ---------------------------------------------------------- average / moving averages ------------------------------------------------------
let candlestickChartAverage;
// Generic function to fetch any indicator data
async function fetchIndicatorData(asset, interval, dataPoints, indicatorType) {
    // Validate inputs
    if (!asset || !interval || !dataPoints || !indicatorType) {
        console.error('Invalid parameters for fetchIndicatorData');
        return [];
    }

    let url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=${indicatorType}`;
    if (typeof end !== 'undefined') {
        url += end;
    }

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                // Data validation
                return data.map(item => {
                    if (item && item._id && item.IndicatorData && item.IndicatorData.Value) {
                        return { x: item._id, value: item.IndicatorData.Value };
                    } else {
                        console.error('Invalid item format:', item);
                        return null;
                    }
                }).filter(item => item !== null);
            } else {
                console.error('Unexpected data format:', data);
                return [];
            }
        })
        .catch(error => {
            console.error(`Error fetching indicator data: ${indicatorType}`, error);
            return [];
        });
}
async function fetchAllIndicatorData(asset, interval, dataPoints) {
  try {
    const indicatorTypeArray = [
      'Average_Price',
      'Exponential_Moving_Average_20d',
      'Exponential_Moving_Average_5d',
      'Moving_Average_200d',
      'Moving_Average_200w'
    ];

    // Map each indicator type to a fetch operation
    const fetchPromises = indicatorTypeArray.map(indicatorType => 
      fetchIndicatorData(asset, interval, dataPoints, indicatorType)
    );

    // Wait for all fetch operations to complete; destructuring to name each result based on indicator
    const [averageData, EMA20Data, EMA5Data, MA200dData, MA200wData] = await Promise.all(fetchPromises);

    // Now you have all the fetched data in their respective variables
    return { averageData, EMA20Data, EMA5Data, MA200dData, MA200wData }; // Return an object with all the data
  } catch (error) {
    console.error("Failed to fetch indicator data:", error);
    // Handle error or fallback
  }
}



// ------------------------------------------------------ Bollinger Bands ------------------------------------------------------
let candlestickChartBBands;
async function fetchBollingerBandsData(asset, interval, dataPoints) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=Bollinger_Bands`;
    if(typeof end !== 'undefined') { Url += end; }
    const fetchedData = await fetch(`${Url}`)
        .then(response => response.json())
        .then(data => {
            // Check if the data is an array before mapping
            if (Array.isArray(data)) {
                return data.map(item => ({
                    x: item._id,
                    upper: item.IndicatorData.UpperBand,
                    middle: item.IndicatorData.MiddleBand,
                    lower: item.IndicatorData.LowerBand
                }));
            } else {
                console.log(`fetchedData is not an array - ${fetchedData}`)
                return [];
            }
        });
    
    return fetchedData;
}


// ------------------------------------------------------ Hikkake ------------------------------------------------------
let hik_candlestickChart;
async function hik_fetchIndicatorData(asset, interval, dataPoints) {
     let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=Hikkake_Pattern`;
    if(typeof end !== 'undefined') { Url += end; }
    const fetchedData = await fetch(`${Url}`)
      .then(response => response.json())
      .then(data => {
        // Check if the data is an array before mapping
        if (Array.isArray(data)) {
          return data.map(item => ({
            x: item._id,
            hik: item.IndicatorData.Value
          }));
        } else {
          // If data is not an array, return an empty array
          return [];
        }
      });
    return fetchedData;
}


// ------------------------------------------------------ PSAR ------------------------------------------------------
let candlestickChartPSAR;
async function fetchPSARData(asset, interval, dataPoints) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=Parabolic_SAR`;
    if(typeof end !== 'undefined') { Url += end; }
  const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => {
      // Check if the data is an array before mapping
      if (Array.isArray(data)) {
        return data.map(item => ({
          x: item._id,
          PSAR: item.IndicatorData.Value
        }));
      } else {
        // If data is not an array, return an empty array
        return [];
      }
    });
    
  return fetchedData;
}


// ----------------------------------------------------- Chaikin AD Oscillator -----------------------------------------
let chartInstanceChaikinAD;
let fetchedVolumeData;
async function fetchDataChaikinAD(indicator, interval, dataPoints, asset) {
        let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=${indicator}`;
        console.log(Url);
        const fetchedData = await fetch(`${Url}`)
            .then(response => response.json())
            .then(data => data.map(item => ({ x: item._id, y: parseFloat(item.IndicatorData.Value) })));
	return fetchedData;
}


// ------------------------------------------------------ MACD ------------------------------------------------------
let MACDChartInstance;
let MACDmax;
async function fetchMACDData(asset, interval, dataPoints) {
     let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=MACD`;
    if(typeof end !== 'undefined') { Url += end; }
  const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({
      x: item._id,
      macd: parseFloat(item.IndicatorData.MACD),
      macdSignal: parseFloat(item.IndicatorData.MACD_Signal),
      macdHist: parseFloat(item.IndicatorData.MACD_Hist)
    })));

  let maxVal = Math.max(
    ...fetchedData.map(item => Math.max(item.macd, item.macdSignal, item.macdHist))
  );
  
  MACDmax = maxVal > 10 ? 2 : 10;
  
  return fetchedData;
}


// ------------------------------------------------------ stochastic ------------------------------------------------------
let StochChartInstance;
async function fetchStochData(asset, interval, dataPoints) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=Stochastic`;
    if(typeof end !== 'undefined') { Url += end; }
  const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({
      x: item._id,
      slowK: parseFloat(item.IndicatorData.SlowK),
      slowD: parseFloat(item.IndicatorData.SlowD)
    })));

  return fetchedData;
}


// ------------------------------------------------------ Average directional movement ------------------------------------------------------
let chartInstanceAV;
async function fetchDataAV(indicator, interval, dataPoints, asset) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=${indicator}`;
    if(typeof end !== 'undefined') { Url += end; }
  const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({ x: item._id, y: parseFloat(item.IndicatorData.Value) })));
  return fetchedData;
}


// On Balance Movement 
let chartInstanceOBV;
async function fetchDataOBV(indicator, interval, dataPoints, asset) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=${indicator}`;
    if(typeof end !== 'undefined') { Url += end; }
  const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({ x: item._id, y: parseFloat(item.IndicatorData.Value) })));
  return fetchedData;
}


// ------------------------------------------------------ Ultimate Oscillator ------------------------------------------------------
let chartInstanceUltimateOsc;
async function fetchDataUltimateOsc(indicator, interval, dataPoints, asset) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=${indicator}`;
    if(typeof end !== 'undefined') { Url += end; }
  const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({ x: item._id, y: parseFloat(item.IndicatorData.Value) })));
  return fetchedData;
}


// ------------------------------------------------------ RSI ------------------------------------------------------
let chartInstance;
async function fetchDataUnique(indicator, interval, dataPoints, asset) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=${indicator}`;
    if(typeof end !== 'undefined') { Url += end; }
   const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({ x: item._id, y: parseFloat(item.IndicatorData.Value) })));
  return fetchedData;
}


// ------------------------------------------------------ Coppock ------------------------------------------------------
let chartInstanceCoppock;
async function fetchDataCoppock(asset, interval, dataPoints) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=Coppock_Indicator`;
    if(typeof end !== 'undefined') { Url += end; }
  const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({ x: item._id, y: parseFloat(item.IndicatorData.Value) })));
  return fetchedData;
}


// ------------------------------------------------------ TDSequential ------------------------------------------------------
let chartInstanceTDSequential;
async function fetchDataTDSequential(indicator, interval, dataPoints, asset) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=${indicator}`;
    if(typeof end !== 'undefined') { Url += end; }
   const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({ 
	  x: item._id, 
	  Countdown: parseFloat(item.IndicatorData.countdown),
      Setup: parseFloat(item.IndicatorData.setup) })));
	
	return fetchedData;
}


// ------------------------------------------------------ McClellan ------------------------------------------------------
let chartInstanceMcClellan;
let decimalPlacesMcClellan;
async function fetchDataMcClellan(indicator, interval, dataPoints, asset) {
    let Url = `https://dwcf.gny.io/get/indicators/${asset}USDT/allmarkets/${interval}?latest=${dataPoints}&indicator=${indicator}`;
    if(typeof end !== 'undefined') { Url += end; }
  const fetchedData = await fetch(`${Url}`)
    .then(response => response.json())
    .then(data => data.map(item => ({ x: item._id, y: parseFloat(item.IndicatorData.Value) })));

  var maxVal = Math.max(...fetchedData.map(item => item.y));
  if (maxVal > 10) {
    decimalPlacesMcClellan = 2;
  } else {
    decimalPlacesMcClellan = 6;
  }
  return fetchedData;
}

async function fetchDataGNY(token, indicator, divId) {
  try {
    
    let url;
	  
	if (indicator == 'readout'){
		url = `https://dwcf.gny.io/get/ChatGPT_AllMarket/${token}USDT/allmarket/1d?latest=1&type=nested_readouts`;
	} else {
		url = `https://dwcf.gny.io/get/ChatGPT_AllMarket/${token}USDT/allmarkets/1d?latest=1&indicator=${indicator}`;
	}
	  
	const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Error fetching data');
    }

    const data = await response.json();
    const generated_date = new Date(data[0]._id);
    let start_date = new Date(data[0].start_date);
    let end_date = new Date(data[0].end_date);

    const formatDate = (date, includeTime = false) => {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const dateString = `${date.getUTCDate().toString().padStart(2, '0')}. ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
      return includeTime ? `${dateString} ${date.getUTCHours()}:${date.getUTCMinutes().toString().padStart(2, '0')}` : dateString;
    };

    let responseText;
	let content;
	  
	if  (indicator == 'readout'){
	    responseText = await data[0].Long.replace(/\n/g, '<br>');
		responseText = await responseText.replace('<\/b>', '</b>' )
		responseText = await responseText.replace('\n', '<br>')
	} else {
		responseText = await data[0].response.replace(/\n/g, '<br>');

	}
	  
	content = `
      <p><strong>Generated:</strong> ${formatDate(generated_date, true)} UTC</p>
      <p><strong>Period:</strong> ${formatDate(start_date)} to ${formatDate(end_date)}</p>
      <p><strong>Response:</strong><br> ${responseText}</p>
    `;

    document.getElementById(divId).innerHTML = content;
  } catch (error) {
    console.error('An error occurred:', error);
  }
}
async function fetchBulkDataGNY(token, divIds) {
  try {
	const mainUrl = window.location.origin;
    const url = `${mainUrl}/${token}-json-data/`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Error fetching data');
    }

    const data = await response.json();

    // Create an array of promises to fetch and process data for each divId
    const promises = divIds.map(async (divId, index) => {
      const item = data[index];
      if (item) {
		const generated_date = new Date(item._id); // You can set a custom generated date or use the current date
        const startDate = new Date(item.start_date);
        const endDate = new Date(item.end_date);
        const content = `
          <p><strong>Generated:</strong> ${generated_date.toUTCString()}</p>
          <p><strong>Period:</strong> ${startDate.toUTCString()} to ${endDate.toUTCString()}</p>
          <p><strong>Response:</strong><br> ${item.response}</p>
        `;
        // Set the innerHTML of the divId with the corresponding content
        document.getElementById(divId).innerHTML = content;
      }
    });

    // Wait for all promises to resolve
    await Promise.all(promises);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function fetchDataRR() {
    const selectedCoins = getSelectedCoins();
    const days = Array.from(document.querySelectorAll('input[name="days"]'))
        .find(radioButton => radioButton.checked).value;

    const allChartData = [];
    const allMins = [];
    const allMaxs = [];
    
    try {
        const coinRequests = selectedCoins.map(coin => fetchCoinData(coin, days));
        const coinDataArray = await Promise.all(coinRequests);

        for (let i = 0; i < selectedCoins.length; i++) {
            const coin = selectedCoins[i];
            const coinData = coinDataArray[i];
            let funds = 1;
            const chartData = [];

            for (const dat of coinData) {
                const data = Math.round((funds * 100) - 100, 2);
                chartData.push({ x: new Date(dat._id), y: [data] });
                funds += (funds / 100) * dat.IndicatorData.Value;
                allMins.push(Math.round((funds * 100) - 110, 2));
                allMaxs.push(Math.round((funds * 100) - 90, 2));
            }

            allChartData.push({ name: coin, data: chartData });
        }

        const globalMin = Math.min(...allMins) - 10;
        const globalMax = Math.max(...allMaxs) + 10;

        const options = {
            series: allChartData,
            chart: {
                height: 350,
                foreColor: '#bbbdbb',
                type: 'line',
                toolbar: {
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    }
                },
                animations: {
                    enabled: false
                },
            },
            colors: ['#2176FF', '#BAFF29', "#18D8D8", "#f542bf", "#6A6E94", "#F3B415", "#F27036", "#4E88B4", "#00A7C6", '#A9D794',
                '#46AF78', '#A93F55', '#8C5E58', '#33A1FD', '#7A918D'],
            tooltip: {
                theme: 'dark',
                style: {
                    fontSize: '10px'
                },
                x: {
                    show: false,
                },
            },
            annotations: {
                yaxis: [{ y: 0 }]
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'straight',
                width: 1
            },
            grid: {
                show: false
            },
            xaxis: {
                type: 'datetime'
            },
            yaxis: {
                min: globalMin,
                max: globalMax,
                title: {
                    text: 'Percent',
                    style: {
                        fontSize: '14px',
                        fontWeight: 'normal',
                    }
                }
            },
            legend: {
                onItemClick: {
                    toggleDataSeries: false
                },
            },
        };

        const chartElement = document.querySelector("#RR");
        if (RR) {
            RR.updateOptions(options);
        } else {
            RR = new ApexCharts(chartElement, options);
            RR.render();
        }
    } catch (error) {
        console.error("Error fetching or processing data:", error);
        // Optionally, you can display an error message to the user here.
    }
}
async function fetchCoinData(coin, days) {
    const url = `https://dwcf.gny.io/get/indicators/${coin}USDT/allmarkets/1d?latest=${days}&indicator=PriceDiff`;
    const response = await fetch(url);
    const data = await response.json();
    return data.reverse();
}