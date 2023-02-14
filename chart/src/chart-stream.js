'strict mode';

/******************[ Graphical Interface ]******************/
const cryptoChart = document.getElementById('cryptoChart');
const chartWidth = 1500;
const chartHeight = 500;

// select element
const selectRecord = document.getElementById('getSelectedRecords');
for(record in DATAMAP){
  const ab = DATAMAP[record];
  if(!ab) break;
  const year = ab.year;
  if(year){
    selectRecord.options[selectRecord.options.length] = new Option(ab.filename.slice(0, 10), record);
  }
}
/******************[ Graphical Interface ]******************/

/******************[ Default Chart ]******************/
var chart = LightweightCharts.createChart(cryptoChart, {
	width: chartWidth,
  height: chartHeight,
	rightPriceScale: {
		visible: true,
    borderColor: 'rgba(197, 203, 206, 1)',
	},
  leftPriceScale: {
    borderColor: 'rgba(197, 203, 206, 1)',
  },
	layout: {
		backgroundColor: '#ffffff',
		textColor: 'rgba(33, 56, 77, 1)',
	},
  grid: {
    horzLines: {
      color: '#F0F3FA',
    },
    vertLines: {
      color: '#F0F3FA',
    },
  },
	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
	timeScale: {
		borderColor: 'rgba(197, 203, 206, 1)',
	},
	handleScroll: {
		vertTouchDrag: false,
	},
  localization: {
    dateFormat: 'yyyy-MM-dd',
    timeFormatter: businessDayOrTimestamp => {
      if (LightweightCharts.isBusinessDay(businessDayOrTimestamp)) {
          return false;
      }
      return moment.tz(businessDayOrTimestamp * 1000, 'America/Toronto').format('YYYY-MM-DD HH:mm:ss');
    },
  },
});


chart.applyOptions({
  timezone: "America/Toronto",
  timeScale: {
    barSpacing: 75,
    minBarSpacing: .5,
    timeWithSeconds: true,
    timeVisible: true,
    secondsVisible: true,
    visible: true,
    tickMarkFormatter: (time, tickMarkType, locale) => {
      return moment.tz(time * 1000, 'America/Toronto').format('HH:mm:ss');
    }
  },
});

chart.applyOptions({
  priceScale: {
    mode: 1,
    borderVisible: true,
    autoScale: true,
    alignLabels: true,
  },
});

// AreaSeries - chart 1
const areaSeries = chart.addLineSeries({
  priceScaleId: 'left',
	color: 'rgba(38, 198, 218, 1)',
	lineWidth: 2,
});

// LineSeries - chart 2
const lineSeries = chart.addLineSeries({
	color: 'rgba(4, 111, 232, 1)',
	lineWidth: 2,
  priceScaleId: 'right',
});

/******************[ Default Chart ]******************/

/******************[ alpha implementaion ]******************/
// searching area
// searching icon
var width = 45;
var height = 45;
var button = document.getElementById('searchrecord');
const btnLeft = (chartWidth - width - 95);
const btnTop = (10);
button.style.left = btnLeft + 'px';
button.style.top = btnTop + 'px';
button.style.color = '#4c525e';

// implementing datetime picker
var recordLabel = document.getElementById('recordlabel');
var inputDate = document.getElementById('pickrecord');
inputDate.style.left = (btnLeft - 210) + 'px';
inputDate.style.top = (btnTop + 50) + 'px';

function Toggle() {
  if(inputDate.style.display === "block"){
      inputDate.style.display = "none";
  }else{
      inputDate.style.display = "block";
  }
}
const dateRangePicker = new DateRangePicker('datetimerecord', {
  timePicker: true,
  locale: {
    format: "YYYY-MM-DD HH:mm:ss",
  },
  singleDatePicker: true,
  timePicker24Hour: true,
  timePickerSeconds: true,
  linkedCalendars: false,
});

let loadchart = document.createElement('div');
loadchart.className = 'loading-chart';
cryptoChart.appendChild(loadchart);

button.addEventListener('click', e => {
  e.preventDefault();
  Toggle();
})
// searching area

// realtime button
var width = 27;
var height = 27;

var button = document.createElement('div');
button.className = 'go-to-realtime-button';
button.style.left = (chartWidth - width - 65) + 'px';
button.style.top = (chartHeight - height - 30) + 'px';
button.style.color = '#4c525e';
button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="14" height="14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6.5 1.5l5 5.5-5 5.5M3 4l2.5 3L3 10"></path></svg>';
cryptoChart.appendChild(button);

let setStatus = false;
var timeScale = chart.timeScale();
timeScale.subscribeVisibleTimeRangeChange(function(newTimeRange) {
  var buttonVisible = timeScale.scrollPosition() < 0;
  button.style.display = buttonVisible ? 'block' : 'none';
});

button.addEventListener('click', function() {
  timeScale.scrollToRealTime();
});
// realtime button

// remove markers
cryptoChart.addEventListener('click', e => {
  e.preventDefault();
  lineSeries.setMarkers([]);
  areaSeries.setMarkers([]);
});

// legend area
const legend = document.createElement('div');
    legend.classList.add('legend');
    legend.innerHTML = `<div>
      <h6>.DJI</h6>
      <span>0</span>
      <b>|</b>
      <h6>QQQ.O</h6>
      <span>0</span>
    </div>`;
cryptoChart.appendChild(legend);
// legend area

/******************[ alpha implementaion ]******************/

