import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import './indexlist.css'

import { list } from '../assets/citylist'

import { 
  fromEvent
} from 'rxjs'

const editDistance = (str1, str2) => {
  const len1 = str1.length
  const len2 = str2.length


  const logMix = (mix) => {
    
    let createLine = () => {
      let line = []
      const space = (n = 1) => new Array(n).fill('&ensp;').join('')
      const initLine = () => line = []
      const pushLine = (ch = space(1)) => line.push(ch + space(3))
      const logLine = () => {
        document.write(`<div>${line.join('')}</div>`)
        initLine()
      }
      return {
        logLine,
        pushLine
      } 
    }

    const { logLine, pushLine } = createLine()

    for (let i = 0; i <= len1 + 1; i++) {
      if (len1 < 2) {
        pushLine()
      }
      pushLine(str1[i - 2])
    }
    logLine()

    for (let j = 0; j <= len2; j++) {
      if (j == 0) {
        pushLine()
      } else {
        pushLine(str2[j - 1])
      }
      for (let i = 0; i <= len1; i++) {
        pushLine(mix[i][j])
      }
      logLine()
    }
  }

  const initializeMix = (l1, l2) => {
    const arr = new Array(l1+1)
      .fill(0)
      .map(it => new Array(l2+1))

    for (let i = 0; i <= l1; i++) {
      arr[i][0] = i
    }
    for (let j =0; j <= l2; j++) {
      arr[0][j] = j
      
    }
    return arr
  }

  const getMinEditDistance = (mix) => {
    for (let i = 1; i <= len1; i++) 
      for (let j = 1; j <= len2; j++) {
        let t = str1[i - 1] === str2[j - 1] ? 0 : 1
        // del: mix[i-1][j]; inc: mix[i][j-1]; sub: sum(mix[i-1][j-1], str1[i-1] == str2[j-1]
        mix[i][j] = Math.min(mix[i - 1][j] + 1, mix[i][j - 1] + 1, mix[i - 1][j - 1] + t)
      }
    return mix[len1][len2]
  }

  const getSimilarity = (minEditDis) => 1 - minEditDis / Math.max(len1, len2)

  const mix = initializeMix(len1, len2)
  //log initial mix
  //logMix(mix)
  
  const minEditDis = getMinEditDistance(mix)
  //log result
  // logMix(mix)

  const similarity = getSimilarity(minEditDis)

  return {
    minEditDis,
    similarity
  }
}

const transformData = (genSectionIndex, genSortKey, indexHeight, itemHeight) => (list) => {

  const data = [...list]

  //字符串比较函数
  const compareString = (a, b) => {
    const compare = (ch1, ch2) => {
      return !(ch1.charCodeAt() > ch2.charCodeAt())  
    }
    const len1 = a.length
    const len2 = b.length
    const len = len1 <= len2 ? len1 : len2
    for(let i = 0; i < len; i++) {
      if (a[i] === b[i]) {
        continue;
      }
      if (compare(a[i], b[i])) {
        return -1
      } else {
        return 1
      }
    }
    return len1 <= len2 ? -1 : 1
  }

  //step1: 通过组件调用者传入的字段生成函数映射成所需的数据
  //step2: 排序
  //step3: 数据分类
  return data.map((item) => ({
      ...item,
      sectionIndex: genSectionIndex(item),
      sortedKey: genSortKey(item)
    }))
    .sort((a, b) => compareString(a.sortedKey, b.sortedKey))
    .reduce(({data, height}, item) => {
      const { sectionIndex } = item
      let top = data.length - 1
      if (!data[top] || data[top].sectionIndex !== sectionIndex) {
        top += 1
        data[top] = {
          sectionIndex: sectionIndex,
          sectionHeight: height,
          list: [],
        }
        height += indexHeight
      }
      item.itemHeight = height
      data[top]['list'].push(item)
      height += itemHeight
      return {
        data: data,
        height: height
      }
    }, {
      data: [],
      height: 0
    })
}

class IndexList extends Component {
  constructor(props) {
    super(props) 
    this.listRef = React.createRef()
    this.displayRef = React.createRef()
    this.indexlistRef = React.createRef()
    this.state = {
      data: [],
      currentIndex: '',
      isScrolling: false,
      totalHeight: 0,
      paddingBottom: 0,
      paddingTop: 0
    }

    this.headerRef = createRef()
    this.handleScroll = debounce(this.handleScroll, 500)

    this.wrapOverFlow = this.isHTMLDocument(this.props.onScrollWrap)
      ? {}
      : {overFlow: 'scroll'}
    this.transformData = transformData(this.props.genSectionIndex, this.props.genSortKey, this.props.indexHeight, this.props.itemHeight)
  }

