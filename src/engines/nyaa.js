import Torrent from './torrent.js';

// TODO: gör en generell basklass med allt gemensamt
class Nyaa {
  constructor(id, search, ordering = "default") {
    this.id = id;
    this.search = search;
    this.ordering = ordering;
    this.page = 0;
    this.maxPage = null;
    this.baseUrl = "https://nyaa.si";
  }

  formatURL() {
    let u = new URL(this.baseUrl);
    let params = {
      q: this.search,
      p: this.page
    };
    const orderingParams = {
      newest: {o: "desc", s: "id"},
      oldest: {o: "asc", s: "id"},
      largest: {o: "desc", s: "size"},
      smallest: {o: "asc", s: "size"},
      seeders: {o: "desc", s: "seeders"},
      downloads: {o: "desc", s: "downloads"}
    }
    const p = orderingParams[this.ordering];
    if (p !== undefined) {
      Object.assign(params, p)
    }
    u.search = new URLSearchParams(params);
    return u;
  }

  getName() {
    return "Nyaa.si";
  }

  getID() {
    return this.id;
  }

  getSearch() {
    return this.search;
  }

  getOrdering() {
    return this.ordering;
  }

  getPage() {
    return this.page;
  }

  getMaxPage() {
    return this.maxPage;
  }

  async fetchNextPage() {
    if (this.maxPage !== null && this.page >= this.maxPage) {
      throw new Error("no more pages to fetch");
    }
    this.page += 1;
    const fetchingURL = this.formatURL();

    window.remote.getGlobal("shared").test = "hej";

    // TODO: stop reading dummy
    // let resp = await window.nfetch(fetchingURL);
    // if (!resp.ok) {
    //   console.error(resp);
    //   throw new Error(`fetch not ok for ${fetchingURL}`);
    // }
    // let text = await resp.text();
    let text = await window.fs.readFileSync("nyaa.html");
    await new Promise(r => setTimeout(r, 1000));

    let parser = new DOMParser();
    let doc = parser.parseFromString(text, 'text/html');

    if (this.maxPage === null) {
      const paginator = doc.getElementsByClassName("pagination");
      if (paginator.length === 0) {
        // there were no results
        this.maxPage = 0;
        this.page = 0;
        return [];
      }
      const cc = paginator[0].childElementCount;
      const last = paginator[0].children[cc - 2].innerText;
      this.maxPage = parseInt(last);
    }

    let trs = doc.getElementsByClassName("torrent-list")[0].lastElementChild.children;

    let torrents = [];
    for (const row of trs) {
      let info = {};
      info.category = row.children[0].firstElementChild.title;

      const col1 = row.children[1].lastElementChild;
      info.url = this.baseUrl + col1.getAttribute("href");
      info.name = col1.title;

      info.magnet = row.children[2].lastElementChild.href;
      info.size = row.children[3].innerText;
      info.date = parseInt(row.children[4].getAttribute("data-timestamp")) * 1000;
      info.seeders = row.children[5].innerText;
      info.leachers = row.children[6].innerText;
      info.downloads = row.children[7].innerText;

      torrents.push(new Torrent(info));
    }

    return torrents;
  }

  async fetchDetails(torrent) {
    if (torrent.hasDetails) {
      throw new Error("torrent already has details");
    }
    await new Promise(r => setTimeout(r, 2000))
    torrent.files = {};
    torrent.description = "hej";
    torrent.hasDetails = true;
    return torrent;
  }
}

export default Nyaa;
