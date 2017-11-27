import React from 'react';
import SyncedComponent from './SyncedComponent';
import RoomList from './RoomList';
import NavBar from './NavBar';
import TextEntry from './TextEntry';

export default class Overview extends SyncedComponent {

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (this.props.client.hasSynced) {
      this.getRoomList();
    }
    super.componentDidMount();
  }

  onSync(state, prevState, data) {
    if (state === 'SYNCING') {
      this.getRoomList();
    }
  }

  getRoomList() {
    const rooms = this.props.client.getRooms();
    this.setState({ rooms });
  }

  joinRoom(roomId) {
    return this.props.client.joinRoom(roomId)
    .then(() => {
      this.getRoomList()
    }, (err) => {
      console.log('room join error', err);
      this.setState( { error: err.message });
    });
  }

  render() {
    const { history } = this.props;
    const { rooms, error } = this.state;
    let content;
    if (rooms) {
      content = (<RoomList rooms={rooms} onRoomClicked={(roomId) => history.push(`/room/${roomId}`)}/>);
    } else {
      content = (<div className='alert alert-info'>Fetching room list...</div>)
    }
    return (
      <div>
        <NavBar breadcrumbs={[]} />
        { error && (<div className='alert alert-danger'>{error}</div>)}
        {content}
        <TextEntry
          buttonText='Join'
          placeHolder='#matrix:matrix.org'
          onSubmit={this.joinRoom.bind(this)}
        />
      </div>
    )
  }
}