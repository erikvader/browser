import React from 'react';
import styles from './App.module.css';
import SearchEngine from './SearchEngine';
import Nyaa from '../engines/nyaa.js';
import ErrorDisplay from './ErrorDisplay';
import { BeatLoader } from 'react-spinners';

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
      search: "a", // TODO: remove this
      selectedEng: "nyaa.si",
      delugeLatest: null,
      fileIndexButtonPressed: false,
    };
    this.indexRebuiltEvent = new Event("fileIndexRebuilt");
  }

  setDelugeLatest(latest) {
    this.setState({delugeLatest: latest});
  }

  searchChanged(event) {
    this.setState({search: event.target.value});
  }

  selectedEngChanged(event) {
    this.setState({selectedEng: event.target.value});
  }

  handleKey(event) {
    if (event.key === "Enter") {
      this.doSearch();
    }
  }

  async fileIndexPressed(event) {
    this.setState({fileIndexButtonPressed: true});
    await window.rebuildIndex();
    this.setState({fileIndexButtonPressed: false});
    window.dispatchEvent(this.indexRebuiltEvent);
  }

  // TODO: remove this
  componentDidMount() {
    this.doSearch();
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
      <ErrorDisplay>
        {
          showError =>
            <div className={styles.app}>
              <div>
                <select value={this.state.selectedEng} onChange={this.selectedEngChanged.bind(this)}>
                  {Object.entries(this.allEngines)
                   .map((name, e) => <option value={name} key={name}>{name}</option>)}
                </select>
                <input
                  type="text" value={this.state.search}
                  onChange={this.searchChanged.bind(this)}
                  onKeyDown={this.handleKey.bind(this)}
                />
                <button onClick={this.doSearch.bind(this)}>search</button>
                {this.state.fileIndexButtonPressed ?
                 <BeatLoader size={7}/>
                 :
                 <button onClick={this.fileIndexPressed.bind(this)}>Rebuild file index</button>
                }
              </div>
              <div>
                {this.state.engines.map(e => <SearchEngine
                                               engine={e}
                                               key={e.getID()}
                                               showError={showError}
                                               deluge={{latest: this.state.delugeLatest,
                                                        set: this.setDelugeLatest.bind(this)}}
                                             />)}
              </div>
            </div>
        }
      </ErrorDisplay>
    );
  }
}

export default App;
