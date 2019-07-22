import React from 'react';
import {XYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  LineSeries
} from 'react-vis';

/**
 * SimpleXYPlot component that plots data in a graph
 *
 * @props {array} data: array containing objects in the following format {x: x_val, y: y_val}
 *
 */

function SimpleXYPlot(props){
  return (
    <XYPlot xType="time" width={300} height={300}>
      <VerticalGridLines />
      <HorizontalGridLines />
      <XAxis />
      <YAxis />
      <LineSeries
        className="first-series"
        data={props.data}
        style={{
          strokeLinejoin: 'round',
          strokeWidth: 4
        }}
      />
      </XYPlot>
  );
}

export default SimpleXYPlot;
