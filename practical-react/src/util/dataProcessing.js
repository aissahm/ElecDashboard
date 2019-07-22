/**
 * Functions that transforms, agregate raw data coming from the Konker platform
 *
 */

//Build a power outage report from the most recent data available and supplied
function returnPowerOutageReport(vabctrms_data){
  var powerOutageReport_arr = [];
  var previousMeanVoltage = 300 ;
  var index = -1;
  vabctrms_data.forEach(function (arrayItem) {
      var timestamp = null;
      if ( (previousMeanVoltage > 0 || index === -1 ) && arrayItem.y === 0){
        timestamp = new Date(arrayItem.x);
        timestamp.toLocaleString();
        const newPowerOutageEvent = {
          startDate: timestamp,
          endDate: null
        };
        powerOutageReport_arr.push(newPowerOutageEvent);
        index = index + 1;
        previousMeanVoltage = 0;
      }else if (previousMeanVoltage === 0 && arrayItem.y > 0) {
        timestamp = new Date(arrayItem.x);
        timestamp.toLocaleString();
        powerOutageReport_arr[index]["endDate"] = timestamp ;
        previousMeanVoltage = 300;
      }
  });
  return powerOutageReport_arr;
}

//Transform the raw data received from Konker server API
function transformData (data, start_date){
  let st_arr = [];
  let fpt_arr = [];
  let kwht_arr = [];
  let vabctrms_arr = [];
  data.forEach(function (arrayItem) {
    var timestamp = new Date(arrayItem.ingestedTimestamp);
    if (new Date(start_date) < new Date(timestamp)){
      timestamp.toLocaleString();
      st_arr.push({x: timestamp ,y: arrayItem.payload["ST"]/1000 });
      fpt_arr.push({x: timestamp ,y: arrayItem.payload["FPT"]/1000});
      kwht_arr.push({x: timestamp ,y: arrayItem.payload["KWHT"]/1000});
      vabctrms_arr.push({x: timestamp ,y: arrayItem.payload["VABCTRMS"]});
    }
  });
  return [{ name: "ST", values: st_arr}, { name: "FPT", values: fpt_arr}, { name: "KWHT", values: kwht_arr}, { name: "VABCTRMS", values: vabctrms_arr}];
}

//Function to get the absolute, average daily energy consumption
function returnDailyStatsEnergyConsumption(data){
  const n = data.length ;
  var absDailyConsumption_arr = [];
  var highestEnergyConsumedValue = 0;
  var highestEnergyConsumedDay = null;
  var lowestEnergyConsumedValue = 1000000;
  var lowestEnergyConsumedDay = null;
  var weekendConsumptionTotal = 0;
  var weekendDaysNumber = 0 ;
  var weekdayConsumptionTotal = 0;
  var weekDaysNumber = 0 ;
  var averageWeekendConsumption = 0 ;
  var averageWeekdayConsumption = 0 ;
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (var i = 0 ; i < n - 1 ; i++){
    var timestamp = data[i+1].x;
    timestamp.toLocaleString()
    const numeric_day = timestamp.getDay();

    const newElem = {
      x: days[numeric_day] ,
      y: (data[i+1].y - data[i].y)/1000
    };
    absDailyConsumption_arr.push(newElem);

    if ( numeric_day === 0 || numeric_day === 6  ){
      weekendConsumptionTotal = weekendConsumptionTotal + data[i+1].y - data[i].y;
      weekendDaysNumber = weekendDaysNumber + 1;
    }
    else{
      weekdayConsumptionTotal = weekdayConsumptionTotal + data[i+1].y - data[i].y;
      weekDaysNumber = weekDaysNumber + 1;
    }

    if (newElem.y > highestEnergyConsumedValue){
      highestEnergyConsumedValue = newElem.y;
      highestEnergyConsumedDay = newElem.x;
    }
    if (newElem.y < lowestEnergyConsumedValue) {
      lowestEnergyConsumedValue = newElem.y;
      lowestEnergyConsumedDay = newElem.x;
    }

  }

  averageWeekendConsumption = weekendDaysNumber > 0 ? weekendConsumptionTotal / (weekendDaysNumber*1000) : 0;
  averageWeekdayConsumption = weekDaysNumber > 0 ? weekdayConsumptionTotal / (weekDaysNumber*1000) : 0 ;

  return {
    values: absDailyConsumption_arr,
    lowestValue: {
      value: lowestEnergyConsumedValue,
      day: lowestEnergyConsumedDay
    },
    highestValue: {
      value: highestEnergyConsumedValue,
      day: highestEnergyConsumedDay
    },
    weekendAveConsumption: averageWeekendConsumption,
    weekdayAveConsumption: averageWeekdayConsumption
  };
}

