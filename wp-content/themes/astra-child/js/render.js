async function renderChartChaikinAD(containerId, seriesData, volumeData, indicatorYRange, volumeYRange) {
  const options = {
    ...getDefaultOptions(),
    series: [
      { name: "Chaikin AD", data: seriesData },
      { name: "Volume", data: volumeData }
    ],
    yaxis: [
      { seriesName: "Indicator", min: indicatorYRange.min, max: indicatorYRange.max, decimalsInFloat: 2, title: { text: "Chaikin AD" } },
      { seriesName: "Volume", opposite: true, min: volumeYRange.min, max: volumeYRange.max, decimalsInFloat: 2, title: { text: "Volume" } }
    ],
    annotations: { yaxis: [{ y: 0, borderColor: "#999" }] },
    tooltip: {
      theme: "dark",
      style: { fontSize: "8pt" },
      shared: true,
      custom({ series, seriesIndex, dataPointIndex, w }) {
        const chaikinPoint = w.config.series[0].data[dataPointIndex];
        const volumePoint = w.config.series[1].data[dataPointIndex];
        const date = new Date(chaikinPoint.x);
        return `<div style="padding: 10px;">
                  <div style="background-color: black; color: white; padding: 2px 5px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
                  <b>Chaikin AD:</b> ${chaikinPoint.y.toFixed(2)}<br>
                  <b>Volume:</b> ${volumePoint.y.toFixed(2)}<br>
                </div>`;
      }
    }
  };
  const chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
  await chart.render();
}

function renderCandlestickChartBBands(containerId, candleData, bandsData, yAxisMin, yAxisMax) {
  const decimalPoints = yAxisMax > 10 ? 2 : 6;
  const options = {
    ...getDefaultOptions(),
    series: [
      { name: "Candle", data: candleData, type: "candlestick" },
      { name: "Upper Band", data: bandsData.map(({ x, upper }) => ({ x, y: upper })), type: "line" },
      { name: "Middle Band", data: bandsData.map(({ x, middle }) => ({ x, y: middle })), type: "line" },
      { name: "Lower Band", data: bandsData.map(({ x, lower }) => ({ x, y: lower })), type: "line" }
    ],
    xaxis: { ...getDefaultOptions().xaxis, type: "datetime" },
    yaxis: {
      min: yAxisMin,
      max: yAxisMax,
      labels: {
        style: { fontSize: "8pt", fontFamily: "montserrat" },
        formatter: (val) => val.toFixed(decimalPoints)
      }
    },
    tooltip: {
      theme: "dark",
      style: { fontSize: "8pt" },
      shared: true,
      custom({ series, seriesIndex, dataPointIndex, w }) {
        const candle = w.config.series[0].data[dataPointIndex].y;
        const upperBand = w.config.series[1].data[dataPointIndex].y;
        const middleBand = w.config.series[2].data[dataPointIndex].y;
        const lowerBand = w.config.series[3].data[dataPointIndex].y;
        const date = new Date(w.config.series[0].data[dataPointIndex].x);
        return `<div style="padding: 2px 5px 2px;">
                  <div style="background-color: black; color: white; padding: 2px 5px 2px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
                  <b>Open:</b> ${candle[0].toFixed(decimalPoints)}<br>
                  <b>High:</b> ${candle[1].toFixed(decimalPoints)}<br>
                  <b>Low:</b> ${candle[2].toFixed(decimalPoints)}<br>
                  <b>Close:</b> ${candle[3].toFixed(decimalPoints)}<br>
                  <b>Upper Band:</b> ${upperBand.toFixed(decimalPoints)}<br>
                  <b>Middle Band:</b> ${middleBand.toFixed(decimalPoints)}<br>
                  <b>Lower Band:</b> ${lowerBand.toFixed(decimalPoints)}
                </div>`;
      }
    }
  };
  const chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
  chart.render();
}

