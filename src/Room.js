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
    }
    this.roomIsReady = false;
    this.scrollbackLimit = 5;
  }

  componentDidMount() {
    super.componentDidMount();
    this.updateRoomState();
  }

  componentDidUpdate() {
    if (this.doScrollTo && this.messageList) {
      this.messageList.scrollToMessage(this.doScrollTo);
      this.doScrollTo = null;
    }
  }

  onSync(state) {
    if (state === 'SYNCING') {
      this.updateRoomState();
    }
  }

  updateRoomState() {
    const { client } = this.props;
    const { roomId } = this.state;
    const room = client.getRoom(roomId);
    const userId = client.client.getUserId();
    const timeline = room ? [...room.timeline] : [];
    const roomLoaded = room && timeline.length > 0;

    this.setState({
      room,
      timeline: room ? [...room.timeline] : [],
    });

    if (roomLoaded && !this.roomIsReady) {
      const readUpTo = room.getEventReadUpTo(userId);
      const readMessageInTimeline = timeline.findIndex((e) => e.getId() !== readUpTo) !== -1;
      const shouldLoadMore = this.scrollbackLimit > 0 && (timeline.length < 20 || !readMessageInTimeline);
      if (shouldLoadMore) {
        this.scrollbackLimit -= 1;
        // we need more messages - either because there are too few, or because we didn't get to the last read message yet
        client.client.scrollback(room).then(() => {
          this.updateRoomState();
        });
      }
      // if the message is in the timeline, lets scroll to it
      if (readMessageInTimeline) {
        console.log('xxx', 'set scroll to', readUpTo)
        this.doScrollTo = readUpTo;
      }
      if (!shouldLoadMore) {
        this.roomIsReady = true;
      }
    }
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
    const { roomId, room, timeline, messageSending } = this.state;
    const userId = client.client.getUserId();
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
            ref={(ref) => this.messageList = ref}
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
