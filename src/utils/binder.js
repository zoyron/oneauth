// Original Gist: https://gist.github.com/anhldbk/782e13de7f79b07e556a029a9ce49fa3

class Binder {}

Binder.getAllMethods = function(instance, cls) {
  return Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
    .filter(name => {
      let method = instance[name];
      return !(!(method instanceof Function) || method === cls);
    });
}

Binder.bind = function(instance, cls) {
  Binder.getAllMethods(instance, cls)
    .forEach(mtd => {
      instance[mtd] = instance[mtd].bind(instance);
    })
}

module.exports = Binder;
