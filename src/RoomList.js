import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

export default class RoomList extends Component {
  render() {
    const { rooms } = this.props;
    return (
      <div className="row">
        <div className="col-sm">
          { rooms.length === 0 && (<div className='alert alert-info'>You're not in any rooms yet!</div>)}
          <div className="list-group">
            { rooms.map((room) => {
              return <Link
                className="list-group-item list-group-item-action flex-column align-items-start"
                to={`/room/${room.roomId}`}
                key={room.roomId}
                >
                <div className="d-flex w-100 justify-content-between">
                  <img src={room.avatarUrl} style={{ width: '40px', height: '40px' }} alt=''/>
                  <div className='w-100' style={{ paddingLeft: '0.4rem' }}>
                    <h5 className="mb-1">{room.name}</h5>
                    <small>{moment(room.lastEvent).calendar(null, {
                        sameElse: 'DD/MM/YYYY'
                    })}</small>
                  </div>
                  { room.unreadCount > 0 && <span className="badge badge-primary badge-pill">{room.unreadCount}</span>}
                </div>
              </Link>
            })}
          </div>
        </div>
      </div>
    )
  }
}