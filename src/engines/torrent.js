class Torrent {
  constructor(args) {
    let defaults = {
      name: null,
      magnet: null,
      description: null,
      url: null,
      seeders: null,
      leachers: null,
      date: null,
      downloads: null,
      category: null,
      hasDetails: false,
      size: null,
    };
    Object.assign(this, defaults, args);
    this.fetching = false;
  }

  clone() {
    let t = new Torrent(this);
    t.fetching = this.fetching;
    return t;
  }
}

export default Torrent;
