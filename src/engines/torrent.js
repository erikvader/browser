class Torrent {
  constructor(args) {
    let defaults = {
      // general data
      name: null,
      magnet: null,
      url: null,
      seeders: null,
      leachers: null,
      date: null,
      downloads: null,
      category: null,
      size: null,

      // status variable, don't set this!
      fetching: false,

      // other data that can only be non-null if hasDetails is true
      hasDetails: false,
      description: null,
      files: null,
      comments: null,
    };
    Object.assign(this, defaults, args);

  }

  clone() {
    let t = new Torrent(this);
    // TODO: copy files och comments
    return t;
  }
}

export default Torrent;
