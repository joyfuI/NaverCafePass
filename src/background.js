"use strict";
function referer(details)
{
	const refererUrl = 'https://search.naver.com/?query=a';
	let toggle = true;
	if (filtering(details.url))	// 예외 주소에선 제외
	{
		for (let header of details.requestHeaders)
			if (header.name.toLowerCase() === 'referer')	// 리퍼러가 있으면
			{
				header.value = refererUrl;	// 네이버 검색 페이지로 조작
				toggle = false;
				break;
			}
		if (toggle)	// 리퍼러가 없으면
			details.requestHeaders.push({name: 'Referer', value: refererUrl});	// 리퍼러 추가
	}
	return {requestHeaders: details.requestHeaders};
}
function filtering(str)
{
	let filter = [
		'cafe.naver.com/ArticleList.nhn',	// 게시글 없음 문제 해결
		'cafe.naver.com/ArticlePost.nhn',	// 글 안써지는 문제 해결
		'cafe.naver.com/CommentPost.nhn'	// 댓글 안써지는 문제 해결
	];
	for (let i of filter)
		if (str.indexOf(i) !== -1)
			return false;
	return true;
}

let filter = {urls: ['*://cafe.naver.com/*', '*://m.cafe.naver.com/*']};
let extraInfoSpec = ['blocking', 'requestHeaders'];
if (typeof(browser) === 'undefined')	// 파이어폭스는 browser, chrome 네임스페이스 모두 지원하는데 크롬은 chrome만 지원. 또, 엣지는 browser만 지원
{
	var browser = chrome;
	extraInfoSpec.push('extraHeaders');	// 크롬용 옵션
}
try
{
	browser.webRequest.onBeforeSendHeaders.addListener(referer, filter, extraInfoSpec);
}
catch (e)	// 그지 같은게 extraHeaders가 크롬 72 버전부터 추가된거라 구 크로뮴 엔진을 쓰면 에러 발생ㅡㅡ
{
	extraInfoSpec.pop();
	browser.webRequest.onBeforeSendHeaders.addListener(referer, filter, extraInfoSpec);
}
