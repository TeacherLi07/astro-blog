---
title: 没有U盘怎么重装系统？WSL2在裸盘上安装Ubuntu Root on ZFS 完整教程
description: 手把手教你无U盘、无PXE，利用WSL2和USB直通技术，在裸盘上安装Ubuntu Root on ZFS系统。涵盖WSL内核编译ZFS模块、GRUB防污染宿主机引导、ZFS池压缩去重优化及实际效果数据，适合HomeLab用户和系统重装爱好者。
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

去年 HomeLab 搭建完成后，照着 [OpenZFS 官方安装教程](https://openzfs.github.io/openzfs-docs/Getting%20Started/Ubuntu/Ubuntu%2022.04%20Root%20on%20ZFS.html#) 装了系统。但可能安装过程有点小问题，加上之后改 GRUB 参数、加 PCIe 和 CPU 低功耗模式、配置 zram 等操作，系统引导被搞炸了很多次。最后一次搞炸后一直没精力修，这个暑假想了想不如直接把系统盘格了重装，就有了这一次经历。

然而安装过程并非一帆风顺。由于当时还没放假，我的 U 盘落在学校没带回家……没有空余 U 盘，怎么重装系统？

第一个想到的是 PXE 网络启动。去年配置完系统盘后，我似乎尝试过 PXE 启动，笔记本上有相关服务器配置和 ISO 文件。但找不到与 AI 对话的历史记录及相关文档了，随便捣鼓两下没搞起来。

> :spoiler[这就是我需要建立博客站的重要原因！]

想到 PXE 阶段 10Mbps 的可怜速度，还不知道会不会拖慢后续安装时的读盘……考虑了一下还是放弃了。

考虑到 Linux 没有设备树之类的限制，我的系统上（当时）也没有安装显卡等外部 PCIe 设备，应该都只需要原生驱动，这不禁让我考虑通过已有系统在空磁盘上安装 Ubuntu 的可能性。显然，在 Windows 上安装 Ubuntu 缺乏基本的命令通用性，~~连 chroot 都没有你告诉我怎么装第二个系统~~，肯定是在 Linux 虚拟机内挂载空盘、安装新系统。

一开始我使用 VMware。在解决了 USB 无法挂载、没有直通等问题后，无法直接读取硬盘裸盘的问题仍然无法解决。可能是因为 USB 转 NVMe 芯片的问题？多方搜索后最终放弃，将目光投向了 WSL。

## WSL 的优势

性能上，WSL 以 Hyper-V 虚拟机的形式运行，直接走 CPU 硬件虚拟化，CPU 性能自然没得说。对于我这种开启了 Hyper-V 和 WSL 的系统，虽然 VMware 也能启动虚拟机，但无法勾选 CPU 硬件虚拟化。打命令时也能明显感觉到延迟，~~而且延迟不小，感觉比 200ms 的 SSH 还要卡~~。

另外，由于 WSL 的 Shell 原生运行在 Windows Terminal 中，可以直接从 Windows 剪贴板粘贴命令和复制输出，方便直接从教程中拷贝命令，也方便把报错信息拿去搜索或者问 AI。

> :spoiler[更进一步，你甚至可以在 WSL 内配置好 Codex 等 Agent 工具，然后一个 `/goal` 让他帮忙安装系统。这很 Vibe，我还没有这么先进。]

## “重装” WSL

在 WSL 上配置 ZFS 系统也没那么轻松，因为第一个问题就是：WSL 内核并没有编译包含 OpenZFS 内核模块，且 WSL 内核也不包含动态加载模块的能力。所以唯一的选择就是重新编译 WSL 内核并替换。

好在有大佬写脚本为我们解决了这一问题：  
[https://github.com/alexhaydock/zfs-on-wsl](https://github.com/alexhaydock/zfs-on-wsl)

同时，大佬在博客中还提供了使用 [usbipd](https://learn.microsoft.com/en-us/windows/wsl/connect-usb) 将外部 USB 设备穿透给 WSL 独占使用的方法，为后续外接硬盘提供了很大帮助。

## 安装 Ubuntu，但是有点不一样

说真的，安装 Ubuntu Root on ZFS 本身，OpenZFS 的教程已经相当详细，逐行命令解释，完全是手把手的教程。要在 WSL 中安装，要注意几点：

- **命令运行环境**是一个正在运行的 Ubuntu 系统，而非 LiveCD 或 ISO。  
  在安装过程中，这似乎没有什么影响。只不过最后一步 `zpool export` 后不必重启宿主机，而是执行 usbipd 的解除绑定和 Windows 的安全删除即可。

- **安装目标**是一块 USB 连接的空硬盘，而非系统磁盘。  
  注意安装时使用 `/dev/disk/by-id/`，这本身也是教程推荐的做法。我的外接硬盘盒没有透传 SSD 本身的 `wwn-` 或 `nvme-` 开头的 ID，只有一个 `usb-` 开头的路径。D 老师说 ZPool 实际会通过磁盘本身的 GUID 来识别磁盘，即使使用 `usb-` 开头的路径，最终也没有影响磁盘在物理机上直接原生启动。

- `/mnt` 目录在 WSL 中已用作挂载 Windows `drvfs` 的目录，为避免冲突需要使用另外的文件夹。  
  我新建了一个 `/target` 目录，替代教程中的所有 `/mnt`。

- **GRUB 安装时不应修改宿主机的 UEFI 启动条目**。  
  根据 D 老师的指导：

  > 原教程在 chroot 内执行：
  > ```bash
  > grub-install --target=x86_64-efi --efi-directory=/boot/efi \
  >     --bootloader-id=ubuntu --recheck
  > ```
  > 这会将 GRUB 安装到**宿主机的 UEFI NVRAM**，对于直接安装到另一块物理盘并用于不同机器的场景，**绝不可行**。
  >
  > **必须改为**：
  > ```bash
  > grub-install --target=x86_64-efi --efi-directory=/boot/efi \
  >     --bootloader-id=ubuntu --recheck --removable --no-nvram
  > ```
  > - `--removable`：将 GRUB 安装到 `EFI/BOOT/BOOTx64.EFI`，这是 UEFI 规范规定的可移动媒介/备用启动路径，**物理机无需 NVRAM 条目即可启动**。
  > - `--no-nvram`：防止修改宿主机的 UEFI 启动项。
  >
  > 如果希望物理机也能自动添加 UEFI 条目，可在物理机首次启动后，从该系统内执行一次 `sudo grub-install`（不带 `--removable` 和 `--no-nvram`）即可。

## 一些额外优化

创建池的命令我没有完全按照教程操作，而是根据我的配置和需求作了一点调整：

- 我没有创建 swap 分区。我有 48GB RAM，几乎不会遇到内存不够的问题。即使有问题也可以先开启 zram，最不济也可以临时开一个 swap 文件。同时，系统盘本身只有 256GB，没有必要让 swap 永久占据一块容量。

- 除了默认的 `lz4` 透明压缩外，我为系统池启用了 dedup 去重，即在 `zpool create ... rpool` 中加一行 `-O dedup=on`。DDT 去重表据传会占用 1-4GB RAM 每 TB 存储，对于我 256GB 系统盘而言，内存占用不过 256MB-1GB，但可以换来一定比例的空间节省，我觉得这是一笔划算的买卖。

> [!TIP]
> **系统盘上压缩和去重的实际效果**  
> 系统盘没有启用快照，安装有 NVIDIA 驱动、CUDA、各类常用 CLI 软件、nginx、几个 Docker，还有一些手写脚本等。总占用量目前不大，但按数据类型来说，应该还是比较典型的系统盘。安装使用一个月后，rpool 详细情况如下：
>
> ```bash
> lxh@lxhnas:~$ zpool status -D rpool
> dedup: DDT entries 445552, size 124M on disk, 72.1M in core
>
> bucket              allocated                       referenced          
> ______   ______________________________   ______________________________
> refcnt   blocks   LSIZE   PSIZE   DSIZE   blocks   LSIZE   PSIZE   DSIZE
> ------   ------   -----   -----   -----   ------   -----   -----   -----
>      1     371K   24.2G   15.1G   15.3G     371K   24.2G   15.1G   15.3G
>      2    53.8K   3.07G   2.03G   2.09G     115K   6.49G   4.25G   4.37G
>      4    6.45K    523M    277M    281M    35.0K   2.94G   1.56G   1.58G
>      8    3.26K    177M   80.3M   83.4M    28.4K   1.59G    763M    789M
>     16      378   19.6M   9.11M   9.59M    7.07K    391M    191M    200M
>     32       71   1.43M    454K    552K    3.28K   72.6M   22.2M   26.3M
>     64        7      5K      5K     28K      610    408K    408K   2.38M
>    128        1    512B    512B      4K      153   76.5K   76.5K    612K
>    256        2      1K      1K      8K      756    378K    378K   2.95M
> Total     435K   28.0G   17.5G   17.8G     561K   35.7G   21.8G   22.3G
> ```
>
> - 总逻辑数据，即 `Referenced LSIZE` = **35.7GB**  
> - 实际物理存储，即 `Allocated DSIZE` = **17.8GB**  
>
> 将压缩与去重的效果分开来看：
> - 若未去重但已压缩，磁盘占用约为 `Referenced DSIZE` = **22.3GB**
> - 去重后实际磁盘占用：**17.8GB**
>
> 使用 `sudo zdb -DD rpool` 命令查看：
> ```bash
> dedup = 1.25, compress = 1.64, copies = 1.02, dedup * compress / copies = 2.00
> ```
>
> 可以看到大部分空间收益由 lz4 压缩带来，这是因为系统盘中大量的二进制文件具有典型的高压缩率特征。同时，在没有手动安装或复制相同文件的情况下，块级去重率依然达到了 `1.25`，DDT 的内存占用仅 `72.1M`，我认为这是一笔完全划算的买卖。
>
> 整体而言，ZFS 特性总共为我带来 **2.00×** 的可用数据量，也就相当于把我 256GB 的系统盘变成一块 512GB 的盘，同时在性能上几乎是免费的午餐，何乐而不为呢？
