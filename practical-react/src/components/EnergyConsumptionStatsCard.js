import React from 'react';
import { CardFooter, Card, CardBody, ListGroupItem, ListGroup,
 Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

 /**
  * EnergyConsumptionStatsCard component that displays statistics about the energy consumption in the building
  *
  * @props {string} highestEnergyConsumedDay: day with the highest energy consumption
  * @props {string} highestEnergyConsumedValue: the highest energy consumed
  * @props {string} lowestEnergyConsumedDay: day with the lowest energy consumption
  * @props {string} lowestEnergyConsumedValue: the lowest energy consumed
  * @props {string} weekdayAveConsumption: average weekday energy consumption
  * @props {string} weekendAveConsumption: average weekend energy consumption
  */

class EnergyConsumptionStatsCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false
    };
    this.toggle = this.toggle.bind(this);
    this.returnEnergyConsumptionInformation = this.returnEnergyConsumptionInformation.bind(this);
  }

  toggle() {
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
  }

  returnEnergyConsumptionInformation(){
      return (
        <>
        <ModalHeader toggle={this.toggle}>
          Energy Consumption Statistics
        </ModalHeader>
        <ModalBody>
          <p>Info about energy consumption</p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>Close</Button>
        </ModalFooter>
        </>
      );
  }

  render() {
    return (
      <>
        <Card>
          <CardBody>
          <h5>Energy Consumption Stats</h5>
          <ListGroup>
            <ListGroupItem>
              <p><strong>Highest consumption</strong></p>
              <p>Day: {this.props.highestEnergyConsumedDay}</p>
              <p>Value: {this.props.highestEnergyConsumedValue} (kW*h)</p>
            </ListGroupItem>
            <ListGroupItem>
              <p><strong>Lowest consumption</strong></p>
              <p>Day: {this.props.lowestEnergyConsumedDay}</p>
              <p>Value: {this.props.lowestEnergyConsumedValue} (kW*h)</p>
            </ListGroupItem>
            <ListGroupItem>
              <p><strong>Average weekday cons.</strong></p>
              <p>Value: {this.props.weekdayAveConsumption} (kW*h)</p>
            </ListGroupItem>
            <ListGroupItem>
              <p><strong>Average weekend cons.</strong></p>
              <p>Value: {this.props.weekendAveConsumption} (kW*h)</p>
            </ListGroupItem>
          </ListGroup>
          </CardBody>
          <CardFooter><Button onClick={this.toggle}>More information</Button></CardFooter>
        </Card>
        <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
          {this.returnEnergyConsumptionInformation()}
        </Modal>
      </>
    );
  }
}

export default EnergyConsumptionStatsCard;
