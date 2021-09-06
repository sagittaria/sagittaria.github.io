---
title: Jaeger手记
date: 2021-07-20 22:23:17
categories: 不周山
tags: 经历
---

> 念兹在兹。

我用SpringBoot+Web+JPA+Security+JWT+MySQL搭了一套RBAC框架，起名为Jaeger(德语猎人，出自电影环太平洋)。这期间收获了对Java和Spring体系更丰富的认知，本文是对Jaeger项目中的后端Security部分做的小结。
<!--more-->

# 前言
我一直想自己写一套通用架子，能够在接到小活时直接用上，免去些枯燥重复的工作。

以前做的后端都是MongoDB+[Express](https://www.expressjs.com.cn/)的结构。这个组合虽说轻巧，全程JavaScript基本就能搞定，但在面对一些稍微复杂点的现实业务(明显关系型数据库更适用)时，确实感到用MongoDB不踏实。在试制Qida的时候，这点最终使我下定决心返Mongo归MySQL，同时返JS归Java、返Express归Spring（笑）

中间有一段时间我陷入了误区，特别执迷于要用上Gateway+Security，在网关层做认证(Authentication)和授权(Authorization)。其实网关后面放的应该是多个服务(微服务)，不是多个“系统”——如果有多个需要RBAC的系统的话，起码授权是要每个系统各做各的吧，不适合用一个网关作总入口。

按我现在的理解，正常架构是：__一个__ 系统有一个网关作为入口，内部有多个成功拆分开的服务提供业务功能，然而Jaeger未见必要，暂时是用不着SpringGateway。

这次做Jaeger的时候我花了挺久去理解SpringSecurity的理念，在这里记录下做备忘。在Jaeger中一切关于安全的配置的核心是MySecurityConfig这个类，我画了个脑图来帮助理解和记忆。

![SecurityConfig](/security_config.jpg)

MySecurityConfig类中的核心代码：

![SecurityConfigCode](/security_config_code.jpg)

总的来说，SpringSecurity帮忙做的是两件事：认证Authentication，授权Authorization，所涉及到的类分别是第一张图中不同底色的两部分。

# 认证
解决“你是谁”的问题。

## 异常处理
配置方式如下：
```
        http
                .exceptionHandling()
                .authenticationEntryPoint(myAuthenticationEntryPoint)
```
未登录情况下，访问一个需要登录才能访问的资源时，会被导向AuthenticationEntryPoint.

从字面意思上看AuthenticationEntryPoint是认证、入口、点三个词的组合，按Common Sense理解，没登录时访问了一个需要登录的资源，系统自然该引导你去登录的地方。

对于UsernamePasswordAuthenticationFilter，它默认用的是LoginUrlAuthenticationEntryPoint，可查看源码见它做的事情就是先保存要访问哪个资源(便于登录成功后自动转去原来要访问的资源)，再把用户导向登录表单页。

出于前后端分离的考虑，Jaeger中的myAuthenticationEntryPoint没有参照LoginUrlAuthenticationEntryPoint设计，仅是将捕获的异常包装在Result里返个json给前端。

```
public class MyAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, AuthenticationException e) throws IOException, ServletException {
        if (e != null) {
            Reply.send(httpServletResponse, Result.failed(e.getMessage()));
        }
    }
    // ...
```

## 用户名密码认证
自定义了一个MyUsernamePasswordAuthenticationFilter，塞在SpringSecurity过滤器链中UsernamePasswordAuthenticationFilter的位置：
```
        http
                .addFilterAt(myUsernamePasswordAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
```

### 认证过程
按我对文档的理解，UsernamePassword认证过程应该是这样的：
1. 登录请求POST /login 穿行过滤器链、碰到MyUsernamePasswordAuthenticationFilter时，在MyUsernamePasswordAuthenticationFilter内用前端传入的用户名密码封装成一个UsernamePasswordAuthenticationToken
2. MyUsernamePasswordAuthenticationFilter上注册有一个AuthenticationManager，即MyProviderManger，把上一步产生的UsernamePasswordAuthenticationToken扔给它进行用户名和密码验证
    - ProviderManger是AuthenticationManager最常见的实现（所以PM is an AM）
3. MyProviderManger下面挂了一个具体的MyUsernamePasswordAuthenticationProvider，调它来进行真正的用户名密码验证工作（和数据库里存的相比较）
    - ProviderManager可以挂多个Provider，如是，会循环调所有的Provider去认证XXFilter丢进的XXAuthenticationToken
4. MyUsernamePasswordAuthenticationProvider要实现(@Override)authenticate方法，在其中进行真正的用户名密码校验（会用到MyUserDetails和MyUserDetailsService）
5. 按MyUsernamePasswordAuthenticationProvider#authenticate处理结果：
    - 如果认证失败，抛出AuthenticationException，由MyAuthenticationFailureHandler处理
    - 如果没异常抛出，说明认证过程正常通过了，返回一个UsernamePasswordAuthenticationToken，并且它的authenticated属性为true
6. 如果认证是成功的，MyUsernamePasswordAuthenticationFilter#attemptAuthentication会把MyUsernamePasswordAuthenticationProvider里产生的UsernamePasswordAuthenticationToken送回去
7. 至于送回去哪儿，这点我没再跟代码或文档理解下去。反正UsernamePassword认证这一“过程”应该就此完成了

### MyUPAFilter
```
public class MyUsernamePasswordAuthenticationFilter extends AbstractAuthenticationProcessingFilter { // 参考 UsernamePasswordAuthenticationFilter

    @Autowired
    protected MyUsernamePasswordAuthenticationFilter(MyProviderManager myProviderManager,
                                                     MyAuthenticationSuccessHandler myAuthenticationSuccessHandler,
                                                     MyAuthenticationFailureHandler myAuthenticationFailureHandler) {
        super(new AntPathRequestMatcher("/login", "POST")); // 设定登录接口为 POST /login
        this.setAuthenticationManager(myProviderManager);
        this.setAuthenticationSuccessHandler(myAuthenticationSuccessHandler);
        this.setAuthenticationFailureHandler(myAuthenticationFailureHandler);
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException, IOException, ServletException {
        // AGAIN! 参考 UsernamePasswordAuthenticationFilter，这个attemptAuthentication方法应相当于是 post /login 的处理逻辑
        UsernamePasswordAuthenticationToken authRequest;
        try {
            WrappedRequest req = new WrappedRequest(request);
            User user = JSONUtil.toBean(req.getBody(), User.class);
            authRequest = new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword());
        } catch (Exception e) {
            throw new AuthenticationServiceException("认证服务异常：" + e.getMessage());
        }
        return this.getAuthenticationManager().authenticate(authRequest);
    }
}
```

#### MyProviderManager
```
public class MyProviderManager extends ProviderManager { // ProviderManager implements AuthenticationManager
    // note --> ProviderManager is the most commonly used implementation of AuthenticationManager

    @Autowired
    public MyProviderManager(MyUsernamePasswordAuthenticationProvider myUsernamePasswordAuthenticationProvider) {
        super(myUsernamePasswordAuthenticationProvider);
    }

    // @Override // 用不着重写authenticate，直接用父类ProviderManager的实现就行了
    // public Authentication authenticate(Authentication auth) {...
}
```

##### MyUPAProvider
```
public class MyUsernamePasswordAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = (String) authentication.getPrincipal();
        String password = (String) authentication.getCredentials();

        MyUserDetails userDetails = (MyUserDetails) userDetailsService.loadUserByUsername(username);
        if (!Kits.matchPassword(password, userDetails.getPassword())) {
            throw new BadCredentialsException("用户名或密码错误");
        }

        User user = userDetails.getUser();

        String jwt = Jwts.builder()
                .claim("userId", user.getId())
                .setExpiration(new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000))
                .signWith(SignatureAlgorithm.HS512, Constants.JWT_KEY)
                .compact();

        user.setToken(jwt);
        userRepository.save(user);

        // 看源码传了password才会setAuthenticated(true)
        return new UsernamePasswordAuthenticationToken(userDetails, password, userDetails.getAuthorities());
        // todo: When the user submits their credentials, the AbstractAuthenticationProcessingFilter creates an
        //  Authentication from the HttpServletRequest to be authenticated. The type of Authentication created
        //  depends on the subclass of AbstractAuthenticationProcessingFilter.
        //  For example, UsernamePasswordAuthenticationFilter creates a UsernamePasswordAuthenticationToken from
        //  a username and password that are submitted in the HttpServletRequest.
    }

}
```

##### MyUserDetails_Service
分别继承UserDetails和UserDetailsService自己实现就好。

#### MyASHandler
认证成功返个token回去：
```
public class MyAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        MyUserDetails myUserDetails = (MyUserDetails) authentication.getPrincipal();
        Map<String, String> res = new HashMap<>();
        res.put("token", myUserDetails.getUser().getToken());
        Reply.send(response, Result.succeeded(res));
    }
}
```

#### MyAFHandler
不成功就给个json响应，提示有错：
```
public class MyAuthenticationFailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        Result result = Result.failed(exception.getMessage());
        Reply.send(response, result);
    }
}
```

## JWT认证
MyJwtAuthenticationFilter的实现参考了BearerTokenAuthenticationFilter(继承自OncePerRequestFilter)和MyUsernamePasswordAuthenticationFilter，加在过滤器中UsernamePasswordAuthenticationFilter之后的位置：
```
        http
                .addFilterAfter(myJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
```

### 认证过程
这个过程相对于上面的U.P.验证要简单得多，我自己实现的思路如下：
1. 接到请求，先从Header里取jwt
    - 因为ServletRequest是流，一旦被读取过，再后面的过滤器或者控制器之类的地方就都没法再读它了
    - 为了解决上面这个问题，参考[这里](https://blog.csdn.net/qq_36725282/article/details/109724685)，对Request包一层
2. 如果有jwt就解析它，只要jwt解析有问题全当它是登录信息已过期；如果解析没问题就用jwt这串文本去数据库里找用户，找出来封装成一个UPAToken给进上下文里
3. 如果没有jwt，再看要访问的url是否在白名单里，没有就抛出AuthenticationException（还是会被MyAuthenticationEntryPoint接过去处理），有就放行

### MyJwtAuthenticationFilter
```
public class MyJwtAuthenticationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String url = request.getRequestURI();
        WrappedRequest req = new WrappedRequest(request);
        try {
            String jwt = req.getHeader(Constants.TOKEN_HEADER);
            if (StringUtils.hasLength(jwt)) {
                Claims claims = Jwts.parser().setSigningKey(Constants.JWT_KEY).parseClaimsJws(jwt).getBody();
                req.setClaims(claims);

                MyUserDetails myUserDetails = myUserDetailsService.getUserByToken(jwt);
                if (myUserDetails == null) {
                    throw new BadCredentialsException("登录信息已失效！"); // 数据库里已经不是这个token了（或已经为空了）
                }
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(myUserDetails, null, myUserDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth); // 把用户信息set进当前上下文
            } else {
                // 这个filter准备加在UsernamePasswordAuthenticationFilter之后，所以我认为不影响 /login 和 /logout 的访问，只考虑白名单里的url就行了
                if (!whiteList.including(url)) {
                    throw new BadCredentialsException("FuckOff"); // ← 没登录却想访问非公开接口的话
                }
            }
            filterChain.doFilter(req, response);
        } catch (JwtException e) {
            SecurityContextHolder.clearContext();
            this.myAuthenticationEntryPoint.commence(req, response, new CredentialsExpiredException("登录状态已失效！")); // 只要jwt有问题的，全都当它是过期了
        } catch (AuthenticationException e) {
            SecurityContextHolder.clearContext();
            this.myAuthenticationEntryPoint.commence(req, response, e);
        }
    }
    // ...
```

# 授权
与其说“授权”，我觉得还是“鉴权”更合适。这个部分涉及的三个类更好记，从命名上也能推知个大概，各件注册位置说明：
```
        http
                .exceptionHandling()
                .accessDeniedHandler(myAccessDeniedHandler); // <--------------------------------------------异常处理

        http
                .authorizeRequests()
                .withObjectPostProcessor(new ObjectPostProcessor<FilterSecurityInterceptor>() {
                    @Override
                    public <O extends FilterSecurityInterceptor> O postProcess(O object) {
                        object.setAccessDecisionManager(myAccessDecisionManager); // <-----------------------鉴权者
                        object.setSecurityMetadataSource(mySecurityMetadataSource); // <---------------------鉴权依据
                        return object;
                    }
                })
                .anyRequest().authenticated()
```

## MyAccessDeniedHandler
处理权限不足异常，扔个json回去
```
public class MyAccessDeniedHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
        Reply.send(response, Result.failed(accessDeniedException.getMessage()));
```

## MySecurityMetadataSource
常规JPA操作，没什么好讲的
```
public class MySecurityMetadataSource implements FilterInvocationSecurityMetadataSource {
    @Override
    public Collection<ConfigAttribute> getAttributes(Object object) throws IllegalArgumentException {
        // String url = ((FilterInvocation) object).getRequestUrl(); // 这样获取的 url 后面跟着 ?query=
        String url = ((FilterInvocation) object).getRequest().getRequestURI();

        // 白名单里的url不受限，直接在securityConfig里就被ignore了；
        // /login、/logout也不用管，因为在过滤器链靠前的位置，到不了这里(FilterSecurityInterceptor)就被放行了
        // 这里(FilterSecurityInterceptor, 用于authorization)是非常靠后的地方了！
        // 综上所述，下面的if判断是没必要的
        //        if ("/login".equals(url) || "/logout".equals(url) || whiteList.including(url)) {
        //            return null;
        //        }

        Permission permission = permissionRepository.findByUrl(url);
        if (permission == null) {
            return null; // 未管入数据库的URL不受限
        }

        List<RolePermission> rolePermissionList = rolePermissionRepository.findByPermissionId(permission.getId());
        if (rolePermissionList.size() == 0) {
            return SecurityConfig.createList("inaccessible"); // 说明这个url未被授予任何角色
        }

        List<Long> roleIds = rolePermissionList.stream().map(RolePermission::getRoleId).collect(Collectors.toList());
        List<Role> roleList = roleRepository.findAllById(roleIds);
        String[] roleCodeList = roleList.stream().map(Role::getCode).toArray(String[]::new);
        return SecurityConfig.createList(roleCodeList);
    }
```

## MyAccessDecisionManager
实现(@Override)decide方法，没抛出AccessDeniedException就说明鉴权通过
```
public class MyAccessDecisionManager implements AccessDecisionManager {
    @Override
    public void decide(Authentication authentication, Object object, Collection<ConfigAttribute> configAttributes) throws AccessDeniedException, InsufficientAuthenticationException {
        if (authentication instanceof AnonymousAuthenticationToken) {
            throw new InsufficientAuthenticationException("Please login first");
        }

        Collection<? extends GrantedAuthority> grantedAuthorities = authentication.getAuthorities();

        for (ConfigAttribute ca : configAttributes) { // configAttributes是object需要的角色code集合，只要authentication具有的角色中
            String orRequiredRoleCode = ca.getAttribute(); // 至少有一个落在configAttributes里就有权限访问，所以变量名取orRequired前缀
            if ("inaccessible".equals(orRequiredRoleCode)) {
                // System.out.println("访问 " + ((FilterInvocation) object).getRequestUrl() + " 时出错: 该url未授权给任何角色");
                throw new AccessDeniedException("权限不足"); // 该url未授权给任何角色
            } else {
                for (GrantedAuthority a : grantedAuthorities) {
                    if (a.getAuthority().equals(orRequiredRoleCode)) {
                        return;
                    }
                }
            }

        }
        throw new AccessDeniedException("没有权限！"); // 最普通的AccessDenied情况：该用户的所有角色，都没有权限访问该接口
    }
```

# 补充资料
[spring 之 ObjectPostProcessor](https://blog.csdn.net/u012881904/article/details/103544151)
