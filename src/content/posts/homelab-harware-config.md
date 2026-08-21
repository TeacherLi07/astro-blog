---
title: "个人HomeLab配置——硬件篇（1）"
description: ""
publishedAt: 2026-08-21
# updatedAt: 2026-07-12
category: "个人实用"
tags: ["HomeLab", "硬件", "施工中"]
draft: true
---

> [!NOTE]
> 此文主要由回忆而成，细节较少。涉及价格和性价比的分析部分，参考性较差。

博客站建成后的第一篇实用文章，给到我的 HomeLab/NAS。无论是从逻辑上还是实际搭建时间上，这都应该是第一篇文章，不过应该在一年前（

# 硬件选型（2025 年中）

> [!TIP] 先写结论，第一版硬件选型，购买时间，来源/价格

| 主要配件 | 价格/平台 | 购买时间 |
| --- | --- | --- |
| R5 5600 + PRIME B550 MK | 958.07 / 淘宝 | 2025-07-21 |
| AMD Instinct MI50 | 679 / 拼多多 | 2025-07-25 |
| MI50 改散热 | 45 / 闲鱼 | 2025-07-25 |
| MG08 14T | 800 / 淘宝 | 2025-07-04 |
| PM961 256G | 85 / 闲鱼 | 2025-07-08 |
| 海盗船 DDR4 3000 8G*2 + 16G*2 | 480.2 / 淘宝 | 2025-07-22 |
| 亮机卡 | 18.8 / 淘宝 | 2025-07-22 |
| 700W 电源 | 90 / 闲鱼 | 2025-07-21 |
| 玄冰 400 | 29.9 / 闲鱼 | 2025-07-21 |
| 机箱 | 49.9 / 淘宝 | 2025-07-22 |
| 风扇 * 3 | 18.7 / 淘宝 | 2025-07-26 |
| **合计** | **3235.77** | |

## 需求分析

一台 HomeLab/NAS，最关键的是什么？有点够用的性能，够用的内存，够用的存储——和够用的预算。性价比是我考虑的第一要务，硬件选型的主要宗旨就是 **捡垃圾**。

实际需求上，对于 NAS 部分的功能，我需要文件管理、文件共享、qbit 下载、在线播放等功能，其中涉及网页部分的功能还需要反代。

HomeLab 方面，我需要一张显卡。在 LLM 时代，大就是好，好就是大，大显存、大带宽为宜。

其他杂项还包括网页后端，Minecraft 服务器等等。

那么对应到硬件，我需要一个核心不太少的 CPU，足够 GPU 使用的内存，越快越好的系统盘和越大越好的存储盘。平台太新价格昂贵，平台太老性能差、功耗高。

## HDD

NAS 的灵魂自然是硬盘，而且硬盘与其他配件几乎没有兼容性问题，最多就是机箱要有硬盘位。六月份在购物车里加了一块 14T 硬盘，600 块，到了七月份一看 800 了，还在涨，就跟着 ~~硬盘吧~~ 电脑吧评测室公众号看了几家店，直接入手了。一块 3 万小时的东芝 MG08。

懒得找购买的时候测的原始数据了，以下 SMART 数据记录于 2026-08-21，仅供参考。

