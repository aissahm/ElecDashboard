const axios = require('axios');
//import axios from 'axios';

const _KONKER_API_ = "https://api.demo.konkerlabs.net/v1/";
const _INITIAL_TOKEN_ = "INVALID";
const _TOKEN_API_ = "tokenApi";
const _USER_NAME_ = "username";
const _USER_DATA_ = "userdata";
const _USER_INFO_CACHE_ = "userInfoCache";


const clientID = "";
const secret = "";

const konkerApi = _KONKER_API_;
let userToken = '';

// redefine localstorage to work
if (localStorage === undefined) {
    var localStorage = new Map();
    localStorage.getItem = (key) => {
        return localStorage.get(key);
    }
    localStorage.setItem = (key, value) => {
        return localStorage.set(key, value);
    }
}

if(localStorage.getItem(_TOKEN_API_) !== null) {
    userToken = localStorage.getItem(_TOKEN_API_);
} else {
    userToken = _INITIAL_TOKEN_;
}

const authEndpoint = konkerApi + 'oauth/token?grant_type=client_credentials';
const userInfoEndpoint = konkerApi + 'users/{email}';
const usersEndpoint = konkerApi + 'users/';
const apiUrlBase = konkerApi + '{application}/';
const locationsEndpoint = apiUrlBase + 'locations/';
const devicesEndpoint = apiUrlBase + 'devices/';
const deviceStatusEndpoint = devicesEndpoint + '{deviceGuid}/health' ;///alerts';
const incomingEventsEndpoint = apiUrlBase + 'incomingEvents?q=device:{deviceGuid} channel:{eventChannel}{filter}&sort=newest&limit={limit}';
const incomingAllEventsEndpoint = apiUrlBase + 'incomingEvents?q=device:{deviceGuid} {filter}&sort=newest&limit={limit}';
const privateStorageEndpoint = apiUrlBase + 'privateStorage/';
const resetPasswordEndpoint = privateStorageEndpoint + 'resetPasswordTokens';
const searchResetTokenEndpoint = resetPasswordEndpoint + '/search?q=token=eq:{token}&sort=desc:creationTS&pageSize=1';

//
// for user management using Konker as an OAUTH server, use an API TOKEN created on the plataform API
// to be used to allow user to reset its missing password
//
const supportTokenForResetPassword = "";
const uuid = require('uuid/v4');

function authenticate(username, password) {
    return axios.get(
        authEndpoint,
        { auth: {
                username: username,
                password: password
            }
        })
        .then(res => {
            localStorage.setItem(_TOKEN_API_, res.data.access_token);
            localStorage.setItem(_USER_NAME_, username);
            userToken = res.data.access_token;
            return userInfo();
        })
        .then(res => {
            localStorage.setItem(_USER_INFO_CACHE_, JSON.stringify({status: res.status , data: Object.assign({}, res.data)}));
            localStorage.setItem(_USER_DATA_, res.data.result);
            return  new Promise(function(resolve) {
                resolve(res);
            })
        }).catch(error => {
            console.log('ERROR LOADING USER DATA');
            return new Promise(function(resolve, reject) {
                reject({error});
            })
        });
}

function logout() {
    localStorage.clear();
}

function userInfo() {
    if (localStorage.getItem(_USER_INFO_CACHE_)) {
        return new Promise(function(resolve) {
            resolve(JSON.parse(localStorage.getItem(_USER_INFO_CACHE_)))
        })
    }
    else {
        return axios.get(
            userInfoEndpoint.replace('{email}', localStorage.getItem(_USER_NAME_)),
            { headers: { Authorization: 'Bearer' + userToken }}
        );
    }
}

function isUserLogged() {
    return localStorage.getItem(_USER_NAME_)
        && localStorage.getItem(_TOKEN_API_);
}

function getLocation(application, locationName) {
    return axios.get(
        locationsEndpoint.replace('{application}', application) + `/${locationName}`,
        { headers: { Authorization: 'Bearer ' + userToken }}
    );
}

function createRandomPassword() {
    var randomstring = Math.random().toString(36).slice(-12);
    return randomstring;
}

function createUser(application, userInfo) {
    let payload = {
        email: userInfo.email,
        password: (userInfo.password) ? userInfo.password : createRandomPassword(),
        phone: userInfo.phone,
        name: userInfo.name,
        notificationViaEmail: true,
        application: application,
        location: userInfo.location === "all" ? null : userInfo.location
      }
    return axios.post(
        usersEndpoint.replace('{application}', application),
        payload,
        {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + userToken }
        }
    );
}


function getAllUsers(application, locationName) {
    let url = usersEndpoint.replace('{application}', application);
    console.log('GETTING URL = '+ url)
    console.log('Bearer ' + userToken);
    return axios.get(
        url,
        { headers: { Accept: 'application/json', Authorization: 'Bearer ' + userToken }}
    );
}

function getAllLocations(application) {
    return axios.get(
        locationsEndpoint.replace('{application}', application),
        { headers: { Accept: 'application/json', Authorization: 'Bearer ' + userToken }}
    ).then(response => {
        return response['data']['result'];
    });
}

function createLocation(application, body) {
    return axios.post(
        locationsEndpoint.replace('{application}', application),
        body,
        { headers: { Authorization: 'Bearer ' + userToken }}
    );
}

function updateLocation(application, locationName, body) {
    return axios.put(
        locationsEndpoint.replace('{application}', application) + `/${locationName}`,
        body,
        { headers: { Authorization: 'Bearer ' + userToken }}
    );
}

