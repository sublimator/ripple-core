'use strict';

function ensureArrayLike(Type, Child, arrayLike) {
  if (arrayLike instanceof Type) {
    return arrayLike;
  }

  const obj = new Type();
  for (let i = 0; i < arrayLike.length; i++) {
    obj.push(Child.from(arrayLike[i]));
  }
  return obj;
}

module.exports = {
  ensureArrayLike
};
