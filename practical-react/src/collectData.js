const konker = require('./KonkerApi');

const username = 'jobs@konkerlabs.com';
const password = 'gokonkergokonker!';
const appname = 'default';
const channel = "energy";

// const now = new Date();
// //var startDate = new Date( now.getFullYear(), now.getMonth(), now.getDate()  );
// var startDate = new Date();
// startDate.setMinutes( startDate.getMinutes() - 1);
// const endDate = new Date(startDate);
// startDate.setMinutes( startDate.getMinutes() - 60*24);
// const delta = -7;

// const now = new Date();
// var startDate = new Date();
// startDate.setDate( startDate.getDate() - 0);
// const endDate = new Date(startDate);
// startDate.setDate( startDate.getDate() - 10);
// const delta = -7;



var end_Date = new Date();
end_Date.toLocaleString()
const seconds = end_Date.getSeconds() ;
const minutes =  end_Date.getMinutes() ;
const hours = end_Date.getHours() ;
end_Date.setSeconds(end_Date.getSeconds() - seconds);
end_Date.setMinutes(end_Date.getMinutes() - minutes);
end_Date.setHours(end_Date.getHours() - hours);

var startDate = new Date(end_Date);
startDate.setHours(startDate.getHours() - 24*4);
startDate.setMinutes(startDate.getMinutes() + 1);
end_Date.setHours(end_Date.getHours() + 1);

end_Date.toLocaleString();
startDate.toLocaleString();

console.log("end date =", end_Date);
console.log("start date = ", startDate);

// var new_arr = new Array(5);
// new_arr.fill(0);
// console.log("new_arr ==", new_arr);


konker.authenticate(username, password).then((res) => {
  konker.getAllDevices(appname).then((res) => {
    if (res.data.code === 200) {
      res.data.result.forEach(device => {

        //console.log("device = ", device);
        getCurrentWeekPerHourKWHT(appname, device.guid, channel, startDate, end_Date).then(res=>{
          console.log("done =", res);
          const processed_data = aggregateData(res);
          console.log("processes =" , processed_data);
        });

      });
    }
  }).catch(err => {console.log(err)})
}).catch(err => {console.log(err)})

