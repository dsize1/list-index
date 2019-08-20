import React, { Component, createRef, useRef, useState, useEffect } from 'react'
import { 
  fromEvent,
  merge
} from 'rxjs'
import { 
  debounceTime, 
  takeUntil,
  map,
  reduce,
  tap,
  concatMap
} from 'rxjs/operators'

import './index.css'

const IndexItem = ({value, scrollTo}) => {

  const floatFixed = (num, n = 2) => parseFloat((Math.round((10 ** n) * num) / (10 ** n)).toFixed(2)) 

  const getCoordinate = (dom, direction) => dom.getBoundingClientRect()[direction]

  const getCurrentCoordinate = (event) => {
    const coordinate = event.changedTouches[0]
    return {
      x: floatFixed(coordinate.clientX),
      y: floatFixed(coordinate.clientY)
    }
  }

  const getCurrentIndex = (wrapperTop) => (clientY) => {
    const offsetHeight = clientY - wrapperTop
    if (offsetHeight < 0) return 0
    if (offsetHeight > 60) return 3
    return Math.floor(offsetHeight / 20)
  }

  const el = useRef(null)

  useEffect(() => {
    const wrapper = document.querySelector('.test-index-wrapper')
    const wrapperTop = getCoordinate(wrapper, 'top')
    const getIndex = getCurrentIndex(wrapperTop)
    const touchStart$ = fromEvent(el.current, 'touchstart').pipe(
      map(getCurrentCoordinate)
    )

    const touchMove$ = fromEvent(el.current, 'touchmove').pipe(
      map((e) => {
        e.stopPropagation()
        e.stopImmediatePropagation()
        return getCurrentCoordinate(e)
      })
    )

    const touchEnd$ = fromEvent(window, 'touchend').pipe(
      map((e) => {
        console.log('touched')
        return getCurrentCoordinate(e)
      })
    )
    const touches$= touchStart$.pipe(
      tap(p => {
        console.log('start', getIndex(p.y))
        scrollTo(getIndex(p.y))
      }),
      concatMap(p => touchMove$.pipe(takeUntil(touchEnd$)))
    )
    touches$.subscribe(p => {
      console.log('touching', getIndex(p.y))
      scrollTo(getIndex(p.y))
    })
    return function cleanup() {
      touches$.unsubscribe()
    }
  }, [])

  return (
    <li
      ref={el}
      className={"test-index-item"}
    >{ value }</li>
  )
}

class TestIndexlist extends Component {
  constructor(props) {
    super(props)
    this.table = createRef()
  }

  componentDidMount() {

  }

  handleSrcollTo = (index) => {
    const table = this.table.current
    console.log(index * 80)
    table.scrollTop = index * 80 
  }

  render() {
    return (
      <div className={"test-index-list"}>
        <ul className={"test-index-wrapper"}>
          { ['a', 'b', 'c', 'd'].map((it, index) => (<IndexItem key={index} value={it} scrollTo={this.handleSrcollTo}/>)) }
        </ul>
        <ul className={"test-index-table"} ref={this.table}>
          <li>
            <div>a</div>
            <div>aa</div>
            <div>ab</div>
            <div>ac</div>
          </li>
          <li>
            <div>b</div>
            <div>ba</div>
            <div>bb</div>
            <div>bc</div>
          </li>
          <li>
            <div>c</div>
            <div>ca</div>
            <div>cb</div>
            <div>cc</div>
          </li>
          <li>
            <div>d</div>
            <div>da</div>
            <div>db</div>
            <div>dc</div>
          </li>
        </ul>
      </div>
    )
  }
}

export default TestIndexlist