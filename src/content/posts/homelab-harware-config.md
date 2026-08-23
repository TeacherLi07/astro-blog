---
title: 个人HomeLab配置——硬件篇（1）
description: 个人HomeLab硬件选型全记录：基于AMD R5 5600、MI50 32GB显卡、14T硬盘等配置，分享捡垃圾心得、避坑指南与性价比权衡。
publishedAt: 2026-08-21
updatedAt: 2026-08-22T19:16:02.109Z
category: 个人实用
tags:
  - HomeLab
  - 硬件
  - 基础设施
draft: false
---

> [!NOTE]
> 此文主要由回忆而成，细节较少。涉及价格和性价比的分析部分，参考性较差。

博客站建成后的第一篇实用文章，给到我的 HomeLab/NAS。无论是从逻辑上还是实际搭建时间上，这都应该是第一篇文章，不过应该在一年前（

## 硬件选型（2025 年中）

> [!TIP] 先写结论，初始硬件选型，购买时间，来源/价格

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

一台 HomeLab/NAS，最关键的是什么？有点够用的**性能**，够用的**内存**，够用的**存储**——和够用的**预算**。性价比是我考虑的第一要务，硬件选型的主要宗旨就是 **捡垃圾**。

实际需求上，对于 NAS 部分的功能，我需要**文件管理、文件共享、qbit 下载、在线播放**等功能，其中涉及网页部分的功能还需要**反代**。

HomeLab 方面，我需要一张显卡。在 LLM 时代，大就是好，好就是大，**大显存、大带宽**为宜。

其他杂项还包括网页后端，Minecraft 服务器等等。

那么对应到硬件，我需要一个核心不太少的 CPU，足够 GPU 使用的内存，越快越好的系统盘和越大越好的存储盘。平台太新价格昂贵，平台太老性能差、功耗高。

## HDD

NAS 的灵魂自然是硬盘，而且硬盘与其他配件几乎没有兼容性问题，最多就是机箱要有硬盘位。六月份在购物车里加了一块 **14T 硬盘**，600 块，到了七月份一看 800 了，还在涨，就跟着~~硬盘吧~~电脑吧评测室公众号看了几家店，直接入手了。一块 3 万小时的 **东芝 MG08**。

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