async function renderCandlestickChartWithIndicators(containerId, candleData, indicatorsData, yAxisMin, yAxisMax) {
  const decimalPoints = yAxisMax > 10 ? 2 : 6;
  const series = [
    { name: "Candle", type: "candlestick", data: candleData },
    { name: "Average Price", type: "line", data: indicatorsData.averageData.map(({ x, value }) => ({ x, y: value })) },
    { name: "EMA 5 day", type: "line", data: indicatorsData.EMA5Data.map(({ x, value }) => ({ x, y: value })) },
    { name: "EMA 20 day", type: "line", data: indicatorsData.EMA20Data.map(({ x, value }) => ({ x, y: value })) },
    { name: "MA 200 day", type: "line", data: indicatorsData.MA200dData.map(({ x, value }) => ({ x, y: value })) }
  ];

  if (indicatorsData.MA200wData.length > 0) {
    series.push({ name: 'MA 200 week', type: 'line', data: indicatorsData.MA200wData.map(item => ({ x: item.x, y: item.value })) });
  }

  const options = {
    ...getDefaultOptions(),
    series,
    chart: { ...getDefaultOptions().chart, type: "line", height: 350 },
    xaxis: { ...getDefaultOptions().xaxis, type: "datetime" },
    yaxis: {
      min: yAxisMin,
      max: yAxisMax,
      labels: {
        style: { fontSize: "8pt", fontFamily: "montserrat" },
        formatter: (val) => val.toFixed(decimalPoints)
      }
    },
	annotations: { yaxis: [{ y: 0, borderColor: "#999" }] },
    tooltip: {
      theme: "dark",
      style: { fontSize: "8pt" },
      enabled: true,
      shared: true,
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const candleData = w.config.series[0].data[dataPointIndex];
                const candle = candleData.y;
                const date = new Date(candleData.x);
                const day = ("0" + date.getDate()).slice(-2);
                const month = date.toLocaleString('default', { month: 'short' });
                const formattedDate = `${day} ${month}`;
                const ma200w = indicatorsData.MA200wData.length > 0 ? `<b>MA 200w:</b> ${series[series.length - 1][dataPointIndex].toFixed(decimalPoints)}<br>` : null;

        		let tooltipHTML = `<div style="padding: 2px 5px;">
                    <div style="background-color: black; color: white; padding: 2px 5px 2px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
                    <b>Open:</b> ${candle[0].toFixed(decimalPoints)}<br>
                    <b>High:</b> ${candle[1].toFixed(decimalPoints)}<br>
                    <b>Low:</b> ${candle[2].toFixed(decimalPoints)}<br>
                    <b>Close:</b> ${candle[3].toFixed(decimalPoints)}<br>
                    <b>Avg Price:</b> ${series[1][dataPointIndex].toFixed(decimalPoints)}<br>
                    <b>EMA 20:</b> ${series[2][dataPointIndex].toFixed(decimalPoints)}<br>
                    <b>EMA 5:</b> ${series[3][dataPointIndex].toFixed(decimalPoints)}<br>
                    <b>MA 200d:</b> ${series[4][dataPointIndex].toFixed(decimalPoints)}`;

        if (ma200w) {
          tooltipHTML += `<br>${ma200w}`;
        }

        tooltipHTML += `</div>`;
        return tooltipHTML;
      }
    }
  };

  const chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
  await chart.render();
}
async function hik_renderCandlestickChart(chartId, data, minY, maxY) {
  const defaultOptions = getDefaultOptions();
  const decimalPlaces = maxY > 10 ? 2 : 6;

  const series = [{
    name: 'Candle',
    data: data.map(item => ({ x: item.x, y: item.y })),
    type: 'candlestick'
  }];

  const chartOptions = {
    ...defaultOptions,
    series,
    chart: {
      ...defaultOptions.chart,
      type: 'candlestick'
    },
    xaxis: {
      ...defaultOptions.xaxis,
      type: 'datetime'
    },
    yaxis: {
      ...defaultOptions.yaxis,
      min: minY,
      max: maxY,
      labels: {
        style: { fontSize: '8pt', fontFamily: 'montserrat' },
        formatter: value => value.toFixed(decimalPlaces)
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      offsetY: 5,
      offsetX: 0,
      labels: { useSeriesColors: true },
      markers: { width: 0, height: 0 },
      itemMargin: { horizontal: 5, vertical: 0 },
      onItemClick: { toggleDataSeries: true },
      onItemHover: { highlightDataSeries: true },
      customLegendItems: ['Red dot: unconfirmed Bear', 'Green dot: unconfirmed Bull', 'Red vertical line: Confirmed Bear', 'Green vertical line: Confirmed Bull']
    },
    annotations: {
      xaxis: data.map(item => {
        if (item.hik === 200 || item.hik === -200) {
          return {
            x: item.x,
            strokeDashArray: 6,
            borderColor: item.hik === 200 ? '#00ff00' : '#ff0000',
            label: {
              borderColor: item.hik === 200 ? '#00ff00' : '#ff0000',
              style: { color: '#fff', background: item.hik === 200 ? '#00ff00' : '#ff0000' },
              text: ''
            }
          };
        }
        return null;
      }).filter(Boolean),
      points: data.map(item => {
        if (item.hik === 100 || item.hik === -100) {
          return {
            x: item.x,
            y: item.hik === 100 ? Math.max(...item.y) * 1.01 : Math.min(...item.y) * 0.99,
            marker: { size: 3, fillColor: item.hik === 100 ? '#00ff00' : '#ff0000', strokeColor: item.hik === 100 ? '#00ff00' : '#ff0000' }
          };
        }
        return null;
      }).filter(Boolean)
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '8pt' },
      enabled: true,
      shared: true,
	  custom: function({ series, seriesIndex, dataPointIndex, w }) {
  	  	const candleData = w.config.series[0].data[dataPointIndex];
  	  	const candle = candleData.y;
	  	const date = new Date(candleData.x);

	  	return `<div style="padding: 10px;">
	      <div style="background-color: black; color: white; padding: 2px 5px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
          <b>Open:</b> ${candle[0]}<br>
          <b>High:</b> ${candle[1]}<br>
          <b>Low:</b> ${candle[2]}<br>
          <b>Close:</b> ${candle[3]}<br>
      	</div>`;
	  }
    }
  };

  if (hik_candlestickChart) {
    hik_candlestickChart.destroy();
  }

  hik_candlestickChart = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
  hik_candlestickChart.render();
}

