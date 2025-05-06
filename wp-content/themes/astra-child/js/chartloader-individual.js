function formatDateToISO(userDate) {
    return new Date(userDate).toISOString().split('T')[0];
}
Date.prototype.getUTCTime = function(){ 
  return this.getTime()+(this.getTimezoneOffset()*60000); 
};

async function fetchChartData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('Failed to fetch chart data:', error);
        return null;
    }
}

function getQueryParams() {
    const queryParams = new URLSearchParams(window.location.search);
    const asset = queryParams.get('asset');
    const chartType = queryParams.get('chartType');
    let userDate = queryParams.get('date');

    if (!userDate) {
        // If userDate is not provided, default to the current date
        userDate = formatDateToISO(new Date());
    }

    return {
        asset,
        chartType,
        userDate,
    };
}

function filterData(jsonData, userDate) {
    const filteredData = [];
	const userDateTime = new Date(userDate).getTime();
    const userDateUTCTime = new Date(userDate).getUTCTime();
	//console.log(`userDateUTCTime: ${userDateUTCTime}`)
	//console.log(`userDateTime: ${userDateTime}`)
    jsonData.forEach(obj => {
        if (obj.x >= (userDateUTCTime - 144 * 60 * 60 * 1000) &&
            obj.x <= (userDateUTCTime + 24 * 60 * 60 * 1000)) {
            filteredData.push(obj);
			//console.log(`Object time: ${obj.x}`)
        }
    });
    return filteredData;
}