/******************[ Data Logic ]******************/
// LineSeries
const StreamData = async (url) => {
    
  if(!url) return;
  const queueingStrategy = new ByteLengthQueuingStrategy({ highWaterMark: 2 });
  // Create a transform stream with our transformer
  const ts = new TransformStream(new Uint8ArrayToStringsTransformer(), queueingStrategy);

  // Fetch the file
  const response = await fetch(url, {
    mode: 'no-cors',
  });
  // Get a ReadableStream on the file's body
  const rs = response.body;

  // Apply our Transformer on the ReadableStream to create a stream of strings
  const lineStream = rs.pipeThrough(ts);

  // Generator & Iterator GROUND
  async function* streamAsyncIterator(stream){
    // get a lock on the stream
    const reader = stream.getReader();

    try{
      while(true){
        // Read from the stream
        const {done, value} = await reader.read();
        // Exit if we're done
        if(done) {
          // loading removal
          if(cryptoChart.contains(loadchart)){
            cryptoChart.removeChild(loadchart);
          }
          timeScale.scrollToRealTime();
          chart.applyOptions({
            priceScale: {
              autoScale: true,
              alignLabels: true,
            },
          });
          return;
        };
        // Else yield the chunk
        yield value.map((row) => {
          const values = row.split(',');
          let headers = ['title', 'alias', 'domain', 'time', 'type', 'value'];

          const el = headers.reduce((object, header, index) => {
            object[header] = values[index];
            return object;
          }, {});

          if('time' in el && el.time !== ''){
            el.time = moment.tz(el.time, 'America/Toronto').unix();
          }

          if('value' in el){
            el.value = el.value ? Number(el.value): Number(0);
          }

          if('title' in el && el.title === ''){
            return false;
          }

          return {
            title: el.title,
            time: el.time,
            value: el.value,
          };
        }).filter(x => x);
      }
    }finally{
      reader.releaseLock();
    }

  }
  // Generator & Iterator GROUND
    
  // publishing data
  const streamArray = streamAsyncIterator(lineStream);
  
  (async function DataBox(){
    let stackA = [];
    let stackB = [];

    for await (const chunk of streamArray){
      if(chunk.length > 0){
        chunk.forEach(x => {
          (x.title === '.DJI') ? stackA.push(x) : stackB.push(x);
        });
      }
    }

    const db1 = SetStack(stackB, stackA);
    const db2 = SetStack(stackA, stackB);

    if(db2.length){
      chart.applyOptions({
        leftPriceScale: {
          visible: true,
        }
      });
    }

    if(db1.length && db2.length){
      stackA = [];
      stackB = [];
    }

    // Add dual chart
    lineSeries.setData(db1);
    areaSeries.setData(db2);

    //crosshair support: Legend feature
    chart.subscribeCrosshairMove((param) => {
      loadLegend(param, db1, db2, [lineSeries, areaSeries]);
    });
    
  })();
}
if(selectRecord.options[selectRecord.selectedIndex].text){
  StreamData(`data/${selectRecord.options[selectRecord.selectedIndex].text.slice(0,4)}/${selectRecord.options[selectRecord.selectedIndex].text}.csv`);
}
let changeEvent = new Event('change');
selectRecord.dispatchEvent(changeEvent);
selectRecord.addEventListener("change", (e) => {
  cryptoChart.appendChild(loadchart);
  recordLabel.hidden = true;
  StreamData(`data/${selectRecord.options[selectRecord.selectedIndex].text.slice(0,4)}/${selectRecord.options[selectRecord.selectedIndex].text}.csv`);
});

/******************[ Data Logic ]******************/

// 2019-01-10 09:30:00
/******************[ Helper functions ]******************/

// get timestamp based on values.
function getTime(arr){
  if(arr.length){
    return arr.map(x => {
      if(x.value){
        return x.time;
      }
    }).filter(x => x);
  }
}

// returns an array for array2 passed into as second param.
function SetStack(s1, s2){
  if(s1.length && s2.length){
    let TruthySet = getTime(s2);
    let timeStack = getTime(s1);

    let dbStack = new Set(timeStack.concat(TruthySet));
    return s2.filter(m => dbStack.has(m.time));
  }
}

/******************[ Helper functions ]******************/

/******************[ Template functions ]******************/
// legend template
function loadLegend(param, series1, series2, series = [lineSeries]){
  let price1 = '';
  let price2 = '';
  let ind1 = '';
  let ind2 = '';
  
  if (param.time) {
    if(series1.length && series.length){
      price1 = param.seriesPrices.get(series[0]);
      ind1 = series1.findIndex(row => row.time == param.time);
    } 
    if(series2.length && series.length > 1){
      price2 = param.seriesPrices.get(series[1]);
      ind2 = series2.findIndex(row => row.time == param.time);
    }
    
    legend.innerHTML = 
      `<div>
        ${(ind1 !== -1 && price1) ?  `<h6>${series1[ind1].title}</h6> <span>${price1}</span>` : `<h6>.DJI</h6><span>0</span>`}
        ${(ind2 !== -1 && price2) ? ` <b>|</b> <h6>${series2[ind2].title}</h6> <span>${price2}</span>` : `<b>|</b><h6>QQQ.O</h6><span>0</span>`}
      </div>`;
  }
  else {
    legend.innerHTML = `<div>
      <h6>.DJI</h6>
      <span>0</span>
      <b>|</b>
      <h6>QQQ.O</h6>
      <span>0</span>
    </div>`;
  }
}

/******************[ Template functions ]******************/