async function renderCandlestickChartPSAR(chartId, candleData, PSARData, minY, maxY) {
  const defaultOptions = getDefaultOptions();
  const decimalPlaces = maxY > 10 ? 2 : 6;

  const series = [
    { name: 'Candle', data: candleData, type: 'candlestick' },
    { name: 'PSAR', data: PSARData.map(item => ({ x: item.x, y: item.PSAR })), type: 'line' }
  ];

  const chartOptions = {
    ...defaultOptions,
    series,
    chart: { ...defaultOptions.chart, type: 'line' },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '8pt' },
      enabled: true,
      shared: true,
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const candleData = w.config.series[0].data[dataPointIndex];
                const candle = candleData.y;
                const PSAR = w.config.series[1].data[dataPointIndex].y;
                const date = new Date(candleData.x);

                return `<div style="padding: 10px;">
                    <div style="background-color: black; color: white; padding: 2px 5px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
                    <b>Open:</b> ${candle[0]}<br>
                    <b>High:</b> ${candle[1]}<br>
                    <b>Low:</b> ${candle[2]}<br>
                    <b>Close:</b> ${candle[3]}<br>
                    <b>PSAR:</b> ${PSAR}<br>
                </div>`;
            }
    },
    markers: { size: [0, 3], fillColor: '#BAFF29', strokeColor: '#BAFF29' },
    stroke: { width: [1, 0] },
    xaxis: { ...defaultOptions.xaxis, type: 'datetime' },
    yaxis: {
      ...defaultOptions.yaxis,
      min: minY,
      max: maxY,
      labels: { style: { fontSize: '8pt', fontFamily: 'montserrat' }, formatter: value => value.toFixed(decimalPlaces) }
    }
  };

  if (candlestickChartPSAR) {
    candlestickChartPSAR.destroy();
  }

  candlestickChartPSAR = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
  candlestickChartPSAR.render();
}

