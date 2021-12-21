---
title: Security07-前后端分离架构的登录
date: 2021-12-21 22:39:06
categories: 不周山
tags: 把SpringSecurity玩明白
---

尽管我已经开始怀疑起前后端分离的意义了，但这事儿还是得做下去，也不是特别难，这篇分述前后端各自要做的事。
<!--more-->
# 前端 index.html
因为 Spring Security 的 formLogin 默认是按“表单”提交的，所以 toLogin() 方法里有两点稍微特殊：1) 提交数据需要为 a=1&b=2 这样形式的字符串，2) 请求配置里显式声明Content-Type这个头的值为'application/x-www-form-urlencoded'

```html
<div id="app">
  <div v-if="token" class="has-login">你好，{{token}} 已登录，点击按钮
    <button @click="toLogout">注销</button>
  </div>
  <div v-else class='login-form'>
    <input v-model="form.username"/>
    <input type="password" v-model="form.password"/>
    <button @click="toLogin">login</button>
  </div>
</div>

<script>
  const http = axios.create({
    baseURL: 'http://127.0.0.1:8088/'
  })

  new Vue({
    el: '#app',
    data: {
      token: '',
      form: {
        username: 'sean',
        password: '123'
      }
    },
    created() {
      this.token = localStorage.getItem('token')
    },
    methods: {
      toLogout() {
        localStorage.removeItem('token')
        this.token = ''
      },
      toLogin() {
        http.post('/login', `username=${this.form.username}&password=${this.form.password}`,
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).then(({data}) => {
          if (data.token) {
            this.token = data.token
            localStorage.setItem('token', this.token) // 目前后端拿用户名作为token值返了回来
          } else {
            alert(data.msg)
          }
        })
      }
    }
  })
</script>
```

# 后端
代码变动也不多，主要是添加了两个回调处理器，设置允许跨域

![前后端分离登录](login.jpg)

## 登录设定
可能需要看 org.springframework.security.config.annotation.web.configurers.AbstractAuthenticationFilterConfigurer 才能知道 formLogin 中要改的有：1) loginProcessingUrl, 2) successHandler, 3) failureHandler

```java
public class MySecurityConfig extends WebSecurityConfigurerAdapter {
    // ...
    protected void configure(HttpSecurity http) throws Exception {
        http
            .formLogin(form -> form
                .loginProcessingUrl("/login")
                .successHandler(myAuthenticationSuccessHandler)
                .failureHandler(myAuthenticationFailureHandler)
            );
```
```
@Component
public class MyAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        PrintWriter out = null;
        try {
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json; charset=utf-8");
            out = response.getWriter();
            out.write("{\"code\": 0, \"msg\": \"登录成功\", \"token\": \""+authentication.getName()+"\"}");
        } finally {
            if (out != null) {
                out.flush();
                out.close();
            }
        }
    }
}
```
```
@Component
public class MyAuthenticationFailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        PrintWriter out = null;
        try {
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json; charset=utf-8");
            out = response.getWriter();
            out.write("{\"code\": 1, \"msg\": \""+ exception.getMessage() +"\"}");
        } finally {
            if (out != null) {
                out.flush();
                out.close();
            }
        }
    }
}
```

## 跨域
先看 [文档](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html), 说了要做两处设置：开启 http.cors(withDefaults()), 然后暴露一个 CorsConfigurationSource Bean。自己代码里http.cors()没传入withDefaults()，按 [samples库示例文件](https://github.com/spring-projects/spring-security-samples/blob/main/servlet/spring-boot/java/hello-security-explicit/src/main/java/example/SecurityConfiguration.java) 可知它来自 org.springframework.security.config.Customizer 这个类。
```java
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			// by default uses a Bean by the name of corsConfigurationSource
			.cors(withDefaults())
			...
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(Arrays.asList("https://example.com"));
		configuration.setAllowedMethods(Arrays.asList("GET","POST"));
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
```

