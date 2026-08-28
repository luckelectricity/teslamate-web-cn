<div align="center">

# ⚡ TeslaMate CN (车友专属现代看板)

**专为国内特斯拉车友打造的高颜值、全平台自适应 TeslaMate 现代化数据看板与足迹可视化系统**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![GitHub Pages](https://img.shields.io/badge/Live_Demo-Online-emerald?style=flat-square&logo=github)](https://your-username.github.io/teslamate-web-cn/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[🌐 在线 Demo 演示](https://your-username.github.io/teslamate-web-cn/) • [✨ 功能特性](#-功能特性) • [🚀 快速部署](#-快速开始--docker-一键部署) • [📄 环境变量](#-环境变量配置) • [🛡️ 隐私模式](#-海报与隐私脱敏)

> 💡 **在线免部署体验**：本项目已内置高保真 Mock 数据演示站，[点击直接在线体验 Demo](https://your-username.github.io/teslamate-web-cn/)！

</div>

---

## 🌟 为什么开发本项目？

原版 TeslaMate 搭配 Grafana 在国内使用时通常存在以下痛点：
1. **移动端体验差**：Grafana 仪表盘排版偏向桌面大屏，手机端操作与图表缩放体验繁琐；
2. **地图漂移与空白**：国外 OpenStreetMap 在国内存在显著偏移且逆地理服务常年无法连接，起止点只显示空白或经纬度；
3. **缺乏社交分享能力**：无法便捷生成长图海报分享月度用车成本与单次出行战报；
4. **部署繁琐**：配置反向代理与中文字体复杂。

**TeslaMate CN** 采用现代化前端技术栈（Next.js App Router + TailwindCSS），直连 TeslaMate 数据库与 MQTT 实时流，无需修改任何原版配置，即插即用！

---

## ✨ 功能特性

### 🚗 1. 实时车况与电池健康大盘
- **车辆状态实时同步**：基于 MQTT 实时流毫秒级响应车辆唤醒、行驶、充电、睡眠状态；
- **智能车况指示**：哨兵模式、车门/前后备箱开启状态、胎压监测（Bar/PSI 自适应）、车内外实时温度；
- **电池健康度与衰减曲线**：基于历史充电循环与估算全电里程，智能分析电池健康（SOH）与衰减走势。

### 🗺️ 2. 全量足迹自适应大地图 (Footprint Map)
- **聚合全景轨迹**：提取历史所有行程真实路线，自动根据足迹范围计算缩放级别与视野中心；
- **高德地图 GCJ-02 纠偏**：彻底消除国外地图在国内的漂移问题，道路贴合分毫不差；
- **高频路段物理发光**：重复走过的路段自动叠加发光亮度，直观展示用车生活半径；
- **一键唤起高德地图**：起点/终点支持一键唤起手机高德地图 App 精准定位与实景导航。

### 📊 3. 行程与能耗深度分析
- **行程详情与剖面图**：速度、动力功率与海拔高度三维联动，消除海拔锯齿震荡；
- **月度用车账单**：自动汇总每月行驶里程、综合能耗、真实电费与相较油车的节省金额；
- **气温能耗拟合**：分析不同环境温度对百公里能耗（Wh/km）的影响。

### 🖼️ 4. 专属战报海报系统（含强力隐私模式）
- **月度用车报告海报**：一键生成高颜值月度用车成本战报，原生支持 iOS / 极空间 App 长按保存相册；
- **单次行程专属海报**：
  - 🗺️ **非隐私模式**：加载高德暗色高精地图底图（含城市道路网与地标）+ 红色发光轨迹；
  - 🛡️ **隐私模式**：完全隐藏现实地理环境，采用纯黑科技背景纯轨迹线条，起止地点与文字战报**严格自动打码脱敏**，放心分享朋友圈与车友群。

### 📱 5. 全平台自适应与自由切换
- **三模视图架构**：
  - 智能自适应模式（根据屏幕尺寸与 UA 自动适配）；
  - 移动端模式（单列流式卡片、底部轻量导航栏、触控优化）；
  - PC 宽屏模式（多列信息流、多图联动大看板）。

---

## 🏗️ 系统架构

```mermaid
flowchart TD
    subgraph Tesla Infrastructure
        Car[Tesla 车辆] -->|Tesla API| TM[TeslaMate 官方服务]
        TM -->|实时写入| PG[(PostgreSQL 数据库)]
        TM -->|状态推送| Mosquitto[Mosquitto MQTT]
    end

    subgraph TeslaMate CN
        App[Next.js 14 应用服务]
        PG -->|只读查询 (0写入安全)| App
        Mosquitto -->|实时事件监听| App
        Amap[高德地图 Web API] -->|逆地理编码 & 瓦片| App
    end

    subgraph 用户端展示
        App --> Phone[手机 / 极空间 / 群晖 App]
        App --> Desktop[PC 宽屏浏览器]
    end
```

> [!NOTE]
> **只读安全原则**：TeslaMate CN 对 PostgreSQL 数据库仅执行 `SELECT` 只读查询，绝不修改、插入或删除官方数据，零风险保障数据安全。

---

## 🚀 快速开始 / Docker 一键部署

### 方式一：使用 Docker Compose (推荐)

在与您现有的 `teslamate` 相同的机器或 NAS 上创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  teslamate-web-cn:
    image: ghcr.io/your-username/teslamate-web-cn:latest
    # 或直接本地构建: build: .
    container_name: teslamate-web-cn
    restart: always
    ports:
      - "3002:3000"
    environment:
      # PostgreSQL 连接 (与您的 TeslaMate 数据库配置保持一致)
      - DATABASE_HOST=teslamate-database
      - DATABASE_PORT=5432
      - DATABASE_USER=teslamate
      - DATABASE_PASS=your_secure_password
      - DATABASE_NAME=teslamate
      # MQTT 实时状态监听 (与您的 TeslaMate MQTT 服务保持一致)
      - MQTT_HOST=teslamate-mosquitto
      - MQTT_PORT=1883
      # 地图与时区
      - NEXT_PUBLIC_MAP_PROVIDER=amap
      - AMAP_KEY=your_amap_web_key  # 可选：高德地图 Web 服务 Key
      - TZ=Asia/Shanghai
    networks:
      - teslamate_default

networks:
  teslamate_default:
    external: true
```

启动容器：
```bash
docker compose up -d
```

打开浏览器访问：`http://<您的设备IP>:3002` 即可！

---

### 方式二：本地源码开发调试

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/teslamate-web-cn.git
   cd teslamate-web-cn
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 填入您的数据库与 MQTT 地址
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   打开 [http://localhost:3000](http://localhost:3000) 即可查看。

---

## ⚙️ 环境变量配置

| 变量名 | 默认值 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `DATABASE_HOST` | `teslamate-database` | 是 | TeslaMate PostgreSQL 数据库地址 |
| `DATABASE_PORT` | `5432` | 否 | 数据库端口 |
| `DATABASE_USER` | `teslamate` | 是 | 数据库用户名 |
| `DATABASE_PASS` | - | 是 | 数据库密码 |
| `DATABASE_NAME` | `teslamate` | 是 | 数据库名 |
| `MQTT_HOST` | `teslamate-mosquitto`| 否 | TeslaMate MQTT Broker 地址 |
| `MQTT_PORT` | `1883` | 否 | MQTT 端口 |
| `AMAP_KEY` | - | 否 | 高德地图 Web 服务 API Key（用于高精逆地理编码） |
| `DEFAULT_CAR_NAME`| `My Tesla` | 否 | 默认车辆显示昵称 |
| `TZ` | `Asia/Shanghai` | 否 | 容器时区 |

---

## 🔒 安全与隐私审计

本项目遵循严格的安全合规与开源隐私标准：
- **零敏感信息硬编码**：源码中无任何真实车架号（VIN）、用户账号密码、家庭坐标等私密信息；
- **全链路参数化**：所有数据库密码与令牌均通过环境变量（Environment Variables）注入；
- **分享图片长按存储**：适配极空间、群晖与 iOS WebView 拦截限制，杜绝 `blob/data` 下载弹窗报错；
- **一键隐私脱敏**：海报分享系统原生提供全方位地址脱敏与去地标纯轨迹渲染模式。

---

## 🤝 贡献与支持

欢迎提交 Issue 与 Pull Request！如果您觉得这个项目对您有帮助，请给仓库点一个 ⭐️ **Star** 支持一下！

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 协议开源。
Tesla™ 是 Tesla, Inc. 的注册商标。本项目与 Tesla, Inc. 无任何官方附属关系。
