import React from 'react';
import indicators from '../util/indicators';
import SimpleXYPlot from './SimpleXYPlot';
import { Spinner } from 'reactstrap';

/**
 * MainIndicators function that renders scalar plots
 *
 * @props {string} barColor: color to render the bars, by default the value is #4682B4
 * @props {object} object: object containing a list of objects with the following format {name: "name", [{x: x_val, y: y_val}]}
 *
 */

function simplePlotData(somedata){
    return (
      <>
          {somedata.map((elem, index) => (
            <div key={index}>
              <h5>{indicators.getLabelFor(elem.name)}</h5>
              {elem.values.length === 0 && (
                <div>
                  <Spinner color="primary" style={{ width: '4rem', height: '4rem' }}/>
                </div>
              )}
              <SimpleXYPlot data={elem.values}/>
            </div>
          ))}
      </>
    );
}

function MainIndicators(props){
  return (
    <>
      {simplePlotData(Array.from(props.data))}
    </>
    );
}

export default MainIndicators;
