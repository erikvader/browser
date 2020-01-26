import Torrent from './torrent.js';
import {sanitizeNode} from './utils.js';

// TODO: gör en generell basklass med allt gemensamt
class Nyaa {
  constructor(id, search, ordering = "default") {
    this.id = id;
    this.search = search;
    this.ordering = ordering;
    this.page = 0;
    this.maxPage = null;
    this.baseUrl = "https://nyaa.si";
    this.parser = new DOMParser();
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
    return "Nyaa";
  }

  getBackground() {
    return "cyan";
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

    // TODO: stop reading dummy
    // let resp = await window.nfetch(fetchingURL);
    // if (!resp.ok) {
    //   console.error(resp);
    //   throw new Error(`fetch not ok for ${fetchingURL}`);
    // }
    // let text = await resp.text();
    let text = window.fs.readFileSync("nyaa.html");
    await new Promise(r => setTimeout(r, 1000));

    let doc = this.parser.parseFromString(text, 'text/html');

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
      if (row.classList.contains("success")) {
        // green colored, ie trusted
        info.color = "rgb(60, 206, 0)"; // opacity 0.12 eller 0.18 på faktiska sidan
      } else if (row.classList.contains("danger")) {
        // orange colored, batch? reupload?
        // info.color = "rgb(208, 0, 0)";
        info.color = "#ff8000";
      }

      info.category = row.children[0].firstElementChild.title;

      const col1 = row.children[1].lastElementChild;
      info.url = col1.getAttribute("href");
      info.baseUrl = this.baseUrl
      info.name = col1.title;

      info.magnet = row.children[2].lastElementChild.href;
      info.size = row.children[3].innerText;
      info.date = parseInt(row.children[4].getAttribute("data-timestamp")) * 1000;
      info.seeders = row.children[5].innerText;
      info.leachers = row.children[6].innerText;
      info.downloads = row.children[7].innerText;

      info.engine = this.getName();
      info.seen = await window.hasSeen(info);

      torrents.push(new Torrent(info));
    }

    return torrents;
  }

  async fetchDetails(torrent) {
    if (torrent.hasDetails) {
      throw new Error("torrent already has details");
    }
    await new Promise(r => setTimeout(r, 2000))

    let text = window.fs.readFileSync("nyaa_view.html");
    let doc = this.parser.parseFromString(text, 'text/html');

    torrent.description = sanitizeNode(doc.getElementById("torrent-description").outerHTML);

    const rootfiles = doc.getElementsByClassName("torrent-file-list")[0].firstElementChild.children
    torrent.files = Array.from(rootfiles, li => this.extractFiles(li));

    torrent.uploader = doc.body.children[1].children[0].children[1].children[1].children[1].innerText;

    torrent.comments = this.extractComments(doc);

    torrent.hasDetails = true;
    return torrent;
  }

  extractFiles(li) {
    const children = li.childNodes;
    if (children.length === 5) {
      return {
        isFolder: true,
        name: children[1].childNodes[1].nodeValue.trim(),
        children: Array.from(children[3].children, x => this.extractFiles(x))
      };
    } else if (children.length === 3) {
      return {
        isFolder: false,
        name: children[1].nodeValue.trim(),
        size: children[2].innerText.slice(1, -1)
      };
    } else {
      throw new Error("wrong number of children while extracting files");
    }
  }

  extractComments(doc) {
    const comments = doc.getElementById("comments").lastElementChild;
    let asd = [];
    for (const c of comments.children) {
      let comm = {};
      const body = c.firstElementChild;
      comm.commenter = body.firstElementChild.firstElementChild.firstElementChild.innerText;
      comm.comment = body.lastElementChild.lastElementChild.firstElementChild.innerText;
      comm.date = parseInt(body.lastElementChild.firstElementChild.firstElementChild.firstElementChild.getAttribute("data-timestamp")) * 1000;
      asd.push(comm);
    }
    return asd;
  }

}

export default Nyaa;
