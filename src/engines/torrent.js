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
      color: null,

      // status variable, don't set this!
      fetching: false,

      // whether we can fetch more general data or not
      hasDetails: false,

      // set from file, don't set!
      seenMagnet: null,
      seenUrl: null,
      seenFiles: null,
    };
    Object.assign(this, defaults, args);
    this.fillSeen();
    this.fillSeenFiles();
  }

  hasSeen() {
    return this.seenMagnet !== null && this.seenUrl !== null;
  }

  fillSeen() {
    const asd = window.hasSeen(this);
    this.seenMagnet = asd.magnet;
    this.seenUrl = asd.url;
  }

  hasSeenFiles() {
    return this.seenFiles !== null;
  }

  fillSeenFiles() {
    if (this.files !== null) {
      let res = {};
      function walk(path, f) {
        if (f.isDir) {
          walk(path + f.name + "/");
        } else {
          const locs = window.hasSeenFile(f.name);
          if (locs.length !== 0) {
            res[path + f.name] = locs;
          }
        }
      }
      for (const r of this.files) {
        walk("/", r);
      }
      this.seenFiles = res;
    }
  }

  clone() {
    let t = new Torrent(this);
    // TODO: copy files och comments
    return t;
  }
}

export default Torrent;
