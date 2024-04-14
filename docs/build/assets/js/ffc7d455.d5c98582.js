"use strict";(self.webpackChunkada_ca_ddocs=self.webpackChunkada_ca_ddocs||[]).push([[4490],{5297:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>i,contentTitle:()=>d,default:()=>h,frontMatter:()=>o,metadata:()=>s,toc:()=>c});var n=t(5893),a=t(3905);const o={},d="Drawdown",s={id:"howtodevelop/reference/drawdown/drawdown",title:"Drawdown",description:"The drawdown type refers to the 2D array used to store the cells that make up the draft pattern or drawdown. The drawdown is used as the primary representation of cloth structure within a draft in AdaCAD.",source:"@site/docs/howtodevelop/reference/drawdown/drawdown.md",sourceDirName:"howtodevelop/reference/drawdown",slug:"/howtodevelop/reference/drawdown/",permalink:"/docs/howtodevelop/reference/drawdown/",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"devDocsSidebar",previous:{title:"updateWeftSystemsAndShuttles",permalink:"/docs/howtodevelop/reference/draft/updateWeftSystemsAndShuttles"},next:{title:"hasCell",permalink:"/docs/howtodevelop/reference/drawdown/hasCell"}},i={},c=[{value:"Related Functions",id:"related-functions",level:2}];function l(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,a.ah)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.h1,{id:"drawdown",children:"Drawdown"}),"\n",(0,n.jsx)(r.p,{children:"The drawdown type refers to the 2D array used to store the cells that make up the draft pattern or drawdown. The drawdown is used as the primary representation of cloth structure within a draft in AdaCAD."}),"\n",(0,n.jsx)(r.p,{children:"The drawdown is indexed with (0,0) representing the origin of the draft. In many cases, such as when operations are performed, the origin is first translated to the top left, changes are made, and then it is rotated back after the computation. This means that when you are indexing into the Array (0,0) or drawdown[0][0] you are referencing the first weft pick on the first warp end."}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-jsx",metastring:'title="src/app/core/model/datatypes.js"',children:"export type Drawdown = Array<Array<Cell>>;\n\n"})}),"\n",(0,n.jsx)(r.h2,{id:"related-functions",children:"Related Functions"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsx)(r.li,{children:(0,n.jsx)(r.a,{href:"warps",children:"warps"})}),"\n",(0,n.jsx)(r.li,{children:(0,n.jsx)(r.a,{href:"wefts",children:"wefts"})}),"\n",(0,n.jsx)(r.li,{children:(0,n.jsx)(r.a,{href:"hasCell",children:"hasCell"})}),"\n",(0,n.jsx)(r.li,{children:(0,n.jsx)(r.a,{href:"isUp",children:"isUp"})}),"\n",(0,n.jsx)(r.li,{children:(0,n.jsx)(r.a,{href:"setCellValue",children:"setCellValue"})}),"\n"]})]})}function h(e={}){const{wrapper:r}={...(0,a.ah)(),...e.components};return r?(0,n.jsx)(r,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}},3905:(e,r,t)=>{t.d(r,{ah:()=>c});var n=t(7294);function a(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function o(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);r&&(n=n.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),t.push.apply(t,n)}return t}function d(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?o(Object(t),!0).forEach((function(r){a(e,r,t[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))}))}return e}function s(e,r){if(null==e)return{};var t,n,a=function(e,r){if(null==e)return{};var t,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)t=o[n],r.indexOf(t)>=0||(a[t]=e[t]);return a}(e,r);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)t=o[n],r.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var i=n.createContext({}),c=function(e){var r=n.useContext(i),t=r;return e&&(t="function"==typeof e?e(r):d(d({},r),e)),t},l={inlineCode:"code",wrapper:function(e){var r=e.children;return n.createElement(n.Fragment,{},r)}},h=n.forwardRef((function(e,r){var t=e.components,a=e.mdxType,o=e.originalType,i=e.parentName,h=s(e,["components","mdxType","originalType","parentName"]),p=c(t),f=a,u=p["".concat(i,".").concat(f)]||p[f]||l[f]||o;return t?n.createElement(u,d(d({ref:r},h),{},{components:t})):n.createElement(u,d({ref:r},h))}));h.displayName="MDXCreateElement"}}]);