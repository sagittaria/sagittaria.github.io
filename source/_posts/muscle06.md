---
title: Security06-鉴权-hasAuthority
date: 2021-12-19 16:42:00
categories: 不周山
tags: 把SpringSecurity玩明白
---

这篇讲把角色名和权限名都用作Authority，从而在应用里可以同时使用 @PreAuthorize("hasRole('ADMIN')") 和 @PreAuthorize("hasAuthority('放火')") 来进行鉴权。
<!--more-->
通过本篇实验确定了 Jaeger 项目里的鉴权逻辑，自己写的部分可以大大简化。

# 实体关系
用户和角色通过中间表做成多对多关系，角色和权限(Permission)通过中间表做成多对多关系。

![实体关系](ER.jpg)

# 代码说明
详细变动情况见文末，这儿做点简要说明。下图右侧就是些Entity、JPARepository的变动和新增(即为了实现用户与角色、角色与权限的多对多结构)，以及插入测试数据的SQL语句，没什么特殊的。左侧从上往下依次说。

## MyUserDetails
增加 roleList 和 permissionList 两个成员，在构造方法里赋值。此外在getAuthorities方法里，将 role.name 和 permission.name 都做成 SimpleGrantedAuthority，加为 grantedAuthorities 返回出去。

**注意：按上篇记忆，存在数据库里的角色名必须以 ROLE_ 开头！**

## MyUserDetailsService
userRepository.findByUsername 之后，继续根据 userId 去获取该用户的所有 Role，根据所有 RoleIds 去获取所有的 Permission，再把所有 Role 和 Permission 以列表形式传进 MyUserDetails 的新构造方法中。

## IndexController
修改 authentication.getAuthorities() 的结果变量名为 authorities，因为此时 authorities 确实已不局限于为角色名了。

## PermissionController
作为RestController，直接返回字符串作为响应，用不着去解析视图。

使用@PreAuthorize("hasAuthority('放火')")来描述这个方法需要的authority。

## frontpage.html
修改视图上的变量名：role -> authorities，然后做三个超链接，调用 PermissionController 里写的接口。

## 实现效果
前一篇 hasRole 的判定依然有效，现在 frontpage 上三个超链接，也必须有相应的 authority 才能操作。

# 文件变动
图片太大了，最好在新窗口打开以便无缩放查看。

![文件变动详情](PreAuthorize.png)
