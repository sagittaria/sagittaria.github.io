webpackJsonp([8],{LNjI:function(t,e,n){"use strict";var a=n("Tipt"),i=n.n(a),o=n("V51B");var r=function(t){n("kHBN")},c=n("VU/8")(i.a,o.a,!1,r,"data-v-67d71516",null);e.default=c.exports},NHnr:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var a=n("7+uW"),i=n("zL8q"),o=n.n(i),r=(n("tvR6"),{render:function(){var t=this.$createElement,e=this._self._c||t;return e("div",{attrs:{id:"app"}},[e("router-view")],1)},staticRenderFns:[]});var c=n("VU/8")({name:"App"},r,!1,function(t){n("yiIG")},null,null).exports,u=n("/ocq"),s=n("LNjI"),l=n("mtWM"),p=n.n(l),h={getBlogName:"/api/v0/getBlogName",login:"/login",logout:"/logout"},d={};d.api=h;var m=d,v={components:{AsideMenu:s.default},data:function(){return{blogName:"Origin"}},computed:{activeMenuItem:function(){return this.$route.path.split("/")[1]?this.$route.path.split("/")[1]:"/"}},beforeRouteEnter:function(t,e,n){n(function(t){t.getBlogName()})},methods:{getBlogName:function(){var t=this;p.a.get(m.api.getBlogName).then(function(e){t.blogName=e.data.blogName,console.log(e)},function(t){console.log(t)})}}},f={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("el-container",[n("el-header",[n("div",{staticStyle:{"line-height":"60px"}},[t._v(t._s(t.blogName))]),t._v(" "),n("el-menu",{attrs:{mode:"horizontal",router:!0,"default-active":t.activeMenuItem,active:t.activeMenuItem}},[n("el-menu-item",{attrs:{index:"/"}},[n("i",{staticClass:"el-icon-news"})]),t._v(" "),n("el-menu-item",{attrs:{index:"idea"}},[t._v("道")]),t._v(" "),n("el-menu-item",{attrs:{index:"tech"}},[t._v("术")])],1),t._v(" "),n("div",{staticStyle:{"line-height":"60px"}},[t._v("还不知道这边放什么好")])],1),t._v(" "),n("el-main",[n("el-row",{attrs:{type:"flex",justify:"center",gutter:40}},[n("el-col",{attrs:{span:12}},[n("router-view",{staticClass:"content"})],1),t._v(" "),n("el-col",{attrs:{span:4}},[n("aside-menu")],1)],1)],1),t._v(" "),n("el-footer")],1)},staticRenderFns:[]};var _=n("VU/8")(v,f,!1,function(t){n("X00c")},"data-v-7818aa09",null).exports,g={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("el-container",[n("el-header",[t._v(t._s(t.motto))]),t._v(" "),n("el-container",[n("el-aside",[n("el-menu",{attrs:{router:!0,"default-active":t.activeMenuItem,active:t.activeMenuItem}},[n("el-menu-item",{attrs:{index:"/master/statistic"}},[t._v("统计")]),t._v(" "),n("el-menu-item",{attrs:{index:"/master/post"}},[t._v("文章")])],1)],1),t._v(" "),n("el-main",[n("router-view")],1)],1)],1)},staticRenderFns:[]},b=n("VU/8")({data:function(){return{motto:"本性不移"}},methods:{},computed:{activeMenuItem:function(){return"/master/"+this.$route.path.split("/")[2]}}},g,!1,null,null,null).exports;a.default.use(u.a);var y=new u.a({routes:[{path:"/",component:_,children:[{path:"",name:"cover",component:function(t){return n.e(0).then(function(){var e=[n("P9Vx")];t.apply(null,e)}.bind(this)).catch(n.oe)}},{path:"tech",name:"post-list-tech",component:function(t){return n.e(0).then(function(){var e=[n("P9Vx")];t.apply(null,e)}.bind(this)).catch(n.oe)}},{path:"idea",name:"post-list-idea",component:function(t){return n.e(0).then(function(){var e=[n("P9Vx")];t.apply(null,e)}.bind(this)).catch(n.oe)}}]},{path:"/login",component:function(t){return n.e(5).then(function(){var e=[n("K31e")];t.apply(null,e)}.bind(this)).catch(n.oe)}},{path:"/master",component:b,children:[{path:"",redirect:"/master/statistic"},{path:"statistic",name:"statistic",component:function(t){return n.e(2).then(function(){var e=[n("F2KU")];t.apply(null,e)}.bind(this)).catch(n.oe)}},{path:"post",redirect:"/master/post/list"},{path:"post/list",name:"post-list",component:function(t){return n.e(4).then(function(){var e=[n("sKxj")];t.apply(null,e)}.bind(this)).catch(n.oe)}},{path:"post/add",name:"post-add",component:function(t){return n.e(1).then(function(){var e=[n("YeXK")];t.apply(null,e)}.bind(this)).catch(n.oe)}},{path:"post/preview/:postId",name:"post-preview",component:function(t){return n.e(3).then(function(){var e=[n("bCyU")];t.apply(null,e)}.bind(this)).catch(n.oe)}},{path:"post/edit/:postId",name:"post-edit",component:function(t){return n.e(1).then(function(){var e=[n("YeXK")];t.apply(null,e)}.bind(this)).catch(n.oe)}}]},{path:"/*",name:"Error404",component:function(t){return n.e(6).then(function(){var e=[n("5Iau")];t.apply(null,e)}.bind(this)).catch(n.oe)}}]});a.default.use(o.a),a.default.config.productionTip=!1,p.a.defaults.baseURL="http://127.0.0.1:4000/",p.a.defaults.withCredentials=!0,new a.default({el:"#app",router:y,components:{App:c},template:"<App/>"})},Tipt:function(t,e){},V51B:function(t,e,n){"use strict";var a={render:function(){var t=this.$createElement;return(this._self._c||t)("div",{staticClass:"aside-menu"},[this._v("右侧菜单")])},staticRenderFns:[]};e.a=a},X00c:function(t,e){},kHBN:function(t,e){},tvR6:function(t,e){},yiIG:function(t,e){}},["NHnr"]);
//# sourceMappingURL=app.56a485a32ad6e5cdadee.js.map