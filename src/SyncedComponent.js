import { Component } from 'react';

export default class SyncedComponent extends Component {
  constructor(props) {
    super(props);
    this.onSync = this.onSync.bind(this);
  }

  componentDidMount() {
    this.props.client.client.on('sync', this.onSync);
  }

  componentWillUnmount() {
    this.props.client.client.removeListener('sync', this.onSync);
  }
  
}