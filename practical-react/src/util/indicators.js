/**
* functions that return the label of some key indicators sent by the Konker platform and collected by the sensor
*/


const indicators = {
  "ST": "Total Apparent Power (x1000 VA)",
  "FPT": "Total Power Factor",
  "KWHT": "Total Consumption (kW*h)"
}

function getLabelFor(indicator){
  if (indicator in indicators) {return indicators[indicator];}
  return null;
}

function getKeyByValue(value) {
  return Object.keys(indicators).find(key => indicators[key] === value);
}

module.exports = {
  getLabelFor,
  getKeyByValue
}
