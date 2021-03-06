// components/heatMap/heatMap.js
import colorGradual from "./colorGradual";

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    points:{
      type:Array,
      value:[],
    },
    longitude: {
      type: Number,
      value: 103
    },
    latitude: {
      type: Number,
      value: 30
    },
    mapScale: {
      type: Number,
      value: 7
    },
    range: {
      type: Number,
      value: 60
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    p_height: 100,
    p_width: 300
  },
  lifetimes: {
    attached() {},
    ready() {
      this.createSelectorQuery()
        .selectAll("#map")
        .boundingClientRect()
        .exec(res => {
          let p_height = parseInt(res[0][0].height);
          let p_width = parseInt(res[0][0].width);

          this.setData({
            p_height,
            p_width
          });
        });
      this.mapCtx = wx.createMapContext("map", this);
      this.ctx = wx.createCanvasContext("cvs", this);

      this.getMapRegion(() => {
        // this.data.points = this.getMapPoints();
        this.drawCanvas(this.data.points);
      });
    }
  },
  pageLifetimes: {
    show: function() {},
    hide: function() {},
    resize: function() {}
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //获取窗口坐标范围
    getMapRegion(fun) {
      this.mapCtx.getRegion({
        complete: res => {
          let northwest = [res.southwest.longitude, res.northeast.latitude];
          let southeast = [res.northeast.longitude, res.southwest.latitude];
          this.data.northwest = northwest;
          this.data.southeast = southeast;
          this.data.scale_x =
            this.data.p_width / (southeast[0] - northwest[0]);
          this.data.scale_y =
            this.data.p_height / (southeast[1] - northwest[1]);
          if (fun) {
            fun();
          }
        }
      });
    },
    // 绘制彩色渐变条
    getColorGradual() {
      let ctx = wx.createCanvasContext("color", this);
      let grd = ctx.createLinearGradient(0, 0, 256, 10);
      grd.addColorStop(0.2, "rgba(0,0,255,0.2)");
      grd.addColorStop(0.3, "rgba(43,111,231,0.3)");
      grd.addColorStop(0.4, "rgba(2,192,241,0.4)");
      grd.addColorStop(0.6, "rgba(44,222,148,0.6)");
      grd.addColorStop(0.8, "rgba(254,237,83,0.8)");
      grd.addColorStop(0.9, "rgba(255,118,50,0.9)");
      grd.addColorStop(1, "rgba(255,10,0,0.95)");
      ctx.setFillStyle(grd);
      ctx.fillRect(0, 0, 256, 10);
      ctx.draw(true, () => {
        wx.canvasGetImageData(
          {
            canvasId: "color",
            x: 0,
            y: 0,
            width: 256,
            height: 1,
            complete: res => {
              console.log(res.data.toString()); //用于生成colorGradual.js
            }
          },
          this
        );
      });
    },
    // 绘制热力点透明通道
    drawCanvas(points) {
      let ctx = this.ctx;
      let { p_width, p_height, range, scale_x, scale_y, northwest } = this.data;
      ctx.clearRect(0, 0, p_width, p_height);
      points.map(val => {
        let { ratio, opacity } = val;
        let x = (val.longitude - northwest[0]) * scale_x;
        let y = (val.latitude - northwest[1]) * scale_y;
        let grd = ctx.createCircularGradient(x, y, range * ratio);
        grd.addColorStop(0, `rgba(0,0,0,${opacity})`);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.setFillStyle(grd);
        ctx.arc(x, y, range * ratio, 0, 2 * Math.PI);
        ctx.fill();
      });

      ctx.draw(true, () => {
        this.drawGradual("cvs");
      });
    },
    // 绘制渐变映射
    drawGradual(id) {
      try {
        wx.canvasGetImageData(
          {
            canvasId: id,
            x: 0,
            y: 0,
            width: this.data.p_width,
            height: this.data.p_height,
            complete: res => {
              let imgData = res.data;
              for (let i = 3; i < imgData.length; i += 4) {
                let j = imgData[i] * 4;
                if (!j) {
                  continue;
                }
                imgData[i - 1] = colorGradual[j + 2];
                imgData[i - 2] = colorGradual[j + 1];
                imgData[i - 3] = colorGradual[j];
              }
              wx.canvasPutImageData(
                {
                  canvasId: "cvs",
                  x: 0,
                  y: 0,
                  data: imgData,
                  width: this.data.p_width,
                  height: this.data.p_height,
                  complete(res) {}
                },
                this
              );
            }
          },
          this
        );
      } catch (error) {
        console.error(error);
      }
    },
    //清空画布
    clearCanvas() {
      this.ctx.clearRect(0, 0, p_width, p_height);
    },
    //map视野变化
    handleRegionchange(e) {
      if (!this.data.points || e.type != "end") {
        return;
      }
      try {
        this.getMapRegion(() => {
          this.drawCanvas(this.data.points);
        });
      } catch (error) {
        
      }
      
    },
    
  }
});