  componentDidMount() {
    const { data, height } = this.transformData(this.props.data)
    // console.log(data)
    this.setState({
      data: data,
      totalHeight: height
    })
    var scrollWrap
    if (this.isHTMLDocument(this.props.onScrollWrap)) {
      scrollWrap = this.props.onScrollWrap
      this.bodyOverFlow = 'hidden'
      this.bodyHeight = '100%'
    } else {
      scrollWrap = document.querySelector('.indexlist-body')
      this.bodyOverFlow = 'scroll'
      this.bodyHeight = this.props.bodyHeight + 'px'
    }
    scrollWrap.addEventListener('scroll', this.handleScroll)

    this.touchMove$ = fromEvent(this.indexlistRef.current, 'touchmove')
    this.touchStart$ = fromEvent(this.indexlistRef.current, 'touchstart')
    this.touchEnd$ = fromEvent(this.indexlistRef.current, 'touchend')

    this.touchMove$.subscribe(e => {
      e.stopPropagation()
      
      const target = e.target
      const classList = Array.from(target.classList)
      // console.log(e)
      if (classList.indexOf('indexlist-indexItem') !== -1){
        // console.log(target.dataset && target.dataset.height)
        
      }
      
    })

    this.touchStart$.subscribe(e => {
      // e.preventDefault()
      console.log('start', e)
    })
    this.touchEnd$.subscribe(e => {
      e.preventDefault()
      console.log('end', e)
    })
  }

  componentWillUnmount() {

    this.scrollWrap.removeEventListener('scroll', this.handleScroll)

    //clearUP
    this.touchMove$.unsubscribe()
    this.touchStart$.unsubscribe()
  }

  render() {
    const value = this.props.searchValue
    if (value === '') {
      return this.commonRender()
    } else {
      return this.editDisRender(value)
    }
  }

  editDisRender = (value) => {
    const editDisFunc = editDistance.bind(null, value)
    const { 
      renderHeader,
      renderFooter,
      renderItem,
    } = this.props
    const {
      data,
    } = this.state
    const similarData = data.reduce((result, section) => {
      const  { list } = section
      const newList = list.map((item) => {
        const name = item.name
        const {
          minEditDis,
          similarity
        } = editDisFunc(name)
        item.minEditDis = minEditDis
        item.similarity = similarity
        return item
      })
      return [...result, ...newList]
    }, [])
      .sort((a, b) => b.similarity - a.similarity)
      .filter((item) => item.similarity > 0)
    return (
      <>
        <div 
          className='indexlist-wrap'
          style={this.wrapOverFlow}
        >
          { renderHeader() }
          <div 
            className='indexlist-body'
          >
            { similarData.map((item, id) => renderItem(item, id)) }
          </div>
          { renderFooter() }
        </div>
      </>
    )
  }

  commonRender = () => {

    const { 
      renderHeader,
      renderFooter,
      renderItem,
      renderSection,
      renderIndex,
      onSelect,
    } = this.props
    const {
      data,
      currentIndex,
      display,
      upperLimit,
      lowerLimit
    } = this.state
    const hidden = display ? '' : 'hidden'
    // console.log(data)
    return (
      <>
        <div 
          className='indexlist-wrap'
          style={this.wrapOverFlow}
        >
          { renderHeader() }
          <div 
            className='indexlist-body'
            ref={this.listRef}
            style={{
              height: `${this.bodyHeight}`,
              overflow: `${this.bodyOverFlow}` 
            }}
          >
            <div
              style={{paddingTop: `${this.state.paddingTop}px`}}
            >
            </div>
            { data.map(({ sectionIndex, sectionHeight, list }) => renderSection(sectionIndex, sectionHeight, list, renderItem, onSelect, upperLimit, lowerLimit)) }
          </div>
          { renderFooter() }
        </div>
        <div
          className='indexlist-index'
          ref={this.indexlistRef}
        >
          <div>索引</div>
          { data.map(({sectionIndex, sectionHeight}) => renderIndex(sectionIndex, sectionHeight, this.handleClick)) }
        </div>
        <div
          className={`indexlist-display ${hidden}`}
        > 
          { currentIndex }
        </div>
      </>
    )
  }

  //判断dom
  isHTMLDocument = (dom) => {
    const r = new RegExp(/(?=HTML)(.)+(?<=Element)/)
    return r.test(Object.prototype.toString.call(dom))
  }

  handleSelect = (e) => {
    const target = e.target
    let value = target.dataset && target.dataset.value
    this.props.onSelect(value)
  }

