"use strict";(self.webpackChunkada_ca_ddocs=self.webpackChunkada_ca_ddocs||[]).push([[5798],{598:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>a,contentTitle:()=>i,default:()=>h,frontMatter:()=>o,metadata:()=>s,toc:()=>l});var r=n(5893),c=n(3905);const o={},i="matchSize",s={id:"howtodevelop/reference/sequence/OneD/matchSize",title:"matchSize",description:"This function compares the size of the current sequence to the input sequence. If they are different lengths, it will update either the input sequence or the current sequence to match the longest length by adding unset values (e.g. 2)",source:"@site/docs/howtodevelop/reference/sequence/OneD/matchSize.md",sourceDirName:"howtodevelop/reference/sequence/OneD",slug:"/howtodevelop/reference/sequence/OneD/matchSize",permalink:"/docs/howtodevelop/reference/sequence/OneD/matchSize",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"devDocsSidebar",previous:{title:"invert",permalink:"/docs/howtodevelop/reference/sequence/OneD/invert"},next:{title:"padTo",permalink:"/docs/howtodevelop/reference/sequence/OneD/padTo"}},a={},l=[{value:"Parameters",id:"parameters",level:2},{value:"Returns",id:"returns",level:2},{value:"Implementation",id:"implementation",level:2}];function u(e){const t={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,c.ah)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"matchsize",children:"matchSize"}),"\n",(0,r.jsx)(t.p,{children:"This function compares the size of the current sequence to the input sequence. If they are different lengths, it will update either the input sequence or the current sequence to match the longest length by adding unset values (e.g. 2)"}),"\n",(0,r.jsx)(t.h2,{id:"parameters",children:"Parameters"}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"a Sequence.OneD object of which to match the size"}),"\n"]}),"\n",(0,r.jsx)(t.h2,{id:"returns",children:"Returns"}),"\n",(0,r.jsx)(t.p,{children:"the current Sequence.OneD object"}),"\n",(0,r.jsx)(t.h2,{id:"implementation",children:"Implementation"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{children:"let seq_a = new Sequence.OneD([0,0,1,1])\nlet seq_b = new Sequence.OneD([0,0,1,1,1,1])\nseq_a.matchSize(seq_b)\n"})}),"\n",(0,r.jsx)(t.p,{children:"After calling this operation, the seq_a would be [1, 1, 0, 0, 2, 2]."}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{children:"let seq_a = new Sequence.OneD([0,0,1,1, 1, 1])\nlet seq_b = new Sequence.OneD([0,0,1,1])\nseq_a.matchSize(seq_b)\n"})}),"\n",(0,r.jsx)(t.p,{children:"After calling this operation, the seq_a would be the same but sequence b would be modified to be [0, 0, 1, 1, 2, 2]."})]})}function h(e={}){const{wrapper:t}={...(0,c.ah)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(u,{...e})}):u(e)}},3905:(e,t,n)=>{n.d(t,{ah:()=>l});var r=n(7294);function c(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){c(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,c=function(e,t){if(null==e)return{};var n,r,c={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(c[n]=e[n]);return c}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(c[n]=e[n])}return c}var a=r.createContext({}),l=function(e){var t=r.useContext(a),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},h=r.forwardRef((function(e,t){var n=e.components,c=e.mdxType,o=e.originalType,a=e.parentName,h=s(e,["components","mdxType","originalType","parentName"]),d=l(n),p=c,f=d["".concat(a,".").concat(p)]||d[p]||u[p]||o;return n?r.createElement(f,i(i({ref:t},h),{},{components:n})):r.createElement(f,i({ref:t},h))}));h.displayName="MDXCreateElement"}}]);