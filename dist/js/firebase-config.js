<<<<<<< Updated upstream
// Firebase Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    EmailAuthProvider,
    linkWithCredential,
    GithubAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    initializeFirestore,
    collection,
    addDoc,
    getDocs,
    getDocsFromServer,
    getDoc,
    setDoc,
    onSnapshot,
    updateDoc,
    doc,
    increment,
    serverTimestamp,
    query,
    where,
    orderBy,
    deleteDoc,
    enableIndexedDbPersistence,
    enableNetwork,
    disableNetwork,
    terminate,
    clearIndexedDbPersistence,
    limit,
    getCountFromServer,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCayuSJlVlkRrtNtuglhK0M7aKNxEAp8g0",
    authDomain: "skill-notes.firebaseapp.com",
    projectId: "skill-notes",
    storageBucket: "skill-notes.appspot.com",
    messagingSenderId: "679937247629",
    appId: "1:679937247629:web:708ae9818911a465d455c4",
    measurementId: "G-KSCJTPP875"
};

// Initialize Firebase (Core only)
const app = initializeApp(firebaseConfig);

// Initialize Auth (Required for Auth Listeners)
// We keep this eager to ensure onAuthStateChanged works, but since this script is defer/module, it runs after parsing.
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// EAGER INIT (Standard for shared usage)
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
try {
    enableIndexedDbPersistence(db).catch(err => {
        console.warn("IndexedDB persistence failed (usually multiple tabs open):", err.code);
    });
} catch (e) {}

const storage = getStorage(app);
const functions = getFunctions(app);

// Expose services to window (for legacy compatibility)
window.firebaseServices = {
    // Core
    app,
    auth,
    provider,
    githubProvider,
    db, // Shared Instance
    storage,
    functions,

    // Auth Functions
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail,

    // Firestore Functions
    collection,
    addDoc,
    getDocs,
    getDocsFromServer,
    getDoc,
    setDoc,
    onSnapshot,
    updateDoc,
    doc,
    increment,
    serverTimestamp,
    query,
    where,
    orderBy,
    deleteDoc,
    enableNetwork,
    disableNetwork,
    terminate,
    clearIndexedDbPersistence,
    limit,
    getCountFromServer,
    runTransaction, // Exported correctly

    // Storage Functions
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,

    // Function Utils
    httpsCallable
};

Object.defineProperty(window.firebaseServices, 'functions', {
    get: function () {
        if (!functions) {
            console.log("⚡ Lazy-loading Functions...");
            try {
                functions = getFunctions(app);
            } catch (e) { console.warn("Functions init error", e); }
        }
        return functions;
    }
});


export {
    app,
    auth,
    db,
    storage,
    functions,
    provider,
    githubProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    EmailAuthProvider,
    linkWithCredential,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    limit,
    terminate,
    clearIndexedDbPersistence,
    getDocsFromServer,
    increment
};

