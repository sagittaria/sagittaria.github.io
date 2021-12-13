---
title: Security03-连接数据库验证用户名密码-未完成
date: 2021-12-11 21:16:11
categories: 不周山
tags: 把SpringSecurity玩明白
---

虽说这是最常规的做法，但是需要自己实现, 建议从 [Storage Mechanisms](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/storage.html) 开始看。
<!--more-->

这集开始涉及一些绕不开的关键概念，所以先对官方文档做些整理记录。

# 关系
UserDetails 是由 UserDetailsService 返回的

由 DaoAuthenticationProvider 来验证 UserDetails，然后返回一个 Authentication

这个 Authentication 持有一个 principal

这个 principal 就是 UserDetailsService 返回的 UserDetails

DaoAuthenticationProvider 是 AuthenticationProvider 接口的一种实现

DaoAuthenticationProvider 用 UserDetailsService 来获取用于比对的、真实正确的用户名、密码等信息

Spring Security 对 UserDetailsService 接口默认提供了 [in-memory](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/in-memory.html#servlet-authentication-inmemory) 和 [JDBC](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/jdbc.html#servlet-authentication-jdbc) 两种实现

# 指引