function aggregateData(data){
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
      if ("KWHT" in kwhtObj){
        var kwhtVal = kwhtObj["KWHT"];
        var next_kwhtObj = {};

        if (i < arrayItem.values.length - 1){
          next_kwhtObj = arrayItem.values[i+1];
        }else{

          next_kwhtObj = data[k+1]["values"][0];
        }
        if ("KWHT" in next_kwhtObj){
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
  for (var j = 0; j < 24; j++){
    var averageValue =  numberValuesPerHourWeekend_arr[j] > 0 ? aveHourlyConsumptionWeekend_arr[j]/numberValuesPerHourWeekend_arr[j] : 0;
    aveHourlyConsumptionWeekend_arr[j] = averageValue*1000;
    averageValue =  numberValuesPerHourWeekday_arr[j] > 0 ? aveHourlyConsumptionWeekday_arr[j]/numberValuesPerHourWeekday_arr[j] : 0;
    aveHourlyConsumptionWeekday_arr[j] = averageValue*1000;
  }

  return {
    weekendAverConsArr: aveHourlyConsumptionWeekend_arr,
    weekdayAverConsArr: aveHourlyConsumptionWeekday_arr
  };
}


function getCurrentWeekPerHourKWHT(application, device, channel, date_start, endingDate){
  return new Promise(function (resolve, reject) {
    var date_end = new Date (date_start);
    date_end.setMinutes( date_end.getMinutes() + 60*24 );
    if ( new Date(date_end) > new Date(endingDate)){
      date_end = new Date(endingDate);
    }
    getPerHourKWHT(application, device, channel, date_start, date_end).then(res=>{
      var newElem = {
        date: date_start,
        values: res
      };
      console.log("newElem == ", newElem);
      var new_start_date = new Date(date_start);
      new_start_date.setHours( new_start_date.getHours() + 24);
      if ( new Date(new_start_date) < new Date(endingDate) ){
        getCurrentWeekPerHourKWHT(application, device, channel, new_start_date, endingDate).then(result=>{
          var week_hourly_kwht_arr = [newElem];
          const week_hourly_kwht_array =  week_hourly_kwht_arr.concat(result);
          resolve(week_hourly_kwht_array);
        }).catch(err => {console.log(err)})
      }
      else{
        resolve([newElem]);
      }
    }).catch(err => {console.log(err)})
  });
}

function getPerHourKWHT(application, device, channel, dt_start, endDate){
  return new Promise(function (resolve, reject) {
    var dt_end = new Date(dt_start);
    dt_end.setMinutes( dt_end.getMinutes() + 1);
    konker.getDataFrom(application, device, channel, dt_start, dt_end).then(res => {
        var newElem = {};
        if (res.data.result.length == 1){
          const arrayItem = res.data.result[0];
          var timestamp = new Date(arrayItem.ingestedTimestamp);
          newElem = {
            "KWHT": arrayItem.payload["KWHT"],
            "timestamp": timestamp.toLocaleString()
          };
        }
        var next_date = new Date(dt_start);
        next_date.setMinutes( next_date.getMinutes() + 60 );
        if (new Date(next_date) < new Date(endDate)){
          getPerHourKWHT(application, device, channel, next_date, endDate).then(result=>{
            var kwht_arr = [];
            kwht_arr.push(newElem);
            var kwht_array = kwht_arr.concat(result);
            resolve(kwht_array);
          }).catch(err => {console.log(err)})
        }
        else{
          resolve([newElem]);
          }
      }).catch(err => {console.log(err)})
    });
}

function getPerDayKWHT(application, device, channel, dt_start, endDate){
  return new Promise(function (resolve, reject) {
    var dt_end = new Date(dt_start);
    dt_end.setMinutes( dt_end.getMinutes() + 1);
    konker.getDataFrom(application, device, channel, dt_start, dt_end).then(res => {
        var newElem = {};
        if (res.data.result.length == 1){
          const arrayItem = res.data.result[0];
          var timestamp = new Date(arrayItem.ingestedTimestamp);
          newElem = {
            "KWHT": arrayItem.payload["KWHT"],
            "timestamp": timestamp.toLocaleString()
          };
        }
        var next_date = new Date(dt_start);
        next_date.setDate( next_date.getDate() + 1 );
        if (new Date(next_date) < new Date(endDate)){
          getPerDayKWHT(application, device, channel, next_date, endDate).then(result=>{
            var kwht_arr = [];
            if (res.data.result.length == 1){
                kwht_arr.push(newElem);
            }
            var kwht_array = kwht_arr.concat(result);
            resolve(kwht_array);
          }).catch(err => {console.log(err)})
        }
        else{
          if (res.data.result.length == 1){
              resolve([newElem]);
          }
          resolve();
        }
      }).catch(err => {console.log(err)})
    });
}

//Transform the data received from Konker server
//to plot them
function transformData (data, start_date){
  let st_arr = [];
  let fpt_arr = [];
  let kwht_arr = [];
  data.forEach(function (arrayItem) {
    var timestamp = new Date(arrayItem.ingestedTimestamp);
    if (new Date(start_date) < new Date(timestamp)){
      timestamp.toLocaleString();
      st_arr.push({x: timestamp ,y: arrayItem.payload["ST"]});
      fpt_arr.push({x: timestamp ,y: arrayItem.payload["FPT"]});
      kwht_arr.push({x: timestamp ,y: arrayItem.payload["KWHT"]});
    }
  });
  return [{ name: "ST", values: st_arr}, { name: "FPT", values: fpt_arr}, { name: "KWHT", values: kwht_arr}];
}

function getEnergyConsumptionByHourData(data, start_date){
  let st_arr = [];
  let ts_arr = [];
  let kwht_arr = [];
  data.forEach(function (arrayItem) {
    var timestamp = new Date(arrayItem.ingestedTimestamp);
    if (new Date(start_date) < new Date(timestamp)){
      timestamp.toLocaleString();
      ts_arr.push(timestamp);
      kwht_arr.push(arrayItem.payload["KWHT"]);
    }
  });
  return {
    "KWHT": kwht_arr,
    "timestamp": ts_arr
  };
}
