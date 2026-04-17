# simrenderer

道路仿真 web 渲染器

# 使用

## 说明

### 方向

xodr 使用右手坐标系。根据 xodr 规范，x 正方向为 east，y 正方向为 north。因此，我们可以根据航向角进行如下设定：
```
east: [+π/4, -π/4​)
south: [-π/4, -π3/4)
west: [-π3/4, +π3/4)
north: [+π3/4, +π/4)
```

``<header>`` 标签里的 east 等属性表示的是 x/y 轴的范围，不需要考虑。

## 版本

```
import { VERSION } from 'simrenderer'
console.log(VERSION)
```

## 读取地图

```
import { Editor, createNode } from 'simrenderer'

const container = ref<HTMLDivElement | null>(null)

onMounted(() => {
  loadMap('entire')
})

let renderer: Editor | null = null
async function loadMap(type: 'EntireMap' | 'NormalMap') {
  if (container.value) {
    if (renderer) {
      renderer.destroy()
      renderer = null
    }
    renderer = new Editor({
      container: container.value!,
    })
    // 加载地图
    fetch('/xodr/City_1x1.xodr')
      .then(response => response.blob())
      .then(async blob => {
        const file = new File([blob], 'City_1x1.xodr')
        const node = await createNode(type, { xodr: file, parserPath: '/ModuleOpenDrive.js' })
        console.log('node', node)
        node.on('click', event => {
          console.log('Lane node clicked:', event)
        })
        renderer!.add(node)
      })
  }
}
```

## 获取 xodr xml 数据

```
import { Editor, getXodr } from 'simrenderer'

// ……
const xml = getXodr(mapNode, 'string') // 'string' or 'element'
```

## 画布适配到对象

editor 的 fitViewToBbox 可以将视图缩放聚焦到指定的包围盒范围。

```
const bbox = node.getBoundingBox()
if (!bbox) return
node.getEditor()?.fitViewToBbox(bbox, scale = 1) // 注意，scale 参数越大，视野越广，所以如果要起到放大的作用，传放大数值的倒数。
```

## 获取实体列表

normalMap 的 getEntities 可以获取到包装后的节点树

## 事件

```
// ……
const mapNode = await createNode('normalMap', { xodr: file })
mapNode.on('click', (obj) => console.log(obj))
/**
 * obj: {
 *   scope?: string
 *   object?: THREE.Object3D
 *   originalEvent?: MouseEvent
 *   target: Base // 取决于实际节点，下同
 *   currentTarget: Base
 *   data?: any
 * }
 */
```

### 常规事件

“click”、“movein”、“move”、“moveout”。这些事件会在渲染节点上触发，比如 lane、roadmark。建议直接在 editor 上监听。

事件监听可以添加第三个参数，该参数可以通过 scope 属性指定监听的节点类型

```
editor.on('click', (e) => console.log(e), { scope: 'Road' })
```

### 控制器交互

- controlsChanged
  地图挂载后会触发一次，此后旋转、平移、缩放都会触发。但考虑到性能问题，是操作结束后触发。

```
editor.on('controlsChanged', (e) => {
  console.log(e) // e: { data: { scaleRatio: number } }
})
```

## 模式切换

对于不同的模式，editor 有不同的交互逻辑。比如 'view' 模式，鼠标移动到道路上会自动高亮自身和相邻以及前后车道。

模式切换：

```
editor.changeMode('view')
// 或者直接更改属性
editor.attrs.mode = 'edit:road'
```

- view: 自由模式
  - 该模式无法编辑地图
  - 鼠标移动到道路上会高亮
- edit:road：道路编辑
  - 可以通过点击选择非路口道路并拖拽
  - 可以通过拖拽指定类型的道路进入地图添加道路
  - 可以通过点击端点连接道路（自动创建中间道路）
  - 可以通过点击端点（点击目的端点时按照 alt/shift/ctrl）移动并连接道路（不创建中间道路）
  - 可以触发 scope: "Road" 范围的点击事件
  - 可以通过 select/deselect 事件 scope: "ControlPoint" 获取到控制点数据，其中 deselect 没有数据。返回的 data 对象是响应式的，可直接修改 x,y 值，可以通过 data.remove() 删除控制点，首尾除外。
  - 可以通过 road.destroy() 或者 road.parent.remove(road) 删除道路
  - 可以通过 road.setLength(length: number) 调整长度
- edit:road: 元素编辑
  - 元素编辑和道路编辑是在同一个模式
  - 可以通过 select/deselect 事件 scope: "Object" 的 target 获取到元素（也可能是 editor，注意判断）。这两个事件目前都没有 data。
  - 修改数据需要通过 object 节点的相关方法进行。
    ```
    // 获取数据
    const st = obj?.getST?.()
    const orientation = obj?.getLocalOrientation?.()
    const offset = obj?.getLocalOffset()
    // 修改数据
    // 方法一：直接修改
    st.s = 100
    // 方法二：调用相关 set 方法
    obj?.setST({s: 100, t: 1})
    ```
  - 删除元素：直接调用 `obj.destroy()`