function getAllDevices(application) {
    return axios.get(
        devicesEndpoint.replace('{application}', application),
        { headers: { Authorization: 'Bearer ' + userToken }}
    );
}

function getDevicesByLocation(application, location) {
    return axios.get(
        devicesEndpoint.replace('{application}', application),
        { headers: { Authorization: 'Bearer ' + userToken },
          params: { locationName: location }}
    );
}

function getIncomingEvents(application, deviceGuid, channel, limit=1) {
    return axios.get(
        incomingEventsEndpoint.replace('{application}', application)
            .replace('{deviceGuid}', deviceGuid)
            .replace('{eventChannel}', channel)
            .replace('{filter}', '')
            .replace('{limit}', ''+limit),
        { headers: { Authorization: 'Bearer ' + userToken }}
    );
}

function getIncomingAllEvents(application, deviceGuid, limit=1) {
    return axios.get(
        incomingAllEventsEndpoint.replace('{application}', application)
            .replace('{deviceGuid}', deviceGuid)
            .replace('{filter}', '')
            .replace('{limit}', ''+limit),
        { headers: { Authorization: 'Bearer ' + userToken }}
    );
}

function getDeviceStatus(application, deviceGuid) {
    return axios.get(
        deviceStatusEndpoint.replace('{application}', application).replace('{deviceGuid}', deviceGuid),
        { headers: { Authorization: 'Bearer ' + userToken }}
    );
}

function readData(application, deviceGuid, channel=null, delta=-1, startDate=null) {

    var interval = (Math.abs(delta) > 1 ? 2 : 1);
    var dt_start = null;

    if (startDate) {
        dt_start = startDate;
    } else {
        var now = new Date(Date.now());
        dt_start = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    }

    dt_start.setDate(dt_start.getDate() + delta);

    var now_2 = new Date(Date.now());
    var dt_end = new Date(now_2.getFullYear(),now_2.getMonth(),now_2.getDate());

    return axios.get(incomingEventsEndpoint
        .replace('{application}', application)
        .replace('{deviceGuid}', deviceGuid)
        .replace('{eventChannel}', channel)
        .replace('{limit}', '30000')
        // .replace('{filter}', ' timestamp:>' + dt_start + ' timestamp:<' + dt_end),
        .replace('{filter}', ' timestamp:>2019-07-18T13:55:20.150Z timestamp:<2019-07-19T18:35:20.150Z' ),
        { headers: { Authorization: 'Bearer ' + userToken }}
    );
}

function getData (application, deviceGuid, channel=null, delta=-1, startDate=null){
  var dt_start = null;
  if (startDate) {
      dt_start = startDate;
  } else {
      dt_start = new Date();
      dt_start.setMinutes(dt_start.getMinutes()+delta*3600);
  }

  return axios.get(incomingEventsEndpoint
      .replace('{application}', application)
      .replace('{deviceGuid}', deviceGuid)
      .replace('{eventChannel}', channel)
      .replace('{limit}', '10000')
      .replace('{filter}', ' timestamp:>' + dt_start.toISOString() ),
      { headers: { Authorization: 'Bearer ' + userToken }}
  );
}

function getDataFrom (application, deviceGuid, channel=null,  startDate, endDate){
  return axios.get(incomingEventsEndpoint
      .replace('{application}', application)
      .replace('{deviceGuid}', deviceGuid)
      .replace('{eventChannel}', channel)
      .replace('{limit}', '3000')
      .replace('{filter}', ' timestamp:>' + startDate.toISOString() + ' timestamp:<' + endDate.toISOString()),
      { headers: { Authorization: 'Bearer ' + userToken }}
  );
}

function getUserByEmail(email) {
    return axios.get(
        userInfoEndpoint.replace("{email}", email),
        { headers: { Accept: 'application/json', Authorization: 'Bearer ' + supportTokenForResetPassword }}
    );
}

function createResetPasswordToken(application, email) {
    let body = {
        _id: uuid(),
        email: email,
        creationTS: new Date().getTime(),
        token: uuid(),
        expired: false
    }

    return axios.post(
        resetPasswordEndpoint.replace('{application}', application),
        body,
        {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + supportTokenForResetPassword }
        }
    );
}

function invalidateToken(application, body) {
    body.expired = true;
    return axios.put(
        resetPasswordEndpoint.replace('{application}', application),
        body,
        {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + supportTokenForResetPassword }
        }
    );
}

function validateResetToken(application, token) {
    return axios.get(
        searchResetTokenEndpoint
            .replace('{application}', application)
            .replace('{token}', token),
        {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + supportTokenForResetPassword }
        }
    );
}

function updateUser(application, user) {
    return axios.put(
        usersEndpoint.replace('{application}', application) + user.email,
        user,
        {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + supportTokenForResetPassword }
        }
    );
}

module.exports = {authenticate,
    logout,
    userInfo,
    isUserLogged,
    getLocation,
    createRandomPassword,
    createUser,
    getAllUsers,
    getAllLocations,
    createLocation,
    updateLocation,
    getAllDevices,
    getDevicesByLocation,
    getIncomingEvents,
    getIncomingAllEvents,
    getDeviceStatus,
    readData,
    getUserByEmail,
    createResetPasswordToken,
    invalidateToken,
    validateResetToken,
    updateUser,
    getData,
    getDataFrom
}
