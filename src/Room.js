import React from 'react';
import SyncedComponent from './SyncedComponent';
import NavBar from './NavBar';
import MessageList from './MessageList';
import TextEntry from './TextEntry';

export default class Room extends SyncedComponent {

  constructor(props) {
    super(props);
    const { location } = this.props;
    const roomId = location.pathname.substring(6);
    this.state = {
      roomId,
      room: null,
      timeline: [],
      scrollPos: null,
    }
  }

  componentDidMount() {
    super.componentDidMount();
    this.updateRoomState();
  }

  onSync(state) {
    if (state === 'SYNCING') {
      this.updateRoomState();
    }
  }

  updateRoomState(overrideScrollPos) {
    const { client } = this.props;
    const { roomId } = this.state;
    const room = client.getRoom(roomId);
    const timeline = room ? [...room.timeline] : [];
    const scrollPos = overrideScrollPos || this.state.scrollPos || (timeline.length > 0 ? timeline[timeline.length - 1].getId() : null);

    this.setState({
      room,
      timeline: room ? [...room.timeline] : [],
      scrollPos,
    });
  }

  onMessageSubmit(message) {
    this.setState({
      messageSending: true,
    });
    return this.props.client.client.sendMessage(this.state.roomId, {
      body: message,
      msgtype: 'm.text',
    }).then(() => {
      this.setState({
        messageSending: false,
      });
    }).catch((err) => {
      console.log('error sending message', err);
    });
  }

  scrollback({ scroll = true }) {
    const { timeline, room } = this.state;
    const firstMessage = timeline[0].getId();
    this.props.client.client.scrollback(room).then(() => {
      this.updateRoomState(scroll && firstMessage);
    });
  }

  render() {
    const { location, client } = this.props;
    const { roomId, room, timeline, scrollPos, messageSending } = this.state;
    const userId = client.client.getUserId();
    const readUpTo = scrollPos || room && room.getEventReadUpTo(userId);
    const crumb = {
      link: location.pathname,
      name: room ? room.name : roomId,
    }
    return (
      <div>
        <NavBar breadcrumbs={[crumb]} />
        <div className='row'>
          <button className="btn btn-outline-primary btn-sm btn-block" onClick={this.scrollback.bind(this)}
          >Load older messages</button>
        </div>
        <div className="row">
          <MessageList
            homeserver={client.client.getHomeserverUrl()}
            messages={timeline}
            currentUser={userId}
            scrollToMessage={readUpTo}
          />
        </div>
        <TextEntry
          placeHolder='Write something...'
          buttonText='Send'
          onSubmit={this.onMessageSubmit.bind(this)}
          disabled={messageSending} />
      </div>
    )
  }
}
