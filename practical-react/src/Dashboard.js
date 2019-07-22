import React , { Component } from 'react';
import './Dashboard.css';
import {
    Row,
    Col,CardDeck
} from 'reactstrap';

import '../node_modules/react-vis/dist/style.css';

import MainIndicators from './components/MainIndicators';
import HistoricIndicators from './components/HistoricIndicators';
import SensorDetailsCard from './components/SensorDetailsCard';
import PowerOutageCard from './components/PowerOutageCard';
import EnergyConsumptionStatsCard from './components/EnergyConsumptionStatsCard';

import mainIndicatorsFunctions from './util/mainIndicatorsFunctions';

class Dashboard extends Component {
  constructor(props) {
      super(props);

      const reset_data_array = [{ name: "ST", values: []}, { name: "FPT", values: []}, { name: "KWHT", values: []}];

      this.state = {
          sensorsDetails: {
            name: '',
            id: '',
            location: '',
            deviceModelName: '',
            description: '',
            guid: '',
            active: false
          },
          powerOutageDetails:{
            powerOutage: false,
            pastPowerOutage: false,
            powerOutageTimestamp: '',
            powerOutageHistoric: []
          },
          powerVoltage: [],
          mainIndicatorsData: reset_data_array,
          dailyHistoricKWHTData:[],
          hourlyHistoricKWHTData: [],
          KWHTStats: {
            lowestValue: {
              value: 0,
              day: null
            },
            highestValue: {
              value: 0,
              day: null
            },
            weekendAveConsumption: 0,
            weekdayAveConsumption: 0
          },
          energyConsumptionAnalysis: {
            aveWeekendHourlyConsumption: [],
            aveWeekdaysHourlyConsumption: []
          },
          lastTimestamp: null,
          intervalId: null,
          delta: -1 //this value is used to get the number of days from a starting date. Could be changed by a user in order to get more data from the Konker platform
      };

      this.getSensorsDetails();

      this.simulateEventListener();

      this.getDailyHistoricData();

      this.getHourlyHistoricData();

      this.getAverageHourlyEnergyConsumption();

  }

  //Simulate a server listening to the Konker platform for new data sent by the sensor
  //For simulation, a timeout function is called every minute to update the dashboard on the most recent data from the sensor
  simulateEventListener(){
      mainIndicatorsFunctions.getAllData(this.props.appname,this.props.channel, this.state.lastTimestamp, this.state.delta).then((res) => {
        var new_timestamp = this.state.lastTimestamp;
        if (res.lastTimestamp && new Date(res.lastTimestamp) > new Date(new_timestamp)){

          const numberData = 30;

          var new_st_arr = res.transformedData[0]["values"] ;
          var upd_st_arr = new_st_arr.concat(this.state.mainIndicatorsData[0]["values"]);
          upd_st_arr.length = upd_st_arr.length > Math.abs(this.state.delta)*numberData ?  Math.abs(this.state.delta)*numberData : upd_st_arr.length;

          var new_fpt_arr = res.transformedData[1]["values"] ;
          var upd_fpt_arr = new_fpt_arr.concat(this.state.mainIndicatorsData[1]["values"]);
          upd_fpt_arr.length = upd_fpt_arr.length > Math.abs(this.state.delta)*numberData ? Math.abs(this.state.delta)*numberData : upd_fpt_arr.length;

          var new_kwht_arr = res.transformedData[2]["values"] ;
          var upd_kwht_arr = new_kwht_arr.concat(this.state.mainIndicatorsData[2]["values"]);
          upd_kwht_arr.length = upd_kwht_arr.length > Math.abs(this.state.delta)*numberData ? Math.abs(this.state.delta)*numberData : upd_kwht_arr.length;

          var new_vabctrms_arr = res.transformedData[3]["values"];
          var upd_vabctrms_arr = new_vabctrms_arr.concat(this.state.powerVoltage);
          upd_vabctrms_arr.length = upd_vabctrms_arr.length > Math.abs(this.state.delta)*numberData ?  Math.abs(this.state.delta)*numberData : upd_vabctrms_arr.length;

          //Power outage information
          if (upd_vabctrms_arr.length > 0){
            var last_vabctrms_el = upd_vabctrms_arr[upd_vabctrms_arr.length -1];
            var currentPowerOutage = last_vabctrms_el.y > 0 ? false : true ; //just checking current power supply

            var newPowerOutageReport = res.powerOutageReport ;
            const n = newPowerOutageReport.length ;

            var powerOutageHistoric = this.state.powerOutageDetails.powerOutageHistoric;

            if ( n > 0 ){
              //we have new power outage
              const n = newPowerOutageReport.length ;

              if (powerOutageHistoric.length === 0){
                this.setState({
                  powerOutageDetails:{
                    powerOutage: currentPowerOutage,
                    pastPowerOutage: true ,
                    powerOutageTimestamp: newPowerOutageReport[n-1].startDate,
                    powerOutageHistoric: newPowerOutageReport
                  }
                });
              }
              else{
                if (currentPowerOutage === false && powerOutageHistoric[powerOutageHistoric.length-1].endDate === null){
                  powerOutageHistoric[powerOutageHistoric.length-1].endDate = newPowerOutageReport[0].endDate;
                  newPowerOutageReport.shift();
                }
                const upd_powerOutageHistoric = powerOutageHistoric.concat(newPowerOutageReport) ;
                this.setState({
                  powerOutageDetails:{
                    powerOutage: currentPowerOutage,
                    pastPowerOutage: true,
                    powerOutageTimestamp: upd_powerOutageHistoric[upd_powerOutageHistoric.length-1].startDate,
                    powerOutageHistoric: upd_powerOutageHistoric
                  }
                });
              }
            }else{
              //no power outage, update current status of power outage and last timestamp of historic power outage
              if (powerOutageHistoric.length > 0){
                if (currentPowerOutage === false && powerOutageHistoric[powerOutageHistoric.length-1].endDate === null){
                  powerOutageHistoric[powerOutageHistoric.length-1].endDate = res.lastTimestamp.toLocaleString();
                }
              }
              this.setState({
                powerOutageDetails:{
                  powerOutage: currentPowerOutage,
                  pastPowerOutage: powerOutageHistoric.length > 0 ? true : false,
                  powerOutageTimestamp: powerOutageHistoric.length > 0 ? powerOutageHistoric[powerOutageHistoric.length-1].startDate : '',
                  powerOutageHistoric: powerOutageHistoric
                }
              });
            }
          }

          this.setState({
              mainIndicatorsData: [{ name: "ST", values: upd_st_arr}, { name: "FPT", values: upd_fpt_arr}, { name: "KWHT", values: upd_kwht_arr}],
              lastTimestamp: res.lastTimestamp,
              powerVoltage: upd_vabctrms_arr
          });
        }
      });
      this.getSensorsDetails();
  }

