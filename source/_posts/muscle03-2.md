---
title: Security03-连接数据库验证用户名密码-实践
date: 2021-12-16 09:39:52
categories: 不周山
tags: 把SpringSecurity玩明白
---

接上回理论，现在要实现将前端页面上传来的用户名密码跟从数据库里取到的值作比较，以判定登录是否成功。
<!--more-->

# 应用配置文件 application.yml
加 DataSource 和 JPA，注释掉掉默认的 sean 用户
```
spring:
  application:
    name: muscle

  datasource:
    url: jdbc:mysql://localhost:3306/muscle
    username: root
    password: root

  jpa:
    show-sql: true
    hibernate:
      ddl-auto: update
    open-in-view: false

#  security:
#    user:
#      name: sean
#      password: 123

server:
  port: 8088
```

# 登录成功后的页面 frontpage.html
增加一个注销登录的&lt;a&gt;标签
```
<div>
    hi <span th:text="${name}">name</span>, welcome to the real world. Now, you can click to
    <a th:href="@{/logout}">log out</a>
</div>
```

# 实体类 User 及其仓库 UserRepository
User必须有id、username、password，UserRepository 加一个findByUsername方法，UserDetailsService要用
```
@Data
@Entity
@Table(name="t_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String username;
    private String password;
}

// -------------------------------------------------------

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}
```
创建用户：往 t_user 表里插一条数据
```
insert into t_user(username, password) values('sean', '{noop}123');
```
关于上面password里{noop}的说明，见文档 [Password Storage Format](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html#authentication-password-storage-dpe-format)

简单理解，密码前加了{noop}表示明文存储，密码比对时会由 NoOpPasswordEncoder 来处理。这里不去理解也行，一般情况下这么使用 BCryptPasswordEncoder：
1. 直接存秘文，前面不用加{noop}或者{bcrypt}。随便写个main方法执行下，获取秘文
1. String raw = "muscle"; System.out.println(new BCryptPasswordEncoder().encode(raw));
1. 更新下数据库里的密码
1. update t_user set password='$2a$10$aUwJfJWSUSDHg08TDg5mc.E3pk82dMcXdAVHY5yhPvS9sVvyR68HW' where username='sean';
1. 暴露一个 BCryptPasswordEncoder Bean，见下一节

# 安全配置类 MySecurityConfig
因为页面上是点击个&lt;a&gt;注销登录（普通get请求），而 [If CSRF protection is enabled (default), then the request must also be a POST.](https://docs.spring.io/spring-security/reference/servlet/authentication/logout.html) 所以在configure方法中增加一条设置：关闭CSRF。

另外在这个类里暴露一个BCryptPasswordEncoder Bean，来指定具体的PasswordEncoder。
```
@EnableWebSecurity
public class MySecurityConfig extends WebSecurityConfigurerAdapter {
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable(); // 将csrf关掉
        // 其他设置不变...
    }

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    } // 暴露一个Bean，以令 BCryptPasswordEncoder 来处理前端传入的密码，将其encode后与数据库中存的值比较
}
```

## MyUserDetailsService
打 @Service 注解是为了让它自动注入。实现 UserDetailsService 接口要实现 loadUserByUsername 方法，如果能按用户名找到就包装成 UserDetails 返回出去，如果找不到就抛出个 UsernameNotFoundException
```
@Service
public class MyUserDetailsService implements UserDetailsService {

    final UserRepository userRepository;

    @Autowired
    public MyUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            return new MyUserDetails(user);
        } else {
            throw new UsernameNotFoundException("invalid username or password");
        }
    }
}
```

## MyUserDetails
DaoAuthenticationProvider 里能见到一个 org.springframework.security.core.userdetails.UserDetails 接口，同包下面有一个实现 org.springframework.security.core.userdetails.User。就是这个 User 类里定义了用户名字段叫 username，密码字段叫 password。自制 tech.demons.muscle.entity.User 实体类和 MyUserDetails 类时都参考了它。
```
public class MyUserDetails implements UserDetails {
    // 参考来源：org.springframework.security.core.userdetails.User(which implements UserDetails)
    
    final private User user;

    public MyUserDetails(User user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
```
