<template>
  <div
    v-if="isMinimum"
    @click="eventResetPopup"
    class="fixed z-[9999] top-[70px] right-5 p-2 rounded-full bg-white shadow-xl shadow-black/5 ring-2 ring-slate-700/10 cursor-pointer"
  >
    <div class="font-sans italic font-bold inline-flex text-[20px] -space-x-1">
      <span class="text-red-600/50">S</span>
      <span class="text-orange-600/50">P</span>
      <span class="text-yellow-600/50">E</span>
      <span class="text-lime-600/50">E</span>
      <span class="text-green-600/50">C</span>
      <span class="text-teal-600/50">H</span>
      <span class="text-sky-600/50">L</span>
      <span class="text-indigo-600/50">E</span>
      <span class="text-purple-600/50">S</span>
      <span class="text-pink-600/50">S</span>
    </div>
  </div>
  <div v-else class="fixed z-[9999] top-[70px] right-5 w-[360px]">
    <div
      class="relative p-5 pt-7 rounded-md bg-white text-slate-700 shadow-xl shadow-black/5 ring-2 ring-slate-700/10"
    >
      <div v-if="isLoading" class="text-center py-5">正在初始化...</div>
      <template v-else>
        <div
          class="flex absolute right-0 top-0 border-l-2 border-b-2 rounded-bl-md"
        >
          <a
            href="https://github.com/Konano/Speechless"
            title="帮助"
            target="_blank"
            class="p-1"
          >
            <svg
              fill="none"
              class="w-4 h-4"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              ></path>
            </svg>
          </a>
          <span
            @click="eventMinimize"
            class="p-1 border-l-2 cursor-pointer"
            title="收起"
            ><svg
              fill="none"
              class="w-4 h-4"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18 12H6"
              ></path>
            </svg>
          </span>
        </div>

        <div v-if="isReady">
          <!-- 默认的面板 -->
          <template v-if="state == 'DEFAULT'">
            <div class="flex items-start py-5">
              <div class="font-sans italic font-bold inline-flex text-[60px]">
                <span class="-mr-[12px] text-red-600/50">S</span>
                <span class="-mr-[12px] text-orange-600/50">P</span>
                <span class="-mr-[12px] text-yellow-600/50">E</span>
                <span class="-mr-[12px] text-lime-600/50">E</span>
                <span class="-mr-[12px] text-green-600/50">C</span>
                <span class="-mr-[12px] text-teal-600/50">H</span>
                <span class="-mr-[12px] text-sky-600/50">L</span>
                <span class="-mr-[12px] text-indigo-600/50">E</span>
                <span class="-mr-[12px] text-purple-600/50">S</span>
                <span class="text-pink-600/50">S</span>
              </div>
              <span
                class="ml-1 text-xs text-zinc-700 bg-zinc-100 rounded border-zinc-300 border px-1 py"
                >V2.3</span
              >
            </div>
            <div
              class="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between"
            >
              <div class="text-sm">
                把
                <label
                  class="underline decoration-orange-400 decoration-4 font-medium"
                  >@{{ username }}</label
                >
                的记忆打包。
              </div>
              <button
                type="button"
                @click="eventStart"
                class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shrink-0 ml-2"
              >
                开始
              </button>
            </div>
          </template>

          <!-- 选择范围面板 -->
          <template v-if="state == 'SELECTRANGE'">
            <div>
              <SelectNative
                title="时间范围"
                v-model="weiboRangeType"
                :options="OptionsWeiboTimeRange"
              />
            </div>
            <div v-if="weiboRangeType == 1" class="mt-2">
              <SelectTimeRangeVue
                :range="weiboRange"
                :years="years"
                @onRangeChanged="eventRangeChanged"
              />
              <div v-if="!weiboRangeisValid" class="text-sm text-red-400 pt-1">
                结束时间须晚于开始时间
              </div>
            </div>
            <div class="mt-4">
              <SelectNative
                title="内容类型"
                v-model="weiboSourceType"
                :options="OptionsWeiboSourceType"
              />
            </div>
            <div class="mt-4">
              <button
                type="button"
                @click="eventFetchPosts"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                开始回忆
              </button>
            </div>
          </template>

          <!-- 拉取数据ing -->
          <template v-if="state == 'PENDING'">
            <div class="text-sm font-medium">
              <label
                class="underline decoration-orange-400 decoration-4 font-medium mr-2"
                >@{{ username }}</label
              >{{ pendingWording }}
            </div>
            <div class="border-t border-gray-200 mt-4 pt-4">
              <div class="flex justify-between">
                <span class="text-sm">拼命回忆中...</span>
                <span class="text-sm">{{ count }}/{{ total }}</span>
              </div>
              <div class="bg-zinc-200 h-2 rounded-sm overflow-hidden mt-2">
                <div
                  class="h-2 bg-orange-400 transition-all"
                  :style="`width:${progress}%`"
                ></div>
              </div>
            </div>
          </template>

          <!-- 拉取完毕 -->
          <template v-if="state == 'SAVING'">
            <div class="text-sm font-medium">
              <label
                class="underline decoration-orange-400 decoration-4 font-medium mr-2"
                >@{{ username }}</label
              >{{ pendingWording }}
            </div>
            <div class="border-t border-gray-200 mt-4 pt-4">
              <SelectNative
                title="图片尺寸"
                v-model="weiboImageScaleType"
                :options="OptionsWeiboImageScale"
              />
            </div>

            <div class="border-t border-gray-200 mt-4 pt-4">
              <div class="flex gap-3">
                <button
                  type="button"
                  @click="eventSavePDF"
                  class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  保存为 PDF
                </button>
              </div>
            </div>
          </template>

          <!-- 拉取完毕 -->
          <template v-if="state == 'DONE'">
            <div class="pt-4 pb-2 flex items-center px-2">
              <!-- <img
                class="rounded-full block p-2 overflow-hidden ring-4 ring-orange-300 w-32 h-32 flex-none"
                :src="donateImageURL"
              /> -->
              <div class="text-stone-600 pl-5">
                <div class="text-xl text-stone-800 font-medium mb-2">
                  保存成功！
                </div>
                <!-- <div class="">请我喝杯奶茶吧 :-)</div> -->
                <!-- <div class="">
                  <label class="inline-flex items-center"
                    ><span class="text-stone-600 mr-1">支持我继续</span
                    ><span class="text-red-500 font-medium">
                      <span class="inline-flex items-center"
                        ><span>用</span
                        ><svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          class="inline-block w-5 h-5"
                        >
                          <path
                            d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z"
                          ></path>
                        </svg>
                        <span>发电</span></span
                      ></span
                    ></label
                  >
                </div> -->
              </div>
            </div>
            <div class="border-t border-gray-200 mt-4 pt-2 text-center">
              <div class="flex items-center justify-between">
                <label
                  @click="eventReSave"
                  class="inline-flex items-center py-2 text-sm font-medium text-orange-600 hover:hover:text-orange-600 cursor-pointer"
                  >再次保存</label
                >
                <button
                  type="button"
                  @click="eventRefresh"
                  class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shrink-0 ml-2"
                >
                  完成
                </button>
              </div>
            </div>
          </template>
        </div>

        <div v-else class="text-center py-5">
          请切到<span class="text-orange-600 font-medium px-1">用户主页</span
          >，再刷新下页面试试<br />
          去<a
            href="https://github.com/Konano/Speechless"
            class="text-orange-600 font-medium underline px-1"
            target="_blank"
            >speechless.fun</a
          >查看更多帮助
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import SelectNative from "./component/SelectNative.vue"
import SelectTimeRangeVue from "./component/SelectTimeRange.vue"