  //Check that the sensor is connected to the Konker platform
  getSensorsDetails(){
    mainIndicatorsFunctions.getDeviceInformation(this.props.appname).then(res =>{
      this.setState({
        sensorsDetails: {
          name: res.name,
          id: res.id,
          location: res.locationName,
          deviceModelName: res.deviceModelName,
          description: res.description,
          active: res.active,
          guid: res.guid
        }
      });
    });
  }

  //Below are some functions to aggregate some statistics about the power supplied to the building
  getDailyHistoricData(){
    var startDate = new Date();
    startDate.setDate( startDate.getDate() - 0);
    var endDate = new Date();
    const minutes =  endDate.getMinutes() ;
    const hours = endDate.getHours() ;
    endDate.setMinutes(endDate.getMinutes() - minutes);
    endDate.setHours(endDate.getHours() - hours);
    startDate.setDate(endDate.getDate() - 7);
    mainIndicatorsFunctions.getDailyEnergyConsumption(this.props.appname,this.props.channel, startDate, endDate).then(res=>{
      this.setState({
          dailyHistoricKWHTData: res.values,
          KWHTStats: {
            lowestValue: {
              value: res.lowestValue.value,
              day: res.lowestValue.day
            },
            highestValue: {
              value: res.highestValue.value,
              day: res.highestValue.day
            },
            weekendAveConsumption: res.weekendAveConsumption,
            weekdayAveConsumption: res.weekdayAveConsumption
          }
      });

    });
  }

  getHourlyHistoricData(){
    var endDate = new Date();
    const minutes =  endDate.getMinutes() ;
    endDate.setMinutes(endDate.getMinutes() - minutes);
    var startDate = new Date( endDate);
    startDate.setMinutes( startDate.getMinutes() - 60*24);
    mainIndicatorsFunctions.getHourlyEnergyConsumption(this.props.appname,this.props.channel, startDate, endDate).then(res=>{
      this.setState({
          hourlyHistoricKWHTData: res
      });
    });
  }

