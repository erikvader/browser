const DelugeRPC = require('@ctrl/deluge').Deluge;

class Deluge {
  constructor() {
    this.rpc = null;
    this.lastPromise = Promise.resolve();
  }

  async _download(magnet, dir) {
    await this._connect();
    const res = await this.rpc.addTorrentMagnet(magnet, {download_location: dir});
    if (!res.result) {
      throw new Error("addTorrentMagnet: " + res.error);
    }
    return true;
  }

  download(magnet, dir) {
    const asd = this.lastPromise.then(() => this._download(magnet, dir));
    this.lastPromise = asd.catch(() => {});
    return asd;
  }

  async _connect() {
    if (this.rpc !== null) {
      return;
    }
    try {
      this.rpc = new DelugeRPC({
        baseUrl: 'http://127.0.0.1:8112/',
        password: 'abc123'
      });
    } catch (e) {
      this.rpc = null;
      throw e;
    }
  }
}

module.exports = {Deluge};