```
=== START OF INFORMATION SECTION ===
Model Family:     Toshiba MG08ACA... Enterprise Capacity HDD
Device Model:     TOSHIBA MG08ACA14TE
Serial Number:    51V0A00LFVJG
LU WWN Device Id: <omitted>
Firmware Version: 0102
User Capacity:    14,000,519,643,136 bytes [14.0 TB]
Sector Sizes:     512 bytes logical, 4096 bytes physical
Rotation Rate:    7200 rpm
Form Factor:      3.5 inches
Device is:        In smartctl database 7.3/5528
ATA Version is:   ACS-3 T13/2161-D revision 5
SATA Version is:  SATA 3.3, 6.0 Gb/s (current: 6.0 Gb/s)
Local Time is:    Fri Aug 21 22:14:59 2026 CST
SMART support is: Available - device has SMART capability.
SMART support is: Enabled

=== START OF READ SMART DATA SECTION ===
SMART overall-health self-assessment test result: PASSED

General SMART Values:
Offline data collection status:  (0x82) Offline data collection activity
                                        was completed without error.
                                        Auto Offline Data Collection: Enabled.
Self-test execution status:      (  25) The self-test routine was aborted by
                                        the host.
Total time to complete Offline
data collection:                (  120) seconds.
Offline data collection
capabilities:                    (0x5b) SMART execute Offline immediate.
                                        Auto Offline data collection on/off support.
                                        Suspend Offline collection upon new
                                        command.
                                        Offline surface scan supported.
                                        Self-test supported.
                                        No Conveyance Self-test supported.
                                        Selective Self-test supported.
SMART capabilities:            (0x0003) Saves SMART data before entering
                                        power-saving mode.
                                        Supports SMART auto save timer.
Error logging capability:        (0x01) Error logging supported.
                                        General Purpose Logging supported.
Short self-test routine
recommended polling time:        (   2) minutes.
Extended self-test routine
recommended polling time:        (1278) minutes.
SCT capabilities:              (0x003d) SCT Status supported.
                                        SCT Error Recovery Control supported.
                                        SCT Feature Control supported.
                                        SCT Data Table supported.

SMART Attributes Data Structure revision number: 16
Vendor Specific SMART Attributes with Thresholds:
ID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE
  1 Raw_Read_Error_Rate     0x000b   100   100   050    Pre-fail  Always       -       0
  2 Throughput_Performance  0x0005   100   100   050    Pre-fail  Offline      -       0
  3 Spin_Up_Time            0x0027   100   100   001    Pre-fail  Always       -       7754
  4 Start_Stop_Count        0x0032   100   100   000    Old_age   Always       -       245
  5 Reallocated_Sector_Ct   0x0033   100   100   010    Pre-fail  Always       -       0
  7 Seek_Error_Rate         0x000b   100   100   050    Pre-fail  Always       -       0
  8 Seek_Time_Performance   0x0005   100   100   050    Pre-fail  Offline      -       0
  9 Power_On_Hours          0x0032   039   039   000    Old_age   Always       -       24601
 10 Spin_Retry_Count        0x0033   100   100   030    Pre-fail  Always       -       0
 12 Power_Cycle_Count       0x0032   100   100   000    Old_age   Always       -       234
 23 Helium_Condition_Lower  0x0023   100   100   075    Pre-fail  Always       -       0
 24 Helium_Condition_Upper  0x0023   100   100   075    Pre-fail  Always       -       0
191 G-Sense_Error_Rate      0x0032   100   100   000    Old_age   Always       -       5
192 Power-Off_Retract_Count 0x0032   100   100   000    Old_age   Always       -       167
193 Load_Cycle_Count        0x0032   100   100   000    Old_age   Always       -       1636
194 Temperature_Celsius     0x0022   100   100   000    Old_age   Always       -       32 (Min/Max -6/53)
196 Reallocated_Event_Count 0x0032   100   100   000    Old_age   Always       -       0
197 Current_Pending_Sector  0x0032   100   100   000    Old_age   Always       -       0
198 Offline_Uncorrectable   0x0030   100   100   000    Old_age   Offline      -       0
199 UDMA_CRC_Error_Count    0x0032   200   200   000    Old_age   Always       -       0
220 Disk_Shift              0x0002   100   100   000    Old_age   Always       -       17563649
222 Loaded_Hours            0x0032   045   045   000    Old_age   Always       -       22278
223 Load_Retry_Count        0x0032   100   100   000    Old_age   Always       -       0
224 Load_Friction           0x0022   100   100   000    Old_age   Always       -       0
226 Load-in_Time            0x0026   100   100   000    Old_age   Always       -       524
240 Head_Flying_Hours       0x0001   100   100   001    Pre-fail  Offline      -       0

SMART Error Log Version: 1
No Errors Logged

SMART Self-test log structure revision number 1
Num  Test_Description    Status                  Remaining  LifeTime(hours)  LBA_of_first_error
# 1  Extended offline    Aborted by host               90%     23516         -
# 2  Short offline       Completed without error       00%     23504         -

SMART Selective self-test log data structure revision number 1
 SPAN  MIN_LBA  MAX_LBA  CURRENT_TEST_STATUS
    1        0        0  Not_testing
    2        0        0  Not_testing
    3        0        0  Not_testing
    4        0        0  Not_testing
    5        0        0  Not_testing
Selective self-test flags (0x0):
  After scanning selected spans, do NOT read-scan remainder of disk.
If Selective self-test is pending on power-up, resume after 0 minute delay.

The above only provides legacy SMART information - try 'smartctl -x' for more
```

除了大容量 HDD，自然还要一块 SSD 系统盘，而且性能不能太凑合。二手三星 OEM 性能没得说，只是部分型号有 [0E 问题](https://www.chiphell.com/thread-2443478-1-1.html)，绕过即可。最后闲鱼挑了一块 PM961 256G，作为系统盘大小适中。:spoiler[其实实际上还是因为预算限制，谁不希望硬盘越大越好呢。]

## 平台

2025 年中的新品，毫无疑问已经在 DDR5 + PCIe 5.0 时代。作为一台 HomeLab，我们显然不需要这么新的平台、这么高端的性能，和游戏玩家、富哥去抢新品硬件。相反，我们可以去寻找被玩家更新换代的 N-1、N-2 代平台。内存上，当时 DDR4 在性能和价格上取得了比较好的平衡。

## GPU

至于平台 PCIe 版本的选择，其实是受到了 GPU 选择的影响。当时的我认为硬件决定一切，所有软件障碍都可以克服，便忽视了一切软件栈和兼容性，专注于大显存、大带宽的性价比，AMD Instinct MI50 成为了十分亮眼的选择。

32GB 4096bit HBM2，1024GB/s 超大带宽。作为少有的低价 HBM 显卡，事实上直到今天，它的显存容量和带宽配置依然薄纱市面上几乎所有消费级显卡，直到 4090 才以 1.01TB/s 的带宽勉强追平，到 5090 才赶上 32GB 的显存容量。

更为关键的是，这张卡在 PDD 上最低只要 500 块！甚至比我的硬盘还要便宜！看到推文不久我就决定，就它了！为了充分发挥性能，此卡 PCIe 4.0 接口，也成为我后续平台选择的硬性标准之一。

## CPU
