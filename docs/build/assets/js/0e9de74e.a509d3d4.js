"use strict";(self.webpackChunkada_ca_ddocs=self.webpackChunkada_ca_ddocs||[]).push([[5263],{3547:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>i,contentTitle:()=>s,default:()=>p,frontMatter:()=>c,metadata:()=>a,toc:()=>u});var r=t(5893),o=t(3905);const c={},s="push",a={id:"howtodevelop/reference/sequence/OneD/push",title:"push",description:"Pushes the value in passed to the function to the back of the current sequence.",source:"@site/docs/howtodevelop/reference/sequence/OneD/push.md",sourceDirName:"howtodevelop/reference/sequence/OneD",slug:"/howtodevelop/reference/sequence/OneD/push",permalink:"/docs/howtodevelop/reference/sequence/OneD/push",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"devDocsSidebar",previous:{title:"padTo",permalink:"/docs/howtodevelop/reference/sequence/OneD/padTo"},next:{title:"pushMultiple",permalink:"/docs/howtodevelop/reference/sequence/OneD/pushMultiple"}},i={},u=[{value:"Parameters",id:"parameters",level:2},{value:"Returns",id:"returns",level:2},{value:"Implementation",id:"implementation",level:2}];function l(e){const n={code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,o.ah)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.h1,{id:"push",children:"push"}),"\n",(0,r.jsx)(n.p,{children:"Pushes the value in passed to the function to the back of the current sequence."}),"\n",(0,r.jsx)(n.h2,{id:"parameters",children:"Parameters"}),"\n",(0,r.jsx)(n.p,{children:"A single number or a boolean (which is then translated to a number by the function)"}),"\n",(0,r.jsx)(n.h2,{id:"returns",children:"Returns"}),"\n",(0,r.jsx)(n.p,{children:"the current Sequence.OneD object"}),"\n",(0,r.jsx)(n.h2,{id:"implementation",children:"Implementation"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"let seq = new Sequence.OneD([0,0,1,1])\nseq.push(2)\n"})}),"\n",(0,r.jsx)(n.p,{children:"After calling this operation, the sequence is [0, 0, 1, 1, 2]."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"let seq = new Sequence.OneD([0,0,1,1])\nseq.push(true)\n"})}),"\n",(0,r.jsx)(n.p,{children:"In this case, the true is translated by the function as a 1 and then pushed to the back of the sequence, resulting in [0, 0, 1, 1, 1]."})]})}function p(e={}){const{wrapper:n}={...(0,o.ah)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(l,{...e})}):l(e)}},3905:(e,n,t)=>{t.d(n,{ah:()=>u});var r=t(7294);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function c(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function s(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?c(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):c(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function a(e,n){if(null==e)return{};var t,r,o=function(e,n){if(null==e)return{};var t,r,o={},c=Object.keys(e);for(r=0;r<c.length;r++)t=c[r],n.indexOf(t)>=0||(o[t]=e[t]);return o}(e,n);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(r=0;r<c.length;r++)t=c[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var i=r.createContext({}),u=function(e){var n=r.useContext(i),t=n;return e&&(t="function"==typeof e?e(n):s(s({},n),e)),t},l={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},p=r.forwardRef((function(e,n){var t=e.components,o=e.mdxType,c=e.originalType,i=e.parentName,p=a(e,["components","mdxType","originalType","parentName"]),h=u(t),d=o,f=h["".concat(i,".").concat(d)]||h[d]||l[d]||c;return t?r.createElement(f,s(s({ref:n},p),{},{components:t})):r.createElement(f,s({ref:n},p))}));p.displayName="MDXCreateElement"}}]);