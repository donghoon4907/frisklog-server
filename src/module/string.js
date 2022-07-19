// UTF-8 인코딩 방식 바이트 길이 측정
export const getStrByteUtf8 = function(string, b, i, c) {
  for (
    b = i = 0;
    (c = string.charCodeAt(i++));
    b += c >> 11 ? 3 : c >> 7 ? 2 : 1
  );

  return b;
};

// 한글을 n바이트로 길이 측정
export const getStrBytesCustom = function(string, n) {
  let str;

  let count = 0;

  for (let i = 0; i < string.length; i++) {
    str = string.charAt(i);

    if (encodeURIComponent(str).length > 4) {
      count += n;
    } else {
      count++;
    }
  }

  return count;
};
// n바이트 문자열 생성(문자열: 2바이트)
export const getStrFromByteLen = function(string, n) {
  let str;
  let count = 0;

  let returnValue = "";

  for (let i = 0; i < string.length; i++) {
    str = string.charAt(i);

    if (encodeURIComponent(str).length > 4) {
      count += 2;
    } else {
      count++;
    }

    if (count > n) {
      break;
    }

    returnValue += str;
  }

  return returnValue;
};