import { fetchUserInfo } from "./module/userInfo"
import { fetchPost } from "./module/blogPost"

const OptionsWeiboTimeRange = ["全部时间", "指定时间"]
const OptionsWeiboSourceType = ["全部微博", "原创微博"]
const OptionsWeiboImageScale = ["小图", "中图", "大图"]

export default {
  async created() {
    let user = await fetchUserInfo()
    this.isLoading = false
    if (user) {
      // console.log(user)
      this.isReady = true
      this.id = user.id || ""
      this.uid = user.uid || ""
      this.username = user.username || ""
      let yearMap = user.history || {}
      this.yearMap = yearMap
      this.years = Object.keys(user.history)
      this.setWeiboRange()
    } else {
      this.isReady = false
    }
  },
  components: {
    SelectTimeRangeVue,
    SelectNative,
  },

  data() {
    return {
      //
      isLoading: true,
      isReady: false,
      isMinimum:
        localStorage.getItem("speechlessPopupMinimize") === "true" || false,

      OptionsWeiboTimeRange,
      OptionsWeiboSourceType,
      OptionsWeiboImageScale,

      //
      state: "DEFAULT",

      //
      id: "",
      uid: "",
      username: "",

      total: 0,
      count: 0,
      progress: 0,

      // 0|全部 1|原创
      weiboSourceType: 1,
      weiboRangeType: 0,
      weiboRange: null,

      weiboImageScaleType: 0,
      weiboRangeisValid: true,

      start: null,
      end: null,

      //
      years: null,
      yearMap: null,

      pendingWording: "",
    }
  },
  watch: {
    weiboImageScaleType() {
      // 获取 .speechless-list 元素
      let scaleClassName =
        "speechless-list-" +
          ["small", "medium", "large"][this.weiboImageScaleType] || "medium"
      const speechlessList = document.querySelector(".speechless-list")
      speechlessList.classList.remove(
        "speechless-list-small",
        "speechless-list-medium",
        "speechless-list-large"
      )
      speechlessList.classList.add(scaleClassName)
    },
  },
  methods: {
    eventStart() {
      this.state = "SELECTRANGE"
    },

    setWeiboRange() {
      // console.log(this.yearMap)
      let yearsLen = this.years.length || 0
      let startY = this.years[0]
      let startM = this.yearMap[this.years[0]][0]

      let lastYear = this.years[yearsLen - 1]
      let lastYearMonths = this.yearMap[lastYear]
      let endY = lastYear
      let endM = lastYearMonths[lastYearMonths.length - 1]

      this.weiboRange = {
        start: {
          year: startY,
          month: startM,
        },
        end: {
          year: endY,
          month: endM,
        },
      }
    },

    async eventFetchPosts() {
      this.state = "PENDING"

      this.pendingWording = ""
      let documentTitle = `@${this.username}`
      if (this.weiboRangeType == 1) {
        if (this.weiboRange.start.month == 1 && this.weiboRange.end.month == 12) {
          if (this.weiboRange.start.year == this.weiboRange.end.year) {
            this.pendingWording += `${this.weiboRange.start.year} 年`
          } else {
            this.pendingWording += `${this.weiboRange.start.year} 年 - ${this.weiboRange.end.year} 年`
          }
        } else {
          this.pendingWording += `${this.weiboRange.start.year} 年 ${this.fillWithZero(this.weiboRange.start.month)} 月`
          if (this.weiboRange.start.year == this.weiboRange.end.year) {
            if (this.weiboRange.start.month != this.weiboRange.end.month) {
              this.pendingWording += ` - ${this.fillWithZero(this.weiboRange.end.month)} 月`
            }
          } else {
            this.pendingWording += ` - ${this.weiboRange.end.year} 年 ${this.fillWithZero(this.weiboRange.end.month)} 月`
          }
        }
        documentTitle += `_${this.weiboRange.start.year}${this.fillWithZero(this.weiboRange.start.month)}`
        documentTitle += `-${this.weiboRange.end.year}${this.fillWithZero(this.weiboRange.end.month)}`
      }
      if (this.weiboSourceType == 1) {
        this.pendingWording += `的原创微博`
        documentTitle += `_原创微博`
      } else {
        this.pendingWording += `的全部微博`
        documentTitle += `_全部微博`
      }

      document.title = documentTitle

      let fetchTask = await fetchPost(
        {
          uid: this.uid,
          sourceType: this.weiboSourceType,
          rangeType: this.weiboRangeType,
          range: this.weiboRange,
        },
        (cb) => {
          switch (cb.type) {
            case "total":
              this.total = cb.value
              break
            case "count":
              this.count = cb.value
              break
          }

          if (this.total > 0) {
            this.progress = Math.floor(
              (parseFloat(this.count) / parseFloat(this.total)) * 100
            )
          }
        }
      )

      this.state = "SAVING"
    },
    eventRangeChanged(e) {
      this.weiboRange = e.range
      console.log(this.weiboRange)
    },
    eventMinimize() {
      this.isMinimum = true
      localStorage.setItem("speechlessPopupMinimize", "true")
    },
    eventResetPopup() {
      this.isMinimum = false
      localStorage.setItem("speechlessPopupMinimize", "false")
    },
    eventSavePDF() {
      setTimeout(() => {
        this.state = "DONE"
      }, 1)
      setTimeout(() => {
        window.print()
      }, 10)
    },
    eventRefresh() {
      location.reload()
    },
    eventReSave() {
      this.state = "SAVING"
    },
    fillWithZero(n) {
      return (n < 10 ? "0" : "") + n
    },
  },
}
</script>
<style>
body {
  background: #fff !important;
}
</style>
