---
title: Security01-换用自己的登录页
date: 2021-12-10 10:42:43
categories: 不周山
tags: 把SpringSecurity玩明白
---

这是《把SpringSecurity玩明白》的第一篇，从项目初始化到更换定制度的登录页。不要忘了初心，尽可能为每一个点都找到坚实的“依据”。
<!--more-->

在 [start.spring.io](https://start.spring.io) 上初始化项目，加入web、security、thymeleaf(手搓前端页面)，然后就开始吧。

# 依赖 pom.xml
看下pom文件，确保里面有这三项
```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```
用idea打开项目之后，点一下 Download Sources and Documentation，方便以后全局搜源码。

![下载源码和文档](下载源码和文档.jpg)

# 应用配置文件 application.yml
初始化一个用户：sean/123
```
spring:
  application:
    name: muscle

  security:
    user:
      name: sean
      password: 123
```
是怎么知道的有spring.security.user.name这样的变量？什么配置也不做，直接启动时控制台会打印出一句话 Using generated security password:

![生成的密码](生成的密码.jpg)

全局搜索，找到 UserDetailsServiceAutoConfiguration 这个文件

![搜索](搜索.jpg)

打开这个文件，在里面找到SecurityProperties，并跳去它的源码，见它有个@ConfigurationProperties(prefix = "spring.security")注解，说明是springboot自动配置用到的属性，并且内部定义的静态类User有name、password、roles等成员，这样才知道可以在application.yml里配置name和password。顺便也能发现不配置的话默认用户名是“user”

![可配置属性](可配置属性.jpg)

# security配置文件
去GitHub上搜索spring-security-samples这个库，在其README页面有一个链接 [Hello Security with Explicit Configuration - Spring Boot](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/spring-boot/java/hello-security-explicit), 这里面的SecurityConfiguration.java是默认配置的显式描述

![默认配置](默认配置.jpg)

再结合 [文档](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/form.html) 上给出的提示

![文档-自定义登录页面](文档-自定义登录页面.jpg)

做出自己的 MySecurityConfig.java，将登录页指定为 /loginpage（此处同时将登陆接口指定为了 POST /loginpage）

```
@EnableWebSecurity
public class MySecurityConfig extends WebSecurityConfigurerAdapter {
    protected void configure(HttpSecurity http) throws Exception {
        http
                .authorizeRequests(authorize -> authorize
                        .anyRequest().authenticated()
                ) // 以上配置规定所有请求都需要先认证
                .formLogin(form -> form
                        .loginPage("/loginpage")
                        .permitAll()); // 登陆接口
    }
}
```

# 控制器及页面
用的Thymeleaf，所以控制器只要返回视图名字符串。视图放在 src/main/resources/templates/ 下面
## IndexController
```
@Controller
public class IndexController {
    @GetMapping("/")
    public String index() {
        return "frontpage";
    }

    @GetMapping("/loginpage")
    public String loginPage() {
        return "loginpage";
    }

}
```
## loginpage.html
```
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:th="https://www.thymeleaf.org">
<form method="post" th:action="@{/loginpage}">
    <div>
        <input name="username" placeholder="Username" type="text"/>
    </div>
    <div>
        <input name="password" placeholder="Password" type="password"/>
    </div>
    <input type="submit" value="Log in"/>
</form>
</html>
```
## frontpage.html
```
随便什么内容，对应根地址 http://localhost:8080/
```

# 最终效果
1. 输入 http://localhost:8080/ 回车，因为未登录过所以会
2. 跳到 http://localhost:8080/loginpage 自定义的登录表单页，填上 sean、123 登录成功后
3. 会自动跳回 http://localhost:8080/, 能看到 frontpage.html 里的内容
