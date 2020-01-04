import React from 'react';
import styles from './App.module.css';
import SearchEngine from './SearchEngine';
import Nyaa from '../engines/nyaa.js';

// TODO: add a select for ordering
class App extends React.Component {
  constructor(props) {
    super(props);
    this.allEngines = {
      "nyaa.si": Nyaa,
      "1337x.to": null,
      "rarbg.to": null
    };
    this.state = {
      engines: [],
      engineID: 0,
      search: "",
      selectedEng: "nyaa.si"
    };
  }

  searchChanged(event) {
    this.setState({search: event.target.value});
  }

  selectedEngChanged(event) {
    this.setState({selectedEng: event.target.value});
  }

  doSearch(event) {
    if (this.state.search.length > 0) {
      this.setState(prev => ({
        engines: [...prev.engines, new this.allEngines[prev.selectedEng](prev.engineID, prev.search)],
        engineID: prev.engineID + 1
      }));
    }
  }

  render() {
    return (
      <div className={styles.app}>
        <div>
          <select value={this.state.selectedEng} onChange={this.selectedEngChanged.bind(this)}>
            {Object.entries(this.allEngines)
             .map((name, e) => <option value={name} key={name}>{name}</option>)}
          </select>
          <input type="text" value={this.state.search} onChange={this.searchChanged.bind(this)} />
          <button onClick={this.doSearch.bind(this)}>search</button>
        </div>
        <div>
          {this.state.engines.map(e => <SearchEngine engine={e} key={e.getID()} />)}
        </div>
      </div>
    );
  }
}

export default App;
