import React from 'react';
import HistogramPlot from './HistogramPlot';
import { Spinner } from 'reactstrap';

/**
 * HistoricIndicators component that displays
 *
 * @props {string} title: The main title of the component
 * @props {string} description: small text describing the content displayed
 * @props {array} date: array containing objects in the following format {x: x_val, y: y_val}
 * @props {string} barColor: color passed to the histogram to render the bars 
 */

function HistoricIndicators(props){
  return (
    <>
      <h5>{props.title}</h5>
      <p>{props.description}</p>
      {props.data.length === 0 && (
        <div>
          <Spinner color="primary" style={{ width: '4rem', height: '4rem' }}/>
        </div>
      )}
      <HistogramPlot data={props.data} barColor={props.barColor}/>
    </>
  );
}

export default HistoricIndicators;
