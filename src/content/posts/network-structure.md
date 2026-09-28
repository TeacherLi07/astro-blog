---
title: 标题
description: 简介
publishedAt: 2026-09-28T07:21:47.637Z
updatedAt: 2026-09-28T07:21:48.762Z
category: 个人实用
tags:
  - HomeLab
  - 硬件
  - 基础设施
draft: false
---

## 成员及网络配置

| 名称 | 类型 | 价格/周期 | CPU | 内存 | 磁盘 | IPv4 | IPv6 | 带宽 | 流量/周期 | 线路/机房 |
|---|---|---|---|---|---|---|---|---|---|---|
| Homelab | 物理机 | / | 6c12t | 40GB | 15.25TB | NAT | 公网 IPv6 | 下行 1000Mbps，上行 200Mbps | / | 上海电信，家宽 |
| LAX | 虚拟机 | $143.89/两年 | 1c | 2GB | 20GB | 公网 | 公网/64 | 上下行对等 1000Mbps | 双向1TB/月 | 美国洛杉矶机房，三网 CN2-GIA |
| HK | 虚拟机 | ￥160/半年 | 2c | 2GB | 30GB | 公网 | 无 | 上下行对等 150Mbps | 双向1TB/月 | 香港机房，三网 CMI |
| PH | 容器 | ￥3/月 | 0.15c | 128MB | 512MB | NAT | 无 | 上下行对等 200Mbps | 双向50GB/月 | CN2 绕美（？） |

## 网络互连通性

Initial TTL = 64。 IPv4 / IPv6。默认IPv4。

| 源 \ 目标 | Homelab | LAX | HK | PH |
|---|---|---|---|---|
| Homelab | — | 130/145ms<br>TTL 53/49<br>↑170/70Mbps<br>↓420/400Mbps| 33ms<br>TTL 47<br>↑150Mbps<br>↓145Mbps | 308ms<br>TTL 49<br>↑80Mbps<br>↓110Mbps |
| LAX | -/126ms<br>TTL -/53<br>↑-/430Mbps<br>↓-/170Mbps | — | 171ms<br>TTL 49<br>↑145Mbps<br>↓150Mbps | 177ms<br>TTL 50<br>↑205Mbps<br>↓200Mbps |
| HK | — | 181ms<br>TTL 49<br>↑150Mbps<br>↓155Mbps | — | 18ms<br>TTL 55<br>↑145Mbps<br>↓145Mbps |
| PH | — | 178ms<br>TTL 49<br>↑200Mbps<br>↓190Mbps | 18ms<br>TTL 55<br>↑150Mbps<br>↓150Mbps | — |
