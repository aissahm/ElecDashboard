import React  from 'react';
import {XYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  VerticalBarSeriesCanvas
} from 'react-vis';

/**
 * HistogramPlot component that displays a histogram graph
 *
 * @props {string} barColor: color to render the bars, by default the value is #4682B4
 * @props {array} data: array containing objects in the following format {x: x_val, y: y_val}
 *
 */

function HistogramPlot(props){
  const BarSeries =  VerticalBarSeriesCanvas ;
  return (
    <XYPlot xType='ordinal' width={900} height={300} stackBy="y" color={ props.barColor ? (props.barColor) : ("#4682B4")}>
      <VerticalGridLines />
      <HorizontalGridLines />
      <XAxis />
      <YAxis margin={{left: 500}} tickTotal = {5}/>
      <BarSeries data={Array.from(props.data)}/>
    </XYPlot>
  );
}

export default HistogramPlot;
