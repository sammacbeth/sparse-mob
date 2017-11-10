import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment'

const membershipNames = {
  'join': 'joined',
  'leave': 'left',
}

export default class MessageList extends Component {

  constructor(props) {
    super(props);
    this.scrollMarkers = {};
    this.scrollPos = null;
  }

  componentDidUpdate() {
    const messageId = this.props.scrollToMessage;
    if (this.scrollPos !== messageId && this.scrollMarkers[messageId]) {
      ReactDOM.findDOMNode(this.scrollMarkers[messageId]).scrollIntoView();
      this.scrollPos = messageId;
    }
  }

  _renderStateMessage(event) {
    const key = event.getId();
    const ref = (ref) => this.scrollMarkers[key] = ref;
    const sender = event.sender ? event.sender.name : event.getSender();
    const ts = moment(new Date(event.getTs())).fromNow();

    let body = '';

    switch(event.getType()) {
      case 'm.room.topic':
        body = `Topic set to ${event.getContent().topic}`;
        break;
      case 'm.room.name':
        body = `Room name changed to ${event.getContent().name}`;
        break;
      case 'm.room.member':
        const what = event.getContent().membership;
        body = `${sender} ${membershipNames[what] || what}`;
        break;
      default:
        body = "[Message: "+event.getType()+" Content: "+JSON.stringify(event.getContent())+"]";
    }

    return (
      <div className={`card text-gray mb-1`} key={key} ref={ref}>
        <div className='card-body'>
          <small>{body} - {ts}</small>
        </div>
      </div>
    )
  }

  _renderMessage(event) {
    const key = event.getId();
    const ref = (ref) => this.scrollMarkers[key] = ref;
    const sender = event.sender ? event.sender.name : event.getSender();
    const ts = moment(new Date(event.getTs())).fromNow();
    const mine = this.props.currentUser === event.sender.userId;
    const cardClasses = ['card', 'text-white', 'mb-2'];
    cardClasses.push(mine ? 'bg-info' : 'bg-secondary');
    if (mine) {
      cardClasses.push('mine');
    }
    return (
      <div className={cardClasses.join(' ')} key={key} ref={ref}>
        <div className='card-body'>
          <p className='card-text'>{event.getContent().body}</p>
          <small>{sender} - {ts}</small>
        </div>
      </div>
    )
  }

  render() {
    const { messages } = this.props;
    this.scrollMarkers = {};
    const renderedMessages = messages
    .map((m) => {
      if (m.getType() === 'm.room.message') {
        return this._renderMessage(m);
      }
      return this._renderStateMessage(m);
    });
    return (
      <div className="col-sm">
        {renderedMessages}
      </div>
    )
  }
}