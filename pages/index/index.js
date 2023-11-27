const {debounce} = require('../../utils/util');

Component({
  data: {
    message: '',
    hasFocus:false,
    inputValue:'',
    focusHeight:0,
    scale:0,
    iosBottom:0,
    messageList: [],
    loading:false,
    apiKey:'sk-qWcfQreFZnQZDK1iCdTJHtw03ZDVaulY5ORpZqZ8gWn18b9Y',
    baseUrl:'https://api.chatanywhere.com.cn',
    scrollTop:0
  },
  ready(){
    const systemInfo = wx.getSystemInfoSync()
    const scale = systemInfo.windowWidth/750
    this.setData({scale})

    const {screenHeight,statusBarHeight,safeArea} = wx.getWindowInfo()
    if(safeArea){
      let iosBottom = screenHeight - statusBarHeight - safeArea.height
      iosBottom = iosBottom<0?0:iosBottom
      this.setData({iosBottom})
    }

    let messageList = wx.getStorageSync('messageList') || []
    // messageList = messageList.concat(messageList).concat(messageList).concat(messageList).concat(messageList).concat(messageList)
    this.setData({messageList})

    this.setData({scrollTop:99999})
  },
  methods: {
    sendMessage:debounce(function (){
      
      if(this.data.loading){
        wx.showToast({
          title: '正在等待回复',
          icon:'none',
          duration: 2000
        });
        return
      }
      this.setData({'loading':true})

      const inputValue = this.data.inputValue
      let messageList = this.data.messageList

      messageList.push({role:'user',content:inputValue})
      this.setData({messageList})

      this.scrollToBottom()
      
      this.sendMessages()
      
      this.setData({'inputValue':''})

    }),
    handleFocus(e){
      const keyboard = e.detail.height;
      this.setData({'focusHeight':Math.ceil(keyboard/this.data.scale)})
    },
    scrollToBottom(){
      wx.nextTick(()=>{
        this.setData({scrollTop:Math.random()*100000+100000})
      })
    },
    handleBlur(e){
      this.setData({'focusHeight':0})
    },
    handleInput(e){
      this.setData({'inputValue':e.detail.value})
    },
    updateStorage(){
      wx.setStorageSync('messageList',this.data.messageList.slice(-10))
    },
    async sendMessages() {
      let url = this.data.baseUrl+'/v1/chat/completions'

      let messages = this.data.messageList

      wx.request({
        url, 
        method:'POST',
        data: {
          n: 1,
          model: "gpt-3.5-turbo",
          messages,
          max_tokens: 100,
        },
        timeout: 600000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.apiKey}`
        },
        success: (res) => {
          console.log('%c 🦐 res: ', 'font-size:20px;background-color: #FFDD4D;color:#fff;', res);

          let result = res.data?.choices?.[0]?.message || res.data?.error?.message;
          if(result){
            let messageList = this.data.messageList
            messageList.push(result)
            this.setData({messageList})
          }

          this.scrollToBottom()
          
          this.updateStorage()
        },
        fail(){
          wx.showToast({
            title: '网络繁忙,请重试',
            icon:'none',
            duration: 2000
          });
        },
        complete: ()=>{
          this.setData({'loading':false})
        }
      })
    }
  },
})
