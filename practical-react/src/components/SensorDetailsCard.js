import React from 'react';
import { Badge, Card, CardFooter , CardBody, ListGroup, ListGroupItem,
   Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

/**
* SensorDetailsCard component that displays details about the sensor that collects the data sent to the Konker platform
*
* @props {string} name: name of the sensor
* @props {string} Location: where the sensor is located
* @props {string} deviceModelName: model name of the sensor
* @props {boolean} active: boolean value that says whether the sensor is turned ON or OFF
* @props {string} description: information about the sensor
* @props {string} guid: id the sensor
*/

class SensorDetailsCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
  }

  render() {
    return (
      <>
        <Card>
          <CardBody>
            <h5>Sensor Informations</h5>
            <ListGroup>
              <ListGroupItem>
                <p><strong>Name</strong></p>
                <p>{this.props.name}</p>
              </ListGroupItem>
              <ListGroupItem>
                <p><strong>Location</strong></p>
                <p>{this.props.location}</p>
              </ListGroupItem>
              <ListGroupItem>
                <p><strong>Device model</strong></p>
                <p>{this.props.deviceModelName}</p>
              </ListGroupItem>
              <ListGroupItem>
                <p><strong>Status</strong></p>
                <h2>{this.props.active ? (<Badge color="success">Active</Badge>) : (<Badge color="danger">Inactive</Badge>)}</h2>
              </ListGroupItem>
            </ListGroup>
          </CardBody>
          <CardFooter><Button onClick={this.toggle}>More information</Button> {" "}</CardFooter>
        </Card>
        <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
          <ModalHeader toggle={this.toggle}>Information about the sensor</ModalHeader>
          <ModalBody>
            <p><strong>{this.props.name}</strong></p>
            <p>ID: {this.props.id}</p>
            <p>Device model: {this.props.deviceModelName}</p>
            <p>Guid: {this.props.guid}</p>
            <p>Location: {this.props.location}</p>
            <p>Description: {this.props.description.length > 0 ? (<>this.props.description</>) : (<>No information available</>) }</p>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={this.toggle}>Close</Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default SensorDetailsCard;
