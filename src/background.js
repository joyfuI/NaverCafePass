"use strict";

function referer(details)
{
	let toggle = true;
	for (let header of details.requestHeaders)
		if (header.name.toLowerCase() === 'referer')	// 리퍼러가 있으면
		{
			if (header.value.indexOf('cafe.naver.com') == -1)	// 카페 내부가 아니면
				header.value = 'https://search.naver.com/';	// 네이버 검색 페이지로 조작
			toggle = false;
			break;
		}
	if (toggle)	// 리퍼러가 없으면
		details.requestHeaders.push({name: 'Referer', value: 'https://search.naver.com/'});	// 리퍼러 추가
	return {requestHeaders: details.requestHeaders};
}

let extraInfoSpec = ['blocking', 'requestHeaders'];
if (typeof(browser) == 'undefined')	// 파이어폭스는 browser, chrome 네임스페이스 모두 지원하는데 크롬은 chrome만 지원. 또, 엣지는 browser만 지원
{
	var browser = chrome;
	extraInfoSpec.push('extraHeaders');	// 크롬용 옵션
}
try
{
	browser.webRequest.onBeforeSendHeaders.addListener(referer, {
		urls: ['*://cafe.naver.com/*']
	}, extraInfoSpec);
}
catch (e)	// 그지 같은게 extraHeaders가 크롬 72 버전부터 추가된거라 구 크로뮴 엔진을 쓰면 에러 발생ㅡㅡ
{
	extraInfoSpec.pop();
	browser.webRequest.onBeforeSendHeaders.addListener(referer, {
		urls: ['*://cafe.naver.com/*']
	}, extraInfoSpec);
}