// Global exports for inline interactions
window.auth = auth;
window.db = db;
window.doc = doc;
window.getDoc = getDoc;
window.setDoc = setDoc;
window.increment = increment;
=======
const _0x5d6d9b=_0x7cb5;(function(_0x415a2b,_0x3bca18){const _0x1da202=_0x7cb5,_0xfba03d=_0x415a2b();while(!![]){try{const _0x605773=-parseInt(_0x1da202(0x218))/(0x35*-0x69+0xb2a+-0x54a*-0x2)*(-parseInt(_0x1da202(0x1f9))/(0x456+-0x1*0x61b+-0x41*-0x7))+parseInt(_0x1da202(0x234))/(-0x9ff*0x2+-0x29*0x83+-0x1*-0x28fc)*(parseInt(_0x1da202(0x20b))/(-0x637+-0x6bf+-0x16*-0x97))+parseInt(_0x1da202(0x20f))/(0x10*0x4d+0xa37*-0x1+-0x15b*-0x4)*(-parseInt(_0x1da202(0x235))/(-0xc0+-0x11c*-0x17+-0x18be))+-parseInt(_0x1da202(0x222))/(-0x2*-0xbb7+0xcc7+0xb*-0x34a)+-parseInt(_0x1da202(0x205))/(0xe27+-0x1e*-0x141+-0x33bd)*(-parseInt(_0x1da202(0x25b))/(0xb7c+-0xeb*0x13+-0x1a*-0x3b))+-parseInt(_0x1da202(0x1e9))/(-0xc5d+0x981*-0x2+0x1f69)*(-parseInt(_0x1da202(0x214))/(0x62*0x41+-0x1a3*0x4+-0x124b))+-parseInt(_0x1da202(0x1ef))/(-0x5eb+0x5*-0x767+0x2afa*0x1)*(parseInt(_0x1da202(0x227))/(0xd8*-0x20+-0x80*-0x4+-0x1*-0x190d));if(_0x605773===_0x3bca18)break;else _0xfba03d['push'](_0xfba03d['shift']());}catch(_0x3fbc23){_0xfba03d['push'](_0xfba03d['shift']());}}}(_0x908a,-0xdcc4c+-0xd8b5b+0x1126ca*0x2));const _0x27ae41=(function(){let _0x217572=!![];return function(_0x36a3ff,_0xd70dd7){const _0x189d0c=_0x217572?function(){const _0x444cbe=_0x7cb5;if(_0xd70dd7){const _0x3276ff=_0xd70dd7[_0x444cbe(0x1dd)](_0x36a3ff,arguments);return _0xd70dd7=null,_0x3276ff;}}:function(){};return _0x217572=![],_0x189d0c;};}()),_0x3c2586=_0x27ae41(this,function(){const _0x2ebf49=_0x7cb5,_0x3d4834={};_0x3d4834['cjvaI']=_0x2ebf49(0x1f7)+'+$';const _0x1c26fb=_0x3d4834;return _0x3c2586[_0x2ebf49(0x208)]()[_0x2ebf49(0x1e1)](_0x1c26fb[_0x2ebf49(0x219)])[_0x2ebf49(0x208)]()[_0x2ebf49(0x213)+'r'](_0x3c2586)[_0x2ebf49(0x1e1)](_0x1c26fb[_0x2ebf49(0x219)]);});_0x3c2586();const _0x19cbbb=(function(){let _0x56207a=!![];return function(_0x17718f,_0x5c6daf){const _0x4e789a=_0x56207a?function(){const _0x4963c0=_0x7cb5;if(_0x5c6daf){const _0x551721=_0x5c6daf[_0x4963c0(0x1dd)](_0x17718f,arguments);return _0x5c6daf=null,_0x551721;}}:function(){};return _0x56207a=![],_0x4e789a;};}()),_0xeaa4e9=_0x19cbbb(this,function(){const _0x13eaa9=_0x7cb5,_0x2783eb={'mljcZ':function(_0x5e670e,_0x27661b){return _0x5e670e(_0x27661b);},'ZUlXH':'return\x20(fu'+_0x13eaa9(0x1de),'HxPSO':'{}.constru'+_0x13eaa9(0x1eb)+_0x13eaa9(0x216)+'\x20)','DbtHP':function(_0x4b2f86){return _0x4b2f86();},'uSOyZ':'log','EygZZ':_0x13eaa9(0x240),'XGZFk':'info','kPRCf':_0x13eaa9(0x230),'PNuBy':function(_0x1afa12,_0x5579a2){return _0x1afa12===_0x5579a2;},'MPWgj':_0x13eaa9(0x210),'ZiLRp':'ageDJ'},_0x1c7a14=function(){const _0x59d5c4=_0x13eaa9;let _0x588d37;try{_0x588d37=_0x2783eb[_0x59d5c4(0x21a)](Function,_0x2783eb['ZUlXH']+_0x2783eb[_0x59d5c4(0x236)]+');')();}catch(_0xa8b18d){_0x588d37=window;}return _0x588d37;},_0x5ca47d=_0x2783eb['DbtHP'](_0x1c7a14),_0x58cb64=_0x5ca47d[_0x13eaa9(0x20a)]=_0x5ca47d['console']||{},_0xd78ed5=[_0x2783eb['uSOyZ'],_0x2783eb[_0x13eaa9(0x223)],_0x2783eb[_0x13eaa9(0x1f1)],_0x2783eb[_0x13eaa9(0x21b)],'exception','table',_0x13eaa9(0x1ea)];for(let _0x3ecf0c=0x3f1*-0x4+0x31*0x7f+0x1b*-0x51;_0x3ecf0c<_0xd78ed5['length'];_0x3ecf0c++){if(_0x2783eb[_0x13eaa9(0x21f)](_0x2783eb['MPWgj'],_0x2783eb['ZiLRp']))_0x35716f=_0x32afc6;else{const _0x49d1f0=_0x19cbbb[_0x13eaa9(0x213)+'r'][_0x13eaa9(0x21d)][_0x13eaa9(0x252)](_0x19cbbb),_0x46f769=_0xd78ed5[_0x3ecf0c],_0x51387a=_0x58cb64[_0x46f769]||_0x49d1f0;_0x49d1f0[_0x13eaa9(0x231)]=_0x19cbbb[_0x13eaa9(0x252)](_0x19cbbb),_0x49d1f0[_0x13eaa9(0x208)]=_0x51387a[_0x13eaa9(0x208)]['bind'](_0x51387a),_0x58cb64[_0x46f769]=_0x49d1f0;}}});_0xeaa4e9();import{initializeApp}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';import{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signOut,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,setPersistence,browserLocalPersistence,sendPasswordResetEmail,fetchSignInMethodsForEmail,EmailAuthProvider,linkWithCredential,GithubAuthProvider}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';import{getFirestore,initializeFirestore,collection,addDoc,getDocs,getDocsFromServer,getDoc,setDoc,onSnapshot,updateDoc,doc,increment,serverTimestamp,query,where,orderBy,deleteDoc,enableIndexedDbPersistence,enableNetwork,disableNetwork,terminate,clearIndexedDbPersistence,limit,getCountFromServer,runTransaction}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';import{getStorage,ref,uploadBytes,uploadBytesResumable,getDownloadURL,deleteObject,listAll}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';import{getFunctions,httpsCallable}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js';const _0x2a0625={};_0x2a0625[_0x5d6d9b(0x238)]=_0x5d6d9b(0x237)+_0x5d6d9b(0x249)+_0x5d6d9b(0x1f0)+_0x5d6d9b(0x244),_0x2a0625['authDomain']=_0x5d6d9b(0x221)+'s.firebase'+'app.com',_0x2a0625[_0x5d6d9b(0x20c)]=_0x5d6d9b(0x221)+'s',_0x2a0625[_0x5d6d9b(0x1ec)+_0x5d6d9b(0x25a)]=_0x5d6d9b(0x221)+_0x5d6d9b(0x24b)+_0x5d6d9b(0x1e3),_0x2a0625[_0x5d6d9b(0x1ff)+_0x5d6d9b(0x203)]='6799372476'+'29',_0x2a0625['appId']=_0x5d6d9b(0x1e8)+'7629:web:7'+_0x5d6d9b(0x246)+_0x5d6d9b(0x1df)+'4',_0x2a0625[_0x5d6d9b(0x1e2)+_0x5d6d9b(0x22a)]=_0x5d6d9b(0x21e)+'75';function _0x908a(){const _0x453132=['yMLUza','BgLTAxq','CNvUvhjHBNnHyW','ywXqzxjZAxn0zq','sw5KzxHLzercia','rNvUy3rPB25Zia','z2v0rg93BMXVyq','Bg9N','A2v0','ndGWndq3seXWDg1m','D2HLCMu','yxbWBhK','BMn0Aw9UkcKG','mwe0nJvKndu1yW','zNvUy3rPB25Z','C2vHCMnO','BwvHC3vYzw1LBG','y29T','B3jKzxjcEq','BhrPCgXLihrHyG','zvLtrw8','4PQHieXHENKTBg9H','mtO2nZK5mZCYna','mJbVvKzPrK0','DhjHy2u','y3rVCIGICMv0Dq','C3rVCMfNzuj1yW','DxbSB2fKqNL0zq','CuLuu0W','mJCXmdyWoePkt0zJwa','DhvNBgHlme03yq','weDArMS','y29SBgvJDgLVBG','AwrLCG','zxHWzxjPBwvUDa','ueDJBeq','C2LNBKLUv2L0Aa','kcGOlISPkYKRkq','ywXgB3jJzuXVBG','mJjSwLnZzfm','zgLZywjSzu5LDa','DfjLC3vSDa','serIzKK','C2vYDMvYvgLTzq','r0josM0','BwvZC2fNAw5NuW','z2v0rg9JCW','z2v0rg9J','DgvYBwLUyxrL','zw5Kzxjjza','C3n3B3jK','otzvt2jhq0m','CNzPy2vZ','BMrqyxnZD29Yza','Dg9tDhjPBMC','Aw5PDcbLCNjVCG','y29UC29Szq','ne1nBNzrsq','ChjVAMvJDeLK','y3jLyxrLvxnLCG','C2LNBK91Da','mtbTEezOA0K','zuTRwui','sevVuhy','zg9J','y29UC3rYDwn0BW','mtm0nJC2m2DkDu5zuG','D29YAW','CM4GDgHPCYiPka','y2f0y2G','nJKWnJjyCNDty0m','y2P2yuK','BwXQy1O','A1bsq2y','C3rHBxa','ChjVDg90ExbL','rY1lu0nkvfbqoa','ue51qNK','B25tBMfWC2HVDa','C2TPBgWTBM90zq','ntaYmdaYoxDXDM13zG','rxLNwLO','yMXL','z2v0rg9JC0zYBW','B21tzxj2zxi','ntjgB2Hsq2K','z2v0uMvKAxjLyW','rw1HAwXbBMrqyq','DeLK','z2L0AhvIuhjVDG','y29Kzq','z1bVBgXPBMC','Ahr0ChndywXSyq','zwreyLbLCNnPCW','zxjYB3i','x19WCM90B19F','C1jLC3vTywjSzq','AvLzzNG','mtuYnteZnefJv21tCG','mJi5otK4EKnzyu92','shHqu08','quL6yvn5q2f5Dq','yxbPs2v5','Aw5JCMvTzw50','DgLVBG','BMnL','zMLYzwjHC2vtzq','CgvYC2LZDgvUyW','C3rVCMfNzq','zfvsta','D2fYBG','yNjVD3nLCKXVyW','yxbW','CgnRuKm','s054rufWogCW','ug9WDxa','mdHHztK4mtG5mq','zw5HyMXLtMv0DW','ywrKrg9J','u0PSvMXRuNj0tG','zgvSzxrLt2jQzq','CY5HChbZCg90lG','v2L0AevTywLSqq','C2v0rg9J','zsbMywLSzwqGka','CMvM','z2v0q291BNrgCG','uMvKAxjLy3q'];_0x908a=function(){return _0x453132;};return _0x908a();}const firebaseConfig=_0x2a0625,app=initializeApp(firebaseConfig),auth=getAuth(app),provider=new GoogleAuthProvider(),githubProvider=new GithubAuthProvider(),_0x33be49={};_0x33be49[_0x5d6d9b(0x1f4)+_0x5d6d9b(0x1f8)+_0x5d6d9b(0x22d)]=!![];const db=initializeFirestore(app,_0x33be49);function _0x7cb5(_0x4d83b0,_0x12f822){_0x4d83b0=_0x4d83b0-(-0x7b5*-0x1+-0x1703+0x1*0x112b);const _0x4f6cd9=_0x908a();let _0x33b7ee=_0x4f6cd9[_0x4d83b0];if(_0x7cb5['rAPtcN']===undefined){var _0x3aeb97=function(_0x16dd38){const _0x309f88='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x4a8b53='',_0xb70b97='',_0x285e37=_0x4a8b53+_0x3aeb97;for(let _0x3ba09=0xa35+-0x690+0x1*-0x3a5,_0x3742d4,_0x154051,_0x1556e7=0xf43*0x1+0x2*-0x12a7+0x273*0x9;_0x154051=_0x16dd38['charAt'](_0x1556e7++);~_0x154051&&(_0x3742d4=_0x3ba09%(0x1ece+0x1676+-0x3540)?_0x3742d4*(-0x1495+-0x2636+0x3b0b)+_0x154051:_0x154051,_0x3ba09++%(-0x7*-0x232+0x1f4c+0x1*-0x2ea6))?_0x4a8b53+=_0x285e37['charCodeAt'](_0x1556e7+(0xf02*0x1+-0x935*0x1+-0x5c3))-(-0x5c4+0x6*-0x14+0x646*0x1)!==-0xce*0x2d+0x1bce*-0x1+0x1e2*0x22?String['fromCharCode'](0xc8c+-0x15b4+-0x17*-0x71&_0x3742d4>>(-(0x244b+0x11*0x1c9+0x2*-0x2151)*_0x3ba09&-0x26*0xb6+0x2063+-0x1*0x559)):_0x3ba09:-0x19d*0xd+0x13*0x47+0xfb4){_0x154051=_0x309f88['indexOf'](_0x154051);}for(let _0x43003f=-0x1c6*0x15+-0x10b+0x1b*0x16b,_0x20f0c0=_0x4a8b53['length'];_0x43003f<_0x20f0c0;_0x43003f++){_0xb70b97+='%'+('00'+_0x4a8b53['charCodeAt'](_0x43003f)['toString'](-0x4d5*0x7+-0x7*-0x1b1+0x160c))['slice'](-(0x1b4c+0x26*0x5c+0x1479*-0x2));}return decodeURIComponent(_0xb70b97);};_0x7cb5['ZPOkEj']=_0x3aeb97,_0x7cb5['WkhlBo']={},_0x7cb5['rAPtcN']=!![];}const _0x328db9=_0x4f6cd9[-0x1*-0x9dc+0x4e*-0x20+-0x1c],_0x47e99a=_0x4d83b0+_0x328db9,_0x418609=_0x7cb5['WkhlBo'][_0x47e99a];if(!_0x418609){const _0x10d356=function(_0x168c6b){this['wDLWRi']=_0x168c6b,this['nVOySz']=[-0x169f*0x1+0x1a7f+0x3df*-0x1,-0x6c5+0x2073+0x26*-0xad,0x2600+0x1*0x1903+-0x11b*0x39],this['qCNkLP']=function(){return'newState';},this['bYDkqn']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['nlZSPP']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x10d356['prototype']['iLUxdW']=function(){const _0x58d71a=new RegExp(this['bYDkqn']+this['nlZSPP']),_0x5ac1be=_0x58d71a['test'](this['qCNkLP']['toString']())?--this['nVOySz'][-0xac5+0x14e9+-0xad*0xf]:--this['nVOySz'][0x2490+0x2df+-0x276f];return this['PbpWIN'](_0x5ac1be);},_0x10d356['prototype']['PbpWIN']=function(_0x5405a7){if(!Boolean(~_0x5405a7))return _0x5405a7;return this['LsrIUF'](this['wDLWRi']);},_0x10d356['prototype']['LsrIUF']=function(_0x4bf6ed){for(let _0x521476=0x4fe+0x741*0x2+-0x6*0x340,_0x4dba03=this['nVOySz']['length'];_0x521476<_0x4dba03;_0x521476++){this['nVOySz']['push'](Math['round'](Math['random']())),_0x4dba03=this['nVOySz']['length'];}return _0x4bf6ed(this['nVOySz'][0x1*0x1655+-0x1b14+0x4bf]);},new _0x10d356(_0x7cb5)['iLUxdW'](),_0x33b7ee=_0x7cb5['ZPOkEj'](_0x33b7ee),_0x7cb5['WkhlBo'][_0x47e99a]=_0x33b7ee;}else _0x33b7ee=_0x418609;return _0x33b7ee;}try{enableIndexedDbPersistence(db)[_0x5d6d9b(0x217)](_0x309f9c=>{const _0x4bc98c=_0x5d6d9b,_0xcf2129={};_0xcf2129[_0x4bc98c(0x1f5)]=_0x4bc98c(0x256)+_0x4bc98c(0x23d)+_0x4bc98c(0x24e)+'usually\x20mu'+_0x4bc98c(0x1e5)+'s\x20open):';const _0x577d10=_0xcf2129;console[_0x4bc98c(0x240)](_0x577d10[_0x4bc98c(0x1f5)],_0x309f9c[_0x4bc98c(0x22c)]);});}catch(_0x6c5e63){}const storage=getStorage(app),functions=getFunctions(app),_0x26d6c4={};_0x26d6c4[_0x5d6d9b(0x242)]=app,_0x26d6c4['auth']=auth,_0x26d6c4['provider']=provider,_0x26d6c4[_0x5d6d9b(0x22b)+_0x5d6d9b(0x1f3)]=githubProvider,_0x26d6c4['db']=db,_0x26d6c4[_0x5d6d9b(0x23e)]=storage,_0x26d6c4[_0x5d6d9b(0x1e0)]=functions,_0x26d6c4['signInWith'+_0x5d6d9b(0x245)]=signInWithPopup,_0x26d6c4['signInWith'+_0x5d6d9b(0x251)]=signInWithRedirect,_0x26d6c4[_0x5d6d9b(0x228)+_0x5d6d9b(0x1fb)]=getRedirectResult,_0x26d6c4[_0x5d6d9b(0x20e)]=signOut,_0x26d6c4['onAuthStat'+'eChanged']=onAuthStateChanged,_0x26d6c4[_0x5d6d9b(0x1f6)+_0x5d6d9b(0x229)+_0x5d6d9b(0x204)]=signInWithEmailAndPassword,_0x26d6c4[_0x5d6d9b(0x20d)+_0x5d6d9b(0x24c)+_0x5d6d9b(0x207)]=createUserWithEmailAndPassword,_0x26d6c4['setPersist'+'ence']=setPersistence,_0x26d6c4[_0x5d6d9b(0x241)+_0x5d6d9b(0x255)+_0x5d6d9b(0x23b)]=browserLocalPersistence,_0x26d6c4['sendPasswo'+'rdResetEma'+'il']=sendPasswordResetEmail,_0x26d6c4[_0x5d6d9b(0x1f2)]=collection,_0x26d6c4[_0x5d6d9b(0x248)]=addDoc,_0x26d6c4[_0x5d6d9b(0x200)]=getDocs,_0x26d6c4[_0x5d6d9b(0x225)+'mServer']=getDocsFromServer,_0x26d6c4[_0x5d6d9b(0x201)]=getDoc,_0x26d6c4['setDoc']=setDoc,_0x26d6c4[_0x5d6d9b(0x220)]=onSnapshot,_0x26d6c4['updateDoc']=updateDoc,_0x26d6c4[_0x5d6d9b(0x212)]=doc,_0x26d6c4['increment']=increment,_0x26d6c4[_0x5d6d9b(0x1fd)+_0x5d6d9b(0x21c)]=serverTimestamp,_0x26d6c4['query']=query,_0x26d6c4[_0x5d6d9b(0x25c)]=where,_0x26d6c4[_0x5d6d9b(0x1e4)]=orderBy,_0x26d6c4['deleteDoc']=deleteDoc,_0x26d6c4[_0x5d6d9b(0x247)+'ork']=enableNetwork,_0x26d6c4[_0x5d6d9b(0x1fa)+_0x5d6d9b(0x215)]=disableNetwork,_0x26d6c4[_0x5d6d9b(0x202)]=terminate,_0x26d6c4['clearIndex'+_0x5d6d9b(0x22f)+'tence']=clearIndexedDbPersistence,_0x26d6c4[_0x5d6d9b(0x253)]=limit,_0x26d6c4[_0x5d6d9b(0x250)+_0x5d6d9b(0x226)]=getCountFromServer,_0x26d6c4[_0x5d6d9b(0x254)+_0x5d6d9b(0x23a)]=runTransaction,_0x26d6c4[_0x5d6d9b(0x24f)]=ref,_0x26d6c4[_0x5d6d9b(0x1ed)+'s']=uploadBytes,_0x26d6c4['uploadByte'+_0x5d6d9b(0x232)]=uploadBytesResumable,_0x26d6c4[_0x5d6d9b(0x258)+_0x5d6d9b(0x23f)]=getDownloadURL,_0x26d6c4[_0x5d6d9b(0x24a)+'ct']=deleteObject,_0x26d6c4['listAll']=listAll,_0x26d6c4[_0x5d6d9b(0x22e)+_0x5d6d9b(0x224)]=httpsCallable,window[_0x5d6d9b(0x23c)+'rvices']=_0x26d6c4,Object['defineProp'+'erty'](window[_0x5d6d9b(0x23c)+_0x5d6d9b(0x206)],_0x5d6d9b(0x1e0),{'get':function(){const _0x25b066=_0x5d6d9b,_0x3274c8={'iYYfx':_0x25b066(0x1e7)+'ding\x20Funct'+'ions...','HDbfI':function(_0x220953,_0x46e758){return _0x220953(_0x46e758);},'eYSEo':function(_0x18f02e,_0x26cae6){return _0x18f02e===_0x26cae6;},'qITSL':_0x25b066(0x1fe),'HEoPv':_0x25b066(0x257)+_0x25b066(0x209)};if(!functions){if(_0x3274c8[_0x25b066(0x1e6)](_0x25b066(0x243),_0x3274c8[_0x25b066(0x1ee)])){if(!_0x1cd4c9){_0xe540af[_0x25b066(0x259)](_0x3274c8[_0x25b066(0x233)]);try{_0x2e69ef=_0x3274c8[_0x25b066(0x1fc)](_0x457633,_0x1416f7);}catch(_0x12b1cf){_0x473842[_0x25b066(0x240)](_0x25b066(0x257)+_0x25b066(0x209),_0x12b1cf);}}return _0x34742b;}else{console[_0x25b066(0x259)](_0x3274c8[_0x25b066(0x233)]);try{functions=_0x3274c8[_0x25b066(0x1fc)](getFunctions,app);}catch(_0x14da3f){console[_0x25b066(0x240)](_0x3274c8[_0x25b066(0x211)],_0x14da3f);}}}return functions;}});export{app,auth,db,storage,functions,provider,githubProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signOut,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,setPersistence,browserLocalPersistence,sendPasswordResetEmail,fetchSignInMethodsForEmail,EmailAuthProvider,linkWithCredential,doc,getDoc,setDoc,updateDoc,serverTimestamp,collection,query,where,getDocs,onSnapshot,limit,terminate,clearIndexedDbPersistence,getDocsFromServer,increment};window['auth']=auth,window['db']=db,window['doc']=doc,window[_0x5d6d9b(0x201)]=getDoc,window[_0x5d6d9b(0x24d)]=setDoc,window[_0x5d6d9b(0x239)]=increment;
>>>>>>> Stashed changes