  getAverageHourlyEnergyConsumption(){
    //Chosing the dates so that they starts at the beggining of the day local time
    var end_Date = new Date();
    end_Date.toLocaleString()
    const seconds = end_Date.getSeconds() ;
    const minutes =  end_Date.getMinutes() ;
    const hours = end_Date.getHours() ;
    end_Date.setSeconds(end_Date.getSeconds() - seconds);
    end_Date.setMinutes(end_Date.getMinutes() - minutes);
    end_Date.setHours(end_Date.getHours() - hours);

    var startDate = new Date(end_Date);
    startDate.setHours(startDate.getHours() - 24*6);
    startDate.setMinutes(startDate.getMinutes() + 1);
    end_Date.setHours(end_Date.getHours() + 1);

    const appname = 'default';
    mainIndicatorsFunctions.getAverageHourlyConsumptionForWeek(appname, this.props.channel, startDate, end_Date).then(res=>{
      this.setState({
        energyConsumptionAnalysis: {
          aveWeekendHourlyConsumption: res.weekendAverConsArr,
          aveWeekdaysHourlyConsumption: res.weekdayAverConsArr
        }
      });
    });
  }

  componentDidMount() {
    var intervalId = setInterval(this.simulateEventListener.bind(this), 60*1000);
    this.setState({intervalId: intervalId});
  }

  //Stop the somulation when user logs out of the dashboard
  componentWillUnmount(){
    clearInterval(this.state.intervalId);
  }

  render() {
    return (
        <>

          <p><i>This dashboard is updated every minute.</i></p>

          <CardDeck id="generalIndicatorsID">
            <SensorDetailsCard name={this.state.sensorsDetails.name} id={this.state.sensorsDetails.id} location={this.state.sensorsDetails.location} deviceModelName={this.state.sensorsDetails.deviceModelName} description={this.state.sensorsDetails.description} active={this.state.sensorsDetails.active} guid={this.state.sensorsDetails.guid}/>
            <PowerOutageCard powerOutage={this.state.powerOutageDetails.powerOutage} pastPowerOutage={this.state.powerOutageDetails.pastPowerOutage} powerOutageTimestamp={this.state.powerOutageDetails.powerOutageTimestamp} powerOutageHistoric={this.state.powerOutageDetails.powerOutageHistoric}/>
            <EnergyConsumptionStatsCard highestEnergyConsumedDay={this.state.KWHTStats.highestValue.day} highestEnergyConsumedValue={this.state.KWHTStats.highestValue.value} lowestEnergyConsumedDay={this.state.KWHTStats.lowestValue.day} lowestEnergyConsumedValue={this.state.KWHTStats.lowestValue.value} weekendAveConsumption={this.state.KWHTStats.weekendAveConsumption} weekdayAveConsumption={this.state.KWHTStats.weekdayAveConsumption}/>
          </CardDeck>

          <Row>
            <Col><h4>Current Metrics:</h4></Col>
          </Row>
          <Row id="generalIndicatorsID">
            <Col><MainIndicators title={this.state.theTitle} data={[this.state.mainIndicatorsData[0]]}/></Col>
            <Col><MainIndicators title={this.state.theTitle} data={[this.state.mainIndicatorsData[1]]}/></Col>
            <Col><MainIndicators title={this.state.theTitle} data={[this.state.mainIndicatorsData[2]]}/></Col>
          </Row>

          <Row>
            <Col><h4>Historic Data:</h4></Col>
          </Row>
          <Row id="generalIndicatorsID">
            <Col><HistoricIndicators data={this.state.dailyHistoricKWHTData}
              title={"Energy Consumption in the Past Week"}
              description={"Below is the energy consumption in the past 6 days. Values are in (kW*h)."}
              barColor={"#4169E1"}
            />
            </Col>
          </Row>

          <Row id="generalIndicatorsID">
            <Col><HistoricIndicators title={"Energy Consumption in the Past 24 hours"}
              data={this.state.hourlyHistoricKWHTData}
              description={"Below is the energy consumption from the past 24h. Values are in (kW*h)."}
              barColor={"#00BFFF"}
              />
            </Col>
          </Row>

          <Row>
            <Col><h4>Data Analysis:</h4></Col>
          </Row>
          <Row id="generalIndicatorsID">
            <Col><HistoricIndicators data={this.state.energyConsumptionAnalysis.aveWeekdaysHourlyConsumption}
              title={"Average Energy Consumption in Weekdays"}
              description={"Below is the average energy consumption in weekdays on a hourly basis. Values are in (kW*h)."}
              barColor={"#FF7F50"}
              />
            </Col>
          </Row>

          <Row id="generalIndicatorsID">
            <Col><HistoricIndicators title={"Average Energy Consumption in the Weekend"}
              data={this.state.energyConsumptionAnalysis.aveWeekendHourlyConsumption}
              description={"Below is the average energy consumption during the weekend on a hourly basis. Values are in (kW*h). Please note, a value of 0 means the sensor didn't send the data at that point in time."}
              barColor={"#FFA500"}
            />
            </Col>
          </Row>

        </>
      );
    }
}
export default Dashboard;
