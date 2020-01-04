import Torrent from './torrent.js';

// TODO: gör en generell basklass med allt gemensamt
class Nyaa {
  constructor(id, search, ordering = "default") {
    this.id = id;
    this.search = search;
    this.ordering = ordering;
    this.page = 0;
    this.maxPage = 0;
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
    this.page += 1;
    const fetchingPage = this.page;

    await new Promise(r => setTimeout(r, 2000))

    return [new Torrent({url: fetchingPage})];
  }

  async fetchDetails(torrent) {
    if (torrent.hasDetails) {
      throw new Error("torrent already has details");
    }
    await new Promise(r => setTimeout(r, 2000))
    torrent.hasDetails = true;
    return torrent;
  }
}

export default Nyaa;
