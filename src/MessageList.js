import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment'

const membershipNames = {
  'join': 'Joined: ',
  'leave': 'Left: ',
}

const groupingConditions = {
  'm.room.message': (group, next) => {
    const lastEvent = group.events[group.events.length - 1];
    return lastEvent.getSender() === next.getSender() &&
      lastEvent.getType() === next.getType() &&
      next.getTs() - lastEvent.getTs() < 300000;
  },
  'm.room.member': (group, next) => {
    return group.events[0].getType() === next.getType();
  },
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

  _renderMembershipMessage(group) {
    const lastEvent = group.events[group.events.length - 1];
    const ts = moment(new Date(lastEvent.getTs())).fromNow();
    const key = lastEvent.getId();
    const changeset = group.events.reduce((changes, event) => {
      const sender = event.sender ? event.sender.name : event.getSender();
      const what = event.getContent().membership;
      changes[sender] = what;
      return changes;
    }, Object.create(null));
    const userChanges = Object.keys(changeset).reduce((states, user) => {
      const change = changeset[user];
      if (!states[change]) {
        states[change] = new Set();
      }
      states[change].add(user);
      return states;
    }, Object.create(null));
    const memberMessages = Object.keys(userChanges).reduce((messages, change) => {
      if (membershipNames[change]) {
        messages.push(`${membershipNames[change]} ${[...userChanges[change]].join(', ')}`)
      }
      return messages;
    }, []);
    return (
      <div className={`card text-gray mb-1`} key={key}>
        <div className='card-body'>
          <small>{memberMessages.join('; ')} - {ts}</small>
        </div>
      </div>
    )
  }

  _renderMessage(event, content) {
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
          <p className='card-text'>{content}</p>
          <small>{sender} - {ts}</small>
        </div>
      </div>
    )
  }

  _renderEventGroup(group) {
    if (group.type === 'm.room.message') {
      const content = group.events.reduce((output, e, i) => {
        output.push(e.getContent().body)
        if (i < group.events.length - 1) {
          output.push(<br />);
        }
        return output;
      }, []);
      return this._renderMessage(group.events[group.events.length - 1], content);
    } else if (group.type === 'm.room.member') {
      return this._renderMembershipMessage(group);
    } else {
      return group.events.map(this._renderStateMessage.bind(this));
    }
  }

  render() {
    const { messages } = this.props;
    this.scrollMarkers = {};
    const messageGroups = messages
    .reduce((groupedMessages, message) => {
      const prevGroup = groupedMessages && groupedMessages[groupedMessages.length - 1];
      const type = message.getType();
      // group if sender and type are the same, and happened within 5 mins of the
      // previous message
      if (prevGroup && type in groupingConditions && groupingConditions[type](prevGroup, message)) {
        prevGroup.events.push(message);
      } else {
        groupedMessages.push({
          type,
          events: [message],
        });
      }
      return groupedMessages;
    }, []);
    const renderedMessages = messageGroups.map((group) => {
      return this._renderEventGroup(group);
    });
    return (
      <div className="col-sm">
        {renderedMessages}
      </div>
    )
  }
}