- edit:circular-road: 环路编辑
  - 环路编辑默认数量为 1，默认道路为 left_bend
  - 切换到环路模式之后，需要获取环路工具，指定数量和道路类型
    ```
    const tool = editor.getTool()
    tool.state.roadCount = 2
    tool.state.roadType = 'tunnel'
    ```
    数量为 1-6，类型为 'left_bend', 'straight_highway', 'ramp', 'tunnel'，不属于这个范围的默认为 'left_bend'
  - 环路路面可以旋转地图，但不能拖动地图，因为鼠标按下移动为绘制环路
  - 环路模式可以选择弯路并调整长度，这与道路编辑模式一致
- edit:elevation：高程调整
  - 可以通过点击选择道路并调整首尾高度
  - 可以通过 select/deselect 事件 scope: "ControlPoint" 获取到控制点数据，其中 deselect 没有数据。返回的 data 对象是响应式的，可直接修改 z 值，可以通过 data.remove() 删除控制点，首尾除外。
- edit:junction：路口
  - 可以通过点击路口的道路选择路口
  - 可以通过点击道路端点连接道路（两两配对）
  - 可以通过右键道路端点取消连接
  - 可以通过 junction.destroy() 删除路口
  - 可以触发 scope: "Junction" 范围的点击事件
- edit:lane
  - 可以通过点击选择车道
  - 可以直接修改车道 attrs 的 type 改变车道类型
  - 可以通过 scope: "Lane" 范围的点击事件
- edit:lane-add
  - 可以通过点击选择车道
  - 可以通过 road.copyLane(id: number | string) 新增同类型车道
  - 可以通过 road.removeLane(id: number | string) 删除指定车道
  - 可以通过 scope: "Lane" 范围的点击事件
- edit:lane-link
  - 可以通过点击路口的道路选择路口
  - 可以通过点击车道端点连接车道（两两配对）
  - 可以触发 scope: "Junction" 范围的点击事件
  - 可以通过 select/deselect 事件 scope: "LinkLine" 获取到连接线数据，其中 deselect 没有数据。返回的 data 可以通过 data.remove() 删除连接。
  - 可以通过 select/deselect 事件 scope: "LaneEndpoint" 获取到端点数据，其中 deselect 没有数据。
- edit:lane-width
  - 可以通过点击选择车道
  - 可以直接修改车道下 Width 节点的 attrs.a 修改宽度
  - 可以通过 scope: "Lane" 范围的点击事件
  - 可以通过 select scope: "Lane" 范围的选择事件的 data 获取道路、车道、宽度等信息。可以直接修改 data 里的宽度。
- edit:lane-line
  - 可以通过点击车道选择车道段
  - 可以通过点击车道线中心线选择车道线
  - 可以通过 select scope: "LaneLine" 范围的选择事件获取相关车道线节点和数据。其中 target 为节点，data 包含关联车道信息
  - 可以直接修改 RoadMark 节点的 type、color 改变外观。
    - type: "solid" | "broken"
    - color?: "white" | "yellow" | "red" | "blue" | "green" | "orange" | "standard"
- edit:scenario
  - 可以通过点击（select/deselect 事件 scope: "Object"）选择相关对象

对于 scope: "Object"，因为不同的 xml/分组 里都可能有 object 节点，所以为了区分，object.ns 属性会根据不同的 xml 变化，比如 “OpenDrive”、“TrafficObjects”，如果要更详细的区分，可以根据需要，自行获取父元素/子元素进行判断。

## 视角锁定

目前支持锁定 xy/-xy/xz/-xz/yz/-yz 平面视角。视角锁定之后只能平移，不能右键旋转。注意，循环切换可能会有问题

```
editor.lockViewAxes('xy')
// 解除锁定
editor.lockViewAxes()
```

## 添加元素

添加元素有两种方式：

### 根据 xml 生成

```
import { createOpenDriveNodeWithXML } from 'simrenderer'
const road = createOpenDriveNodeWithXML(`
  <road name="road13" rule="RHT" junction="-1" length="100" id="13">
    <userData roadType="Ramp"  roadControlPoints="0,1" />
    <planView>
      <geometry s="0" x="0" y="0" hdg="0" length="100">
        <line />
      </geometry>
    </planView>
    <elevationProfile>
      <elevation s="0" a="0.01" b="-0" c="0" d="0" />
    </elevationProfile>
    <lanes>
      <laneSection s="0">
        <center>
          <lane id="0" type="median" level="false">
            <link />
          </lane>
        </center>
        <right>
          <lane id="-1" type="driving" level="false">
            <link />
            <width sOffset="0" a="3.5" b="0" c="0" d="0" />
          </lane>
        </right>
      </laneSection>
    </lanes>
  </road>
`)
road.setPosition({x: 100, y: 100})
map.add(road)
```

### 拖拽创建

渲染器会监听 drop 事件，所以只需要在 dragstart 事件设置符合规则的数据即可。

