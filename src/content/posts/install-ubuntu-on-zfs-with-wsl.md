---
title: 没有u盘，怎么重装系统？WSL2在裸盘上安装Ubuntu
description: null
publishedAt: 2026-08-26T03:16:45.004Z
updatedAt: 2026-08-26T03:16:45.004Z
category: 个人实用
tags:
    - HomeLab
    - 软件
    - 基础设施
    - ZFS
    - WSL
    - Ubuntu 安装
draft: false
---

## 起因

去年homelab搭建完成后，照着[OpenZFS官方安装教程](https://openzfs.github.io/openzfs-docs/Getting%20Started/Ubuntu/Ubuntu%2022.04%20Root%20on%20ZFS.html#)装了系统。但是可能系统安装过程有点小问题，还有之后改grub参数、加pcie和cpu低功耗模式、配置zram等等事情，系统引导搞炸了很多次。最后一次搞炸以后也一直没精力修，这个暑假想了想不如直接把系统盘格了重装，就有了这一次经历。

然而安装的过程不是一帆风顺。由于当时还没放假，我u盘落在学校没带回家……没有空余u盘，怎么重装系统？

第一个想到的是pxe网络启动。去年配置完系统盘后，我似乎尝试过pxe启动，在我的笔记本上有相关服务器配置和iso文件。但是这部分我找不到与ai对话的历史记录以及相关文档了，随便捣鼓了两下没搞起来。:spoiler[这就是我需要建立博客站的重要原因！]

想到pxe阶段10mbps的可怜速度，还不知道会不会拖慢后续安装时的读盘……考虑了一下还是放弃了。

考虑到linux没有设备数之类的玩意，我的系统上（当时）也没有安装显卡等外部pcie设备，应该都只需要原生驱动，这不禁让我考虑通过已有系统在空磁盘上安装ubuntu的可能性。显然，在Windows上安装ubuntu缺乏基本的命令通用性，~~连chroot都没有你告诉我怎么装第二个系统~~，肯定是在linux虚拟机内挂在挂载空盘、安装新系统。

一开始我使用vmware。在解决了usb无法挂载、没有直通等等问题后，无法直接读取硬盘裸盘的问题，还是无法解决。可能是因为usb转nvme芯片的问题？总之我多方搜索后最终放弃，将目光投向了wsl。

## wsl的优势

性能上，wsl以hyper-v虚拟机的形式运行，直接走cpu硬件虚拟化，cpu性能自然没的说。对于我这种开启了hyper-v和wsl的系统，虽然vmware也能启动虚拟机，但无法勾选cpu硬件虚拟化。打命令的时候也能明显感觉到延迟，~~而且延迟不小，感觉比200ms的shh还要卡~~

另外，由于wsl的shell原生运行在Windows terminal中，可以直接从Windows剪贴板粘贴命令和复制输出，方便直接从教程中拷贝命令，也方便把报错信息拿去搜索或者问ai。

:[spoiler]更进一步，你甚至可以在wsl内配置好codex等agent工具，然后一个/goal让他帮忙安装系统。这很vibe，我还没有这么先进（

## “重装”wsl

在wsl上配置zfs系统也没那么轻松，因为第一个问题就是，wsl内核并没有编译包含openzfs内核模块，且wsl内核也不包含动态加载的模块。所以唯一的选择就是重新编译wsl内核并替换。

好在有大佬写脚本为我们解决了这一问题。[https://github.com/alexhaydock/zfs-on-wsl](https://github.com/alexhaydock/zfs-on-wsl)

同时，大佬在博客中还提供了使用[usbipd](https://learn.microsoft.com/en-us/windows/wsl/connect-usb)，将外部usb设备穿透给wsl独占使用的方法，为后续我外接硬盘提供了很大的帮助。

## 安装Ubuntu，但是有点不一样

说真的，安装Ubuntu Root on ZFS本身，openzfs的教程已经相当详细，逐行命令解释，完全是手把手的教程。要在wsl中安装，要注意几点：

- 命令运行环境是一个正在运行的ubuntu系统，而非livecd或iso
   *在安装过程中，这似乎没有什么影响。只不过最后一步`zpool export`后不必重启宿主机了，而是执行usbipd的解除绑定和Windows的安全删除即可*
- 安装目标是一块usb连接的空硬盘，而非系统磁盘
    *这一点要注意安装时使用`/dev/disk/by-id/`，这本身也是教程推荐的做法。我的外接硬盘盒没有透传ssd本身`wwn-`或`nvme-`开头的id，只有一个`usb-`开头的路径。D老师说zpool实际会通过磁盘本身的guid来识别磁盘，即使我外接硬盘盒，在配置时使用`usb-`开头的路径，最终也没有影响磁盘在物理机上直接原生启动。*
- `/mnt`目录在wsl中已用作挂载Windows `drvfs`的目录，为避免冲突需要使用另外的文件夹
    *我是新建了一个`/target`目录，替代教程中的所有`/mnt`*
- **GRUB安装时不应修改宿主机的uefi启动条目**
    根据D老师的指导：
    >原教程在 chroot 内执行：
    >
    >```bash
    >grub-install --target=x86_64-efi --efi->directory=/boot/efi \
    >    --bootloader-id=ubuntu --recheck
    >```
    >
    >这会将 GRUB 安装到**宿主机的 UEFI NVRAM**，对于直接安装到另一块物理盘并用于不同机器的场景，**绝不可行**。
    >
    >**必须改为**：
    >
    >```bash
    >grub-install --target=x86_64-efi --efi-directory=/boot/efi \
    >    --bootloader-id=ubuntu --recheck --removable --no-nvram
    >```
    >`--removable`：将 GRUB 安装到 `EFI/BOOT/BOOTx64.EFI`，这是 UEFI 规范规定的可移动媒介/备用启动路径，**物理机无需 NVRAM 条目即可启动**。
    >
    >`--no-nvram`：防止修改宿主机的 UEFI 启动项。
    >
    >如果希望物理机也能自动添加 UEFI 条目，可在物理机首次启动后，从该系统内执行一次 `sudo grub-install`（不带 `--removable` 和 `--no-nvram`）即可。 

## 一些额外优化

创建池的命令我没有完全按照教程操作，而是根据我的配置和需求作了一点调整：

- 我没有创建swap分区。我有48g的ram，几乎不会遇到内存不够的问题。即使有问题也可以先开启zram，最不济也可以临时开一个swap文件。同时，我的系统盘本身只有256g，没有必要让swap永久占据一块容量

- 除了默认的`lz4`透明压缩外，我为系统池启用了dedup去重，即在`zpool create ... rpool`中加一行`-O dedup=on`。ddt去重表据传会占用1-4G ram每tb存储，对于我256g系统盘而言，内存占用不过256mb-1gb，但是可以换来一定比例的空间节省，我觉得对我而言这是一笔划算的买卖。

> [!TIP] 系统盘上压缩和去重的实际效果
> 系统盘没有启用快照，安装有nvidia驱动、cuda、各类常用cli软件、nginx、几个docker，还有一些手写脚本等。总占用量目前不大，但是按数据类型来说，应该还是比较典型的系统盘。安装使用一个月后，rpool详细情况如下：
> ```bash
> lxh@lxhnas:~$ zpool status -D rpool
> dedup: DDT entries 445552, size 124M on disk, 72.1M in core
>
>bucket              allocated                       referenced          
>______   ______________________________   ______________________________
>refcnt   blocks   LSIZE   PSIZE   DSIZE   blocks   LSIZE   PSIZE   DSIZE
>------   ------   -----   -----   -----   ------   -----   -----   -----
>     1     371K   24.2G   15.1G   15.3G     371K   24.2G   15.1G   15.3G
>     2    53.8K   3.07G   2.03G   2.09G     115K   6.49G   4.25G   4.37G
>     4    6.45K    523M    277M    281M    35.0K   2.94G   1.56G   1.58G
>     8    3.26K    177M   80.3M   83.4M    28.4K   1.59G    763M    789M
>    16      378   19.6M   9.11M   9.59M    7.07K    391M    191M    200M
>    32       71   1.43M    454K    552K    3.28K   72.6M   22.2M   26.3M
>    64        7      5K      5K     28K      610    408K    408K   2.38M
>   128        1    512B    512B      4K      153   76.5K   76.5K    612K
>   256        2      1K      1K      8K      756    378K    378K   2.95M
> Total     435K   28.0G   17.5G   17.8G     561K   35.7G   21.8G   22.3G
> ``` 
> 
> 总逻辑数据，即`Referenced LSIZE` = **35.7GB**
> 实际物理存储，即`Allocated DSIZE` = **17.8GB**
> 
> 将压缩与去重的效果分开来看，具体而言：
> 若未去重但已压缩，磁盘占用约为`Referenced DSIZE` = **22.3 GB**
> 去重后实际磁盘占用：**17.8 GB**
> 使用`sudo zdb -DD rpool`命令查看：
> ```bash
> dedup = 1.25, compress = 1.64, copies = 1.02, dedup * compress / copies = 2.00
> ```
> 可以看到大部分空间收益由lz4压缩带来，这是因为系统盘中大量的二进制文件具有典型的高压缩率特征。同时，在没有手动安装或复制相同文件的情况下，块级去重率依然达到了`1.25`，同时ddt的内存占用仅`72.1M`，我认为这是一笔完全划算的买卖。
>整体而言，zfs特性总共为我带来`2.00x`的可用数据量，也就相当于把我256g的系统盘变成一块512g的盘，同时在性能上几乎是免费的午餐，何乐而不为呢？




