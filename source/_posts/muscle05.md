---
title: Security05-鉴权-hasRole
date: 2021-12-18 15:59:36
categories: 不周山
tags: 把SpringSecurity玩明白
---

本篇讲 @PreAuthorize("hasRole('ADMIN')") 这个注解的使用。
<!--more-->
# 说明
文件变动的详细情况见文末图，这里稍微做点解释。
## MySecurityConfig
从 security 5.6 开始，用 @EnableMethodSecurity 注解就能开启方法安全控制，即启用那些 @PreAuthorize 等注解了[0]，不需要再使用@EnableGlobalMethodSecurity
## MyUserDetails
改为把角色名作为authority，在getAuthorities方法中给出去
## User 实体类
增加role字段，用于存一个角色名。向数据库里加 sean 和 tom 两个用户，分别代表 ROLE_ADMIN 和 ROLE_USER 两个角色。**注意：使用 hasRole 时，数据库里存的角色名必须带 ROLE_ 前缀[1][2]**
## IndexController
新增两个方法，分别标上 @PreAuthorize("hasRole('ADMIN')") 和 @PreAuthorize("hasRole('USER')") 来鉴别用户是否有权访问。另外，还在原来的index方法里多做一个role变量，用于前端显示。
## frontpage.html
增加显示当前登录用户的角色(是个数组)，并加上两个分别通往 /admin 和 /user 的超链接
## adminpage.html 和 userpage.html
没什么好说的，就是加两个普通的页面

# 文件变动
![diff](diff.png)

# Refs.
[0] [Method Security](https://docs.spring.io/spring-security/reference/6.0/servlet/authorization/method-security.html)

[1] [SpringSecurity hasRole与hasAuthority的区别](https://blog.csdn.net/u014135206/article/details/117590326)

[2] [在controller层方法级别使用@PreAuthorize("hasRole('ADMIN')")](https://www.cnblogs.com/c2g5201314/p/13036656.html)
