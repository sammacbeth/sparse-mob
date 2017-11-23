import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { MessageList as ChatMessageList } from 'react-chat-elements';
import { ContentRepo } from 'matrix-js-sdk';

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
    const ts = new Date(event.getTs());

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
    return [{
      type: 'system',
      text: body,
      date: ts,
    }]
  }

  _renderMembershipMessage(group) {
    const lastEvent = group.events[group.events.length - 1];
    const ts = new Date(lastEvent.getTs());
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
    return [{
      type: 'system',
      text: memberMessages.join('; '),
      date: ts,
    }]
  }

  _renderMessage(event, events) {
    const sender = event.sender ? event.sender.name : event.getSender();
    const mine = this.props.currentUser === event.sender.userId;
    return events.map((event, i) => {
      const spec = {
        position: mine ? 'right': 'left',        
        avatar: i === 0 && event.sender && event.sender.getAvatarUrl(this.props.homeserver, 25, 25, 'crop'),
        date: new Date(event.getTs()),
        title: i === 0 && sender,        
      }
      const content = event.getContent();
      const msgtype = content.msgtype;
      if (msgtype === 'm.image') {
        const maxWidth = 300
        let { w, h } = content.info;
        if (w > maxWidth) {
          h = Math.floor(h * (maxWidth / w))
          w = maxWidth;
        }
        spec.type = 'photo';
        spec.data = {
          width: w,
          height: h,
          uri: ContentRepo.getHttpUriForMxc(this.props.homeserver, content.url, w, h, 'scale')
        };
      } else {
        spec.type = 'text';
        spec.text = content.body;
      }
      return spec;
    });
  }

  _renderEventGroup(group) {
    if (group.type === 'm.room.message') {
      return this._renderMessage(group.events[group.events.length - 1], group.events);
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
    const renderedMessages = messageGroups.reduce((list, group) => {
      return list.concat(this._renderEventGroup(group));
    }, []);
    return (
      <ChatMessageList
        className="col-sm" 
        lockable={true}
        dataSource={renderedMessages}
      />
    )
  }
}