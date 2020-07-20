"use strict";
function referer(details) {
	const refererUrl = 'https://search.naver.com/?&query=.';	// 모바일 페이지에선 query 매개변수 필요

	if ((/(cafe.naver.com\/.+\/\d+)|(m.cafe.naver.com\/ArticleRead.nhn.+articleid.+)/).test(details.url)) {	// 게시글 주소에서만 작동
		let toggle = true;
		for (let header of details.requestHeaders) {
			if (header.name.toLowerCase() === 'referer') {	// 리퍼러가 있으면
				header.value = refererUrl;	// 네이버 검색 페이지로 조작
				toggle = false;
				break;
			}
		}
		if (toggle) {	// 리퍼러가 없으면
			details.requestHeaders.push({ name: 'Referer', value: refererUrl });	// 리퍼러 추가
		}
	}
	return { requestHeaders: details.requestHeaders };
}

function replace(details) {
	if (details.type != 'main_frame') {	// 프레임 내부에선 작동 안하도록
		return;
	}

	let clubid = details.url.match(/clubid=(\d+)/)[1];
	let articleid = details.url.match(/articleid=(\d+)/)[1];
	let cafeName;
/* 크롬은 async을 쓰면 안됨. 파이어폭스에서만 정상 작동
	let response = await fetch(`https://cafe.naver.com/MyCafeMain.nhn?clubid=${clubid}`);
	if (response.status === 200) {
		let { value: chunk, done: readerDone } = await response.body.getReader().read();
		let str = new TextDecoder('euc-kr').decode(chunk);
		cafeName = str.match(/var g_sCafeHome = \"https:\/\/cafe.naver.com\/\" \+ \"(.+)\"/)[1];	// 카페 이름 추출
	} else {
		return;
	}
*/
	let xhr = new XMLHttpRequest();
	xhr.open('GET', `https://cafe.naver.com/MyCafeMain.nhn?clubid=${clubid}`, false);
	xhr.send(null);
	if (xhr.status === 200) {
		cafeName = xhr.responseText.match(/var g_sCafeHome = \"https:\/\/cafe.naver.com\/\" \+ \"(.+)\"/)[1];	// 카페 이름 추출
	} else {
		return;
	}
/*
	if (details.type == 'sub_frame') {
		if (details.originUrl.indexOf('ArticleList.nhn') != -1) {
			let xhr = new XMLHttpRequest();
			xhr.open('GET', 'https://cafe.naver.com/' + cafeName + '/' + articleid, false);
			xhr.send(null);
			if (xhr.status === 200) {
				let sc = xhr.responseText.match(/\$\(\"cafe_main\"\)\.src = \"(.+)\";/)[1];
				console.log(sc)
				return { redirectUrl: 'https:' + sc };
			}
		}
		return;
	}
*/
	return { redirectUrl: `https://cafe.naver.com/${cafeName}/${articleid}` };
}

let extraInfoSpec = ['blocking', 'requestHeaders'];
if (typeof(browser) === 'undefined') {	// 파이어폭스는 browser, chrome 네임스페이스 모두 지원하는데 크롬은 chrome만 지원. 또, 엣지는 browser만 지원
	var browser = chrome;
	extraInfoSpec.push('extraHeaders');	// 크롬용 옵션
}

let filter = { urls: ['*://cafe.naver.com/*', '*://m.cafe.naver.com/*'] };
try {
	browser.webRequest.onBeforeSendHeaders.addListener(referer, filter, extraInfoSpec);
} catch (e) {	// extraHeaders가 크롬 72 버전부터 추가된거라 구 크로뮴 엔진을 쓰면 에러 발생ㅡㅡ
	extraInfoSpec.pop();
	browser.webRequest.onBeforeSendHeaders.addListener(referer, filter, extraInfoSpec);
}

browser.webRequest.onBeforeRequest.addListener(replace, {
	urls: ['*://cafe.naver.com/ArticleRead.nhn*articleid*', '*://cafe.naver.com/ca-fe/ArticleRead.nhn*articleid*']
}, ['blocking']);
