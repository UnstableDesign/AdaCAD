"use strict";(self.webpackChunkada_ca_ddocs=self.webpackChunkada_ca_ddocs||[]).push([[9207],{6643:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>i,contentTitle:()=>s,default:()=>p,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var r=t(5893),c=t(3905);const o={},s="Sequence.OneD",a={id:"howtodevelop/reference/sequence/OneD/OneD",title:"Sequence.OneD",description:"A OneD Sequence object stores a single list of heddle values. You can use a OneD Sequence object to represent a single warp or weft. You can instantiate a sequence object as follows:",source:"@site/docs/howtodevelop/reference/sequence/OneD/OneD.md",sourceDirName:"howtodevelop/reference/sequence/OneD",slug:"/howtodevelop/reference/sequence/OneD/",permalink:"/docs/howtodevelop/reference/sequence/OneD/",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"devDocsSidebar",previous:{title:"Sequence",permalink:"/docs/howtodevelop/reference/sequence/"},next:{title:"computeFilter",permalink:"/docs/howtodevelop/reference/sequence/OneD/computerFilter"}},i={},l=[{value:"Implementations",id:"implementations",level:2},{value:"Chaining Functions",id:"chaining-functions",level:2}];function u(e){const n={code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,c.ah)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.h1,{id:"sequenceoned",children:"Sequence.OneD"}),"\n",(0,r.jsx)(n.p,{children:"A OneD Sequence object stores a single list of heddle values. You can use a OneD Sequence object to represent a single warp or weft. You can instantiate a sequence object as follows:"}),"\n",(0,r.jsx)(n.h2,{id:"implementations",children:"Implementations"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-jsx",metastring:'title="src/app/core/model/sequence.js"',children:"\nconst seq: Sequence.OneD = new Sequence.OneD();\n\n"})}),"\n",(0,r.jsx)(n.p,{children:"This will instate a blank sequence."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-jsx",metastring:'title="src/app/core/model/sequence.js"',children:"\nconst seq: Sequence.OneD = new Sequence.OneD([0,0,1,1]);\n\n"})}),"\n",(0,r.jsx)(n.p,{children:"This will instate a new sequence with the value [0,0,1,1];"}),"\n",(0,r.jsx)(n.h2,{id:"chaining-functions",children:"Chaining Functions"}),"\n",(0,r.jsx)(n.p,{children:"Because the OneD functions return the object itself, they can be chained for easy reading. For example, the following two code blocks could be used to generate the same sequence."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-jsx",children:"// Option 1: The long way\n\nconst seq: Sequence.OneD = new Sequence.OneD([0,0,1,1]);\nseq.push(0)\nseq.push(1)\nseq.push(2)\n\n"})}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-jsx",children:"// Option 2: The short way\n\nconst seq: Sequence.OneD = new Sequence.OneD([0,0,1,1]).push(0).push(1).push(2);\n\n"})})]})}function p(e={}){const{wrapper:n}={...(0,c.ah)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(u,{...e})}):u(e)}},3905:(e,n,t)=>{t.d(n,{ah:()=>l});var r=t(7294);function c(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function s(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){c(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function a(e,n){if(null==e)return{};var t,r,c=function(e,n){if(null==e)return{};var t,r,c={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(c[t]=e[t]);return c}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(c[t]=e[t])}return c}var i=r.createContext({}),l=function(e){var n=r.useContext(i),t=n;return e&&(t="function"==typeof e?e(n):s(s({},n),e)),t},u={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},p=r.forwardRef((function(e,n){var t=e.components,c=e.mdxType,o=e.originalType,i=e.parentName,p=a(e,["components","mdxType","originalType","parentName"]),d=l(t),h=c,f=d["".concat(i,".").concat(h)]||d[h]||u[h]||o;return t?r.createElement(f,s(s({ref:n},p),{},{components:t})):r.createElement(f,s({ref:n},p))}));p.displayName="MDXCreateElement"}}]);