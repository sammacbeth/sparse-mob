import React, { Component } from 'react';
import { ChatList } from 'react-chat-elements';


export default class RoomList extends Component {
  render() {
    const { rooms, onRoomClicked } = this.props;
    return (
      <div className='row'>
        <ChatList
          className='col-sm'
          dataSource={
            rooms.map((room) => {
              const lastMessageContent = room.lastMessage ?
                <span>
                  {room.lastMessage.sender.name}:&nbsp;
                  {room.lastMessage.getContent().body.substring(0, 100)}
                </span> : '';
              return {
                roomId: room.roomId,
                avatar: room.avatarUrl,
                title: room.name,
                subtitle: lastMessageContent,
                date: room.lastMessage ? room.lastMessage.getTs() : room.lastEvent,
                unread: room.unreadCount,
                statusColor: room.notifications > 0 ? 'red' : undefined,
              }
            })
          }
          onClick={(room) => onRoomClicked(room.roomId)}
        />
      </div>
    )
  }
}