const konker = require('../KonkerApi');
const dataProcessing = require('./dataProcessing');

/**
* Backend layer
* functions that make API requests to the Konker platform to get raw data
*/

//function that returns information about the sensor
function getDeviceInformation(appname){
  return new Promise(function (resolve, reject) {
    konker.getAllDevices(appname).then((res) => {
      if (res.data.code === 200) {
        res.data.result.forEach(device => {
          resolve(device);
        });
      }
    }).catch(err => {console.log(err)})
  });
}

//function that returns all the most recent raw data collected by the sensor and saved by the Konker platform
function getAllData( appname, channel, start_date=null, delta=-1){
  return new Promise(function (resolve, reject) {
    konker.getAllDevices(appname).then((res) => {
      if (res.data.code === 200) {
        res.data.result.forEach(device => {
          konker.getData(appname, device.guid, channel, delta, start_date).then(res => {
            const transformedData = dataProcessing.transformData (res.data.result, start_date);
            const powerOutageObj = transformedData[3] ;
            const powerOutageReport_arr = dataProcessing.returnPowerOutageReport (powerOutageObj.values);
            const n = res.data.result.length;
            let lastTimestamp = null ;
            if (n > 0){ //checking order of data
              lastTimestamp = new Date(res.data.result[0].ingestedTimestamp);
              if (lastTimestamp < new Date(res.data.result[n-1].ingestedTimestamp)){
                lastTimestamp = new Date(res.data.result[n-1].ingestedTimestamp);
              }
            }
            resolve({
              transformedData: transformedData,
              powerOutageReport: powerOutageReport_arr,
              lastTimestamp: lastTimestamp
            });
          }).catch(err => {console.log(err)})
        });
      }
    }).catch(err => {console.log(err)})
  });
}

//function that returns the energy consumption for the day from a starting date to an end date
function getDailyEnergyConsumption(appname ,channel, startDate, endDate){
  return new Promise(function (resolve, reject) {
      konker.getAllDevices(appname).then((res) => {
        if (res.data.code === 200) {
          res.data.result.forEach(device => {
              getPerDayKWHT(appname, device.guid, channel, startDate, endDate).then(final_res=>{
                resolve ( dataProcessing.returnDailyStatsEnergyConsumption(final_res));
              });
          });
        }
      }).catch(err => {console.log(err)})
  });
}

//function that returns the energy consumption on a hourly basis from a starting date to an end date
function getHourlyEnergyConsumption( appname, channel, startDate, endDate){
  return new Promise(function (resolve, reject) {
      konker.getAllDevices(appname).then((res) => {
        if (res.data.code === 200) {
          res.data.result.forEach(device => {
              getPerHourKWHT(appname, device.guid, channel, startDate, endDate).then(final_res=>{
                resolve (final_res);
              });
          });
        }
      }).catch(err => {console.log(err)})
  });
}

//get the energy consumption by day from dt_start to endDate
function getPerDayKWHT(application, device, channel, dt_start, endDate){
  return new Promise(function (resolve, reject) {
    var dt_end = new Date(dt_start);
    dt_end.setMinutes( dt_end.getMinutes() + 1);
    konker.getDataFrom(application, device, channel, dt_start, dt_end).then(res => {
        var newElem = {};
        if (res.data.result.length === 1){
          const arrayItem = res.data.result[0];
          var timestamp = new Date(arrayItem.ingestedTimestamp);
          newElem = {
            x: timestamp,
            y: arrayItem.payload["KWHT"]
          };
        }
        var next_date = new Date(dt_start);
        next_date.setDate( next_date.getDate() + 1 );
        if (new Date(next_date) < new Date(endDate)){
          getPerDayKWHT(application, device, channel, next_date, endDate).then(result=>{
            var kwht_arr = [];
            if (res.data.result.length === 1){
                kwht_arr.push(newElem);
            }
            var kwht_array = kwht_arr.concat(result);
            resolve(kwht_array);
          }).catch(err => {console.log(err)})
        }
        else{
          if (res.data.result.length === 1){
              resolve([newElem]);
          }
          resolve();
        }
      }).catch(err => {console.log(err)})
    });
}

//get the energy consumption per hour from dt_start to endDate
function getPerHourKWHT(application, device, channel, dt_start, endDate){
  return new Promise(function (resolve, reject) {
    var dt_end = new Date(dt_start);
    dt_end.setMinutes( dt_end.getMinutes() + 1);
    konker.getDataFrom(application, device, channel, dt_start, dt_end).then(res => {
        var newElem = {};
        if (res.data.result.length === 1){
          const arrayItem = res.data.result[0];
          var timestamp = new Date(arrayItem.ingestedTimestamp);
          newElem = {
            x: timestamp.getHours() + ":" + timestamp.getMinutes(),
            y: arrayItem.payload["KWHT"]/1000
          };
        }
        var next_date = new Date(dt_start);
        next_date.setMinutes( next_date.getMinutes() + 60 );
        if (new Date(next_date) < new Date(endDate)){
          getPerHourKWHT(application, device, channel, next_date, endDate).then(result=>{
            var kwht_arr = [];
            if (res.data.result.length === 1){
                kwht_arr.push(newElem);
            }
            var kwht_array = kwht_arr.concat(result);
            resolve(kwht_array);
          }).catch(err => {console.log(err)})
        }
        else{
          if (res.data.result.length === 1){
              resolve([newElem]);
          }
          resolve();
        }
      }).catch(err => {console.log(err)})
    });
}

//same as previous function but without formating the timestamp, for later date processing (function created for more clarity)
function getPerHourKWHTNoTimestampFormating(application, device, channel, dt_start, endDate){
  return new Promise(function (resolve, reject) {
    var dt_end = new Date(dt_start);
    dt_end.setMinutes( dt_end.getMinutes() + 1);
    konker.getDataFrom(application, device, channel, dt_start, dt_end).then(res => {
        var newElem = {};
        if (res.data.result.length === 1){
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
          getPerHourKWHTNoTimestampFormating(application, device, channel, next_date, endDate).then(result=>{
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

//function that gets the energy consumption every hour for an entire week
//(limited to 6 days as no more data is saved on the Konker platform)
function getCurrentWeekPerHourKWHT(application, device, channel, date_start, endingDate){
  return new Promise(function (resolve, reject) {
    var date_end = new Date (date_start);
    date_end.setMinutes( date_end.getMinutes() + 60*24 );
    if ( new Date(date_end) > new Date(endingDate)){
      date_end = new Date(endingDate);
    }
    getPerHourKWHTNoTimestampFormating(application, device, channel, date_start, date_end).then(res=>{
      var newElem = {
        date: date_start,
        values: res
      };
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

//function that returns the average hourly energy consumtption for a week
//(limited to 6 days due to data limitation from Konker platform)
function getAverageHourlyConsumptionForWeek(application, channel, dt_start, endDate){
  return new Promise(function (resolve, reject) {
    konker.getAllDevices(application).then((res) => {
      if (res.data.code === 200) {
        res.data.result.forEach(device => {
          getCurrentWeekPerHourKWHT(application, device.guid, channel, dt_start, endDate).then(result=>{
            const processed_data = dataProcessing.returnHourlyEnergyConsumption(result);
            resolve(processed_data);
          });
        });
      }
    }).catch(err => {console.log(err)})
  });
}

module.exports = {
  getDeviceInformation,
  getAllData,
  getDailyEnergyConsumption,
  getHourlyEnergyConsumption,
  getAverageHourlyConsumptionForWeek
}
