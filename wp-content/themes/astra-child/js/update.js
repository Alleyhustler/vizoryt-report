async function updateChartBBands(asset) {
     const { interval, dataPoints } = await calculateDataPoints('intervalBBands', 'daysBBands');
    fetchCandleDataBBands('candlestickChartBBands', interval, dataPoints, asset);
}
async function updateChartWithIndicators(asset) {
    const { interval, dataPoints } = await calculateDataPoints('intervalAverage', 'daysAverage');
    fetchCandleDataWithIndicators('candlestickChartAverage', interval, dataPoints, asset);
}
async function updateFibChart(asset) {
    const { interval, dataPoints } = await calculateDataPoints('intervalFib', 'daysFib');
    fetchCandleData('Fib', interval, dataPoints, asset);
}
async function updateChartPSAR(asset) {
    const { interval, dataPoints } = await calculateDataPoints('intervalPSAR', 'daysPSAR');
    fetchCandleDataPSAR('candlestickChartPSAR', interval, dataPoints, asset);
}
async function updateChartMACD(asset) {
  const { interval, dataPoints } = await calculateDataPoints('intervalMACD', 'daysMACD');
  const macdData = await fetchMACDData(asset, interval, dataPoints);
  renderMACDChart('MACDChart', macdData);
}
async function updateChartStoch(asset) {
  const { interval, dataPoints } = await calculateDataPoints('intervalStoch', 'daysStoch');
  const stochData = await fetchStochData(asset, interval, dataPoints);
  renderStochChart('StochChart', stochData);
}
async function hik_updateChart(asset) {
    const { interval, dataPoints } = await calculateDataPoints('intervalHik', 'daysHik');
    hik_fetchData('candlestickChart', interval, dataPoints, asset);
}
async function updateChartTDSequential(indicator, asset) {
  const { interval, dataPoints } = await calculateDataPoints('intervalTDSequential', 'daysTDSequential');
  const TDSequentialData = await fetchDataTDSequential(indicator, interval, dataPoints, asset);
  renderChartTDSequential('TDSequentialChart', TDSequentialData);
};
async function updateChartCoppock(indicator, asset) {
  const { interval, dataPoints } = await calculateDataPoints('intervalCoppock', 'daysCoppock');
  const CoppockData = await fetchDataCoppock(asset, interval, dataPoints);
  renderChartCoppock('CoppockChart', CoppockData, [{y: 0}], {min: 0, max: 100});
};
async function updateChartAV(indicator, asset) {
  	const { interval, dataPoints } = await calculateDataPoints('intervalCAV', 'daysCAV');
  	const AVData = await fetchDataAV(indicator, interval, dataPoints, asset);
    if (chartInstanceAV) {
    	chartInstanceAV.updateSeries([{ data: AVData }]);
  	} else {
    	renderChartAV('AVGChart', AVData, [{y: 25}], {min: 0, max: 100});
  	}
};
async function updateChartOBV(indicator, asset) {
  	const { interval, dataPoints } = await calculateDataPoints('intervalOBV', 'daysOBV');
  	const OBVData = await fetchDataOBV(indicator, interval, dataPoints, asset);
    if (chartInstanceOBV) {
    	chartInstanceOBV.updateSeries([{ data: OBVData }]);
  	} else {
    	renderChartOBV('OBVChart', OBVData, [{y: 30}, {y: 70}], {min: 0, max: 100});
  	}
};
async function updateChartUltimateOsc(indicator, asset) {
  	const { interval, dataPoints } = await calculateDataPoints('intervalUltimateOsc', 'daysUltimateOsc');
  	const UltimateOscData = await fetchDataUltimateOsc(indicator, interval, dataPoints, asset);
    if (chartInstanceUltimateOsc) {
    	chartInstanceUltimateOsc.updateSeries([{ data: UltimateOscData }]);
  	} else {
    	renderChartUltimateOsc('UltimateOscChart', UltimateOscData, [{y: 30}, {y: 70}], {min: 0, max: 100});
  	}
};
async function updateChartUnique(indicator, asset) {
  	const { interval, dataPoints } = await calculateDataPoints('intervalC', 'daysC');
  	const UniqueData = await fetchDataUnique(indicator, interval, dataPoints, asset);
    if (chartInstance) {
    	chartInstance.updateSeries([{ data: UniqueData }]);
  	} else {
    	renderChartUnique('UniqueChart', UniqueData, [{y: 30}, {y: 70}], {min: 0, max: 100});
  	}
};
async function updateChartMcClellan(indicator, asset) {
   const { interval, dataPoints } = await calculateDataPoints('intervalC', 'daysC');
   const McClellanData = await fetchDataMcClellan(indicator, interval, dataPoints, asset);
    if (chartInstanceMcClellan) {
    	chartInstanceMcClellan.updateSeries([{ data: McClellanData }]);
  	} else {
    	renderChartMcClellan('McClellanChart', McClellanData, [{y: 0}], {min: 0, max: 100});
  	}
};
async function updateChartChaikinAD(indicator, asset) {
  	const { interval, dataPoints } = await calculateDataPoints('intervalChaikinAD', 'daysChaikinAD');
  	const indicatorData = await fetchDataChaikinAD(indicator, interval, dataPoints, asset);
	//const indicatorValues = indicatorData.map(point => point.y);
	// Optimized calculation of indicatorAxis
	let indicatorMin = Infinity;
	let indicatorMax = -Infinity;

	for (const point of indicatorData) {
    	const value = point.y;
    	if (value < indicatorMin) indicatorMin = value;
    	if (value > indicatorMax) indicatorMax = value;
	}

	const indicatorAxis = {
    	min: indicatorMin * 0.99, // 1% less than the minimum
    	max: indicatorMax * 1.01  // 1% more than the maximum
	};

	// Fetch and process volume data
	const volumeData = await fetchVolumeData(interval, dataPoints, asset);
	let volumeMin = Infinity;
	let volumeMax = -Infinity;

	const volume = volumeData.map(point => {
    	const volumeValue = point.y;
    	if (volumeValue < volumeMin) volumeMin = volumeValue;
    	if (volumeValue > volumeMax) volumeMax = volumeValue;
    	return volumeValue;
	});

const volumeAxis = {
    min: volumeMin * 0.99, // 1% less than the minimum
    max: volumeMax * 1.01  // 1% more than the maximum
};
  	if (chartInstanceChaikinAD) {
      chartInstanceChaikinAD.updateOptions({
          yaxis: [
              {
                  seriesName: 'Indicator',
                  min: indicatorAxis.min,
                  max: indicatorAxis.max,
                  decimalsInFloat: 2,
                  title: {
                      text: 'Chaikin AD'
                  }
              },
              {
                  seriesName: 'Volume',
                  opposite: true,
                  min: volumeAxis.min,
                  max: volumeAxis.max,
                  decimalsInFloat: 2,
                  title: {
                      text: 'Volume'
                  }
              }
          ]
      });
      chartInstanceChaikinAD.updateSeries([
          { data: indicatorData },
          { data: volumeData }
      ]);
  } else {
      renderChartChaikinAD(`ChaikinADChart`, indicatorData, volumeData, indicatorAxis, volumeAxis);
  }
};