async function renderMACDChart(chartId, data) {
  const defaultOptions = getDefaultOptions();

  const series = [
    { name: 'MACD Histogram', data: data.map(item => ({ x: item.x, y: item.macdHist })), type: 'bar', colors: data.map(item => (item.macdHist >= 0 ? '#00E396' : '#FF45660')), columnWidth: '80%' },
    { name: 'MACD', data: data.map(item => ({ x: item.x, y: item.macd })), type: 'line', stroke: { width: 1 } },
    { name: 'MACD Signal', data: data.map(item => ({ x: item.x, y: item.macdSignal })), type: 'line', stroke: { width: 1 } }
  ];

  const chartOptions = {
    ...defaultOptions,
    series,
    tooltip: {
      theme: 'dark',
      style: { fontSize: '10pt' },
      enabled: true,
      shared: true,
      custom: ({series, seriesIndex, dataPointIndex, w }) => {
        const macdValue = series[0][dataPointIndex].toFixed(2);
        const macdSignalValue = series[1][dataPointIndex].toFixed(2);
        const macdHistValue = series[2][dataPointIndex].toFixed(2);
        const date = new Date(w.globals.seriesX[0][dataPointIndex]);

        return `
          <div class="apexcharts-custom-tooltip">
            <div style="background-color: black; color: white; padding: 2px 5px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
            <div><span><b>MACD:</b></span> <strong>${macdValue}</strong></div>
            <div><span><b>MACD Signal:</b></span> <strong>${macdSignalValue}</strong></div>
            <div><span><b>MACD Histogram:</b></span> <strong>${macdHistValue}</strong></div>
          </div>
        `;
      },
      x: { format: 'MMM dd' }
    },
    yaxis: {
      labels: { formatter: value => value.toFixed(MACDmax) }
    }
  };

  if (MACDChartInstance) {
    MACDChartInstance.updateOptions(chartOptions);
  } else {
    MACDChartInstance = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
    MACDChartInstance.render();
  }
}
async function renderStochChart(chartId, data) {
  const defaultOptions = getDefaultOptions();

  const series = [
    { name: 'Stockastic K', data: data.map(item => ({ x: item.x, y: item.slowK })), type: 'line', stroke: { width: 1 } },
    { name: 'Stockastic D', data: data.map(item => ({ x: item.x, y: item.slowD })), type: 'line', stroke: { width: 1 } }
  ];

  const chartOptions = {
    ...defaultOptions,
    series,
    tooltip: {
      theme: 'dark',
      style: { fontSize: '8pt' },
      enabled: true,
      shared: true,
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const dataSlowK = w.config.series[0].data[dataPointIndex];
        const dataSlowD = w.config.series[1].data[dataPointIndex];
        const date = new Date(dataSlowK.x);
        const slowK = dataSlowK.y;
        const slowD = dataSlowD.y;

        return `<div style="padding: 10px;">
                  <div style="background-color: black; color: white; padding: 2px 5px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
                  <b>Stochastic K:</b> ${slowK.toFixed(2)}<br>
                  <b>Stochastic D:</b> ${slowD.toFixed(2)}<br>
                </div>`;
      }
    }
  };

  if (StochChartInstance) {
    StochChartInstance.updateOptions(chartOptions);
  } else {
    StochChartInstance = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
    StochChartInstance.render();
  }
}
async function renderFib(chartId, candleData, minY, maxY) {
    const defaultOptions = getDefaultOptions();
    const decimalPlaces = maxY > 10 ? 2 : 6;

    let highValue = -Infinity;
    let lowValue = Infinity;

    for (const item of candleData) {
        const [open, high, low, close] = item.y;
        if (high > highValue) highValue = high;
        if (low < lowValue) lowValue = low;
    }

    const range = highValue - lowValue;
    const fibLevels = {
        '0': highValue,
        '0.236': highValue - 0.236 * range,
        '0.382': highValue - 0.382 * range,
        '0.5': highValue - 0.5 * range,
        '0.618': highValue - 0.618 * range,
        '0.786': highValue - 0.786 * range,
        '1.0': lowValue
    };

    const series = [{
        name: 'Candle',
        data: candleData,
        type: 'candlestick'
    }];

    const chartOptions = {
        ...defaultOptions,
        series,
        chart: {
            ...defaultOptions.chart,
            type: 'line',
            height: 350,
            toolbar: {
                show: true,
                tools: {
                    download: false,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                },
                autoSelected: 'zoom'
            }
        },
        tooltip: {
            theme: 'dark',
            style: {
                fontSize: '8pt'
            },
            enabled: true,
            shared: true,
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const candleData = w.config.series[0].data[dataPointIndex];
                const [open, high, low, close] = candleData.y;
                const date = new Date(candleData.x);

                return `<div style="padding: 10px;">
                    <div style="background-color: black; color: white; padding: 2px 5px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
                    <b>Open:</b> ${open}<br>
                    <b>High:</b> ${high}<br>
                    <b>Low:</b> ${low}<br>
                    <b>Close:</b> ${close}<br>
                </div>`;
            }
        },
        xaxis: {
            ...defaultOptions.xaxis,
            type: 'datetime'
        },
        yaxis: {
            ...defaultOptions.yaxis,
            min: minY,
            max: maxY,
            labels: {
                style: {
                    fontSize: '8pt',
                    fontFamily: 'montserrat'
                },
                formatter: value => value.toFixed(decimalPlaces)
            }
        },
        annotations: {
            yaxis: Object.keys(fibLevels).map(key => ({
                y: fibLevels[key],
                borderColor: '#90A4AE',
                label: {
                    background: '#00000000',
                    borderColor: '#00000000',
                    style: {
                        color: '#fff',
                        background: '#00000000'
                    },
                    text: `Fib ${key}`
                }
            }))
        }
    };

    if (Fib) {
        Fib.destroy();
    }

    Fib = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
    Fib.render();
}


