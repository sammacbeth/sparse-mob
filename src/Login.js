import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'


export default class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      homeserver: 'matrix.org',
      username: '',
      password: '',
      disabled: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { homeserver, username, password } = this.state;
    this.setState({ error: null, disabled: true });
    this.props.client.login(username, password, homeserver).then(() => {
      this.setState({
        password: '',
        disabled: false
      });
    }, (error) => {
      this.setState({
        error,
        disabled: false
      });
    });
  }

  render() {
    const { homeserver, username, password, error, disabled } = this.state;
    const { client, location } = this.props;
    const from = location.state && location.state.from ? location.state.from : '/';
    console.log('xxx', from);
    return (
      <div className='row'>
        { client.isLoggedIn() && <Redirect to={from} />}
        <div className='col-sm'>
          <form onSubmit={this.handleSubmit}>
            <div className='alert alert-info'>Please log into a matrix homeserver</div>
            <div className='form-group'>
              <label>Homeserver</label>
              <input
                type='text'
                className='form-control'
                placeholder='Homeserver address, e.g. matrix.org'
                value={homeserver}
                onChange={this.handleChange}
                name='homeserver'
                disabled={disabled}
              />
            </div>
            <div className='form-group'>
              <label>Username</label>
              <input
                type='text'
                className='form-control'
                placeholder='Your username on the homeserver'
                value={username}
                onChange={this.handleChange}
                name='username'
                disabled={disabled}
              />
            </div>
            <div className='form-group'>
              <label>Password</label>
              <input
                type='password'
                className='form-control'
                placeholder='Your password'
                value={password}
                onChange={this.handleChange}
                name='password'
                disabled={disabled}
              />
            </div>
            { error && <div className='alert alert-danger'>{error.message}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={disabled}>Login
            </button>
          </form>
        </div>
      </div>
    )
  }
}
