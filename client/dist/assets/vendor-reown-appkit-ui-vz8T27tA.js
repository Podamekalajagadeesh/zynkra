const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PhArrowCircleDown-B305t-Sh.js","assets/property-C9JG5tag.js","assets/PhArrowClockwise-CJPxQhr_.js","assets/PhArrowDown-C4hT9BVu.js","assets/PhArrowLeft-Way4Cu-r.js","assets/PhArrowRight-Cp5ZME0F.js","assets/PhArrowSquareOut-NnrK69c5.js","assets/PhArrowsDownUp-BjBI4ckC.js","assets/PhArrowsLeftRight-CuLpbKRk.js","assets/PhArrowUp-Dph6j8rm.js","assets/PhArrowUpRight-BpJjRRRh.js","assets/PhArrowsClockwise-CFUT8X7R.js","assets/PhBank-Dchr4XQJ.js","assets/PhBrowser-dUu2TrC1.js","assets/PhCaretDown-78IuKU3V.js","assets/PhCaretLeft-_aiyH7n1.js","assets/PhCaretRight-8zJQEuDX.js","assets/PhCaretUp-CiCxKWwN.js","assets/PhCheck-CcADx8br.js","assets/PhCircleHalf-BYzSzd2h.js","assets/PhClock-UItiXeJq.js","assets/PhCompass-CUy3uA7t.js","assets/PhCopy-C-PDgSlZ.js","assets/PhCreditCard-CWRaUT6F.js","assets/PhCurrencyDollar-Cqla3AXT.js","assets/PhDesktop-BBIPrYLl.js","assets/PhDeviceMobile-BdsPaATg.js","assets/PhDotsThree-BMXCQl-0.js","assets/PhVault-l2PHF38a.js","assets/PhEnvelope-yUsis6yU.js","assets/PhFunnelSimple-Ba7BbWTp.js","assets/PhGlobe-DgLxBk5U.js","assets/PhIdentificationCard-Czjmq9Z3.js","assets/PhImage-BAJ_erz6.js","assets/PhInfo-Cr4DhVUE.js","assets/PhLightbulb-BX_7duTr.js","assets/PhMagnifyingGlass-Mygfryvz.js","assets/PhPaperPlaneRight-BeuCA660.js","assets/PhPlus-BMjcHjsT.js","assets/PhPower-CGffGmdb.js","assets/PhPuzzlePiece-wm_GpVSi.js","assets/PhQrCode-DRwRzXCH.js","assets/PhQuestion-M09j2U0T.js","assets/PhQuestionMark-BP9EMB6h.js","assets/PhSealCheck-BfG80yKn.js","assets/PhSignOut-C5YOWlPT.js","assets/PhSpinner-BXooDYzU.js","assets/PhTrash-Biq6rmmL.js","assets/PhUser-CAgZSpGe.js","assets/PhWallet-w25D16It.js","assets/PhWarning-DPEydIPw.js","assets/PhWarningCircle-BqjT745H.js","assets/PhX-s-SmVExa.js"])))=>i.map(i=>d[i]);
import{b as Rr}from"./vendor-reown-appkit-controllers-jkmAX4ms.js";import{_ as v}from"./vendor-walletconnect-ethereum-provider-BUhCW2xH.js";const Ya={interpolate(t,e,o){if(t.length!==2||e.length!==2)throw new Error("inputRange and outputRange must be an array of length 2");const i=t[0]||0,n=t[1]||0,r=e[0]||0,a=e[1]||0;return o<i?r:o>n?a:(a-r)/(n-i)*(o-i)+r}};/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ee=globalThis,wo=Ee.ShadowRoot&&(Ee.ShadyCSS===void 0||Ee.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,bo=Symbol(),Ro=new WeakMap;let Xo=class{constructor(e,o,i){if(this._$cssResult$=!0,i!==bo)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=o}get styleSheet(){let e=this.o;const o=this.t;if(wo&&e===void 0){const i=o!==void 0&&o.length===1;i&&(e=Ro.get(o)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&Ro.set(o,e))}return e}toString(){return this.cssText}};const X=t=>new Xo(typeof t=="string"?t:t+"",void 0,bo),G=(t,...e)=>{const o=t.length===1?t[0]:e.reduce((i,n,r)=>i+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+t[r+1],t[0]);return new Xo(o,t,bo)},Lr=(t,e)=>{if(wo)t.adoptedStyleSheets=e.map(o=>o instanceof CSSStyleSheet?o:o.styleSheet);else for(const o of e){const i=document.createElement("style"),n=Ee.litNonce;n!==void 0&&i.setAttribute("nonce",n),i.textContent=o.cssText,t.appendChild(i)}},Lo=wo?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let o="";for(const i of e.cssRules)o+=i.cssText;return X(o)})(t):t;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Ir,defineProperty:Br,getOwnPropertyDescriptor:Mr,getOwnPropertyNames:Or,getOwnPropertySymbols:Hr,getPrototypeOf:Dr}=Object,wt=globalThis,Io=wt.trustedTypes,Nr=Io?Io.emptyScript:"",Je=wt.reactiveElementPolyfillSupport,re=(t,e)=>t,Pe={toAttribute(t,e){switch(e){case Boolean:t=t?Nr:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let o=t;switch(e){case Boolean:o=t!==null;break;case Number:o=t===null?null:Number(t);break;case Object:case Array:try{o=JSON.parse(t)}catch{o=null}}return o}},yo=(t,e)=>!Ir(t,e),Bo={attribute:!0,type:String,converter:Pe,reflect:!1,useDefault:!1,hasChanged:yo};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),wt.litPropertyMetadata??(wt.litPropertyMetadata=new WeakMap);let jt=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,o=Bo){if(o.state&&(o.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((o=Object.create(o)).wrapped=!0),this.elementProperties.set(e,o),!o.noAccessor){const i=Symbol(),n=this.getPropertyDescriptor(e,i,o);n!==void 0&&Br(this.prototype,e,n)}}static getPropertyDescriptor(e,o,i){const{get:n,set:r}=Mr(this.prototype,e)??{get(){return this[o]},set(a){this[o]=a}};return{get:n,set(a){const s=n==null?void 0:n.call(this);r==null||r.call(this,a),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Bo}static _$Ei(){if(this.hasOwnProperty(re("elementProperties")))return;const e=Dr(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(re("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(re("properties"))){const o=this.properties,i=[...Or(o),...Hr(o)];for(const n of i)this.createProperty(n,o[n])}const e=this[Symbol.metadata];if(e!==null){const o=litPropertyMetadata.get(e);if(o!==void 0)for(const[i,n]of o)this.elementProperties.set(i,n)}this._$Eh=new Map;for(const[o,i]of this.elementProperties){const n=this._$Eu(o,i);n!==void 0&&this._$Eh.set(n,o)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const o=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const n of i)o.unshift(Lo(n))}else e!==void 0&&o.push(Lo(e));return o}static _$Eu(e,o){const i=o.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(o=>this.enableUpdating=o),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(o=>o(this))}addController(e){var o;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((o=e.hostConnected)==null||o.call(e))}removeController(e){var o;(o=this._$EO)==null||o.delete(e)}_$E_(){const e=new Map,o=this.constructor.elementProperties;for(const i of o.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Lr(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(o=>{var i;return(i=o.hostConnected)==null?void 0:i.call(o)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(o=>{var i;return(i=o.hostDisconnected)==null?void 0:i.call(o)})}attributeChangedCallback(e,o,i){this._$AK(e,i)}_$ET(e,o){var r;const i=this.constructor.elementProperties.get(e),n=this.constructor._$Eu(e,i);if(n!==void 0&&i.reflect===!0){const a=(((r=i.converter)==null?void 0:r.toAttribute)!==void 0?i.converter:Pe).toAttribute(o,i.type);this._$Em=e,a==null?this.removeAttribute(n):this.setAttribute(n,a),this._$Em=null}}_$AK(e,o){var r,a;const i=this.constructor,n=i._$Eh.get(e);if(n!==void 0&&this._$Em!==n){const s=i.getPropertyOptions(n),l=typeof s.converter=="function"?{fromAttribute:s.converter}:((r=s.converter)==null?void 0:r.fromAttribute)!==void 0?s.converter:Pe;this._$Em=n;const d=l.fromAttribute(o,s.type);this[n]=d??((a=this._$Ej)==null?void 0:a.get(n))??d,this._$Em=null}}requestUpdate(e,o,i,n=!1,r){var a;if(e!==void 0){const s=this.constructor;if(n===!1&&(r=this[e]),i??(i=s.getPropertyOptions(e)),!((i.hasChanged??yo)(r,o)||i.useDefault&&i.reflect&&r===((a=this._$Ej)==null?void 0:a.get(e))&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,o,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,o,{useDefault:i,reflect:n,wrapped:r},a){i&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,a??o??this[e]),r!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(o=void 0),this._$AL.set(e,o)),n===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(o){Promise.reject(o)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[r,a]of this._$Ep)this[r]=a;this._$Ep=void 0}const n=this.constructor.elementProperties;if(n.size>0)for(const[r,a]of n){const{wrapped:s}=a,l=this[r];s!==!0||this._$AL.has(r)||l===void 0||this.C(r,void 0,a,l)}}let e=!1;const o=this._$AL;try{e=this.shouldUpdate(o),e?(this.willUpdate(o),(i=this._$EO)==null||i.forEach(n=>{var r;return(r=n.hostUpdate)==null?void 0:r.call(n)}),this.update(o)):this._$EM()}catch(n){throw e=!1,this._$EM(),n}e&&this._$AE(o)}willUpdate(e){}_$AE(e){var o;(o=this._$EO)==null||o.forEach(i=>{var n;return(n=i.hostUpdated)==null?void 0:n.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(o=>this._$ET(o,this[o]))),this._$EM()}updated(e){}firstUpdated(e){}};jt.elementStyles=[],jt.shadowRootOptions={mode:"open"},jt[re("elementProperties")]=new Map,jt[re("finalized")]=new Map,Je==null||Je({ReactiveElement:jt}),(wt.reactiveElementVersions??(wt.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ie=globalThis,Mo=t=>t,ze=ie.trustedTypes,Oo=ze?ze.createPolicy("lit-html",{createHTML:t=>t}):void 0,tr="$lit$",gt=`lit$${Math.random().toFixed(9).slice(2)}$`,er="?"+gt,jr=`<${er}>`,zt=document,se=()=>zt.createComment(""),le=t=>t===null||typeof t!="object"&&typeof t!="function",$o=Array.isArray,Fr=t=>$o(t)||typeof(t==null?void 0:t[Symbol.iterator])=="function",Qe=`[ 	
\f\r]`,oe=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ho=/-->/g,Do=/>/g,St=RegExp(`>|${Qe}(?:([^\\s"'>=/]+)(${Qe}*=${Qe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),No=/'/g,jo=/"/g,or=/^(?:script|style|textarea|title)$/i,rr=t=>(e,...o)=>({_$litType$:t,strings:e,values:o}),h=rr(1),A=rr(2),Tt=Symbol.for("lit-noChange"),R=Symbol.for("lit-nothing"),Fo=new WeakMap,At=zt.createTreeWalker(zt,129);function ir(t,e){if(!$o(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return Oo!==void 0?Oo.createHTML(e):e}const Wr=(t,e)=>{const o=t.length-1,i=[];let n,r=e===2?"<svg>":e===3?"<math>":"",a=oe;for(let s=0;s<o;s++){const l=t[s];let d,u,b=-1,y=0;for(;y<l.length&&(a.lastIndex=y,u=a.exec(l),u!==null);)y=a.lastIndex,a===oe?u[1]==="!--"?a=Ho:u[1]!==void 0?a=Do:u[2]!==void 0?(or.test(u[2])&&(n=RegExp("</"+u[2],"g")),a=St):u[3]!==void 0&&(a=St):a===St?u[0]===">"?(a=n??oe,b=-1):u[1]===void 0?b=-2:(b=a.lastIndex-u[2].length,d=u[1],a=u[3]===void 0?St:u[3]==='"'?jo:No):a===jo||a===No?a=St:a===Ho||a===Do?a=oe:(a=St,n=void 0);const g=a===St&&t[s+1].startsWith("/>")?" ":"";r+=a===oe?l+jr:b>=0?(i.push(d),l.slice(0,b)+tr+l.slice(b)+gt+g):l+gt+(b===-2?s:g)}return[ir(t,r+(t[o]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]};class ce{constructor({strings:e,_$litType$:o},i){let n;this.parts=[];let r=0,a=0;const s=e.length-1,l=this.parts,[d,u]=Wr(e,o);if(this.el=ce.createElement(d,i),At.currentNode=this.el.content,o===2||o===3){const b=this.el.content.firstChild;b.replaceWith(...b.childNodes)}for(;(n=At.nextNode())!==null&&l.length<s;){if(n.nodeType===1){if(n.hasAttributes())for(const b of n.getAttributeNames())if(b.endsWith(tr)){const y=u[a++],g=n.getAttribute(b).split(gt),x=/([.?@])?(.*)/.exec(y);l.push({type:1,index:r,name:x[2],strings:g,ctor:x[1]==="."?Ur:x[1]==="?"?Zr:x[1]==="@"?Kr:Fe}),n.removeAttribute(b)}else b.startsWith(gt)&&(l.push({type:6,index:r}),n.removeAttribute(b));if(or.test(n.tagName)){const b=n.textContent.split(gt),y=b.length-1;if(y>0){n.textContent=ze?ze.emptyScript:"";for(let g=0;g<y;g++)n.append(b[g],se()),At.nextNode(),l.push({type:2,index:++r});n.append(b[y],se())}}}else if(n.nodeType===8)if(n.data===er)l.push({type:2,index:r});else{let b=-1;for(;(b=n.data.indexOf(gt,b+1))!==-1;)l.push({type:7,index:r}),b+=gt.length-1}r++}}static createElement(e,o){const i=zt.createElement("template");return i.innerHTML=e,i}}function Wt(t,e,o=t,i){var a,s;if(e===Tt)return e;let n=i!==void 0?(a=o._$Co)==null?void 0:a[i]:o._$Cl;const r=le(e)?void 0:e._$litDirective$;return(n==null?void 0:n.constructor)!==r&&((s=n==null?void 0:n._$AO)==null||s.call(n,!1),r===void 0?n=void 0:(n=new r(t),n._$AT(t,o,i)),i!==void 0?(o._$Co??(o._$Co=[]))[i]=n:o._$Cl=n),n!==void 0&&(e=Wt(t,n._$AS(t,e.values),n,i)),e}class Vr{constructor(e,o){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=o}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:o},parts:i}=this._$AD,n=((e==null?void 0:e.creationScope)??zt).importNode(o,!0);At.currentNode=n;let r=At.nextNode(),a=0,s=0,l=i[0];for(;l!==void 0;){if(a===l.index){let d;l.type===2?d=new ge(r,r.nextSibling,this,e):l.type===1?d=new l.ctor(r,l.name,l.strings,this,e):l.type===6&&(d=new Gr(r,this,e)),this._$AV.push(d),l=i[++s]}a!==(l==null?void 0:l.index)&&(r=At.nextNode(),a++)}return At.currentNode=zt,n}p(e){let o=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,o),o+=i.strings.length-2):i._$AI(e[o])),o++}}class ge{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,o,i,n){this.type=2,this._$AH=R,this._$AN=void 0,this._$AA=e,this._$AB=o,this._$AM=i,this.options=n,this._$Cv=(n==null?void 0:n.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const o=this._$AM;return o!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=o.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,o=this){e=Wt(this,e,o),le(e)?e===R||e==null||e===""?(this._$AH!==R&&this._$AR(),this._$AH=R):e!==this._$AH&&e!==Tt&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Fr(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==R&&le(this._$AH)?this._$AA.nextSibling.data=e:this.T(zt.createTextNode(e)),this._$AH=e}$(e){var r;const{values:o,_$litType$:i}=e,n=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=ce.createElement(ir(i.h,i.h[0]),this.options)),i);if(((r=this._$AH)==null?void 0:r._$AD)===n)this._$AH.p(o);else{const a=new Vr(n,this),s=a.u(this.options);a.p(o),this.T(s),this._$AH=a}}_$AC(e){let o=Fo.get(e.strings);return o===void 0&&Fo.set(e.strings,o=new ce(e)),o}k(e){$o(this._$AH)||(this._$AH=[],this._$AR());const o=this._$AH;let i,n=0;for(const r of e)n===o.length?o.push(i=new ge(this.O(se()),this.O(se()),this,this.options)):i=o[n],i._$AI(r),n++;n<o.length&&(this._$AR(i&&i._$AB.nextSibling,n),o.length=n)}_$AR(e=this._$AA.nextSibling,o){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,o);e!==this._$AB;){const n=Mo(e).nextSibling;Mo(e).remove(),e=n}}setConnected(e){var o;this._$AM===void 0&&(this._$Cv=e,(o=this._$AP)==null||o.call(this,e))}}class Fe{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,o,i,n,r){this.type=1,this._$AH=R,this._$AN=void 0,this.element=e,this.name=o,this._$AM=n,this.options=r,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=R}_$AI(e,o=this,i,n){const r=this.strings;let a=!1;if(r===void 0)e=Wt(this,e,o,0),a=!le(e)||e!==this._$AH&&e!==Tt,a&&(this._$AH=e);else{const s=e;let l,d;for(e=r[0],l=0;l<r.length-1;l++)d=Wt(this,s[i+l],o,l),d===Tt&&(d=this._$AH[l]),a||(a=!le(d)||d!==this._$AH[l]),d===R?e=R:e!==R&&(e+=(d??"")+r[l+1]),this._$AH[l]=d}a&&!n&&this.j(e)}j(e){e===R?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Ur extends Fe{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===R?void 0:e}}class Zr extends Fe{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==R)}}class Kr extends Fe{constructor(e,o,i,n,r){super(e,o,i,n,r),this.type=5}_$AI(e,o=this){if((e=Wt(this,e,o,0)??R)===Tt)return;const i=this._$AH,n=e===R&&i!==R||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,r=e!==R&&(i===R||n);n&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var o;typeof this._$AH=="function"?this._$AH.call(((o=this.options)==null?void 0:o.host)??this.element,e):this._$AH.handleEvent(e)}}class Gr{constructor(e,o,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=o,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Wt(this,e)}}const Xe=ie.litHtmlPolyfillSupport;Xe==null||Xe(ce,ge),(ie.litHtmlVersions??(ie.litHtmlVersions=[])).push("3.3.3");const Yr=(t,e,o)=>{const i=(o==null?void 0:o.renderBefore)??e;let n=i._$litPart$;if(n===void 0){const r=(o==null?void 0:o.renderBefore)??null;i._$litPart$=n=new ge(e.insertBefore(se(),r),r,void 0,o??{})}return n._$AI(t),n};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Pt=globalThis;let _=class extends jt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var o;const e=super.createRenderRoot();return(o=this.renderOptions).renderBefore??(o.renderBefore=e.firstChild),e}update(e){const o=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Yr(o,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return Tt}};var Qo;_._$litElement$=!0,_.finalized=!0,(Qo=Pt.litElementHydrateSupport)==null||Qo.call(Pt,{LitElement:_});const to=Pt.litElementPolyfillSupport;to==null||to({LitElement:_});(Pt.litElementVersions??(Pt.litElementVersions=[])).push("4.2.2");const qr={black:"#202020",white:"#FFFFFF",white010:"rgba(255, 255, 255, 0.1)",accent010:"rgba(9, 136, 240, 0.1)",accent020:"rgba(9, 136, 240, 0.2)",accent030:"rgba(9, 136, 240, 0.3)",accent040:"rgba(9, 136, 240, 0.4)",accent050:"rgba(9, 136, 240, 0.5)",accent060:"rgba(9, 136, 240, 0.6)",accent070:"rgba(9, 136, 240, 0.7)",accent080:"rgba(9, 136, 240, 0.8)",accent090:"rgba(9, 136, 240, 0.9)",accent100:"rgba(9, 136, 240, 1.0)",accentSecondary010:"rgba(199, 185, 148, 0.1)",accentSecondary020:"rgba(199, 185, 148, 0.2)",accentSecondary030:"rgba(199, 185, 148, 0.3)",accentSecondary040:"rgba(199, 185, 148, 0.4)",accentSecondary050:"rgba(199, 185, 148, 0.5)",accentSecondary060:"rgba(199, 185, 148, 0.6)",accentSecondary070:"rgba(199, 185, 148, 0.7)",accentSecondary080:"rgba(199, 185, 148, 0.8)",accentSecondary090:"rgba(199, 185, 148, 0.9)",accentSecondary100:"rgba(199, 185, 148, 1.0)",productWalletKit:"#FFB800",productAppKit:"#FF573B",productCloud:"#0988F0",productDocumentation:"#008847",neutrals050:"#F6F6F6",neutrals100:"#F3F3F3",neutrals200:"#E9E9E9",neutrals300:"#D0D0D0",neutrals400:"#BBB",neutrals500:"#9A9A9A",neutrals600:"#6C6C6C",neutrals700:"#4F4F4F",neutrals800:"#363636",neutrals900:"#2A2A2A",neutrals1000:"#252525",semanticSuccess010:"rgba(48, 164, 107, 0.1)",semanticSuccess020:"rgba(48, 164, 107, 0.2)",semanticSuccess030:"rgba(48, 164, 107, 0.3)",semanticSuccess040:"rgba(48, 164, 107, 0.4)",semanticSuccess050:"rgba(48, 164, 107, 0.5)",semanticSuccess060:"rgba(48, 164, 107, 0.6)",semanticSuccess070:"rgba(48, 164, 107, 0.7)",semanticSuccess080:"rgba(48, 164, 107, 0.8)",semanticSuccess090:"rgba(48, 164, 107, 0.9)",semanticSuccess100:"rgba(48, 164, 107, 1.0)",semanticError010:"rgba(223, 74, 52, 0.1)",semanticError020:"rgba(223, 74, 52, 0.2)",semanticError030:"rgba(223, 74, 52, 0.3)",semanticError040:"rgba(223, 74, 52, 0.4)",semanticError050:"rgba(223, 74, 52, 0.5)",semanticError060:"rgba(223, 74, 52, 0.6)",semanticError070:"rgba(223, 74, 52, 0.7)",semanticError080:"rgba(223, 74, 52, 0.8)",semanticError090:"rgba(223, 74, 52, 0.9)",semanticError100:"rgba(223, 74, 52, 1.0)",semanticWarning010:"rgba(243, 161, 63, 0.1)",semanticWarning020:"rgba(243, 161, 63, 0.2)",semanticWarning030:"rgba(243, 161, 63, 0.3)",semanticWarning040:"rgba(243, 161, 63, 0.4)",semanticWarning050:"rgba(243, 161, 63, 0.5)",semanticWarning060:"rgba(243, 161, 63, 0.6)",semanticWarning070:"rgba(243, 161, 63, 0.7)",semanticWarning080:"rgba(243, 161, 63, 0.8)",semanticWarning090:"rgba(243, 161, 63, 0.9)",semanticWarning100:"rgba(243, 161, 63, 1.0)"},Te={core:{backgroundAccentPrimary:"#0988F0",backgroundAccentCertified:"#C7B994",backgroundWalletKit:"#FFB800",backgroundAppKit:"#FF573B",backgroundCloud:"#0988F0",backgroundDocumentation:"#008847",backgroundSuccess:"rgba(48, 164, 107, 0.20)",backgroundError:"rgba(223, 74, 52, 0.20)",backgroundWarning:"rgba(243, 161, 63, 0.20)",textAccentPrimary:"#0988F0",textAccentCertified:"#C7B994",textWalletKit:"#FFB800",textAppKit:"#FF573B",textCloud:"#0988F0",textDocumentation:"#008847",textSuccess:"#30A46B",textError:"#DF4A34",textWarning:"#F3A13F",borderAccentPrimary:"#0988F0",borderSecondary:"#C7B994",borderSuccess:"#30A46B",borderError:"#DF4A34",borderWarning:"#F3A13F",foregroundAccent010:"rgba(9, 136, 240, 0.1)",foregroundAccent020:"rgba(9, 136, 240, 0.2)",foregroundAccent040:"rgba(9, 136, 240, 0.4)",foregroundAccent060:"rgba(9, 136, 240, 0.6)",foregroundSecondary020:"rgba(199, 185, 148, 0.2)",foregroundSecondary040:"rgba(199, 185, 148, 0.4)",foregroundSecondary060:"rgba(199, 185, 148, 0.6)",iconAccentPrimary:"#0988F0",iconAccentCertified:"#C7B994",iconSuccess:"#30A46B",iconError:"#DF4A34",iconWarning:"#F3A13F",glass010:"rgba(255, 255, 255, 0.1)",zIndex:"9999"},dark:{overlay:"rgba(0, 0, 0, 0.50)",backgroundPrimary:"#202020",backgroundInvert:"#FFFFFF",textPrimary:"#FFFFFF",textSecondary:"#9A9A9A",textTertiary:"#BBBBBB",textInvert:"#202020",borderPrimary:"#2A2A2A",borderPrimaryDark:"#363636",borderSecondary:"#4F4F4F",foregroundPrimary:"#252525",foregroundSecondary:"#2A2A2A",foregroundTertiary:"#363636",iconDefault:"#9A9A9A",iconInverse:"#FFFFFF"},light:{overlay:"rgba(230 , 230, 230, 0.5)",backgroundPrimary:"#FFFFFF",borderPrimaryDark:"#E9E9E9",backgroundInvert:"#202020",textPrimary:"#202020",textSecondary:"#9A9A9A",textTertiary:"#6C6C6C",textInvert:"#FFFFFF",borderPrimary:"#E9E9E9",borderSecondary:"#D0D0D0",foregroundPrimary:"#F3F3F3",foregroundSecondary:"#E9E9E9",foregroundTertiary:"#D0D0D0",iconDefault:"#9A9A9A",iconInverse:"#202020"}},Jr={1:"4px",2:"8px",10:"10px",3:"12px",4:"16px",6:"24px",5:"20px",8:"32px",16:"64px",20:"80px",32:"128px",64:"256px",128:"512px",round:"9999px"},Qr={0:"0px","01":"2px",1:"4px",2:"8px",3:"12px",4:"16px",5:"20px",6:"24px",7:"28px",8:"32px",9:"36px",10:"40px",12:"48px",14:"56px",16:"64px",20:"80px",32:"128px",64:"256px"},Xr={regular:"KHTeka",mono:"KHTekaMono"},ti={regular:"400",medium:"500"},ei={h1:"50px",h2:"44px",h3:"38px",h4:"32px",h5:"26px",h6:"20px",large:"16px",medium:"14px",small:"12px"},oi={"h1-regular-mono":{lineHeight:"50px",letterSpacing:"-3px"},"h1-regular":{lineHeight:"50px",letterSpacing:"-1px"},"h1-medium":{lineHeight:"50px",letterSpacing:"-0.84px"},"h2-regular-mono":{lineHeight:"44px",letterSpacing:"-2.64px"},"h2-regular":{lineHeight:"44px",letterSpacing:"-0.88px"},"h2-medium":{lineHeight:"44px",letterSpacing:"-0.88px"},"h3-regular-mono":{lineHeight:"38px",letterSpacing:"-2.28px"},"h3-regular":{lineHeight:"38px",letterSpacing:"-0.76px"},"h3-medium":{lineHeight:"38px",letterSpacing:"-0.76px"},"h4-regular-mono":{lineHeight:"32px",letterSpacing:"-1.92px"},"h4-regular":{lineHeight:"32px",letterSpacing:"-0.32px"},"h4-medium":{lineHeight:"32px",letterSpacing:"-0.32px"},"h5-regular-mono":{lineHeight:"26px",letterSpacing:"-1.56px"},"h5-regular":{lineHeight:"26px",letterSpacing:"-0.26px"},"h5-medium":{lineHeight:"26px",letterSpacing:"-0.26px"},"h6-regular-mono":{lineHeight:"20px",letterSpacing:"-1.2px"},"h6-regular":{lineHeight:"20px",letterSpacing:"-0.6px"},"h6-medium":{lineHeight:"20px",letterSpacing:"-0.6px"},"lg-regular-mono":{lineHeight:"16px",letterSpacing:"-0.96px"},"lg-regular":{lineHeight:"18px",letterSpacing:"-0.16px"},"lg-medium":{lineHeight:"18px",letterSpacing:"-0.16px"},"md-regular-mono":{lineHeight:"14px",letterSpacing:"-0.84px"},"md-regular":{lineHeight:"16px",letterSpacing:"-0.14px"},"md-medium":{lineHeight:"16px",letterSpacing:"-0.14px"},"sm-regular-mono":{lineHeight:"12px",letterSpacing:"-0.72px"},"sm-regular":{lineHeight:"14px",letterSpacing:"-0.12px"},"sm-medium":{lineHeight:"14px",letterSpacing:"-0.12px"}},ri={"ease-out-power-2":"cubic-bezier(0.23, 0.09, 0.08, 1.13)","ease-out-power-1":"cubic-bezier(0.12, 0.04, 0.2, 1.06)","ease-in-power-2":"cubic-bezier(0.92, -0.13, 0.77, 0.91)","ease-in-power-1":"cubic-bezier(0.88, -0.06, 0.8, 0.96)","ease-inout-power-2":"cubic-bezier(0.77, 0.09, 0.23, 1.13)","ease-inout-power-1":"cubic-bezier(0.88, 0.04, 0.12, 1.06)"},ii={xl:"400ms",lg:"200ms",md:"125ms",sm:"75ms"},co={colors:qr,fontFamily:Xr,fontWeight:ti,textSize:ei,typography:oi,tokens:{core:Te.core,theme:Te.dark},borderRadius:Jr,spacing:Qr,durations:ii,easings:ri},Wo="--apkt";function _e(t){if(!t)return{};const e={};return e["font-family"]=t["--apkt-font-family"]??t["--w3m-font-family"]??"KHTeka",e.accent=t["--apkt-accent"]??t["--w3m-accent"]??"#0988F0",e["color-mix"]=t["--apkt-color-mix"]??t["--w3m-color-mix"]??"#000",e["color-mix-strength"]=t["--apkt-color-mix-strength"]??t["--w3m-color-mix-strength"]??0,e["font-size-master"]=t["--apkt-font-size-master"]??t["--w3m-font-size-master"]??"10px",e["border-radius-master"]=t["--apkt-border-radius-master"]??t["--w3m-border-radius-master"]??"4px",t["--apkt-z-index"]!==void 0?e["z-index"]=t["--apkt-z-index"]:t["--w3m-z-index"]!==void 0&&(e["z-index"]=t["--w3m-z-index"]),e}const dt={createCSSVariables(t){const e={},o={};function i(r,a,s=""){for(const[l,d]of Object.entries(r)){const u=s?`${s}-${l}`:l;d&&typeof d=="object"&&Object.keys(d).length?(a[l]={},i(d,a[l],u)):typeof d=="string"&&(a[l]=`${Wo}-${u}`)}}function n(r,a){for(const[s,l]of Object.entries(r))l&&typeof l=="object"?(a[s]={},n(l,a[s])):typeof l=="string"&&(a[s]=`var(${l})`)}return i(t,e),n(e,o),{cssVariables:e,cssVariablesVarPrefix:o}},assignCSSVariables(t,e){const o={};function i(n,r,a){for(const[s,l]of Object.entries(n)){const d=a?`${a}-${s}`:s,u=r[s];l&&typeof l=="object"?i(l,u,d):typeof u=="string"&&(o[`${Wo}-${d}`]=u)}}return i(t,e),o},createRootStyles(t,e){const o={...co,tokens:{...co.tokens,theme:t==="light"?Te.light:Te.dark}},{cssVariables:i}=dt.createCSSVariables(o),n=dt.assignCSSVariables(i,o),r=dt.generateW3MVariables(e),a=dt.generateW3MOverrides(e),s=dt.generateScaledVariables(e),l=dt.generateBaseVariables(n),d={...n,...l,...r,...a,...s},u=dt.applyColorMixToVariables(e,d),b={...d,...u};return`:root {${Object.entries(b).map(([g,x])=>`${g}:${x.replace("/[:;{}</>]/g","")};`).join("")}}`},generateW3MVariables(t){if(!t)return{};const e=_e(t),o={};return o["--w3m-font-family"]=e["font-family"],o["--w3m-accent"]=e.accent,o["--w3m-color-mix"]=e["color-mix"],o["--w3m-color-mix-strength"]=`${e["color-mix-strength"]}%`,o["--w3m-font-size-master"]=e["font-size-master"],o["--w3m-border-radius-master"]=e["border-radius-master"],o},generateW3MOverrides(t){if(!t)return{};const e=_e(t),o={};if(t["--apkt-accent"]||t["--w3m-accent"]){const i=e.accent;o["--apkt-tokens-core-iconAccentPrimary"]=i,o["--apkt-tokens-core-borderAccentPrimary"]=i,o["--apkt-tokens-core-textAccentPrimary"]=i,o["--apkt-tokens-core-backgroundAccentPrimary"]=i}return(t["--apkt-font-family"]||t["--w3m-font-family"])&&(o["--apkt-fontFamily-regular"]=e["font-family"]),e["z-index"]!==void 0&&(o["--apkt-tokens-core-zIndex"]=`${e["z-index"]}`),o},generateScaledVariables(t){if(!t)return{};const e=_e(t),o={};if(t["--apkt-font-size-master"]||t["--w3m-font-size-master"]){const i=parseFloat(e["font-size-master"].replace("px",""));o["--apkt-textSize-h1"]=`${Number(i)*5}px`,o["--apkt-textSize-h2"]=`${Number(i)*4.4}px`,o["--apkt-textSize-h3"]=`${Number(i)*3.8}px`,o["--apkt-textSize-h4"]=`${Number(i)*3.2}px`,o["--apkt-textSize-h5"]=`${Number(i)*2.6}px`,o["--apkt-textSize-h6"]=`${Number(i)*2}px`,o["--apkt-textSize-large"]=`${Number(i)*1.6}px`,o["--apkt-textSize-medium"]=`${Number(i)*1.4}px`,o["--apkt-textSize-small"]=`${Number(i)*1.2}px`}if(t["--apkt-border-radius-master"]||t["--w3m-border-radius-master"]){const i=parseFloat(e["border-radius-master"].replace("px",""));o["--apkt-borderRadius-1"]=`${Number(i)}px`,o["--apkt-borderRadius-2"]=`${Number(i)*2}px`,o["--apkt-borderRadius-3"]=`${Number(i)*3}px`,o["--apkt-borderRadius-4"]=`${Number(i)*4}px`,o["--apkt-borderRadius-5"]=`${Number(i)*5}px`,o["--apkt-borderRadius-6"]=`${Number(i)*6}px`,o["--apkt-borderRadius-8"]=`${Number(i)*8}px`,o["--apkt-borderRadius-16"]=`${Number(i)*16}px`,o["--apkt-borderRadius-20"]=`${Number(i)*20}px`,o["--apkt-borderRadius-32"]=`${Number(i)*32}px`,o["--apkt-borderRadius-64"]=`${Number(i)*64}px`,o["--apkt-borderRadius-128"]=`${Number(i)*128}px`}return o},generateColorMixCSS(t,e){if(!(t!=null&&t["--w3m-color-mix"])||!t["--w3m-color-mix-strength"])return"";const o=t["--w3m-color-mix"],i=t["--w3m-color-mix-strength"];if(!i||i===0)return"";const n=Object.keys(e||{}).filter(a=>{const s=a.includes("-tokens-core-background")||a.includes("-tokens-core-text")||a.includes("-tokens-core-border")||a.includes("-tokens-core-foreground")||a.includes("-tokens-core-icon")||a.includes("-tokens-theme-background")||a.includes("-tokens-theme-text")||a.includes("-tokens-theme-border")||a.includes("-tokens-theme-foreground")||a.includes("-tokens-theme-icon"),l=a.includes("-borderRadius-")||a.includes("-spacing-")||a.includes("-textSize-")||a.includes("-fontFamily-")||a.includes("-fontWeight-")||a.includes("-typography-")||a.includes("-duration-")||a.includes("-ease-")||a.includes("-path-")||a.includes("-width-")||a.includes("-height-")||a.includes("-visual-size-")||a.includes("-modal-width")||a.includes("-cover");return s&&!l});return n.length===0?"":` @supports (background: color-mix(in srgb, white 50%, black)) {
      :root {
        ${n.map(a=>{const s=(e==null?void 0:e[a])||"";return s.includes("color-mix")||s.startsWith("#")||s.startsWith("rgb")?`${a}: color-mix(in srgb, ${o} ${i}%, ${s});`:`${a}: color-mix(in srgb, ${o} ${i}%, var(${a}-base, ${s}));`}).join("")}
      }
    }`},generateBaseVariables(t){const e={},o=t["--apkt-tokens-theme-backgroundPrimary"];o&&(e["--apkt-tokens-theme-backgroundPrimary-base"]=o);const i=t["--apkt-tokens-core-backgroundAccentPrimary"];return i&&(e["--apkt-tokens-core-backgroundAccentPrimary-base"]=i),e},applyColorMixToVariables(t,e){const o={};e!=null&&e["--apkt-tokens-theme-backgroundPrimary"]&&(o["--apkt-tokens-theme-backgroundPrimary"]="var(--apkt-tokens-theme-backgroundPrimary-base)"),e!=null&&e["--apkt-tokens-core-backgroundAccentPrimary"]&&(o["--apkt-tokens-core-backgroundAccentPrimary"]="var(--apkt-tokens-core-backgroundAccentPrimary-base)");const i=_e(t),n=i["color-mix"],r=i["color-mix-strength"];if(!r||r===0)return o;const a=Object.keys(e||{}).filter(s=>{const l=s.includes("-tokens-core-background")||s.includes("-tokens-core-text")||s.includes("-tokens-core-border")||s.includes("-tokens-core-foreground")||s.includes("-tokens-core-icon")||s.includes("-tokens-theme-background")||s.includes("-tokens-theme-text")||s.includes("-tokens-theme-border")||s.includes("-tokens-theme-foreground")||s.includes("-tokens-theme-icon")||s.includes("-tokens-theme-overlay"),d=s.includes("-borderRadius-")||s.includes("-spacing-")||s.includes("-textSize-")||s.includes("-fontFamily-")||s.includes("-fontWeight-")||s.includes("-typography-")||s.includes("-duration-")||s.includes("-ease-")||s.includes("-path-")||s.includes("-width-")||s.includes("-height-")||s.includes("-visual-size-")||s.includes("-modal-width")||s.includes("-cover");return l&&!d});return a.length===0||a.forEach(s=>{const l=(e==null?void 0:e[s])||"";s.endsWith("-base")||(s==="--apkt-tokens-theme-backgroundPrimary"||s==="--apkt-tokens-core-backgroundAccentPrimary"?o[s]=`color-mix(in srgb, ${n} ${r}%, var(${s}-base))`:l.includes("color-mix")||l.startsWith("#")||l.startsWith("rgb")?o[s]=`color-mix(in srgb, ${n} ${r}%, ${l})`:o[s]=`color-mix(in srgb, ${n} ${r}%, var(${s}-base, ${l}))`)}),o}},{cssVariablesVarPrefix:z}=dt.createCSSVariables(co);function P(t,...e){return G(t,...e.map(o=>X(typeof o=="function"?o(z):o)))}let kt,Et,ot,V,Re;const ct={"KHTeka-500-woff2":"https://fonts.reown.com/KHTeka-Medium.woff2","KHTeka-400-woff2":"https://fonts.reown.com/KHTeka-Regular.woff2","KHTeka-300-woff2":"https://fonts.reown.com/KHTeka-Light.woff2","KHTekaMono-400-woff2":"https://fonts.reown.com/KHTekaMono-Regular.woff2","KHTeka-500-woff":"https://fonts.reown.com/KHTeka-Light.woff","KHTeka-400-woff":"https://fonts.reown.com/KHTeka-Regular.woff","KHTeka-300-woff":"https://fonts.reown.com/KHTeka-Light.woff","KHTekaMono-400-woff":"https://fonts.reown.com/KHTekaMono-Regular.woff"};function Le(t,e="dark"){kt&&document.head.removeChild(kt),kt=document.createElement("style"),kt.textContent=dt.createRootStyles(e,t),document.head.appendChild(kt)}function Xa(t,e="dark"){if(Re=t,Et=document.createElement("style"),ot=document.createElement("style"),V=document.createElement("style"),Et.textContent=Ft(t).core.cssText,ot.textContent=Ft(t).dark.cssText,V.textContent=Ft(t).light.cssText,document.head.appendChild(Et),document.head.appendChild(ot),document.head.appendChild(V),Le(t,e),Vo(e),!((t==null?void 0:t["--apkt-font-family"])||(t==null?void 0:t["--w3m-font-family"])))for(const[i,n]of Object.entries(ct)){const r=document.createElement("link");r.rel="preload",r.href=n,r.as="font",r.type=i.includes("woff2")?"font/woff2":"font/woff",r.crossOrigin="anonymous",document.head.appendChild(r)}Vo(e)}function Vo(t="dark"){ot&&V&&kt&&(t==="light"?(Le(Re,t),ot.removeAttribute("media"),V.media="enabled"):(Le(Re,t),V.removeAttribute("media"),ot.media="enabled"))}function ts(t){var e,o,i;if(Re=t,Et&&ot&&V){Et.textContent=Ft(t).core.cssText,ot.textContent=Ft(t).dark.cssText,V.textContent=Ft(t).light.cssText;const n=(t==null?void 0:t["--apkt-font-family"])||(t==null?void 0:t["--w3m-font-family"]);n&&(Et.textContent=(e=Et.textContent)==null?void 0:e.replace("font-family: KHTeka",`font-family: ${n}`),ot.textContent=(o=ot.textContent)==null?void 0:o.replace("font-family: KHTeka",`font-family: ${n}`),V.textContent=(i=V.textContent)==null?void 0:i.replace("font-family: KHTeka",`font-family: ${n}`))}if(kt){const n=(V==null?void 0:V.media)==="enabled"?"light":"dark";Le(t,n)}}function Ft(t){const e=!!(t!=null&&t["--apkt-font-family"]||t!=null&&t["--w3m-font-family"]);return{core:G`
      ${e?G``:G`
            @font-face {
              font-family: 'KHTeka';
              src:
                url(${X(ct["KHTeka-400-woff2"])}) format('woff2'),
                url(${X(ct["KHTeka-400-woff"])}) format('woff');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }

            @font-face {
              font-family: 'KHTeka';
              src:
                url(${X(ct["KHTeka-300-woff2"])}) format('woff2'),
                url(${X(ct["KHTeka-300-woff"])}) format('woff');
              font-weight: 300;
              font-style: normal;
            }

            @font-face {
              font-family: 'KHTekaMono';
              src:
                url(${X(ct["KHTekaMono-400-woff2"])}) format('woff2'),
                url(${X(ct["KHTekaMono-400-woff"])}) format('woff');
              font-weight: 400;
              font-style: normal;
            }

            @font-face {
              font-family: 'KHTeka';
              src:
                url(${X(ct["KHTeka-400-woff2"])}) format('woff2'),
                url(${X(ct["KHTeka-400-woff"])}) format('woff');
              font-weight: 400;
              font-style: normal;
            }
          `}

      @keyframes w3m-shake {
        0% {
          transform: scale(1) rotate(0deg);
        }
        20% {
          transform: scale(1) rotate(-1deg);
        }
        40% {
          transform: scale(1) rotate(1.5deg);
        }
        60% {
          transform: scale(1) rotate(-1.5deg);
        }
        80% {
          transform: scale(1) rotate(1deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }
      @keyframes w3m-iframe-fade-out {
        0% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
      @keyframes w3m-iframe-zoom-in {
        0% {
          transform: translateY(50px);
          opacity: 0;
        }
        100% {
          transform: translateY(0px);
          opacity: 1;
        }
      }
      @keyframes w3m-iframe-zoom-in-mobile {
        0% {
          transform: scale(0.95);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      :root {
        --apkt-modal-width: 370px;

        --apkt-visual-size-inherit: inherit;
        --apkt-visual-size-sm: 40px;
        --apkt-visual-size-md: 55px;
        --apkt-visual-size-lg: 80px;

        --apkt-path-network-sm: path(
          'M15.4 2.1a5.21 5.21 0 0 1 5.2 0l11.61 6.7a5.21 5.21 0 0 1 2.61 4.52v13.4c0 1.87-1 3.59-2.6 4.52l-11.61 6.7c-1.62.93-3.6.93-5.22 0l-11.6-6.7a5.21 5.21 0 0 1-2.61-4.51v-13.4c0-1.87 1-3.6 2.6-4.52L15.4 2.1Z'
        );

        --apkt-path-network-md: path(
          'M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z'
        );

        --apkt-path-network-lg: path(
          'M78.3244 18.926L50.1808 2.45078C45.7376 -0.150261 40.2624 -0.150262 35.8192 2.45078L7.6756 18.926C3.23322 21.5266 0.5 26.3301 0.5 31.5248V64.4752C0.5 69.6699 3.23322 74.4734 7.6756 77.074L35.8192 93.5492C40.2624 96.1503 45.7376 96.1503 50.1808 93.5492L78.3244 77.074C82.7668 74.4734 85.5 69.6699 85.5 64.4752V31.5248C85.5 26.3301 82.7668 21.5266 78.3244 18.926Z'
        );

        --apkt-width-network-sm: 36px;
        --apkt-width-network-md: 48px;
        --apkt-width-network-lg: 86px;

        --apkt-duration-dynamic: 0ms;
        --apkt-height-network-sm: 40px;
        --apkt-height-network-md: 54px;
        --apkt-height-network-lg: 96px;
      }
    `,dark:G`
      :root {
      }
    `,light:G`
      :root {
      }
    `}}const E=G`
  div,
  span,
  iframe,
  a,
  img,
  form,
  button,
  label,
  *::after,
  *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-style: normal;
    text-rendering: optimizeSpeed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
    backface-visibility: hidden;
  }

  :host {
    font-family: var(--apkt-fontFamily-regular);
  }
`,B=G`
  button,
  a {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
    outline: none;
    border: none;
    text-decoration: none;
    transition:
      background-color var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      color var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      border var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      box-shadow var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      width var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      height var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      transform var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      opacity var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      scale var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2),
      border-radius var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2);
    will-change:
      background-color, color, border, box-shadow, width, height, transform, opacity, scale,
      border-radius;
  }

  a:active:not([disabled]),
  button:active:not([disabled]) {
    scale: 0.975;
    transform-origin: center;
  }

  button:disabled {
    cursor: default;
  }

  input {
    border: none;
    outline: none;
    appearance: none;
  }
`,Se=".",I={getSpacingStyles(t,e){if(Array.isArray(t))return t[e]?`var(--apkt-spacing-${t[e]})`:void 0;if(typeof t=="string")return`var(--apkt-spacing-${t})`},getFormattedDate(t){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t)},formatCurrency(t=0,e={}){const o=Number(t);return isNaN(o)?"$0.00":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2,...e}).format(o)},getHostName(t){try{return new URL(t).hostname}catch{return""}},getTruncateString({string:t,charsStart:e,charsEnd:o,truncate:i}){return t.length<=e+o?t:i==="end"?`${t.substring(0,e)}...`:i==="start"?`...${t.substring(t.length-o)}`:`${t.substring(0,Math.floor(e))}...${t.substring(t.length-Math.floor(o))}`},generateAvatarColors(t){const o=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),i=this.hexToRgb(o),n=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),a=100-3*Number(n==null?void 0:n.replace("px","")),s=`${a}% ${a}% at 65% 40%`,l=[];for(let d=0;d<5;d+=1){const u=this.tintColor(i,.15*d);l.push(`rgb(${u[0]}, ${u[1]}, ${u[2]})`)}return`
    --local-color-1: ${l[0]};
    --local-color-2: ${l[1]};
    --local-color-3: ${l[2]};
    --local-color-4: ${l[3]};
    --local-color-5: ${l[4]};
    --local-radial-circle: ${s}
   `},hexToRgb(t){const e=parseInt(t,16),o=e>>16&255,i=e>>8&255,n=e&255;return[o,i,n]},tintColor(t,e){const[o,i,n]=t,r=Math.round(o+(255-o)*e),a=Math.round(i+(255-i)*e),s=Math.round(n+(255-n)*e);return[r,a,s]},isNumber(t){return{number:/^[0-9]+$/u}.number.test(t)},getColorTheme(t){var e;return t||(typeof window<"u"&&window.matchMedia&&typeof window.matchMedia=="function"?(e=window.matchMedia("(prefers-color-scheme: dark)"))!=null&&e.matches?"dark":"light":"dark")},splitBalance(t){const e=t.split(".");return e.length===2?[e[0],e[1]]:["0","00"]},roundNumber(t,e,o){return t.toString().length>=e?Number(t).toFixed(o):t},cssDurationToNumber(t){return t.endsWith("s")?Number(t.replace("s",""))*1e3:t.endsWith("ms")?Number(t.replace("ms","")):0},maskInput({value:t,decimals:e,integers:o}){if(t=t.replace(",","."),t===Se)return`0${Se}`;const[i="",n]=t.split(Se).map(u=>u.replace(/[^0-9]/gu,"")),r=o?i.substring(0,o):i,a=r.length===2?String(Number(r)):r,s=typeof e=="number"?n==null?void 0:n.substring(0,e):n,l=typeof e!="number"||e>0;return(typeof s=="string"&&l?[a,s].join(Se):a)??""},capitalize(t){return t?t.charAt(0).toUpperCase()+t.slice(1):""}};function ni(t,e){const{kind:o,elements:i}=e;return{kind:o,elements:i,finisher(n){customElements.get(t)||customElements.define(t,n)}}}function ai(t,e){return customElements.get(t)||customElements.define(t,e),e}function k(t){return function(o){return typeof o=="function"?ai(t,o):ni(t,o)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const si={attribute:!0,type:String,converter:Pe,reflect:!1,hasChanged:yo},li=(t=si,e,o)=>{const{kind:i,metadata:n}=o;let r=globalThis.litPropertyMetadata.get(n);if(r===void 0&&globalThis.litPropertyMetadata.set(n,r=new Map),i==="setter"&&((t=Object.create(t)).wrapped=!0),r.set(o.name,t),i==="accessor"){const{name:a}=o;return{set(s){const l=e.get.call(this);e.set.call(this,s),this.requestUpdate(a,l,t,!0,s)},init(s){return s!==void 0&&this.C(a,void 0,t,s),s}}}if(i==="setter"){const{name:a}=o;return function(s){const l=this[a];e.call(this,s),this.requestUpdate(a,l,t,!0,s)}}throw Error("Unsupported decorator location: "+i)};function c(t){return(e,o)=>typeof o=="object"?li(t,e,o):((i,n,r)=>{const a=n.hasOwnProperty(r);return n.constructor.createProperty(r,i),a?Object.getOwnPropertyDescriptor(n,r):void 0})(t,e,o)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ci(t){return c({...t,state:!0,attribute:!1})}const di=G`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
    box-sizing: border-box;
  }
`;var j=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let M=class extends _{render(){return this.style.cssText=`
      flex-direction: ${this.flexDirection};
      flex-wrap: ${this.flexWrap};
      flex-basis: ${this.flexBasis};
      flex-grow: ${this.flexGrow};
      flex-shrink: ${this.flexShrink};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};
      padding-top: ${this.padding&&I.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&I.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&I.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&I.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&I.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&I.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&I.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&I.getSpacingStyles(this.margin,3)};
      width: ${this.width};
    `,h`<slot></slot>`}};M.styles=[E,di];j([c()],M.prototype,"flexDirection",void 0);j([c()],M.prototype,"flexWrap",void 0);j([c()],M.prototype,"flexBasis",void 0);j([c()],M.prototype,"flexGrow",void 0);j([c()],M.prototype,"flexShrink",void 0);j([c()],M.prototype,"alignItems",void 0);j([c()],M.prototype,"justifyContent",void 0);j([c()],M.prototype,"columnGap",void 0);j([c()],M.prototype,"rowGap",void 0);j([c()],M.prototype,"gap",void 0);j([c()],M.prototype,"padding",void 0);j([c()],M.prototype,"margin",void 0);j([c()],M.prototype,"width",void 0);M=j([k("wui-flex")],M);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const U=t=>t??R;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const nr=Symbol.for(""),ui=t=>{if((t==null?void 0:t.r)===nr)return t==null?void 0:t._$litStatic$},hi=t=>({_$litStatic$:t,r:nr}),Uo=new Map,pi=t=>(e,...o)=>{const i=o.length;let n,r;const a=[],s=[];let l,d=0,u=!1;for(;d<i;){for(l=e[d];d<i&&(r=o[d],(n=ui(r))!==void 0);)l+=n+e[++d],u=!0;d!==i&&s.push(r),a.push(l),d++}if(d===i&&a.push(e[i]),u){const b=a.join("$$lit$$");(e=Uo.get(b))===void 0&&(a.raw=a,Uo.set(b,e=a)),o=s}return t(e,...o)},Zo=pi(h),fi=A`<svg width="30" height="30" viewBox="0 0 30 30" fill="none">
  <g clip-path="url(#clip0_87_33)">
    <path d="M23.9367 2.29447e-07H6.05917C5.26333 -0.000218805 4.47526 0.156384 3.73997 0.46086C3.00469 0.765337 2.33661 1.21172 1.77391 1.7745C1.21121 2.33727 0.764917 3.00542 0.460542 3.74074C0.156167 4.47607 -0.000327963 5.26417 5.16031e-07 6.06V23.9433C4.48257e-07 24.7389 0.156744 25.5267 0.461276 26.2617C0.765808 26.9967 1.21216 27.6645 1.77484 28.2269C2.33752 28.7894 3.0055 29.2355 3.74061 29.5397C4.47573 29.8439 5.26358 30.0003 6.05917 30H23.9417C25.5486 29.9996 27.0895 29.3609 28.2257 28.2245C29.3618 27.0881 30 25.5469 30 23.94V6.06C29.9993 4.45241 29.3602 2.91091 28.2232 1.77449C27.0861 0.638064 25.5443 -0.000220881 23.9367 2.29447e-07Z" fill="url(#paint0_linear_87_33)"/>
    <path d="M14.8708 6.89259L15.4783 5.84259C15.5679 5.68703 15.6873 5.55064 15.8296 5.44122C15.9719 5.3318 16.1344 5.25148 16.3078 5.20486C16.4812 5.15824 16.662 5.14622 16.8401 5.1695C17.0181 5.19277 17.1898 5.25088 17.3453 5.34051C17.5009 5.43013 17.6373 5.54952 17.7467 5.69186C17.8561 5.83419 17.9364 5.99669 17.9831 6.17006C18.0297 6.34344 18.0417 6.5243 18.0184 6.70232C17.9952 6.88034 17.9371 7.05203 17.8474 7.20759L11.9949 17.3401H16.2283C17.5999 17.3401 18.3691 18.9526 17.7724 20.0701H5.36159C5.18215 20.0707 5.00436 20.0359 4.83845 19.9675C4.67254 19.8992 4.5218 19.7986 4.39492 19.6718C4.26803 19.5449 4.16751 19.3941 4.09915 19.2282C4.03079 19.0623 3.99593 18.8845 3.99659 18.7051C3.99659 17.9476 4.60492 17.3401 5.36159 17.3401H8.84159L13.2958 9.61926L11.9041 7.20426C11.738 6.89096 11.7 6.52543 11.7982 6.18469C11.8963 5.84395 12.1229 5.5546 12.4301 5.37763C12.7374 5.20065 13.1014 5.14987 13.4454 5.23599C13.7893 5.3221 14.0864 5.53838 14.2741 5.83926L14.8708 6.89259ZM9.60659 21.4759L8.29409 23.7526C8.20446 23.9082 8.08506 24.0446 7.94271 24.1541C7.80035 24.2636 7.63783 24.344 7.46441 24.3906C7.291 24.4373 7.11009 24.4493 6.93202 24.4261C6.75395 24.4028 6.58221 24.3447 6.42659 24.2551C6.27097 24.1655 6.13454 24.0461 6.02506 23.9037C5.91559 23.7613 5.83523 23.5988 5.78857 23.4254C5.74191 23.252 5.72986 23.0711 5.75311 22.893C5.77637 22.715 5.83446 22.5432 5.92409 22.3876L6.89909 20.7001C8.00159 20.3584 8.89742 20.6209 9.60659 21.4759ZM20.9066 17.3476H24.4583C25.2158 17.3476 25.8233 17.9551 25.8233 18.7126C25.8233 19.4701 25.2149 20.0776 24.4583 20.0776H22.4858L23.8166 22.3876C24.1916 23.0443 23.9708 23.8726 23.3149 24.2551C23.0006 24.4359 22.6274 24.4845 22.2772 24.3903C21.927 24.2961 21.6286 24.0667 21.4474 23.7526C19.2058 19.8643 17.5216 16.9534 16.4041 15.0151C15.2608 13.0426 16.0783 11.0626 16.8841 10.3909C17.7799 11.9293 19.1191 14.2501 20.9074 17.3476H20.9066Z" fill="white"/>
  </g>
  <defs>
    <linearGradient id="paint0_linear_87_33" x1="15" y1="2.29447e-07" x2="15" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#18BFFB"/>
      <stop offset="1" stop-color="#2072F3"/>
    </linearGradient>
    <clipPath id="clip0_87_33">
      <rect width="30" height="30" fill="white"/>
    </clipPath>
  </defs>
</svg>`,gi=A`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#000" />
      <g clip-path="url(#c)">
        <path
          fill="#fff"
          d="M28.77 23.3c-.69 1.99-2.75 5.52-4.87 5.56-1.4.03-1.86-.84-3.46-.84-1.61 0-2.12.81-3.45.86-2.25.1-5.72-5.1-5.72-9.62 0-4.15 2.9-6.2 5.42-6.25 1.36-.02 2.64.92 3.47.92.83 0 2.38-1.13 4.02-.97.68.03 2.6.28 3.84 2.08-3.27 2.14-2.76 6.61.75 8.25ZM24.2 7.88c-2.47.1-4.49 2.69-4.2 4.84 2.28.17 4.47-2.39 4.2-4.84Z"
        />
      </g>
    </g>
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
    <clipPath id="c"><path fill="#fff" d="M8 7.89h24v24H8z" /></clipPath>
  </defs>
</svg>`,mi=A`
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 11">
    <path
      fill="var(--apkt-tokens-theme-textPrimary)"
      d="M7.862 4.86c.159-1.064-.652-1.637-1.76-2.018l.36-1.443-.879-.218-.35 1.404c-.23-.058-.468-.112-.703-.166l.352-1.413-.877-.219-.36 1.442a29.02 29.02 0 0 1-.56-.132v-.005l-1.21-.302-.234.938s.652.15.638.158c.356.089.42.324.41.51l-.41 1.644a.715.715 0 0 1 .09.03l-.092-.024-.574 2.302c-.044.108-.154.27-.402.208.008.013-.639-.16-.639-.16L.227 8.403l1.142.285c.213.053.42.109.626.161l-.363 1.459.877.218.36-1.443c.239.065.472.125.7.182l-.36 1.436.879.219.363-1.456c1.497.283 2.623.17 3.097-1.185.381-1.09-.02-1.719-.807-2.129.574-.132 1.006-.51 1.12-1.289ZM5.856 7.673c-.272 1.09-2.107.5-2.702.353l.482-1.933c.595.149 2.503.443 2.22 1.58Zm.271-2.829c-.247.992-1.775.488-2.27.365l.436-1.753c.496.124 2.092.354 1.834 1.388Z"
    />
  </svg>
`,wi=A`<svg viewBox="0 0 32 32" fill="none">
<path d="M29.0612 10.0613L13.0612 26.0613C12.9218 26.2011 12.7563 26.3121 12.5739 26.3878C12.3916 26.4635 12.1961 26.5024 11.9987 26.5024C11.8013 26.5024 11.6058 26.4635 11.4235 26.3878C11.2411 26.3121 11.0756 26.2011 10.9362 26.0613L3.9362 19.0613C3.79667 18.9217 3.68599 18.7561 3.61047 18.5738C3.53496 18.3915 3.49609 18.1961 3.49609 17.9988C3.49609 17.8014 3.53496 17.606 3.61047 17.4237C3.68599 17.2414 3.79667 17.0758 3.9362 16.9363C4.07573 16.7967 4.24137 16.686 4.42367 16.6105C4.60598 16.535 4.80137 16.4962 4.9987 16.4962C5.19602 16.4962 5.39141 16.535 5.57372 16.6105C5.75602 16.686 5.92167 16.7967 6.0612 16.9363L11.9999 22.875L26.9387 7.93876C27.2205 7.65697 27.6027 7.49866 28.0012 7.49866C28.3997 7.49866 28.7819 7.65697 29.0637 7.93876C29.3455 8.22055 29.5038 8.60274 29.5038 9.00126C29.5038 9.39977 29.3455 9.78197 29.0637 10.0638L29.0612 10.0613Z" fill="currentColor"/>
</svg>
`,bi=A`<svg width="30" height="30" viewBox="0 0 30 30" fill="none">
<path d="M14.9978 7.80003H27.4668C26.2032 5.61107 24.3857 3.79333 22.1968 2.52955C20.008 1.26577 17.525 0.600485 14.9975 0.600586C12.47 0.600687 9.98712 1.26617 7.79838 2.53012C5.60964 3.79408 3.79221 5.61197 2.52881 7.80103L8.76281 18.599L8.76881 18.598C8.13412 17.5044 7.79906 16.2628 7.79743 14.9983C7.79579 13.7339 8.12764 12.4914 8.7595 11.3961C9.39136 10.3008 10.3009 9.39159 11.3963 8.76005C12.4918 8.12851 13.7344 7.79702 14.9988 7.79903L14.9978 7.80003Z" fill="url(#paint0_linear_87_32)"/>
<path d="M21.237 18.5981L15.003 29.3961C17.5305 29.3961 20.0134 28.7308 22.2022 27.467C24.391 26.2032 26.2086 24.3854 27.4721 22.1965C28.7356 20.0075 29.4006 17.5245 29.4003 14.997C29.3999 12.4695 28.7342 9.9867 27.47 7.7981H15.002L15 7.8041C16.2642 7.80168 17.5067 8.13257 18.6022 8.76342C19.6977 9.39428 20.6076 10.3028 21.2401 11.3974C21.8726 12.492 22.2053 13.734 22.2048 14.9982C22.2042 16.2623 21.8704 17.504 21.237 18.5981Z" fill="url(#paint1_linear_87_32)"/>
<path d="M8.76502 18.601L2.53102 7.80298C1.26664 9.99172 0.600848 12.4748 0.600586 15.0025C0.600324 17.5302 1.2656 20.0134 2.52953 22.2024C3.79345 24.3914 5.61145 26.209 7.80071 27.4725C9.98998 28.736 12.4733 29.4008 15.001 29.4L21.236 18.602L21.232 18.598C20.6022 19.6941 19.6944 20.6049 18.6003 21.2383C17.5062 21.8717 16.2644 22.2055 15.0002 22.2059C13.7359 22.2063 12.4939 21.8733 11.3994 21.2406C10.3049 20.6079 9.39657 19.6977 8.76602 18.602L8.76502 18.601Z" fill="url(#paint2_linear_87_32)"/>
<path d="M14.9998 22.2C16.9094 22.2 18.7407 21.4415 20.091 20.0912C21.4412 18.741 22.1998 16.9096 22.1998 15C22.1998 13.0905 21.4412 11.2591 20.091 9.90888C18.7407 8.55862 16.9094 7.80005 14.9998 7.80005C13.0902 7.80005 11.2589 8.55862 9.90864 9.90888C8.55837 11.2591 7.7998 13.0905 7.7998 15C7.7998 16.9096 8.55837 18.741 9.90864 20.0912C11.2589 21.4415 13.0902 22.2 14.9998 22.2Z" fill="white"/>
<path d="M14.9998 20.7C16.5115 20.7 17.9614 20.0995 19.0303 19.0306C20.0993 17.9616 20.6998 16.5118 20.6998 15C20.6998 13.4883 20.0993 12.0385 19.0303 10.9695C17.9614 9.90058 16.5115 9.30005 14.9998 9.30005C13.4881 9.30005 12.0383 9.90058 10.9693 10.9695C9.90034 12.0385 9.2998 13.4883 9.2998 15C9.2998 16.5118 9.90034 17.9616 10.9693 19.0306C12.0383 20.0995 13.4881 20.7 14.9998 20.7Z" fill="#1A73E8"/>
<defs>
  <linearGradient id="paint0_linear_87_32" x1="3.29381" y1="2.99503" x2="38.0998" y2="2.99503" gradientUnits="userSpaceOnUse">
    <stop stop-color="#D93025"/>
    <stop offset="1" stop-color="#EA4335"/>
  </linearGradient>
  <linearGradient id="paint1_linear_87_32" x1="17.953" y1="29.1431" x2="34.194" y2="-0.298904" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FCC934"/>
    <stop offset="1" stop-color="#FBBC04"/>
  </linearGradient>
  <linearGradient id="paint2_linear_87_32" x1="22.873" y1="28.2" x2="6.63202" y2="-1.24102" gradientUnits="userSpaceOnUse">
    <stop stop-color="#1E8E3E"/>
    <stop offset="1" stop-color="#34A853"/>
  </linearGradient>
</defs>
</svg>`,yi=A`<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
<path d="M23 11.1962V10.5C23 7.365 18.2712 5 12 5C5.72875 5 1 7.365 1 10.5V15.5C1 18.1112 4.28125 20.1863 9 20.8075V21.5C9 24.635 13.7288 27 20 27C26.2712 27 31 24.635 31 21.5V16.5C31 13.9125 27.8225 11.835 23 11.1962ZM7 18.3587C4.55125 17.675 3 16.5487 3 15.5V13.7413C4.02 14.4637 5.38625 15.0463 7 15.4375V18.3587ZM17 15.4375C18.6138 15.0463 19.98 14.4637 21 13.7413V15.5C21 16.5487 19.4487 17.675 17 18.3587V15.4375ZM15 24.3587C12.5513 23.675 11 22.5487 11 21.5V20.9788C11.3287 20.9913 11.6613 21 12 21C12.485 21 12.9587 20.9837 13.4237 20.9562C13.9403 21.1412 14.4665 21.2981 15 21.4263V24.3587ZM15 18.7812C14.0068 18.928 13.004 19.0011 12 19C10.996 19.0011 9.99324 18.928 9 18.7812V15.8075C9.99472 15.9371 10.9969 16.0014 12 16C13.0031 16.0014 14.0053 15.9371 15 15.8075V18.7812ZM23 24.7812C21.0106 25.0729 18.9894 25.0729 17 24.7812V21.8C17.9944 21.9337 18.9967 22.0005 20 22C21.0031 22.0014 22.0053 21.9371 23 21.8075V24.7812ZM29 21.5C29 22.5487 27.4487 23.675 25 24.3587V21.4375C26.6138 21.0462 27.98 20.4637 29 19.7412V21.5Z" fill="currentColor"/>
</svg>
`,$i=A` <svg fill="none" viewBox="0 0 13 4">
  <path fill="currentColor" d="M.5 0h12L8.9 3.13a3.76 3.76 0 0 1-4.8 0L.5 0Z" />
</svg>`,vi=A`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#5865F2" />
      <path
        fill="#fff"
        fill-rule="evenodd"
        d="M25.71 28.15C30.25 28 32 25.02 32 25.02c0-6.61-2.96-11.98-2.96-11.98-2.96-2.22-5.77-2.15-5.77-2.15l-.29.32c3.5 1.07 5.12 2.61 5.12 2.61a16.75 16.75 0 0 0-10.34-1.93l-.35.04a15.43 15.43 0 0 0-5.88 1.9s1.71-1.63 5.4-2.7l-.2-.24s-2.81-.07-5.77 2.15c0 0-2.96 5.37-2.96 11.98 0 0 1.73 2.98 6.27 3.13l1.37-1.7c-2.6-.79-3.6-2.43-3.6-2.43l.58.35.09.06.08.04.02.01.08.05a17.25 17.25 0 0 0 4.52 1.58 14.4 14.4 0 0 0 8.3-.86c.72-.27 1.52-.66 2.37-1.21 0 0-1.03 1.68-3.72 2.44.61.78 1.35 1.67 1.35 1.67Zm-9.55-9.6c-1.17 0-2.1 1.03-2.1 2.28 0 1.25.95 2.28 2.1 2.28 1.17 0 2.1-1.03 2.1-2.28.01-1.25-.93-2.28-2.1-2.28Zm7.5 0c-1.17 0-2.1 1.03-2.1 2.28 0 1.25.95 2.28 2.1 2.28 1.17 0 2.1-1.03 2.1-2.28 0-1.25-.93-2.28-2.1-2.28Z"
        clip-rule="evenodd"
      />
    </g>
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
  </defs>
</svg>`,xi=A`<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 9 12"
>
  <path
    fill="var(--apkt-tokens-theme-textPrimary)"
    d="M4.666.001v4.435l3.748 1.675L4.666.001Zm0 0L.917 6.111l3.749-1.675V.001Zm0 8.984V12l3.75-5.19-3.75 2.176Zm0 3.014V8.985L.917 6.81 4.666 12Zm0-3.712 3.748-2.176-3.748-1.675v3.851Z"
  />
  <path fill="var(--apkt-tokens-theme-textPrimary)" d="m.917 6.111 3.749 2.176v-3.85L.917 6.11Z" />
</svg>`,Ci=A`<svg fill="none" viewBox="0 0 16 16">
  <path
    fill="currentColor"
    d="M4.25 7a.63.63 0 0 0-.63.63v3.97c0 .28-.2.51-.47.54l-.75.07a.93.93 0 0 1-.9-.47A7.51 7.51 0 0 1 5.54.92a7.5 7.5 0 0 1 9.54 4.62c.12.35.06.72-.16 1-.74.97-1.68 1.78-2.6 2.44V4.44a.64.64 0 0 0-.63-.64h-1.06c-.35 0-.63.3-.63.64v5.5c0 .23-.12.42-.32.5l-.52.23V6.05c0-.36-.3-.64-.64-.64H7.45c-.35 0-.64.3-.64.64v4.97c0 .25-.17.46-.4.52a5.8 5.8 0 0 0-.45.11v-4c0-.36-.3-.65-.64-.65H4.25ZM14.07 12.4A7.49 7.49 0 0 1 3.6 14.08c4.09-.58 9.14-2.5 11.87-6.6v.03a7.56 7.56 0 0 1-1.41 4.91Z"
  />
</svg>`,_i=A`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#1877F2" />
      <g clip-path="url(#c)">
        <path
          fill="#fff"
          d="M26 12.38h-2.89c-.92 0-1.61.38-1.61 1.34v1.66H26l-.36 4.5H21.5v12H17v-12h-3v-4.5h3V12.5c0-3.03 1.6-4.62 5.2-4.62H26v4.5Z"
        />
      </g>
    </g>
    <path
      fill="#1877F2"
      d="M40 20a20 20 0 1 0-23.13 19.76V25.78H11.8V20h5.07v-4.4c0-5.02 3-7.79 7.56-7.79 2.19 0 4.48.4 4.48.4v4.91h-2.53c-2.48 0-3.25 1.55-3.25 3.13V20h5.54l-.88 5.78h-4.66v13.98A20 20 0 0 0 40 20Z"
    />
    <path
      fill="#fff"
      d="m27.79 25.78.88-5.78h-5.55v-3.75c0-1.58.78-3.13 3.26-3.13h2.53V8.2s-2.3-.39-4.48-.39c-4.57 0-7.55 2.77-7.55 7.78V20H11.8v5.78h5.07v13.98a20.15 20.15 0 0 0 6.25 0V25.78h4.67Z"
    />
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
    <clipPath id="c"><path fill="#fff" d="M8 7.89h24v24H8z" /></clipPath>
  </defs>
</svg>`,Si=A`<svg style="border-radius: 9999px; overflow: hidden;"  fill="none" viewBox="0 0 1000 1000">
  <rect width="1000" height="1000" rx="9999" ry="9999" fill="#855DCD"/>
  <path fill="#855DCD" d="M0 0h1000v1000H0V0Z" />
  <path
    fill="#fff"
    d="M320 248h354v504h-51.96V521.13h-.5c-5.76-63.8-59.31-113.81-124.54-113.81s-118.78 50-124.53 113.81h-.5V752H320V248Z"
  />
  <path
    fill="#fff"
    d="m225 320 21.16 71.46h17.9v289.09a16.29 16.29 0 0 0-16.28 16.24v19.49h-3.25a16.3 16.3 0 0 0-16.28 16.24V752h182.26v-19.48a16.22 16.22 0 0 0-16.28-16.24h-3.25v-19.5a16.22 16.22 0 0 0-16.28-16.23h-19.52V320H225Zm400.3 360.55a16.3 16.3 0 0 0-15.04 10.02 16.2 16.2 0 0 0-1.24 6.22v19.49h-3.25a16.29 16.29 0 0 0-16.27 16.24V752h182.24v-19.48a16.23 16.23 0 0 0-16.27-16.24h-3.25v-19.5a16.2 16.2 0 0 0-10.04-15 16.3 16.3 0 0 0-6.23-1.23v-289.1h17.9L775 320H644.82v360.55H625.3Z"
  />
</svg>`,ki=A`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#1B1F23" />
      <g clip-path="url(#c)">
        <path
          fill="#fff"
          d="M8 19.89a12 12 0 1 1 15.8 11.38c-.6.12-.8-.26-.8-.57v-3.3c0-1.12-.4-1.85-.82-2.22 2.67-.3 5.48-1.31 5.48-5.92 0-1.31-.47-2.38-1.24-3.22.13-.3.54-1.52-.12-3.18 0 0-1-.32-3.3 1.23a11.54 11.54 0 0 0-6 0c-2.3-1.55-3.3-1.23-3.3-1.23a4.32 4.32 0 0 0-.12 3.18 4.64 4.64 0 0 0-1.24 3.22c0 4.6 2.8 5.63 5.47 5.93-.34.3-.65.83-.76 1.6-.69.31-2.42.84-3.5-1 0 0-.63-1.15-1.83-1.23 0 0-1.18-.02-.09.73 0 0 .8.37 1.34 1.76 0 0 .7 2.14 4.03 1.41v2.24c0 .31-.2.68-.8.57A12 12 0 0 1 8 19.9Z"
        />
      </g>
    </g>
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
    <clipPath id="c"><path fill="#fff" d="M8 7.89h24v24H8z" /></clipPath>
  </defs>
</svg>`,Ai=A`<svg fill="none" viewBox="0 0 40 40">
  <path
    fill="#4285F4"
    d="M32.74 20.3c0-.93-.08-1.81-.24-2.66H20.26v5.03h7a6 6 0 0 1-2.62 3.91v3.28h4.22c2.46-2.27 3.88-5.6 3.88-9.56Z"
  />
  <path
    fill="#34A853"
    d="M20.26 33a12.4 12.4 0 0 0 8.6-3.14l-4.22-3.28a7.74 7.74 0 0 1-4.38 1.26 7.76 7.76 0 0 1-7.28-5.36H8.65v3.36A12.99 12.99 0 0 0 20.26 33Z"
  />
  <path
    fill="#FBBC05"
    d="M12.98 22.47a7.79 7.79 0 0 1 0-4.94v-3.36H8.65a12.84 12.84 0 0 0 0 11.66l3.37-2.63.96-.73Z"
  />
  <path
    fill="#EA4335"
    d="M20.26 12.18a7.1 7.1 0 0 1 4.98 1.93l3.72-3.72A12.47 12.47 0 0 0 20.26 7c-5.08 0-9.47 2.92-11.6 7.17l4.32 3.36a7.76 7.76 0 0 1 7.28-5.35Z"
  />
</svg>`,Ei=A`<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path d="M4.875 0C3.91082 0 2.96829 0.285914 2.1666 0.821586C1.36491 1.35726 0.740067 2.11863 0.371089 3.00942C0.00211226 3.90021 -0.094429 4.88041 0.093674 5.82607C0.281777 6.77172 0.746076 7.64036 1.42786 8.32215C2.10964 9.00393 2.97828 9.46823 3.92394 9.65633C4.86959 9.84443 5.84979 9.74789 6.74058 9.37891C7.63137 9.00994 8.39274 8.38509 8.92842 7.5834C9.46409 6.78171 9.75 5.83918 9.75 4.875C9.74864 3.58249 9.23458 2.34331 8.32064 1.42936C7.4067 0.515418 6.16751 0.00136492 4.875 0ZM4.6875 2.25C4.79875 2.25 4.90751 2.28299 5.00001 2.3448C5.09251 2.40661 5.16461 2.49446 5.20718 2.59724C5.24976 2.70002 5.2609 2.81312 5.23919 2.92224C5.21749 3.03135 5.16392 3.13158 5.08525 3.21025C5.00658 3.28891 4.90635 3.34249 4.79724 3.36419C4.68813 3.3859 4.57503 3.37476 4.47224 3.33218C4.36946 3.28961 4.28161 3.21751 4.2198 3.12501C4.15799 3.03251 4.125 2.92375 4.125 2.8125C4.125 2.66332 4.18427 2.52024 4.28975 2.41475C4.39524 2.30926 4.53832 2.25 4.6875 2.25ZM5.25 7.5C5.05109 7.5 4.86032 7.42098 4.71967 7.28033C4.57902 7.13968 4.5 6.94891 4.5 6.75V4.875C4.40055 4.875 4.30516 4.83549 4.23484 4.76516C4.16451 4.69484 4.125 4.59946 4.125 4.5C4.125 4.40054 4.16451 4.30516 4.23484 4.23484C4.30516 4.16451 4.40055 4.125 4.5 4.125C4.69891 4.125 4.88968 4.20402 5.03033 4.34467C5.17098 4.48532 5.25 4.67609 5.25 4.875V6.75C5.34946 6.75 5.44484 6.78951 5.51517 6.85983C5.58549 6.93016 5.625 7.02554 5.625 7.125C5.625 7.22446 5.58549 7.31984 5.51517 7.39017C5.44484 7.46049 5.34946 7.5 5.25 7.5Z" fill="#9A9A9A"/>
</svg>
`,Pi=A`<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
<path d="M28.925 5.5425C28.925 5.5425 28.925 5.555 28.925 5.56125L21.65 29.5537C21.5399 29.9434 21.3132 30.2901 21.0004 30.5473C20.6876 30.8045 20.3036 30.9598 19.9 30.9925C19.8425 30.9975 19.785 31 19.7275 31C19.3493 31.0012 18.9786 30.8941 18.6592 30.6915C18.3398 30.4888 18.085 30.199 17.925 29.8563L13.375 20.5187C13.3295 20.4252 13.3143 20.3197 13.3315 20.2171C13.3488 20.1145 13.3976 20.0198 13.4713 19.9463L20.7113 12.7063C20.8909 12.5172 20.9895 12.2654 20.9862 12.0047C20.9829 11.7439 20.8778 11.4948 20.6934 11.3104C20.509 11.126 20.2599 11.0209 19.9991 11.0176C19.7383 11.0142 19.4866 11.1129 19.2975 11.2925L12.0538 18.5325C11.9802 18.6061 11.8855 18.655 11.7829 18.6722C11.6803 18.6895 11.5748 18.6743 11.4813 18.6287L2.13502 14.08C1.76954 13.9047 1.46598 13.6224 1.26454 13.2706C1.06311 12.9189 0.973316 12.5142 1.00707 12.1102C1.04082 11.7063 1.19652 11.3221 1.45354 11.0087C1.71056 10.6952 2.05676 10.4673 2.44627 10.355L26.4388 3.08H26.4575C26.7991 2.98403 27.1601 2.98066 27.5034 3.07025C27.8468 3.15984 28.1601 3.33916 28.4113 3.58981C28.6624 3.84045 28.8424 4.15341 28.9326 4.49656C29.0229 4.83971 29.0203 5.2007 28.925 5.5425Z" fill="currentColor"/>
</svg>
`,zi=A` <svg width="27" height="30" viewBox="0 0 27 30" fill="none">
  <path d="M12.5395 14.3237L0.116699 27.5049V27.5188C0.251527 28.0177 0.49972 28.4788 0.841941 28.866C1.18416 29.2533 1.61117 29.5563 2.0897 29.7515C2.56823 29.9467 3.08536 30.0287 3.60081 29.9913C4.11625 29.9538 4.61609 29.7979 5.06139 29.5356L5.0975 29.512L19.0718 21.4519L12.5395 14.3237Z" fill="#EA4335"/>
  <path d="M25.103 12.0833L25.0919 12.0722L19.0611 8.57202L12.2607 14.6279L19.0847 21.4504L25.0919 17.9864C25.6229 17.6983 26.0665 17.2725 26.376 16.7537C26.6854 16.2349 26.8493 15.6422 26.8505 15.0381C26.8516 14.434 26.6899 13.8408 26.3824 13.3208C26.0749 12.8008 25.633 12.3734 25.103 12.0833Z" fill="#FBBC04"/>
  <path d="M0.116672 2.49553C0.047224 2.7761 0 3.05528 0 3.35946V26.6537C0 26.9565 0.0347234 27.237 0.116672 27.5162L12.959 14.6725L0.116672 2.49553Z" fill="#4285F4"/>
  <path d="M12.634 15.0001L19.0607 8.57198L5.0975 0.477133C4.65115 0.210463 4.14916 0.0506574 3.63079 0.0102139C3.11242 -0.0302296 2.59172 0.0497852 2.10941 0.244001C1.6271 0.438216 1.19625 0.741368 0.850556 1.12975C0.504864 1.51813 0.253698 1.98121 0.116699 2.48279L12.634 15.0001Z" fill="#34A853"/>
</svg>`,Ti=A`<svg width="75" height="20" viewBox="0 0 75 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.6666 5.83334C11.6666 2.61168 14.2783 0 17.5 0H25.8334C29.055 0 31.6666 2.61168 31.6666 5.83334V14.1666C31.6666 17.3883 29.055 20 25.8334 20H17.5C14.2783 20 11.6666 17.3883 11.6666 14.1666V5.83334Z" fill="var(--apkt-tokens-theme-foregroundTertiary)"/>
<path d="M19.5068 13.7499L22.4309 5.83331H23.2895L20.3654 13.7499H19.5068Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M0 5.41666C0 2.42513 2.42513 0 5.41666 0C8.40821 0 10.8334 2.42513 10.8334 5.41666V14.5833C10.8334 17.5748 8.40821 20 5.41666 20C2.42513 20 0 17.5748 0 14.5833V5.41666Z" fill="var(--apkt-tokens-theme-foregroundTertiary)"/>
<path d="M4.89581 12.4997V11.458H5.93747V12.4997H4.89581Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M32.5 10C32.5 4.47715 36.6896 0 41.8578 0H65.6422C70.8104 0 75 4.47715 75 10C75 15.5229 70.8104 20 65.6422 20H41.8578C36.6896 20 32.5 15.5229 32.5 10Z" fill="var(--apkt-tokens-theme-foregroundTertiary)"/>
<path d="M61.7108 12.4475V7.82751H62.5266V8.52418C62.8199 8.01084 63.4157 7.70834 64.0757 7.70834C65.0749 7.70834 65.7715 8.34084 65.7715 9.56918V12.4475H64.9649V9.61503C64.9649 8.80831 64.5066 8.38668 63.8374 8.38668C63.1132 8.38668 62.5266 8.9642 62.5266 9.78001V12.4475H61.7108Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M56.5671 12.4475L55.7147 7.82748H56.4846L57.0896 11.6409L57.8871 9.12916H58.6479L59.4363 11.6134L60.0505 7.82748H60.8204L59.9679 12.4475H59.0513L58.2721 10.0458L57.4838 12.4475H56.5671Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M52.9636 12.5666C51.5611 12.5666 50.7361 11.5217 50.7361 10.1375C50.7361 8.76254 51.5611 7.70834 52.9636 7.70834C54.3661 7.70834 55.1911 8.76254 55.1911 10.1375C55.1911 11.5217 54.3661 12.5666 52.9636 12.5666ZM52.9636 11.8883C53.9719 11.8883 54.357 11.0266 54.357 10.1283C54.357 9.23914 53.9719 8.38668 52.9636 8.38668C51.9552 8.38668 51.5702 9.23914 51.5702 10.1283C51.5702 11.0266 51.9552 11.8883 52.9636 11.8883Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M47.8507 12.5666C46.494 12.5666 45.6415 11.5308 45.6415 10.1375C45.6415 8.75337 46.494 7.70834 47.8507 7.70834C48.9965 7.70834 50.0048 8.35917 49.8948 10.3483H46.4756C46.5398 11.2009 46.934 11.8975 47.8507 11.8975C48.4648 11.8975 48.8681 11.5217 49.0057 11.0908H49.8123C49.684 11.8609 48.9598 12.5666 47.8507 12.5666ZM46.494 9.73416H49.1065C49.0423 8.80831 48.6114 8.37751 47.8507 8.37751C47.0165 8.37751 46.604 8.98254 46.494 9.73416Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M41.7284 12.4475V7.82748H42.5625V8.60665C42.8559 8.09332 43.3601 7.82748 43.8825 7.82748H44.9917V8.60665H43.8184C43.0851 8.60665 42.5625 9.08331 42.5625 10.0092V12.4475H41.7284Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
</svg>

`,Ri=A`
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 8">
    <path
      fill="var(--apkt-tokens-theme-textPrimary)"
      d="m9.524 6.307-1.51 1.584A.35.35 0 0 1 7.76 8H.604a.178.178 0 0 1-.161-.103.168.168 0 0 1 .033-.186l1.51-1.583a.35.35 0 0 1 .256-.11h7.154c.034 0 .068.01.096.029a.168.168 0 0 1 .032.26Zm-1.51-3.189a.35.35 0 0 0-.255-.109H.604a.178.178 0 0 0-.161.103.168.168 0 0 0 .033.186l1.51 1.583a.35.35 0 0 0 .256.11h7.154a.178.178 0 0 0 .16-.104.168.168 0 0 0-.032-.185l-1.51-1.584ZM.605 1.981H7.76a.357.357 0 0 0 .256-.11L9.525.289a.17.17 0 0 0 .032-.185.173.173 0 0 0-.16-.103H2.241a.357.357 0 0 0-.256.109L.476 1.692a.17.17 0 0 0-.033.185.178.178 0 0 0 .16.103Z"
    />
  </svg>
`,Li=A`<svg width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <g clip-path="url(#a)">
    <path fill="url(#b)" d="M0 0h32v32H0z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.034 15.252c4.975-2.167 8.293-3.596 9.953-4.287 4.74-1.971 5.725-2.314 6.366-2.325.142-.002.457.033.662.198.172.14.22.33.243.463.022.132.05.435.028.671-.257 2.7-1.368 9.248-1.933 12.27-.24 1.28-.71 1.708-1.167 1.75-.99.091-1.743-.655-2.703-1.284-1.502-.985-2.351-1.598-3.81-2.558-1.684-1.11-.592-1.721.368-2.718.252-.261 4.619-4.233 4.703-4.594.01-.045.02-.213-.08-.301-.1-.09-.246-.059-.353-.035-.15.034-2.55 1.62-7.198 4.758-.682.468-1.298.696-1.851.684-.61-.013-1.782-.344-2.653-.628-1.069-.347-1.918-.53-1.845-1.12.039-.308.462-.623 1.27-.944Z" fill="#fff"/>
  </g>
  <path d="M.5 16C.5 7.44 7.44.5 16 .5 24.56.5 31.5 7.44 31.5 16c0 8.56-6.94 15.5-15.5 15.5C7.44 31.5.5 24.56.5 16Z" stroke="#141414" stroke-opacity=".05"/>
  <defs>
    <linearGradient id="b" x1="1600" y1="0" x2="1600" y2="3176.27" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2AABEE"/>
      <stop offset="1" stop-color="#229ED9"/>
    </linearGradient>
    <clipPath id="a">
      <path d="M0 16C0 7.163 7.163 0 16 0s16 7.163 16 16-7.163 16-16 16S0 24.837 0 16Z" fill="#fff"/>
    </clipPath>
  </defs>
</svg>`,Ii=A`
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
  <path d="M8.37651 0H1.62309C0.381381 0 -0.405611 1.33944 0.219059 2.42225L4.38701 9.64649C4.659 10.1182 5.3406 10.1182 5.61259 9.64649L9.78139 2.42225C10.4052 1.34117 9.61822 0 8.37736 0H8.37651ZM4.38362 7.48005L3.47591 5.72329L1.2857 1.80606C1.14121 1.55534 1.31968 1.23405 1.62225 1.23405H4.38278V7.4809L4.38362 7.48005ZM8.71221 1.80521L6.52284 5.72414L5.61513 7.48005V1.2332H8.37566C8.67823 1.2332 8.85669 1.55449 8.71221 1.80521Z" fill="var(--apkt-tokens-theme-textPrimary)" />
</svg>
`,Bi=A`<svg fill="none" viewBox="0 0 40 40">
  <g clip-path="url(#a)">
    <g clip-path="url(#b)">
      <circle cx="20" cy="19.89" r="20" fill="#5A3E85" />
      <g clip-path="url(#c)">
        <path
          fill="#fff"
          d="M18.22 25.7 20 23.91h3.34l2.1-2.1v-6.68H15.4v8.78h2.82v1.77Zm3.87-8.16h1.25v3.66H22.1v-3.66Zm-3.34 0H20v3.66h-1.25v-3.66ZM20 7.9a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm6.69 14.56-3.66 3.66h-2.72l-1.77 1.78h-1.88V26.1H13.3v-9.82l.94-2.4H26.7v8.56Z"
        />
      </g>
    </g>
  </g>
  <defs>
    <clipPath id="a"><rect width="40" height="40" fill="#fff" rx="20" /></clipPath>
    <clipPath id="b"><path fill="#fff" d="M0 0h40v40H0z" /></clipPath>
    <clipPath id="c"><path fill="#fff" d="M8 7.89h24v24H8z" /></clipPath>
  </defs>
</svg>`,Mi=A`<svg fill="none" viewBox="0 0 16 16">
  <path
    fill="currentColor"
    d="m14.36 4.74.01.42c0 4.34-3.3 9.34-9.34 9.34A9.3 9.3 0 0 1 0 13.03a6.6 6.6 0 0 0 4.86-1.36 3.29 3.29 0 0 1-3.07-2.28c.5.1 1 .07 1.48-.06A3.28 3.28 0 0 1 .64 6.11v-.04c.46.26.97.4 1.49.41A3.29 3.29 0 0 1 1.11 2.1a9.32 9.32 0 0 0 6.77 3.43 3.28 3.28 0 0 1 5.6-3 6.59 6.59 0 0 0 2.08-.8 3.3 3.3 0 0 1-1.45 1.82A6.53 6.53 0 0 0 16 3.04c-.44.66-1 1.23-1.64 1.7Z"
  />
</svg>`,Oi=A`
<svg xmlns="http://www.w3.org/2000/svg" width="89" height="89" viewBox="0 0 89 89" fill="none">
<path d="M60.0468 39.2502L65.9116 33.3854C52.6562 20.13 36.1858 20.13 22.9304 33.3854L28.7952 39.2502C38.8764 29.169 49.9725 29.169 60.0536 39.2502H60.0468Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
<path d="M58.0927 52.9146L44.415 39.2369L30.7373 52.9146L17.0596 39.2369L11.2017 45.0949L30.7373 64.6374L44.415 50.9597L58.0927 64.6374L77.6284 45.0949L71.7704 39.2369L58.0927 52.9146Z" fill="var(--apkt-tokens-theme-textPrimary)"/>
</svg>`,Hi=A`
<svg xmlns="http://www.w3.org/2000/svg" width="89" height="89" viewBox="0 0 89 89" fill="none">
<path d="M60.0468 39.2502L65.9116 33.3854C52.6562 20.13 36.1858 20.13 22.9304 33.3854L28.7952 39.2502C38.8764 29.169 49.9725 29.169 60.0536 39.2502H60.0468Z" fill="var(--apkt-tokens-theme-textInvert)"/>
<path d="M58.0927 52.9146L44.415 39.2369L30.7373 52.9146L17.0596 39.2369L11.2017 45.0949L30.7373 64.6374L44.415 50.9597L58.0927 64.6374L77.6284 45.0949L71.7704 39.2369L58.0927 52.9146Z" fill="var(--apkt-tokens-theme-textInvert)"/>
</svg>`,Di=A`
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_22274_4692)">
<path d="M0 6.64C0 4.17295 0 2.93942 0.525474 2.01817C0.880399 1.39592 1.39592 0.880399 2.01817 0.525474C2.93942 0 4.17295 0 6.64 0H9.36C11.8271 0 13.0606 0 13.9818 0.525474C14.6041 0.880399 15.1196 1.39592 15.4745 2.01817C16 2.93942 16 4.17295 16 6.64V9.36C16 11.8271 16 13.0606 15.4745 13.9818C15.1196 14.6041 14.6041 15.1196 13.9818 15.4745C13.0606 16 11.8271 16 9.36 16H6.64C4.17295 16 2.93942 16 2.01817 15.4745C1.39592 15.1196 0.880399 14.6041 0.525474 13.9818C0 13.0606 0 11.8271 0 9.36V6.64Z" fill="#C7B994"/>
<path d="M4.49038 5.76609C6.42869 3.86833 9.5713 3.86833 11.5096 5.76609L11.7429 5.99449C11.8398 6.08938 11.8398 6.24323 11.7429 6.33811L10.9449 7.11942C10.8964 7.16686 10.8179 7.16686 10.7694 7.11942L10.4484 6.80512C9.09617 5.48119 6.90381 5.48119 5.5516 6.80512L5.20782 7.14171C5.15936 7.18915 5.08079 7.18915 5.03234 7.14171L4.23434 6.3604C4.13742 6.26552 4.13742 6.11167 4.23434 6.01678L4.49038 5.76609ZM13.1599 7.38192L13.8702 8.07729C13.9671 8.17217 13.9671 8.32602 13.8702 8.4209L10.6677 11.5564C10.5708 11.6513 10.4137 11.6513 10.3168 11.5564L8.04388 9.33105C8.01965 9.30733 7.98037 9.30733 7.95614 9.33105L5.6833 11.5564C5.58638 11.6513 5.42925 11.6513 5.33234 11.5564L2.12982 8.42087C2.0329 8.32598 2.0329 8.17213 2.12982 8.07724L2.84004 7.38188C2.93695 7.28699 3.09408 7.28699 3.191 7.38188L5.46392 9.60726C5.48815 9.63098 5.52743 9.63098 5.55166 9.60726L7.82447 7.38188C7.92138 7.28699 8.07851 7.28699 8.17543 7.38187L10.4484 9.60726C10.4726 9.63098 10.5119 9.63098 10.5361 9.60726L12.809 7.38192C12.9059 7.28703 13.063 7.28703 13.1599 7.38192Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_22274_4692">
<path d="M0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z" fill="white"/>
</clipPath>
</defs>
</svg>
`,Ni=A`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="11" cy="11" r="11" transform="matrix(-1 0 0 1 23 1)" fill="#202020"/>
<circle cx="11" cy="11" r="11.5" transform="matrix(-1 0 0 1 23 1)" stroke="#C7B994" stroke-opacity="0.7"/>
<path d="M15.4523 11.0686L16.7472 9.78167C13.8205 6.87297 10.1838 6.87297 7.25708 9.78167L8.55201 11.0686C10.7779 8.85645 13.2279 8.85645 15.4538 11.0686H15.4523Z" fill="#C7B994"/>
<path d="M15.0199 14.067L12 11.0656L8.98 14.067L5.96004 11.0656L4.66663 12.3511L8.98 16.6393L12 13.638L15.0199 16.6393L19.3333 12.3511L18.0399 11.0656L15.0199 14.067Z" fill="#C7B994"/>
</svg>
`,Ko=A`<svg fill="none" viewBox="0 0 41 40">
  <g clip-path="url(#a)">
    <path fill="#000" d="M.8 0h40v40H.8z" />
    <path
      fill="#fff"
      d="m22.63 18.46 7.14-8.3h-1.69l-6.2 7.2-4.96-7.2H11.2l7.5 10.9-7.5 8.71h1.7l6.55-7.61 5.23 7.61h5.72l-7.77-11.31Zm-9.13-7.03h2.6l11.98 17.13h-2.6L13.5 11.43Z"
    />
  </g>
  <defs>
    <clipPath id="a"><path fill="#fff" d="M.8 20a20 20 0 1 1 40 0 20 20 0 0 1-40 0Z" /></clipPath>
  </defs>
</svg>`,ji=G`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    aspect-ratio: 1 / 1;
    color: var(--local-color);
    width: var(--local-width);
  }

  svg {
    height: inherit;
    width: inherit;
    object-fit: contain;
    object-position: center;
  }
`;var me=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const Fi={add:"ph-plus",allWallets:"ph-dots-three",arrowBottom:"ph-arrow-down",arrowBottomCircle:"ph-arrow-circle-down",arrowClockWise:"ph-arrow-clockwise",arrowLeft:"ph-arrow-left",arrowRight:"ph-arrow-right",arrowTop:"ph-arrow-up",arrowTopRight:"ph-arrow-up-right",bank:"ph-bank",bin:"ph-trash",browser:"ph-browser",card:"ph-credit-card",checkmarkBold:"ph-check",chevronBottom:"ph-caret-down",chevronLeft:"ph-caret-left",chevronRight:"ph-caret-right",chevronTop:"ph-caret-up",clock:"ph-clock",close:"ph-x",coinPlaceholder:"ph-circle-half",compass:"ph-compass",copy:"ph-copy",desktop:"ph-desktop",dollar:"ph-currency-dollar",download:"ph-vault",exclamationCircle:"ph-warning-circle",extension:"ph-puzzle-piece",externalLink:"ph-arrow-square-out",filters:"ph-funnel-simple",helpCircle:"ph-question",id:"ph-identification-card",image:"ph-image",info:"ph-info",lightbulb:"ph-lightbulb",mail:"ph-envelope",mobile:"ph-device-mobile",more:"ph-dots-three",networkPlaceholder:"ph-globe",nftPlaceholder:"ph-image",plus:"ph-plus",power:"ph-power",qrCode:"ph-qr-code",questionMark:"ph-question",refresh:"ph-arrow-clockwise",recycleHorizontal:"ph-arrows-clockwise",search:"ph-magnifying-glass",sealCheck:"ph-seal-check",send:"ph-paper-plane-right",signOut:"ph-sign-out",spinner:"ph-spinner",swapHorizontal:"ph-arrows-left-right",swapVertical:"ph-arrows-down-up",threeDots:"ph-dots-three",user:"ph-user",verify:"ph-seal-check",verifyFilled:"ph-seal-check",wallet:"ph-wallet",warning:"ph-warning",warningCircle:"ph-warning-circle",appStore:"",apple:"",bitcoin:"",coins:"",chromeStore:"",cursor:"",discord:"",ethereum:"",etherscan:"",facebook:"",farcaster:"",github:"",google:"",playStore:"",paperPlaneTitle:"",reown:"",solana:"",ton:"",telegram:"",twitch:"",twitterIcon:"",twitter:"",walletConnect:"",walletConnectBrown:"",walletConnectLightBrown:"",x:"",infoSeal:"",checkmark:""},Wi={"ph-arrow-circle-down":()=>v(()=>import("./PhArrowCircleDown-B305t-Sh.js"),__vite__mapDeps([0,1])),"ph-arrow-clockwise":()=>v(()=>import("./PhArrowClockwise-CJPxQhr_.js"),__vite__mapDeps([2,1])),"ph-arrow-down":()=>v(()=>import("./PhArrowDown-C4hT9BVu.js"),__vite__mapDeps([3,1])),"ph-arrow-left":()=>v(()=>import("./PhArrowLeft-Way4Cu-r.js"),__vite__mapDeps([4,1])),"ph-arrow-right":()=>v(()=>import("./PhArrowRight-Cp5ZME0F.js"),__vite__mapDeps([5,1])),"ph-arrow-square-out":()=>v(()=>import("./PhArrowSquareOut-NnrK69c5.js"),__vite__mapDeps([6,1])),"ph-arrows-down-up":()=>v(()=>import("./PhArrowsDownUp-BjBI4ckC.js"),__vite__mapDeps([7,1])),"ph-arrows-left-right":()=>v(()=>import("./PhArrowsLeftRight-CuLpbKRk.js"),__vite__mapDeps([8,1])),"ph-arrow-up":()=>v(()=>import("./PhArrowUp-Dph6j8rm.js"),__vite__mapDeps([9,1])),"ph-arrow-up-right":()=>v(()=>import("./PhArrowUpRight-BpJjRRRh.js"),__vite__mapDeps([10,1])),"ph-arrows-clockwise":()=>v(()=>import("./PhArrowsClockwise-CFUT8X7R.js"),__vite__mapDeps([11,1])),"ph-bank":()=>v(()=>import("./PhBank-Dchr4XQJ.js"),__vite__mapDeps([12,1])),"ph-browser":()=>v(()=>import("./PhBrowser-dUu2TrC1.js"),__vite__mapDeps([13,1])),"ph-caret-down":()=>v(()=>import("./PhCaretDown-78IuKU3V.js"),__vite__mapDeps([14,1])),"ph-caret-left":()=>v(()=>import("./PhCaretLeft-_aiyH7n1.js"),__vite__mapDeps([15,1])),"ph-caret-right":()=>v(()=>import("./PhCaretRight-8zJQEuDX.js"),__vite__mapDeps([16,1])),"ph-caret-up":()=>v(()=>import("./PhCaretUp-CiCxKWwN.js"),__vite__mapDeps([17,1])),"ph-check":()=>v(()=>import("./PhCheck-CcADx8br.js"),__vite__mapDeps([18,1])),"ph-circle-half":()=>v(()=>import("./PhCircleHalf-BYzSzd2h.js"),__vite__mapDeps([19,1])),"ph-clock":()=>v(()=>import("./PhClock-UItiXeJq.js"),__vite__mapDeps([20,1])),"ph-compass":()=>v(()=>import("./PhCompass-CUy3uA7t.js"),__vite__mapDeps([21,1])),"ph-copy":()=>v(()=>import("./PhCopy-C-PDgSlZ.js"),__vite__mapDeps([22,1])),"ph-credit-card":()=>v(()=>import("./PhCreditCard-CWRaUT6F.js"),__vite__mapDeps([23,1])),"ph-currency-dollar":()=>v(()=>import("./PhCurrencyDollar-Cqla3AXT.js"),__vite__mapDeps([24,1])),"ph-desktop":()=>v(()=>import("./PhDesktop-BBIPrYLl.js"),__vite__mapDeps([25,1])),"ph-device-mobile":()=>v(()=>import("./PhDeviceMobile-BdsPaATg.js"),__vite__mapDeps([26,1])),"ph-dots-three":()=>v(()=>import("./PhDotsThree-BMXCQl-0.js"),__vite__mapDeps([27,1])),"ph-vault":()=>v(()=>import("./PhVault-l2PHF38a.js"),__vite__mapDeps([28,1])),"ph-envelope":()=>v(()=>import("./PhEnvelope-yUsis6yU.js"),__vite__mapDeps([29,1])),"ph-funnel-simple":()=>v(()=>import("./PhFunnelSimple-Ba7BbWTp.js"),__vite__mapDeps([30,1])),"ph-globe":()=>v(()=>import("./PhGlobe-DgLxBk5U.js"),__vite__mapDeps([31,1])),"ph-identification-card":()=>v(()=>import("./PhIdentificationCard-Czjmq9Z3.js"),__vite__mapDeps([32,1])),"ph-image":()=>v(()=>import("./PhImage-BAJ_erz6.js"),__vite__mapDeps([33,1])),"ph-info":()=>v(()=>import("./PhInfo-Cr4DhVUE.js"),__vite__mapDeps([34,1])),"ph-lightbulb":()=>v(()=>import("./PhLightbulb-BX_7duTr.js"),__vite__mapDeps([35,1])),"ph-magnifying-glass":()=>v(()=>import("./PhMagnifyingGlass-Mygfryvz.js"),__vite__mapDeps([36,1])),"ph-paper-plane-right":()=>v(()=>import("./PhPaperPlaneRight-BeuCA660.js"),__vite__mapDeps([37,1])),"ph-plus":()=>v(()=>import("./PhPlus-BMjcHjsT.js"),__vite__mapDeps([38,1])),"ph-power":()=>v(()=>import("./PhPower-CGffGmdb.js"),__vite__mapDeps([39,1])),"ph-puzzle-piece":()=>v(()=>import("./PhPuzzlePiece-wm_GpVSi.js"),__vite__mapDeps([40,1])),"ph-qr-code":()=>v(()=>import("./PhQrCode-DRwRzXCH.js"),__vite__mapDeps([41,1])),"ph-question":()=>v(()=>import("./PhQuestion-M09j2U0T.js"),__vite__mapDeps([42,1])),"ph-question-circle":()=>v(()=>import("./PhQuestionMark-BP9EMB6h.js"),__vite__mapDeps([43,1])),"ph-seal-check":()=>v(()=>import("./PhSealCheck-BfG80yKn.js"),__vite__mapDeps([44,1])),"ph-sign-out":()=>v(()=>import("./PhSignOut-C5YOWlPT.js"),__vite__mapDeps([45,1])),"ph-spinner":()=>v(()=>import("./PhSpinner-BXooDYzU.js"),__vite__mapDeps([46,1])),"ph-trash":()=>v(()=>import("./PhTrash-Biq6rmmL.js"),__vite__mapDeps([47,1])),"ph-user":()=>v(()=>import("./PhUser-CAgZSpGe.js"),__vite__mapDeps([48,1])),"ph-wallet":()=>v(()=>import("./PhWallet-w25D16It.js"),__vite__mapDeps([49,1])),"ph-warning":()=>v(()=>import("./PhWarning-DPEydIPw.js"),__vite__mapDeps([50,1])),"ph-warning-circle":()=>v(()=>import("./PhWarningCircle-BqjT745H.js"),__vite__mapDeps([51,1])),"ph-x":()=>v(()=>import("./PhX-s-SmVExa.js"),__vite__mapDeps([52,1]))},Vi={appStore:fi,apple:gi,bitcoin:mi,coins:yi,chromeStore:bi,cursor:$i,discord:vi,ethereum:xi,etherscan:Ci,facebook:_i,farcaster:Si,github:ki,google:Ai,playStore:zi,paperPlaneTitle:Pi,reown:Ti,solana:Ri,ton:Ii,telegram:Li,twitch:Bi,twitter:Ko,twitterIcon:Mi,walletConnect:Oi,walletConnectInvert:Hi,walletConnectBrown:Ni,walletConnectLightBrown:Di,x:Ko,infoSeal:Ei,checkmark:wi},Ui={"accent-primary":z.tokens.core.iconAccentPrimary,"accent-certified":z.tokens.core.iconAccentCertified,"foreground-secondary":z.tokens.theme.foregroundSecondary,default:z.tokens.theme.iconDefault,success:z.tokens.core.iconSuccess,error:z.tokens.core.iconError,warning:z.tokens.core.iconWarning,inverse:z.tokens.theme.iconInverse};let Rt=class extends _{constructor(){super(...arguments),this.size="md",this.name="copy",this.weight="bold",this.color="inherit"}render(){const e={xxs:"2",xs:"3",sm:"3",md:"4",mdl:"5",lg:"5",xl:"6",xxl:"7",inherit:"inherit"};this.style.cssText=`
      --local-width: ${this.size==="inherit"?"inherit":`var(--apkt-spacing-${e[this.size]})`};
      --local-color: ${this.color==="inherit"?"inherit":Ui[this.color]}
    `;const o=Fi[this.name];if(o&&o!==""){const i=Wi[o];i&&i();const n=hi(o);return Zo`<${n} size=${{xxs:"0.5em",xs:"0.75em",sm:"0.75em",md:"1em",mdl:"1.25em",lg:"1.25em",xl:"1.5em",xxl:"1.75em"}[this.size]} weight="${this.weight}"></${n}>`}return Vi[this.name]||Zo``}};Rt.styles=[E,ji];me([c()],Rt.prototype,"size",void 0);me([c()],Rt.prototype,"name",void 0);me([c()],Rt.prototype,"weight",void 0);me([c()],Rt.prototype,"color",void 0);Rt=me([k("wui-icon")],Rt);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ar={ATTRIBUTE:1,CHILD:2},sr=t=>(...e)=>({_$litDirective$:t,values:e});class lr{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,o,i){this._$Ct=e,this._$AM=o,this._$Ci=i}_$AS(e,o){return this.update(e,o)}update(e,o){return this.render(...o)}}/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Zi=sr(class extends lr{constructor(t){var e;if(super(t),t.type!==ar.ATTRIBUTE||t.name!=="class"||((e=t.strings)==null?void 0:e.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){var i,n;if(this.st===void 0){this.st=new Set,t.strings!==void 0&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(r=>r!=="")));for(const r in e)e[r]&&!((i=this.nt)!=null&&i.has(r))&&this.st.add(r);return this.render(e)}const o=t.element.classList;for(const r of this.st)r in e||(o.remove(r),this.st.delete(r));for(const r in e){const a=!!e[r];a===this.st.has(r)||(n=this.nt)!=null&&n.has(r)||(a?(o.add(r),this.st.add(r)):(o.remove(r),this.st.delete(r)))}return Tt}}),Ki=P`
  slot {
    width: 100%;
    display: inline-block;
    font-style: normal;
    overflow: inherit;
    text-overflow: inherit;
    text-align: var(--local-align);
    color: var(--local-color);
  }

  .wui-line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .wui-line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  /* -- Headings --------------------------------------------------- */
  .wui-font-h1-regular-mono {
    font-size: ${({textSize:t})=>t.h1};
    line-height: ${({typography:t})=>t["h1-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h1-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-h1-regular {
    font-size: ${({textSize:t})=>t.h1};
    line-height: ${({typography:t})=>t["h1-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h1-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h1-medium {
    font-size: ${({textSize:t})=>t.h1};
    line-height: ${({typography:t})=>t["h1-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h1-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h2-regular-mono {
    font-size: ${({textSize:t})=>t.h2};
    line-height: ${({typography:t})=>t["h2-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h2-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-h2-regular {
    font-size: ${({textSize:t})=>t.h2};
    line-height: ${({typography:t})=>t["h2-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h2-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h2-medium {
    font-size: ${({textSize:t})=>t.h2};
    line-height: ${({typography:t})=>t["h2-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h2-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h3-regular-mono {
    font-size: ${({textSize:t})=>t.h3};
    line-height: ${({typography:t})=>t["h3-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h3-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-h3-regular {
    font-size: ${({textSize:t})=>t.h3};
    line-height: ${({typography:t})=>t["h3-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h3-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h3-medium {
    font-size: ${({textSize:t})=>t.h3};
    line-height: ${({typography:t})=>t["h3-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h3-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h4-regular-mono {
    font-size: ${({textSize:t})=>t.h4};
    line-height: ${({typography:t})=>t["h4-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h4-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-h4-regular {
    font-size: ${({textSize:t})=>t.h4};
    line-height: ${({typography:t})=>t["h4-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h4-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h4-medium {
    font-size: ${({textSize:t})=>t.h4};
    line-height: ${({typography:t})=>t["h4-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h4-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h5-regular-mono {
    font-size: ${({textSize:t})=>t.h5};
    line-height: ${({typography:t})=>t["h5-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h5-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-h5-regular {
    font-size: ${({textSize:t})=>t.h5};
    line-height: ${({typography:t})=>t["h5-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h5-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h5-medium {
    font-size: ${({textSize:t})=>t.h5};
    line-height: ${({typography:t})=>t["h5-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h5-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h6-regular-mono {
    font-size: ${({textSize:t})=>t.h6};
    line-height: ${({typography:t})=>t["h6-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h6-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-h6-regular {
    font-size: ${({textSize:t})=>t.h6};
    line-height: ${({typography:t})=>t["h6-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h6-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-h6-medium {
    font-size: ${({textSize:t})=>t.h6};
    line-height: ${({typography:t})=>t["h6-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["h6-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-lg-regular-mono {
    font-size: ${({textSize:t})=>t.large};
    line-height: ${({typography:t})=>t["lg-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["lg-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-lg-regular {
    font-size: ${({textSize:t})=>t.large};
    line-height: ${({typography:t})=>t["lg-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["lg-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-lg-medium {
    font-size: ${({textSize:t})=>t.large};
    line-height: ${({typography:t})=>t["lg-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["lg-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-md-regular-mono {
    font-size: ${({textSize:t})=>t.medium};
    line-height: ${({typography:t})=>t["md-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["md-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-md-regular {
    font-size: ${({textSize:t})=>t.medium};
    line-height: ${({typography:t})=>t["md-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["md-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-md-medium {
    font-size: ${({textSize:t})=>t.medium};
    line-height: ${({typography:t})=>t["md-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["md-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-sm-regular-mono {
    font-size: ${({textSize:t})=>t.small};
    line-height: ${({typography:t})=>t["sm-regular-mono"].lineHeight};
    letter-spacing: ${({typography:t})=>t["sm-regular-mono"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.mono};
  }

  .wui-font-sm-regular {
    font-size: ${({textSize:t})=>t.small};
    line-height: ${({typography:t})=>t["sm-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["sm-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }

  .wui-font-sm-medium {
    font-size: ${({textSize:t})=>t.small};
    line-height: ${({typography:t})=>t["sm-medium"].lineHeight};
    letter-spacing: ${({typography:t})=>t["sm-medium"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.medium};
    font-family: ${({fontFamily:t})=>t.regular};
    font-feature-settings:
      'liga' off,
      'clig' off;
  }
`;var Jt=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const Gi={primary:z.tokens.theme.textPrimary,secondary:z.tokens.theme.textSecondary,tertiary:z.tokens.theme.textTertiary,invert:z.tokens.theme.textInvert,error:z.tokens.core.textError,success:z.tokens.core.textSuccess,warning:z.tokens.core.textWarning,"accent-primary":z.tokens.core.textAccentPrimary};let bt=class extends _{constructor(){super(...arguments),this.variant="md-regular",this.color="inherit",this.align="left",this.lineClamp=void 0,this.display="inline-flex"}render(){const e={[`wui-font-${this.variant}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`
      display: ${this.display};
      --local-align: ${this.align};
      --local-color: ${this.color==="inherit"?"inherit":Gi[this.color??"primary"]};
      `,h`<slot class=${Zi(e)}></slot>`}};bt.styles=[E,Ki];Jt([c()],bt.prototype,"variant",void 0);Jt([c()],bt.prototype,"color",void 0);Jt([c()],bt.prototype,"align",void 0);Jt([c()],bt.prototype,"lineClamp",void 0);Jt([c()],bt.prototype,"display",void 0);bt=Jt([k("wui-text")],bt);const Yi=P`
  :host {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: ${({borderRadius:t})=>t[2]};
    padding: ${({spacing:t})=>t[1]} !important;
    background-color: ${({tokens:t})=>t.theme.backgroundPrimary};
    position: relative;
  }

  :host([data-padding='2']) {
    padding: ${({spacing:t})=>t[2]} !important;
  }

  :host:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  :host > wui-icon {
    z-index: 10;
  }

  /* -- Colors --------------------------------------------------- */
  :host([data-color='accent-primary']) {
    color: ${({tokens:t})=>t.core.iconAccentPrimary};
  }

  :host([data-color='accent-primary']):after {
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
  }

  :host([data-color='default']),
  :host([data-color='secondary']) {
    color: ${({tokens:t})=>t.theme.iconDefault};
  }

  :host([data-color='default']):after {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  :host([data-color='secondary']):after {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  :host([data-color='success']) {
    color: ${({tokens:t})=>t.core.iconSuccess};
  }

  :host([data-color='success']):after {
    background-color: ${({tokens:t})=>t.core.backgroundSuccess};
  }

  :host([data-color='error']) {
    color: ${({tokens:t})=>t.core.iconError};
  }

  :host([data-color='error']):after {
    background-color: ${({tokens:t})=>t.core.backgroundError};
  }

  :host([data-color='warning']) {
    color: ${({tokens:t})=>t.core.iconWarning};
  }

  :host([data-color='warning']):after {
    background-color: ${({tokens:t})=>t.core.backgroundWarning};
  }

  :host([data-color='inverse']) {
    color: ${({tokens:t})=>t.theme.iconInverse};
  }

  :host([data-color='inverse']):after {
    background-color: transparent;
  }
`;var we=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Lt=class extends _{constructor(){super(...arguments),this.icon="copy",this.size="md",this.padding="1",this.color="default"}render(){return this.dataset.padding=this.padding,this.dataset.color=this.color,h`
      <wui-icon size=${U(this.size)} name=${this.icon} color="inherit"></wui-icon>
    `}};Lt.styles=[E,B,Yi];we([c()],Lt.prototype,"icon",void 0);we([c()],Lt.prototype,"size",void 0);we([c()],Lt.prototype,"padding",void 0);we([c()],Lt.prototype,"color",void 0);Lt=we([k("wui-icon-box")],Lt);const qi=P`
  :host {
    display: block;
    width: var(--local-width);
    height: var(--local-height);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    border-radius: inherit;
    user-select: none;
    user-drag: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
  }

  :host([data-boxed='true']) {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  :host([data-boxed='true']) img {
    width: 20px;
    height: 20px;
    border-radius: ${({borderRadius:t})=>t[16]};
  }

  :host([data-full='true']) img {
    width: 100%;
    height: 100%;
  }

  :host([data-boxed='true']) wui-icon {
    width: 20px;
    height: 20px;
  }

  :host([data-icon='error']) {
    background-color: ${({tokens:t})=>t.core.backgroundError};
  }

  :host([data-rounded='true']) {
    border-radius: ${({borderRadius:t})=>t[16]};
  }
`;var nt=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Y=class extends _{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0,this.boxed=!1,this.rounded=!1,this.fullSize=!1}render(){const e={inherit:"inherit",xxs:"2",xs:"3",sm:"4",md:"4",mdl:"5",lg:"5",xl:"6",xxl:"7","3xl":"8","4xl":"9","5xl":"10"};return this.style.cssText=`
      --local-width: ${this.size?`var(--apkt-spacing-${e[this.size]});`:"100%"};
      --local-height: ${this.size?`var(--apkt-spacing-${e[this.size]});`:"100%"};
      `,this.dataset.boxed=this.boxed?"true":"false",this.dataset.rounded=this.rounded?"true":"false",this.dataset.full=this.fullSize?"true":"false",this.dataset.icon=this.iconColor||"inherit",this.icon?h`<wui-icon
        color=${this.iconColor||"inherit"}
        name=${this.icon}
        size="lg"
      ></wui-icon> `:this.logo?h`<wui-icon size="lg" color="inherit" name=${this.logo}></wui-icon> `:h`<img src=${U(this.src)} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};Y.styles=[E,qi];nt([c()],Y.prototype,"src",void 0);nt([c()],Y.prototype,"logo",void 0);nt([c()],Y.prototype,"icon",void 0);nt([c()],Y.prototype,"iconColor",void 0);nt([c()],Y.prototype,"alt",void 0);nt([c()],Y.prototype,"size",void 0);nt([c({type:Boolean})],Y.prototype,"boxed",void 0);nt([c({type:Boolean})],Y.prototype,"rounded",void 0);nt([c({type:Boolean})],Y.prototype,"fullSize",void 0);Y=nt([k("wui-image")],Y);const Ji=P`
  :host {
    position: relative;
    background-color: ${({tokens:t})=>t.theme.foregroundTertiary};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host([data-image='true']) {
    background-color: transparent;
  }

  :host > wui-flex {
    overflow: hidden;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host([data-size='sm']) {
    width: 32px;
    height: 32px;
  }

  :host([data-size='md']) {
    width: 40px;
    height: 40px;
  }

  :host([data-size='lg']) {
    width: 56px;
    height: 56px;
  }

  :host([name='Extension'])::after {
    border: 1px solid ${({colors:t})=>t.accent010};
  }

  :host([data-wallet-icon='allWallets'])::after {
    border: 1px solid ${({colors:t})=>t.accent010};
  }

  wui-icon[data-parent-size='inherit'] {
    width: 75%;
    height: 75%;
    align-items: center;
  }

  wui-icon {
    color: ${({tokens:t})=>t.theme.iconDefault};
  }

  wui-icon[data-parent-size='sm'] {
    width: 24px;
    height: 24px;
  }

  wui-icon[data-parent-size='md'] {
    width: 32px;
    height: 32px;
  }

  :host > wui-icon-box {
    position: absolute;
    overflow: hidden;
    right: -1px;
    bottom: -2px;
    z-index: 1;
    border: 2px solid ${({tokens:t})=>t.theme.backgroundPrimary};
    padding: 1px;
  }
`;var Ht=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let ut=class extends _{constructor(){super(...arguments),this.size="md",this.name="",this.installed=!1,this.badgeSize="xs"}render(){let e="1";return this.size==="lg"?e="4":this.size==="md"?e="2":this.size==="sm"&&(e="1"),this.style.cssText=`
       --local-border-radius: var(--apkt-borderRadius-${e});
   `,this.dataset.size=this.size,this.imageSrc&&(this.dataset.image="true"),this.walletIcon&&(this.dataset.walletIcon=this.walletIcon),h`
      <wui-flex justifyContent="center" alignItems="center"> ${this.templateVisual()} </wui-flex>
    `}templateVisual(){return this.imageSrc?h`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:this.walletIcon?h`<wui-icon size="md" color="default" name=${this.walletIcon}></wui-icon>`:h`<wui-icon
      data-parent-size=${this.size}
      size="inherit"
      color="inherit"
      name="wallet"
    ></wui-icon>`}};ut.styles=[E,Ji];Ht([c()],ut.prototype,"size",void 0);Ht([c()],ut.prototype,"name",void 0);Ht([c()],ut.prototype,"imageSrc",void 0);Ht([c()],ut.prototype,"walletIcon",void 0);Ht([c({type:Boolean})],ut.prototype,"installed",void 0);Ht([c()],ut.prototype,"badgeSize",void 0);ut=Ht([k("wui-wallet-image")],ut);const Qi=P`
  :host {
    position: relative;
    border-radius: ${({borderRadius:t})=>t[2]};
    width: 40px;
    height: 40px;
    overflow: hidden;
    background: ${({tokens:t})=>t.theme.foregroundPrimary};
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    column-gap: ${({spacing:t})=>t[1]};
    padding: ${({spacing:t})=>t[1]};
  }

  :host > wui-wallet-image {
    width: 14px;
    height: 14px;
    border-radius: 2px;
  }
`;var cr=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const eo=4;let Ie=class extends _{constructor(){super(...arguments),this.walletImages=[]}render(){const e=this.walletImages.length<eo;return h`${this.walletImages.slice(0,eo).map(({src:o,walletName:i})=>h`
          <wui-wallet-image
            size="sm"
            imageSrc=${o}
            name=${U(i)}
          ></wui-wallet-image>
        `)}
    ${e?[...Array(eo-this.walletImages.length)].map(()=>h` <wui-wallet-image size="sm" name=""></wui-wallet-image>`):null} `}};Ie.styles=[E,Qi];cr([c({type:Array})],Ie.prototype,"walletImages",void 0);Ie=cr([k("wui-all-wallets-image")],Ie);const Xi=P`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: ${({spacing:t})=>t[1]};
    text-transform: uppercase;
    white-space: nowrap;
  }

  :host([data-variant='accent']) {
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
    color: ${({tokens:t})=>t.core.textAccentPrimary};
  }

  :host([data-variant='info']) {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    color: ${({tokens:t})=>t.theme.textSecondary};
  }

  :host([data-variant='success']) {
    background-color: ${({tokens:t})=>t.core.backgroundSuccess};
    color: ${({tokens:t})=>t.core.textSuccess};
  }

  :host([data-variant='warning']) {
    background-color: ${({tokens:t})=>t.core.backgroundWarning};
    color: ${({tokens:t})=>t.core.textWarning};
  }

  :host([data-variant='error']) {
    background-color: ${({tokens:t})=>t.core.backgroundError};
    color: ${({tokens:t})=>t.core.textError};
  }

  :host([data-variant='certified']) {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    color: ${({tokens:t})=>t.theme.textSecondary};
  }

  :host([data-size='md']) {
    height: 30px;
    padding: 0 ${({spacing:t})=>t[2]};
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  :host([data-size='sm']) {
    height: 20px;
    padding: 0 ${({spacing:t})=>t[1]};
    border-radius: ${({borderRadius:t})=>t[1]};
  }
`;var We=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Vt=class extends _{constructor(){super(...arguments),this.variant="accent",this.size="md",this.icon=void 0}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const e=this.size==="md"?"md-medium":"sm-medium",o=this.size==="md"?"md":"sm";return h`
      ${this.icon?h`<wui-icon size=${o} name=${this.icon}></wui-icon>`:null}
      <wui-text
        display="inline"
        data-variant=${this.variant}
        variant=${e}
        color="inherit"
      >
        <slot></slot>
      </wui-text>
    `}};Vt.styles=[E,Xi];We([c()],Vt.prototype,"variant",void 0);We([c()],Vt.prototype,"size",void 0);We([c()],Vt.prototype,"icon",void 0);Vt=We([k("wui-tag")],Vt);const tn=P`
  :host {
    width: 100%;
  }

  button {
    column-gap: ${({spacing:t})=>t[2]};
    padding: ${({spacing:t})=>t[3]};
    width: 100%;
    background-color: transparent;
    border-radius: ${({borderRadius:t})=>t[4]};
    color: ${({tokens:t})=>t.theme.textPrimary};
  }

  button > wui-wallet-image {
    background: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  button > wui-text:nth-child(2) {
    display: flex;
    flex: 1;
  }

  button:hover:enabled {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  button[data-all-wallets='true'] {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  button[data-all-wallets='true']:hover:enabled {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  button:focus-visible:enabled {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    box-shadow: 0 0 0 4px ${({tokens:t})=>t.core.foregroundAccent020};
  }

  button:disabled {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:disabled > wui-tag {
    background-color: ${({tokens:t})=>t.core.glass010};
    color: ${({tokens:t})=>t.theme.foregroundTertiary};
  }

  wui-flex.namespace-icon {
    width: 16px;
    height: 16px;
    border-radius: ${({borderRadius:t})=>t.round};
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    box-shadow: 0 0 0 2px ${({tokens:t})=>t.theme.backgroundPrimary};
    transition: box-shadow var(--apkt-durations-lg) var(--apkt-easings-ease-out-power-2);
  }

  button:hover:enabled wui-flex.namespace-icon {
    box-shadow: 0 0 0 2px ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  wui-flex.namespace-icon > wui-icon {
    width: 10px;
    height: 10px;
  }

  wui-flex.namespace-icon:not(:first-child) {
    margin-left: -4px;
  }
`;var F=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const en={eip155:"ethereum",solana:"solana",bip122:"bitcoin",polkadot:void 0,cosmos:void 0,sui:void 0,stacks:void 0,ton:"ton"};let O=class extends _{constructor(){super(...arguments),this.walletImages=[],this.imageSrc="",this.name="",this.size="md",this.tabIdx=void 0,this.namespaces=[],this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100"}render(){return this.dataset.size=this.size,h`
      <button
        ?disabled=${this.disabled}
        data-all-wallets=${this.showAllWallets}
        tabindex=${U(this.tabIdx)}
      >
        ${this.templateAllWallets()} ${this.templateWalletImage()}
        <wui-flex flexDirection="column" justifyContent="center" alignItems="flex-start" gap="1">
          <wui-text variant="lg-regular" color="inherit">${this.name}</wui-text>
          ${this.templateNamespaces()}
        </wui-flex>
        ${this.templateStatus()}
        <wui-icon name="chevronRight" size="lg" color="default"></wui-icon>
      </button>
    `}templateNamespaces(){var e;return(e=this.namespaces)!=null&&e.length?h`<wui-flex alignItems="center" gap="0">
        ${this.namespaces.map((o,i)=>{var n;return h`<wui-flex
              alignItems="center"
              justifyContent="center"
              zIndex=${(((n=this.namespaces)==null?void 0:n.length)??0)*2-i}
              class="namespace-icon"
            >
              <wui-icon
                name=${U(en[o])}
                size="sm"
                color="default"
              ></wui-icon>
            </wui-flex>`})}
      </wui-flex>`:null}templateAllWallets(){return this.showAllWallets&&this.imageSrc?h` <wui-all-wallets-image .imageeSrc=${this.imageSrc}> </wui-all-wallets-image> `:this.showAllWallets&&this.walletIcon?h` <wui-wallet-image .walletIcon=${this.walletIcon} size="sm"> </wui-wallet-image> `:null}templateWalletImage(){return!this.showAllWallets&&this.imageSrc?h`<wui-wallet-image
        size=${U(this.size==="sm"?"sm":"md")}
        imageSrc=${this.imageSrc}
        name=${this.name}
      ></wui-wallet-image>`:!this.showAllWallets&&!this.imageSrc?h`<wui-wallet-image size="sm" name=${this.name}></wui-wallet-image>`:null}templateStatus(){return this.loading?h`<wui-loading-spinner size="lg" color="accent-primary"></wui-loading-spinner>`:this.tagLabel&&this.tagVariant?h`<wui-tag size="sm" variant=${this.tagVariant}>${this.tagLabel}</wui-tag>`:null}};O.styles=[E,B,tn];F([c({type:Array})],O.prototype,"walletImages",void 0);F([c()],O.prototype,"imageSrc",void 0);F([c()],O.prototype,"name",void 0);F([c()],O.prototype,"size",void 0);F([c()],O.prototype,"tagLabel",void 0);F([c()],O.prototype,"tagVariant",void 0);F([c()],O.prototype,"walletIcon",void 0);F([c()],O.prototype,"tabIdx",void 0);F([c({type:Array})],O.prototype,"namespaces",void 0);F([c({type:Boolean})],O.prototype,"disabled",void 0);F([c({type:Boolean})],O.prototype,"showAllWallets",void 0);F([c({type:Boolean})],O.prototype,"loading",void 0);F([c({type:String})],O.prototype,"loadingSpinnerColor",void 0);O=F([k("wui-list-wallet")],O);const on=P`
  :host {
    flex: 1;
    height: 100%;
  }

  button {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    padding: ${({spacing:t})=>t[1]} ${({spacing:t})=>t[2]};
    column-gap: ${({spacing:t})=>t[1]};
    color: ${({tokens:t})=>t.theme.textSecondary};
    border-radius: ${({borderRadius:t})=>t[20]};
    background-color: transparent;
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button[data-active='true'] {
    color: ${({tokens:t})=>t.theme.textPrimary};
    background-color: ${({tokens:t})=>t.theme.foregroundTertiary};
  }

  button:hover:enabled:not([data-active='true']),
  button:active:enabled:not([data-active='true']) {
    wui-text,
    wui-icon {
      color: ${({tokens:t})=>t.theme.textPrimary};
    }
  }
`;var be=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const rn={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},nn={lg:"md",md:"sm",sm:"sm"};let It=class extends _{constructor(){super(...arguments),this.icon="mobile",this.size="md",this.label="",this.active=!1}render(){return h`
      <button data-active=${this.active}>
        ${this.icon?h`<wui-icon size=${nn[this.size]} name=${this.icon}></wui-icon>`:""}
        <wui-text variant=${rn[this.size]}> ${this.label} </wui-text>
      </button>
    `}};It.styles=[E,B,on];be([c()],It.prototype,"icon",void 0);be([c()],It.prototype,"size",void 0);be([c()],It.prototype,"label",void 0);be([c({type:Boolean})],It.prototype,"active",void 0);It=be([k("wui-tab-item")],It);const an=P`
  :host {
    display: inline-flex;
    align-items: center;
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    border-radius: ${({borderRadius:t})=>t[32]};
    padding: ${({spacing:t})=>t["01"]};
    box-sizing: border-box;
  }

  :host([data-size='sm']) {
    height: 26px;
  }

  :host([data-size='md']) {
    height: 36px;
  }
`;var ye=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Bt=class extends _{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.size="md",this.activeTab=0}render(){return this.dataset.size=this.size,this.tabs.map((e,o)=>{var n;const i=o===this.activeTab;return h`
        <wui-tab-item
          @click=${()=>this.onTabClick(o)}
          icon=${e.icon}
          size=${this.size}
          label=${e.label}
          ?active=${i}
          data-active=${i}
          data-testid="tab-${(n=e.label)==null?void 0:n.toLowerCase()}"
        ></wui-tab-item>
      `})}onTabClick(e){this.activeTab=e,this.onTabChange(e)}};Bt.styles=[E,B,an];ye([c({type:Array})],Bt.prototype,"tabs",void 0);ye([c()],Bt.prototype,"onTabChange",void 0);ye([c()],Bt.prototype,"size",void 0);ye([ci()],Bt.prototype,"activeTab",void 0);Bt=ye([k("wui-tabs")],Bt);const sn=G`
  :host {
    display: flex;
  }

  :host([data-size='sm']) > svg {
    width: 12px;
    height: 12px;
  }

  :host([data-size='md']) > svg {
    width: 16px;
    height: 16px;
  }

  :host([data-size='lg']) > svg {
    width: 24px;
    height: 24px;
  }

  :host([data-size='xl']) > svg {
    width: 32px;
    height: 32px;
  }

  svg {
    animation: rotate 1.4s linear infinite;
    color: var(--local-color);
  }

  :host([data-size='md']) > svg > circle {
    stroke-width: 6px;
  }

  :host([data-size='sm']) > svg > circle {
    stroke-width: 8px;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
`;var vo=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let de=class extends _{constructor(){super(...arguments),this.color="primary",this.size="lg"}render(){const e={primary:z.tokens.theme.textPrimary,secondary:z.tokens.theme.textSecondary,tertiary:z.tokens.theme.textTertiary,invert:z.tokens.theme.textInvert,error:z.tokens.core.textError,warning:z.tokens.core.textWarning,"accent-primary":z.tokens.core.textAccentPrimary};return this.style.cssText=`
      --local-color: ${this.color==="inherit"?"inherit":e[this.color]};
      `,this.dataset.size=this.size,h`<svg viewBox="0 0 16 17" fill="none">
      <path
        d="M8.75 2.65625V4.65625C8.75 4.85516 8.67098 5.04593 8.53033 5.18658C8.38968 5.32723 8.19891 5.40625 8 5.40625C7.80109 5.40625 7.61032 5.32723 7.46967 5.18658C7.32902 5.04593 7.25 4.85516 7.25 4.65625V2.65625C7.25 2.45734 7.32902 2.26657 7.46967 2.12592C7.61032 1.98527 7.80109 1.90625 8 1.90625C8.19891 1.90625 8.38968 1.98527 8.53033 2.12592C8.67098 2.26657 8.75 2.45734 8.75 2.65625ZM14 7.90625H12C11.8011 7.90625 11.6103 7.98527 11.4697 8.12592C11.329 8.26657 11.25 8.45734 11.25 8.65625C11.25 8.85516 11.329 9.04593 11.4697 9.18658C11.6103 9.32723 11.8011 9.40625 12 9.40625H14C14.1989 9.40625 14.3897 9.32723 14.5303 9.18658C14.671 9.04593 14.75 8.85516 14.75 8.65625C14.75 8.45734 14.671 8.26657 14.5303 8.12592C14.3897 7.98527 14.1989 7.90625 14 7.90625ZM11.3588 10.9544C11.289 10.8846 11.2062 10.8293 11.115 10.7915C11.0239 10.7538 10.9262 10.7343 10.8275 10.7343C10.7288 10.7343 10.6311 10.7538 10.54 10.7915C10.4488 10.8293 10.366 10.8846 10.2963 10.9544C10.2265 11.0241 10.1711 11.107 10.1334 11.1981C10.0956 11.2893 10.0762 11.387 10.0762 11.4856C10.0762 11.5843 10.0956 11.682 10.1334 11.7731C10.1711 11.8643 10.2265 11.9471 10.2963 12.0169L11.7106 13.4312C11.8515 13.5721 12.0426 13.6513 12.2419 13.6513C12.4411 13.6513 12.6322 13.5721 12.7731 13.4312C12.914 13.2904 12.9932 13.0993 12.9932 12.9C12.9932 12.7007 12.914 12.5096 12.7731 12.3687L11.3588 10.9544ZM8 11.9062C7.80109 11.9062 7.61032 11.9853 7.46967 12.1259C7.32902 12.2666 7.25 12.4573 7.25 12.6562V14.6562C7.25 14.8552 7.32902 15.0459 7.46967 15.1866C7.61032 15.3272 7.80109 15.4062 8 15.4062C8.19891 15.4062 8.38968 15.3272 8.53033 15.1866C8.67098 15.0459 8.75 14.8552 8.75 14.6562V12.6562C8.75 12.4573 8.67098 12.2666 8.53033 12.1259C8.38968 11.9853 8.19891 11.9062 8 11.9062ZM4.64125 10.9544L3.22688 12.3687C3.08598 12.5096 3.00682 12.7007 3.00682 12.9C3.00682 13.0993 3.08598 13.2904 3.22688 13.4312C3.36777 13.5721 3.55887 13.6513 3.75813 13.6513C3.95738 13.6513 4.14848 13.5721 4.28937 13.4312L5.70375 12.0169C5.84465 11.876 5.9238 11.6849 5.9238 11.4856C5.9238 11.2864 5.84465 11.0953 5.70375 10.9544C5.56285 10.8135 5.37176 10.7343 5.1725 10.7343C4.97324 10.7343 4.78215 10.8135 4.64125 10.9544ZM4.75 8.65625C4.75 8.45734 4.67098 8.26657 4.53033 8.12592C4.38968 7.98527 4.19891 7.90625 4 7.90625H2C1.80109 7.90625 1.61032 7.98527 1.46967 8.12592C1.32902 8.26657 1.25 8.45734 1.25 8.65625C1.25 8.85516 1.32902 9.04593 1.46967 9.18658C1.61032 9.32723 1.80109 9.40625 2 9.40625H4C4.19891 9.40625 4.38968 9.32723 4.53033 9.18658C4.67098 9.04593 4.75 8.85516 4.75 8.65625ZM4.2875 3.88313C4.1466 3.74223 3.95551 3.66307 3.75625 3.66307C3.55699 3.66307 3.3659 3.74223 3.225 3.88313C3.0841 4.02402 3.00495 4.21512 3.00495 4.41438C3.00495 4.61363 3.0841 4.80473 3.225 4.94562L4.64125 6.35813C4.78215 6.49902 4.97324 6.57818 5.1725 6.57818C5.37176 6.57818 5.56285 6.49902 5.70375 6.35813C5.84465 6.21723 5.9238 6.02613 5.9238 5.82688C5.9238 5.62762 5.84465 5.43652 5.70375 5.29563L4.2875 3.88313Z"
        fill="currentColor"
      />
    </svg>`}};de.styles=[E,sn];vo([c()],de.prototype,"color",void 0);vo([c()],de.prototype,"size",void 0);de=vo([k("wui-loading-spinner")],de);const ln=P`
  :host {
    width: var(--local-width);
  }

  button {
    width: var(--local-width);
    white-space: nowrap;
    column-gap: ${({spacing:t})=>t[2]};
    transition:
      scale ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-1"]},
      background-color ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      border-radius ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-1"]};
    will-change: scale, background-color, border-radius;
    cursor: pointer;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='sm'] {
    border-radius: ${({borderRadius:t})=>t[2]};
    padding: 0 ${({spacing:t})=>t[2]};
    height: 28px;
  }

  button[data-size='md'] {
    border-radius: ${({borderRadius:t})=>t[3]};
    padding: 0 ${({spacing:t})=>t[4]};
    height: 38px;
  }

  button[data-size='lg'] {
    border-radius: ${({borderRadius:t})=>t[4]};
    padding: 0 ${({spacing:t})=>t[5]};
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='accent-primary'] {
    background-color: ${({tokens:t})=>t.core.backgroundAccentPrimary};
    color: ${({tokens:t})=>t.theme.textInvert};
  }

  button[data-variant='accent-secondary'] {
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
    color: ${({tokens:t})=>t.core.textAccentPrimary};
  }

  button[data-variant='neutral-primary'] {
    background-color: ${({tokens:t})=>t.theme.backgroundInvert};
    color: ${({tokens:t})=>t.theme.textInvert};
  }

  button[data-variant='neutral-secondary'] {
    background-color: transparent;
    border: 1px solid ${({tokens:t})=>t.theme.borderSecondary};
    color: ${({tokens:t})=>t.theme.textPrimary};
  }

  button[data-variant='neutral-tertiary'] {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    color: ${({tokens:t})=>t.theme.textPrimary};
  }

  button[data-variant='error-primary'] {
    background-color: ${({tokens:t})=>t.core.textError};
    color: ${({tokens:t})=>t.theme.textInvert};
  }

  button[data-variant='error-secondary'] {
    background-color: ${({tokens:t})=>t.core.backgroundError};
    color: ${({tokens:t})=>t.core.textError};
  }

  button[data-variant='shade'] {
    background: var(--wui-color-gray-glass-002);
    color: var(--wui-color-fg-200);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-size='sm']:focus-visible:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:focus-visible:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:focus-visible:enabled {
    border-radius: 48px;
  }
  button[data-variant='shade']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button[data-size='sm']:hover:enabled {
      border-radius: 28px;
    }

    button[data-size='md']:hover:enabled {
      border-radius: 38px;
    }

    button[data-size='lg']:hover:enabled {
      border-radius: 48px;
    }

    button[data-variant='shade']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='shade']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }
  }

  button[data-size='sm']:active:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:active:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:active:enabled {
    border-radius: 48px;
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    opacity: 0.3;
  }
`;var Dt=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const cn={lg:"lg-regular-mono",md:"md-regular-mono",sm:"sm-regular-mono"},dn={lg:"md",md:"md",sm:"sm"};let ht=class extends _{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="accent-primary"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
     `;const e=this.textVariant??cn[this.size];return h`
      <button data-variant=${this.variant} data-size=${this.size} ?disabled=${this.disabled}>
        ${this.loadingTemplate()}
        <slot name="iconLeft"></slot>
        <wui-text variant=${e} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}loadingTemplate(){if(this.loading){const e=dn[this.size],o=this.variant==="neutral-primary"||this.variant==="accent-primary"?"invert":"primary";return h`<wui-loading-spinner color=${o} size=${e}></wui-loading-spinner>`}return null}};ht.styles=[E,B,ln];Dt([c()],ht.prototype,"size",void 0);Dt([c({type:Boolean})],ht.prototype,"disabled",void 0);Dt([c({type:Boolean})],ht.prototype,"fullWidth",void 0);Dt([c({type:Boolean})],ht.prototype,"loading",void 0);Dt([c()],ht.prototype,"variant",void 0);Dt([c()],ht.prototype,"textVariant",void 0);ht=Dt([k("wui-button")],ht);const un=P`
  button {
    border: none;
    background: transparent;
    height: 20px;
    padding: ${({spacing:t})=>t[2]};
    column-gap: ${({spacing:t})=>t[1]};
    border-radius: ${({borderRadius:t})=>t[1]};
    padding: 0 ${({spacing:t})=>t[1]};
    border-radius: ${({spacing:t})=>t[1]};
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='accent'] {
    color: ${({tokens:t})=>t.core.textAccentPrimary};
  }

  button[data-variant='secondary'] {
    color: ${({tokens:t})=>t.theme.textSecondary};
  }

  /* -- Focus states --------------------------------------------------- */
  button:focus-visible:enabled {
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  button[data-variant='accent']:focus-visible:enabled {
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
  }

  button[data-variant='secondary']:focus-visible:enabled {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button[data-variant='accent']:hover:enabled {
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
  }

  button[data-variant='secondary']:hover:enabled {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  button[data-variant='accent']:focus-visible {
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
  }

  button[data-variant='secondary']:focus-visible {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var $e=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const hn={sm:"sm-medium",md:"md-medium"},pn={accent:"accent-primary",secondary:"secondary"};let Mt=class extends _{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.variant="accent",this.icon=void 0}render(){return h`
      <button ?disabled=${this.disabled} data-variant=${this.variant}>
        <slot name="iconLeft"></slot>
        <wui-text
          color=${pn[this.variant]}
          variant=${hn[this.size]}
        >
          <slot></slot>
        </wui-text>
        ${this.iconTemplate()}
      </button>
    `}iconTemplate(){return this.icon?h`<wui-icon name=${this.icon} size="sm"></wui-icon>`:null}};Mt.styles=[E,B,un];$e([c()],Mt.prototype,"size",void 0);$e([c({type:Boolean})],Mt.prototype,"disabled",void 0);$e([c()],Mt.prototype,"variant",void 0);$e([c()],Mt.prototype,"icon",void 0);Mt=$e([k("wui-link")],Mt);const fn=P`
  :host {
    display: block;
    width: 100px;
    height: 100px;
  }

  svg {
    width: 100px;
    height: 100px;
  }

  rect {
    fill: none;
    stroke: ${t=>t.colors.accent100};
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var dr=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Be=class extends _{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const e=this.radius>50?50:this.radius,i=36-e,n=116+i,r=245+i,a=360+i*1.75;return h`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${n} ${r}"
          stroke-dashoffset=${a}
        />
      </svg>
    `}};Be.styles=[E,fn];dr([c({type:Number})],Be.prototype,"radius",void 0);Be=dr([k("wui-loading-thumbnail")],Be);const gn=P`
  wui-flex {
    width: 100%;
    height: 52px;
    box-sizing: border-box;
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[5]};
    padding-left: ${({spacing:t})=>t[3]};
    padding-right: ${({spacing:t})=>t[3]};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:t})=>t[6]};
  }

  wui-text {
    color: ${({tokens:t})=>t.theme.textSecondary};
  }

  wui-icon {
    width: 12px;
    height: 12px;
  }
`;var Ve=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Ut=class extends _{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return h`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-text variant="lg-regular" color="inherit">${this.label}</wui-text>
        <wui-button variant="accent-secondary" size="sm">
          ${this.buttonLabel}
          <wui-icon name="chevronRight" color="inherit" size="inherit" slot="iconRight"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};Ut.styles=[E,B,gn];Ve([c({type:Boolean})],Ut.prototype,"disabled",void 0);Ve([c()],Ut.prototype,"label",void 0);Ve([c()],Ut.prototype,"buttonLabel",void 0);Ut=Ve([k("wui-cta-button")],Ut);var ve={},mn=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then},ur={},K={};let xo;const wn=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];K.getSymbolSize=function(e){if(!e)throw new Error('"version" cannot be null or undefined');if(e<1||e>40)throw new Error('"version" should be in range from 1 to 40');return e*4+17};K.getSymbolTotalCodewords=function(e){return wn[e]};K.getBCHDigit=function(t){let e=0;for(;t!==0;)e++,t>>>=1;return e};K.setToSJISFunction=function(e){if(typeof e!="function")throw new Error('"toSJISFunc" is not a valid function.');xo=e};K.isKanjiModeEnabled=function(){return typeof xo<"u"};K.toSJIS=function(e){return xo(e)};var Ue={};(function(t){t.L={bit:1},t.M={bit:0},t.Q={bit:3},t.H={bit:2};function e(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case"l":case"low":return t.L;case"m":case"medium":return t.M;case"q":case"quartile":return t.Q;case"h":case"high":return t.H;default:throw new Error("Unknown EC Level: "+o)}}t.isValid=function(i){return i&&typeof i.bit<"u"&&i.bit>=0&&i.bit<4},t.from=function(i,n){if(t.isValid(i))return i;try{return e(i)}catch{return n}}})(Ue);function hr(){this.buffer=[],this.length=0}hr.prototype={get:function(t){const e=Math.floor(t/8);return(this.buffer[e]>>>7-t%8&1)===1},put:function(t,e){for(let o=0;o<e;o++)this.putBit((t>>>e-o-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(t){const e=Math.floor(this.length/8);this.buffer.length<=e&&this.buffer.push(0),t&&(this.buffer[e]|=128>>>this.length%8),this.length++}};var bn=hr;function xe(t){if(!t||t<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=t,this.data=new Uint8Array(t*t),this.reservedBit=new Uint8Array(t*t)}xe.prototype.set=function(t,e,o,i){const n=t*this.size+e;this.data[n]=o,i&&(this.reservedBit[n]=!0)};xe.prototype.get=function(t,e){return this.data[t*this.size+e]};xe.prototype.xor=function(t,e,o){this.data[t*this.size+e]^=o};xe.prototype.isReserved=function(t,e){return this.reservedBit[t*this.size+e]};var yn=xe,pr={};(function(t){const e=K.getSymbolSize;t.getRowColCoords=function(i){if(i===1)return[];const n=Math.floor(i/7)+2,r=e(i),a=r===145?26:Math.ceil((r-13)/(2*n-2))*2,s=[r-7];for(let l=1;l<n-1;l++)s[l]=s[l-1]-a;return s.push(6),s.reverse()},t.getPositions=function(i){const n=[],r=t.getRowColCoords(i),a=r.length;for(let s=0;s<a;s++)for(let l=0;l<a;l++)s===0&&l===0||s===0&&l===a-1||s===a-1&&l===0||n.push([r[s],r[l]]);return n}})(pr);var fr={};const $n=K.getSymbolSize,Go=7;fr.getPositions=function(e){const o=$n(e);return[[0,0],[o-Go,0],[0,o-Go]]};var gr={};(function(t){t.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const e={N1:3,N2:3,N3:40,N4:10};t.isValid=function(n){return n!=null&&n!==""&&!isNaN(n)&&n>=0&&n<=7},t.from=function(n){return t.isValid(n)?parseInt(n,10):void 0},t.getPenaltyN1=function(n){const r=n.size;let a=0,s=0,l=0,d=null,u=null;for(let b=0;b<r;b++){s=l=0,d=u=null;for(let y=0;y<r;y++){let g=n.get(b,y);g===d?s++:(s>=5&&(a+=e.N1+(s-5)),d=g,s=1),g=n.get(y,b),g===u?l++:(l>=5&&(a+=e.N1+(l-5)),u=g,l=1)}s>=5&&(a+=e.N1+(s-5)),l>=5&&(a+=e.N1+(l-5))}return a},t.getPenaltyN2=function(n){const r=n.size;let a=0;for(let s=0;s<r-1;s++)for(let l=0;l<r-1;l++){const d=n.get(s,l)+n.get(s,l+1)+n.get(s+1,l)+n.get(s+1,l+1);(d===4||d===0)&&a++}return a*e.N2},t.getPenaltyN3=function(n){const r=n.size;let a=0,s=0,l=0;for(let d=0;d<r;d++){s=l=0;for(let u=0;u<r;u++)s=s<<1&2047|n.get(d,u),u>=10&&(s===1488||s===93)&&a++,l=l<<1&2047|n.get(u,d),u>=10&&(l===1488||l===93)&&a++}return a*e.N3},t.getPenaltyN4=function(n){let r=0;const a=n.data.length;for(let l=0;l<a;l++)r+=n.data[l];return Math.abs(Math.ceil(r*100/a/5)-10)*e.N4};function o(i,n,r){switch(i){case t.Patterns.PATTERN000:return(n+r)%2===0;case t.Patterns.PATTERN001:return n%2===0;case t.Patterns.PATTERN010:return r%3===0;case t.Patterns.PATTERN011:return(n+r)%3===0;case t.Patterns.PATTERN100:return(Math.floor(n/2)+Math.floor(r/3))%2===0;case t.Patterns.PATTERN101:return n*r%2+n*r%3===0;case t.Patterns.PATTERN110:return(n*r%2+n*r%3)%2===0;case t.Patterns.PATTERN111:return(n*r%3+(n+r)%2)%2===0;default:throw new Error("bad maskPattern:"+i)}}t.applyMask=function(n,r){const a=r.size;for(let s=0;s<a;s++)for(let l=0;l<a;l++)r.isReserved(l,s)||r.xor(l,s,o(n,l,s))},t.getBestMask=function(n,r){const a=Object.keys(t.Patterns).length;let s=0,l=1/0;for(let d=0;d<a;d++){r(d),t.applyMask(d,n);const u=t.getPenaltyN1(n)+t.getPenaltyN2(n)+t.getPenaltyN3(n)+t.getPenaltyN4(n);t.applyMask(d,n),u<l&&(l=u,s=d)}return s}})(gr);var Ze={};const mt=Ue,ke=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],Ae=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];Ze.getBlocksCount=function(e,o){switch(o){case mt.L:return ke[(e-1)*4+0];case mt.M:return ke[(e-1)*4+1];case mt.Q:return ke[(e-1)*4+2];case mt.H:return ke[(e-1)*4+3];default:return}};Ze.getTotalCodewordsCount=function(e,o){switch(o){case mt.L:return Ae[(e-1)*4+0];case mt.M:return Ae[(e-1)*4+1];case mt.Q:return Ae[(e-1)*4+2];case mt.H:return Ae[(e-1)*4+3];default:return}};var mr={},Ke={};const ne=new Uint8Array(512),Me=new Uint8Array(256);(function(){let e=1;for(let o=0;o<255;o++)ne[o]=e,Me[e]=o,e<<=1,e&256&&(e^=285);for(let o=255;o<512;o++)ne[o]=ne[o-255]})();Ke.log=function(e){if(e<1)throw new Error("log("+e+")");return Me[e]};Ke.exp=function(e){return ne[e]};Ke.mul=function(e,o){return e===0||o===0?0:ne[Me[e]+Me[o]]};(function(t){const e=Ke;t.mul=function(i,n){const r=new Uint8Array(i.length+n.length-1);for(let a=0;a<i.length;a++)for(let s=0;s<n.length;s++)r[a+s]^=e.mul(i[a],n[s]);return r},t.mod=function(i,n){let r=new Uint8Array(i);for(;r.length-n.length>=0;){const a=r[0];for(let l=0;l<n.length;l++)r[l]^=e.mul(n[l],a);let s=0;for(;s<r.length&&r[s]===0;)s++;r=r.slice(s)}return r},t.generateECPolynomial=function(i){let n=new Uint8Array([1]);for(let r=0;r<i;r++)n=t.mul(n,new Uint8Array([1,e.exp(r)]));return n}})(mr);const wr=mr;function Co(t){this.genPoly=void 0,this.degree=t,this.degree&&this.initialize(this.degree)}Co.prototype.initialize=function(e){this.degree=e,this.genPoly=wr.generateECPolynomial(this.degree)};Co.prototype.encode=function(e){if(!this.genPoly)throw new Error("Encoder not initialized");const o=new Uint8Array(e.length+this.degree);o.set(e);const i=wr.mod(o,this.genPoly),n=this.degree-i.length;if(n>0){const r=new Uint8Array(this.degree);return r.set(i,n),r}return i};var vn=Co,br={},xt={},_o={};_o.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40};var at={};const yr="[0-9]+",xn="[A-Z $%*+\\-./:]+";let ue="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";ue=ue.replace(/u/g,"\\u");const Cn="(?:(?![A-Z0-9 $%*+\\-./:]|"+ue+`)(?:.|[\r
]))+`;at.KANJI=new RegExp(ue,"g");at.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");at.BYTE=new RegExp(Cn,"g");at.NUMERIC=new RegExp(yr,"g");at.ALPHANUMERIC=new RegExp(xn,"g");const _n=new RegExp("^"+ue+"$"),Sn=new RegExp("^"+yr+"$"),kn=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");at.testKanji=function(e){return _n.test(e)};at.testNumeric=function(e){return Sn.test(e)};at.testAlphanumeric=function(e){return kn.test(e)};(function(t){const e=_o,o=at;t.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},t.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},t.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},t.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},t.MIXED={bit:-1},t.getCharCountIndicator=function(r,a){if(!r.ccBits)throw new Error("Invalid mode: "+r);if(!e.isValid(a))throw new Error("Invalid version: "+a);return a>=1&&a<10?r.ccBits[0]:a<27?r.ccBits[1]:r.ccBits[2]},t.getBestModeForData=function(r){return o.testNumeric(r)?t.NUMERIC:o.testAlphanumeric(r)?t.ALPHANUMERIC:o.testKanji(r)?t.KANJI:t.BYTE},t.toString=function(r){if(r&&r.id)return r.id;throw new Error("Invalid mode")},t.isValid=function(r){return r&&r.bit&&r.ccBits};function i(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"numeric":return t.NUMERIC;case"alphanumeric":return t.ALPHANUMERIC;case"kanji":return t.KANJI;case"byte":return t.BYTE;default:throw new Error("Unknown mode: "+n)}}t.from=function(r,a){if(t.isValid(r))return r;try{return i(r)}catch{return a}}})(xt);(function(t){const e=K,o=Ze,i=Ue,n=xt,r=_o,a=7973,s=e.getBCHDigit(a);function l(y,g,x){for(let $=1;$<=40;$++)if(g<=t.getCapacity($,x,y))return $}function d(y,g){return n.getCharCountIndicator(y,g)+4}function u(y,g){let x=0;return y.forEach(function($){const C=d($.mode,g);x+=C+$.getBitsLength()}),x}function b(y,g){for(let x=1;x<=40;x++)if(u(y,x)<=t.getCapacity(x,g,n.MIXED))return x}t.from=function(g,x){return r.isValid(g)?parseInt(g,10):x},t.getCapacity=function(g,x,$){if(!r.isValid(g))throw new Error("Invalid QR Code version");typeof $>"u"&&($=n.BYTE);const C=e.getSymbolTotalCodewords(g),m=o.getTotalCodewordsCount(g,x),f=(C-m)*8;if($===n.MIXED)return f;const w=f-d($,g);switch($){case n.NUMERIC:return Math.floor(w/10*3);case n.ALPHANUMERIC:return Math.floor(w/11*2);case n.KANJI:return Math.floor(w/13);case n.BYTE:default:return Math.floor(w/8)}},t.getBestVersionForData=function(g,x){let $;const C=i.from(x,i.M);if(Array.isArray(g)){if(g.length>1)return b(g,C);if(g.length===0)return 1;$=g[0]}else $=g;return l($.mode,$.getLength(),C)},t.getEncodedBits=function(g){if(!r.isValid(g)||g<7)throw new Error("Invalid QR Code version");let x=g<<12;for(;e.getBCHDigit(x)-s>=0;)x^=a<<e.getBCHDigit(x)-s;return g<<12|x}})(br);var $r={};const uo=K,vr=1335,An=21522,Yo=uo.getBCHDigit(vr);$r.getEncodedBits=function(e,o){const i=e.bit<<3|o;let n=i<<10;for(;uo.getBCHDigit(n)-Yo>=0;)n^=vr<<uo.getBCHDigit(n)-Yo;return(i<<10|n)^An};var xr={};const En=xt;function Zt(t){this.mode=En.NUMERIC,this.data=t.toString()}Zt.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)};Zt.prototype.getLength=function(){return this.data.length};Zt.prototype.getBitsLength=function(){return Zt.getBitsLength(this.data.length)};Zt.prototype.write=function(e){let o,i,n;for(o=0;o+3<=this.data.length;o+=3)i=this.data.substr(o,3),n=parseInt(i,10),e.put(n,10);const r=this.data.length-o;r>0&&(i=this.data.substr(o),n=parseInt(i,10),e.put(n,r*3+1))};var Pn=Zt;const zn=xt,oo=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function Kt(t){this.mode=zn.ALPHANUMERIC,this.data=t}Kt.getBitsLength=function(e){return 11*Math.floor(e/2)+6*(e%2)};Kt.prototype.getLength=function(){return this.data.length};Kt.prototype.getBitsLength=function(){return Kt.getBitsLength(this.data.length)};Kt.prototype.write=function(e){let o;for(o=0;o+2<=this.data.length;o+=2){let i=oo.indexOf(this.data[o])*45;i+=oo.indexOf(this.data[o+1]),e.put(i,11)}this.data.length%2&&e.put(oo.indexOf(this.data[o]),6)};var Tn=Kt,Rn=function(e){for(var o=[],i=e.length,n=0;n<i;n++){var r=e.charCodeAt(n);if(r>=55296&&r<=56319&&i>n+1){var a=e.charCodeAt(n+1);a>=56320&&a<=57343&&(r=(r-55296)*1024+a-56320+65536,n+=1)}if(r<128){o.push(r);continue}if(r<2048){o.push(r>>6|192),o.push(r&63|128);continue}if(r<55296||r>=57344&&r<65536){o.push(r>>12|224),o.push(r>>6&63|128),o.push(r&63|128);continue}if(r>=65536&&r<=1114111){o.push(r>>18|240),o.push(r>>12&63|128),o.push(r>>6&63|128),o.push(r&63|128);continue}o.push(239,191,189)}return new Uint8Array(o).buffer};const Ln=Rn,In=xt;function Gt(t){this.mode=In.BYTE,typeof t=="string"&&(t=Ln(t)),this.data=new Uint8Array(t)}Gt.getBitsLength=function(e){return e*8};Gt.prototype.getLength=function(){return this.data.length};Gt.prototype.getBitsLength=function(){return Gt.getBitsLength(this.data.length)};Gt.prototype.write=function(t){for(let e=0,o=this.data.length;e<o;e++)t.put(this.data[e],8)};var Bn=Gt;const Mn=xt,On=K;function Yt(t){this.mode=Mn.KANJI,this.data=t}Yt.getBitsLength=function(e){return e*13};Yt.prototype.getLength=function(){return this.data.length};Yt.prototype.getBitsLength=function(){return Yt.getBitsLength(this.data.length)};Yt.prototype.write=function(t){let e;for(e=0;e<this.data.length;e++){let o=On.toSJIS(this.data[e]);if(o>=33088&&o<=40956)o-=33088;else if(o>=57408&&o<=60351)o-=49472;else throw new Error("Invalid SJIS character: "+this.data[e]+`
Make sure your charset is UTF-8`);o=(o>>>8&255)*192+(o&255),t.put(o,13)}};var Hn=Yt,Cr={exports:{}};(function(t){var e={single_source_shortest_paths:function(o,i,n){var r={},a={};a[i]=0;var s=e.PriorityQueue.make();s.push(i,0);for(var l,d,u,b,y,g,x,$,C;!s.empty();){l=s.pop(),d=l.value,b=l.cost,y=o[d]||{};for(u in y)y.hasOwnProperty(u)&&(g=y[u],x=b+g,$=a[u],C=typeof a[u]>"u",(C||$>x)&&(a[u]=x,s.push(u,x),r[u]=d))}if(typeof n<"u"&&typeof a[n]>"u"){var m=["Could not find a path from ",i," to ",n,"."].join("");throw new Error(m)}return r},extract_shortest_path_from_predecessor_list:function(o,i){for(var n=[],r=i;r;)n.push(r),o[r],r=o[r];return n.reverse(),n},find_path:function(o,i,n){var r=e.single_source_shortest_paths(o,i,n);return e.extract_shortest_path_from_predecessor_list(r,n)},PriorityQueue:{make:function(o){var i=e.PriorityQueue,n={},r;o=o||{};for(r in i)i.hasOwnProperty(r)&&(n[r]=i[r]);return n.queue=[],n.sorter=o.sorter||i.default_sorter,n},default_sorter:function(o,i){return o.cost-i.cost},push:function(o,i){var n={value:o,cost:i};this.queue.push(n),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};t.exports=e})(Cr);var Dn=Cr.exports;(function(t){const e=xt,o=Pn,i=Tn,n=Bn,r=Hn,a=at,s=K,l=Dn;function d(m){return unescape(encodeURIComponent(m)).length}function u(m,f,w){const p=[];let S;for(;(S=m.exec(w))!==null;)p.push({data:S[0],index:S.index,mode:f,length:S[0].length});return p}function b(m){const f=u(a.NUMERIC,e.NUMERIC,m),w=u(a.ALPHANUMERIC,e.ALPHANUMERIC,m);let p,S;return s.isKanjiModeEnabled()?(p=u(a.BYTE,e.BYTE,m),S=u(a.KANJI,e.KANJI,m)):(p=u(a.BYTE_KANJI,e.BYTE,m),S=[]),f.concat(w,p,S).sort(function(L,Q){return L.index-Q.index}).map(function(L){return{data:L.data,mode:L.mode,length:L.length}})}function y(m,f){switch(f){case e.NUMERIC:return o.getBitsLength(m);case e.ALPHANUMERIC:return i.getBitsLength(m);case e.KANJI:return r.getBitsLength(m);case e.BYTE:return n.getBitsLength(m)}}function g(m){return m.reduce(function(f,w){const p=f.length-1>=0?f[f.length-1]:null;return p&&p.mode===w.mode?(f[f.length-1].data+=w.data,f):(f.push(w),f)},[])}function x(m){const f=[];for(let w=0;w<m.length;w++){const p=m[w];switch(p.mode){case e.NUMERIC:f.push([p,{data:p.data,mode:e.ALPHANUMERIC,length:p.length},{data:p.data,mode:e.BYTE,length:p.length}]);break;case e.ALPHANUMERIC:f.push([p,{data:p.data,mode:e.BYTE,length:p.length}]);break;case e.KANJI:f.push([p,{data:p.data,mode:e.BYTE,length:d(p.data)}]);break;case e.BYTE:f.push([{data:p.data,mode:e.BYTE,length:d(p.data)}])}}return f}function $(m,f){const w={},p={start:{}};let S=["start"];for(let T=0;T<m.length;T++){const L=m[T],Q=[];for(let ft=0;ft<L.length;ft++){const et=L[ft],ee=""+T+ft;Q.push(ee),w[ee]={node:et,lastCount:0},p[ee]={};for(let qe=0;qe<S.length;qe++){const st=S[qe];w[st]&&w[st].node.mode===et.mode?(p[st][ee]=y(w[st].lastCount+et.length,et.mode)-y(w[st].lastCount,et.mode),w[st].lastCount+=et.length):(w[st]&&(w[st].lastCount=et.length),p[st][ee]=y(et.length,et.mode)+4+e.getCharCountIndicator(et.mode,f))}}S=Q}for(let T=0;T<S.length;T++)p[S[T]].end=0;return{map:p,table:w}}function C(m,f){let w;const p=e.getBestModeForData(m);if(w=e.from(f,p),w!==e.BYTE&&w.bit<p.bit)throw new Error('"'+m+'" cannot be encoded with mode '+e.toString(w)+`.
 Suggested mode is: `+e.toString(p));switch(w===e.KANJI&&!s.isKanjiModeEnabled()&&(w=e.BYTE),w){case e.NUMERIC:return new o(m);case e.ALPHANUMERIC:return new i(m);case e.KANJI:return new r(m);case e.BYTE:return new n(m)}}t.fromArray=function(f){return f.reduce(function(w,p){return typeof p=="string"?w.push(C(p,null)):p.data&&w.push(C(p.data,p.mode)),w},[])},t.fromString=function(f,w){const p=b(f,s.isKanjiModeEnabled()),S=x(p),T=$(S,w),L=l.find_path(T.map,"start","end"),Q=[];for(let ft=1;ft<L.length-1;ft++)Q.push(T.table[L[ft]].node);return t.fromArray(g(Q))},t.rawSplit=function(f){return t.fromArray(b(f,s.isKanjiModeEnabled()))}})(xr);const Ge=K,ro=Ue,Nn=bn,jn=yn,Fn=pr,Wn=fr,ho=gr,po=Ze,Vn=vn,Oe=br,Un=$r,Zn=xt,io=xr;function Kn(t,e){const o=t.size,i=Wn.getPositions(e);for(let n=0;n<i.length;n++){const r=i[n][0],a=i[n][1];for(let s=-1;s<=7;s++)if(!(r+s<=-1||o<=r+s))for(let l=-1;l<=7;l++)a+l<=-1||o<=a+l||(s>=0&&s<=6&&(l===0||l===6)||l>=0&&l<=6&&(s===0||s===6)||s>=2&&s<=4&&l>=2&&l<=4?t.set(r+s,a+l,!0,!0):t.set(r+s,a+l,!1,!0))}}function Gn(t){const e=t.size;for(let o=8;o<e-8;o++){const i=o%2===0;t.set(o,6,i,!0),t.set(6,o,i,!0)}}function Yn(t,e){const o=Fn.getPositions(e);for(let i=0;i<o.length;i++){const n=o[i][0],r=o[i][1];for(let a=-2;a<=2;a++)for(let s=-2;s<=2;s++)a===-2||a===2||s===-2||s===2||a===0&&s===0?t.set(n+a,r+s,!0,!0):t.set(n+a,r+s,!1,!0)}}function qn(t,e){const o=t.size,i=Oe.getEncodedBits(e);let n,r,a;for(let s=0;s<18;s++)n=Math.floor(s/3),r=s%3+o-8-3,a=(i>>s&1)===1,t.set(n,r,a,!0),t.set(r,n,a,!0)}function no(t,e,o){const i=t.size,n=Un.getEncodedBits(e,o);let r,a;for(r=0;r<15;r++)a=(n>>r&1)===1,r<6?t.set(r,8,a,!0):r<8?t.set(r+1,8,a,!0):t.set(i-15+r,8,a,!0),r<8?t.set(8,i-r-1,a,!0):r<9?t.set(8,15-r-1+1,a,!0):t.set(8,15-r-1,a,!0);t.set(i-8,8,1,!0)}function Jn(t,e){const o=t.size;let i=-1,n=o-1,r=7,a=0;for(let s=o-1;s>0;s-=2)for(s===6&&s--;;){for(let l=0;l<2;l++)if(!t.isReserved(n,s-l)){let d=!1;a<e.length&&(d=(e[a]>>>r&1)===1),t.set(n,s-l,d),r--,r===-1&&(a++,r=7)}if(n+=i,n<0||o<=n){n-=i,i=-i;break}}}function Qn(t,e,o){const i=new Nn;o.forEach(function(l){i.put(l.mode.bit,4),i.put(l.getLength(),Zn.getCharCountIndicator(l.mode,t)),l.write(i)});const n=Ge.getSymbolTotalCodewords(t),r=po.getTotalCodewordsCount(t,e),a=(n-r)*8;for(i.getLengthInBits()+4<=a&&i.put(0,4);i.getLengthInBits()%8!==0;)i.putBit(0);const s=(a-i.getLengthInBits())/8;for(let l=0;l<s;l++)i.put(l%2?17:236,8);return Xn(i,t,e)}function Xn(t,e,o){const i=Ge.getSymbolTotalCodewords(e),n=po.getTotalCodewordsCount(e,o),r=i-n,a=po.getBlocksCount(e,o),s=i%a,l=a-s,d=Math.floor(i/a),u=Math.floor(r/a),b=u+1,y=d-u,g=new Vn(y);let x=0;const $=new Array(a),C=new Array(a);let m=0;const f=new Uint8Array(t.buffer);for(let L=0;L<a;L++){const Q=L<l?u:b;$[L]=f.slice(x,x+Q),C[L]=g.encode($[L]),x+=Q,m=Math.max(m,Q)}const w=new Uint8Array(i);let p=0,S,T;for(S=0;S<m;S++)for(T=0;T<a;T++)S<$[T].length&&(w[p++]=$[T][S]);for(S=0;S<y;S++)for(T=0;T<a;T++)w[p++]=C[T][S];return w}function ta(t,e,o,i){let n;if(Array.isArray(t))n=io.fromArray(t);else if(typeof t=="string"){let d=e;if(!d){const u=io.rawSplit(t);d=Oe.getBestVersionForData(u,o)}n=io.fromString(t,d||40)}else throw new Error("Invalid data");const r=Oe.getBestVersionForData(n,o);if(!r)throw new Error("The amount of data is too big to be stored in a QR Code");if(!e)e=r;else if(e<r)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+r+`.
`);const a=Qn(e,o,n),s=Ge.getSymbolSize(e),l=new jn(s);return Kn(l,e),Gn(l),Yn(l,e),no(l,o,0),e>=7&&qn(l,e),Jn(l,a),isNaN(i)&&(i=ho.getBestMask(l,no.bind(null,l,o))),ho.applyMask(i,l),no(l,o,i),{modules:l,version:e,errorCorrectionLevel:o,maskPattern:i,segments:n}}ur.create=function(e,o){if(typeof e>"u"||e==="")throw new Error("No input text");let i=ro.M,n,r;return typeof o<"u"&&(i=ro.from(o.errorCorrectionLevel,ro.M),n=Oe.from(o.version),r=ho.from(o.maskPattern),o.toSJISFunc&&Ge.setToSJISFunction(o.toSJISFunc)),ta(e,n,i,r)};var _r={},So={};(function(t){function e(o){if(typeof o=="number"&&(o=o.toString()),typeof o!="string")throw new Error("Color should be defined as hex string");let i=o.slice().replace("#","").split("");if(i.length<3||i.length===5||i.length>8)throw new Error("Invalid hex color: "+o);(i.length===3||i.length===4)&&(i=Array.prototype.concat.apply([],i.map(function(r){return[r,r]}))),i.length===6&&i.push("F","F");const n=parseInt(i.join(""),16);return{r:n>>24&255,g:n>>16&255,b:n>>8&255,a:n&255,hex:"#"+i.slice(0,6).join("")}}t.getOptions=function(i){i||(i={}),i.color||(i.color={});const n=typeof i.margin>"u"||i.margin===null||i.margin<0?4:i.margin,r=i.width&&i.width>=21?i.width:void 0,a=i.scale||4;return{width:r,scale:r?4:a,margin:n,color:{dark:e(i.color.dark||"#000000ff"),light:e(i.color.light||"#ffffffff")},type:i.type,rendererOpts:i.rendererOpts||{}}},t.getScale=function(i,n){return n.width&&n.width>=i+n.margin*2?n.width/(i+n.margin*2):n.scale},t.getImageWidth=function(i,n){const r=t.getScale(i,n);return Math.floor((i+n.margin*2)*r)},t.qrToImageData=function(i,n,r){const a=n.modules.size,s=n.modules.data,l=t.getScale(a,r),d=Math.floor((a+r.margin*2)*l),u=r.margin*l,b=[r.color.light,r.color.dark];for(let y=0;y<d;y++)for(let g=0;g<d;g++){let x=(y*d+g)*4,$=r.color.light;if(y>=u&&g>=u&&y<d-u&&g<d-u){const C=Math.floor((y-u)/l),m=Math.floor((g-u)/l);$=b[s[C*a+m]?1:0]}i[x++]=$.r,i[x++]=$.g,i[x++]=$.b,i[x]=$.a}}})(So);(function(t){const e=So;function o(n,r,a){n.clearRect(0,0,r.width,r.height),r.style||(r.style={}),r.height=a,r.width=a,r.style.height=a+"px",r.style.width=a+"px"}function i(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}t.render=function(r,a,s){let l=s,d=a;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),a||(d=i()),l=e.getOptions(l);const u=e.getImageWidth(r.modules.size,l),b=d.getContext("2d"),y=b.createImageData(u,u);return e.qrToImageData(y.data,r,l),o(b,d,u),b.putImageData(y,0,0),d},t.renderToDataURL=function(r,a,s){let l=s;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),l||(l={});const d=t.render(r,a,l),u=l.type||"image/png",b=l.rendererOpts||{};return d.toDataURL(u,b.quality)}})(_r);var Sr={};const ea=So;function qo(t,e){const o=t.a/255,i=e+'="'+t.hex+'"';return o<1?i+" "+e+'-opacity="'+o.toFixed(2).slice(1)+'"':i}function ao(t,e,o){let i=t+e;return typeof o<"u"&&(i+=" "+o),i}function oa(t,e,o){let i="",n=0,r=!1,a=0;for(let s=0;s<t.length;s++){const l=Math.floor(s%e),d=Math.floor(s/e);!l&&!r&&(r=!0),t[s]?(a++,s>0&&l>0&&t[s-1]||(i+=r?ao("M",l+o,.5+d+o):ao("m",n,0),n=0,r=!1),l+1<e&&t[s+1]||(i+=ao("h",a),a=0)):n++}return i}Sr.render=function(e,o,i){const n=ea.getOptions(o),r=e.modules.size,a=e.modules.data,s=r+n.margin*2,l=n.color.light.a?"<path "+qo(n.color.light,"fill")+' d="M0 0h'+s+"v"+s+'H0z"/>':"",d="<path "+qo(n.color.dark,"stroke")+' d="'+oa(a,r,n.margin)+'"/>',u='viewBox="0 0 '+s+" "+s+'"',y='<svg xmlns="http://www.w3.org/2000/svg" '+(n.width?'width="'+n.width+'" height="'+n.width+'" ':"")+u+' shape-rendering="crispEdges">'+l+d+`</svg>
`;return typeof i=="function"&&i(null,y),y};const ra=mn,fo=ur,kr=_r,ia=Sr;function ko(t,e,o,i,n){const r=[].slice.call(arguments,1),a=r.length,s=typeof r[a-1]=="function";if(!s&&!ra())throw new Error("Callback required as last argument");if(s){if(a<2)throw new Error("Too few arguments provided");a===2?(n=o,o=e,e=i=void 0):a===3&&(e.getContext&&typeof n>"u"?(n=i,i=void 0):(n=i,i=o,o=e,e=void 0))}else{if(a<1)throw new Error("Too few arguments provided");return a===1?(o=e,e=i=void 0):a===2&&!e.getContext&&(i=o,o=e,e=void 0),new Promise(function(l,d){try{const u=fo.create(o,i);l(t(u,e,i))}catch(u){d(u)}})}try{const l=fo.create(o,i);n(null,t(l,e,i))}catch(l){n(l)}}ve.create=fo.create;ve.toCanvas=ko.bind(null,kr.render);ve.toDataURL=ko.bind(null,kr.renderToDataURL);ve.toString=ko.bind(null,function(t,e,o){return ia.render(t,o)});const na=.1,Jo=2.5,lt=7;function so(t,e,o){return t===e?!1:(t-e<0?e-t:t-e)<=o+na}function aa(t,e){const o=Array.prototype.slice.call(ve.create(t,{errorCorrectionLevel:e}).modules.data,0),i=Math.sqrt(o.length);return o.reduce((n,r,a)=>(a%i===0?n.push([r]):n[n.length-1].push(r))&&n,[])}const sa={generate({uri:t,size:e,logoSize:o,padding:i=8,dotColor:n="var(--apkt-colors-black)"}){const a=[],s=aa(t,"Q"),l=(e-2*i)/s.length,d=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];d.forEach(({x:$,y:C})=>{const m=(s.length-lt)*l*$+i,f=(s.length-lt)*l*C+i,w=.45;for(let p=0;p<d.length;p+=1){const S=l*(lt-p*2);a.push(A`
            <rect
              fill=${p===2?"var(--apkt-colors-black)":"var(--apkt-colors-white)"}
              width=${p===0?S-10:S}
              rx= ${p===0?(S-10)*w:S*w}
              ry= ${p===0?(S-10)*w:S*w}
              stroke=${n}
              stroke-width=${p===0?10:0}
              height=${p===0?S-10:S}
              x= ${p===0?f+l*p+10/2:f+l*p}
              y= ${p===0?m+l*p+10/2:m+l*p}
            />
          `)}});const u=Math.floor((o+25)/l),b=s.length/2-u/2,y=s.length/2+u/2-1,g=[];s.forEach(($,C)=>{$.forEach((m,f)=>{if(s[C][f]&&!(C<lt&&f<lt||C>s.length-(lt+1)&&f<lt||C<lt&&f>s.length-(lt+1))&&!(C>b&&C<y&&f>b&&f<y)){const w=C*l+l/2+i,p=f*l+l/2+i;g.push([w,p])}})});const x={};return g.forEach(([$,C])=>{var m;x[$]?(m=x[$])==null||m.push(C):x[$]=[C]}),Object.entries(x).map(([$,C])=>{const m=C.filter(f=>C.every(w=>!so(f,w,l)));return[Number($),m]}).forEach(([$,C])=>{C.forEach(m=>{a.push(A`<circle cx=${$} cy=${m} fill=${n} r=${l/Jo} />`)})}),Object.entries(x).filter(([$,C])=>C.length>1).map(([$,C])=>{const m=C.filter(f=>C.some(w=>so(f,w,l)));return[Number($),m]}).map(([$,C])=>{C.sort((f,w)=>f<w?-1:1);const m=[];for(const f of C){const w=m.find(p=>p.some(S=>so(f,S,l)));w?w.push(f):m.push([f])}return[$,m.map(f=>[f[0],f[f.length-1]])]}).forEach(([$,C])=>{C.forEach(([m,f])=>{a.push(A`
              <line
                x1=${$}
                x2=${$}
                y1=${m}
                y2=${f}
                stroke=${n}
                stroke-width=${l/(Jo/2)}
                stroke-linecap="round"
              />
            `)})}),a}},la=P`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    background-color: ${({colors:t})=>t.white};
    border: 1px solid ${({tokens:t})=>t.theme.borderPrimary};
  }

  :host {
    border-radius: ${({borderRadius:t})=>t[4]};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    background-color: ${({tokens:t})=>t.theme.backgroundPrimary};
    box-shadow: inset 0 0 0 4px ${({tokens:t})=>t.theme.backgroundPrimary};
    border-radius: ${({borderRadius:t})=>t[6]};
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: #3396ff !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }

  wui-icon > svg {
    width: inherit;
    height: inherit;
  }
`;var Ct=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let rt=class extends _{constructor(){super(...arguments),this.uri="",this.size=500,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),h`<wui-flex
      alignItems="center"
      justifyContent="center"
      class="wui-qr-code"
      direction="column"
      gap="4"
      width="100%"
      style="height: 100%"
    >
      ${this.templateVisual()} ${this.templateSvg()}
    </wui-flex>`}templateSvg(){return A`
      <svg viewBox="0 0 ${this.size} ${this.size}" width="100%" height="100%">
        ${sa.generate({uri:this.uri,size:this.size,logoSize:this.arenaClear?0:this.size/4})}
      </svg>
    `}templateVisual(){return this.imageSrc?h`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?h`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:h`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};rt.styles=[E,la];Ct([c()],rt.prototype,"uri",void 0);Ct([c({type:Number})],rt.prototype,"size",void 0);Ct([c()],rt.prototype,"theme",void 0);Ct([c()],rt.prototype,"imageSrc",void 0);Ct([c()],rt.prototype,"alt",void 0);Ct([c({type:Boolean})],rt.prototype,"arenaClear",void 0);Ct([c({type:Boolean})],rt.prototype,"farcaster",void 0);rt=Ct([k("wui-qr-code")],rt);const ca=P`
  :host {
    display: block;
    background: linear-gradient(
      90deg,
      ${({tokens:t})=>t.theme.foregroundPrimary} 0%,
      ${({tokens:t})=>t.theme.foregroundSecondary} 50%,
      ${({tokens:t})=>t.theme.foregroundPrimary} 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s linear infinite;
    border-radius: ${({borderRadius:t})=>t[1]};
  }

  :host([data-rounded='true']) {
    border-radius: ${({borderRadius:t})=>t[16]};
  }

  @keyframes shimmer {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: -100% 0;
    }
  }
`;var Ce=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Ot=class extends _{constructor(){super(...arguments),this.width="",this.height="",this.variant="default",this.rounded=!1}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
    `,this.dataset.rounded=this.rounded?"true":"false",h`<slot></slot>`}};Ot.styles=[ca];Ce([c()],Ot.prototype,"width",void 0);Ce([c()],Ot.prototype,"height",void 0);Ce([c()],Ot.prototype,"variant",void 0);Ce([c({type:Boolean})],Ot.prototype,"rounded",void 0);Ot=Ce([k("wui-shimmer")],Ot);const da="https://reown.com",ua=P`
  .reown-logo {
    height: 24px;
  }

  a {
    text-decoration: none;
    cursor: pointer;
    color: ${({tokens:t})=>t.theme.textSecondary};
  }

  a:hover {
    opacity: 0.9;
  }
`;var ha=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let go=class extends _{render(){return h`
      <a
        data-testid="ux-branding-reown"
        href=${da}
        rel="noreferrer"
        target="_blank"
        style="text-decoration: none;"
      >
        <wui-flex
          justifyContent="center"
          alignItems="center"
          gap="1"
          .padding=${["01","0","3","0"]}
        >
          <wui-text variant="sm-regular" color="inherit"> UX by </wui-text>
          <wui-icon name="reown" size="inherit" class="reown-logo"></wui-icon>
        </wui-flex>
      </a>
    `}};go.styles=[E,B,ua];go=ha([k("wui-ux-by-reown")],go);/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const pa=t=>t.strings===void 0;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ae=(t,e)=>{var i;const o=t._$AN;if(o===void 0)return!1;for(const n of o)(i=n._$AO)==null||i.call(n,e,!1),ae(n,e);return!0},He=t=>{let e,o;do{if((e=t._$AM)===void 0)break;o=e._$AN,o.delete(t),t=e}while((o==null?void 0:o.size)===0)},Ar=t=>{for(let e;e=t._$AM;t=e){let o=e._$AN;if(o===void 0)e._$AN=o=new Set;else if(o.has(t))break;o.add(t),ma(e)}};function fa(t){this._$AN!==void 0?(He(this),this._$AM=t,Ar(this)):this._$AM=t}function ga(t,e=!1,o=0){const i=this._$AH,n=this._$AN;if(n!==void 0&&n.size!==0)if(e)if(Array.isArray(i))for(let r=o;r<i.length;r++)ae(i[r],!1),He(i[r]);else i!=null&&(ae(i,!1),He(i));else ae(this,t)}const ma=t=>{t.type==ar.CHILD&&(t._$AP??(t._$AP=ga),t._$AQ??(t._$AQ=fa))};class wa extends lr{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,o,i){super._$AT(e,o,i),Ar(this),this.isConnected=e._$AU}_$AO(e,o=!0){var i,n;e!==this.isConnected&&(this.isConnected=e,e?(i=this.reconnected)==null||i.call(this):(n=this.disconnected)==null||n.call(this)),o&&(ae(this,e),He(this))}setValue(e){if(pa(this._$Ct))this._$Ct._$AI(e,this);else{const o=[...this._$Ct._$AH];o[this._$Ci]=e,this._$Ct._$AI(o,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ao=()=>new ba;class ba{}const lo=new WeakMap,Eo=sr(class extends wa{render(t){return R}update(t,[e]){var i;const o=e!==this.G;return o&&this.rt(void 0),(o||this.lt!==this.ct)&&(this.G=e,this.ht=(i=t.options)==null?void 0:i.host,this.rt(this.ct=t.element)),R}rt(t){if(this.G!==void 0)if(this.isConnected||(t=void 0),typeof this.G=="function"){const e=this.ht??globalThis;let o=lo.get(e);o===void 0&&(o=new WeakMap,lo.set(e,o)),o.get(this.G)!==void 0&&this.G.call(this.ht,void 0),o.set(this.G,t),t!==void 0&&this.G.call(this.ht,t)}else this.G.value=t}get lt(){var t,e;return typeof this.G=="function"?(t=lo.get(this.ht??globalThis))==null?void 0:t.get(this.G):(e=this.G)==null?void 0:e.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),ya=P`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    user-select: none;
    transition:
      background-color ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      color ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      border ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      box-shadow ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      width ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      height ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      transform ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      opacity ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({colors:t})=>t.neutrals300};
    border-radius: ${({borderRadius:t})=>t.round};
    border: 1px solid transparent;
    will-change: border;
    transition:
      background-color ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      color ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      border ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      box-shadow ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      width ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      height ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]},
      transform ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      opacity ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  span:before {
    content: '';
    position: absolute;
    background-color: ${({colors:t})=>t.white};
    border-radius: 50%;
  }

  /* -- Sizes --------------------------------------------------------- */
  label[data-size='lg'] {
    width: 48px;
    height: 32px;
  }

  label[data-size='md'] {
    width: 40px;
    height: 28px;
  }

  label[data-size='sm'] {
    width: 32px;
    height: 22px;
  }

  label[data-size='lg'] > span:before {
    height: 24px;
    width: 24px;
    left: 4px;
    top: 3px;
  }

  label[data-size='md'] > span:before {
    height: 20px;
    width: 20px;
    left: 4px;
    top: 3px;
  }

  label[data-size='sm'] > span:before {
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
  }

  /* -- Focus states --------------------------------------------------- */
  input:focus-visible:not(:checked) + span,
  input:focus:not(:checked) + span {
    border: 1px solid ${({tokens:t})=>t.core.iconAccentPrimary};
    background-color: ${({tokens:t})=>t.theme.textTertiary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  input:focus-visible:checked + span,
  input:focus:checked + span {
    border: 1px solid ${({tokens:t})=>t.core.iconAccentPrimary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  /* -- Checked states --------------------------------------------------- */
  input:checked + span {
    background-color: ${({tokens:t})=>t.core.iconAccentPrimary};
  }

  label[data-size='lg'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='md'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='sm'] > input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }

  /* -- Hover states ------------------------------------------------------- */
  label:hover > input:not(:checked):not(:disabled) + span {
    background-color: ${({colors:t})=>t.neutrals400};
  }

  label:hover > input:checked:not(:disabled) + span {
    background-color: ${({colors:t})=>t.accent080};
  }

  /* -- Disabled state --------------------------------------------------- */
  label:has(input:disabled) {
    pointer-events: none;
    user-select: none;
  }

  input:not(:checked):disabled + span {
    background-color: ${({colors:t})=>t.neutrals700};
  }

  input:checked:disabled + span {
    background-color: ${({colors:t})=>t.neutrals700};
  }

  input:not(:checked):disabled + span::before {
    background-color: ${({colors:t})=>t.neutrals400};
  }

  input:checked:disabled + span::before {
    background-color: ${({tokens:t})=>t.theme.textTertiary};
  }
`;var Ye=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let qt=class extends _{constructor(){super(...arguments),this.inputElementRef=Ao(),this.checked=!1,this.disabled=!1,this.size="md"}render(){return h`
      <label data-size=${this.size}>
        <input
          ${Eo(this.inputElementRef)}
          type="checkbox"
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){var e;this.dispatchEvent(new CustomEvent("switchChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.checked,bubbles:!0,composed:!0}))}};qt.styles=[E,B,ya];Ye([c({type:Boolean})],qt.prototype,"checked",void 0);Ye([c({type:Boolean})],qt.prototype,"disabled",void 0);Ye([c()],qt.prototype,"size",void 0);qt=Ye([k("wui-toggle")],qt);const $a=P`
  :host {
    height: auto;
  }

  :host > wui-flex {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: ${({spacing:t})=>t[2]};
    padding: ${({spacing:t})=>t[2]} ${({spacing:t})=>t[3]};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[4]};
    box-shadow: inset 0 0 0 1px ${({tokens:t})=>t.theme.foregroundPrimary};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var Er=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let De=class extends _{constructor(){super(...arguments),this.checked=!1}render(){return h`
      <wui-flex>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-toggle
          ?checked=${this.checked}
          size="sm"
          @switchChange=${this.handleToggleChange.bind(this)}
        ></wui-toggle>
      </wui-flex>
    `}handleToggleChange(e){e.stopPropagation(),this.checked=e.detail,this.dispatchSwitchEvent()}dispatchSwitchEvent(){this.dispatchEvent(new CustomEvent("certifiedSwitchChange",{detail:this.checked,bubbles:!0,composed:!0}))}};De.styles=[E,B,$a];Er([c({type:Boolean})],De.prototype,"checked",void 0);De=Er([k("wui-certified-switch")],De);const va=P`
  :host {
    position: relative;
    width: 100%;
    display: inline-flex;
    flex-direction: column;
    gap: ${({spacing:t})=>t[3]};
    color: ${({tokens:t})=>t.theme.textPrimary};
    caret-color: ${({tokens:t})=>t.core.textAccentPrimary};
  }

  .wui-input-text-container {
    position: relative;
    display: flex;
  }

  input {
    width: 100%;
    border-radius: ${({borderRadius:t})=>t[4]};
    color: inherit;
    background: transparent;
    border: 1px solid ${({tokens:t})=>t.theme.borderPrimary};
    caret-color: ${({tokens:t})=>t.core.textAccentPrimary};
    padding: ${({spacing:t})=>t[3]} ${({spacing:t})=>t[3]}
      ${({spacing:t})=>t[3]} ${({spacing:t})=>t[10]};
    font-size: ${({textSize:t})=>t.large};
    line-height: ${({typography:t})=>t["lg-regular"].lineHeight};
    letter-spacing: ${({typography:t})=>t["lg-regular"].letterSpacing};
    font-weight: ${({fontWeight:t})=>t.regular};
    font-family: ${({fontFamily:t})=>t.regular};
  }

  input[data-size='lg'] {
    padding: ${({spacing:t})=>t[4]} ${({spacing:t})=>t[3]}
      ${({spacing:t})=>t[4]} ${({spacing:t})=>t[10]};
  }

  @media (hover: hover) and (pointer: fine) {
    input:hover:enabled {
      border: 1px solid ${({tokens:t})=>t.theme.borderSecondary};
    }
  }

  input:disabled {
    cursor: unset;
    border: 1px solid ${({tokens:t})=>t.theme.borderPrimary};
  }

  input::placeholder {
    color: ${({tokens:t})=>t.theme.textSecondary};
  }

  input:focus:enabled {
    border: 1px solid ${({tokens:t})=>t.theme.borderSecondary};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    -webkit-box-shadow: 0px 0px 0px 4px ${({tokens:t})=>t.core.foregroundAccent040};
    -moz-box-shadow: 0px 0px 0px 4px ${({tokens:t})=>t.core.foregroundAccent040};
    box-shadow: 0px 0px 0px 4px ${({tokens:t})=>t.core.foregroundAccent040};
  }

  div.wui-input-text-container:has(input:disabled) {
    opacity: 0.5;
  }

  wui-icon.wui-input-text-left-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    left: ${({spacing:t})=>t[4]};
    color: ${({tokens:t})=>t.theme.iconDefault};
  }

  button.wui-input-text-submit-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:t})=>t[3]};
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: ${({borderRadius:t})=>t[2]};
    color: ${({tokens:t})=>t.core.textAccentPrimary};
  }

  button.wui-input-text-submit-button:disabled {
    opacity: 1;
  }

  button.wui-input-text-submit-button.loading wui-icon {
    animation: spin 1s linear infinite;
  }

  button.wui-input-text-submit-button:hover {
    background: ${({tokens:t})=>t.core.foregroundAccent010};
  }

  input:has(+ .wui-input-text-submit-button) {
    padding-right: ${({spacing:t})=>t[12]};
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  input[type='search']::-webkit-search-decoration,
  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-results-button,
  input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  /* -- Keyframes --------------------------------------------------- */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;var q=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let D=class extends _{constructor(){super(...arguments),this.inputElementRef=Ao(),this.disabled=!1,this.loading=!1,this.placeholder="",this.type="text",this.value="",this.size="md"}render(){return h` <div class="wui-input-text-container">
        ${this.templateLeftIcon()}
        <input
          data-size=${this.size}
          ${Eo(this.inputElementRef)}
          data-testid="wui-input-text"
          type=${this.type}
          enterkeyhint=${U(this.enterKeyHint)}
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          @input=${this.dispatchInputChangeEvent.bind(this)}
          @keydown=${this.onKeyDown}
          .value=${this.value||""}
        />
        ${this.templateSubmitButton()}
        <slot class="wui-input-text-slot"></slot>
      </div>
      ${this.templateError()} ${this.templateWarning()}`}templateLeftIcon(){return this.icon?h`<wui-icon
        class="wui-input-text-left-icon"
        size="md"
        data-size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}templateSubmitButton(){var e;return this.onSubmit?h`<button
        class="wui-input-text-submit-button ${this.loading?"loading":""}"
        @click=${(e=this.onSubmit)==null?void 0:e.bind(this)}
        ?disabled=${this.disabled||this.loading}
      >
        ${this.loading?h`<wui-icon name="spinner" size="md"></wui-icon>`:h`<wui-icon name="chevronRight" size="md"></wui-icon>`}
      </button>`:null}templateError(){return this.errorText?h`<wui-text variant="sm-regular" color="error">${this.errorText}</wui-text>`:null}templateWarning(){return this.warningText?h`<wui-text variant="sm-regular" color="warning">${this.warningText}</wui-text>`:null}dispatchInputChangeEvent(){var e;this.dispatchEvent(new CustomEvent("inputChange",{detail:(e=this.inputElementRef.value)==null?void 0:e.value,bubbles:!0,composed:!0}))}};D.styles=[E,B,va];q([c()],D.prototype,"icon",void 0);q([c({type:Boolean})],D.prototype,"disabled",void 0);q([c({type:Boolean})],D.prototype,"loading",void 0);q([c()],D.prototype,"placeholder",void 0);q([c()],D.prototype,"type",void 0);q([c()],D.prototype,"value",void 0);q([c()],D.prototype,"errorText",void 0);q([c()],D.prototype,"warningText",void 0);q([c()],D.prototype,"onSubmit",void 0);q([c()],D.prototype,"size",void 0);q([c({attribute:!1})],D.prototype,"onKeyDown",void 0);D=q([k("wui-input-text")],D);const xa=P`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:t})=>t[3]};
    color: ${({tokens:t})=>t.theme.iconDefault};
    cursor: pointer;
    padding: ${({spacing:t})=>t[2]};
    background-color: transparent;
    border-radius: ${({borderRadius:t})=>t[4]};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
  }

  @media (hover: hover) {
    wui-icon:hover {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    }
  }
`;var Pr=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Ne=class extends _{constructor(){super(...arguments),this.inputComponentRef=Ao(),this.inputValue=""}render(){return h`
      <wui-input-text
        ${Eo(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
        @inputChange=${this.onInputChange}
      >
        ${this.inputValue?h`<wui-icon
              @click=${this.clearValue}
              color="inherit"
              size="sm"
              name="close"
            ></wui-icon>`:null}
      </wui-input-text>
    `}onInputChange(e){this.inputValue=e.detail||""}clearValue(){const e=this.inputComponentRef.value,o=e==null?void 0:e.inputElementRef.value;o&&(o.value="",this.inputValue="",o.focus(),o.dispatchEvent(new Event("input")))}};Ne.styles=[E,xa];Pr([c()],Ne.prototype,"inputValue",void 0);Ne=Pr([k("wui-search-bar")],Ne);const zr=A`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,Ca=P`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 104px;
    width: 104px;
    row-gap: ${({spacing:t})=>t[2]};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: ${({borderRadius:t})=>t[5]};
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--apkt-path-network);
    clip-path: var(--apkt-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: ${({tokens:t})=>t.theme.foregroundSecondary};
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var Tr=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let je=class extends _{constructor(){super(...arguments),this.type="wallet"}render(){return h`
      ${this.shimmerTemplate()}
      <wui-shimmer width="80px" height="20px"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?h` <wui-shimmer data-type=${this.type} width="48px" height="54px"></wui-shimmer>
        ${zr}`:h`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}};je.styles=[E,B,Ca];Tr([c()],je.prototype,"type",void 0);je=Tr([k("wui-card-select-loader")],je);const _a=G`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var J=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let N=class extends _{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};
      padding-top: ${this.padding&&I.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&I.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&I.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&I.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&I.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&I.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&I.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&I.getSpacingStyles(this.margin,3)};
    `,h`<slot></slot>`}};N.styles=[E,_a];J([c()],N.prototype,"gridTemplateRows",void 0);J([c()],N.prototype,"gridTemplateColumns",void 0);J([c()],N.prototype,"justifyItems",void 0);J([c()],N.prototype,"alignItems",void 0);J([c()],N.prototype,"justifyContent",void 0);J([c()],N.prototype,"alignContent",void 0);J([c()],N.prototype,"columnGap",void 0);J([c()],N.prototype,"rowGap",void 0);J([c()],N.prototype,"gap",void 0);J([c()],N.prototype,"padding",void 0);J([c()],N.prototype,"margin",void 0);N=J([k("wui-grid")],N);const Sa=P`
  :host {
    width: 100%;
  }

  :host([data-type='primary']) > button {
    background-color: ${({tokens:t})=>t.theme.backgroundPrimary};
  }

  :host([data-type='secondary']) > button {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:t})=>t[3]};
    width: 100%;
    border-radius: ${({borderRadius:t})=>t[4]};
    transition:
      background-color ${({durations:t})=>t.lg}
        ${({easings:t})=>t["ease-out-power-2"]},
      scale ${({durations:t})=>t.lg} ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color, scale;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-image {
    color: ${({tokens:t})=>t.theme.textPrimary};
  }

  @media (hover: hover) {
    :host([data-type='primary']) > button:hover:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    }

    :host([data-type='secondary']) > button:hover:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var W=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let H=class extends _{constructor(){super(...arguments),this.type="primary",this.imageSrc="google",this.imageSize=void 0,this.loading=!1,this.boxColor="foregroundPrimary",this.disabled=!1,this.rightIcon=!0,this.boxed=!0,this.rounded=!1,this.fullSize=!1}render(){return this.dataset.rounded=this.rounded?"true":"false",this.dataset.type=this.type,h`
      <button
        ?disabled=${this.loading?!0:!!this.disabled}
        data-loading=${this.loading}
        tabindex=${U(this.tabIdx)}
      >
        <wui-flex gap="2" alignItems="center">
          ${this.templateLeftIcon()}
          <wui-flex gap="1">
            <slot></slot>
          </wui-flex>
        </wui-flex>
        ${this.templateRightIcon()}
      </button>
    `}templateLeftIcon(){return this.icon?h`<wui-image
        icon=${this.icon}
        iconColor=${U(this.iconColor)}
        ?boxed=${this.boxed}
        ?rounded=${this.rounded}
        boxColor=${this.boxColor}
      ></wui-image>`:h`<wui-image
      ?boxed=${this.boxed}
      ?rounded=${this.rounded}
      ?fullSize=${this.fullSize}
      size=${U(this.imageSize)}
      src=${this.imageSrc}
      boxColor=${this.boxColor}
    ></wui-image>`}templateRightIcon(){return this.rightIcon?this.loading?h`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:h`<wui-icon name="chevronRight" size="lg" color="default"></wui-icon>`:null}};H.styles=[E,B,Sa];W([c()],H.prototype,"type",void 0);W([c()],H.prototype,"imageSrc",void 0);W([c()],H.prototype,"imageSize",void 0);W([c()],H.prototype,"icon",void 0);W([c()],H.prototype,"iconColor",void 0);W([c({type:Boolean})],H.prototype,"loading",void 0);W([c()],H.prototype,"tabIdx",void 0);W([c()],H.prototype,"boxColor",void 0);W([c({type:Boolean})],H.prototype,"disabled",void 0);W([c({type:Boolean})],H.prototype,"rightIcon",void 0);W([c({type:Boolean})],H.prototype,"boxed",void 0);W([c({type:Boolean})],H.prototype,"rounded",void 0);W([c({type:Boolean})],H.prototype,"fullSize",void 0);H=W([k("wui-list-item")],H);const ka=P`
  :host {
    display: block;
    border-radius: clamp(0px, ${({borderRadius:t})=>t[8]}, 44px);
    box-shadow: 0 0 0 1px ${({tokens:t})=>t.theme.foregroundPrimary};
    overflow: hidden;
  }
`;var Aa=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let mo=class extends _{render(){return h`<slot></slot>`}};mo.styles=[E,ka];mo=Aa([k("wui-card")],mo);const Ea=P`
  :host {
    width: 100%;
  }

  :host > wui-flex {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({spacing:t})=>t[2]};
    padding: ${({spacing:t})=>t[3]};
    border-radius: ${({borderRadius:t})=>t[6]};
    border: 1px solid ${({tokens:t})=>t.theme.borderPrimary};
    box-sizing: border-box;
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.25);
    color: ${({tokens:t})=>t.theme.textPrimary};
  }

  :host > wui-flex[data-type='info'] {
    .icon-box {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};

      wui-icon {
        color: ${({tokens:t})=>t.theme.iconDefault};
      }
    }
  }
  :host > wui-flex[data-type='success'] {
    .icon-box {
      background-color: ${({tokens:t})=>t.core.backgroundSuccess};

      wui-icon {
        color: ${({tokens:t})=>t.core.borderSuccess};
      }
    }
  }
  :host > wui-flex[data-type='warning'] {
    .icon-box {
      background-color: ${({tokens:t})=>t.core.backgroundWarning};

      wui-icon {
        color: ${({tokens:t})=>t.core.borderWarning};
      }
    }
  }
  :host > wui-flex[data-type='error'] {
    .icon-box {
      background-color: ${({tokens:t})=>t.core.backgroundError};

      wui-icon {
        color: ${({tokens:t})=>t.core.borderError};
      }
    }
  }

  wui-flex {
    width: 100%;
  }

  wui-text {
    word-break: break-word;
    flex: 1;
  }

  .close {
    cursor: pointer;
    color: ${({tokens:t})=>t.theme.iconDefault};
  }

  .icon-box {
    height: 40px;
    width: 40px;
    border-radius: ${({borderRadius:t})=>t[2]};
    background-color: var(--local-icon-bg-value);
  }
`;var Po=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const Pa={info:"info",success:"checkmark",warning:"warningCircle",error:"warning"};let he=class extends _{constructor(){super(...arguments),this.message="",this.type="info"}render(){return h`
      <wui-flex
        data-type=${U(this.type)}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap="2"
      >
        <wui-flex columnGap="2" flexDirection="row" alignItems="center">
          <wui-flex
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            class="icon-box"
          >
            <wui-icon color="inherit" size="md" name=${Pa[this.type]}></wui-icon>
          </wui-flex>
          <wui-text variant="md-medium" color="inherit" data-testid="wui-alertbar-text"
            >${this.message}</wui-text
          >
        </wui-flex>
        <wui-icon
          class="close"
          color="inherit"
          size="sm"
          name="close"
          @click=${this.onClose}
        ></wui-icon>
      </wui-flex>
    `}onClose(){Rr.close()}};he.styles=[E,Ea];Po([c()],he.prototype,"message",void 0);Po([c()],he.prototype,"type",void 0);he=Po([k("wui-alertbar")],he);const za=P`
  :host {
    position: relative;
  }

  button {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    padding: ${({spacing:t})=>t[1]};
  }

  /* -- Colors --------------------------------------------------- */
  button[data-type='accent'] wui-icon {
    color: ${({tokens:t})=>t.core.iconAccentPrimary};
  }

  button[data-type='neutral'][data-variant='primary'] wui-icon {
    color: ${({tokens:t})=>t.theme.iconInverse};
  }

  button[data-type='neutral'][data-variant='secondary'] wui-icon {
    color: ${({tokens:t})=>t.theme.iconDefault};
  }

  button[data-type='success'] wui-icon {
    color: ${({tokens:t})=>t.core.iconSuccess};
  }

  button[data-type='error'] wui-icon {
    color: ${({tokens:t})=>t.core.iconError};
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='xs'] {
    width: 16px;
    height: 16px;

    border-radius: ${({borderRadius:t})=>t[1]};
  }

  button[data-size='sm'] {
    width: 20px;
    height: 20px;
    border-radius: ${({borderRadius:t})=>t[1]};
  }

  button[data-size='md'] {
    width: 24px;
    height: 24px;
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  button[data-size='lg'] {
    width: 28px;
    height: 28px;
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  button[data-size='xs'] wui-icon {
    width: 8px;
    height: 8px;
  }

  button[data-size='sm'] wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='md'] wui-icon {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] wui-icon {
    width: 20px;
    height: 20px;
  }

  /* -- Hover --------------------------------------------------- */
  @media (hover: hover) {
    button[data-type='accent']:hover:enabled {
      background-color: ${({tokens:t})=>t.core.foregroundAccent010};
    }

    button[data-variant='primary'][data-type='neutral']:hover:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    }

    button[data-variant='secondary'][data-type='neutral']:hover:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    }

    button[data-type='success']:hover:enabled {
      background-color: ${({tokens:t})=>t.core.backgroundSuccess};
    }

    button[data-type='error']:hover:enabled {
      background-color: ${({tokens:t})=>t.core.backgroundError};
    }
  }

  /* -- Focus --------------------------------------------------- */
  button:focus-visible {
    box-shadow: 0 0 0 4px ${({tokens:t})=>t.core.foregroundAccent020};
  }

  /* -- Properties --------------------------------------------------- */
  button[data-full-width='true'] {
    width: 100%;
  }

  :host([fullWidth]) {
    width: 100%;
  }

  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var _t=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let it=class extends _{constructor(){super(...arguments),this.icon="card",this.variant="primary",this.type="accent",this.size="md",this.iconSize=void 0,this.fullWidth=!1,this.disabled=!1}render(){return h`<button
      data-variant=${this.variant}
      data-type=${this.type}
      data-size=${this.size}
      data-full-width=${this.fullWidth}
      ?disabled=${this.disabled}
    >
      <wui-icon color="inherit" name=${this.icon} size=${U(this.iconSize)}></wui-icon>
    </button>`}};it.styles=[E,B,za];_t([c()],it.prototype,"icon",void 0);_t([c()],it.prototype,"variant",void 0);_t([c()],it.prototype,"type",void 0);_t([c()],it.prototype,"size",void 0);_t([c()],it.prototype,"iconSize",void 0);_t([c({type:Boolean})],it.prototype,"fullWidth",void 0);_t([c({type:Boolean})],it.prototype,"disabled",void 0);it=_t([k("wui-icon-button")],it);const Ta=P`
  button {
    display: block;
    display: flex;
    align-items: center;
    padding: ${({spacing:t})=>t[1]};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
    border-radius: ${({borderRadius:t})=>t[32]};
  }

  wui-image {
    border-radius: 100%;
  }

  wui-text {
    padding-left: ${({spacing:t})=>t[1]};
  }

  .left-icon-container,
  .right-icon-container {
    width: 24px;
    height: 24px;
    justify-content: center;
    align-items: center;
  }

  wui-icon {
    color: ${({tokens:t})=>t.theme.iconDefault};
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='lg'] {
    height: 32px;
  }

  button[data-size='md'] {
    height: 28px;
  }

  button[data-size='sm'] {
    height: 24px;
  }

  button[data-size='lg'] wui-image {
    width: 24px;
    height: 24px;
  }

  button[data-size='md'] wui-image {
    width: 20px;
    height: 20px;
  }

  button[data-size='sm'] wui-image {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] .left-icon-container {
    width: 24px;
    height: 24px;
  }

  button[data-size='md'] .left-icon-container {
    width: 20px;
    height: 20px;
  }

  button[data-size='sm'] .left-icon-container {
    width: 16px;
    height: 16px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-type='filled-dropdown'] {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  button[data-type='text-dropdown'] {
    background-color: transparent;
  }

  /* -- Focus states --------------------------------------------------- */
  button:focus-visible:enabled {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    box-shadow: 0 0 0 4px ${({tokens:t})=>t.core.foregroundAccent040};
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled,
    button:active:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    }
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    opacity: 0.5;
  }
`;var Qt=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const Ra={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},La={lg:"lg",md:"md",sm:"sm"};let yt=class extends _{constructor(){super(...arguments),this.imageSrc="",this.text="",this.size="lg",this.type="text-dropdown",this.disabled=!1}render(){return h`<button ?disabled=${this.disabled} data-size=${this.size} data-type=${this.type}>
      ${this.imageTemplate()} ${this.textTemplate()}
      <wui-flex class="right-icon-container">
        <wui-icon name="chevronBottom"></wui-icon>
      </wui-flex>
    </button>`}textTemplate(){const e=Ra[this.size];return this.text?h`<wui-text color="primary" variant=${e}>${this.text}</wui-text>`:null}imageTemplate(){if(this.imageSrc)return h`<wui-image src=${this.imageSrc} alt="select visual"></wui-image>`;const e=La[this.size];return h` <wui-flex class="left-icon-container">
      <wui-icon size=${e} name="networkPlaceholder"></wui-icon>
    </wui-flex>`}};yt.styles=[E,B,Ta];Qt([c()],yt.prototype,"imageSrc",void 0);Qt([c()],yt.prototype,"text",void 0);Qt([c()],yt.prototype,"size",void 0);Qt([c()],yt.prototype,"type",void 0);Qt([c({type:Boolean})],yt.prototype,"disabled",void 0);yt=Qt([k("wui-select")],yt);const Ia=P`
  button {
    background-color: transparent;
    padding: ${({spacing:t})=>t[1]};
  }

  button:focus-visible {
    box-shadow: 0 0 0 4px ${({tokens:t})=>t.core.foregroundAccent020};
  }

  button[data-variant='accent']:hover:enabled,
  button[data-variant='accent']:focus-visible {
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
  }

  button[data-variant='primary']:hover:enabled,
  button[data-variant='primary']:focus-visible,
  button[data-variant='secondary']:hover:enabled,
  button[data-variant='secondary']:focus-visible {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  button[data-size='xs'] > wui-icon {
    width: 8px;
    height: 8px;
  }

  button[data-size='sm'] > wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='xs'],
  button[data-size='sm'] {
    border-radius: ${({borderRadius:t})=>t[1]};
  }

  button[data-size='md'],
  button[data-size='lg'] {
    border-radius: ${({borderRadius:t})=>t[2]};
  }

  button[data-size='md'] > wui-icon {
    width: 16px;
    height: 16px;
  }

  button[data-size='lg'] > wui-icon {
    width: 20px;
    height: 20px;
  }

  button:disabled {
    background-color: transparent;
    cursor: not-allowed;
    opacity: 0.5;
  }

  button:hover:not(:disabled) {
    background-color: var(--wui-color-accent-glass-015);
  }

  button:focus-visible:not(:disabled) {
    background-color: var(--wui-color-accent-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
`;var Xt=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let $t=class extends _{constructor(){super(...arguments),this.size="md",this.disabled=!1,this.icon="copy",this.iconColor="default",this.variant="accent"}render(){const e={accent:"accent-primary",primary:"inverse",secondary:"default"};return h`
      <button data-variant=${this.variant} ?disabled=${this.disabled} data-size=${this.size}>
        <wui-icon
          color=${e[this.variant]||this.iconColor}
          size=${this.size}
          name=${this.icon}
        ></wui-icon>
      </button>
    `}};$t.styles=[E,B,Ia];Xt([c()],$t.prototype,"size",void 0);Xt([c({type:Boolean})],$t.prototype,"disabled",void 0);Xt([c()],$t.prototype,"icon",void 0);Xt([c()],$t.prototype,"iconColor",void 0);Xt([c()],$t.prototype,"variant",void 0);$t=Xt([k("wui-icon-link")],$t);const Ba=A`<svg width="86" height="96" fill="none">
  <path
    d="M78.3244 18.926L50.1808 2.45078C45.7376 -0.150261 40.2624 -0.150262 35.8192 2.45078L7.6756 18.926C3.23322 21.5266 0.5 26.3301 0.5 31.5248V64.4752C0.5 69.6699 3.23322 74.4734 7.6756 77.074L35.8192 93.5492C40.2624 96.1503 45.7376 96.1503 50.1808 93.5492L78.3244 77.074C82.7668 74.4734 85.5 69.6699 85.5 64.4752V31.5248C85.5 26.3301 82.7668 21.5266 78.3244 18.926Z"
  />
</svg>`,Ma=A`
  <svg fill="none" viewBox="0 0 36 40">
    <path
      d="M15.4 2.1a5.21 5.21 0 0 1 5.2 0l11.61 6.7a5.21 5.21 0 0 1 2.61 4.52v13.4c0 1.87-1 3.59-2.6 4.52l-11.61 6.7c-1.62.93-3.6.93-5.22 0l-11.6-6.7a5.21 5.21 0 0 1-2.61-4.51v-13.4c0-1.87 1-3.6 2.6-4.52L15.4 2.1Z"
    />
  </svg>
`,Oa=P`
  :host {
    position: relative;
    border-radius: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--local-width);
    height: var(--local-height);
  }

  :host([data-round='true']) {
    background: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: 100%;
    outline: 1px solid ${({tokens:t})=>t.core.glass010};
  }

  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  svg > path {
    stroke: var(--local-stroke);
  }

  wui-image {
    width: 100%;
    height: 100%;
    -webkit-clip-path: var(--local-path);
    clip-path: var(--local-path);
    background: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  wui-icon {
    transform: translateY(-5%);
    width: var(--local-icon-size);
    height: var(--local-icon-size);
  }
`;var Nt=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let pt=class extends _{constructor(){super(...arguments),this.size="md",this.name="uknown",this.networkImagesBySize={sm:Ma,md:zr,lg:Ba},this.selected=!1,this.round=!1}render(){const e={sm:"4",md:"6",lg:"10"};return this.round?(this.dataset.round="true",this.style.cssText=`
      --local-width: var(--apkt-spacing-10);
      --local-height: var(--apkt-spacing-10);
      --local-icon-size: var(--apkt-spacing-4);
    `):this.style.cssText=`

      --local-path: var(--apkt-path-network-${this.size});
      --local-width:  var(--apkt-width-network-${this.size});
      --local-height:  var(--apkt-height-network-${this.size});
      --local-icon-size:  var(--apkt-spacing-${e[this.size]});
    `,h`${this.templateVisual()} ${this.svgTemplate()} `}svgTemplate(){return this.round?null:this.networkImagesBySize[this.size]}templateVisual(){return this.imageSrc?h`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:h`<wui-icon size="inherit" color="default" name="networkPlaceholder"></wui-icon>`}};pt.styles=[E,Oa];Nt([c()],pt.prototype,"size",void 0);Nt([c()],pt.prototype,"name",void 0);Nt([c({type:Object})],pt.prototype,"networkImagesBySize",void 0);Nt([c()],pt.prototype,"imageSrc",void 0);Nt([c({type:Boolean})],pt.prototype,"selected",void 0);Nt([c({type:Boolean})],pt.prototype,"round",void 0);pt=Nt([k("wui-network-image")],pt);const Ha=P`
  :host {
    position: relative;
    display: flex;
    width: 100%;
    height: 1px;
    background-color: ${({tokens:t})=>t.theme.borderPrimary};
    justify-content: center;
    align-items: center;
  }

  :host > wui-text {
    position: absolute;
    padding: 0px 8px;
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
  }

  :host([data-bg-color='primary']) > wui-text {
    background-color: ${({tokens:t})=>t.theme.backgroundPrimary};
  }

  :host([data-bg-color='secondary']) > wui-text {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }
`;var zo=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let pe=class extends _{constructor(){super(...arguments),this.text="",this.bgColor="primary"}render(){return this.dataset.bgColor=this.bgColor,h`${this.template()}`}template(){return this.text?h`<wui-text variant="md-regular" color="secondary">${this.text}</wui-text>`:null}};pe.styles=[E,Ha];zo([c()],pe.prototype,"text",void 0);zo([c()],pe.prototype,"bgColor",void 0);pe=zo([k("wui-separator")],pe);const Da=P`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-container {
    position: relative;
    width: var(--pulse-size);
    height: var(--pulse-size);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-rings {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .pulse-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid var(--pulse-color);
    opacity: 0;
    animation: pulse var(--pulse-duration, 2s) ease-out infinite;
  }

  .pulse-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.5);
      opacity: var(--pulse-opacity, 0.3);
    }
    50% {
      opacity: calc(var(--pulse-opacity, 0.3) * 0.5);
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }
`;var te=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};const Na=3,ja=2,Fa=.3,Wa="200px",Va={"accent-primary":z.tokens.core.backgroundAccentPrimary};let vt=class extends _{constructor(){super(...arguments),this.rings=Na,this.duration=ja,this.opacity=Fa,this.size=Wa,this.variant="accent-primary"}render(){const e=Va[this.variant];this.style.cssText=`
      --pulse-size: ${this.size};
      --pulse-duration: ${this.duration}s;
      --pulse-color: ${e};
      --pulse-opacity: ${this.opacity};
    `;const o=Array.from({length:this.rings},(i,n)=>this.renderRing(n,this.rings));return h`
      <div class="pulse-container">
        <div class="pulse-rings">${o}</div>
        <div class="pulse-content">
          <slot></slot>
        </div>
      </div>
    `}renderRing(e,o){const n=`animation-delay: ${e/o*this.duration}s;`;return h`<div class="pulse-ring" style=${n}></div>`}};vt.styles=[E,Da];te([c({type:Number})],vt.prototype,"rings",void 0);te([c({type:Number})],vt.prototype,"duration",void 0);te([c({type:Number})],vt.prototype,"opacity",void 0);te([c()],vt.prototype,"size",void 0);te([c()],vt.prototype,"variant",void 0);vt=te([k("wui-pulse")],vt);const Ua=P`
  button {
    display: flex;
    align-items: center;
    height: 40px;
    padding: ${({spacing:t})=>t[2]};
    border-radius: ${({borderRadius:t})=>t[4]};
    column-gap: ${({spacing:t})=>t[1]};
    background-color: transparent;
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-2"]};
    will-change: background-color;
  }

  wui-image,
  .icon-box {
    width: ${({spacing:t})=>t[6]};
    height: ${({spacing:t})=>t[6]};
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  wui-text {
    flex: 1;
  }

  .icon-box {
    position: relative;
  }

  .icon-box[data-active='true'] {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  .circle {
    position: absolute;
    left: 16px;
    top: 15px;
    width: 8px;
    height: 8px;
    background-color: ${({tokens:t})=>t.core.textSuccess};
    box-shadow: 0 0 0 2px ${({tokens:t})=>t.theme.foregroundPrimary};
    border-radius: 50%;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button:hover:enabled,
    button:active:enabled {
      background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    }
  }
`;var tt=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let Z=class extends _{constructor(){super(...arguments),this.address="",this.profileName="",this.alt="",this.imageSrc="",this.icon=void 0,this.iconSize="md",this.enableGreenCircle=!0,this.loading=!1,this.charsStart=4,this.charsEnd=6}render(){return h`
      <button>
        ${this.leftImageTemplate()} ${this.textTemplate()} ${this.rightImageTemplate()}
      </button>
    `}leftImageTemplate(){const e=this.icon?h`<wui-icon
          size=${U(this.iconSize)}
          color="default"
          name=${this.icon}
          class="icon"
        ></wui-icon>`:h`<wui-image src=${this.imageSrc} alt=${this.alt}></wui-image>`;return h`
      <wui-flex
        alignItems="center"
        justifyContent="center"
        class="icon-box"
        data-active=${!!this.icon}
      >
        ${e}
        ${this.enableGreenCircle?h`<wui-flex class="circle"></wui-flex>`:null}
      </wui-flex>
    `}textTemplate(){return h`
      <wui-text variant="lg-regular" color="primary">
        ${I.getTruncateString({string:this.profileName||this.address,charsStart:this.profileName?16:this.charsStart,charsEnd:this.profileName?0:this.charsEnd,truncate:this.profileName?"end":"middle"})}
      </wui-text>
    `}rightImageTemplate(){return h`<wui-icon name="chevronBottom" size="sm" color="default"></wui-icon>`}};Z.styles=[E,B,Ua];tt([c()],Z.prototype,"address",void 0);tt([c()],Z.prototype,"profileName",void 0);tt([c()],Z.prototype,"alt",void 0);tt([c()],Z.prototype,"imageSrc",void 0);tt([c()],Z.prototype,"icon",void 0);tt([c()],Z.prototype,"iconSize",void 0);tt([c({type:Boolean})],Z.prototype,"enableGreenCircle",void 0);tt([c({type:Boolean})],Z.prototype,"loading",void 0);tt([c({type:Number})],Z.prototype,"charsStart",void 0);tt([c({type:Number})],Z.prototype,"charsEnd",void 0);Z=tt([k("wui-wallet-switch")],Z);const Za=P`
  :host {
    display: flex;
    align-items: center;
    gap: ${({spacing:t})=>t[1]};
    padding: ${({spacing:t})=>t[2]} ${({spacing:t})=>t[3]}
      ${({spacing:t})=>t[2]} ${({spacing:t})=>t[2]};
    border-radius: ${({borderRadius:t})=>t[20]};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    box-shadow:
      0px 0px 8px 0px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px ${({tokens:t})=>t.theme.borderPrimary};
    max-width: 320px;
  }

  wui-icon-box {
    border-radius: ${({borderRadius:t})=>t.round} !important;
    overflow: hidden;
  }

  wui-loading-spinner {
    padding: ${({spacing:t})=>t[1]};
    background-color: ${({tokens:t})=>t.core.foregroundAccent010};
    border-radius: ${({borderRadius:t})=>t.round} !important;
  }
`;var To=function(t,e,o,i){var n=arguments.length,r=n<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,o):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")r=Reflect.decorate(t,e,o,i);else for(var s=t.length-1;s>=0;s--)(a=t[s])&&(r=(n<3?a(r):n>3?a(e,o,r):a(e,o))||r);return n>3&&r&&Object.defineProperty(e,o,r),r};let fe=class extends _{constructor(){super(...arguments),this.message="",this.variant="success"}render(){return h`
      ${this.templateIcon()}
      <wui-text variant="lg-regular" color="primary" data-testid="wui-snackbar-message"
        >${this.message}</wui-text
      >
    `}templateIcon(){const e={success:"success",error:"error",warning:"warning",info:"default"},o={success:"checkmark",error:"warning",warning:"warningCircle",info:"info"};return this.variant==="loading"?h`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:h`<wui-icon-box
      size="md"
      color=${e[this.variant]}
      icon=${o[this.variant]}
    ></wui-icon-box>`}};fe.styles=[E,Za];To([c()],fe.prototype,"message",void 0);To([c()],fe.prototype,"variant",void 0);fe=To([k("wui-snackbar")],fe);export{Ya as M,I as U,k as a,h as b,P as c,G as d,Zi as e,Xa as f,ts as g,_ as i,c as n,U as o,ci as r,Vo as s,z as v};
