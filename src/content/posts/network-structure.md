---
title: null
description: null
publishedAt: 2026-09-28T07:21:47.637Z
updatedAt: 2026-09-28T07:21:48.762Z
category: 个人实用
tags:
  - HomeLab
  - 硬件
  - 基础设施
draft: true
---

## 成员及网络配置

| 名称 | 类型 | 价格/周期 | CPU | 内存 | 磁盘 | IPv4 | IPv6 | 带宽 | 流量/周期 | 线路/机房 |
|---|---|---|---|---|---|---|---|---|---|---|
| Homelab | 物理机 | / | 6c12t | 40GB | 15.25TB | NAT | 公网 IPv6 | 下行 1000Mbps，上行 200Mbps | / | 上海电信，家宽 |
| LAX | 虚拟机 | $143.89/两年 | 1c | 2GB | 20GB | 公网 | 公网/64 | 上下行对等 1000Mbps | 双向1TB/月 | 美国洛杉矶机房，三网 CN2-GIA |
| HK | 虚拟机 | ￥160/半年 | 2c | 2GB | 30GB | 公网 | 无 | 上下行对等 150Mbps | 双向1TB/月 | 香港机房，三网 CMI |
| PH | 容器 | ￥3/月 | 0.15c | 128MB | 512MB | NAT | 无 | 上下行对等 200Mbps | 双向50GB/月 | CN2 绕美（？） |

## 网络互连通性


| 源 \ 目标 | Homelab | LAX | HK | PH |
|---|---|---|---|---|
| Homelab | — | 12ms<br>TTL 54<br>↑200 | 35ms<br>TTL 52<br>↑200 | 180ms<br>TTL 48<br>↑200 |
| LAX | 12ms<br>TTL 54<br>↑1000 | — | 150ms<br>TTL 50<br>↑1000 | 220ms<br>TTL 48<br>↑1000 |
| HK | 35ms<br>TTL 52<br>↑150 | 150ms<br>TTL 50<br>↑150 | — | 60ms<br>TTL 52<br>↑150 |
| PH | 180ms<br>TTL 48<br>↑200 | 220ms<br>TTL 48<br>↑200 | 60ms<br>TTL 52<br>↑200 | — |
