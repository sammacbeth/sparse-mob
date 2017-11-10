import React, { Component } from 'react';

export default class TextEntry extends Component {

  constructor(props) {
    super(props);
    this.state = { value: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    const submission = this.props.onSubmit && this.props.onSubmit(this.state.value);
    if (submission && submission.then) {
      this.setState({ disabled: true });
      submission.then(() => {
        this.setState({ value: '', disabled: false });
      }, () => {
        this.setState({ disabled: false });
      });
    }
  }

  render() {
    const { placeHolder, buttonText } = this.props;
    const disabled = this.state.disabled || this.props.disabled;
    return (
      <div className='row'>
        <div className='col-sm'>
          <form onSubmit={this.handleSubmit}>
            <div className='input-group'>
              <input
                type='text'
                className='form-control'
                placeholder={placeHolder}
                value={this.state.value}
                onChange={this.handleChange}
                disabled={disabled}
              />
              <span className='input-group-btn'>
                <button className='btn btn-secondary' type='submit' disabled={disabled}>{buttonText}</button>
              </span>
            </div>
          </form>
        </div>
      </div>
    )
  }
}