import axios from "axios"

const GetPostsByRangeApiURL = `https://weibo.com/ajax/statuses/searchProfile`
const GetLongTextURL = `https://weibo.com/ajax/statuses/longtext`

let page = 1
let total = 0
let count = 0
let loadMore = true
let _uid
let _sourceType = 1
let speechlessListEL

let _callback

// 拉取间隔时间
let interval = 1000

// 上一次拉取时间
let lastFetchTimeStamp = 0

const delay = function (timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout)
  })
}

// 每添加一个卡片，就要更新一次页面的状态
const updateWholePageState = function () {
  window.scrollTo(0, document.body.scrollHeight)
  count++
  _callback({
    type: "count",
    value: count,
  })
}

// 把页面上的其他元素移除，并且初始化挂载节点
const generateHTML = function () {
  document.getElementById("app").remove()
  speechlessListEL = document.createElement("div")
  speechlessListEL.classList = "speechless-list speechless-list-small"
  document.body.append(speechlessListEL)
}

const appendSpeechless = function () {
  let dateString = getDate(new Date())
  let speechlessHtml = `
   ${dateString} 使用 <a href="https://speechless.fun" target="_blank">&hearts; Speechless</a> 导出
  `
  let node = document.createElement("div")
  node.className = "speechless-corpyright"
  node.innerHTML = speechlessHtml
  speechlessListEL.appendChild(node)
}

// 格式化时间
const getDate = function (dateString, showSecond) {
  let date = new Date(dateString)
  let hour = date.getHours()
  let minute = date.getMinutes()
  let second = date.getSeconds()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()

  let fillWithZero = function (num) {
    if (parseInt(num) < 10) {
      return "0" + num.toString()
    } else return num.toString()
  }
  return (
    year +
    "/" +
    fillWithZero(month) +
    "/" +
    fillWithZero(day) +
    " " +
    fillWithZero(hour) +
    ":" +
    fillWithZero(minute) +
    (showSecond ? ":" + fillWithZero(second) : "")
  )
}

// 过滤多余的换行
const clearLineBreak = function (text) {
  let textClear = text.replace(/\n/g, "<br/>")
  textClear = textClear.replace(/(<br\s?\/>){3,}/g, "<br/><br/>")
  return textClear
}

const combineImageHtml = function (image, size) {
  let str
  if (!size) size = 120

  if (image.width > 0 && image.height > 0) {
    str = `<div class="image-container" style="width:${
      (image.width * size) / image.height
    }px;flex-grow:${
      (image.width * size) / image.height
    }"><i class="image-placeholder" style="padding-bottom:${
      (image.height / image.width) * 100
    }%"></i><img class="image-new" src="${image.url}" /></div>`
  } else {
    str = `<img class="image-old" style="height:${size}px" src="${image.url}" />`
  }

  return str
}

// 把卡片添加到页面中
const appendPostToBody = function (post) {
  if (_sourceType == 1 && (post.retweeted_status || post.user.id != _uid)) {
  } else {
    let metaHTML = ""

    metaHTML += `<div class="meta">
                <div class="meta-info">
                    <span class="date">${getDate(post.created_at)}</span>`
    if (post.region_name) {
      metaHTML += `<div class="region">${post.region_name.replace(
        "发布于 ",
        ""
      )}</div>`
    }
    metaHTML += `</div></div>`

    let textHTML = `<div class="text">${clearLineBreak(
      post.long_text_source || post.text || post.page_info?.page_title
    )}</div>`

    let retweetHTML = ""
    if (post.retweeted_status && post.retweeted_status.user) {
      retweetHTML += `<div class="retweet">`
      retweetHTML += `${
        post.retweeted_status.user.screen_name
          ? post.retweeted_status.user.screen_name
          : ""
      }<span style="margin:0 3px;">:</span>${clearLineBreak(
        post.retweeted_status.long_text_source || post.retweeted_status.text
      )}`
      retweetHTML += `</div>`
    }

    let mediaHTML = ""

    if (post.pic_infos) {
      mediaHTML += '<div class="media media-small">'
      for (let key in post.pic_infos) {
        mediaHTML += combineImageHtml(post.pic_infos[key].large, 160)
      }
      mediaHTML += "</div>"

      mediaHTML += '<div class="media media-medium">'
      for (let key in post.pic_infos) {
        mediaHTML += combineImageHtml(post.pic_infos[key].large, 320)
      }
      mediaHTML += "</div>"

      mediaHTML += '<div class="media media-large">'
      for (let key in post.pic_infos) {
        mediaHTML += combineImageHtml(post.pic_infos[key].large, 500)
      }
      mediaHTML += "</div>"
    }

    let postHTML = `
        ${metaHTML}
        <div class="main">
        ${textHTML}
        ${retweetHTML}
        ${mediaHTML}            
        </div>`

    let node = document.createElement("div")
    node.className = "speechless-post"
    node.innerHTML = postHTML

    speechlessListEL.appendChild(node)
  }

  updateWholePageState()
}
const fetchWithRetry = async function (
  GetPostsByRangeApiURL,
  parameters,
  retries = 3
) {
  while (retries > 0) {
    try {
      const response = await axios.get(GetPostsByRangeApiURL, parameters)
      return response
    } catch (error) {
      console.error(`Fetch failed, ${retries - 1} retries left: `, error)
      retries--
    }
  }
  throw new Error("Maximum retries reached, request failed")
}

