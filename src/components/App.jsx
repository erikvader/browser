import React from 'react';
import styles from './App.module.css';
import SearchEngine from './SearchEngine';

function App() {
  return (
    <div className={styles.app}>
      <SearchEngine engine="nyaa" />
      <SearchEngine engine="1337x" />
    </div>
  );
}

export default App;