  handleClick = (e) => {
    e.preventDefault()
    if (this.state.isScrolling) {
      return 
    }
    const target = e.target
    let height= target.dataset && target.dataset.height
    const value = target.dataset && target.innerText
    height = Number.parseInt(height)
    console.log(height, value)
    this.setState({
      currentIndex: value,
      isScrolling: true,
      upperLimit: 0,
      lowerLimit: this.state.totalHeight,
      paddingBottom: 0,
      paddingTop: 0,
    })
    let scrollWrap
    if (this.isHTMLDocument(this.props.onScrollWrap)) {
      scrollWrap = this.props.onScrollWrap
    } else {
      scrollWrap = document.querySelector('.indexlist-body')
    }
    scrollWrap.scrollTo(0, height + this.props.offsetHeight || 0)
    setTimeout(() => {
      this.setState({
        isScrolling: false
      })
    }, 1000)
  }

  handleScroll = (e) => {
    e && e.preventDefault()
    if (this.state.isScrolling) {
      return 
    }
    // debugger;
    const scrollTop = Math.floor(e.target.scrollTop)
    // todo virtual scroll
    const upperLimit = scrollTop - 4 * 10 * this.props.itemHeight
    const lowerLimit = scrollTop + 5 * 10 * this.props.itemHeight
    console.log(upperLimit, lowerLimit)
    this.setState( (prevState) => {
      
      return {
        isScrolling: true,
        upperLimit: upperLimit,
        lowerLimit: lowerLimit,
        paddingTop: upperLimit >= 0 ? upperLimit : 0,
        paddingBottom: prevState.totalHeight > lowerLimit ? prevState.totalHeight - lowerLimit : 0 
      }
    })
    setTimeout(() => {
      this.setState({
        isScrolling: false
      })
    }, 1000)
  }
}

//   binarySearchIndex = (h) => {
    
//     const search = (r, l) => {
//       const comparedIndex = Math.floor((l + r) * 0.5)
//       const {value, height: height_l} = this.state.data.indexList[comparedIndex]
//       const {height: height_h} = comparedIndex === this.state.data.indexList.length - 1 ? this.state.data.height : this.state.data.indexList[comparedIndex + 1]
//       if (h < height_l) {
//         return search(r, comparedIndex)
//       } else if (h > height_h) {
//         return search(comparedIndex, l)
//       } else {
//         return value
//       }
//     }
    
//     return search(0, this.state.data.indexList.length - 1)
//   }

// }

IndexList.defaultProps = {
  data: list,
  onSelect: (...args) => {console.log(...args)},
  indexHeight: 40,
  itemHeight: 40,
  offsetHeight: 0,
  bodyHeight: 400,
  genSortKey: (item) => item['pinyin'],
  genSectionIndex: (item) => item['pinyin'][0].toUpperCase(),
  renderHeader: () => (<header>header</header>),
  renderFooter: () => (<footer>footer</footer>),
  renderIndex: (sectionID, sectionHeight, handleClick) => {
    return (
      <div
        key={sectionID}
        className={'indexlist-indexItem'}
        data-height={sectionHeight}
        onClick={handleClick}
      >
        { sectionID }
      </div>
    )
    
  },
  renderSection: (sectionID, sectionHeight, list, renderItem, onSelect, upperLimit, lowerLimit) => {
    if (sectionHeight < upperLimit
      || sectionHeight > lowerLimit) {
        return null
      }
    return (
      <div
        key={sectionID}
      >
        <div
          className={'indexlist-section'} 
          data-height={sectionHeight}
        >
          { sectionID }
        </div>
        { list.map((item, id) => renderItem(item, id, onSelect)) }
      </div>
    )
  },
  renderItem: ({pinyin, name, itemHeight}, id, onSelect, upperLimit, lowerLimit) => {
    if (itemHeight < upperLimit
      || itemHeight > lowerLimit) {
        return null
      }
    return (
      <div
        data-height={itemHeight}
        className={'indexlist-item'}
        key={`${pinyin}_${id}`}
        data-index={pinyin}
        onClick={() => onSelect(name)}
      >
        { name }
      </div>
    )
  }
}

IndexList.propTypes = {
  data: PropTypes.array,
  onSelect: PropTypes.func,
  indexHeight: PropTypes.number,
  itemHeight: PropTypes.number,
  offsetHeight: PropTypes.number,
  bodyHeight: PropTypes.number,
  genSectionIndex: PropTypes.func,
  genSortKey: PropTypes.func,
  renderFooter: PropTypes.func,
  renderHeader: PropTypes.func,
  onScrollWrap: PropTypes.element,
  searchValue: PropTypes.string,
}

export default IndexList