// 拉取数据，并且格式化
const doFetch = async function (parameters) {
  if (!parameters) parameters = {}

  let offset = parseInt(new Date().valueOf()) - lastFetchTimeStamp
  if (offset < interval) {
    let delayMS = interval - offset
    console.log(`Delay of ${delayMS} milliseconds`)
    await delay(delayMS)
  }

  lastFetchTimeStamp = parseInt(new Date().getTime())
  const fetchResp = await fetchWithRetry(GetPostsByRangeApiURL, {
    params: parameters,
  })

  try {
    let resp = fetchResp.data.data
    let list = resp.list
    _callback({
      type: "total",
      value: resp.total,
    })
    await formatPosts(list, parameters.uid)
    return resp
  } catch (err) {
    console.error(err)
    return
  }
}

// 处理每一批的列表
const formatPosts = async function (posts, uid) {
  let _list = []

  for (let post of posts) {
    if (post.user.id != uid) continue
    if (!!post.isLongText) {
      try {
        let offset = parseInt(new Date().valueOf()) - lastFetchTimeStamp
        if (offset < interval) {
          let delayMS = interval - offset
          console.log(`Delay of ${delayMS} milliseconds`)
          await delay(delayMS)
        }
        lastFetchTimeStamp = parseInt(new Date().getTime())
        let longtextData = await fetchLongText(post.mblogid)
        post.long_text_source = longtextData.longTextContent || ""
        console.log(post)
      } catch (err) {
        console.error(err)
      }
    }
    if (post.retweeted_status && post.retweeted_status.isLongText) {
      try {
        let offset = parseInt(new Date().valueOf()) - lastFetchTimeStamp
        if (offset < interval) {
          let delayMS = interval - offset
          console.log(`Delay of ${delayMS} milliseconds`)
          await delay(delayMS)
        }
        let longtextData = await fetchLongText(post.retweeted_status.mblogid)
        post.retweeted_status.long_text_source =
          longtextData.longTextContent || ""
      } catch (err) {
        console.error(err)
      }
    }
    appendPostToBody(post)
    _list.push(post)
  }

  return _list
}

function getLastDayTimestamp(obj) {
  let { year, month } = obj
  const nextMonth = parseInt(month) + 1
  const nextMonthFirstDay = new Date(year, nextMonth - 1, 1)
  nextMonthFirstDay.setHours(0, 0, 0, 0)
  const lastDayTimestamp = nextMonthFirstDay.getTime() - 1
  const stamp = Math.floor(lastDayTimestamp / 1000)
  return stamp
}

function getFirstDayTimestamp(obj) {
  let { year, month } = obj
  const firstDay = new Date(year, parseInt(month) - 1, 1)
  firstDay.setHours(0, 0, 0, 0)
  const firstDayTimestamp = firstDay.getTime()
  let stamp = Math.floor(firstDayTimestamp / 1000)
  return stamp
}
const fetchLongText = async function (postid) {
  let longTextResp = await axios.get(GetLongTextURL, {
    params: {
      id: postid,
    },
  })

  try {
    return longTextResp?.data?.data || ""
  } catch (error) {
    return
  }
}

// 拉取主要函数
export const fetchPost = async function (parameters, callback) {
  _callback = callback

  console.log(parameters)
  generateHTML()

  let { uid, sourceType, rangeType, range } = parameters

  _uid = uid
  _sourceType = sourceType

  let requestParam = {
    uid,
    page,
    hasori: 1,
  }
  if (rangeType == 1) {
    requestParam = {
      ...requestParam,
      starttime: getFirstDayTimestamp(range.start),
      endtime: getLastDayTimestamp(range.end),
    }
  }

  while (loadMore) {
    requestParam.page = page
    let respData = await doFetch(requestParam)
    console.log(respData)
    if (!respData) {
      // 如果是接口报错了，什么都不干，继续 page ++
      console.log("接口报错了")
    } else {
      if (respData?.list?.length > 0) {
        total = respData.total
        console.log("继续拉")
      } else {
        loadMore = false
        console.log("数据拉完了")
      }
    }
    page++
  }

  appendSpeechless()
}