async function handlePageLoad() {
    const { asset, chartType, userDate } = getQueryParams();
	const queryParams = new URLSearchParams(window.location.search);
    
    if (asset && chartType && userDate) {
        //const url = `https://dwcf.gny.io/get/indicators/${asset}USDT/binance/1h?latest=4380&indicator=${chartType}`;
        //const responseData = await fetchChartData(url);
		//const filteredResponseData = await filterData(responseData, userDate)
        // Decide which update function to call based on `chartType`
        // This step assumes a mapping or conditionals based on chartType
        const dataPoints = 8760;
		const userDateTime = new Date(new Date(userDate).getUTCTime());
		printInDiv('assetname', asset);
		printInDiv('dateQuery', userDateTime.toDateString());
		printInDiv('chartType', chartType.replaceAll("_", " "));
		document.querySelector('title').textContent = `${chartType.replaceAll("_", " ")} Chart for ${asset} on ${userDateTime.toDateString()}`;
        switch(chartType) {
            case 'Bollinger_Bands':
                //await fetchCandleDataBBands('ChartIndividual', '1h', dataPoints, asset);
				const BBandsData = await fetchBollingerBandsData(asset, '1h', dataPoints);
				const BBandsCandleData = await fetchInitialCandleData(asset, '1h', dataPoints);
				const filteredBBandsData = await filterData(BBandsData, userDate);
				const filteredBBandsCandleData = await filterData(BBandsCandleData, userDate);
				const BBandsMinY = Math.min(...filteredBBandsCandleData.map(item => Math.min(...item.y))) * 0.95;
      			const BBandsMaxY = Math.max(...filteredBBandsCandleData.map(item => Math.max(...item.y))) * 1.05;
				await renderCandlestickChartBBands('ChartIndividual', filteredBBandsCandleData, filteredBBandsData, BBandsMinY, BBandsMaxY);
                break;
            case 'Moving_Average':
    			let { averageData, EMA20Data, EMA5Data, MA200dData, MA200wData } = await fetchAllIndicatorData(asset, '1h', dataPoints);
				const MACandleData = await fetchInitialCandleData(asset, '1h', dataPoints);
				const filteredMACandleData = await filterData(MACandleData, userDate);
				averageData = await filterData(averageData, userDate);
				EMA20Data = await filterData(EMA20Data, userDate);
				EMA5Data = await filterData(EMA5Data, userDate);
				MA200dData = await filterData(MA200dData, userDate);
				MA200wData = await filterData(MA200wData, userDate);

    			// Calculate overall min and max values
    			let allValues = [];

    			filteredMACandleData.forEach(item => allValues.push(...item.y));
    			[averageData, EMA20Data, EMA5Data, MA200dData, MA200wData].forEach(dataSet => {
        			dataSet.forEach(item => allValues.push(item.value));
    			});
    
    			const overallMinY = Math.min(...allValues) * 0.95;
    			const overallMaxY = Math.max(...allValues) * 1.05;
    
    			// Use overallMinY and overallMaxY for setting the y-axis range
    			await renderCandlestickChartWithIndicators('ChartIndividual', filteredMACandleData, { averageData, EMA20Data, EMA5Data, MA200dData, MA200wData }, overallMinY, overallMaxY);
                break;
            case 'MACD':
				const macdData = await fetchMACDData(asset, '1h', dataPoints);
				const filteredMacdData = await filterData(macdData, userDate);
  				await renderMACDChart('ChartIndividual', filteredMacdData);
				break;
            case 'Stochastic':
				const stochData = await fetchStochData(asset, '1h', dataPoints);
				const filteredStochData = await filterData(stochData, userDate);
  				await renderStochChart('ChartIndividual', filteredStochData);
				break;
            case 'Fibonacci':
				const FibCandleData = await fetchInitialCandleData(asset, '1h', dataPoints);
				const filteredFibCandleData = await filterData(FibCandleData, userDate);
    			await fetchCandleData('ChartIndividual', '1h', dataPoints, asset, filteredFibCandleData);
				break;
            case 'Parabolic_SAR':
				const PsarData = await fetchPSARData(asset, '1h', dataPoints);
				const PsarCandleData = await fetchInitialCandleData(asset, '1h', dataPoints);
				const filteredPsarData = await filterData(PsarData, userDate);
				const filteredPsarCandleData = await filterData(PsarCandleData, userDate);
				const PsarMinY = Math.min(...filteredPsarCandleData.map(item => Math.min(...item.y))) * 0.95;
      			const PsarMaxY = Math.max(...filteredPsarCandleData.map(item => Math.max(...item.y))) * 1.05;
				await renderCandlestickChartPSAR('ChartIndividual', filteredPsarCandleData, filteredPsarData, PsarMinY, PsarMaxY);
                break;
            case 'Hikkake_Pattern':
                const hikData = await hik_fetchIndicatorData(asset, '1h', dataPoints);
				const HikCandleData = await fetchInitialCandleData(asset, '1h', dataPoints);
				const filteredHikData = await filterData(hikData, userDate);
				const filteredHikCandleData = await filterData(HikCandleData, userDate);

    			const combinedHikData = await filteredHikCandleData.map((item, index) => {
      				return {
        				...item,
        				hik: filteredHikData[index] ? filteredHikData[index].hik : null
      				};
    			});

    			const HikMinY = Math.min(...filteredHikCandleData.map(item => Math.min(...item.y))) * 0.85;
    			const HikMaxY = Math.max(...filteredHikCandleData.map(item => Math.max(...item.y))) * 1.15;
				await hik_renderCandlestickChart('ChartIndividual', combinedHikData, HikMinY, HikMaxY);
                break;
            case 'Coppock_Indicator':
				const coppockData = await fetchDataCoppock(asset, '1h', dataPoints);
				const filteredCoppockData = await filterData(coppockData, userDate);
  				await renderChartCoppock('ChartIndividual', filteredCoppockData);
                break;
            case 'Average_Directional_Movement_Index':
  				const AVData = await fetchDataAV('Average_Directional_Movement_Index', '1h', dataPoints, asset);
				const filteredAVData = await filterData(AVData, userDate);
    			await renderChartAV('ChartIndividual', filteredAVData, [{y: 25}], {min: 0, max: 100});
                break;
            case 'On_Balance_Volume':
                const OBVData = await fetchDataOBV('On_Balance_Volume', '1h', dataPoints, asset);
				const filteredOBVData = await filterData(OBVData, userDate);
    			await renderChartOBV('ChartIndividual', filteredOBVData, [{y: 25}], {min: 0, max: 100});
                break;
            case 'Ultimate_Oscillator':
                const UltimateOscData = await fetchDataUltimateOsc('Ultimate_Oscillator', '1h', dataPoints, asset);
				const filteredUltimateOscData = await filterData(UltimateOscData, userDate);
    			await renderChartUltimateOsc('ChartIndividual', filteredUltimateOscData, [{y: 25}], {min: 0, max: 100});
                break;
            case 'Relative_Strength_Index':
                const RSIData = await fetchDataUnique('Relative_Strength_Index', '1h', dataPoints, asset);
				const filteredRSIData = await filterData(RSIData, userDate);
    			await renderChartUnique('ChartIndividual', filteredRSIData, [{y: 25}], {min: 0, max: 100});
                break;
            case 'McClellan_Oscillator':
                const McClellanData = await fetchDataMcClellan('McClellan_Oscillator', '1h', dataPoints, asset);
				const filteredMcClellanData = await filterData(McClellanData, userDate);
    			await renderChartUnique('ChartIndividual', filteredMcClellanData, [{y: 25}], {min: 0, max: 100});
                break;
            case 'Chaikin_AD_Oscillator':
                const indicatorData = await fetchDataChaikinAD('Chaikin_AD_Oscillator', '1h', dataPoints, asset);
				const filteredIndicatorData = await filterData(indicatorData, userDate);
				const indicatorValues = filteredIndicatorData.map(point => point.y);
				const indicatorAxis = {
        			min: Math.min(...indicatorValues) * 0.99, // 0.5% less than the minimum
        			max: Math.max(...indicatorValues) * 1.01, // 0.5% more than the maximum
    			};
				const volumeData = await fetchVolumeData('1h', dataPoints, asset);
				const filteredVolumeData = await filterData(volumeData, userDate)
				const volume = filteredVolumeData.map(point => point.y);
    			const volumeAxis = {
        			min: Math.min(...volume) * 0.99, // 0.5% less than the minimum
        			max: Math.max(...volume) * 1.01, // 0.5% more than the maximum
    			};
      			await renderChartChaikinAD('ChartIndividual', filteredIndicatorData, filteredVolumeData, indicatorAxis, volumeAxis);
                break;
			case 'TDSequential':
				const TdData = await fetchDataTDSequential('TDSequential', '1h', dataPoints, asset);
				const filteredTdData = await filterData(TdData, userDate);
  				await renderChartTDSequential('ChartIndividual', filteredTdData);
				//await chartInstanceTDSequential.zoomX(new Date(userDateTime.getTime() - 24 * 60 * 60 * 1000).getTime(), new Date(userDateTime.getTime() + 48 * 60 * 60 * 1000).getTime())
				break;
            default:
                console.log('Unsupported chart type');
        }
    } else {
        // Fallback or default behavior if not all query params are provided
        console.log("Missing URL parameters. Using defaults.");
    }
}

// Call this function when the page loads
handlePageLoad();