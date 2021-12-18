---
title: Security04-鉴权架构
date: 2021-12-17 14:18:25
categories: 不周山
tags: 把SpringSecurity玩明白
---

继续整概念，这篇主要还是翻译官方[文档](https://docs.spring.io/spring-security/reference/servlet/authorization/architecture.html)
<!--more-->

# Authorities
认证时，由 AuthenticationManager 把 GrantedAuthority 对象赋到 Authentication 对象上，即代表把相应的 authorities 授予了 principal

GrantedAuthority 有个实现叫做 SimpleGrantedAuthority，用字符串来代表一项 authority

自带的 AuthenticationProvider **都是**用 SimpleGrantedAuthority 去填充 Authentication 对象的（原文：All AuthenticationProviders included with the security architecture use SimpleGrantedAuthority to populate the Authentication object.）

# Pre-Invocation Handling
当方法被调用或者接到网络请求时，由 AccessDecisionManager 依据 Authentication 上具有的 GrantedAuthority 来判定是否允许这次 invocation 继续进行。 

## AccessDecisionManager
AccessDecisionManager 接口有三个方法
```
void decide(Authentication authentication, Object secureObject,
	Collection<ConfigAttribute> configAttributes) throws AccessDeniedException;

boolean supports(ConfigAttribute attribute);

boolean supports(Class clazz);
```
### decide
执行鉴权的逻辑，传入的三个参数，authentication表示谁，secureObject是被访问对象，configAttributes指访问 secureObject 所需要的权限
### supports(ConfigAttribute)
由 AbstractSecurityInterceptor 调用，判断本 AccessDecisionManager 能不能处理传入的 ConfigAttribute
### supports(Class)
由 security interceptor 的一个具体实现类调用，来判断这个 AccessDecisionManager 能否处理(由本security interceptor implementation)传入的 secureObject

# Voting-Based AccessDecisionManager Implementations
待理解

# 思考题：ConfigAttribute 和 GrantedAuthority 有什么关系？
