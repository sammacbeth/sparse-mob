import matrixcs from 'matrix-js-sdk';

const CREDENTIALS_KEY = 'matrix_credentials';

function roomComparator(a, b) {
  const aCmp = a.lastEvent;
  const bCmp = b.lastEvent;

  if (!aCmp) {
    return 1;
  } else if (!bCmp) {
    return -1;
  }

  if (aCmp < bCmp) {
    return 1;
  } else if (aCmp === bCmp) {
    return 0;
  } else {
    return -1;
  }
}

export default class MatrixClient {

  constructor() {
    this._baseOptions = {
      timelineSupport: true,
      baseUrl: 'https://matrix.org',
    }
    this._createClient();
    this._onSync = this._onSync.bind(this);
  }

  _createClient() {
    if (this.client) {
      this.client.removeListener('sync', this._onSync);
    }
    this.client = matrixcs.createClient(this._baseOptions);
  }

  hasSavedCredentials() {
    return this._loadCredentials() !== null;
  }

  _saveCredentials(credentials) {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  }

  _loadCredentials() {
    const credJson = localStorage.getItem(CREDENTIALS_KEY);
    if (credJson === null) {
      return null;
    }
    return JSON.parse(credJson);
  }

  _processCredentialsFromHomeServer(resp) {
    return {
      homeserver: resp.home_server,
      userId: resp.user_id,
      accessToken: resp.access_token,
      deviceId: resp.device_id,
      baseUrl: `https://${resp.home_server}`,
    }
  }

  loginAsNewGuest() {
    return this.client.registerGuest().then((resp) => {
      const credentials = this._processCredentialsFromHomeServer(resp);
      this._saveCredentials(credentials);
      return this.startClientWithCredentials(credentials);
    });
  }

  login(user, pass, homeserver) {
    this._baseOptions.baseUrl = `https://${homeserver}`;
    return this._ensureStoreIsCleared().then(() => {
      this._createClient();
      return this.client.loginWithPassword(user, pass)
    }).then((resp) => {
      const credentials = this._processCredentialsFromHomeServer(resp);
      this._saveCredentials(credentials);
      return this.startClientWithCredentials(credentials);
    });
  }

  startClientWithCredentials(credentials) {
    this.client.removeListener('sync', this._onSync);
    this.hasSynced = false;
    return this._loadStore().then(() => {
      this.client = matrixcs.createClient(Object.assign(this._baseOptions, credentials));
      this.client.startClient();
      this.client.on('sync', this._onSync);
      return this.client;
    });
  }

  loginWithSavedCredentials() {
    if (!this.hasSavedCredentials()) {
      return Promise.reject('no saved credentials');
    }
    const credentials = this._loadCredentials();
    return this.startClientWithCredentials(credentials);
  }

  _onSync(state) {
    if (state === 'SYNCING') {
      if (!this.hasSynced) {
        this.hasSynced = true;
      }
    }
  }

  _loadStore() {
    if (!this.store) {
      this.store = new matrixcs.IndexedDBStore({ indexedDB });
      return this.store.startup().then(() => {
        this._baseOptions.store = this.store;
      }, () => {
        console.log('matrix', 'failed to load IndexedDBStore, falling back to memory only');
        this._baseOptions.store = undefined;
        this.brokenStore = true;
      });
    }
    return Promise.resolve();
  }

  _ensureStoreIsCleared() {
    const storePromise = !this.store ? this._loadStore() : Promise.resolve();
    if (this.brokenStore) {
      return Promise.resolve();
    }
    return storePromise.then(() => {
      return this.store.deleteAllData();
    });
  }

  _getPlainRoom(room) {
    const lastEvent = room.timeline[room.timeline.length - 1];
    const lastEventTs = lastEvent ? lastEvent.getTs() : null;
    return {
      roomId: room.roomId,
      name: room.name,
      avatarUrl: room.getAvatarUrl(this.client.getHomeserverUrl(), 40, 40, 'scale'),
      unreadCount: 0,
      lastEvent: lastEventTs
    }
  }

  getRooms() {
    const rooms = this.client.getRooms().map(this._getPlainRoom.bind(this));
    return rooms.sort(roomComparator);
  }

  getRoom(id) {
    return this.client.getRoom(id);
  }

  joinRoom(roomId) {
    return this.client.joinRoom(roomId, { syncRoom: true }).then((room) => {
      console.log(room);
    });
  }

  isLoggedIn() {
    return this.client.isLoggedIn();
  }

}