function getAnnotations(annotations) {
	annotations.map(annotation => ({
        y: annotation.y,
        borderColor: '#999',
        label: {
          show: true,
          text: `${annotation.y}`,
          style: {
            color: "#fff",
            background: "#00E396"
          }
        }
    }));
	return annotations;
}
async function renderChartAV(chartId, data, annotations) {
  const chartOptions = {
    ...getDefaultOptions(),
    series: [{ name: 'Indicator', data }],
    annotations: { yaxis: await getAnnotations(annotations) },
    yaxis: { min: 0, max: 100, decimalsInFloat: 0 }
  };

  chartInstanceAV = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
  chartInstanceAV.render();
}

async function renderChartOBV(chartId, data, annotations) {
  const chartOptions = {
    ...getDefaultOptions(),
    series: [{ name: 'Indicator', data }],
    annotations: { yaxis: await getAnnotations(annotations) }
  };

  chartInstanceOBV = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
  chartInstanceOBV.render();
}

async function renderChartUltimateOsc(chartId, data, annotations) {
  const chartOptions = {
    ...getDefaultOptions(),
    series: [{ name: 'Indicator', data }],
    annotations: { yaxis: await getAnnotations(annotations) },
    yaxis: { min: 25, max: 75, decimalsInFloat: 0 }
  };

  chartInstanceUltimateOsc = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
  chartInstanceUltimateOsc.render();
}

async function renderChartUnique(chartId, data, annotations, yAxisOptions) {
  const chartOptions = {
    ...getDefaultOptions(),
    series: [{ name: 'Indicator', data }],
    annotations: { yaxis: await getAnnotations(annotations) },
    yaxis: { min: yAxisOptions.min, max: yAxisOptions.max }
  };

  chartInstance = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
  chartInstance.render();
}

async function renderChartMcClellan(chartId, data, annotations) {
  const chartOptions = {
    ...getDefaultOptions(),
    series: [{ name: 'Indicator', data }],
    annotations: { yaxis: await getAnnotations(annotations) },
    yaxis: {
      labels: {
        formatter: value => value.toFixed(decimalPlacesMcClellan)
      }
    }
  };

  chartInstanceMcClellan = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
  chartInstanceMcClellan.render();
}

async function renderChartCoppock(chartId, data) {
  const chartOptions = {
    ...getDefaultOptions(),
    series: [{ name: 'Indicator', data }],
    yaxis: {
      decimalsInFloat: 4,
      labels: {
        formatter: value => value.toFixed(4),
        style: { fontSize: '8pt', fontFamily: 'montserrat' }
      }
    }
  };

  if (chartInstanceCoppock) {
    chartInstanceCoppock.updateOptions(chartOptions);
  } else {
    chartInstanceCoppock = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
    chartInstanceCoppock.render();
  }
}

async function renderChartTDSequential(chartId, data) {
  const chartOptions = {
    ...getDefaultOptions(),
    series: [
      {
        name: 'Countdown',
        data: data.map(item => ({ x: item.x, y: item.Countdown })),
        type: 'line',
        stroke: { width: 1 }
      },
      {
        name: 'Setup',
        data: data.map(item => ({ x: item.x, y: item.Setup })),
        type: 'line',
        stroke: { width: 1 }
      }
    ],
    tooltip: {
      theme: 'dark',
      style: { fontSize: '8pt' },
      enabled: true,
      shared: true,
      custom: ({ series, dataPointIndex, w }) => {
        const dataCountdown = w.config.series[0].data[dataPointIndex];
        const dataSetup = w.config.series[1].data[dataPointIndex];
        const date = new Date(dataCountdown.x);
        const Countdown = dataCountdown.y;
        const Setup = dataSetup.y;

        return `<div style="padding: 10px;">
                  <div style="background-color: black; color: white; padding: 2px 5px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
                  <b>Countdown:</b> ${Countdown.toFixed(2)}<br>
                  <b>Setup:</b> ${Setup.toFixed(2)}<br>
                </div>`;
      }
    },
    yaxis: {
      decimalsInFloat: 4,
      labels: {
        formatter: value => value.toFixed(4),
        style: { fontSize: '8pt', fontFamily: 'montserrat' }
      }
    }
  };

  if (chartInstanceTDSequential) {
    chartInstanceTDSequential.updateOptions(chartOptions);
  } else {
    chartInstanceTDSequential = new ApexCharts(document.querySelector(`#${chartId}`), chartOptions);
    chartInstanceTDSequential.render();
  }
}