```
<img src="xxx" @dragstart="addRoad" />

function addRoad(e) {
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('data', JSON.strigify({
    action: 'Add',
    tag: 'Road'
  }))
}
```

#### 元素标识规则

注意，需要先创建/加载地图，然后再创建/加载 TrafficObjects，否则拖拽非道路元素不生效

```
const editor = new Editor({
  container,
  modelBaseUrl // 存在非道路元素时必传
})
const map = await createOpenDriveNode('NormalMap', {
  xodr: text
})
editor.add(map)
const trafficObjects = createTrafficObjects(xmlString)
if (trafficObjects) {
  editor.add(trafficObjects)
}
const toxml = getTrafficObjectsXML(trafficObjects, 'your_map_name.xodr')
```

`setData('data', objString)`，其中 `objString` 为一个对象的字符串形式。对象字段如下：

- action: 可以执行的动作
  - 'Add'
- tag: 标签。多层标签可以用 `->` 符号连接
  - 'Road' | 'Road -> Object' | 'TrafficSigns -> Sign' | 'TrafficLights -> TrafficLight' | 'RoadFurniture -> Object' | 'Sensors -> Sensor' | 'OtherObjects -> Object'
  - 除了 `Road` 外都是两层标签，因为 `Other` 可以属于不同的大类，最少需要两层才能准确定位结构。那为什么不直接用外层识别呢？这是为了防止以后内层存在不同标签的情况。
- 其他字段: 根据不同的标签而变化。
  - Road
    |字段|值|类型|备注|
    |--|--|--|--|
    |type|straight, left_bend, right_bend, ramp, tunnel, straight_highway, ramp_junction|字符串|--|
  - Road -> Object
    |字段|值|类型|备注|
    |--|--|--|--|
    |type|ParkingSpace|字符串|--|
    * ParkingSpace 参数：
      ```
      {
        id: string
        s: number
        t: number
        hdg: number(rad)
        color: 'standard' | 'blue' | 'green' | 'red' | 'white' | 'yellow' | 'orange'
        length: number
        width: number
        lineWidth: number
        skewX: number(rad)
      }
      ```
  - TrafficSigns -> Sign
    |字段|值|类型|备注|
    |--|--|--|--|
    |xml|xxx|string|需要创建的节点的 xml 内容。可选|
    |type|speed_limit, stop, yield, warning, information, regulation|string|--|
    |subType|maximum, minimum, recommended, zone_start, zone_end|string|--|
    |model|xxxx|string|模型名称|
  - TrafficLights -> TrafficLight
    |字段|值|类型|备注|
    |--|--|--|--|
    |xml|xxx|string|需要创建的节点的 xml 内容。可选|
    |type|vehicle, pedestrian|string|--|
    |model|xxxx|string|模型名称|
  - RoadFurniture -> Object
    |字段|值|类型|备注|
    |--|--|--|--|
    |xml|xxx|string|需要创建的节点的 xml 内容。可选|
    |type|guardrail, street_light, ParkingSpace|string|--|
    |model|xxxx|string|模型名称|
  - Sensors -> Sensor
    |字段|值|类型|备注|
    |--|--|--|--|
    |xml|xxx|string|需要创建的节点的 xml 内容。可选|
    |type|traffic_camera, v2x_rsu|string|--|
    |externalConfigPath|例如：Sensors/Camera/PD_Camera_RTPhyxSens_Pinhole_1|string|传感器路径名称|
    |model|xxxx|string|模型名称|
  - OtherObjects -> Object
    |字段|值|类型|备注|
    |--|--|--|--|
    |xml|xxx|string|需要创建的节点的 xml 内容。可选|
    |type|building, tree, traffic_pole|string|--|
    |model|xxxx|string|模型名称|

打开/获取 TrafficObjects 的时候可以传入第二个参数：mapName。这个参数表示 TrafficObjects 关联的地图名称（包含后缀）

### 元素模型文件夹规则

因为模型名称具备唯一性，就不区分文件夹了，直接放到一起。所以最终路径就是：baseUrl/model_name.fbx

### 红绿灯 PhaseID 规则

|编号|方向|含义|编号|方向含义|
|--|--|--|--|--|
|1|北|左|17|北掉头|
|2|北|直|18|东掉头|
|3|北|右|19|南掉头|
|4|北|行人1|20|西掉头|
|5|东|左|21|北行人2|
|6|东|直|22|东行人2|
|7|东|右|23|南行人2|
|8|东|行人1|24|西行人2|
|9|南|左|25|北非机动车|
|10|南|直|26|东非机动车|
|11|南|右|27|南非机动车|
|12|南|行人1|28|西非机动车|
|13|西|左|29|扩展1|
|14|西|直|30|扩展2|
|15|西|右|31|扩展3|
|16|西|行人1|32|扩展4|

* 方向根据红绿灯所处道路位置的航向角（hdg）计算


### 复制粘贴元素对象

```
const newObjs = obj.duplicate()
if (newObjs.length) {
  const last = newObjs.pop()
  const editor = last.getEditor()
  editor.selectedNodes.splice(0, editor.selectedNodes.length, last)
}
```
