function getMinMaxFromArray(dataArray) {
    let min = Infinity;
    let max = -Infinity;
    
    for (const value of dataArray) {
        if (value < min) min = value;
        if (value > max) max = value;
    }
    
    return { min, max };
}
function getColor(value) {
    const darknessFactor = 0.5; // Value between 0 and 1. Lower values will make the colors darker.

    if (value === 1 || value === "" || value === "1") {
        return "#232A2F"; // Change this to the desired dark grey color
    }
    value = parseFloat(value);
    let r, g, b;

    if (value >= 0.6) { // Dark green to orange
        r = parseInt((1 - (value - 0.6) / 0.4) * 128 * darknessFactor);
        g = parseInt((128 + (value - 0.6) / 0.4 * 127) * darknessFactor);
        b = 0;
    } else if (value >= 0) { // Orange to red
        r = parseInt(255 * darknessFactor);
        g = parseInt((value / 0.6) * 128 * darknessFactor);
        b = 0;
    } else { // Red to blue
        r = parseInt((1 + value) * 128 * darknessFactor);
        g = 0;
        b = parseInt((1 - Math.abs(value)) * 128 * darknessFactor);
    }

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
function getDefaultOptions() {
  return {
    chart: {
	  animations: {
        enabled: false,
	  },
      fontFamily: "montserrat",
      height: 350,
      foreColor: "#bbbdbb",
      type: "line",
      toolbar: {
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    stroke: { width: [1, 1], curve: "straight" },
    legend: { show: true, fontSize: "11pt", fontFamily: "montserrat" },
    colors: ["#2176FF", "#BAFF29", "#18D8D8", "#f542bf", "#6A6E94", "#F3B415", "#F27036", "#4E88B4", "#00A7C6", "#A9D794", "#46AF78", "#A93F55", "#8C5E58", "#33A1FD", "#7A918D"],
    tooltip: {
      theme: "dark",
      style: { fontSize: "8pt" },
      x: { show: true },
      enabled: true,
      shared: false,
      custom({ series, seriesIndex, dataPointIndex, w }) {
        const point = w.config.series[0].data[dataPointIndex];
        const date = new Date(point.x);
        return `<div style="padding: 10px;">
                  <div style="background-color: black; color: white; padding: 2px 5px;"><strong>${date.toLocaleString("default", { month: "short" })} ${("0" + date.getDate()).slice(-2)} - ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}</strong></div>
                  Value: ${point.y.toFixed(2)}<br>
                </div>`;
      }
    },
    dataLabels: { enabled: false },
    grid: { show: false },
    xaxis: {
      type: "datetime",
      labels: { style: { fontSize: "8pt", fontFamily: "montserrat" }, format: "MMM dd - HH:MM", datetimeUTC: false }
    },
    yaxis: {
      labels: {
        style: { fontSize: "8pt", fontFamily: "montserrat" },
        formatter: (val) => val.toFixed(0)
      }
    }
  };
}
function printInDiv(id, message) {
    var div = document.getElementById(id);
    if(div) {  // Check if the div exists
        div.innerHTML = message;
    } else {
        console.error("Div with id: " + id + " does not exist");
    }
}

function clearDiv(id) {
    var div = document.getElementById(id);
    if(div) {  // Check if the div exists
        div.innerHTML = "";
    } else {
        console.error("Div with id: " + id + " does not exist");
    }
}

function printInClass(className, message) {
    var divs = document.getElementsByClassName(className);
    for(var i = 0; i < divs.length; i++) {
        divs[i].innerHTML = message;
    }
}

function getSelectedCoins() {
    const checkboxes = document.querySelectorAll('.dropdown-content input[type="checkbox"]');
    return Array.from(checkboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
}

function calculateDataPoints(intervalInputName, daysInputName) {
    const interval = document.querySelector(`input[name="${intervalInputName}"]:checked`).value;
    const days = document.querySelector(`input[name="${daysInputName}"]:checked`).value;
    const intervalsPerDay = {'1h': 24, '6h': 4, '1d': 1};
    const dataPoints = parseInt(days, 10) * intervalsPerDay[interval];
    return { interval, dataPoints };
}