//Function to get the absolute, average hourly energy consumption
function returnHourlyEnergyConsumption(data){
  var aveHourlyConsumptionWeekend_arr = new Array(24);
  aveHourlyConsumptionWeekend_arr.fill(0);
  var numberValuesPerHourWeekend_arr = new Array(24);
  numberValuesPerHourWeekend_arr.fill(0);
  var aveHourlyConsumptionWeekday_arr = new Array(24);
  aveHourlyConsumptionWeekday_arr.fill(0);
  var numberValuesPerHourWeekday_arr = new Array(24);
  numberValuesPerHourWeekday_arr.fill(0);
  for (var k = 0 ; k < data.length - 1 ; k++){
    const arrayItem = data[k];
    var timestamp = arrayItem.date;
    const numericDayValue = timestamp.getDay();
    for (var i = 0 ; i < arrayItem.values.length  ; i ++){
      const kwhtObj = arrayItem.values[i];
      if ("KWHT" in kwhtObj){  //Check if the information is available, if not skip
        var kwhtVal = kwhtObj["KWHT"];
        var next_kwhtObj = {};

        if (i < arrayItem.values.length - 1){
          next_kwhtObj = arrayItem.values[i+1];
        }else{

          next_kwhtObj = data[k+1]["values"][0];
        }
        if ("KWHT" in next_kwhtObj){ //Check if the information is available, if not skip
          kwhtVal = next_kwhtObj["KWHT"] - kwhtVal;
          kwhtVal = kwhtVal /1000;
        }else{
          kwhtVal = 0 ;
        }

        if ( kwhtVal > 0 ){
          if (numericDayValue === 0 || numericDayValue === 6){
            const previousVal = aveHourlyConsumptionWeekend_arr[i];
            aveHourlyConsumptionWeekend_arr[i] = previousVal + kwhtVal;
            const numberValues = numberValuesPerHourWeekend_arr[i];
            numberValuesPerHourWeekend_arr[i] = numberValues + 1 ;
          }else{
            const previousVal = aveHourlyConsumptionWeekday_arr[i];
            aveHourlyConsumptionWeekday_arr[i] = previousVal + kwhtVal;
            const numberValues = numberValuesPerHourWeekday_arr[i];
            numberValuesPerHourWeekday_arr[i] = numberValues + 1 ;
          }
        }
      }
    }
  }

  //Computing the average energy consumption for each day
  for (var j = 0; j < 24; j++){
    var averageValue =  numberValuesPerHourWeekend_arr[j] > 0 ? aveHourlyConsumptionWeekend_arr[j]/numberValuesPerHourWeekend_arr[j] : 0;
    aveHourlyConsumptionWeekend_arr[j] = { x: j + "h", y: averageValue };
    averageValue =  numberValuesPerHourWeekday_arr[j] > 0 ? aveHourlyConsumptionWeekday_arr[j]/numberValuesPerHourWeekday_arr[j] : 0;
    aveHourlyConsumptionWeekday_arr[j] = { x: j + "h", y: averageValue };
  }

  return {
    weekendAverConsArr: aveHourlyConsumptionWeekend_arr,
    weekdayAverConsArr: aveHourlyConsumptionWeekday_arr
  };
}

module.exports = {
  returnPowerOutageReport,
  transformData,
  returnDailyStatsEnergyConsumption,
  returnHourlyEnergyConsumption
}
