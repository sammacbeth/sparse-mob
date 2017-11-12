import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import { HashRouter as Router, Route, Redirect } from 'react-router-dom'
import Overview from './Overview';
import Room from './Room';
import Login from './Login';
import MatrixClient from './matrix';

const AUTH_SUCCESS = 'success';
const AUTH_PENDING = 'pending';
const AUTH_REQUIRED = 'required';

class App extends Component {

  constructor(props) {
    super(props);
    this.client = new MatrixClient();
    this.state = { auth: AUTH_PENDING }
    if (this.client.hasSavedCredentials()) {
      console.log('login', 'saved creds');
      this.client.loginWithSavedCredentials().then(() => {
        this.setState({ auth: AUTH_SUCCESS });
      });
    } else {
      console.log('login', 'no saved creds');
      this.state = { auth: AUTH_REQUIRED };
    }
  }

  render() {
    const { auth } = this.state;
    if (auth === AUTH_PENDING) {
      return (<div className="container"><div className='alert alert-primary'>Loading</div></div>)
    }
    if (auth !== AUTH_SUCCESS && this.client.isLoggedIn()) {
      this.setState({ auth: AUTH_SUCCESS });
    }
    const wrapClient = (Component) => {
      return (props) => (<Component client={this.client} {...props} />);
    };
    return (
      <Router ref="router">
        <div className="container">
          <Route path="/room/:roomId" component={wrapClient(Room)} />
          <Route path='/login' component={wrapClient(Login)} />
          <Route exact path="/" component={wrapClient(Overview)} />
          { !this.client.isLoggedIn() && <Redirect to={{
            pathname: '/login',
            state: { from: this.props.location }
          }} /> }
        </div>
      </Router>
    );
  }
}

export default App;
