import React from 'react';
import logo from './logo.svg';
import './App.css';

import IndexList from './indexlist'
import TestIndexlist from './testIndexlist'
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: ''
    }
  }

  render() {
    return (
      <div className="App">
        <input 
          type='text' 
          value={this.state.value}
          onChange={this.handleChange}
          onBlur={this.handleSubmit}
          onSubmit={this.handleSubmit}
        />
        {/* <IndexList searchValue={this.state.value}/> */}
        <TestIndexlist />
      </div>
    )
  }

  handleChange = (e) => {
    e && e.preventDefault()
    const value = e.target.value
    this.setState({
      value: value
    })
  }
}

export default App;
