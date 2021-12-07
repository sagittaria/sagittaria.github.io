---
title: 究竟要不要动态定义secured URLs
date: 2021-12-07 11:20:10
categories: 不周山
tags: 经历
---

我开始做jaeger业务单据的时候，自动冒出来的标题所说问题，稍微一想远就发现在系统里动态管理角色权限会带来很多麻烦。之前读文档的时候也见到了相关QA但没注意，现在有点悟了。
<!-- more -->

首先，很明显安全性会降低：数据库里随便改一行两行，所谓的安全控制直接就没了嘛。

其次，业务上有时候会需要根据当前用户（的角色）来执行不同的操作，如员工只能看到自己创建的单据、领导能看到所有人的单据——类似于这种情况下如果角色是允许动态增删改的，那么程序的正常流转都无法独立于数据，要频繁从数据库里查角色来做分支判断。

另外，SpringSecurity只负责管控“有没有权限”这一点，不应该切入到具体业务中。

最后贴一下[原文](https://docs.spring.io/spring-security/reference/servlet/appendix/faq.html#appendix-faq-dynamic-url-metadata)

![How do I define the secured URLs within an application dynamically?](appendix-faq-dynamic-url-metadata.jpg)

> [1] The FilterInvocation object contains the HttpServletRequest, so you can obtain the URL or any other relevant information on which to base your decision on what the list of returned attributes will contain.

```JAVA
public class MyFilterSecurityMetadataSource implements FilterInvocationSecurityMetadataSource {

    public List<ConfigAttribute> getAttributes(Object object) {
        FilterInvocation fi = (FilterInvocation) object;
            String url = fi.getRequestUrl();
            String httpMethod = fi.getRequest().getMethod();
            List<ConfigAttribute> attributes = new ArrayList<ConfigAttribute>();

            // Lookup your database (or other source) using this information and populate the
            // list of attributes

            return attributes;
    }

    public Collection<ConfigAttribute> getAllConfigAttributes() {
        return null;
    }

    public boolean supports(Class<?> clazz) {
        return FilterInvocation.class.isAssignableFrom(clazz);
    }
}
// For more information, look at the code for DefaultFilterInvocationSecurityMetadataSource.
```
