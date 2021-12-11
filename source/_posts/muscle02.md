---
title: Security02-熟悉下Thymeleaf用法
date: 2021-12-11 16:03:55
categories: 不周山
tags: 把SpringSecurity玩明白
---

学Thymeleaf，看这一篇就够了：[从入门到吃灰](https://www.cnblogs.com/msi-chen/p/10974009.html)
<!--more-->

这系列重点在后端，所以前端页面就用Thymeleaf对付下。这个东西用起来也很简单，看看有哪些 th: 指令就行了。对muscle项目稍微改改：

# 页面
frontpage.html里加个 &lt;span th:text="${name}"&gt; 标签，等会儿控制器里给name赋了值，就能替换 &lt;span&gt; 里的文本内容了
```
<!DOCTYPE html>
<html xmlns:th="https://www.thymeleaf.org">
<div>hi <span th:text="${name}"></span>, welcome to the real world.</div>
</html>
```

# 控制器
index方法里获取当前用户，把name写到model里，还是返回视图名。这方法里传入的参数 org.springframework.ui.Model 就理解成后端向前端传数据的载体好了。
```
@Controller
public class IndexController {
    @GetMapping("/")
    public String index(Model model) {
        SecurityContext context = SecurityContextHolder.getContext();
        Authentication authentication = context.getAuthentication();
        String name = authentication.getName();
        model.addAttribute("name", name.toUpperCase());
        return "frontpage";
    }

    // ...
```
上面 SecurityContextHolder 是全局可用的，不需要显式传入。关于它的介绍可以见下图，或查阅 [这里原文](https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html#servlet-authentication-securitycontextholder)

![SecurityContextHolder](SecurityContextHolder.jpg) 

# 效果
登录成功之后，看到的页面是这样的

![hoo](hoo.jpg) 

撒花~
