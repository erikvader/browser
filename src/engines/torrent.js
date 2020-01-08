class Torrent {
  constructor(args) {
    let defaults = {
      // general data
      name: null,
      magnet: null,
      url: null,      // /dir/asd?a=5&b=3
      baseUrl: null,  // http://website.com
      engine: null,   // website
      seeders: null,
      leachers: null,
      date: null,
      downloads: null,
      category: null,
      size: null,
      description: null,
      files: null,
      comments: null,
      uploader: null,

      // status variable, don't set this!
      fetching: false,

      // whether we can fetch more general data or not
      hasDetails: false,

      // set from file, don't set!
      seen: false,
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
