const codeList = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const base = codeList.length;

// convert base 10 number to base codeList.length number

function createCode(num) {

  let result = "";
  do {
    let remainder = num % base;
    result += codeList[remainder];
    num = (num - remainder) / base;
  } while (num > 0);

  // continue doing that until integer reaches 0;
  return result.split('').reverse().join('');
}

module.exports = {create: createCode};