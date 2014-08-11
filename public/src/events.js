var EventEmitter = {
  events: {},
  on(event, cb) {
    this.events[event] || (this.events[event] = []);
    this.events[event].push(cb);
    return this;
  },
  off(event, cb) {
    if (!cb)
      return this.events[event] = []

    var index = this.events[event].indexOf(cb);
    if (index > -1)
      this.events[event].splice(index, 1);
    return this;
  },
  emit(event, ...args) {
    (this.events[event] || []).forEach(cb => cb.apply(this, args));
    return this;
  }
};
