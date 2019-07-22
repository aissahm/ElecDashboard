import React , { Component } from 'react';
import './App.css';
import { Button } from 'reactstrap';
import {
    Collapse,
    Navbar,
    NavbarToggler,
    NavbarBrand,
    Nav,
    Container,
    Row,
    Col, Alert
} from 'reactstrap';
import { Form, FormGroup, Input } from 'reactstrap';
import Dashboard from './Dashboard';
const konker = require('./KonkerApi');

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            email: '',
            password: '',
            logged: false,
            wrongCredentials: false,
            loginButtonEnabled: true,
            channel: '',
            appname: ''
          };
          this.toggle = this.toggle.bind(this);
          this.logOutClick = this.logOutClick.bind(this);
          this.handleThisClick = this.handleThisClick.bind(this);
    }

    //When screen size, is small, button on click renders list of buttons from the navbar
    toggle() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    }

    //On click, we must log out from the Konker platform (konker.logout() in KonkerApi)
    logOutClick(){

      this.setState({
          logged: false,
          channel: '',
          appname: ''
      });
    }

    //Try to log in the user
    //disable login button, to prevent multiple calls to the platform
    handleThisClick() {

      this.setState({
                  loginButtonEnabled: false
          });

      const email = this.state.email;
      const password = this.state.password;

      konker.authenticate(email, password).then((res) => {
        if (res.status === 200){
          this.setState({
                  wrongCredentials: false,
                  logged: true,
                  loginButtonEnabled: true,
                  channel: 'energy',
                  appname: 'default'
          });
        }
      }).catch(err => {
        if (err.error.response.status === 401){
          this.setState({
                  wrongCredentials: true,
                  loginButtonEnabled: true
          });
        }
      })
    }

    render() {
        return (
            <div>
                <Navbar className="NavBarComponent" color="inverse" light expand="md">
                    <NavbarBrand href="/">Energy Supply Dashboard</NavbarBrand>
                    <NavbarToggler onClick={this.toggle} />
                    <Collapse isOpen={this.state.isOpen} navbar>
                        <Nav className="ml-auto" navbar>
                            {this.state.logged &&(<Button
                                color="danger"
                                size="large"
                                onClick={this.logOutClick}
                            >
                                Logout
                            </Button>)}
                        </Nav>
                    </Collapse>
                </Navbar>
                {this.state.logged && (<Container className="DashboardComponent"><Dashboard  channel={this.state.channel} appname={this.state.appname} /></Container>)}
                {!this.state.logged && (

                  <div className="LoginComponent">
                    <Col>
                        <Row>
                            <Col>
                                <h1>Energy Supply Dashboard</h1>
                                <p id="descriptionText">Please login in order to access the dashboard. If you aren't yet registered, you can create a new user account on the <a href="http://www.konkerlabs.com" target="_blank" rel="noopener noreferrer">Konker platform</a>.</p>
                            </Col>
                        </Row>
                        <Row>
                          <Col>
                            <Form>

                                <FormGroup>
                                  <Input type="email" value={this.state.email} onChange={e => this.setState({ email: e.target.value })} name="email" id="exampleEmail" placeholder="email address" />
                                </FormGroup>
                                <FormGroup>
                                  <Input type="password" value={this.state.password} onChange={e => this.setState({ password: e.target.value })} name="password" id="examplePassword" placeholder="password" />
                                </FormGroup>

                                <Button id="loginButton"
                                    tag="a"
                                    color="success"
                                    size="large"
                                    onClick={this.handleThisClick}
                                    disabled={!this.state.loginButtonEnabled}
                                >
                                    Login
                                </Button>
                                { this.state.wrongCredentials && (
                                  <FormGroup>
                                    <Alert color="danger" id="alertMessage">
                                      The username and the password aren't correct
                                    </Alert>
                                  </FormGroup>
                                )}
                              </Form>
                          </Col>
                        </Row>
                    </Col>
                </div>)}
            </div>
        );
    }
}

export default App;
