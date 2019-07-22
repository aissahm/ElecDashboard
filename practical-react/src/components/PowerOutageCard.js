import React from 'react';
import { Badge, Card, CardBody,Table, ListGroup, ListGroupItem,
   CardFooter, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

/**
* PowerOutageCard component shows:
*   -whether a power outage occured,
*   -displays a report about previous power outage events as a table, inside a modal view
*   -general information about power outage causes, reasons, etc
*
* @props {array} historicData: array of objects with the following format {startDate: "", endDate: ""}
*
*/

class PowerOutageCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      powerOutageReportModal: false
    };
    this.toggle = this.toggle.bind(this);
    this.seePowerOutageReport = this.seePowerOutageReport.bind(this);
    this.returnPowerOutageDefinition = this.returnPowerOutageDefinition.bind(this);
    this.returnPowerOutageReport = this.returnPowerOutageReport.bind(this);
  }

  toggle() {
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
  }

  seePowerOutageReport(){
    this.setState(prevState => ({
      powerOutageReportModal: !prevState.powerOutageReportModal
    }));
  }

  returnPowerOutageDefinition(){
      return (
        <>
        <ModalHeader toggle={this.toggle}>
          Causes of Power Outage
        </ModalHeader>
        <ModalBody>
          <p>A power outage (also called a power cut, a power out, a power blackout, power failure or a blackout) is
            the loss of the electrical power network supply to the building.</p>
          <p>There are many causes of power failures in an electricity network.
            Examples of these causes include faults at power stations, damage to electric transmission lines,
            substations or other parts of the distribution system,
            a short circuit, cascading failure, fuse or circuit breaker operation.</p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>Close</Button>
        </ModalFooter>
        </>
      );
  }

  returnPowerOutageReport(historicData){
    return(<>
        <ModalHeader toggle={this.seePowerOutageReport}>Historic Power Outage</ModalHeader>
        <ModalBody>
        {historicData.length > 0 ? (
          <>
              <p>Below are the most recent power shortages that happened in the building. The are ordered from the oldest to the newest.</p>

              <Table size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>From</th>
                    <th>To</th>
                  </tr>
                </thead>
                <tbody>
                    {historicData.map((elem, index) => (
                      <tr key={index}>
                        <th scope="row">{index}</th>
                        <td>{elem.startDate}</td>
                        <td>{elem.endDate === null ? "" : elem.endDate }</td>
                      </tr>
                    ))}
                </tbody>
              </Table>
          </>
        ) : (<p>No power outage has been detected recently in the building</p>)}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.seePowerOutageReport}>Close</Button>
        </ModalFooter>
      </>);
  }

  render() {
    return (
      <>
        <Card>
          <CardBody>
          <h5>Building Power Supply</h5>
          <ListGroup>
            <ListGroupItem>
              <p><strong>Report for the past 24h</strong></p>
              {!this.props.pastPowerOutage ?
                (<p>No power outage detected in the building</p>):
                (<p>A power outage was detected on {this.props.powerOutageTimestamp}</p>)
              }
              <Button onClick={this.seePowerOutageReport}>Power outage report</Button>
            </ListGroupItem>

            <ListGroupItem>
              <p><strong>Status</strong></p>
              <h2>{!this.props.powerOutage ? (<Badge color="success">Power supplied</Badge>) : (<Badge color="danger">No power supplied</Badge>)}</h2>
            </ListGroupItem>
          </ListGroup>

          </CardBody>

          <CardFooter><Button onClick={this.toggle}>More information</Button> {" "}</CardFooter>

        </Card>
        <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
          {this.returnPowerOutageDefinition()}
        </Modal>
        <Modal isOpen={this.state.powerOutageReportModal} toggle={this.seePowerOutageReport} className={this.props.className}>
          {this.returnPowerOutageReport(this.props.powerOutageHistoric)}
        </Modal>
      </>
    );
  }
}

export default PowerOutageCard;