除了大容量 HDD，自然还要一块 SSD 系统盘，而且性能不能太凑合。二手三星 OEM 性能没得说，只是部分型号有 [0E 问题](https://www.chiphell.com/thread-2443478-1-1.html)，绕过即可。最后闲鱼挑了一块 **PM961 256G**，作为系统盘大小适中。:spoiler[其实实际上还是因为预算限制，谁不希望硬盘越大越好呢。]

## 内存

2025 年中的新品，毫无疑问已经在 **DDR5 + PCIe 5.0** 时代。作为一台 HomeLab，我们显然不需要这么新的平台、这么高端的性能，和游戏玩家、富哥去抢新品硬件。相反，我们可以去寻找被玩家更新换代的 N-1、N-2 代平台。内存上，当时 **DDR4** 在性能和价格上取得了比较好的平衡。

## GPU

至于平台 PCIe 版本的选择，其实是受到了 GPU 选择的影响。当时的我认为硬件决定性能，软件障碍都可以克服，便忽视了软件栈和兼容性，专注于大显存、大带宽的性价比，**AMD Instinct MI50** 成为了十分亮眼的选择。

**32GB 4096bit HBM2，1024GB/s** 超大带宽。作为少有的低价 HBM 显卡，事实上直到今天，它的显存容量和带宽配置依然薄纱市面上几乎所有消费级显卡，直到 **4090** 才以 1.01TB/s 的带宽勉强追平，到 **5090** 才赶上 32GB 的显存容量。

更为关键的是，这张卡在 PDD 上最低只要 **500 块**！甚至比我的硬盘还要便宜！看到推文不久我就决定，就它了！为了充分发挥性能，此卡 **PCIe 4.0** 接口，也成为我后续平台选择的硬性标准之一。

## 平台

确定下 **DDR4 + PCIe 4.0**，平台选择就已经不多了。

高性价比的 **E3/E5** 平台由于不支持 PCIe 4.0 直接 pass，而 Intel 后续服务器平台，由于主板芯片组不再能够通过家用芯片组魔改，CPU 流出的也较少，之后的至强可扩展系列性价比都相当低。

AMD 服务器平台，也即 **EPYC** 系列，同样因为没有芯片组魔改，加之多内存通道、多 PCIe 带来的信号完整性压力，主板价格同样居高不下，2000 起步。**7002、7003** 系列 CPU 也不便宜。

看完 Server 平台，往下是 **HEDT** 平台。这方面 Intel 早已砍掉，往前是 X99，往后并入至强。AMD 这边是 Ryzen Pro，散片量少，需求也少，打不下成本。

歪门邪道的选择全部 pass，那剩下的只有桌面平台可以选了。I 家从 **11 代 Rocket Lake** 开始支持，A 家则是 **Zen2** 起步。简单比价就可以知道，11 代酷睿普遍比 Zen3 价格还高，太保值对我这种捡垃圾的反而是坏事。权衡性能和预算，最后大致选定在 **Zen3** 平台。

## CPU

在 CPU 的选择上，我简单使用 CPU-Z benchmark 成绩作为性能参数，计算**分数/价格**作为“性价比”指标。严格来说这并不严谨，没有人保证过 CPU-Z benchmark 分数与性能是完全线性的关系，不过在我这做个大致定性的排序还是够用的。

虽然已经基本确定 Zen3，但是比较时也纳入了几款 Xeon、EPYC、Core 产品。作为我的体感参照，也同时参考了我旧笔记本 **i5-5200U**，和新笔记本 **U9-285H** 的成绩。

在比较时，大致遵循**多核为主、单核不太低**的策略，毕竟我买来也不是为了打游戏，零点几 GHz 的单核睿频差异其实不太明显。同时由于 MI50 本身自带 miniDP 显示输出，可以被识别为显示设备而非纯计算设备，也有基本的（虽然性能较差）视频编解码器，我也不需要核显。

总之，最终选定了 **R5-5600 散片**，牺牲了 5600X 的高频和 5600GT 的核显，换来相对便宜的价格。

## 内存（续）

前面讨论了内存的速度，最重要的当然是内存容量。考虑到 VRAM 就有 32GB，为了避免出现 Worker 在内存里持有过大的数据集 OOM 的问题，考虑内存容量 **32GB 起步**。

但是 32GB 之外还得为系统留一点吧？如果是双插槽，只能 16+32=48GB 非对称双通道，而如果主板四插槽，可以更细粒度的配置 **2×(8GB+16GB)=48GB 的对称双通道**，性能更强，每 GB 单价更低。最终下单了两套套条，8GB×2 和 16GB×2，都是海盗船复仇者 DDR4 3000。

> [!IMPORTANT]
> 这里我必须剧透一下，:spoiler[480 块 48GB 内存，在当时看来也不错，更不提在内存大涨价的现在更是四根金条。然而一年后的现在，其中一根内存条无法点亮，**海盗船个人送保后确认为假货，淘宝商品下架店铺关店**……各位买内存条时千万擦亮眼睛，尽量避开**复仇者、骇客神条**等假货重灾区啊！]

## 主板

定下所有配套硬件后，主板已经基本确定了。Zen3 + PCIe 4.0，也就肯定是 **B550** 芯片组。入门板型、四内存插槽，看下来也就 **华硕 Prime B550 M-K** 符合要求。~~其实本来希望可以自带 2.5G 网口的，但是高端版型价格太高，对 5600 来说溢价不划算，就没有买~~

## 杂项

剩下的没什么好说的：**机箱**是带硬盘位的最便宜的铁皮机箱；**风扇**买了三个普通无光风扇，甚至没有 PWM，还买一根风扇一拖三扩展线；**电源**是闲鱼二手杂牌，连 80PLUS 认证也没有，甚至不送电饭煲线；**散热器**闲鱼找了个支持 AM4 的最便宜的，古董成色，买来自己洗鳍片擦扇叶；MI50 不认显示设备，TB 最便宜**亮机卡**搞一张，再配一根 **x1 转 x16 线**接出；没有显示器想用笔记本显示，一个最便宜的**HDMI USB 采集卡**，在笔记本上用相机 App 看屏幕；米家 WiFi 控制**智能插座**，带并不准确的用电计量；板 U 附赠硅脂太垃圾，买了个杂牌标称 12W**硅脂**，好歹比原装的好一点……

总之就是周边硬件大缩水，能少花一块绝不多花五毛。

---

## 经验&总结

站在现在来看，这次装机有得有失。

教训方面，首先是预算过于紧张，导致部分硬件过度缩水，在后来也产生了一系列麻烦。包括尺寸刚好不够的机箱、假货内存、上置电源的垃圾风道。

成果方面，至少在我小半年的真实使用场景下，我对我的硬件选型还是相当满意的。各硬件的利弊基本都在我的考虑之中，没有出现意外的瓶颈或后悔。当然，不得不提的一环是，在硬件涨价潮下，此电脑身价大涨至少两倍，从 **3K 级别**捡垃圾 HomeLab，跃升为 **8K 级别**富哥主机，也为后来的一系列故事和事故埋下了伏笔……

---

至此，2025 年 7 月这次装机选购历程基本结束了。当然，后续装机和使用过程中一波三折，也有一些东西进行过更换、维修。关于 GPU 经历会单开一篇文章，在里面可能会顺便把其他改动一并介绍。
